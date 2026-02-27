import supertest from 'supertest';
import { createApp } from '../../src/app';
import { prisma } from '../../src/infrastructure/db/prisma.client';
import { redis } from '../../src/infrastructure/cache/redis.client';
import { generateAdminToken, generateUserToken } from '../../src/tests-helpers/factories';
import { consultantFixtures } from '../fixtures/consultants.fixture';
import { availabilityFixtures } from '../fixtures/availability.fixture';

const app = createApp();
const request = supertest(app);

let adminToken: string;
let userToken: string;
let consultantId: string;
let availabilityId: string;

beforeAll(async () => {
  await prisma.$connect();
  adminToken = await generateAdminToken();
  userToken = await generateUserToken();

  const consultant = await prisma.consultant.create({ data: consultantFixtures.active() });
  consultantId = consultant.id;
});

afterAll(async () => {
  await prisma.availability.deleteMany();
  await prisma.consultant.deleteMany();
  await prisma.$disconnect();
  await redis.quit();
});

describe('POST /v1/availability', () => {
  it('should create availability for a consultant', async () => {
    const payload = availabilityFixtures.createWeekday({ consultantId });

    const res = await request
      .post('/v1/availability')
      .set('Authorization', `Bearer ${adminToken}`)
      .send(payload);

    expect(res.status).toBe(201);
    expect(res.body.data).toMatchObject({
      consultantId,
      dayOfWeek: payload.dayOfWeek,
      startTime: payload.startTime,
      endTime: payload.endTime,
    });
    availabilityId = res.body.data.id;
  });

  it('should return 400 for overlapping availability windows', async () => {
    const payload = availabilityFixtures.createWeekday({ consultantId });

    const res = await request
      .post('/v1/availability')
      .set('Authorization', `Bearer ${adminToken}`)
      .send(payload);

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/overlap/i);
  });

  it('should return 400 when end time is before start time', async () => {
    const payload = availabilityFixtures.createInvalid({ consultantId });

    const res = await request
      .post('/v1/availability')
      .set('Authorization', `Bearer ${adminToken}`)
      .send(payload);

    expect(res.status).toBe(400);
  });

  it('should return 403 for non-admin', async () => {
    const payload = availabilityFixtures.createWeekday({ consultantId, dayOfWeek: 3 });

    const res = await request
      .post('/v1/availability')
      .set('Authorization', `Bearer ${userToken}`)
      .send(payload);

    expect(res.status).toBe(403);
  });

  it('should return 404 when consultant does not exist', async () => {
    const payload = availabilityFixtures.createWeekday({ consultantId: 'nonexistent' });

    const res = await request
      .post('/v1/availability')
      .set('Authorization', `Bearer ${adminToken}`)
      .send(payload);

    expect(res.status).toBe(404);
  });
});

describe('GET /v1/availability', () => {
  it('should return all availability records for admin', async () => {
    const res = await request
      .get('/v1/availability')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data).toBeInstanceOf(Array);
  });

  it('should filter availability by consultantId', async () => {
    const res = await request
      .get('/v1/availability')
      .set('Authorization', `Bearer ${adminToken}`)
      .query({ consultantId });

    expect(res.status).toBe(200);
    res.body.data.forEach((av: any) => {
      expect(av.consultantId).toBe(consultantId);
    });
  });

  it('should return public availability for unauthenticated users', async () => {
    const res = await request
      .get('/v1/availability/public')
      .query({ consultantId });

    expect(res.status).toBe(200);
    expect(res.body.data).toBeInstanceOf(Array);
  });
});

describe('GET /v1/availability/:id', () => {
  it('should return availability record by id', async () => {
    const res = await request
      .get(`/v1/availability/${availabilityId}`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.id).toBe(availabilityId);
  });

  it('should return 404 for non-existent availability', async () => {
    const res = await request
      .get('/v1/availability/nonexistent-id')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(404);
  });
});

describe('PATCH /v1/availability/:id', () => {
  it('should update availability start and end time', async () => {
    const res = await request
      .patch(`/v1/availability/${availabilityId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ startTime: '10:00', endTime: '18:00' });

    expect(res.status).toBe(200);
    expect(res.body.data.startTime).toBe('10:00');
    expect(res.body.data.endTime).toBe('18:00');
  });

  it('should return 400 when updating with invalid time range', async () => {
    const res = await request
      .patch(`/v1/availability/${availabilityId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ startTime: '18:00', endTime: '10:00' });

    expect(res.status).toBe(400);
  });

  it('should return 403 for non-admin', async () => {
    const res = await request
      .patch(`/v1/availability/${availabilityId}`)
      .set('Authorization', `Bearer ${userToken}`)
      .send({ startTime: '09:00', endTime: '17:00' });

    expect(res.status).toBe(403);
  });
});

describe('DELETE /v1/availability/:id', () => {
  it('should delete availability record', async () => {
    const av = await prisma.availability.create({
      data: availabilityFixtures.raw({ consultantId, dayOfWeek: 6 }),
    });

    const res = await request
      .delete(`/v1/availability/${av.id}`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
  });

  it('should return 404 for non-existent availability on delete', async () => {
    const res = await request
      .delete('/v1/availability/nonexistent-id')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(404);
  });

  it('should return 403 when non-admin attempts delete', async () => {
    const res = await request
      .delete(`/v1/availability/${availabilityId}`)
      .set('Authorization', `Bearer ${userToken}`);

    expect(res.status).toBe(403);
  });
});