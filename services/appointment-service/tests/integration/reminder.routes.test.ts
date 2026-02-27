import supertest from 'supertest';
import { createApp } from '../../src/app';
import { prisma } from '../../src/infrastructure/db/prisma.client';
import { redis } from '../../src/infrastructure/cache/redis.client';
import { generateAdminToken, generateUserToken } from '../../src/tests-helpers/factories';
import { remindersFixture } from '../fixtures/reminders.fixture';
import { consultantFixtures } from '../fixtures/consultants.fixture';
import { timeSlotFixtures } from '../fixtures/time-slots.fixture';
import { bookingsFixture } from '../fixtures/bookings.fixture';

const app = createApp();
const request = supertest(app);

let adminToken: string;
let userToken: string;
let consultantId: string;
let bookingId: string;
let reminderId: string;

beforeAll(async () => {
  await prisma.$connect();
  adminToken = await generateAdminToken();
  userToken = await generateUserToken();

  const consultant = await prisma.consultant.create({ data: consultantFixtures.active() });
  consultantId = consultant.id;

  const slot = await prisma.timeSlot.create({
    data: timeSlotFixtures.available({ consultantId }),
  });

  const booking = await prisma.booking.create({
    data: bookingsFixture.raw({ timeSlotId: slot.id, status: 'CONFIRMED' }),
  });
  bookingId = booking.id;
});

afterAll(async () => {
  await prisma.reminder.deleteMany();
  await prisma.booking.deleteMany();
  await prisma.timeSlot.deleteMany();
  await prisma.consultant.deleteMany();
  await prisma.$disconnect();
  await redis.quit();
});

describe('POST /v1/reminders', () => {
  it('should create an email reminder for a booking', async () => {
    const payload = remindersFixture.createPayload({
      bookingId,
      channel: 'EMAIL',
      scheduledAt: new Date(Date.now() + 3600000).toISOString(),
    });

    const res = await request
      .post('/v1/reminders')
      .set('Authorization', `Bearer ${adminToken}`)
      .send(payload);

    expect(res.status).toBe(201);
    expect(res.body.data).toMatchObject({
      bookingId,
      channel: 'EMAIL',
      status: 'PENDING',
    });
    reminderId = res.body.data.id;
  });

  it('should create an SMS reminder', async () => {
    const payload = remindersFixture.createPayload({
      bookingId,
      channel: 'SMS',
      scheduledAt: new Date(Date.now() + 7200000).toISOString(),
    });

    const res = await request
      .post('/v1/reminders')
      .set('Authorization', `Bearer ${adminToken}`)
      .send(payload);

    expect(res.status).toBe(201);
    expect(res.body.data.channel).toBe('SMS');
  });

  it('should return 400 for invalid channel', async () => {
    const payload = remindersFixture.createPayload({
      bookingId,
      channel: 'INVALID_CHANNEL' as any,
      scheduledAt: new Date(Date.now() + 3600000).toISOString(),
    });

    const res = await request
      .post('/v1/reminders')
      .set('Authorization', `Bearer ${adminToken}`)
      .send(payload);

    expect(res.status).toBe(400);
  });

  it('should return 400 for past scheduled time', async () => {
    const payload = remindersFixture.createPayload({
      bookingId,
      channel: 'EMAIL',
      scheduledAt: new Date(Date.now() - 3600000).toISOString(),
    });

    const res = await request
      .post('/v1/reminders')
      .set('Authorization', `Bearer ${adminToken}`)
      .send(payload);

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/past/i);
  });

  it('should return 404 when booking does not exist', async () => {
    const payload = remindersFixture.createPayload({
      bookingId: 'nonexistent-booking',
      channel: 'EMAIL',
      scheduledAt: new Date(Date.now() + 3600000).toISOString(),
    });

    const res = await request
      .post('/v1/reminders')
      .set('Authorization', `Bearer ${adminToken}`)
      .send(payload);

    expect(res.status).toBe(404);
  });

  it('should return 400 when scheduledAt is missing', async () => {
    const res = await request
      .post('/v1/reminders')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ bookingId, channel: 'EMAIL' });

    expect(res.status).toBe(400);
  });

  it('should return 403 for non-admin', async () => {
    const payload = remindersFixture.createPayload({
      bookingId,
      channel: 'EMAIL',
      scheduledAt: new Date(Date.now() + 3600000).toISOString(),
    });

    const res = await request
      .post('/v1/reminders')
      .set('Authorization', `Bearer ${userToken}`)
      .send(payload);

    expect(res.status).toBe(403);
  });
});

