import supertest from 'supertest';
import { createApp } from '../../src/app';
import { prisma } from '../../src/infrastructure/db/prisma.client';

const app = createApp();
const request = supertest(app);

describe('E2E: Reminder Notification Flow', () => {
  let adminToken: string;
  let userToken: string;
  let appointmentId: string;
  let emailReminderId: string;
  let smsReminderId: string;

  beforeAll(async () => {
    adminToken = process.env.E2E_ADMIN_TOKEN!;
    userToken = process.env.E2E_USER_TOKEN!;
    const consultantId = process.env.E2E_CONSULTANT_ID!;

    const slot = await prisma.timeSlot.findFirst({
      where: { consultantId, isAvailable: true },
      orderBy: { startTime: 'asc' },
    });

    const res = await request
      .post('/v1/appointments')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        type: 'HOME_MEASUREMENT',
        timeSlotId: slot!.id,
        forKitchen: true,
        forBedroom: false,
        customerName: 'Reminder User',
        customerPhone: '07700000002',
        customerEmail: 'reminder@example.com',
        customerPostcode: 'SW1A 1AA',
        customerAddress: '10 Downing St, London',
      });

    appointmentId = res.body.data.id;
  });

  it('Step 1: Admin creates an EMAIL reminder 24 hours before the appointment', async () => {
    const scheduledAt = new Date(Date.now() + 23 * 60 * 60 * 1000).toISOString();

    const res = await request
      .post('/v1/reminders')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        appointmentId,
        channel: 'EMAIL',
        scheduledAt,
      });

    expect(res.status).toBe(201);
    expect(res.body.data).toMatchObject({
      appointmentId,
      channel: 'EMAIL',
      status: 'PENDING',
    });
    emailReminderId = res.body.data.id;
  });

  it('Step 2: Admin creates an SMS reminder 2 hours before the appointment', async () => {
    const scheduledAt = new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString();

    const res = await request
      .post('/v1/reminders')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        appointmentId,
        channel: 'SMS',
        scheduledAt,
      });

    expect(res.status).toBe(201);
    expect(res.body.data).toMatchObject({
      channel: 'SMS',
      status: 'PENDING',
    });
    smsReminderId = res.body.data.id;
  });

  it('Step 3: Creating a reminder scheduled in the past returns 400', async () => {
    const scheduledAt = new Date(Date.now() - 60 * 60 * 1000).toISOString();

    const res = await request
      .post('/v1/reminders')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        appointmentId,
        channel: 'EMAIL',
        scheduledAt,
      });

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/past/i);
  });

  it('Step 4: Admin lists reminders filtered by bookingId', async () => {
    const res = await request
      .get('/v1/reminders')
      .set('Authorization', `Bearer ${adminToken}`)
      .query({ appointmentId });

    expect(res.status).toBe(200);
    expect(res.body.data.length).toBe(2);

    const channels = res.body.data.map((r: any) => r.channel);
    expect(channels).toContain('EMAIL');
    expect(channels).toContain('SMS');
  });

  it('Step 5: Admin lists reminders filtered by channel', async () => {
    const res = await request
      .get('/v1/reminders')
      .set('Authorization', `Bearer ${adminToken}`)
      .query({ channel: 'EMAIL' });

    expect(res.status).toBe(200);
    res.body.data.forEach((r: any) => {
      expect(r.channel).toBe('EMAIL');
    });
  });

  it('Step 6: Admin updates scheduledAt for the EMAIL reminder', async () => {
    const newScheduledAt = new Date(Date.now() + 25 * 60 * 60 * 1000).toISOString();

    const res = await request
      .patch(`/v1/reminders/${emailReminderId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ scheduledAt: newScheduledAt });

    expect(res.status).toBe(200);
    expect(new Date(res.body.data.scheduledAt).toISOString()).toBe(
      new Date(newScheduledAt).toISOString()
    );
  });

  it('Step 7: Admin cancels the SMS reminder (status → CANCELLED)', async () => {
    const res = await request
      .patch(`/v1/reminders/${smsReminderId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ status: 'CANCELLED' });

    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe('CANCELLED');
  });

  it('Step 8: Simulating a SENT reminder — updates are rejected', async () => {
    await prisma.reminder.update({
      where: { id: emailReminderId },
      data: { status: 'SENT', sentAt: new Date() },
    });

    const res = await request
      .patch(`/v1/reminders/${emailReminderId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ scheduledAt: new Date(Date.now() + 30 * 60 * 60 * 1000).toISOString() });

    expect(res.status).toBe(409);
    expect(res.body.message).toMatch(/sent/i);
  });

  it('Step 9: Deleting a SENT reminder is rejected', async () => {
    const res = await request
      .delete(`/v1/reminders/${emailReminderId}`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(409);
    expect(res.body.message).toMatch(/sent/i);
  });

  it('Step 10: Non-admin cannot create, update, or delete reminders', async () => {
    const createRes = await request
      .post('/v1/reminders')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        appointmentId,
        channel: 'EMAIL',
        scheduledAt: new Date(Date.now() + 5 * 60 * 60 * 1000).toISOString(),
      });
    expect(createRes.status).toBe(403);

    const deleteRes = await request
      .delete(`/v1/reminders/${smsReminderId}`)
      .set('Authorization', `Bearer ${userToken}`);
    expect(deleteRes.status).toBe(403);
  });

  it('Step 11: Admin filters reminders by status PENDING', async () => {
    const res = await request
      .get('/v1/reminders')
      .set('Authorization', `Bearer ${adminToken}`)
      .query({ status: 'PENDING' });

    expect(res.status).toBe(200);
    res.body.data.forEach((r: any) => {
      expect(r.status).toBe('PENDING');
    });
  });
});