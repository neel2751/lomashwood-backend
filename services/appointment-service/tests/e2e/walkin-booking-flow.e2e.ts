import supertest from 'supertest';
import { createApp } from '../../src/app';
import { prisma } from '../../src/infrastructure/db/prisma.client';

const app = createApp();
const request = supertest(app);

describe('E2E: Walk-in / Showroom Booking Flow', () => {
  let adminToken: string;
  let userToken: string;
  let locationId: string;
  let showroomSlotId: string;
  let showroomAppointmentId: string;

  beforeAll(async () => {
    adminToken = process.env.E2E_ADMIN_TOKEN!;
    userToken = process.env.E2E_USER_TOKEN!;
    locationId = process.env.E2E_LOCATION_ID!;
    const consultantId = process.env.E2E_CONSULTANT_ID!;

    const slot = await prisma.timeSlot.findFirst({
      where: { consultantId, isAvailable: true },
      orderBy: { startTime: 'asc' },
    });
    showroomSlotId = slot!.id;
  });

  it('Step 1: User browses showroom locations publicly', async () => {
    const res = await request.get('/v1/locations');

    expect(res.status).toBe(200);
    expect(res.body.data.length).toBeGreaterThan(0);
    res.body.data.forEach((loc: any) => {
      expect(loc.isActive).toBe(true);
    });
  });

  it('Step 2: User views showroom detail including opening hours and map link', async () => {
    const res = await request.get(`/v1/locations/${locationId}`);

    expect(res.status).toBe(200);
    expect(res.body.data.openingHours).toBeDefined();
    expect(res.body.data.mapLink).toBeDefined();
    expect(res.body.data.phone).toBeDefined();
  });

  it('Step 3: User searches for showrooms by name', async () => {
    const res = await request.get('/v1/locations').query({ search: 'Clapham' });

    expect(res.status).toBe(200);
    expect(res.body.data.length).toBeGreaterThan(0);
    expect(res.body.data[0].name).toMatch(/Clapham/i);
  });

  it('Step 4: User books a showroom appointment', async () => {
    const res = await request
      .post('/v1/appointments')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        type: 'SHOWROOM',
        timeSlotId: showroomSlotId,
        locationId,
        forKitchen: true,
        forBedroom: false,
        customerName: 'Showroom Visitor',
        customerPhone: '07933000001',
        customerEmail: 'showroom.visitor@example.com',
        customerPostcode: 'SW4 0LA',
        customerAddress: '99 Clapham Park Rd, London',
      });

    expect(res.status).toBe(201);
    expect(res.body.data).toMatchObject({
      type: 'SHOWROOM',
      locationId,
      status: 'PENDING',
    });
    showroomAppointmentId = res.body.data.id;
  });

  it('Step 5: Showroom appointment without locationId returns 400', async () => {
    const slot = await prisma.timeSlot.findFirst({ where: { isAvailable: true } });

    const res = await request
      .post('/v1/appointments')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        type: 'SHOWROOM',
        timeSlotId: slot!.id,
        forKitchen: true,
        forBedroom: false,
        customerName: 'Missing Location',
        customerPhone: '07933000002',
        customerEmail: 'missing.location@example.com',
        customerPostcode: 'SW4 0LA',
        customerAddress: '1 Unknown Rd, London',
      });

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/location/i);
  });

  it('Step 6: Admin confirms the showroom visit', async () => {
    const res = await request
      .patch(`/v1/appointments/${showroomAppointmentId}/status`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ status: 'CONFIRMED' });

    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe('CONFIRMED');
  });

  it('Step 7: Admin creates a new showroom location', async () => {
    const res = await request
      .post('/v1/locations')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: 'Lomash Wood Canary Wharf',
        address: '1 Canada Square, Canary Wharf, London E14 5AB',
        postcode: 'E14 5AB',
        phone: '02071112222',
        email: 'canarywharf@lomashwood.com',
        openingHours: 'Mon-Sat: 9am – 6pm',
        mapLink: 'https://maps.google.com/?q=Canary+Wharf',
      });

    expect(res.status).toBe(201);
    expect(res.body.data.name).toBe('Lomash Wood Canary Wharf');
  });

  it('Step 8: New location appears in public listings', async () => {
    const res = await request.get('/v1/locations').query({ search: 'Canary Wharf' });

    expect(res.status).toBe(200);
    expect(res.body.data.length).toBeGreaterThan(0);
    expect(res.body.data[0].name).toMatch(/Canary Wharf/i);
  });

  it('Step 9: Admin deactivates a location, it disappears from public listings', async () => {
    const createRes = await request
      .post('/v1/locations')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: 'Temp Popup Location',
        address: '5 Pop-up Lane, London',
        postcode: 'SE1 0AA',
        phone: '02088889999',
        email: 'popup@lomashwood.com',
        openingHours: 'Sat only: 10am – 4pm',
        mapLink: 'https://maps.google.com/?q=Popup',
      });

    const tempLocationId = createRes.body.data.id;

    await request
      .patch(`/v1/locations/${tempLocationId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ isActive: false });

    const publicRes = await request.get('/v1/locations');
    const ids = publicRes.body.data.map((l: any) => l.id);
    expect(ids).not.toContain(tempLocationId);
  });

  it('Step 10: Non-admin cannot create or deactivate locations', async () => {
    const createRes = await request
      .post('/v1/locations')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        name: 'Unauthorised Location',
        address: '1 Bad St, London',
        postcode: 'SW1A 0AA',
        phone: '02000000000',
        email: 'bad@example.com',
        openingHours: 'Never',
        mapLink: 'https://example.com',
      });

    expect(createRes.status).toBe(403);

    const patchRes = await request
      .patch(`/v1/locations/${locationId}`)
      .set('Authorization', `Bearer ${userToken}`)
      .send({ isActive: false });

    expect(patchRes.status).toBe(403);
  });
});