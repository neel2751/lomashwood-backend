import supertest from 'supertest';
import { createApp } from '../../src/app';
import { prisma } from '../../src/infrastructure/db/prisma.client';

const app = createApp();
const request = supertest(app);

describe('E2E: Consultant Availability Flow', () => {
  let adminToken: string;
  let consultantId: string;
  let availabilityId: string;
  let slotId: string;

  beforeAll(async () => {
    adminToken = process.env.E2E_ADMIN_TOKEN!;
    consultantId = process.env.E2E_CONSULTANT_ID!;
  });

  it('Step 1: Public endpoint lists available consultants', async () => {
    const res = await request.get('/v1/consultants').query({ isActive: true });

    expect(res.status).toBe(200);
    expect(res.body.data.length).toBeGreaterThan(0);
    res.body.data.forEach((c: any) => {
      expect(c.isActive).toBe(true);
    });
  });

  it('Step 2: Admin creates a new availability window for consultant', async () => {
    const res = await request
      .post('/v1/availability')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        consultantId,
        dayOfWeek: 6,
        startTime: '10:00',
        endTime: '14:00',
      });

    expect(res.status).toBe(201);
    expect(res.body.data).toMatchObject({
      consultantId,
      dayOfWeek: 6,
      startTime: '10:00',
      endTime: '14:00',
    });
    availabilityId = res.body.data.id;
  });

  it('Step 3: Overlapping availability window returns 400', async () => {
    const res = await request
      .post('/v1/availability')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        consultantId,
        dayOfWeek: 6,
        startTime: '12:00',
        endTime: '16:00',
      });

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/overlap/i);
  });

  it('Step 4: Admin creates a time slot within the new availability window', async () => {
    const saturday = getNextWeekday(6);

    const res = await request
      .post('/v1/time-slots')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        consultantId,
        startTime: saturday.setHours(10, 0, 0, 0) && saturday.toISOString(),
        endTime: new Date(saturday.getTime() + 60 * 60 * 1000).toISOString(),
      });

    expect(res.status).toBe(201);
    slotId = res.body.data.id;
  });

  it('Step 5: Public calendar reflects the new slot as available', async () => {
    const from = new Date().toISOString().split('T')[0];
    const to = new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0];

    const res = await request
      .get('/v1/calendar')
      .query({ consultantId, from, to });

    expect(res.status).toBe(200);
    const slotIds = res.body.data.map((s: any) => s.id);
    expect(slotIds).toContain(slotId);
  });

  it('Step 6: Admin updates availability end time', async () => {
    const res = await request
      .patch(`/v1/availability/${availabilityId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ endTime: '16:00' });

    expect(res.status).toBe(200);
    expect(res.body.data.endTime).toBe('16:00');
  });

  it('Step 7: Consultant detail includes their availability windows', async () => {
    const res = await request.get(`/v1/consultants/${consultantId}`).query({ include: 'availability' });

    expect(res.status).toBe(200);
    expect(res.body.data.availability).toBeDefined();
    expect(Array.isArray(res.body.data.availability)).toBe(true);

    const days = res.body.data.availability.map((a: any) => a.dayOfWeek);
    expect(days).toContain(6);
  });

  it('Step 8: Admin deactivates consultant and availability is hidden from public', async () => {
    await request
      .patch(`/v1/consultants/${consultantId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ isActive: false });

    const res = await request.get('/v1/consultants').query({ isActive: true });

    const ids = res.body.data.map((c: any) => c.id);
    expect(ids).not.toContain(consultantId);

    await request
      .patch(`/v1/consultants/${consultantId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ isActive: true });
  });

  it('Step 9: Admin deletes Saturday availability window', async () => {
    const res = await request
      .delete(`/v1/availability/${availabilityId}`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);

    const record = await prisma.availability.findUnique({ where: { id: availabilityId } });
    expect(record?.deletedAt).not.toBeNull();
  });

  it('Step 10: Non-admin cannot create availability', async () => {
    const userToken = process.env.E2E_USER_TOKEN!;

    const res = await request
      .post('/v1/availability')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        consultantId,
        dayOfWeek: 0,
        startTime: '09:00',
        endTime: '12:00',
      });

    expect(res.status).toBe(403);
  });
});

function getNextWeekday(dayOfWeek: number): Date {
  const date = new Date();
  const diff = (dayOfWeek + 7 - date.getDay()) % 7 || 7;
  date.setDate(date.getDate() + diff);
  return date;
}