import supertest from 'supertest';
import { createApp } from '../../src/app';
import { prisma } from '../../src/infrastructure/db/prisma.client';

const app = createApp();
const request = supertest(app);

describe('E2E: Slot Conflict Detection Flow', () => {
  let userToken: string;
  let adminToken: string;
  let consultantId: string;
  let contestedSlotId: string;
  let firstAppointmentId: string;

  beforeAll(async () => {
    userToken = process.env.E2E_USER_TOKEN!;
    adminToken = process.env.E2E_ADMIN_TOKEN!;
    consultantId = process.env.E2E_CONSULTANT_ID!;

    const slot = await prisma.timeSlot.findFirst({
      where: { consultantId, isAvailable: true },
      orderBy: { startTime: 'asc' },
    });
    contestedSlotId = slot!.id;
  });

  it('Step 1: First user successfully books the contested slot', async () => {
    const res = await request
      .post('/v1/appointments')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        type: 'ONLINE',
        timeSlotId: contestedSlotId,
        forKitchen: true,
        forBedroom: false,
        customerName: 'First Claimant',
        customerPhone: '07900000010',
        customerEmail: 'first.claimant@example.com',
        customerPostcode: 'EC2A 3AT',
        customerAddress: '1 Silicon Roundabout, London',
      });

    expect(res.status).toBe(201);
    firstAppointmentId = res.body.data.id;
  });

  it('Step 2: Second booking attempt on the same slot returns 409', async () => {
    const res = await request
      .post('/v1/appointments')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        type: 'ONLINE',
        timeSlotId: contestedSlotId,
        forKitchen: true,
        forBedroom: false,
        customerName: 'Second Claimant',
        customerPhone: '07900000011',
        customerEmail: 'second.claimant@example.com',
        customerPostcode: 'EC2A 3AU',
        customerAddress: '2 Silicon Roundabout, London',
      });

    expect(res.status).toBe(409);
    expect(res.body.message).toMatch(/slot.*unavailable|already booked/i);
  });

  it('Step 3: Third booking attempt also returns 409', async () => {
    const res = await request
      .post('/v1/appointments')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        type: 'HOME_MEASUREMENT',
        timeSlotId: contestedSlotId,
        forKitchen: false,
        forBedroom: true,
        customerName: 'Third Claimant',
        customerPhone: '07900000012',
        customerEmail: 'third.claimant@example.com',
        customerPostcode: 'EC2A 3AV',
        customerAddress: '3 Silicon Roundabout, London',
      });

    expect(res.status).toBe(409);
  });

  it('Step 4: Admin cannot force-book a taken slot via PATCH', async () => {
    const slot = await prisma.timeSlot.findUnique({ where: { id: contestedSlotId } });
    expect(slot?.isAvailable).toBe(false);

    const res = await request
      .patch(`/v1/time-slots/${contestedSlotId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ isAvailable: true, forceOverride: false });

    const updatedSlot = await prisma.timeSlot.findUnique({ where: { id: contestedSlotId } });
    expect(updatedSlot?.isAvailable).toBe(false);
  });

  it('Step 5: After cancellation, slot becomes available again', async () => {
    await request
      .post('/v1/cancellations')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        appointmentId: firstAppointmentId,
        reason: 'Testing slot re-availability after cancellation',
      });

    const slot = await prisma.timeSlot.findUnique({ where: { id: contestedSlotId } });
    expect(slot?.isAvailable).toBe(true);
  });

  it('Step 6: Slot can now be booked by a different user', async () => {
    const res = await request
      .post('/v1/appointments')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        type: 'ONLINE',
        timeSlotId: contestedSlotId,
        forKitchen: true,
        forBedroom: false,
        customerName: 'New Claimant Post-Cancel',
        customerPhone: '07900000013',
        customerEmail: 'new.claimant@example.com',
        customerPostcode: 'EC2A 3AW',
        customerAddress: '4 Silicon Roundabout, London',
      });

    expect(res.status).toBe(201);
  });

  it('Step 7: Admin creating overlapping time slots returns 400', async () => {
    const startTime = new Date(Date.now() + 5 * 86400000);
    startTime.setHours(10, 0, 0, 0);
    const endTime = new Date(startTime.getTime() + 60 * 60 * 1000);

    await request
      .post('/v1/time-slots')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        consultantId,
        startTime: startTime.toISOString(),
        endTime: endTime.toISOString(),
      });

    const overlapStart = new Date(startTime.getTime() + 30 * 60 * 1000);
    const overlapEnd = new Date(overlapStart.getTime() + 60 * 60 * 1000);

    const res = await request
      .post('/v1/time-slots')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        consultantId,
        startTime: overlapStart.toISOString(),
        endTime: overlapEnd.toISOString(),
      });

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/overlap/i);
  });

  it('Step 8: Deleting a booked time slot is rejected with 409', async () => {
    const slot = await prisma.timeSlot.findFirst({
      where: { consultantId, isAvailable: false },
    });

    const res = await request
      .delete(`/v1/time-slots/${slot!.id}`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(409);
    expect(res.body.message).toMatch(/booked/i);
  });

  it('Step 9: Bulk slot creation does not allow overlapping entries within the batch', async () => {
    const batchStart = new Date(Date.now() + 10 * 86400000);
    batchStart.setHours(14, 0, 0, 0);

    const res = await request
      .post('/v1/time-slots/bulk')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        consultantId,
        slots: [
          {
            startTime: batchStart.toISOString(),
            endTime: new Date(batchStart.getTime() + 60 * 60 * 1000).toISOString(),
          },
          {
            startTime: new Date(batchStart.getTime() + 30 * 60 * 1000).toISOString(),
            endTime: new Date(batchStart.getTime() + 90 * 60 * 1000).toISOString(),
          },
        ],
      });

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/overlap/i);
  });

  it('Step 10: Marking a booked slot unavailable via PATCH is rejected', async () => {
    const bookedSlot = await prisma.timeSlot.findFirst({
      where: { consultantId, isAvailable: false },
    });

    const res = await request
      .patch(`/v1/time-slots/${bookedSlot!.id}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ isAvailable: false });

    expect(res.status).toBe(409);
    expect(res.body.message).toMatch(/booked/i);
  });
});