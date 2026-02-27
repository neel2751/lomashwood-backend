import supertest from 'supertest';
import { createApp } from '../../src/app';
import { prisma } from '../../src/infrastructure/db/prisma.client';
import { redis } from '../../src/infrastructure/cache/redis.client';
import { generateAdminToken, generateUserToken } from '../../src/tests-helpers/factories';
import { appointmentFixtures } from '../fixtures/appointments.fixture';
import { consultantFixtures } from '../fixtures/consultants.fixture';
import { timeSlotFixtures } from '../fixtures/time-slots.fixture';

const app = createApp();
const request = supertest(app);

let adminToken: string;
let userToken: string;
let consultantId: string;
let timeSlotId: string;
let appointmentId: string;

beforeAll(async () => {
  await prisma.$connect();
  adminToken = await generateAdminToken();
  userToken = await generateUserToken();

  const consultant = await prisma.consultant.create({ data: consultantFixtures.active() });
  consultantId = consultant.id;

  const timeSlot = await prisma.timeSlot.create({
    data: timeSlotFixtures.available({ consultantId }),
  });
  timeSlotId = timeSlot.id;
});

afterAll(async () => {
  await prisma.appointment.deleteMany();
  await prisma.timeSlot.deleteMany();
  await prisma.consultant.deleteMany();
  await prisma.$disconnect();
  await redis.quit();
});

describe('POST /v1/appointments', () => {
  it('should create a home measurement appointment', async () => {
    const payload = appointmentFixtures.createHomeAppointment({ consultantId, timeSlotId });

    const res = await request
      .post('/v1/appointments')
      .set('Authorization', `Bearer ${userToken}`)
      .send(payload);

    expect(res.status).toBe(201);
    expect(res.body.data).toMatchObject({
      type: 'HOME_MEASUREMENT',
      status: 'PENDING',
    });
    appointmentId = res.body.data.id;
  });

  it('should create an online appointment', async () => {
    const slot = await prisma.timeSlot.create({
      data: timeSlotFixtures.available({ consultantId }),
    });

    const payload = appointmentFixtures.createOnlineAppointment({ consultantId, timeSlotId: slot.id });

    const res = await request
      .post('/v1/appointments')
      .set('Authorization', `Bearer ${userToken}`)
      .send(payload);

    expect(res.status).toBe(201);
    expect(res.body.data.type).toBe('ONLINE');
  });

  it('should create a showroom appointment', async () => {
    const slot = await prisma.timeSlot.create({
      data: timeSlotFixtures.available({ consultantId }),
    });

    const payload = appointmentFixtures.createShowroomAppointment({ consultantId, timeSlotId: slot.id });

    const res = await request
      .post('/v1/appointments')
      .set('Authorization', `Bearer ${userToken}`)
      .send(payload);

    expect(res.status).toBe(201);
    expect(res.body.data.type).toBe('SHOWROOM');
  });

  it('should return 400 when required fields are missing', async () => {
    const res = await request
      .post('/v1/appointments')
      .set('Authorization', `Bearer ${userToken}`)
      .send({ type: 'HOME_MEASUREMENT' });

    expect(res.status).toBe(400);
    expect(res.body.errors).toBeDefined();
  });

  it('should return 401 when not authenticated', async () => {
    const payload = appointmentFixtures.createHomeAppointment({ consultantId, timeSlotId });

    const res = await request.post('/v1/appointments').send(payload);

    expect(res.status).toBe(401);
  });

  it('should return 409 when time slot is already booked', async () => {
    const payload = appointmentFixtures.createHomeAppointment({ consultantId, timeSlotId });

    const res = await request
      .post('/v1/appointments')
      .set('Authorization', `Bearer ${userToken}`)
      .send(payload);

    expect(res.status).toBe(409);
    expect(res.body.message).toMatch(/slot/i);
  });

  it('should send email when appointment is for both kitchen and bedroom', async () => {
    const slot = await prisma.timeSlot.create({
      data: timeSlotFixtures.available({ consultantId }),
    });

    const payload = appointmentFixtures.createHomeAppointment({
      consultantId,
      timeSlotId: slot.id,
      forKitchen: true,
      forBedroom: true,
    });

    const res = await request
      .post('/v1/appointments')
      .set('Authorization', `Bearer ${userToken}`)
      .send(payload);

    expect(res.status).toBe(201);
    expect(res.body.data.forKitchen).toBe(true);
    expect(res.body.data.forBedroom).toBe(true);
  });
});

