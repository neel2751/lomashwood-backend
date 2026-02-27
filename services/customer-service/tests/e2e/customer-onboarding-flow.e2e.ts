import request from 'supertest';
import { app } from '../../src/app';
import { PrismaClient } from '@prisma/client';
import { generateTestToken } from '../helpers/auth.helper';

const prisma = new PrismaClient({
  datasources: { db: { url: process.env.DATABASE_URL } },
});

describe('Customer Onboarding Flow E2E', () => {
  let authToken: string;
  const testUserId = `onboard-user-${Date.now()}`;

  beforeAll(async () => {
    authToken = generateTestToken({ sub: testUserId, role: 'customer' });
  });

  afterAll(async () => {
    await prisma.notificationPreference.deleteMany({ where: { userId: testUserId } });
    await prisma.customerAddress.deleteMany({ where: { userId: testUserId } });
    await prisma.wishlist.deleteMany({ where: { userId: testUserId } });
    await prisma.loyaltyAccount.deleteMany({ where: { userId: testUserId } });
    await prisma.customerProfile.deleteMany({ where: { userId: testUserId } });
    await prisma.$disconnect();
  });

  it('Step 1: creates a new customer profile on first registration', async () => {
    const res = await request(app)
      .post('/v1/customers/profile')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        firstName: 'James',
        lastName: 'Carter',
        phone: '+447900111222',
        dateOfBirth: '1990-05-15',
      });

    expect(res.status).toBe(201);
    expect(res.body.data).toMatchObject({
      userId: testUserId,
      firstName: 'James',
      lastName: 'Carter',
      phone: '+447900111222',
    });
    expect(res.body.data.isVerified).toBe(false);
  });

  it('Step 2: retrieves the newly created profile', async () => {
    const res = await request(app)
      .get('/v1/customers/profile')
      .set('Authorization', `Bearer ${authToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.firstName).toBe('James');
    expect(res.body.data.lastName).toBe('Carter');
  });

  it('Step 3: adds a primary address during onboarding', async () => {
    const res = await request(app)
      .post('/v1/customers/addresses')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        label: 'Home',
        line1: '12 Baker Street',
        city: 'London',
        county: 'Greater London',
        postcode: 'NW1 6XE',
        country: 'GB',
        isPrimary: true,
      });

    expect(res.status).toBe(201);
    expect(res.body.data.isPrimary).toBe(true);
    expect(res.body.data.postcode).toBe('NW1 6XE');
  });

  it('Step 4: sets notification preferences', async () => {
    const res = await request(app)
      .put('/v1/customers/notification-preferences')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        emailMarketing: true,
        smsMarketing: false,
        pushMarketing: true,
        orderUpdates: true,
        appointmentReminders: true,
        newsletter: true,
      });

    expect(res.status).toBe(200);
    expect(res.body.data.emailMarketing).toBe(true);
    expect(res.body.data.smsMarketing).toBe(false);
    expect(res.body.data.appointmentReminders).toBe(true);
  });

  it('Step 5: creates a wishlist automatically on first access', async () => {
    const res = await request(app)
      .get('/v1/customers/wishlist')
      .set('Authorization', `Bearer ${authToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data).toBeDefined();
    expect(Array.isArray(res.body.data.items)).toBe(true);
    expect(res.body.data.items.length).toBe(0);
  });

  it('Step 6: retrieves loyalty account initialised with zero points', async () => {
    const res = await request(app)
      .get('/v1/customers/loyalty')
      .set('Authorization', `Bearer ${authToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.points).toBe(0);
    expect(res.body.data.tier).toBe('BRONZE');
  });

  it('Step 7: returns complete onboarding summary', async () => {
    const res = await request(app)
      .get('/v1/customers/onboarding-status')
      .set('Authorization', `Bearer ${authToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.hasProfile).toBe(true);
    expect(res.body.data.hasAddress).toBe(true);
    expect(res.body.data.hasNotificationPreferences).toBe(true);
  });
});