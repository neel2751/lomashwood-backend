import supertest from 'supertest';
import { createApp } from '../../src/app';
import { prisma } from '../../src/infrastructure/db/prisma.client';
import { redis } from '../../src/infrastructure/cache/redis.client';
import { generateAdminToken, generateUserToken } from '../../src/tests-helpers/factories';
import { consultantFixtures } from '../fixtures/consultants.fixture';

const app = createApp();
const request = supertest(app);

let adminToken: string;
let userToken: string;
let consultantId: string;

beforeAll(async () => {
  await prisma.$connect();
  adminToken = await generateAdminToken();
  userToken = await generateUserToken();
});

afterAll(async () => {
  await prisma.consultant.deleteMany();
  await prisma.$disconnect();
  await redis.quit();
});

describe('POST /v1/consultants', () => {
  it('should create a new consultant', async () => {
    const payload = consultantFixtures.createPayload();

    const res = await request
      .post('/v1/consultants')
      .set('Authorization', `Bearer ${adminToken}`)
      .send(payload);

    expect(res.status).toBe(201);
    expect(res.body.data).toMatchObject({
      name: payload.name,
      email: payload.email,
      isActive: true,
    });
    consultantId = res.body.data.id;
  });

  it('should return 400 for missing required fields', async () => {
    const res = await request
      .post('/v1/consultants')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: 'Only Name' });

    expect(res.status).toBe(400);
    expect(res.body.errors).toBeDefined();
  });

  it('should return 409 when consultant email already exists', async () => {
    const payload = consultantFixtures.createPayload();
    await prisma.consultant.create({ data: { ...payload } });

    const res = await request
      .post('/v1/consultants')
      .set('Authorization', `Bearer ${adminToken}`)
      .send(payload);

    expect(res.status).toBe(409);
    expect(res.body.message).toMatch(/email/i);
  });

  it('should return 400 for invalid email format', async () => {
    const res = await request
      .post('/v1/consultants')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ ...consultantFixtures.createPayload(), email: 'not-an-email' });

    expect(res.status).toBe(400);
  });

  it('should return 403 for non-admin user', async () => {
    const res = await request
      .post('/v1/consultants')
      .set('Authorization', `Bearer ${userToken}`)
      .send(consultantFixtures.createPayload());

    expect(res.status).toBe(403);
  });

  it('should return 401 for unauthenticated request', async () => {
    const res = await request
      .post('/v1/consultants')
      .send(consultantFixtures.createPayload());

    expect(res.status).toBe(401);
  });
});

describe('GET /v1/consultants', () => {
  it('should return paginated list of consultants', async () => {
    const res = await request
      .get('/v1/consultants')
      .set('Authorization', `Bearer ${adminToken}`)
      .query({ page: 1, limit: 10 });

    expect(res.status).toBe(200);
    expect(res.body.data).toBeInstanceOf(Array);
    expect(res.body.meta).toMatchObject({ page: 1, limit: 10 });
  });

  it('should filter by active status', async () => {
    const res = await request
      .get('/v1/consultants')
      .set('Authorization', `Bearer ${adminToken}`)
      .query({ isActive: true });

    expect(res.status).toBe(200);
    res.body.data.forEach((c: any) => {
      expect(c.isActive).toBe(true);
    });
  });

  it('should allow public access to active consultants', async () => {
    const res = await request
      .get('/v1/consultants/public')
      .query({ isActive: true });

    expect(res.status).toBe(200);
    expect(res.body.data).toBeInstanceOf(Array);
  });

  it('should search consultants by name', async () => {
    const consultant = await prisma.consultant.create({
      data: consultantFixtures.withName('UniqueSearchName'),
    });

    const res = await request
      .get('/v1/consultants')
      .set('Authorization', `Bearer ${adminToken}`)
      .query({ search: 'UniqueSearchName' });

    expect(res.status).toBe(200);
    expect(res.body.data.some((c: any) => c.id === consultant.id)).toBe(true);
  });
});

describe('GET /v1/consultants/:id', () => {
  it('should return consultant by id', async () => {
    const res = await request
      .get(`/v1/consultants/${consultantId}`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.id).toBe(consultantId);
  });

  it('should return 404 for non-existent consultant', async () => {
    const res = await request
      .get('/v1/consultants/nonexistent-id')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(404);
  });

  it('should include availability in response when requested', async () => {
    const res = await request
      .get(`/v1/consultants/${consultantId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .query({ include: 'availability' });

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveProperty('availability');
  });
});

describe('PATCH /v1/consultants/:id', () => {
  it('should update consultant details', async () => {
    const res = await request
      .patch(`/v1/consultants/${consultantId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: 'Updated Consultant Name' });

    expect(res.status).toBe(200);
    expect(res.body.data.name).toBe('Updated Consultant Name');
  });

  it('should deactivate a consultant', async () => {
    const res = await request
      .patch(`/v1/consultants/${consultantId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ isActive: false });

    expect(res.status).toBe(200);
    expect(res.body.data.isActive).toBe(false);
  });

  it('should return 403 for non-admin update', async () => {
    const res = await request
      .patch(`/v1/consultants/${consultantId}`)
      .set('Authorization', `Bearer ${userToken}`)
      .send({ name: 'Hacker' });

    expect(res.status).toBe(403);
  });

  it('should return 400 for invalid email on update', async () => {
    const res = await request
      .patch(`/v1/consultants/${consultantId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ email: 'not-valid' });

    expect(res.status).toBe(400);
  });
});

describe('DELETE /v1/consultants/:id', () => {
  it('should soft delete a consultant', async () => {
    const consultant = await prisma.consultant.create({
      data: consultantFixtures.active(),
    });

    const res = await request
      .delete(`/v1/consultants/${consultant.id}`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.deletedAt).not.toBeNull();
  });

  it('should return 403 for non-admin delete', async () => {
    const res = await request
      .delete(`/v1/consultants/${consultantId}`)
      .set('Authorization', `Bearer ${userToken}`);

    expect(res.status).toBe(403);
  });

  it('should return 404 for non-existent consultant delete', async () => {
    const res = await request
      .delete('/v1/consultants/nonexistent-id')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(404);
  });
});