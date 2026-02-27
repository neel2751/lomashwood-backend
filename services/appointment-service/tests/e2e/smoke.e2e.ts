import supertest from 'supertest';
import { createApp } from '../../src/app';

const app = createApp();
const request = supertest(app);


describe('Smoke: Appointment Service Health', () => {
  it('GET /health → 200', async () => {
    const res = await request.get('/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
  });

  it('GET /health/live → 200', async () => {
    const res = await request.get('/health/live');
    expect(res.status).toBe(200);
  });

  it('GET /health/ready → 200', async () => {
    const res = await request.get('/health/ready');
    expect(res.status).toBe(200);
  });
});

describe('Smoke: Public Endpoints Are Reachable', () => {
  it('GET /v1/service-types/public → 200', async () => {
    const res = await request.get('/v1/service-types/public');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  it('GET /v1/consultants → 200', async () => {
    const res = await request.get('/v1/consultants');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  it('GET /v1/locations → 200', async () => {
    const res = await request.get('/v1/locations');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  it('GET /v1/time-slots/available → 200', async () => {
    const res = await request.get('/v1/time-slots/available');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  it('GET /v1/calendar → 400 without date range (expected validation)', async () => {
    const res = await request.get('/v1/calendar');
    expect(res.status).toBe(400);
  });
});

describe('Smoke: Auth Guards On Protected Endpoints', () => {
  it('GET /v1/appointments → 401 without token', async () => {
    const res = await request.get('/v1/appointments');
    expect(res.status).toBe(401);
  });

  it('POST /v1/appointments → 401 without token', async () => {
    const res = await request.post('/v1/appointments').send({});
    expect(res.status).toBe(401);
  });

  it('GET /v1/bookings/my-bookings → 401 without token', async () => {
    const res = await request.get('/v1/bookings/my-bookings');
    expect(res.status).toBe(401);
  });

  it('POST /v1/cancellations → 401 without token', async () => {
    const res = await request.post('/v1/cancellations').send({});
    expect(res.status).toBe(401);
  });

  it('POST /v1/reschedules → 401 without token', async () => {
    const res = await request.post('/v1/reschedules').send({});
    expect(res.status).toBe(401);
  });

  it('POST /v1/reminders → 401 without token', async () => {
    const res = await request.post('/v1/reminders').send({});
    expect(res.status).toBe(401);
  });

  it('POST /v1/calendar/sync → 401 without token', async () => {
    const res = await request.post('/v1/calendar/sync');
    expect(res.status).toBe(401);
  });

  it('GET /health/detailed → 401 without admin token', async () => {
    const res = await request.get('/health/detailed');
    expect(res.status).toBe(401);
  });
});

describe('Smoke: Unknown Routes', () => {
  it('GET /v1/nonexistent → 404', async () => {
    const res = await request.get('/v1/nonexistent');
    expect(res.status).toBe(404);
  });

  it('DELETE /v1/service-types/public → 405 Method Not Allowed', async () => {
    const res = await request.delete('/v1/service-types/public');
    expect(res.status).toBe(405);
  });
});