import supertest from 'supertest';
import { createApp } from '../../src/app';
import { prisma } from '../../src/infrastructure/db/prisma.client';
import { redis } from '../../src/infrastructure/cache/redis.client';
import { generateAdminToken, generateUserToken } from '../../src/tests-helpers/factories';
import { rescheduelsFixture } from '../fixtures/reschedules.fixture';
import { consultantFixtures } from '../fixtures/consultants.fixture';
import { timeSlotFixtures } from '../fixtures/time-slots.fixture';
import { bookingsFixture } from '../fixtures/bookings.fixture';

const app = createApp();
const request = supertest(app);

let adminToken: string;
let userToken: string;
let consultantId: string;
let originalSlotId: string;
let newSlotId: string;
let bookingId: string;
let rescheduleId: string;

beforeAll(async () => {
  await prisma.$connect();
  adminToken = await generateAdminToken();
  userToken = await generateUserToken();

  const consultant = await prisma.consultant.create({ data: consultantFixtures.active() });
  consultantId = consultant.id;

  const originalSlot = await prisma.timeSlot.create({
    data: timeSlotFixtures.booked({ consultantId }),
  });
  originalSlotId = originalSlot.id;

  const newSlot = await prisma.timeSlot.create({
    data: timeSlotFixtures.available({ consultantId }),
  });
  newSlotId = newSlot.id;

  const booking = await prisma.booking.create({
    data: bookingsFixture.raw({ timeSlotId: originalSlotId, status: 'CONFIRMED' }),
  });
  bookingId = booking.id;
});

afterAll(async () => {
  await prisma.reschedule.deleteMany();
  await prisma.booking.deleteMany();
  await prisma.timeSlot.deleteMany();
  await prisma.consultant.deleteMany();
  await prisma.$disconnect();
  await redis.quit();
});

