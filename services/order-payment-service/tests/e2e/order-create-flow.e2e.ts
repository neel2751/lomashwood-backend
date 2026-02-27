import request from 'supertest';
import { app } from '../../src/app';
import { PrismaClient, OrderStatus, PaymentStatus } from '@prisma/client';

/**
 * E2E: Order Creation Flow
 *
 * Covers the complete lifecycle of creating an order:
 *   1. Authenticated customer builds a valid order payload
 *   2. POST /v1/orders creates the order with correct totals
 *   3. Order exists in the database with PENDING status
 *   4. Admin can view the order in the admin listing
 *   5. Owner can retrieve the order by ID
 *   6. Another user cannot access the order (403)
 *   7. Admin can update the order status
 *   8. Order can be cancelled (soft-delete)
 */

describe('E2E — Order Creation Flow', () => {
  let prisma: PrismaClient;
  let userToken: string;
  let adminToken: string;
  let createdOrderId: string;

  const shippingAddress = {
    line1: '42 Baker Street',
    city: 'London',
    postcode: 'NW1 6XE',
    country: 'GB',
  };

  beforeAll(() => {
    userToken = global.__E2E_USER_TOKEN__;
    adminToken = global.__E2E_ADMIN_TOKEN__;
    prisma = global.__PRISMA__;
  });

  afterAll(async () => {
    if (createdOrderId) {
      await prisma.order.deleteMany({ where: { id: createdOrderId } });
    }
  });

  // ── Step 1: Create order ──────────────────────────────────────────────────

  it('Step 1 — should create an order and return 201 with correct structure', async () => {
    const res = await request(app)
      .post('/v1/orders')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        items: [{ productId: 'e2e-product-uuid-001', quantity: 1 }],
        shippingAddress,
        shippingRateId: 'e2e-ship-rate-uuid-001',
        country: 'GB',
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toMatchObject({
      id: expect.any(String),
      status: OrderStatus.PENDING,
      paymentStatus: PaymentStatus.UNPAID,
      currency: 'GBP',
      items: expect.arrayContaining([
        expect.objectContaining({ productId: 'e2e-product-uuid-001', quantity: 1 }),
      ]),
    });
    expect(res.body.data.totalAmount).toBeGreaterThan(0);

    createdOrderId = res.body.data.id;
  });

  // ── Step 2: Verify persisted in DB ───────────────────────────────────────

  it('Step 2 — order should be persisted in the database', async () => {
    const order = await prisma.order.findUnique({
      where: { id: createdOrderId },
      include: { items: true },
    });

    expect(order).not.toBeNull();
    expect(order!.status).toBe(OrderStatus.PENDING);
    expect(order!.paymentStatus).toBe(PaymentStatus.UNPAID);
    expect(order!.items).toHaveLength(1);
    expect(order!.items[0].productId).toBe('e2e-product-uuid-001');
  });

  // ── Step 3: Owner retrieves order ────────────────────────────────────────

  it('Step 3 — order owner should retrieve the order by ID', async () => {
    const res = await request(app)
      .get(`/v1/orders/${createdOrderId}`)
      .set('Authorization', `Bearer ${userToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.id).toBe(createdOrderId);
    expect(res.body.data.shippingAddress).toMatchObject(shippingAddress);
  });

  // ── Step 4: Cross-user access denied ─────────────────────────────────────

  it('Step 4 — a different customer should receive 403 when accessing the order', async () => {
    const otherToken = require('jsonwebtoken').sign(
      { id: 'e2e-stranger-uuid', email: 'stranger@test.com', role: 'CUSTOMER' },
      process.env.JWT_SECRET!,
      { expiresIn: '1h' },
    );

    const res = await request(app)
      .get(`/v1/orders/${createdOrderId}`)
      .set('Authorization', `Bearer ${otherToken}`);

    expect(res.status).toBe(403);
  });

  // ── Step 5: Admin views all orders ───────────────────────────────────────

  it('Step 5 — admin should see the order in the paginated admin listing', async () => {
    const res = await request(app)
      .get('/v1/orders')
      .set('Authorization', `Bearer ${adminToken}`)
      .query({ page: 1, limit: 50 });

    expect(res.status).toBe(200);
    const ids = res.body.data.orders.map((o: any) => o.id);
    expect(ids).toContain(createdOrderId);
  });

  // ── Step 6: Admin updates order status ───────────────────────────────────

  it('Step 6 — admin should be able to update the order status to CONFIRMED', async () => {
    const res = await request(app)
      .patch(`/v1/orders/${createdOrderId}/status`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ status: OrderStatus.CONFIRMED });

    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe(OrderStatus.CONFIRMED);

    const dbOrder = await prisma.order.findUnique({ where: { id: createdOrderId } });
    expect(dbOrder!.status).toBe(OrderStatus.CONFIRMED);
  });

  // ── Step 7: Validation — empty items rejected ─────────────────────────────

  it('Step 7 — should reject order creation with empty items array', async () => {
    const res = await request(app)
      .post('/v1/orders')
      .set('Authorization', `Bearer ${userToken}`)
      .send({ items: [], shippingAddress, shippingRateId: 'e2e-ship-rate-uuid-001' });

    expect(res.status).toBe(400);
  });

  // ── Step 8: Cancel order ─────────────────────────────────────────────────

  it('Step 8 — admin should be able to cancel the order', async () => {
    const res = await request(app)
      .delete(`/v1/orders/${createdOrderId}`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);

    const dbOrder = await prisma.order.findUnique({ where: { id: createdOrderId } });
    expect(dbOrder!.status).toBe(OrderStatus.CANCELLED);
  });
});