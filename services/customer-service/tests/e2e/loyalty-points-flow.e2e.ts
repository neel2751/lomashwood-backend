import request from 'supertest';
import { app } from '../../src/app';
import { PrismaClient } from '@prisma/client';
import { generateTestToken } from '../helpers/auth.helper';

const prisma = new PrismaClient({
  datasources: { db: { url: process.env.DATABASE_URL } },
});

describe('Loyalty Points Flow E2E', () => {
  let customerToken: string;
  let adminToken: string;
  const testUserId = `loyalty-user-${Date.now()}`;

  beforeAll(async () => {
    customerToken = generateTestToken({ sub: testUserId, role: 'customer' });
    adminToken = generateTestToken({ sub: 'admin-loyalty-mgr', role: 'admin' });

    await prisma.customerProfile.create({
      data: {
        userId: testUserId,
        firstName: 'Charlotte',
        lastName: 'Evans',
        email: `charlotte.e.${Date.now()}@test.com`,
        phone: '+447955666777',
        isVerified: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });
  });

  afterAll(async () => {
    await prisma.loyaltyTransaction.deleteMany({ where: { account: { userId: testUserId } } });
    await prisma.loyaltyAccount.deleteMany({ where: { userId: testUserId } });
    await prisma.customerProfile.deleteMany({ where: { userId: testUserId } });
    await prisma.$disconnect();
  });

  it('returns an initialised loyalty account with zero points', async () => {
    const res = await request(app)
      .get('/v1/customers/loyalty')
      .set('Authorization', `Bearer ${customerToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.points).toBe(0);
    expect(res.body.data.lifetimePoints).toBe(0);
    expect(res.body.data.tier).toBe('BRONZE');
  });

  it('admin credits points for a kitchen purchase', async () => {
    const res = await request(app)
      .post('/v1/customers/loyalty/transactions')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        userId: testUserId,
        type: 'EARN',
        points: 500,
        reason: 'Kitchen purchase - Order #ORD-001',
        referenceId: 'ORD-001',
        referenceType: 'ORDER',
      });

    expect(res.status).toBe(201);
    expect(res.body.data.points).toBe(500);
    expect(res.body.data.type).toBe('EARN');
  });

  it('balance reflects credited points', async () => {
    const res = await request(app)
      .get('/v1/customers/loyalty')
      .set('Authorization', `Bearer ${customerToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.points).toBe(500);
    expect(res.body.data.lifetimePoints).toBe(500);
    expect(res.body.data.tier).toBe('BRONZE');
  });

  it('admin credits more points triggering tier upgrade to SILVER', async () => {
    await request(app)
      .post('/v1/customers/loyalty/transactions')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        userId: testUserId,
        type: 'EARN',
        points: 750,
        reason: 'Bedroom purchase - Order #ORD-002',
        referenceId: 'ORD-002',
        referenceType: 'ORDER',
      });

    const res = await request(app)
      .get('/v1/customers/loyalty')
      .set('Authorization', `Bearer ${customerToken}`);

    expect(res.body.data.points).toBe(1250);
    expect(res.body.data.lifetimePoints).toBe(1250);
    expect(res.body.data.tier).toBe('SILVER');
  });

  it('admin redeems points against a discount', async () => {
    const res = await request(app)
      .post('/v1/customers/loyalty/transactions')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        userId: testUserId,
        type: 'REDEEM',
        points: 200,
        reason: 'Discount applied - Order #ORD-003',
        referenceId: 'ORD-003',
        referenceType: 'ORDER',
      });

    expect(res.status).toBe(201);
    expect(res.body.data.type).toBe('REDEEM');
  });

  it('balance decreases after redemption', async () => {
    const res = await request(app)
      .get('/v1/customers/loyalty')
      .set('Authorization', `Bearer ${customerToken}`);

    expect(res.body.data.points).toBe(1050);
    expect(res.body.data.lifetimePoints).toBe(1250);
  });

  it('customer views full transaction history', async () => {
    const res = await request(app)
      .get('/v1/customers/loyalty/transactions')
      .set('Authorization', `Bearer ${customerToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.transactions.length).toBe(3);

    const earnTx = res.body.data.transactions.filter((t: { type: string }) => t.type === 'EARN');
    const redeemTx = res.body.data.transactions.filter((t: { type: string }) => t.type === 'REDEEM');

    expect(earnTx.length).toBe(2);
    expect(redeemTx.length).toBe(1);
  });

  it('prevents redemption exceeding available points', async () => {
    const res = await request(app)
      .post('/v1/customers/loyalty/transactions')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        userId: testUserId,
        type: 'REDEEM',
        points: 99999,
        reason: 'Exceeds available balance',
        referenceId: 'ORD-999',
        referenceType: 'ORDER',
      });

    expect(res.status).toBe(400);
    expect(res.body.error).toBeDefined();
  });

  it('admin adjusts points with an admin correction', async () => {
    const res = await request(app)
      .post('/v1/customers/loyalty/transactions')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        userId: testUserId,
        type: 'ADJUSTMENT',
        points: -50,
        reason: 'Administrative correction for duplicate credit',
        referenceId: null,
        referenceType: 'ADMIN',
      });

    expect(res.status).toBe(201);

    const balRes = await request(app)
      .get('/v1/customers/loyalty')
      .set('Authorization', `Bearer ${customerToken}`);

    expect(balRes.body.data.points).toBe(1000);
  });

  it('returns 401 for unauthenticated loyalty access', async () => {
    const res = await request(app).get('/v1/customers/loyalty');
    expect(res.status).toBe(401);
  });

  it('prevents customer from manually creating transactions', async () => {
    const res = await request(app)
      .post('/v1/customers/loyalty/transactions')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({
        userId: testUserId,
        type: 'EARN',
        points: 10000,
        reason: 'Self-awarded points',
        referenceType: 'FRAUD',
      });

    expect(res.status).toBe(403);
  });
});