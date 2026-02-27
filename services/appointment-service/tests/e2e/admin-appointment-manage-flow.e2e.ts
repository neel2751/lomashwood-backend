import supertest from 'supertest';
import { createApp } from '../../src/app';
import { prismaClient as prisma } from '../../src/infrastructure/db/prisma.client';
const app = createApp();
const request = supertest(app);


describe('E2E: Admin Appointment Management Flow', () => {
  let adminToken: string;
  let userToken: string;
  let consultantId: string;
  let appointmentIds: string[] = [];

  beforeAll(async () => {
    adminToken = process.env.E2E_ADMIN_TOKEN!;
    userToken = process.env.E2E_USER_TOKEN!;
    consultantId = process.env.E2E_CONSULTANT_ID!;

    const slots = await prisma.timeSlot.findMany({
      where: { consultantId, isAvailable: true },
      take: 5,
      orderBy: { startTime: 'asc' },
    });

    for (const slot of slots) {
      const res = await request
        .post('/v1/appointments')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          type: ['HOME_MEASUREMENT', 'ONLINE', 'SHOWROOM'][appointmentIds.length % 3],
          timeSlotId: slot.id,
          forKitchen: appointmentIds.length % 2 === 0,
          forBedroom: appointmentIds.length % 2 !== 0,
          customerName: `Customer ${appointmentIds.length + 1}`,
          customerPhone: `0791100000${appointmentIds.length}`,
          customerEmail: `customer${appointmentIds.length}@example.com`,
          customerPostcode: 'SW1A 2AA',
          customerAddress: `${appointmentIds.length + 1} Admin Test Rd, London`,
          locationId: slot.id.includes('SHOWROOM') ? process.env.E2E_LOCATION_ID : undefined,
        });
      appointmentIds.push(res.body.data.id);
    }
  });

  it('Step 1: Admin views all appointments with pagination', async () => {
    const res = await request
      .get('/v1/appointments')
      .set('Authorization', `Bearer ${adminToken}`)
      .query({ page: 1, limit: 3 });

    expect(res.status).toBe(200);
    expect(res.body.data.length).toBeLessThanOrEqual(3);
    expect(res.body.meta).toMatchObject({
      page: 1,
      limit: 3,
      total: expect.any(Number),
    });
  });

  it('Step 2: Admin filters appointments by type HOME_MEASUREMENT', async () => {
    const res = await request
      .get('/v1/appointments')
      .set('Authorization', `Bearer ${adminToken}`)
      .query({ type: 'HOME_MEASUREMENT' });

    expect(res.status).toBe(200);
    res.body.data.forEach((a: any) => {
      expect(a.type).toBe('HOME_MEASUREMENT');
    });
  });

  it('Step 3: Admin filters appointments by status PENDING', async () => {
    const res = await request
      .get('/v1/appointments')
      .set('Authorization', `Bearer ${adminToken}`)
      .query({ status: 'PENDING' });

    expect(res.status).toBe(200);
    res.body.data.forEach((a: any) => {
      expect(a.status).toBe('PENDING');
    });
  });

  it('Step 4: Admin confirms an appointment', async () => {
    const res = await request
      .patch(`/v1/appointments/${appointmentIds[0]}/status`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ status: 'CONFIRMED' });

    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe('CONFIRMED');
  });

  it('Step 5: Regular user cannot confirm appointments', async () => {
    const res = await request
      .patch(`/v1/appointments/${appointmentIds[1]}/status`)
      .set('Authorization', `Bearer ${userToken}`)
      .send({ status: 'CONFIRMED' });

    expect(res.status).toBe(403);
  });

  it('Step 6: Admin cancels an appointment with a reason', async () => {
    const res = await request
      .patch(`/v1/appointments/${appointmentIds[2]}/status`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ status: 'CANCELLED', reason: 'Consultant unavailable' });

    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe('CANCELLED');
  });

  it('Step 7: Admin searches for a specific appointment by ID', async () => {
    const res = await request
      .get(`/v1/appointments/${appointmentIds[0]}`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.id).toBe(appointmentIds[0]);
    expect(res.body.data.status).toBe('CONFIRMED');
  });

  it('Step 8: Admin soft-deletes an appointment', async () => {
    const res = await request
      .delete(`/v1/appointments/${appointmentIds[4]}`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);

    const record = await prisma.appointment.findUnique({
      where: { id: appointmentIds[4] },
    });
    expect(record?.deletedAt).not.toBeNull();
  });

  it('Step 9: Soft-deleted appointment no longer appears in admin list', async () => {
    const res = await request
      .get('/v1/appointments')
      .set('Authorization', `Bearer ${adminToken}`);

    const ids = res.body.data.map((a: any) => a.id);
    expect(ids).not.toContain(appointmentIds[4]);
  });

  it('Step 10: Regular user cannot delete appointments', async () => {
    const res = await request
      .delete(`/v1/appointments/${appointmentIds[3]}`)
      .set('Authorization', `Bearer ${userToken}`);

    expect(res.status).toBe(403);
  });

  it('Step 11: Admin creates a consultant and verifies they appear in listings', async () => {
    const res = await request
      .post('/v1/consultants')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: 'New E2E Consultant',
        email: 'new.e2e@lomashwood.com',
        phone: '07800111222',
      });

    expect(res.status).toBe(201);
    const newConsultantId = res.body.data.id;

    const listRes = await request.get('/v1/consultants').query({ isActive: true });
    const ids = listRes.body.data.map((c: any) => c.id);
    expect(ids).toContain(newConsultantId);
  });

  it('Step 12: Admin creates a service type and verifies it is publicly visible', async () => {
    const res = await request
      .post('/v1/service-types')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        type: 'ONLINE',
        title: 'Premium Virtual Design Session',
        description: 'One hour in-depth kitchen planning via video call',
        durationMinutes: 60,
      });

    expect(res.status).toBe(201);
    const serviceId = res.body.data.id;

    const publicRes = await request.get('/v1/service-types/public');
    const ids = publicRes.body.data.map((s: any) => s.id);
    expect(ids).toContain(serviceId);
  });
});