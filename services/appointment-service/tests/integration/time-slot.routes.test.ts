import supertest from 'supertest';
import { createApp } from '../../src/app';
import { prisma } from '../../src/infrastructure/db/prisma.client';
import { redis } from '../../src/infrastructure/cache/redis.client';
import { generateAdminToken, generateUserToken } from '../../src/tests-helpers/factories';
import { consultantFixtures } from '../fixtures/consultants.fixture';
import { timeSlotFixtures } from '../fixtures/time-slots.fixture';

const app = createApp();
const request = supertest(app);

let adminToken: string;
let userToken: string;
let consultantId: string;
let timeSlotId: string;

beforeAll(async () => {
  await prisma.$connect();
  adminToken = await generateAdminToken();
  userToken = await generateUserToken();

  const consultant = await prisma.consultant.create({ data: consultantFixtures.active() });
  consultantId = consultant.id;
});

afterAll(async () => {
  await prisma.timeSlot.deleteMany();
  await prisma.consultant.deleteMany();
  await prisma.$disconnect();
  await redis.quit();
});

describe('POST /v1/time-slots', () => {
  it('should create a new time slot for a consultant', async () => {
    const payload = timeSlotFixtures.createPayload({ consultantId });

    const res = await request
      .post('/v1/time-slots')
      .set('Authorization', `Bearer ${adminToken}`)
      .send(payload);

    expect(res.status).toBe(201);
    expect(res.body.data).toMatchObject({
      consultantId,
      isAvailable: true,
    });
    timeSlotId = res.body.data.id;
  });

  it('should return 400 for overlapping time slots', async () => {
    const payload = timeSlotFixtures.createPayload({ consultantId });

    const res = await request
      .post('/v1/time-slots')
      .set('Authorization', `Bearer ${adminToken}`)
      .send(payload);

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/overlap/i);
  });

  it('should return 400 for past date/time', async () => {
    const payload = timeSlotFixtures.createPast({ consultantId });

    const res = await request
      .post('/v1/time-slots')
      .set('Authorization', `Bearer ${adminToken}`)
      .send(payload);

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/past/i);
  });

  it('should return 400 when required fields are missing', async () => {
    const res = await request
      .post('/v1/time-slots')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ consultantId });

    expect(res.status).toBe(400);
  });

  it('should return 403 for non-admin', async () => {
    const res = await request
      .post('/v1/time-slots')
      .set('Authorization', `Bearer ${userToken}`)
      .send(timeSlotFixtures.createPayload({ consultantId }));

    expect(res.status).toBe(403);
  });

  it('should return 404 when consultant does not exist', async () => {
    const payload = timeSlotFixtures.createPayload({ consultantId: 'nonexistent' });

    const res = await request
      .post('/v1/time-slots')
      .set('Authorization', `Bearer ${adminToken}`)
      .send(payload);

    expect(res.status).toBe(404);
  });
});

describe('POST /v1/time-slots/bulk', () => {
  it('should bulk create time slots', async () => {
    const payload = timeSlotFixtures.bulkCreatePayload({ consultantId, count: 5 });

    const res = await request
      .post('/v1/time-slots/bulk')
      .set('Authorization', `Bearer ${adminToken}`)
      .send(payload);

    expect(res.status).toBe(201);
    expect(res.body.data.created).toBe(5);
  });

  it('should return 403 for non-admin bulk create', async () => {
    const payload = timeSlotFixtures.bulkCreatePayload({ consultantId, count: 3 });

    const res = await request
      .post('/v1/time-slots/bulk')
      .set('Authorization', `Bearer ${userToken}`)
      .send(payload);

    expect(res.status).toBe(403);
  });
});

describe('GET /v1/time-slots', () => {
  it('should return paginated time slots for admin', async () => {
    const res = await request
      .get('/v1/time-slots')
      .set('Authorization', `Bearer ${adminToken}`)
      .query({ page: 1, limit: 10 });

    expect(res.status).toBe(200);
    expect(res.body.data).toBeInstanceOf(Array);
    expect(res.body.meta).toMatchObject({ page: 1, limit: 10 });
  });

  it('should filter time slots by consultantId', async () => {
    const res = await request
      .get('/v1/time-slots')
      .set('Authorization', `Bearer ${adminToken}`)
      .query({ consultantId });

    expect(res.status).toBe(200);
    res.body.data.forEach((slot: any) => {
      expect(slot.consultantId).toBe(consultantId);
    });
  });

  it('should filter available time slots for public view', async () => {
    const res = await request
      .get('/v1/time-slots/available')
      .query({ consultantId });

    expect(res.status).toBe(200);
    res.body.data.forEach((slot: any) => {
      expect(slot.isAvailable).toBe(true);
    });
  });

  it('should filter by date range', async () => {
    const from = new Date().toISOString().split('T')[0];
    const to = new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0];

    const res = await request
      .get('/v1/time-slots')
      .set('Authorization', `Bearer ${adminToken}`)
      .query({ from, to });

    expect(res.status).toBe(200);
  });
});

describe('GET /v1/time-slots/:id', () => {
  it('should return time slot by id', async () => {
    const res = await request
      .get(`/v1/time-slots/${timeSlotId}`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.id).toBe(timeSlotId);
  });

  it('should return 404 for non-existent time slot', async () => {
    const res = await request
      .get('/v1/time-slots/nonexistent-id')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(404);
  });
});

describe('PATCH /v1/time-slots/:id', () => {
  it('should mark a time slot as unavailable', async () => {
    const res = await request
      .patch(`/v1/time-slots/${timeSlotId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ isAvailable: false });

    expect(res.status).toBe(200);
    expect(res.body.data.isAvailable).toBe(false);
  });

  it('should return 400 when a booked slot is set to unavailable', async () => {
    const bookedSlot = await prisma.timeSlot.create({
      data: timeSlotFixtures.booked({ consultantId }),
    });

    const res = await request
      .patch(`/v1/time-slots/${bookedSlot.id}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ isAvailable: false });

    expect(res.status).toBe(400);
  });

  it('should return 403 for non-admin patch', async () => {
    const res = await request
      .patch(`/v1/time-slots/${timeSlotId}`)
      .set('Authorization', `Bearer ${userToken}`)
      .send({ isAvailable: true });

    expect(res.status).toBe(403);
  });
});

describe('DELETE /v1/time-slots/:id', () => {
  it('should delete an available time slot', async () => {
    const slot = await prisma.timeSlot.create({
      data: timeSlotFixtures.available({ consultantId }),
    });

    const res = await request
      .delete(`/v1/time-slots/${slot.id}`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
  });

  it('should return 400 when deleting a booked slot', async () => {
    const bookedSlot = await prisma.timeSlot.create({
      data: timeSlotFixtures.booked({ consultantId }),
    });

    const res = await request
      .delete(`/v1/time-slots/${bookedSlot.id}`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/booked/i);
  });

  it('should return 403 for non-admin delete', async () => {
    const res = await request
      .delete(`/v1/time-slots/${timeSlotId}`)
      .set('Authorization', `Bearer ${userToken}`);

    expect(res.status).toBe(403);
  });
});