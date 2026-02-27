import supertest from 'supertest';
import { createApp } from '../../src/app';
import { prisma } from '../../src/infrastructure/db/prisma.client';
import { redis } from '../../src/infrastructure/cache/redis.client';
import { generateAdminToken, generateUserToken } from '../../src/tests-helpers/factories';
import { bookingsFixture } from '../fixtures/bookings.fixture';
import { consultantFixtures } from '../fixtures/consultants.fixture';
import { timeSlotFixtures } from '../fixtures/time-slots.fixture';

const app = createApp();
const request = supertest(app);

let adminToken: string;
let userToken: string;
let consultantId: string;
let bookingId: string;

beforeAll(async () => {
  await prisma.$connect();
  adminToken = await generateAdminToken();
  userToken = await generateUserToken();

  const consultant = await prisma.consultant.create({ data: consultantFixtures.active() });
  consultantId = consultant.id;
});

afterAll(async () => {
  await prisma.booking.deleteMany();
  await prisma.timeSlot.deleteMany();
  await prisma.consultant.deleteMany();
  await prisma.$disconnect();
  await redis.quit();
});

describe('POST /v1/bookings', () => {
  it('should create a booking with customer details', async () => {
    const slot = await prisma.timeSlot.create({
      data: timeSlotFixtures.available({ consultantId }),
    });

    const payload = bookingsFixture.createPayload({
      timeSlotId: slot.id,
      forKitchen: true,
      forBedroom: false,
    });

    const res = await request
      .post('/v1/bookings')
      .set('Authorization', `Bearer ${userToken}`)
      .send(payload);

    expect(res.status).toBe(201);
    expect(res.body.data).toMatchObject({
      status: 'PENDING',
      forKitchen: true,
      forBedroom: false,
    });
    bookingId = res.body.data.id;
  });

  it('should create a booking for both kitchen and bedroom', async () => {
    const slot = await prisma.timeSlot.create({
      data: timeSlotFixtures.available({ consultantId }),
    });

    const payload = bookingsFixture.createPayload({
      timeSlotId: slot.id,
      forKitchen: true,
      forBedroom: true,
    });

    const res = await request
      .post('/v1/bookings')
      .set('Authorization', `Bearer ${userToken}`)
      .send(payload);

    expect(res.status).toBe(201);
    expect(res.body.data.forKitchen).toBe(true);
    expect(res.body.data.forBedroom).toBe(true);
  });

  it('should return 400 when time slot is already booked', async () => {
    const slot = await prisma.timeSlot.create({
      data: timeSlotFixtures.booked({ consultantId }),
    });

    const payload = bookingsFixture.createPayload({ timeSlotId: slot.id });

    const res = await request
      .post('/v1/bookings')
      .set('Authorization', `Bearer ${userToken}`)
      .send(payload);

    expect(res.status).toBe(409);
  });

  it('should return 400 when customer phone is missing', async () => {
    const slot = await prisma.timeSlot.create({
      data: timeSlotFixtures.available({ consultantId }),
    });

    const payload = bookingsFixture.createPayload({ timeSlotId: slot.id });
    delete (payload as any).customerPhone;

    const res = await request
      .post('/v1/bookings')
      .set('Authorization', `Bearer ${userToken}`)
      .send(payload);

    expect(res.status).toBe(400);
  });

  it('should return 400 when customer email is invalid', async () => {
    const slot = await prisma.timeSlot.create({
      data: timeSlotFixtures.available({ consultantId }),
    });

    const payload = bookingsFixture.createPayload({
      timeSlotId: slot.id,
      customerEmail: 'not-an-email',
    });

    const res = await request
      .post('/v1/bookings')
      .set('Authorization', `Bearer ${userToken}`)
      .send(payload);

    expect(res.status).toBe(400);
  });

  it('should return 400 when neither kitchen nor bedroom selected', async () => {
    const slot = await prisma.timeSlot.create({
      data: timeSlotFixtures.available({ consultantId }),
    });

    const payload = bookingsFixture.createPayload({
      timeSlotId: slot.id,
      forKitchen: false,
      forBedroom: false,
    });

    const res = await request
      .post('/v1/bookings')
      .set('Authorization', `Bearer ${userToken}`)
      .send(payload);

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/kitchen|bedroom/i);
  });

  it('should return 401 for unauthenticated booking', async () => {
    const slot = await prisma.timeSlot.create({
      data: timeSlotFixtures.available({ consultantId }),
    });

    const res = await request
      .post('/v1/bookings')
      .send(bookingsFixture.createPayload({ timeSlotId: slot.id }));

    expect(res.status).toBe(401);
  });
});

