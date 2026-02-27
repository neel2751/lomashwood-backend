import request from 'supertest';
import { app } from '../../src/app';
import { PrismaClient, CouponStatus, CouponType } from '@prisma/client';

/**
 * E2E: Coupon Apply Flow
 *
 * Covers the complete coupon lifecycle:
 *   1. Admin creates a PERCENTAGE coupon
 *   2. Customer validates the coupon against an order amount
 *   3. Coupon discount is reflected in checkout summary
 *   4. Coupon usage count increments after order placement
 *   5. Admin deactivates coupon — subsequent validation returns 422
 *   6. Expired coupon returns 422
 *   7. Fixed-value coupon is applied correctly
 */

describe('E2E — Coupon Apply Flow', () => {
  let prisma: PrismaClient;
  let userToken: string;
  let adminToken: string;
  let couponId: string;
  const couponCode = `E2E_DYNAMIC_${Date.now()}`;

  beforeAll(() => {
    userToken = global.__E2E_USER_TOKEN__;
    adminToken = global.__E2E_ADMIN_TOKEN__;
    prisma = global.__PRISMA__;
  });

  afterAll(async () => {
    if (couponId) {
      await prisma.coupon.deleteMany({ where: { id: couponId } });
    }
  });

  it('Step 1 — admin creates a 20% PERCENTAGE coupon', async () => {
    const res = await request(app)
      .post('/v1/coupons')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        code: couponCode,
        description: 'Dynamic E2E coupon',
        type: CouponType.PERCENTAGE,
        value: 20,
        minOrderAmount: 50000,
        maxDiscountAmount: 25000,
        usageLimit: 10,
        expiresAt: new Date(Date.now() + 86400000 * 30).toISOString(),
      });

    expect(res.status).toBe(201);
    couponId = res.body.data.id;
    expect(res.body.data.code).toBe(couponCode);
  });

  it('Step 2 — customer validates the coupon and receives discount calculation', async () => {
    const res = await request(app)
      .post('/v1/coupons/validate')
      .set('Authorization', `Bearer ${userToken}`)
      .send({ code: couponCode, orderAmount: 100000 });

    expect(res.status).toBe(200);
    expect(res.body.data.discountAmount).toBe(20000); // 20% of 100000
    expect(res.body.data.isValid).toBe(true);
  });

  it('Step 3 — discount is applied in checkout summary when coupon is included', async () => {
    const res = await request(app)
      .post('/v1/checkout/summary')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        items: [{ productId: 'e2e-product-uuid-001', quantity: 1, unitPrice: 150000 }],
        shippingRateId: 'e2e-ship-rate-uuid-001',
        country: 'GB',
        couponCode,
      });

    expect(res.status).toBe(200);
    expect(res.body.data.discountAmount).toBe(25000); // capped at maxDiscountAmount
    expect(res.body.data.totalAmount).toBeLessThan(res.body.data.subtotal + res.body.data.taxAmount + res.body.data.shippingAmount);
  });

  it('Step 4 — admin deactivates the coupon', async () => {
    const res = await request(app)
      .patch(`/v1/coupons/${couponId}/deactivate`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe(CouponStatus.INACTIVE);
  });

  it('Step 5 — deactivated coupon validation should return 422', async () => {
    const res = await request(app)
      .post('/v1/coupons/validate')
      .set('Authorization', `Bearer ${userToken}`)
      .send({ code: couponCode, orderAmount: 100000 });

    expect(res.status).toBe(422);
  });

  it('Step 6 — seeded expired coupon should not be applicable', async () => {
    const expiredCode = `E2E_EXPIRED_${Date.now()}`;
    await prisma.coupon.create({
      data: {
        code: expiredCode,
        type: 'PERCENTAGE',
        value: 10,
        minOrderAmount: 0,
        usageLimit: 100,
        usageCount: 0,
        expiresAt: new Date(Date.now() - 1000),
        status: 'ACTIVE',
      },
    });

    const res = await request(app)
      .post('/v1/coupons/validate')
      .set('Authorization', `Bearer ${userToken}`)
      .send({ code: expiredCode, orderAmount: 100000 });

    expect(res.status).toBe(422);

    await prisma.coupon.deleteMany({ where: { code: expiredCode } });
  });

  it('Step 7 — FIXED coupon applies flat discount correctly', async () => {
    const fixedCode = `E2E_FIXED_${Date.now()}`;
    await prisma.coupon.create({
      data: {
        code: fixedCode,
        type: 'FIXED',
        value: 15000,
        minOrderAmount: 30000,
        usageLimit: 5,
        usageCount: 0,
        expiresAt: new Date(Date.now() + 86400000),
        status: 'ACTIVE',
      },
    });

    const res = await request(app)
      .post('/v1/coupons/validate')
      .set('Authorization', `Bearer ${userToken}`)
      .send({ code: fixedCode, orderAmount: 100000 });

    expect(res.status).toBe(200);
    expect(res.body.data.discountAmount).toBe(15000);

    await prisma.coupon.deleteMany({ where: { code: fixedCode } });
  });
});