describe('POST /v1/reschedules', () => {
  it('should reschedule a booking to a new time slot', async () => {
    const payload = rescheduelsFixture.createPayload({
      bookingId,
      newTimeSlotId: newSlotId,
      reason: 'Customer request',
    });

    const res = await request
      .post('/v1/reschedules')
      .set('Authorization', `Bearer ${userToken}`)
      .send(payload);

    expect(res.status).toBe(201);
    expect(res.body.data).toMatchObject({
      bookingId,
      newTimeSlotId: newSlotId,
    });
    rescheduleId = res.body.data.id;
  });

  it('should mark old slot as available after reschedule', async () => {
    const oldSlot = await prisma.timeSlot.findUnique({ where: { id: originalSlotId } });
    expect(oldSlot?.isAvailable).toBe(true);
  });

  it('should mark new slot as booked after reschedule', async () => {
    const newSlot = await prisma.timeSlot.findUnique({ where: { id: newSlotId } });
    expect(newSlot?.isAvailable).toBe(false);
  });

  it('should return 400 when new slot is already booked', async () => {
    const anotherSlot = await prisma.timeSlot.create({
      data: timeSlotFixtures.available({ consultantId }),
    });
    const anotherBooking = await prisma.booking.create({
      data: bookingsFixture.raw({ timeSlotId: anotherSlot.id }),
    });

    const payload = rescheduelsFixture.createPayload({
      bookingId: anotherBooking.id,
      newTimeSlotId: newSlotId,
      reason: 'Conflict test',
    });

    const res = await request
      .post('/v1/reschedules')
      .set('Authorization', `Bearer ${userToken}`)
      .send(payload);

    expect(res.status).toBe(409);
    expect(res.body.message).toMatch(/slot/i);
  });

  it('should return 400 when reason is missing', async () => {
    const slot = await prisma.timeSlot.create({
      data: timeSlotFixtures.available({ consultantId }),
    });

    const res = await request
      .post('/v1/reschedules')
      .set('Authorization', `Bearer ${userToken}`)
      .send({ bookingId, newTimeSlotId: slot.id });

    expect(res.status).toBe(400);
    expect(res.body.errors).toBeDefined();
  });

  it('should return 404 when booking does not exist', async () => {
    const slot = await prisma.timeSlot.create({
      data: timeSlotFixtures.available({ consultantId }),
    });

    const payload = rescheduelsFixture.createPayload({
      bookingId: 'nonexistent-booking',
      newTimeSlotId: slot.id,
      reason: 'Test',
    });

    const res = await request
      .post('/v1/reschedules')
      .set('Authorization', `Bearer ${userToken}`)
      .send(payload);

    expect(res.status).toBe(404);
  });

  it('should return 404 when new time slot does not exist', async () => {
    const payload = rescheduelsFixture.createPayload({
      bookingId,
      newTimeSlotId: 'nonexistent-slot',
      reason: 'Test',
    });

    const res = await request
      .post('/v1/reschedules')
      .set('Authorization', `Bearer ${userToken}`)
      .send(payload);

    expect(res.status).toBe(404);
  });

  it('should return 409 for booking that is already cancelled', async () => {
    const slot = await prisma.timeSlot.create({
      data: timeSlotFixtures.available({ consultantId }),
    });
    const cancelledBooking = await prisma.booking.create({
      data: bookingsFixture.raw({ timeSlotId: slot.id, status: 'CANCELLED' }),
    });
    const freeSlot = await prisma.timeSlot.create({
      data: timeSlotFixtures.available({ consultantId }),
    });

    const payload = rescheduelsFixture.createPayload({
      bookingId: cancelledBooking.id,
      newTimeSlotId: freeSlot.id,
      reason: 'Test',
    });

    const res = await request
      .post('/v1/reschedules')
      .set('Authorization', `Bearer ${userToken}`)
      .send(payload);

    expect(res.status).toBe(409);
  });

  it('should return 403 when user tries to reschedule another users booking', async () => {
    const slot = await prisma.timeSlot.create({
      data: timeSlotFixtures.available({ consultantId }),
    });
    const freeSlot = await prisma.timeSlot.create({
      data: timeSlotFixtures.available({ consultantId }),
    });
    const otherBooking = await prisma.booking.create({
      data: bookingsFixture.raw({ timeSlotId: slot.id, userId: 'other-user-id' }),
    });

    const payload = rescheduelsFixture.createPayload({
      bookingId: otherBooking.id,
      newTimeSlotId: freeSlot.id,
      reason: 'Unauthorized',
    });

    const res = await request
      .post('/v1/reschedules')
      .set('Authorization', `Bearer ${userToken}`)
      .send(payload);

    expect(res.status).toBe(403);
  });

  it('should return 401 for unauthenticated request', async () => {
    const slot = await prisma.timeSlot.create({
      data: timeSlotFixtures.available({ consultantId }),
    });

    const res = await request.post('/v1/reschedules').send(
      rescheduelsFixture.createPayload({ bookingId, newTimeSlotId: slot.id, reason: 'Test' })
    );

    expect(res.status).toBe(401);
  });
});

describe('GET /v1/reschedules', () => {
  it('should return paginated reschedules for admin', async () => {
    const res = await request
      .get('/v1/reschedules')
      .set('Authorization', `Bearer ${adminToken}`)
      .query({ page: 1, limit: 10 });

    expect(res.status).toBe(200);
    expect(res.body.data).toBeInstanceOf(Array);
    expect(res.body.meta).toMatchObject({ page: 1, limit: 10 });
  });

  it('should return 403 for non-admin listing', async () => {
    const res = await request
      .get('/v1/reschedules')
      .set('Authorization', `Bearer ${userToken}`);

    expect(res.status).toBe(403);
  });

  it('should filter by bookingId', async () => {
    const res = await request
      .get('/v1/reschedules')
      .set('Authorization', `Bearer ${adminToken}`)
      .query({ bookingId });

    expect(res.status).toBe(200);
    res.body.data.forEach((r: any) => {
      expect(r.bookingId).toBe(bookingId);
    });
  });
});

describe('GET /v1/reschedules/:id', () => {
  it('should return reschedule by id for admin', async () => {
    const res = await request
      .get(`/v1/reschedules/${rescheduleId}`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.id).toBe(rescheduleId);
  });

  it('should return reschedule for the owning user', async () => {
    const res = await request
      .get(`/v1/reschedules/${rescheduleId}`)
      .set('Authorization', `Bearer ${userToken}`);

    expect(res.status).toBe(200);
  });

  it('should return 404 for non-existent reschedule', async () => {
    const res = await request
      .get('/v1/reschedules/nonexistent-id')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(404);
  });
});