import request from 'supertest';
import { app } from '../../src/app';
import { PrismaClient } from '@prisma/client';
import { generateTestToken } from '../helpers/auth.helper';

const prisma = new PrismaClient({
  datasources: { db: { url: process.env.DATABASE_URL } },
});

describe('Profile Update Flow E2E', () => {
  let authToken: string;
  const testUserId = `profile-update-user-${Date.now()}`;

  beforeAll(async () => {
    authToken = generateTestToken({ sub: testUserId, role: 'customer' });

    await prisma.customerProfile.create({
      data: {
        userId: testUserId,
        firstName: 'Sarah',
        lastName: 'Williams',
        email: 'sarah.williams@test.com',
        phone: '+447900222333',
        isVerified: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });
  });

  afterAll(async () => {
    await prisma.customerProfile.deleteMany({ where: { userId: testUserId } });
    await prisma.$disconnect();
  });

  it('fetches the current profile', async () => {
    const res = await request(app)
      .get('/v1/customers/profile')
      .set('Authorization', `Bearer ${authToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.firstName).toBe('Sarah');
    expect(res.body.data.lastName).toBe('Williams');
  });

  it('updates basic profile fields', async () => {
    const res = await request(app)
      .patch('/v1/customers/profile')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        firstName: 'Sarah-Jane',
        phone: '+447900999888',
      });

    expect(res.status).toBe(200);
    expect(res.body.data.firstName).toBe('Sarah-Jane');
    expect(res.body.data.phone).toBe('+447900999888');
    expect(res.body.data.lastName).toBe('Williams');
  });

  it('rejects update with invalid phone format', async () => {
    const res = await request(app)
      .patch('/v1/customers/profile')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        phone: 'not-a-phone-number',
      });

    expect(res.status).toBe(422);
    expect(res.body.error).toBeDefined();
  });

  it('updates date of birth', async () => {
    const res = await request(app)
      .patch('/v1/customers/profile')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        dateOfBirth: '1988-11-22',
      });

    expect(res.status).toBe(200);
    expect(res.body.data.dateOfBirth).toBe('1988-11-22');
  });

  it('updates marketing preferences', async () => {
    const res = await request(app)
      .patch('/v1/customers/profile')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        marketingConsent: true,
        marketingConsentDate: new Date().toISOString(),
      });

    expect(res.status).toBe(200);
    expect(res.body.data.marketingConsent).toBe(true);
  });

  it('reflects all updates on subsequent GET', async () => {
    const res = await request(app)
      .get('/v1/customers/profile')
      .set('Authorization', `Bearer ${authToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.firstName).toBe('Sarah-Jane');
    expect(res.body.data.phone).toBe('+447900999888');
    expect(res.body.data.marketingConsent).toBe(true);
  });

  it('prevents updating another user profile', async () => {
    const otherToken = generateTestToken({ sub: 'other-user-id', role: 'customer' });

    const res = await request(app)
      .patch(`/v1/customers/profile`)
      .set('Authorization', `Bearer ${otherToken}`)
      .send({ firstName: 'Hacker' });

    const profileRes = await request(app)
      .get('/v1/customers/profile')
      .set('Authorization', `Bearer ${authToken}`);

    expect(profileRes.body.data.firstName).toBe('Sarah-Jane');
  });

  it('returns 401 when unauthenticated', async () => {
    const res = await request(app)
      .patch('/v1/customers/profile')
      .send({ firstName: 'Anonymous' });

    expect(res.status).toBe(401);
  });
});