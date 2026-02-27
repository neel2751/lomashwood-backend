import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { setupUnitTest, mockPrismaClient } from '../../src/tests-helpers/setup';
import { InvoiceRepository } from '../../src/app/invoices/invoice.repository';
import { InvoiceStatus } from '../../src/shared/types';
import { INVOICE_ISSUED, INVOICE_PAID, INVOICE_VOID, ALL_INVOICES, ORDER_CONFIRMED } from '../../tests/fixtures';

setupUnitTest();

describe('InvoiceRepository', () => {
  let repository: InvoiceRepository;

  beforeEach(() => {
    jest.clearAllMocks();
    repository = new InvoiceRepository(mockPrismaClient as any);
  });

  describe('findById', () => {
    it('returns invoice when found', async () => {
      mockPrismaClient.invoice.findUnique.mockResolvedValueOnce(INVOICE_ISSUED);
      const result = await repository.findById(INVOICE_ISSUED.id);
      expect(result).toMatchObject({ id: INVOICE_ISSUED.id });
    });

    it('returns null when not found', async () => {
      mockPrismaClient.invoice.findUnique.mockResolvedValueOnce(null);
      expect(await repository.findById('unknown')).toBeNull();
    });
  });

  describe('findByOrderId', () => {
    it('returns invoice for given order', async () => {
      mockPrismaClient.invoice.findFirst.mockResolvedValueOnce(INVOICE_ISSUED);
      const result = await repository.findByOrderId(ORDER_CONFIRMED.id);
      expect(result).toMatchObject({ orderId: INVOICE_ISSUED.orderId });
    });
  });

  describe('findMany', () => {
    it('returns all invoices', async () => {
      mockPrismaClient.invoice.findMany.mockResolvedValueOnce(ALL_INVOICES);
      const result = await repository.findMany({ skip: 0, take: 20 }, {});
      expect(result).toHaveLength(ALL_INVOICES.length);
    });

    it('filters by status', async () => {
      const voided = ALL_INVOICES.filter((i) => i.status === InvoiceStatus.VOID);
      mockPrismaClient.invoice.findMany.mockResolvedValueOnce(voided);
      await repository.findMany({ skip: 0, take: 20 }, { status: InvoiceStatus.VOID });
      expect(mockPrismaClient.invoice.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: expect.objectContaining({ status: InvoiceStatus.VOID }) }),
      );
    });
  });

  describe('update', () => {
    it('updates invoice pdfUrl', async () => {
      const updated = { ...INVOICE_ISSUED, pdfUrl: 'https://cdn.lomashwood.co.uk/invoices/updated.pdf' };
      mockPrismaClient.invoice.update.mockResolvedValueOnce(updated);
      const result = await repository.update(INVOICE_ISSUED.id, { pdfUrl: updated.pdfUrl });
      expect(result.pdfUrl).toBe(updated.pdfUrl);
    });

    it('voids invoice by updating status', async () => {
      const voided = { ...INVOICE_ISSUED, status: InvoiceStatus.VOID };
      mockPrismaClient.invoice.update.mockResolvedValueOnce(voided);
      const result = await repository.update(INVOICE_ISSUED.id, { status: InvoiceStatus.VOID });
      expect(result.status).toBe(InvoiceStatus.VOID);
    });
  });
});