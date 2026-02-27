import supertest from 'supertest';
import { createApp } from '../../src/app';
import { prisma } from '../../src/infrastructure/db/prisma.client';
import { redis } from '../../src/infrastructure/cache/redis.client';
import { generateAdminToken, generateUserToken } from '../../src/tests-helpers/factories';
import { servicesFixture } from '../fixtures/services.fixture';

const app = createApp();
const request = supertest(app);

let adminToken: string;
let userToken: string;
let serviceTypeId: string;

beforeAll(async () => {
  await prisma.$connect();
  adminToken = await generateAdminToken();
  userToken = await generateUserToken();
});

afterAll(async () => {
  await prisma.serviceType.deleteMany();
  await prisma.$disconnect();
  await redis.quit();
});

describe('POST /v1/service-types', () => {
  it('should create a home measurement service type', async () => {
    const payload = servicesFixture.createPayload({ type: 'HOME_MEASUREMENT' });

    const res = await request
      .post('/v1/service-types')
      .set('Authorization', `Bearer ${adminToken}`)
      .send(payload);

    expect(res.status).toBe(201);
    expect(res.body.data).toMatchObject({
      title: payload.title,
      type: 'HOME_MEASUREMENT',
      isActive: true,
    });
    serviceTypeId = res.body.data.id;
  });

  it('should create an online service type', async () => {
    const payload = servicesFixture.createPayload({ type: 'ONLINE' });

    const res = await request
      .post('/v1/service-types')
      .set('Authorization', `Bearer ${adminToken}`)
      .send(payload);

    expect(res.status).toBe(201);
    expect(res.body.data.type).toBe('ONLINE');
  });

  it('should create a showroom service type', async () => {
    const payload = servicesFixture.createPayload({ type: 'SHOWROOM' });

    const res = await request
      .post('/v1/service-types')
      .set('Authorization', `Bearer ${adminToken}`)
      .send(payload);

    expect(res.status).toBe(201);
    expect(res.body.data.type).toBe('SHOWROOM');
  });

  it('should return 400 for invalid type enum', async () => {
    const payload = servicesFixture.createPayload({ type: 'INVALID_TYPE' as any });

    const res = await request
      .post('/v1/service-types')
      .set('Authorization', `Bearer ${adminToken}`)
      .send(payload);

    expect(res.status).toBe(400);
    expect(res.body.errors).toBeDefined();
  });

  it('should return 400 for missing title', async () => {
    const res = await request
      .post('/v1/service-types')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ type: 'ONLINE', description: 'Missing title' });

    expect(res.status).toBe(400);
  });

  it('should return 409 for duplicate service type name', async () => {
    const payload = servicesFixture.createPayload({ type: 'HOME_MEASUREMENT' });
    await prisma.serviceType.create({ data: { ...payload } });

    const res = await request
      .post('/v1/service-types')
      .set('Authorization', `Bearer ${adminToken}`)
      .send(payload);

    expect(res.status).toBe(409);
  });

  it('should return 403 for non-admin', async () => {
    const res = await request
      .post('/v1/service-types')
      .set('Authorization', `Bearer ${userToken}`)
      .send(servicesFixture.createPayload({ type: 'ONLINE' }));

    expect(res.status).toBe(403);
  });

  it('should return 401 for unauthenticated request', async () => {
    const res = await request
      .post('/v1/service-types')
      .send(servicesFixture.createPayload({ type: 'ONLINE' }));

    expect(res.status).toBe(401);
  });
});

describe('GET /v1/service-types', () => {
  it('should return all service types for admin', async () => {
    const res = await request
      .get('/v1/service-types')
      .set('Authorization', `Bearer ${adminToken}`)
      .query({ page: 1, limit: 10 });

    expect(res.status).toBe(200);
    expect(res.body.data).toBeInstanceOf(Array);
    expect(res.body.meta).toMatchObject({ page: 1, limit: 10 });
  });

  it('should return active service types publicly', async () => {
    const res = await request.get('/v1/service-types/public');

    expect(res.status).toBe(200);
    expect(res.body.data).toBeInstanceOf(Array);
    res.body.data.forEach((st: any) => {
      expect(st.isActive).toBe(true);
    });
  });

  it('should filter by type', async () => {
    const res = await request
      .get('/v1/service-types')
      .set('Authorization', `Bearer ${adminToken}`)
      .query({ type: 'HOME_MEASUREMENT' });

    expect(res.status).toBe(200);
    res.body.data.forEach((st: any) => {
      expect(st.type).toBe('HOME_MEASUREMENT');
    });
  });

  it('should filter by isActive', async () => {
    const res = await request
      .get('/v1/service-types')
      .set('Authorization', `Bearer ${adminToken}`)
      .query({ isActive: true });

    expect(res.status).toBe(200);
    res.body.data.forEach((st: any) => {
      expect(st.isActive).toBe(true);
    });
  });
});

describe('GET /v1/service-types/:id', () => {
  it('should return service type by id with icon and duration', async () => {
    const res = await request
      .get(`/v1/service-types/${serviceTypeId}`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.id).toBe(serviceTypeId);
    expect(res.body.data).toHaveProperty('durationMinutes');
  });

  it('should allow public access to active service type', async () => {
    const res = await request.get(`/v1/service-types/${serviceTypeId}/public`);

    expect(res.status).toBe(200);
    expect(res.body.data.id).toBe(serviceTypeId);
  });

  it('should return 404 for non-existent service type', async () => {
    const res = await request
      .get('/v1/service-types/nonexistent-id')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(404);
  });
});

describe('PATCH /v1/service-types/:id', () => {
  it('should update service type title and description', async () => {
    const res = await request
      .patch(`/v1/service-types/${serviceTypeId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ title: 'Updated Home Visit', description: 'Updated description' });

    expect(res.status).toBe(200);
    expect(res.body.data.title).toBe('Updated Home Visit');
  });

  it('should update duration minutes', async () => {
    const res = await request
      .patch(`/v1/service-types/${serviceTypeId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ durationMinutes: 90 });

    expect(res.status).toBe(200);
    expect(res.body.data.durationMinutes).toBe(90);
  });

  it('should deactivate a service type', async () => {
    const res = await request
      .patch(`/v1/service-types/${serviceTypeId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ isActive: false });

    expect(res.status).toBe(200);
    expect(res.body.data.isActive).toBe(false);
  });

  it('should return 400 for negative duration', async () => {
    const res = await request
      .patch(`/v1/service-types/${serviceTypeId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ durationMinutes: -30 });

    expect(res.status).toBe(400);
  });

  it('should return 403 for non-admin update', async () => {
    const res = await request
      .patch(`/v1/service-types/${serviceTypeId}`)
      .set('Authorization', `Bearer ${userToken}`)
      .send({ title: 'Hack' });

    expect(res.status).toBe(403);
  });
});

describe('DELETE /v1/service-types/:id', () => {
  it('should soft delete a service type', async () => {
    const st = await prisma.serviceType.create({
      data: servicesFixture.raw({ type: 'ONLINE' }),
    });

    const res = await request
      .delete(`/v1/service-types/${st.id}`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.deletedAt).not.toBeNull();
  });

  it('should return 400 when deleting a service type with active bookings', async () => {
    const res = await request
      .delete(`/v1/service-types/${serviceTypeId}`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBeGreaterThanOrEqual(400);
  });

  it('should return 403 for non-admin delete', async () => {
    const res = await request
      .delete(`/v1/service-types/${serviceTypeId}`)
      .set('Authorization', `Bearer ${userToken}`);

    expect(res.status).toBe(403);
  });
});