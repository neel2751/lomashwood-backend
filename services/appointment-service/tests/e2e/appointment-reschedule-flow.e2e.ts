import supertest from 'supertest';
import { createApp } from '../../src/app';
import { prisma } from '../../src/infrastructure/db/prisma.client';

const app = createApp();
const request = supertest(app);

describe('E2E: Appointment Reschedule Flow', () => {
  let userToken: string;
  let adminToken: string;
  let originalSlotId: string;
  let newSlotId: string;
  let appointmentId: string;
  let rescheduleId: string;

  beforeAll(async () => {
    userToken = process.env.E2E_USER_TOKEN!;
    adminToken = process.env.E2E_ADMIN_TOKEN!;
    const consultantId = process.env.E2E_CONSULTANT_ID!;

    const slots = await prisma.timeSlot.findMany({
      where: { consultantId, isAvailable: true },
      take: 2,
      orderBy: { startTime: 'asc' },
    });

    originalSlotId = slots[0].id;
    newSlotId = slots[1].id;

    const res = await request
      .post('/v1/appointments')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        type: 'ONLINE',
        timeSlotId: originalSlotId,
        forKitchen: true,
        forBedroom: false,
        customerName: 'Reschedule User',
        customerPhone: '07911000001',
        customerEmail: 'reschedule@example.com',
        customerPostcode: 'N1 1AA',
        customerAddress: '5 Islington Lane, London',
      });

    appointmentId = res.body.data.id;
  });

  it('Step 1: Original slot is booked and unavailable', async () => {
    const slot = await prisma.timeSlot.findUnique({ where: { id: originalSlotId } });
    expect(slot?.isAvailable).toBe(false);
  });

  it('Step 2: User requests a reschedule to a new slot', async () => {
    const res = await request
      .post('/v1/reschedules')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        appointmentId,
        newTimeSlotId: newSlotId,
        reason: 'Work schedule changed, need an earlier slot',
      });

    expect(res.status).toBe(201);
    expect(res.body.data).toMatchObject({
      appointmentId,
      newTimeSlotId: newSlotId,
      status: 'PENDING',
    });
    rescheduleId = res.body.data.id;
  });

  it('Step 3: Original slot is freed after reschedule', async () => {
    const slot = await prisma.timeSlot.findUnique({ where: { id: originalSlotId } });
    expect(slot?.isAvailable).toBe(true);
  });

  it('Step 4: New slot is marked as booked', async () => {
    const slot = await prisma.timeSlot.findUnique({ where: { id: newSlotId } });
    expect(slot?.isAvailable).toBe(false);
  });

  it('Step 5: Appointment reflects updated time slot', async () => {
    const appointment = await prisma.appointment.findUnique({
      where: { id: appointmentId },
      include: { timeSlot: true },
    });
    expect(appointment?.timeSlotId).toBe(newSlotId);
  });

  it('Step 6: Reschedule record is viewable by the owning user', async () => {
    const res = await request
      .get(`/v1/reschedules/${rescheduleId}`)
      .set('Authorization', `Bearer ${userToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.id).toBe(rescheduleId);
    expect(res.body.data.reason).toBe('Work schedule changed, need an earlier slot');
  });

  it('Step 7: Admin can view all reschedules for the appointment', async () => {
    const res = await request
      .get('/v1/reschedules')
      .set('Authorization', `Bearer ${adminToken}`)
      .query({ appointmentId });

    expect(res.status).toBe(200);
    const ids = res.body.data.map((r: any) => r.id);
    expect(ids).toContain(rescheduleId);
  });

  it('Step 8: Rescheduling a cancelled appointment returns 409', async () => {
    await prisma.appointment.update({
      where: { id: appointmentId },
      data: { status: 'CANCELLED' },
    });

    const anotherSlot = await prisma.timeSlot.findFirst({
      where: { isAvailable: true },
    });

    const res = await request
      .post('/v1/reschedules')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        appointmentId,
        newTimeSlotId: anotherSlot!.id,
        reason: 'Trying to reschedule a cancelled booking',
      });

    expect(res.status).toBe(409);
    expect(res.body.message).toMatch(/cancelled/i);
  });

  it('Step 9: Another user cannot reschedule this appointment', async () => {
    const otherUserToken = await generateOtherUserToken();

    const slot = await prisma.timeSlot.findFirst({ where: { isAvailable: true } });

    const res = await request
      .post('/v1/reschedules')
      .set('Authorization', `Bearer ${otherUserToken}`)
      .send({
        appointmentId,
        newTimeSlotId: slot!.id,
        reason: 'Unauthorized reschedule attempt',
      });

    expect(res.status).toBe(403);
  });
});

async function generateOtherUserToken(): Promise<string> {
  const { generateUserToken } = await import('../../src/tests-helpers/factories');
  return generateUserToken({ userId: 'other-user-id-e2e' });
}