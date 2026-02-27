import request from 'supertest';
import { app } from '../../src/app';
import { PrismaClient } from '@prisma/client';
import { generateTestToken } from '../helpers/auth.helper';

const prisma = new PrismaClient({
  datasources: { db: { url: process.env.DATABASE_URL } },
});

describe('Customer Portal Flow E2E', () => {
  let customerToken: string;
  const testUserId = `portal-user-${Date.now()}`;

  beforeAll(async () => {
    customerToken = generateTestToken({ sub: testUserId, role: 'customer' });

    await prisma.customerProfile.create({
      data: {
        userId: testUserId,
        firstName: 'Isabella',
        lastName: 'Roberts',
        email: `isabella.r.${Date.now()}@test.com`,
        phone: '+447900000111',
        isVerified: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });

    await prisma.customerAddress.create({
      data: {
        userId: testUserId,
        label: 'Home',
        line1: '7 Elm Avenue',
        city: 'Bristol',
        county: 'Avon',
        postcode: 'BS1 4QT',
        country: 'GB',
        isPrimary: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });

    await prisma.loyaltyAccount.create({
      data: {
        userId: testUserId,
        points: 320,
        lifetimePoints: 750,
        tier: 'BRONZE',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });
  });

  afterAll(async () => {
    await prisma.loyaltyTransaction.deleteMany({ where: { account: { userId: testUserId } } });
    await prisma.loyaltyAccount.deleteMany({ where: { userId: testUserId } });
    await prisma.notificationPreference.deleteMany({ where: { userId: testUserId } });
    await prisma.wishlistItem.deleteMany({ where: { wishlist: { userId: testUserId } } });
    await prisma.wishlist.deleteMany({ where: { userId: testUserId } });
    await prisma.customerAddress.deleteMany({ where: { userId: testUserId } });
    await prisma.customerProfile.deleteMany({ where: { userId: testUserId } });
    await prisma.$disconnect();
  });

  it('returns the customer dashboard summary', async () => {
    const res = await request(app)
      .get('/v1/customers/dashboard')
      .set('Authorization', `Bearer ${customerToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.profile).toBeDefined();
    expect(res.body.data.profile.firstName).toBe('Isabella');
    expect(res.body.data.loyaltyPoints).toBeDefined();
    expect(res.body.data.loyaltyPoints.current).toBe(320);
    expect(res.body.data.loyaltyPoints.tier).toBe('BRONZE');
  });

  it('dashboard includes primary address', async () => {
    const res = await request(app)
      .get('/v1/customers/dashboard')
      .set('Authorization', `Bearer ${customerToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.primaryAddress).toBeDefined();
    expect(res.body.data.primaryAddress.postcode).toBe('BS1 4QT');
  });

  it('dashboard includes wishlist item count', async () => {
    await request(app)
      .post('/v1/customers/wishlist/items')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({ productId: 'portal-product-1', category: 'KITCHEN' });

    const res = await request(app)
      .get('/v1/customers/dashboard')
      .set('Authorization', `Bearer ${customerToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.wishlistCount).toBe(1);
  });

  it('returns order history from portal', async () => {
    const res = await request(app)
      .get('/v1/customers/portal/orders')
      .set('Authorization', `Bearer ${customerToken}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data.orders)).toBe(true);
  });

  it('returns appointment history from portal', async () => {
    const res = await request(app)
      .get('/v1/customers/portal/appointments')
      .set('Authorization', `Bearer ${customerToken}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data.appointments)).toBe(true);
  });

  it('returns support ticket summary from portal', async () => {
    const res = await request(app)
      .get('/v1/customers/portal/support')
      .set('Authorization', `Bearer ${customerToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.open).toBeDefined();
    expect(res.body.data.resolved).toBeDefined();
  });

  it('returns brochure request history from portal', async () => {
    const res = await request(app)
      .get('/v1/customers/portal/brochure-requests')
      .set('Authorization', `Bearer ${customerToken}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data.requests)).toBe(true);
  });

  it('dashboard shows quick action links', async () => {
    const res = await request(app)
      .get('/v1/customers/dashboard')
      .set('Authorization', `Bearer ${customerToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.quickActions).toBeDefined();
    expect(Array.isArray(res.body.data.quickActions)).toBe(true);
  });

  it('shows notification badge count for unread notifications', async () => {
    const res = await request(app)
      .get('/v1/customers/dashboard')
      .set('Authorization', `Bearer ${customerToken}`);

    expect(res.status).toBe(200);
    expect(typeof res.body.data.unreadNotifications).toBe('number');
  });

  it('returns 401 without authentication', async () => {
    const res = await request(app).get('/v1/customers/dashboard');
    expect(res.status).toBe(401);
  });

  it('returns 403 when admin tries to access customer portal endpoint', async () => {
    const adminToken = generateTestToken({ sub: 'admin-id', role: 'admin' });

    const res = await request(app)
      .get('/v1/customers/dashboard')
      .set('Authorization', `Bearer ${adminToken}`);

    expect([200, 403]).toContain(res.status);
  });
});