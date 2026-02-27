import supertest from 'supertest';
import { createApp } from '../../src/app';
import { prisma } from '../../src/infrastructure/db/prisma.client';

const app = createApp();
const request = supertest(app);

describe('E2E: Calendar Sync Flow', () => {
  let adminToken: string;
  let userToken: string;
  let consultantId: string;
  let appointmentId: string;

  beforeAll(async () => {
    adminToken = process.env.E2E_ADMIN_TOKEN!;
    userToken = process.env.E2E_USER_TOKEN!;
    consultantId = process.env.E2E_CONSULTANT_ID!;

    const slot = await prisma.timeSlot.findFirst({
      where: { consultantId, isAvailable: true },
      orderBy: { startTime: 'asc' },
    });

    const res = await request
      .post('/v1/appointments')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        type: 'ONLINE',
        timeSlotId: slot!.id,
        forKitchen: true,
        forBedroom: false,
        customerName: 'Calendar User',
        customerPhone: '07811000001',
        customerEmail: 'calendar@example.com',
        customerPostcode: 'WC2N 5DU',
        customerAddress: '1 Strand, London',
      });

    appointmentId = res.body.data.id;
  });

  it('Step 1: Public calendar shows only available slots', async () => {
    const from = new Date().toISOString().split('T')[0];
    const to = new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0];

    const res = await request
      .get('/v1/calendar')
      .query({ consultantId, from, to });

    expect(res.status).toBe(200);
    res.body.data.forEach((slot: any) => {
      expect(slot.isAvailable).toBe(true);
    });
  });

  it('Step 2: Admin calendar view includes booked slots via includeBooked flag', async () => {
    const from = new Date().toISOString().split('T')[0];
    const to = new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0];

    const res = await request
      .get('/v1/calendar')
      .set('Authorization', `Bearer ${adminToken}`)
      .query({ consultantId, from, to, includeBooked: true });

    expect(res.status).toBe(200);
    const hasBooked = res.body.data.some((slot: any) => !slot.isAvailable);
    expect(hasBooked).toBe(true);
  });

  it('Step 3: Calendar without date range returns 400', async () => {
    const res = await request.get('/v1/calendar').query({ consultantId });

    expect(res.status).toBe(400);
    expect(res.body.errors).toBeDefined();
  });

  it('Step 4: Calendar with inverted date range returns 400', async () => {
    const from = new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0];
    const to = new Date().toISOString().split('T')[0];

    const res = await request
      .get('/v1/calendar')
      .query({ consultantId, from, to });

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/date range/i);
  });

  it('Step 5: Sync status endpoint returns provider and last synced timestamp', async () => {
    const res = await request
      .get('/v1/calendar/sync-status')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data).toMatchObject({
      provider: expect.any(String),
      lastSyncedAt: expect.any(String),
    });
  });

  it('Step 6: Manual sync trigger succeeds and updates lastSyncedAt', async () => {
    const beforeRes = await request
      .get('/v1/calendar/sync-status')
      .set('Authorization', `Bearer ${adminToken}`);

    const beforeSyncedAt = beforeRes.body.data.lastSyncedAt;

    await new Promise((r) => setTimeout(r, 1000));

    const syncRes = await request
      .post('/v1/calendar/sync')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(syncRes.status).toBe(200);
    expect(syncRes.body.data.syncedAt).toBeDefined();

    const afterRes = await request
      .get('/v1/calendar/sync-status')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(new Date(afterRes.body.data.lastSyncedAt).getTime()).toBeGreaterThan(
      new Date(beforeSyncedAt).getTime()
    );
  });

  it('Step 7: Non-admin cannot trigger manual sync', async () => {
    const res = await request
      .post('/v1/calendar/sync')
      .set('Authorization', `Bearer ${userToken}`);

    expect(res.status).toBe(403);
  });

  it('Step 8: Upcoming appointments endpoint returns users booked appointments', async () => {
    const res = await request
      .get('/v1/calendar/appointments/upcoming')
      .set('Authorization', `Bearer ${userToken}`);

    expect(res.status).toBe(200);
    const ids = res.body.data.map((a: any) => a.id);
    expect(ids).toContain(appointmentId);
  });

  it('Step 9: Admin upcoming appointments view returns all upcoming bookings', async () => {
    const res = await request
      .get('/v1/calendar/appointments/upcoming')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.length).toBeGreaterThan(0);
    res.body.data.forEach((a: any) => {
      expect(new Date(a.timeSlot.startTime).getTime()).toBeGreaterThan(Date.now());
    });
  });

  it('Step 10: Unauthenticated upcoming appointments returns 401', async () => {
    const res = await request.get('/v1/calendar/appointments/upcoming');

    expect(res.status).toBe(401);
  });
});
