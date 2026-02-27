import supertest from 'supertest';
import { createApp } from '../../src/app';
import { prisma } from '../../src/infrastructure/db/prisma.client';

const app = createApp();
const request = supertest(app);

describe('E2E: Appointment Book Flow', () => {
  let userToken: string;
  let availableSlotId: string;
  let createdAppointmentId: string;

  beforeAll(async () => {
    userToken = process.env.E2E_USER_TOKEN!;
    const consultantId = process.env.E2E_CONSULTANT_ID!;

    const slot = await prisma.timeSlot.findFirst({
      where: { consultantId, isAvailable: true },
    });
    availableSlotId = slot!.id;
  });

  it('Step 1: User views available appointment types', async () => {
    const res = await request.get('/v1/service-types/public');

    expect(res.status).toBe(200);
    expect(res.body.data.length).toBeGreaterThanOrEqual(3);

    const types = res.body.data.map((s: any) => s.type);
    expect(types).toContain('HOME_MEASUREMENT');
    expect(types).toContain('ONLINE');
    expect(types).toContain('SHOWROOM');
  });

  it('Step 2: User views available time slots for a consultant', async () => {
    const consultantId = process.env.E2E_CONSULTANT_ID!;
    const from = new Date().toISOString().split('T')[0];
    const to = new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0];

    const res = await request
      .get('/v1/time-slots/available')
      .query({ consultantId, from, to });

    expect(res.status).toBe(200);
    expect(res.body.data.length).toBeGreaterThan(0);
    res.body.data.forEach((slot: any) => {
      expect(slot.isAvailable).toBe(true);
    });
  });

  it('Step 3: User selects a kitchen-only home measurement appointment', async () => {
    const res = await request
      .post('/v1/appointments')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        type: 'HOME_MEASUREMENT',
        timeSlotId: availableSlotId,
        forKitchen: true,
        forBedroom: false,
        customerName: 'Jane Smith',
        customerPhone: '07911123456',
        customerEmail: 'jane.smith@example.com',
        customerPostcode: 'SW4 8AB',
        customerAddress: '10 Clapham High Street, London',
        notes: 'Interested in luna range',
      });

    expect(res.status).toBe(201);
    expect(res.body.data).toMatchObject({
      type: 'HOME_MEASUREMENT',
      status: 'PENDING',
      forKitchen: true,
      forBedroom: false,
    });
    createdAppointmentId = res.body.data.id;
  });

  it('Step 4: Booked slot is marked as unavailable', async () => {
    const slot = await prisma.timeSlot.findUnique({ where: { id: availableSlotId } });
    expect(slot?.isAvailable).toBe(false);
  });

  it('Step 5: User views their own booking', async () => {
    const res = await request
      .get(`/v1/appointments/${createdAppointmentId}`)
      .set('Authorization', `Bearer ${userToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.id).toBe(createdAppointmentId);
    expect(res.body.data.customerEmail).toBe('jane.smith@example.com');
  });

  it('Step 6: User receives booking confirmation (acknowledgement email trigger)', async () => {
    const appointment = await prisma.appointment.findUnique({
      where: { id: createdAppointmentId },
    });
    expect(appointment?.acknowledgedEmailSentAt).not.toBeNull();
  });

  it('Step 7: Attempting to book the same slot fails with 409', async () => {
    const res = await request
      .post('/v1/appointments')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        type: 'HOME_MEASUREMENT',
        timeSlotId: availableSlotId,
        forKitchen: true,
        forBedroom: false,
        customerName: 'Another User',
        customerPhone: '07911999999',
        customerEmail: 'another@example.com',
        customerPostcode: 'SW4 9AB',
        customerAddress: '20 Clapham Road, London',
      });

    expect(res.status).toBe(409);
    expect(res.body.message).toMatch(/slot/i);
  });

  it('Step 8: User sees appointment in their bookings list', async () => {
    const res = await request
      .get('/v1/bookings/my-bookings')
      .set('Authorization', `Bearer ${userToken}`);

    expect(res.status).toBe(200);
    const ids = res.body.data.map((b: any) => b.id);
    expect(ids).toContain(createdAppointmentId);
  });
});

describe('E2E: Kitchen and Bedroom Dual Booking Flow', () => {
  let userToken: string;
  let slotId: string;
  let dualAppointmentId: string;

  beforeAll(async () => {
    userToken = process.env.E2E_USER_TOKEN!;
    const consultantId = process.env.E2E_CONSULTANT_ID!;

    const slot = await prisma.timeSlot.findFirst({
      where: { consultantId, isAvailable: true },
    });
    slotId = slot!.id;
  });

  it('Step 1: User books for both kitchen and bedroom', async () => {
    const res = await request
      .post('/v1/appointments')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        type: 'HOME_MEASUREMENT',
        timeSlotId: slotId,
        forKitchen: true,
        forBedroom: true,
        customerName: 'John Doe',
        customerPhone: '07700900000',
        customerEmail: 'john.doe@example.com',
        customerPostcode: 'EC1A 1BB',
        customerAddress: '1 Example Road, London',
      });

    expect(res.status).toBe(201);
    expect(res.body.data.forKitchen).toBe(true);
    expect(res.body.data.forBedroom).toBe(true);
    dualAppointmentId = res.body.data.id;
  });

  it('Step 2: Internal mail notification is triggered for dual booking', async () => {
    const appointment = await prisma.appointment.findUnique({
      where: { id: dualAppointmentId },
    });
    expect(appointment?.internalNotificationSentAt).not.toBeNull();
  });

  it('Step 3: Booking appears in admin appointment table', async () => {
    const adminToken = process.env.E2E_ADMIN_TOKEN!;

    const res = await request
      .get('/v1/appointments')
      .set('Authorization', `Bearer ${adminToken}`)
      .query({ forKitchen: true, forBedroom: true });

    expect(res.status).toBe(200);
    const ids = res.body.data.map((a: any) => a.id);
    expect(ids).toContain(dualAppointmentId);
  });
});