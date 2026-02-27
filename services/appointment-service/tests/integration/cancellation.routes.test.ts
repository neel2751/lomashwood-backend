import supertest from 'supertest';
import { createApp } from '../../src/app';
import { prisma } from '../../src/infrastructure/db/prisma.client';
import { redis } from '../../src/infrastructure/cache/redis.client';
import { generateAdminToken, generateUserToken } from '../../src/tests-helpers/factories';
import { cancellationsFixture } from '../fixtures/cancellations.fixture';
import { consultantFixtures } from '../fixtures/consultants.fixture';
import { timeSlotFixtures } from '../fixtures/time-slots.fixture';
import { bookingsFixture } from '../fixtures/bookings.fixture';

const app = createApp();
const request = supertest(app);

let adminToken: string;
let userToken: string;
let consultantId: string;
let bookingId: string;
let cancellationId: string;

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
    data: bookingsFixture.raw({ timeSlotId: slot.id }),
  });
  bookingId = booking.id;
});

afterAll(async () => {
  await prisma.cancellation.deleteMany();
  await prisma.booking.deleteMany();
  await prisma.timeSlot.deleteMany();
  await prisma.consultant.deleteMany();
  await prisma.$disconnect();
  await redis.quit();
});

describe('POST /v1/cancellations', () => {
  it('should cancel a booking with a reason', async () => {
    const payload = cancellationsFixture.createPayload({
      bookingId,
      reason: 'Customer requested cancellation',
    });

    const res = await request
      .post('/v1/cancellations')
      .set('Authorization', `Bearer ${userToken}`)
      .send(payload);

    expect(res.status).toBe(201);
    expect(res.body.data).toMatchObject({
      bookingId,
      reason: 'Customer requested cancellation',
    });
    cancellationId = res.body.data.id;
  });

  it('should return 400 when cancellation reason is missing', async () => {
    const slot = await prisma.timeSlot.create({
      data: timeSlotFixtures.available({ consultantId }),
    });
    const booking = await prisma.booking.create({
      data: bookingsFixture.raw({ timeSlotId: slot.id }),
    });

    const res = await request
      .post('/v1/cancellations')
      .set('Authorization', `Bearer ${userToken}`)
      .send({ bookingId: booking.id });

    expect(res.status).toBe(400);
    expect(res.body.errors).toBeDefined();
  });

  it('should return 404 when booking does not exist', async () => {
    const payload = cancellationsFixture.createPayload({
      bookingId: 'nonexistent-booking',
      reason: 'Does not exist',
    });

    const res = await request
      .post('/v1/cancellations')
      .set('Authorization', `Bearer ${userToken}`)
      .send(payload);

    expect(res.status).toBe(404);
  });

  it('should return 409 when booking is already cancelled', async () => {
    const slot = await prisma.timeSlot.create({
      data: timeSlotFixtures.available({ consultantId }),
    });
    const booking = await prisma.booking.create({
      data: bookingsFixture.raw({ timeSlotId: slot.id, status: 'CANCELLED' }),
    });

    const payload = cancellationsFixture.createPayload({
      bookingId: booking.id,
      reason: 'Already cancelled',
    });

    const res = await request
      .post('/v1/cancellations')
      .set('Authorization', `Bearer ${userToken}`)
      .send(payload);

    expect(res.status).toBe(409);
    expect(res.body.message).toMatch(/already cancelled/i);
  });

  it('should return 403 when user tries to cancel another users booking', async () => {
    const slot = await prisma.timeSlot.create({
      data: timeSlotFixtures.available({ consultantId }),
    });
    const booking = await prisma.booking.create({
      data: bookingsFixture.raw({ timeSlotId: slot.id, userId: 'other-user-id' }),
    });

    const payload = cancellationsFixture.createPayload({
      bookingId: booking.id,
      reason: 'Unauthorized',
    });

    const res = await request
      .post('/v1/cancellations')
      .set('Authorization', `Bearer ${userToken}`)
      .send(payload);

    expect(res.status).toBe(403);
  });

  it('should return 401 for unauthenticated request', async () => {
    const res = await request
      .post('/v1/cancellations')
      .send(cancellationsFixture.createPayload({ bookingId, reason: 'Test' }));

    expect(res.status).toBe(401);
  });

  it('should free up the time slot after cancellation', async () => {
    const slot = await prisma.timeSlot.create({
      data: timeSlotFixtures.booked({ consultantId }),
    });
    const booking = await prisma.booking.create({
      data: bookingsFixture.raw({ timeSlotId: slot.id }),
    });

    await request
      .post('/v1/cancellations')
      .set('Authorization', `Bearer ${adminToken}`)
      .send(cancellationsFixture.createPayload({ bookingId: booking.id, reason: 'Admin cancel' }));

    const updatedSlot = await prisma.timeSlot.findUnique({ where: { id: slot.id } });
    expect(updatedSlot?.isAvailable).toBe(true);
  });
});

describe('GET /v1/cancellations', () => {
  it('should return paginated cancellations for admin', async () => {
    const res = await request
      .get('/v1/cancellations')
      .set('Authorization', `Bearer ${adminToken}`)
      .query({ page: 1, limit: 10 });

    expect(res.status).toBe(200);
    expect(res.body.data).toBeInstanceOf(Array);
    expect(res.body.meta).toMatchObject({ page: 1, limit: 10 });
  });

  it('should return 403 for non-admin listing', async () => {
    const res = await request
      .get('/v1/cancellations')
      .set('Authorization', `Bearer ${userToken}`);

    expect(res.status).toBe(403);
  });

  it('should filter cancellations by date range', async () => {
    const from = new Date(Date.now() - 86400000).toISOString();
    const to = new Date().toISOString();

    const res = await request
      .get('/v1/cancellations')
      .set('Authorization', `Bearer ${adminToken}`)
      .query({ from, to });

    expect(res.status).toBe(200);
  });
});

describe('GET /v1/cancellations/:id', () => {
  it('should return cancellation by id for admin', async () => {
    const res = await request
      .get(`/v1/cancellations/${cancellationId}`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.id).toBe(cancellationId);
  });

  it('should return cancellation for the owning user', async () => {
    const res = await request
      .get(`/v1/cancellations/${cancellationId}`)
      .set('Authorization', `Bearer ${userToken}`);

    expect(res.status).toBe(200);
  });

  it('should return 404 for non-existent cancellation', async () => {
    const res = await request
      .get('/v1/cancellations/nonexistent-id')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(404);
  });
});