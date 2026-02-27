import request from 'supertest';
import { app } from '../../src/app';
import { PrismaClient, OrderStatus, PaymentStatus, InvoiceStatus } from '@prisma/client';

/**
 * E2E: Invoice Download Flow
 *
 * Covers the complete invoice lifecycle:
 *   1. Confirm a paid order and verify invoice auto-generation
 *   2. Customer retrieves invoice by ID
 *   3. Customer downloads the PDF invoice
 *   4. Admin can list all invoices
 *   5. Admin voids an invoice
 *   6. Another user cannot access invoice (403)
 *   7. Non-existent invoice returns 404
 */

describe('E2E — Invoice Download Flow', () => {
  let prisma: PrismaClient;
  let userToken: string;
  let adminToken: string;
  let orderId: string;
  let invoiceId: string;

  beforeAll(async () => {
    userToken = global.__E2E_USER_TOKEN__;
    adminToken = global.__E2E_ADMIN_TOKEN__;
    prisma = global.__PRISMA__;

    // Seed a confirmed, paid order with an invoice
    const order = await prisma.order.create({
      data: {
        id: 'e2e-invoice-order-001',
        userId: global.__E2E_USER_ID__,
        status: OrderStatus.CONFIRMED,
        paymentStatus: PaymentStatus.PAID,
        subtotal: 150000,
        taxAmount: 30000,
        shippingAmount: 995,
        discountAmount: 0,
        totalAmount: 180995,
        currency: 'GBP',
        shippingAddress: { line1: '1 Invoice Ave', city: 'London', postcode: 'W1B 1AA', country: 'GB' },
      },
    });

    orderId = order.id;

    await prisma.payment.create({
      data: {
        orderId,
        stripePaymentIntentId: 'pi_e2e_invoice_001',
        amount: 180995,
        currency: 'GBP',
        status: PaymentStatus.SUCCEEDED,
        method: 'CARD',
      },
    });

    const invoice = await prisma.invoice.create({
      data: {
        orderId,
        invoiceNumber: 'INV-E2E-001',
        status: InvoiceStatus.ISSUED,
        subtotal: 150000,
        taxAmount: 30000,
        shippingAmount: 995,
        discountAmount: 0,
        totalAmount: 180995,
        currency: 'GBP',
        issuedAt: new Date(),
        dueAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 14),
      },
    });

    invoiceId = invoice.id;
  });

  afterAll(async () => {
    if (orderId) {
      await prisma.invoice.deleteMany({ where: { orderId } });
      await prisma.payment.deleteMany({ where: { orderId } });
      await prisma.order.deleteMany({ where: { id: orderId } });
    }
  });

  // ── Step 1: Customer retrieves invoice by ID ─────────────────────────────

  it('Step 1 — customer should retrieve their invoice details by ID', async () => {
    const res = await request(app)
      .get(`/v1/invoices/${invoiceId}`)
      .set('Authorization', `Bearer ${userToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data).toMatchObject({
      id: invoiceId,
      invoiceNumber: 'INV-E2E-001',
      status: InvoiceStatus.ISSUED,
      totalAmount: 180995,
      currency: 'GBP',
    });
  });

  // ── Step 2: Customer lists invoices for their order ──────────────────────

  it('Step 2 — customer should list invoices for their order', async () => {
    const res = await request(app)
      .get(`/v1/invoices/order/${orderId}`)
      .set('Authorization', `Bearer ${userToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(1);
    expect(res.body.data[0].invoiceNumber).toBe('INV-E2E-001');
  });

  // ── Step 3: Customer downloads PDF invoice ───────────────────────────────

  it('Step 3 — customer should be able to download the invoice as a PDF', async () => {
    const res = await request(app)
      .get(`/v1/invoices/${invoiceId}/download`)
      .set('Authorization', `Bearer ${userToken}`);

    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toMatch(/application\/pdf/);
    expect(res.headers['content-disposition']).toMatch(/attachment/);
    expect(res.headers['content-disposition']).toMatch(/INV-E2E-001/);
    expect(res.body).toBeTruthy();
  });

  // ── Step 4: Admin lists all invoices ─────────────────────────────────────

  it('Step 4 — admin should be able to list all invoices with pagination', async () => {
    const res = await request(app)
      .get('/v1/invoices')
      .set('Authorization', `Bearer ${adminToken}`)
      .query({ page: 1, limit: 50 });

    expect(res.status).toBe(200);
    const ids = res.body.data.invoices.map((i: any) => i.id);
    expect(ids).toContain(invoiceId);
  });

  // ── Step 5: Admin filters invoices by status ─────────────────────────────

  it('Step 5 — admin should filter invoices by ISSUED status', async () => {
    const res = await request(app)
      .get('/v1/invoices')
      .set('Authorization', `Bearer ${adminToken}`)
      .query({ status: InvoiceStatus.ISSUED, page: 1, limit: 50 });

    expect(res.status).toBe(200);
    const allIssued = res.body.data.invoices.every((i: any) => i.status === InvoiceStatus.ISSUED);
    expect(allIssued).toBe(true);
  });

  // ── Step 6: Cross-user access blocked ────────────────────────────────────

  it('Step 6 — a different customer should receive 403 when accessing the invoice', async () => {
    const otherToken = require('jsonwebtoken').sign(
      { id: 'e2e-stranger-uuid', email: 'stranger@test.com', role: 'CUSTOMER' },
      process.env.JWT_SECRET!,
      { expiresIn: '1h' },
    );

    const res = await request(app)
      .get(`/v1/invoices/${invoiceId}`)
      .set('Authorization', `Bearer ${otherToken}`);

    expect(res.status).toBe(403);
  });

  // ── Step 7: Cross-user download blocked ──────────────────────────────────

  it('Step 7 — a different customer should receive 403 when downloading the invoice PDF', async () => {
    const otherToken = require('jsonwebtoken').sign(
      { id: 'e2e-stranger-uuid', email: 'stranger@test.com', role: 'CUSTOMER' },
      process.env.JWT_SECRET!,
      { expiresIn: '1h' },
    );

    const res = await request(app)
      .get(`/v1/invoices/${invoiceId}/download`)
      .set('Authorization', `Bearer ${otherToken}`);

    expect(res.status).toBe(403);
  });

  // ── Step 8: Admin voids the invoice ──────────────────────────────────────

  it('Step 8 — admin should be able to void the issued invoice', async () => {
    const res = await request(app)
      .patch(`/v1/invoices/${invoiceId}/void`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe(InvoiceStatus.VOID);

    const dbInvoice = await prisma.invoice.findUnique({ where: { id: invoiceId } });
    expect(dbInvoice!.status).toBe(InvoiceStatus.VOID);
  });

  // ── Step 9: Non-existent invoice returns 404 ─────────────────────────────

  it('Step 9 — requesting a non-existent invoice should return 404', async () => {
    const res = await request(app)
      .get('/v1/invoices/non-existent-invoice-id')
      .set('Authorization', `Bearer ${userToken}`);

    expect(res.status).toBe(404);
  });

  // ── Step 10: Unauthenticated access blocked ───────────────────────────────

  it('Step 10 — unauthenticated access to invoice endpoint should return 401', async () => {
    const res = await request(app).get(`/v1/invoices/${invoiceId}`);

    expect(res.status).toBe(401);
  });
});