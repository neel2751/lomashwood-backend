import request from 'supertest';
import { app } from '../../src/app';
import { PrismaClient, TaxType } from '@prisma/client';

/**
 * E2E: Tax Calculation Flow
 *
 * Covers the complete tax rule management and application lifecycle:
 *   1. Admin creates a UK VAT rule (20%)
 *   2. Tax calculation endpoint returns correct amounts for GB orders
 *   3. Tax is correctly reflected in checkout summary
 *   4. Region-specific rule takes priority over country-default
 *   5. Order for country with no tax rule has zero tax
 *   6. Admin updates the tax rate
 *   7. Admin deactivates the rule — zero tax applied
 *   8. Admin creates a FIXED tax rule
 */

describe('E2E — Tax Calculation Flow', () => {
  let prisma: PrismaClient;
  let userToken: string;
  let adminToken: string;
  let taxRuleId: string;
  let regionRuleId: string;

  beforeAll(() => {
    userToken = global.__E2E_USER_TOKEN__;
    adminToken = global.__E2E_ADMIN_TOKEN__;
    prisma = global.__PRISMA__;
  });

  afterAll(async () => {
    const ids = [taxRuleId, regionRuleId].filter(Boolean);
    if (ids.length > 0) {
      await prisma.taxRule.deleteMany({ where: { id: { in: ids } } });
    }
  });

  it('Step 1 — admin creates a 20% UK VAT PERCENTAGE rule', async () => {
    const res = await request(app)
      .post('/v1/tax-rules')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: 'E2E UK VAT 20%',
        type: TaxType.PERCENTAGE,
        rate: 20,
        country: 'GB',
        category: 'GENERAL',
        isDefault: false,
      });

    expect(res.status).toBe(201);
    taxRuleId = res.body.data.id;
    expect(res.body.data.rate).toBe(20);
    expect(res.body.data.country).toBe('GB');
  });

  it('Step 2 — tax calculation returns 20% of £1000 = £200 for GB GENERAL', async () => {
    const res = await request(app)
      .post('/v1/tax-rules/calculate')
      .set('Authorization', `Bearer ${userToken}`)
      .send({ amount: 100000, country: 'GB', category: 'GENERAL' });

    expect(res.status).toBe(200);
    expect(res.body.data.taxAmount).toBe(20000);
    expect(res.body.data.taxRate).toBe(20);
    expect(res.body.data.totalWithTax).toBe(120000);
  });

  it('Step 3 — checkout summary for GB includes correct tax amount', async () => {
    const res = await request(app)
      .post('/v1/checkout/summary')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        items: [{ productId: 'e2e-product-uuid-001', quantity: 1, unitPrice: 100000 }],
        shippingRateId: 'e2e-ship-rate-uuid-001',
        country: 'GB',
      });

    expect(res.status).toBe(200);
    expect(res.body.data.taxAmount).toBeGreaterThan(0);
    expect(res.body.data.totalAmount).toBeGreaterThan(res.body.data.subtotal);
  });

  it('Step 4 — admin creates a region-specific Scotland VAT rule at 18%', async () => {
    const res = await request(app)
      .post('/v1/tax-rules')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: 'E2E Scotland VAT',
        type: TaxType.PERCENTAGE,
        rate: 18,
        country: 'GB',
        region: 'SCOTLAND',
        category: 'GENERAL',
        isDefault: false,
      });

    expect(res.status).toBe(201);
    regionRuleId = res.body.data.id;
  });

  it('Step 5 — Scotland-region calculation uses 18% rather than UK default 20%', async () => {
    const res = await request(app)
      .post('/v1/tax-rules/calculate')
      .set('Authorization', `Bearer ${userToken}`)
      .send({ amount: 100000, country: 'GB', region: 'SCOTLAND', category: 'GENERAL' });

    expect(res.status).toBe(200);
    expect(res.body.data.taxRate).toBe(18);
    expect(res.body.data.taxAmount).toBe(18000);
  });

  it('Step 6 — country with no tax rule returns zero tax', async () => {
    const res = await request(app)
      .post('/v1/tax-rules/calculate')
      .set('Authorization', `Bearer ${userToken}`)
      .send({ amount: 100000, country: 'XX', category: 'EXEMPT' });

    expect(res.status).toBe(200);
    expect(res.body.data.taxAmount).toBe(0);
    expect(res.body.data.totalWithTax).toBe(100000);
  });

  it('Step 7 — admin updates UK VAT rule to 15%', async () => {
    const res = await request(app)
      .patch(`/v1/tax-rules/${taxRuleId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ rate: 15 });

    expect(res.status).toBe(200);
    expect(res.body.data.rate).toBe(15);
  });

  it('Step 8 — calculation after update returns 15% for GB GENERAL', async () => {
    const res = await request(app)
      .post('/v1/tax-rules/calculate')
      .set('Authorization', `Bearer ${userToken}`)
      .send({ amount: 100000, country: 'GB', category: 'GENERAL' });

    expect(res.status).toBe(200);
    expect(res.body.data.taxRate).toBe(15);
    expect(res.body.data.taxAmount).toBe(15000);
  });

  it('Step 9 — admin deactivates the UK VAT rule', async () => {
    const res = await request(app)
      .patch(`/v1/tax-rules/${taxRuleId}/deactivate`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.isActive).toBe(false);
  });

  it('Step 10 — deactivated rule returns zero tax', async () => {
    const res = await request(app)
      .post('/v1/tax-rules/calculate')
      .set('Authorization', `Bearer ${userToken}`)
      .send({ amount: 100000, country: 'GB', category: 'GENERAL' });

    expect(res.status).toBe(200);
    expect(res.body.data.taxAmount).toBe(0);
  });

  it('Step 11 — admin creates a FIXED tax rule of £5 per order', async () => {
    const res = await request(app)
      .post('/v1/tax-rules')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: 'E2E Fixed Processing Fee',
        type: TaxType.FIXED,
        rate: 500,
        country: 'IE',
        category: 'GENERAL',
        isDefault: true,
      });

    expect(res.status).toBe(201);

    const calculateRes = await request(app)
      .post('/v1/tax-rules/calculate')
      .set('Authorization', `Bearer ${userToken}`)
      .send({ amount: 200000, country: 'IE', category: 'GENERAL' });

    expect(calculateRes.body.data.taxAmount).toBe(500);
    expect(calculateRes.body.data.totalWithTax).toBe(200500);

    await prisma.taxRule.deleteMany({ where: { id: calculateRes.body.data.taxRuleId } });
  });
});