describe('GET /v1/reminders', () => {
  it('should return paginated reminders for admin', async () => {
    const res = await request
      .get('/v1/reminders')
      .set('Authorization', `Bearer ${adminToken}`)
      .query({ page: 1, limit: 10 });

    expect(res.status).toBe(200);
    expect(res.body.data).toBeInstanceOf(Array);
    expect(res.body.meta).toMatchObject({ page: 1, limit: 10 });
  });

  it('should filter reminders by bookingId', async () => {
    const res = await request
      .get('/v1/reminders')
      .set('Authorization', `Bearer ${adminToken}`)
      .query({ bookingId });

    expect(res.status).toBe(200);
    res.body.data.forEach((r: any) => {
      expect(r.bookingId).toBe(bookingId);
    });
  });

  it('should filter reminders by channel', async () => {
    const res = await request
      .get('/v1/reminders')
      .set('Authorization', `Bearer ${adminToken}`)
      .query({ channel: 'EMAIL' });

    expect(res.status).toBe(200);
    res.body.data.forEach((r: any) => {
      expect(r.channel).toBe('EMAIL');
    });
  });

  it('should filter reminders by status', async () => {
    const res = await request
      .get('/v1/reminders')
      .set('Authorization', `Bearer ${adminToken}`)
      .query({ status: 'PENDING' });

    expect(res.status).toBe(200);
    res.body.data.forEach((r: any) => {
      expect(r.status).toBe('PENDING');
    });
  });

  it('should return 403 for non-admin', async () => {
    const res = await request
      .get('/v1/reminders')
      .set('Authorization', `Bearer ${userToken}`);

    expect(res.status).toBe(403);
  });
});

describe('GET /v1/reminders/:id', () => {
  it('should return reminder by id', async () => {
    const res = await request
      .get(`/v1/reminders/${reminderId}`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.id).toBe(reminderId);
  });

  it('should return 404 for non-existent reminder', async () => {
    const res = await request
      .get('/v1/reminders/nonexistent-id')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(404);
  });
});

describe('PATCH /v1/reminders/:id', () => {
  it('should update reminder scheduled time', async () => {
    const newScheduledAt = new Date(Date.now() + 7200000).toISOString();

    const res = await request
      .patch(`/v1/reminders/${reminderId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ scheduledAt: newScheduledAt });

    expect(res.status).toBe(200);
  });

  it('should cancel a pending reminder', async () => {
    const res = await request
      .patch(`/v1/reminders/${reminderId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ status: 'CANCELLED' });

    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe('CANCELLED');
  });

  it('should return 400 when updating a sent reminder', async () => {
    const sentReminder = await prisma.reminder.create({
      data: remindersFixture.raw({ bookingId, status: 'SENT' }),
    });

    const res = await request
      .patch(`/v1/reminders/${sentReminder.id}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ scheduledAt: new Date(Date.now() + 3600000).toISOString() });

    expect(res.status).toBe(400);
  });

  it('should return 403 for non-admin patch', async () => {
    const res = await request
      .patch(`/v1/reminders/${reminderId}`)
      .set('Authorization', `Bearer ${userToken}`)
      .send({ scheduledAt: new Date(Date.now() + 3600000).toISOString() });

    expect(res.status).toBe(403);
  });
});

describe('DELETE /v1/reminders/:id', () => {
  it('should delete a pending reminder', async () => {
    const reminder = await prisma.reminder.create({
      data: remindersFixture.raw({ bookingId, status: 'PENDING' }),
    });

    const res = await request
      .delete(`/v1/reminders/${reminder.id}`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
  });

  it('should return 400 when deleting a sent reminder', async () => {
    const sentReminder = await prisma.reminder.create({
      data: remindersFixture.raw({ bookingId, status: 'SENT' }),
    });

    const res = await request
      .delete(`/v1/reminders/${sentReminder.id}`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/sent/i);
  });

  it('should return 403 for non-admin delete', async () => {
    const res = await request
      .delete(`/v1/reminders/${reminderId}`)
      .set('Authorization', `Bearer ${userToken}`);

    expect(res.status).toBe(403);
  });
});