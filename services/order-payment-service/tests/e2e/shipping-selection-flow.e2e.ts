import request from 'supertest';
import { app } from '../../src/app';
import { PrismaClient, OrderStatus, PaymentStatus, ShippingStatus } from '@prisma/client';

/**
 * E2E: Shipping Selection Flow
 *
 * Covers the complete shipping lifecycle:
 *   1. Customer fetches available shipping rates for GB
 *   2. Free shipping threshold is reflected correctly
 *   3. Admin creates a new EXPRESS shipping rate
 *   4. Customer selects express rate in checkout
 *   5. Shipment record is created on order confirmation
 *   6. Admin updates tracking information
 *   7. Admin marks shipment as delivered
 *   8. Customer views tracking status
 */

describe('E2E — Shipping Selection Flow', () => {
  let prisma: PrismaClient;
  let userToken: string;
  let adminToken: string;
  let orderId: string;
  let shipmentId: string;
  let expressRateId: string;

  beforeAll(() => {
    userToken = global.__E2E_USER_TOKEN__;
    adminToken = global.__E2E_ADMIN_TOKEN__;
    prisma = global.__PRISMA__;
  });

  afterAll(async () => {
    if (orderId) {
      await prisma.shipping.deleteMany({ where: { orderId } });
      await prisma.payment.deleteMany({ where: { orderId } });
      await prisma.invoice.deleteMany({ where: { orderId } });
      await prisma.order.deleteMany({ where: { id: orderId } });
    }
    if (expressRateId) {
      await prisma.shippingRate.deleteMany({ where: { id: expressRateId } });
    }
  });

  it('Step 1 — customer fetches available shipping rates for GB', async () => {
    const res = await request(app)
      .get('/v1/shipping/rates')
      .set('Authorization', `Bearer ${userToken}`)
      .query({ country: 'GB' });

    expect(res.status).toBe(200);
    expect(res.body.data.length).toBeGreaterThanOrEqual(1);

    const standardRate = res.body.data.find((r: any) => r.method === 'STANDARD');
    expect(standardRate).toBeDefined();
    expect(standardRate.price).toBe(995);
    expect(standardRate.freeThreshold).toBe(50000);
  });

  it('Step 2 — order above free-threshold shows zero shipping cost in rates', async () => {
    const res = await request(app)
      .get('/v1/shipping/rates')
      .set('Authorization', `Bearer ${userToken}`)
      .query({ country: 'GB', orderAmount: 60000 });

    expect(res.status).toBe(200);
    const standardRate = res.body.data.find((r: any) => r.method === 'STANDARD');
    expect(standardRate.effectiveCost).toBe(0);
    expect(standardRate.isFree).toBe(true);
  });

  it('Step 3 — admin creates an EXPRESS shipping rate for GB', async () => {
    const res = await request(app)
      .post('/v1/shipping/rates')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: 'E2E Express Delivery',
        description: 'Next business day',
        method: 'EXPRESS',
        price: 2995,
        freeThreshold: null,
        estimatedDays: 1,
        countries: ['GB'],
      });

    expect(res.status).toBe(201);
    expressRateId = res.body.data.id;
    expect(res.body.data.method).toBe('EXPRESS');
    expect(res.body.data.price).toBe(2995);
  });

  it('Step 4 — both STANDARD and EXPRESS rates now appear for GB', async () => {
    const res = await request(app)
      .get('/v1/shipping/rates')
      .set('Authorization', `Bearer ${userToken}`)
      .query({ country: 'GB' });

    expect(res.status).toBe(200);
    const methods = res.body.data.map((r: any) => r.method);
    expect(methods).toContain('STANDARD');
    expect(methods).toContain('EXPRESS');
  });

  it('Step 5 — customer places order selecting EXPRESS shipping', async () => {
    const res = await request(app)
      .post('/v1/orders')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        items: [{ productId: 'e2e-product-uuid-001', quantity: 1 }],
        shippingAddress: { line1: '9 Express Lane', city: 'London', postcode: 'EC2A 4PH', country: 'GB' },
        shippingRateId: expressRateId,
        country: 'GB',
      });

    expect(res.status).toBe(201);
    orderId = res.body.data.id;
    expect(res.body.data.shippingAmount).toBe(2995);
  });

  it('Step 6 — shipment record is created for the order', async () => {
    const shipment = await prisma.shipping.findFirst({ where: { orderId } });

    expect(shipment).not.toBeNull();
    expect(shipment!.status).toBe(ShippingStatus.PENDING);
    expect(shipment!.rateId).toBe(expressRateId);

    shipmentId = shipment!.id;
  });

  it('Step 7 — admin confirms the order and updates to CONFIRMED', async () => {
    await prisma.order.update({
      where: { id: orderId },
      data: { status: OrderStatus.CONFIRMED, paymentStatus: PaymentStatus.PAID },
    });

    const order = await prisma.order.findUnique({ where: { id: orderId } });
    expect(order!.status).toBe(OrderStatus.CONFIRMED);
  });

  it('Step 8 — admin adds tracking number and carrier to the shipment', async () => {
    const res = await request(app)
      .patch(`/v1/shipping/${shipmentId}/tracking`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ trackingNumber: 'E2ETRACK9999', carrier: 'DHL' });

    expect(res.status).toBe(200);
    expect(res.body.data.trackingNumber).toBe('E2ETRACK9999');
    expect(res.body.data.carrier).toBe('DHL');
    expect(res.body.data.status).toBe(ShippingStatus.SHIPPED);
  });

  it('Step 9 — customer views updated tracking info', async () => {
    const res = await request(app)
      .get(`/v1/shipping/${shipmentId}`)
      .set('Authorization', `Bearer ${userToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.trackingNumber).toBe('E2ETRACK9999');
    expect(res.body.data.status).toBe(ShippingStatus.SHIPPED);
  });

  it('Step 10 — admin marks shipment as DELIVERED', async () => {
    const res = await request(app)
      .patch(`/v1/shipping/${shipmentId}/delivered`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe(ShippingStatus.DELIVERED);
    expect(res.body.data.deliveredAt).not.toBeNull();
  });

  it('Step 11 — cannot mark a non-SHIPPED shipment as delivered (422)', async () => {
    const newShipment = await prisma.shipping.create({
      data: {
        orderId,
        rateId: 'e2e-ship-rate-uuid-001',
        status: ShippingStatus.PENDING,
        address: { line1: 'X', city: 'Y', postcode: 'Z', country: 'GB' },
        estimatedDelivery: new Date(Date.now() + 86400000 * 5),
      },
    });

    const res = await request(app)
      .patch(`/v1/shipping/${newShipment.id}/delivered`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(422);

    await prisma.shipping.deleteMany({ where: { id: newShipment.id } });
  });

  it('Step 12 — no rates returned for country with no configured rates', async () => {
    const res = await request(app)
      .get('/v1/shipping/rates')
      .set('Authorization', `Bearer ${userToken}`)
      .query({ country: 'ZZ' });

    expect(res.status).toBe(200);
    expect(res.body.data).toEqual([]);
  });
});