import request from 'supertest';
import { app } from '../../src/app';
import { prisma } from '../../src/infrastructure/db/prisma.client';
import { InvoiceStatus } from '@prisma/client';
import { generateAuthToken } from '../helpers/auth.helper';

jest.mock('../../src/infrastructure/db/prisma.client', () => ({
  prisma: {
    invoice: {
      create: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
      count: jest.fn(),
    },
    order: { findUnique: jest.fn() },
  },
}));

jest.mock('../../src/app/invoices/invoice.service', () => ({
  InvoiceService: jest.fn().mockImplementation(() => ({
    generatePdf: jest.fn().mockResolvedValue(Buffer.from('PDF_CONTENT')),
  })),
}));

const BASE = '/v1/invoices';

describe('Invoice Routes — Integration', () => {
  let adminToken: string;
  let userToken: string;

  const mockInvoice = {
    id: 'invoice-uuid-001',
    orderId: 'order-uuid-001',
    invoiceNumber: 'INV-2026-001',
    status: InvoiceStatus.ISSUED,
    subtotal: 150000,
    taxAmount: 30000,
    shippingAmount: 995,
    discountAmount: 0,
    totalAmount: 180995,
    currency: 'GBP',
    issuedAt: new Date('2026-01-10T10:00:00Z'),
    dueAt: new Date('2026-01-24T10:00:00Z'),
    pdfUrl: 'https://cdn.lomashwood.com/invoices/INV-2026-001.pdf',
    createdAt: new Date('2026-01-10T10:00:00Z'),
    updatedAt: new Date('2026-01-10T10:00:00Z'),
    order: { id: 'order-uuid-001', userId: 'user-uuid-001' },
  };

  beforeAll(() => {
    userToken = generateAuthToken({ id: 'user-uuid-001', role: 'CUSTOMER' });
    adminToken = generateAuthToken({ id: 'admin-uuid-001', role: 'ADMIN' });
  });

  beforeEach(() => jest.clearAllMocks());

  // ─── GET /v1/invoices ─────────────────────────────────────────────────────

  describe('GET /v1/invoices', () => {
    it('admin should receive a paginated list of all invoices', async () => {
      (prisma.invoice.findMany as jest.Mock).mockResolvedValue([mockInvoice]);
      (prisma.invoice.count as jest.Mock).mockResolvedValue(1);

      const res = await request(app)
        .get(BASE)
        .set('Authorization', `Bearer ${adminToken}`)
        .query({ page: 1, limit: 10 });

      expect(res.status).toBe(200);
      expect(res.body.data.invoices).toHaveLength(1);
      expect(res.body.data.total).toBe(1);
    });

    it('should return 403 for non-admin users', async () => {
      const res = await request(app)
        .get(BASE)
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.status).toBe(403);
    });

    it('should return 401 when unauthenticated', async () => {
      const res = await request(app).get(BASE);

      expect(res.status).toBe(401);
    });

    it('should filter invoices by status when query param is provided', async () => {
      (prisma.invoice.findMany as jest.Mock).mockResolvedValue([mockInvoice]);
      (prisma.invoice.count as jest.Mock).mockResolvedValue(1);

      await request(app)
        .get(BASE)
        .set('Authorization', `Bearer ${adminToken}`)
        .query({ status: InvoiceStatus.ISSUED });

      expect(prisma.invoice.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ status: InvoiceStatus.ISSUED }),
        }),
      );
    });
  });

  // ─── GET /v1/invoices/:id ─────────────────────────────────────────────────

  describe('GET /v1/invoices/:id', () => {
    it('should return 200 with invoice for the order owner', async () => {
      (prisma.invoice.findUnique as jest.Mock).mockResolvedValue(mockInvoice);

      const res = await request(app)
        .get(`${BASE}/invoice-uuid-001`)
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.invoiceNumber).toBe('INV-2026-001');
    });

    it('should return 404 when invoice does not exist', async () => {
      (prisma.invoice.findUnique as jest.Mock).mockResolvedValue(null);

      const res = await request(app)
        .get(`${BASE}/non-existent`)
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.status).toBe(404);
    });

    it('should return 403 when a different user tries to access the invoice', async () => {
      const otherToken = generateAuthToken({ id: 'other-user', role: 'CUSTOMER' });
      (prisma.invoice.findUnique as jest.Mock).mockResolvedValue(mockInvoice);

      const res = await request(app)
        .get(`${BASE}/invoice-uuid-001`)
        .set('Authorization', `Bearer ${otherToken}`);

      expect(res.status).toBe(403);
    });

    it('admin can access any invoice', async () => {
      (prisma.invoice.findUnique as jest.Mock).mockResolvedValue({
        ...mockInvoice,
        order: { id: 'order-uuid-001', userId: 'any-user' },
      });

      const res = await request(app)
        .get(`${BASE}/invoice-uuid-001`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
    });
  });

  // ─── GET /v1/invoices/:id/download ───────────────────────────────────────

  describe('GET /v1/invoices/:id/download', () => {
    it('should return 200 with PDF content-type for the invoice owner', async () => {
      (prisma.invoice.findUnique as jest.Mock).mockResolvedValue(mockInvoice);

      const res = await request(app)
        .get(`${BASE}/invoice-uuid-001/download`)
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.status).toBe(200);
      expect(res.headers['content-type']).toMatch(/application\/pdf/);
    });

    it('should return 404 when invoice does not exist', async () => {
      (prisma.invoice.findUnique as jest.Mock).mockResolvedValue(null);

      const res = await request(app)
        .get(`${BASE}/non-existent/download`)
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.status).toBe(404);
    });

    it('should return 403 for a user who does not own the order', async () => {
      const otherToken = generateAuthToken({ id: 'stranger', role: 'CUSTOMER' });
      (prisma.invoice.findUnique as jest.Mock).mockResolvedValue(mockInvoice);

      const res = await request(app)
        .get(`${BASE}/invoice-uuid-001/download`)
        .set('Authorization', `Bearer ${otherToken}`);

      expect(res.status).toBe(403);
    });
  });

  // ─── GET /v1/invoices/order/:orderId ─────────────────────────────────────

  describe('GET /v1/invoices/order/:orderId', () => {
    it('should return all invoices for the order owner', async () => {
      (prisma.order.findUnique as jest.Mock).mockResolvedValue({
        id: 'order-uuid-001',
        userId: 'user-uuid-001',
      });
      (prisma.invoice.findMany as jest.Mock).mockResolvedValue([mockInvoice]);

      const res = await request(app)
        .get(`${BASE}/order/order-uuid-001`)
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveLength(1);
    });

    it('should return 403 when user does not own the order', async () => {
      (prisma.order.findUnique as jest.Mock).mockResolvedValue({
        id: 'order-uuid-001',
        userId: 'another-user',
      });

      const res = await request(app)
        .get(`${BASE}/order/order-uuid-001`)
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.status).toBe(403);
    });

    it('should return 404 when order does not exist', async () => {
      (prisma.order.findUnique as jest.Mock).mockResolvedValue(null);

      const res = await request(app)
        .get(`${BASE}/order/ghost-order`)
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.status).toBe(404);
    });
  });

  // ─── PATCH /v1/invoices/:id/void ─────────────────────────────────────────

  describe('PATCH /v1/invoices/:id/void', () => {
    it('admin should be able to void an issued invoice', async () => {
      const voided = { ...mockInvoice, status: InvoiceStatus.VOID };
      (prisma.invoice.findUnique as jest.Mock).mockResolvedValue(mockInvoice);
      (prisma.invoice.update as jest.Mock).mockResolvedValue(voided);

      const res = await request(app)
        .patch(`${BASE}/invoice-uuid-001/void`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe(InvoiceStatus.VOID);
    });

    it('should return 403 for non-admin users', async () => {
      const res = await request(app)
        .patch(`${BASE}/invoice-uuid-001/void`)
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.status).toBe(403);
    });

    it('should return 404 when invoice does not exist', async () => {
      (prisma.invoice.findUnique as jest.Mock).mockResolvedValue(null);

      const res = await request(app)
        .patch(`${BASE}/ghost/void`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(404);
    });
  });
});