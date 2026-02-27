import supertest from 'supertest';
import { createApp } from '../../src/app';
import { prisma } from '../../src/infrastructure/db/prisma.client';
import { redis } from '../../src/infrastructure/cache/redis.client';
import { generateAdminToken, generateUserToken } from '../../src/tests-helpers/factories';
import { locationsFixture } from '../fixtures/locations.fixture';

const app = createApp();
const request = supertest(app);

let adminToken: string;
let userToken: string;
let locationId: string;

beforeAll(async () => {
  await prisma.$connect();
  adminToken = await generateAdminToken();
  userToken = await generateUserToken();
});

afterAll(async () => {
  await prisma.location.deleteMany();
  await prisma.$disconnect();
  await redis.quit();
});

describe('POST /v1/locations', () => {
  it('should create a new showroom location', async () => {
    const payload = locationsFixture.createPayload();

    const res = await request
      .post('/v1/locations')
      .set('Authorization', `Bearer ${adminToken}`)
      .send(payload);

    expect(res.status).toBe(201);
    expect(res.body.data).toMatchObject({
      name: payload.name,
      address: payload.address,
      isActive: true,
    });
    locationId = res.body.data.id;
  });

  it('should return 400 for missing required fields', async () => {
    const res = await request
      .post('/v1/locations')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: 'Only Name' });

    expect(res.status).toBe(400);
    expect(res.body.errors).toBeDefined();
  });

  it('should return 400 for invalid postcode format', async () => {
    const payload = locationsFixture.createPayload({ postcode: 'INVALID' });

    const res = await request
      .post('/v1/locations')
      .set('Authorization', `Bearer ${adminToken}`)
      .send(payload);

    expect(res.status).toBe(400);
  });

  it('should return 400 for invalid phone number', async () => {
    const payload = locationsFixture.createPayload({ phone: '12345' });

    const res = await request
      .post('/v1/locations')
      .set('Authorization', `Bearer ${adminToken}`)
      .send(payload);

    expect(res.status).toBe(400);
  });

  it('should return 400 for invalid email', async () => {
    const payload = locationsFixture.createPayload({ email: 'bad-email' });

    const res = await request
      .post('/v1/locations')
      .set('Authorization', `Bearer ${adminToken}`)
      .send(payload);

    expect(res.status).toBe(400);
  });

  it('should return 403 for non-admin', async () => {
    const res = await request
      .post('/v1/locations')
      .set('Authorization', `Bearer ${userToken}`)
      .send(locationsFixture.createPayload());

    expect(res.status).toBe(403);
  });

  it('should return 401 for unauthenticated request', async () => {
    const res = await request
      .post('/v1/locations')
      .send(locationsFixture.createPayload());

    expect(res.status).toBe(401);
  });
});

describe('GET /v1/locations', () => {
  it('should return all locations for admin with pagination', async () => {
    const res = await request
      .get('/v1/locations')
      .set('Authorization', `Bearer ${adminToken}`)
      .query({ page: 1, limit: 10 });

    expect(res.status).toBe(200);
    expect(res.body.data).toBeInstanceOf(Array);
    expect(res.body.meta).toMatchObject({ page: 1, limit: 10 });
  });

  it('should return active locations publicly', async () => {
    const res = await request.get('/v1/locations/public');

    expect(res.status).toBe(200);
    expect(res.body.data).toBeInstanceOf(Array);
    res.body.data.forEach((l: any) => {
      expect(l.isActive).toBe(true);
    });
  });

  it('should filter locations by search term', async () => {
    const unique = await prisma.location.create({
      data: locationsFixture.raw({ name: 'UniqueShowroomSearch' }),
    });

    const res = await request
      .get('/v1/locations')
      .set('Authorization', `Bearer ${adminToken}`)
      .query({ search: 'UniqueShowroomSearch' });

    expect(res.status).toBe(200);
    expect(res.body.data.some((l: any) => l.id === unique.id)).toBe(true);
  });

  it('should filter by isActive status', async () => {
    const res = await request
      .get('/v1/locations')
      .set('Authorization', `Bearer ${adminToken}`)
      .query({ isActive: true });

    expect(res.status).toBe(200);
    res.body.data.forEach((l: any) => {
      expect(l.isActive).toBe(true);
    });
  });
});

describe('GET /v1/locations/:id', () => {
  it('should return location detail with opening hours and map link', async () => {
    const res = await request
      .get(`/v1/locations/${locationId}`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data).toMatchObject({
      id: locationId,
    });
    expect(res.body.data).toHaveProperty('openingHours');
    expect(res.body.data).toHaveProperty('mapLink');
  });

  it('should allow public access to location detail', async () => {
    const res = await request.get(`/v1/locations/${locationId}/public`);

    expect(res.status).toBe(200);
    expect(res.body.data.id).toBe(locationId);
  });

  it('should return 404 for non-existent location', async () => {
    const res = await request
      .get('/v1/locations/nonexistent-id')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(404);
  });
});

describe('PATCH /v1/locations/:id', () => {
  it('should update location name and address', async () => {
    const res = await request
      .patch(`/v1/locations/${locationId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: 'Updated Showroom Name', address: '99 New Street' });

    expect(res.status).toBe(200);
    expect(res.body.data.name).toBe('Updated Showroom Name');
    expect(res.body.data.address).toBe('99 New Street');
  });

  it('should update opening hours', async () => {
    const openingHours = { monday: '09:00-18:00', saturday: '10:00-16:00' };

    const res = await request
      .patch(`/v1/locations/${locationId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ openingHours });

    expect(res.status).toBe(200);
    expect(res.body.data.openingHours).toMatchObject(openingHours);
  });

  it('should deactivate a location', async () => {
    const res = await request
      .patch(`/v1/locations/${locationId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ isActive: false });

    expect(res.status).toBe(200);
    expect(res.body.data.isActive).toBe(false);
  });

  it('should return 403 for non-admin update', async () => {
    const res = await request
      .patch(`/v1/locations/${locationId}`)
      .set('Authorization', `Bearer ${userToken}`)
      .send({ name: 'Hacker Name' });

    expect(res.status).toBe(403);
  });
});

describe('DELETE /v1/locations/:id', () => {
  it('should soft delete a location', async () => {
    const loc = await prisma.location.create({ data: locationsFixture.raw() });

    const res = await request
      .delete(`/v1/locations/${loc.id}`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.deletedAt).not.toBeNull();
  });

  it('should return 403 for non-admin delete', async () => {
    const res = await request
      .delete(`/v1/locations/${locationId}`)
      .set('Authorization', `Bearer ${userToken}`);

    expect(res.status).toBe(403);
  });

  it('should return 404 for non-existent location delete', async () => {
    const res = await request
      .delete('/v1/locations/nonexistent-id')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(404);
  });
});