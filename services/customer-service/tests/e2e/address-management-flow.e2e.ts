import request from 'supertest';
import { app } from '../../src/app';
import { PrismaClient } from '@prisma/client';
import { generateTestToken } from '../helpers/auth.helper';

const prisma = new PrismaClient();

describe('Address Management Flow E2E', () => {
  let authToken: string;
  const testUserId = `address-user-${Date.now()}`;
  let primaryAddressId: string;
  let secondaryAddressId: string;

  beforeAll(async () => {
    authToken = generateTestToken({ sub: testUserId, role: 'customer' });

    await prisma.customerProfile.create({
      data: {
        userId: testUserId,
        firstName: 'Mark',
        lastName: 'Thompson',
        email: `mark.t.${Date.now()}@test.com`,
        phone: '+447811222333',
        isVerified: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });
  });

  afterAll(async () => {
    await prisma.customerAddress.deleteMany({ where: { userId: testUserId } });
    await prisma.customerProfile.deleteMany({ where: { userId: testUserId } });
    await prisma.$disconnect();
  });

  it('starts with empty address list', async () => {
    const res = await request(app)
      .get('/v1/customers/addresses')
      .set('Authorization', `Bearer ${authToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data).toEqual([]);
  });

  it('adds a primary home address', async () => {
    const res = await request(app)
      .post('/v1/customers/addresses')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        label: 'Home',
        line1: '45 Park Lane',
        city: 'Manchester',
        county: 'Greater Manchester',
        postcode: 'M1 4BT',
        country: 'GB',
        isPrimary: true,
      });

    expect(res.status).toBe(201);
    expect(res.body.data.isPrimary).toBe(true);
    expect(res.body.data.label).toBe('Home');
    primaryAddressId = res.body.data.id;
  });

  it('adds a secondary work address', async () => {
    const res = await request(app)
      .post('/v1/customers/addresses')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        label: 'Work',
        line1: '100 Deansgate',
        city: 'Manchester',
        county: 'Greater Manchester',
        postcode: 'M3 2QG',
        country: 'GB',
        isPrimary: false,
      });

    expect(res.status).toBe(201);
    expect(res.body.data.isPrimary).toBe(false);
    expect(res.body.data.label).toBe('Work');
    secondaryAddressId = res.body.data.id;
  });

  it('lists both addresses', async () => {
    const res = await request(app)
      .get('/v1/customers/addresses')
      .set('Authorization', `Bearer ${authToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.length).toBe(2);

    const primary = res.body.data.find((a: { id: string }) => a.id === primaryAddressId);
    expect(primary.isPrimary).toBe(true);
  });

  it('updates address details', async () => {
    const res = await request(app)
      .patch(`/v1/customers/addresses/${primaryAddressId}`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        line1: '45 Park Lane Updated',
        line2: 'Apartment 12',
      });

    expect(res.status).toBe(200);
    expect(res.body.data.line1).toBe('45 Park Lane Updated');
    expect(res.body.data.line2).toBe('Apartment 12');
  });

  it('promotes secondary address to primary and demotes old primary', async () => {
    const res = await request(app)
      .patch(`/v1/customers/addresses/${secondaryAddressId}`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({ isPrimary: true });

    expect(res.status).toBe(200);
    expect(res.body.data.isPrimary).toBe(true);

    const listRes = await request(app)
      .get('/v1/customers/addresses')
      .set('Authorization', `Bearer ${authToken}`);

    const oldPrimary = listRes.body.data.find((a: { id: string }) => a.id === primaryAddressId);
    expect(oldPrimary.isPrimary).toBe(false);
  });

  it('rejects invalid postcode format', async () => {
    const res = await request(app)
      .post('/v1/customers/addresses')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        label: 'Bad',
        line1: '1 Bad Street',
        city: 'London',
        postcode: 'INVALID',
        country: 'GB',
      });

    expect(res.status).toBe(422);
  });

  it('deletes an address', async () => {
    const res = await request(app)
      .delete(`/v1/customers/addresses/${secondaryAddressId}`)
      .set('Authorization', `Bearer ${authToken}`);

    expect(res.status).toBe(204);

    const listRes = await request(app)
      .get('/v1/customers/addresses')
      .set('Authorization', `Bearer ${authToken}`);

    expect(listRes.body.data.length).toBe(1);
    expect(listRes.body.data[0].id).toBe(primaryAddressId);
  });

  it('returns 404 when deleting non-existent address', async () => {
    const res = await request(app)
      .delete('/v1/customers/addresses/non-existent-id')
      .set('Authorization', `Bearer ${authToken}`);

    expect(res.status).toBe(404);
  });

  it('prevents accessing another user addresses', async () => {
    const otherToken = generateTestToken({ sub: 'another-user-id', role: 'customer' });

    const res = await request(app)
      .delete(`/v1/customers/addresses/${primaryAddressId}`)
      .set('Authorization', `Bearer ${otherToken}`);

    expect(res.status).toBe(404);
  });
});