describe('GET /v1/bookings', () => {
  it('should return paginated bookings list for admin', async () => {
    const res = await request
      .get('/v1/bookings')
      .set('Authorization', `Bearer ${adminToken}`)
      .query({ page: 1, limit: 10 });

    expect(res.status).toBe(200);
    expect(res.body.data).toBeInstanceOf(Array);
    expect(res.body.meta).toMatchObject({ page: 1, limit: 10 });
  });

  it('should filter by status', async () => {
    const res = await request
      .get('/v1/bookings')
      .set('Authorization', `Bearer ${adminToken}`)
      .query({ status: 'PENDING' });

    expect(res.status).toBe(200);
    res.body.data.forEach((b: any) => {
      expect(b.status).toBe('PENDING');
    });
  });

  it('should filter by forKitchen', async () => {
    const res = await request
      .get('/v1/bookings')
      .set('Authorization', `Bearer ${adminToken}`)
      .query({ forKitchen: true });

    expect(res.status).toBe(200);
    res.body.data.forEach((b: any) => {
      expect(b.forKitchen).toBe(true);
    });
  });

  it('should return 403 for non-admin listing all bookings', async () => {
    const res = await request
      .get('/v1/bookings')
      .set('Authorization', `Bearer ${userToken}`);

    expect(res.status).toBe(403);
  });

  it('should return user own bookings at /my-bookings', async () => {
    const res = await request
      .get('/v1/bookings/my-bookings')
      .set('Authorization', `Bearer ${userToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data).toBeInstanceOf(Array);
  });
});

describe('GET /v1/bookings/:id', () => {
  it('should return booking by id for admin', async () => {
    const res = await request
      .get(`/v1/bookings/${bookingId}`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.id).toBe(bookingId);
  });

  it('should return booking for the owning user', async () => {
    const res = await request
      .get(`/v1/bookings/${bookingId}`)
      .set('Authorization', `Bearer ${userToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.id).toBe(bookingId);
  });

  it('should return 404 for non-existent booking', async () => {
    const res = await request
      .get('/v1/bookings/nonexistent-id')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(404);
  });
});

describe('PATCH /v1/bookings/:id/status', () => {
  it('should confirm a booking', async () => {
    const res = await request
      .patch(`/v1/bookings/${bookingId}/status`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ status: 'CONFIRMED' });

    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe('CONFIRMED');
  });

  it('should cancel a booking', async () => {
    const slot = await prisma.timeSlot.create({
      data: timeSlotFixtures.available({ consultantId }),
    });

    const booking = await prisma.booking.create({
      data: bookingsFixture.raw({ timeSlotId: slot.id }),
    });

    const res = await request
      .patch(`/v1/bookings/${booking.id}/status`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ status: 'CANCELLED', cancellationReason: 'No show' });

    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe('CANCELLED');
  });

  it('should return 400 for invalid status', async () => {
    const res = await request
      .patch(`/v1/bookings/${bookingId}/status`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ status: 'INVALID_STATUS' });

    expect(res.status).toBe(400);
  });

  it('should return 403 for non-admin status update', async () => {
    const res = await request
      .patch(`/v1/bookings/${bookingId}/status`)
      .set('Authorization', `Bearer ${userToken}`)
      .send({ status: 'CONFIRMED' });

    expect(res.status).toBe(403);
  });
  
});