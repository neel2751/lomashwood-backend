import request from 'supertest';
import { app } from '../../src/app';
import { PrismaClient } from '@prisma/client';
import { generateTestToken } from '../helpers/auth.helper';

const prisma = new PrismaClient({
  datasources: { db: { url: process.env.DATABASE_URL } },
});

describe('Notification Settings Flow E2E', () => {
  let customerToken: string;
  const testUserId = `notif-settings-user-${Date.now()}`;

  beforeAll(async () => {
    customerToken = generateTestToken({ sub: testUserId, role: 'customer' });

    await prisma.customerProfile.create({
      data: {
        userId: testUserId,
        firstName: 'Thomas',
        lastName: 'Walker',
        email: `thomas.w.${Date.now()}@test.com`,
        phone: '+447988999000',
        isVerified: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });
  });

  afterAll(async () => {
    await prisma.notificationPreference.deleteMany({ where: { userId: testUserId } });
    await prisma.customerProfile.deleteMany({ where: { userId: testUserId } });
    await prisma.$disconnect();
  });

  it('returns default notification preferences on first access', async () => {
    const res = await request(app)
      .get('/v1/customers/notification-preferences')
      .set('Authorization', `Bearer ${customerToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data).toBeDefined();
    expect(typeof res.body.data.emailMarketing).toBe('boolean');
    expect(typeof res.body.data.orderUpdates).toBe('boolean');
    expect(typeof res.body.data.appointmentReminders).toBe('boolean');
  });

  it('enables all marketing notifications', async () => {
    const res = await request(app)
      .put('/v1/customers/notification-preferences')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({
        emailMarketing: true,
        smsMarketing: true,
        pushMarketing: true,
        newsletter: true,
        orderUpdates: true,
        appointmentReminders: true,
        promotionalOffers: true,
        productUpdates: true,
      });

    expect(res.status).toBe(200);
    expect(res.body.data.emailMarketing).toBe(true);
    expect(res.body.data.smsMarketing).toBe(true);
    expect(res.body.data.newsletter).toBe(true);
  });

  it('disables SMS marketing only', async () => {
    const res = await request(app)
      .patch('/v1/customers/notification-preferences')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({ smsMarketing: false });

    expect(res.status).toBe(200);
    expect(res.body.data.smsMarketing).toBe(false);
    expect(res.body.data.emailMarketing).toBe(true);
  });

  it('performs global opt-out from all marketing', async () => {
    const res = await request(app)
      .post('/v1/customers/notification-preferences/opt-out')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({ channel: 'ALL_MARKETING' });

    expect(res.status).toBe(200);
    expect(res.body.data.emailMarketing).toBe(false);
    expect(res.body.data.smsMarketing).toBe(false);
    expect(res.body.data.pushMarketing).toBe(false);
    expect(res.body.data.newsletter).toBe(false);
    expect(res.body.data.promotionalOffers).toBe(false);
  });

  it('still receives transactional notifications after marketing opt-out', async () => {
    const res = await request(app)
      .get('/v1/customers/notification-preferences')
      .set('Authorization', `Bearer ${customerToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.orderUpdates).toBe(true);
    expect(res.body.data.appointmentReminders).toBe(true);
  });

  it('opts back into newsletter only', async () => {
    const res = await request(app)
      .patch('/v1/customers/notification-preferences')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({ newsletter: true });

    expect(res.status).toBe(200);
    expect(res.body.data.newsletter).toBe(true);
    expect(res.body.data.emailMarketing).toBe(false);
  });

  it('opts out of appointment reminders', async () => {
    const res = await request(app)
      .patch('/v1/customers/notification-preferences')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({ appointmentReminders: false });

    expect(res.status).toBe(200);
    expect(res.body.data.appointmentReminders).toBe(false);
  });

  it('updates email channel preference', async () => {
    const res = await request(app)
      .put('/v1/customers/notification-preferences')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({
        emailMarketing: false,
        smsMarketing: false,
        pushMarketing: true,
        newsletter: false,
        orderUpdates: true,
        appointmentReminders: true,
        promotionalOffers: false,
        productUpdates: false,
        preferredChannel: 'PUSH',
      });

    expect(res.status).toBe(200);
    expect(res.body.data.preferredChannel).toBe('PUSH');
    expect(res.body.data.pushMarketing).toBe(true);
  });

  it('rejects unknown notification type in PATCH', async () => {
    const res = await request(app)
      .patch('/v1/customers/notification-preferences')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({ unknownPreference: true });

    expect(res.status).toBe(422);
  });

  it('returns 401 without auth token', async () => {
    const res = await request(app).get('/v1/customers/notification-preferences');
    expect(res.status).toBe(401);
  });
});