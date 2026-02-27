import request from 'supertest';
import { app } from '../../src/app';
import { PrismaClient } from '@prisma/client';
import { generateTestToken } from '../helpers/auth.helper';

const prisma = new PrismaClient();

describe('Referral Flow E2E', () => {
  let referrerToken: string;
  let refereeToken: string;
  let adminToken: string;
  const referrerUserId = `referrer-${Date.now()}`;
  const refereeUserId = `referee-${Date.now()}`;
  let referralCode: string;
  let referralId: string;

  beforeAll(async () => {
    referrerToken = generateTestToken({ sub: referrerUserId, role: 'customer' });
    refereeToken = generateTestToken({ sub: refereeUserId, role: 'customer' });
    adminToken = generateTestToken({ sub: 'admin-referral-mgr', role: 'admin' });

    await prisma.customerProfile.createMany({
      data: [
        {
          userId: referrerUserId,
          firstName: 'George',
          lastName: 'Harris',
          email: `george.h.${Date.now()}@test.com`,
          phone: '+447966777888',
          isVerified: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          userId: refereeUserId,
          firstName: 'Harriet',
          lastName: 'Hughes',
          email: `harriet.h.${Date.now()}@test.com`,
          phone: '+447977888999',
          isVerified: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ],
    });
  });

  afterAll(async () => {
    await prisma.referral.deleteMany({
      where: {
        OR: [{ referrerId: referrerUserId }, { refereeId: refereeUserId }],
      },
    });
    await prisma.customerProfile.deleteMany({
      where: { userId: { in: [referrerUserId, refereeUserId] } },
    });
    await prisma.$disconnect();
  });

  it('referrer generates a unique referral code', async () => {
    const res = await request(app)
      .post('/v1/customers/referrals/generate')
      .set('Authorization', `Bearer ${referrerToken}`);

    expect(res.status).toBe(201);
    expect(res.body.data.code).toBeDefined();
    expect(typeof res.body.data.code).toBe('string');
    expect(res.body.data.code.length).toBeGreaterThan(5);
    referralCode = res.body.data.code;
  });

  it('returns the same referral code on subsequent requests', async () => {
    const res = await request(app)
      .post('/v1/customers/referrals/generate')
      .set('Authorization', `Bearer ${referrerToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.code).toBe(referralCode);
  });

  it('referee validates the referral code', async () => {
    const res = await request(app)
      .get(`/v1/customers/referrals/validate/${referralCode}`);

    expect(res.status).toBe(200);
    expect(res.body.data.valid).toBe(true);
    expect(res.body.data.referrerName).toBeDefined();
  });

  it('referee applies the referral code during registration', async () => {
    const res = await request(app)
      .post('/v1/customers/referrals/apply')
      .set('Authorization', `Bearer ${refereeToken}`)
      .send({ code: referralCode });

    expect(res.status).toBe(201);
    expect(res.body.data.status).toBe('PENDING');
    expect(res.body.data.referrerId).toBe(referrerUserId);
    expect(res.body.data.refereeId).toBe(refereeUserId);
    referralId = res.body.data.id;
  });

  it('referrer can see the pending referral in their referral list', async () => {
    const res = await request(app)
      .get('/v1/customers/referrals')
      .set('Authorization', `Bearer ${referrerToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.referrals.length).toBeGreaterThan(0);

    const pending = res.body.data.referrals.find(
      (r: { id: string }) => r.id === referralId,
    );
    expect(pending.status).toBe('PENDING');
  });

  it('referee cannot apply the same code twice', async () => {
    const res = await request(app)
      .post('/v1/customers/referrals/apply')
      .set('Authorization', `Bearer ${refereeToken}`)
      .send({ code: referralCode });

    expect(res.status).toBe(409);
  });

  it('referrer cannot use their own referral code', async () => {
    const res = await request(app)
      .post('/v1/customers/referrals/apply')
      .set('Authorization', `Bearer ${referrerToken}`)
      .send({ code: referralCode });

    expect(res.status).toBe(400);
    expect(res.body.error).toBeDefined();
  });

  it('admin marks referral as completed and credits rewards', async () => {
    const res = await request(app)
      .patch(`/v1/customers/referrals/${referralId}/complete`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        referrerPoints: 250,
        refereePoints: 100,
        orderId: 'ORD-REF-001',
      });

    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe('COMPLETED');
    expect(res.body.data.referrerPointsAwarded).toBe(250);
    expect(res.body.data.refereePointsAwarded).toBe(100);
  });

  it('referrer sees completed status and points awarded', async () => {
    const res = await request(app)
      .get('/v1/customers/referrals')
      .set('Authorization', `Bearer ${referrerToken}`);

    const completed = res.body.data.referrals.find(
      (r: { id: string }) => r.id === referralId,
    );
    expect(completed.status).toBe('COMPLETED');
    expect(completed.referrerPointsAwarded).toBe(250);
  });

  it('referral stats include total completed referrals and points', async () => {
    const res = await request(app)
      .get('/v1/customers/referrals/stats')
      .set('Authorization', `Bearer ${referrerToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.totalReferrals).toBeGreaterThan(0);
    expect(res.body.data.completedReferrals).toBeGreaterThan(0);
    expect(res.body.data.totalPointsEarned).toBeGreaterThanOrEqual(250);
  });

  it('returns 400 for invalid referral code format', async () => {
    const res = await request(app)
      .get('/v1/customers/referrals/validate/INVALID!!!CODE');

    expect(res.status).toBe(400);
  });

  it('returns 404 for non-existent referral code', async () => {
    const res = await request(app)
      .get('/v1/customers/referrals/validate/NONEXISTENT99');

    expect(res.status).toBe(404);
  });
});