describe('GET /v1/appointments', () => {
  it('should return paginated appointments for admin', async () => {
    const res = await request
      .get('/v1/appointments')
      .set('Authorization', `Bearer ${adminToken}`)
      .query({ page: 1, limit: 10 });

    expect(res.status).toBe(200);
    expect(res.body.data).toBeInstanceOf(Array);
    expect(res.body.meta).toMatchObject({ page: 1, limit: 10 });
  });

  it('should return 403 for non-admin users', async () => {
    const res = await request
      .get('/v1/appointments')
      .set('Authorization', `Bearer ${userToken}`);

    expect(res.status).toBe(403);
  });

  it('should filter appointments by status', async () => {
    const res = await request
      .get('/v1/appointments')
      .set('Authorization', `Bearer ${adminToken}`)
      .query({ status: 'PENDING' });

    expect(res.status).toBe(200);
    res.body.data.forEach((a: any) => {
      expect(a.status).toBe('PENDING');
    });
  });

  it('should filter appointments by type', async () => {
    const res = await request
      .get('/v1/appointments')
      .set('Authorization', `Bearer ${adminToken}`)
      .query({ type: 'HOME_MEASUREMENT' });

    expect(res.status).toBe(200);
    res.body.data.forEach((a: any) => {
      expect(a.type).toBe('HOME_MEASUREMENT');
    });
  });
});

describe('GET /v1/appointments/:id', () => {
  it('should return appointment by id for admin', async () => {
    const res = await request
      .get(`/v1/appointments/${appointmentId}`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.id).toBe(appointmentId);
  });

  it('should return appointment by id for the owning user', async () => {
    const res = await request
      .get(`/v1/appointments/${appointmentId}`)
      .set('Authorization', `Bearer ${userToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.id).toBe(appointmentId);
  });

  it('should return 404 for non-existent appointment', async () => {
    const res = await request
      .get('/v1/appointments/nonexistent-id')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(404);
  });
});

describe('PATCH /v1/appointments/:id', () => {
  it('should update appointment status to CONFIRMED by admin', async () => {
    const res = await request
      .patch(`/v1/appointments/${appointmentId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ status: 'CONFIRMED' });

    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe('CONFIRMED');
  });

  it('should return 403 when non-admin tries to update status', async () => {
    const res = await request
      .patch(`/v1/appointments/${appointmentId}`)
      .set('Authorization', `Bearer ${userToken}`)
      .send({ status: 'CANCELLED' });

    expect(res.status).toBe(403);
  });

  it('should return 400 for invalid status transition', async () => {
    const res = await request
      .patch(`/v1/appointments/${appointmentId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ status: 'PENDING' });

    expect(res.status).toBe(400);
  });
});

describe('DELETE /v1/appointments/:id', () => {
  it('should soft delete appointment by admin', async () => {
    const slot = await prisma.timeSlot.create({
      data: timeSlotFixtures.available({ consultantId }),
    });

    const appt = await prisma.appointment.create({
      data: appointmentFixtures.raw({ consultantId, timeSlotId: slot.id }),
    });

    const res = await request
      .delete(`/v1/appointments/${appt.id}`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.deletedAt).not.toBeNull();
  });

  it('should return 403 for non-admin delete attempt', async () => {
    const res = await request
      .delete(`/v1/appointments/${appointmentId}`)
      .set('Authorization', `Bearer ${userToken}`);

    expect(res.status).toBe(403);
  });
});