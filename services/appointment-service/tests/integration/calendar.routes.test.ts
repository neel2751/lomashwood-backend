import supertest from 'supertest';
import { createApp } from '../../src/app';
import { prisma } from '../../src/infrastructure/db/prisma.client';
import { redis } from '../../src/infrastructure/cache/redis.client';
import { generateAdminToken, generateUserToken } from '../../src/tests-helpers/factories';
import { consultantFixtures } from '../fixtures/consultants.fixture';
import { availabilityFixtures } from '../fixtures/availability.fixture';
import { timeSlotFixtures } from '../fixtures/time-slots.fixture';

const app = createApp();
const request = supertest(app);

let adminToken: string;
let userToken: string;
let consultantId: string;

beforeAll(async () => {
  await prisma.$connect();
  adminToken = await generateAdminToken();
  userToken = await generateUserToken();

  const consultant = await prisma.consultant.create({ data: consultantFixtures.active() });
  consultantId = consultant.id;

  await prisma.availability.createMany({
    data: [
      availabilityFixtures.raw({ consultantId, dayOfWeek: 1 }),
      availabilityFixtures.raw({ consultantId, dayOfWeek: 2 }),
      availabilityFixtures.raw({ consultantId, dayOfWeek: 3 }),
    ],
  });

  await prisma.timeSlot.createMany({
    data: Array.from({ length: 5 }, () => timeSlotFixtures.available({ consultantId })),
  });
});

afterAll(async () => {
  await prisma.timeSlot.deleteMany();
  await prisma.availability.deleteMany();
  await prisma.consultant.deleteMany();
  await prisma.$disconnect();
  await redis.quit();
});

describe('GET /v1/calendar', () => {
  it('should return calendar view with available slots for a consultant', async () => {
    const from = new Date().toISOString().split('T')[0];
    const to = new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0];

    const res = await request
      .get('/v1/calendar')
      .set('Authorization', `Bearer ${adminToken}`)
      .query({ consultantId, from, to });

    expect(res.status).toBe(200);
    expect(res.body.data).toBeInstanceOf(Array);
    expect(res.body.data[0]).toHaveProperty('date');
    expect(res.body.data[0]).toHaveProperty('slots');
  });

  it('should return public calendar without authentication', async () => {
    const from = new Date().toISOString().split('T')[0];
    const to = new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0];

    const res = await request
      .get('/v1/calendar/public')
      .query({ consultantId, from, to });

    expect(res.status).toBe(200);
    expect(res.body.data).toBeInstanceOf(Array);
  });

  it('should return 400 when consultantId is missing', async () => {
    const from = new Date().toISOString().split('T')[0];
    const to = new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0];

    const res = await request
      .get('/v1/calendar')
      .set('Authorization', `Bearer ${adminToken}`)
      .query({ from, to });

    expect(res.status).toBe(400);
  });

  it('should return 400 when from date is missing', async () => {
    const to = new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0];

    const res = await request
      .get('/v1/calendar')
      .set('Authorization', `Bearer ${adminToken}`)
      .query({ consultantId, to });

    expect(res.status).toBe(400);
  });

  it('should return 400 when to date is missing', async () => {
    const from = new Date().toISOString().split('T')[0];

    const res = await request
      .get('/v1/calendar')
      .set('Authorization', `Bearer ${adminToken}`)
      .query({ consultantId, from });

    expect(res.status).toBe(400);
  });

  it('should return 400 when from date is after to date', async () => {
    const from = new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0];
    const to = new Date().toISOString().split('T')[0];

    const res = await request
      .get('/v1/calendar')
      .set('Authorization', `Bearer ${adminToken}`)
      .query({ consultantId, from, to });

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/date/i);
  });

  it('should return 404 when consultant does not exist', async () => {
    const from = new Date().toISOString().split('T')[0];
    const to = new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0];

    const res = await request
      .get('/v1/calendar')
      .set('Authorization', `Bearer ${adminToken}`)
      .query({ consultantId: 'nonexistent', from, to });

    expect(res.status).toBe(404);
  });

  it('should only show available slots in public view', async () => {
    const from = new Date().toISOString().split('T')[0];
    const to = new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0];

    const res = await request
      .get('/v1/calendar/public')
      .query({ consultantId, from, to });

    expect(res.status).toBe(200);
    res.body.data.forEach((day: any) => {
      day.slots.forEach((slot: any) => {
        expect(slot.isAvailable).toBe(true);
      });
    });
  });

  it('should include booked slots for admin view', async () => {
    const from = new Date().toISOString().split('T')[0];
    const to = new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0];

    const res = await request
      .get('/v1/calendar')
      .set('Authorization', `Bearer ${adminToken}`)
      .query({ consultantId, from, to, includeBooked: true });

    expect(res.status).toBe(200);
    expect(res.body.data).toBeInstanceOf(Array);
  });
});

describe('GET /v1/calendar/sync-status', () => {
  it('should return calendar sync status for a consultant', async () => {
    const res = await request
      .get('/v1/calendar/sync-status')
      .set('Authorization', `Bearer ${adminToken}`)
      .query({ consultantId });

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveProperty('lastSyncedAt');
    expect(res.body.data).toHaveProperty('provider');
  });

  it('should return 403 for non-admin access to sync status', async () => {
    const res = await request
      .get('/v1/calendar/sync-status')
      .set('Authorization', `Bearer ${userToken}`)
      .query({ consultantId });

    expect(res.status).toBe(403);
  });
});

describe('POST /v1/calendar/sync', () => {
  it('should trigger a manual calendar sync for a consultant', async () => {
    const res = await request
      .post('/v1/calendar/sync')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ consultantId });

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveProperty('syncedAt');
  });

  it('should return 404 when consultant does not exist for sync', async () => {
    const res = await request
      .post('/v1/calendar/sync')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ consultantId: 'nonexistent' });

    expect(res.status).toBe(404);
  });

  it('should return 403 for non-admin sync trigger', async () => {
    const res = await request
      .post('/v1/calendar/sync')
      .set('Authorization', `Bearer ${userToken}`)
      .send({ consultantId });

    expect(res.status).toBe(403);
  });

  it('should return 400 when consultantId is missing', async () => {
    const res = await request
      .post('/v1/calendar/sync')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({});

    expect(res.status).toBe(400);
  });
});

describe('GET /v1/calendar/appointments/upcoming', () => {
  it('should return upcoming appointments for admin', async () => {
    const res = await request
      .get('/v1/calendar/appointments/upcoming')
      .set('Authorization', `Bearer ${adminToken}`)
      .query({ consultantId, limit: 5 });

    expect(res.status).toBe(200);
    expect(res.body.data).toBeInstanceOf(Array);
  });

  it('should return upcoming appointments for the logged-in user', async () => {
    const res = await request
      .get('/v1/calendar/appointments/upcoming')
      .set('Authorization', `Bearer ${userToken}`)
      .query({ limit: 5 });

    expect(res.status).toBe(200);
    expect(res.body.data).toBeInstanceOf(Array);
  });

  it('should return 401 for unauthenticated access', async () => {
    const res = await request.get('/v1/calendar/appointments/upcoming');

    expect(res.status).toBe(401);
  });
});