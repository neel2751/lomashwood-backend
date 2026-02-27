import supertest from 'supertest';
import { createApp } from '../../src/app';
import { prisma } from '../../src/infrastructure/db/prisma.client';

const app = createApp();
const request = supertest(app);

describe('E2E: Appointment Cancel Flow', () => {
  let userToken: string;
  let adminToken: string;
  let slotId: string;
  let appointmentId: string;
  let cancellationId: string;

  beforeAll(async () => {
    userToken = process.env.E2E_USER_TOKEN!;
    adminToken = process.env.E2E_ADMIN_TOKEN!;
    const consultantId = process.env.E2E_CONSULTANT_ID!;

    const slot = await prisma.timeSlot.findFirst({
      where: { consultantId, isAvailable: true },
      orderBy: { startTime: 'asc' },
    });
    slotId = slot!.id;

    const res = await request
      .post('/v1/appointments')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        type: 'SHOWROOM',
        timeSlotId: slotId,
        forKitchen: false,
        forBedroom: true,
        customerName: 'Cancel Test User',
        customerPhone: '07922333444',
        customerEmail: 'cancel.test@example.com',
        customerPostcode: 'W1T 1JY',
        customerAddress: '42 Tottenham Court Rd, London',
        locationId: process.env.E2E_LOCATION_ID,
      });

    appointmentId = res.body.data.id;
  });

  it('Step 1: Slot is booked and unavailable before cancellation', async () => {
    const slot = await prisma.timeSlot.findUnique({ where: { id: slotId } });
    expect(slot?.isAvailable).toBe(false);
  });

  it('Step 2: User submits a cancellation with a reason', async () => {
    const res = await request
      .post('/v1/cancellations')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        appointmentId,
        reason: 'Change of plans, no longer require a consultation',
      });

    expect(res.status).toBe(201);
    expect(res.body.data).toMatchObject({
      appointmentId,
      status: 'CANCELLED',
    });
    cancellationId = res.body.data.id;
  });

  it('Step 3: Appointment status is CANCELLED after cancellation', async () => {
    const appointment = await prisma.appointment.findUnique({ where: { id: appointmentId } });
    expect(appointment?.status).toBe('CANCELLED');
  });

  it('Step 4: Freed slot becomes available again', async () => {
    const slot = await prisma.timeSlot.findUnique({ where: { id: slotId } });
    expect(slot?.isAvailable).toBe(true);
  });

  it('Step 5: Cancellation record contains reason and timestamp', async () => {
    const res = await request
      .get(`/v1/cancellations/${cancellationId}`)
      .set('Authorization', `Bearer ${userToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.reason).toBe('Change of plans, no longer require a consultation');
    expect(res.body.data.cancelledAt).not.toBeNull();
  });

  it('Step 6: Cancellation without reason returns 400', async () => {
    const anotherSlot = await prisma.timeSlot.findFirst({ where: { isAvailable: true } });

    const bookRes = await request
      .post('/v1/appointments')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        type: 'ONLINE',
        timeSlotId: anotherSlot!.id,
        forKitchen: true,
        forBedroom: false,
        customerName: 'No Reason User',
        customerPhone: '07933444555',
        customerEmail: 'noreason@example.com',
        customerPostcode: 'E1 6RF',
        customerAddress: '10 Brick Lane, London',
      });

    const res = await request
      .post('/v1/cancellations')
      .set('Authorization', `Bearer ${userToken}`)
      .send({ appointmentId: bookRes.body.data.id });

    expect(res.status).toBe(400);
    expect(res.body.errors).toBeDefined();
  });

  it('Step 7: Cancelling an already-cancelled appointment returns 409', async () => {
    const res = await request
      .post('/v1/cancellations')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        appointmentId,
        reason: 'Trying to cancel twice',
      });

    expect(res.status).toBe(409);
    expect(res.body.message).toMatch(/already cancelled/i);
  });

  it('Step 8: Another user cannot cancel this appointment', async () => {
    const anotherSlot = await prisma.timeSlot.findFirst({ where: { isAvailable: true } });

    const bookRes = await request
      .post('/v1/appointments')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        type: 'HOME_MEASUREMENT',
        timeSlotId: anotherSlot!.id,
        forKitchen: true,
        forBedroom: false,
        customerName: 'Protected User',
        customerPhone: '07944555666',
        customerEmail: 'protected@example.com',
        customerPostcode: 'SE1 7PB',
        customerAddress: '1 Waterloo Rd, London',
      });

    const otherUserToken = await generateOtherUserToken();

    const res = await request
      .post('/v1/cancellations')
      .set('Authorization', `Bearer ${otherUserToken}`)
      .send({
        appointmentId: bookRes.body.data.id,
        reason: 'Trying to cancel someone elses booking',
      });

    expect(res.status).toBe(403);
  });

  it('Step 9: Admin can view cancellation in admin list with date filter', async () => {
    const today = new Date().toISOString().split('T')[0];

    const res = await request
      .get('/v1/cancellations')
      .set('Authorization', `Bearer ${adminToken}`)
      .query({ from: today });

    expect(res.status).toBe(200);
    const ids = res.body.data.map((c: any) => c.id);
    expect(ids).toContain(cancellationId);
  });

  it('Step 10: Unauthenticated cancellation request returns 401', async () => {
    const res = await request
      .post('/v1/cancellations')
      .send({ appointmentId, reason: 'No auth' });

    expect(res.status).toBe(401);
  });
});

async function generateOtherUserToken(): Promise<string> {
  const { generateUserToken } = await import('../../src/tests-helpers/factories');
  return generateUserToken({ userId: 'other-cancel-user-e2e' });
}