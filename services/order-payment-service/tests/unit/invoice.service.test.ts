import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { setupUnitTest, mockPrismaClient, mockLogger } from '../../src/tests-helpers/setup';
import { InvoiceService } from '../../src/app/invoices/invoice.service';
import { InvoiceRepository } from '../../src/app/invoices/invoice.repository';
import { InvoiceNotFoundError } from '../../src/shared/errors';
import { InvoiceStatus } from '../../src/shared/types';
import { INVOICE_ISSUED, INVOICE_PAID, INVOICE_VOID, INVOICE_DRAFT, PAYMENT_SUCCEEDED, ORDER_CONFIRMED } from '../../tests/fixtures';

setupUnitTest();

const mockInvoiceRepository = { findById: jest.fn(), findByOrderId: jest.fn(), findMany: jest.fn(), create: jest.fn(), update: jest.fn(), count: jest.fn() };

jest.mock('../../src/app/invoices/invoice.repository', () => ({ InvoiceRepository: jest.fn().mockImplementation(() => mockInvoiceRepository) }));

describe('InvoiceService', () => {
  let invoiceService: InvoiceService;

  beforeEach(() => {
    jest.clearAllMocks();
    invoiceService = new InvoiceService(mockInvoiceRepository as unknown as InvoiceRepository, mockPrismaClient as any, mockLogger as any);
  });

  describe('generateInvoice', () => {
    it('generates invoice from confirmed order and payment', async () => {
      mockInvoiceRepository.create.mockResolvedValueOnce(INVOICE_ISSUED);

      const result = await invoiceService.generateInvoice({
        orderId: ORDER_CONFIRMED.id,
        paymentId: PAYMENT_SUCCEEDED.id,
        customerId: ORDER_CONFIRMED.customerId,
        subtotal: ORDER_CONFIRMED.subtotal,
        shippingCost: ORDER_CONFIRMED.shippingCost,
        taxAmount: ORDER_CONFIRMED.taxAmount,
        discountAmount: ORDER_CONFIRMED.discountAmount,
        totalAmount: ORDER_CONFIRMED.totalAmount,
        currency: ORDER_CONFIRMED.currency,
      });

      expect(result).toMatchObject({ id: INVOICE_ISSUED.id, status: InvoiceStatus.ISSUED });
      expect(mockInvoiceRepository.create).toHaveBeenCalledTimes(1);
    });
  });

  describe('getInvoice', () => {
    it('returns invoice when found', async () => {
      mockInvoiceRepository.findById.mockResolvedValueOnce(INVOICE_ISSUED);
      const result = await invoiceService.getInvoice(INVOICE_ISSUED.id);
      expect(result).toMatchObject({ id: INVOICE_ISSUED.id });
    });

    it('throws InvoiceNotFoundError when missing', async () => {
      mockInvoiceRepository.findById.mockResolvedValueOnce(null);
      await expect(invoiceService.getInvoice('unknown')).rejects.toThrow(InvoiceNotFoundError);
    });
  });

  describe('getInvoices', () => {
    it('returns paginated invoices', async () => {
      mockInvoiceRepository.findMany.mockResolvedValueOnce([INVOICE_ISSUED, INVOICE_PAID]);
      mockInvoiceRepository.count.mockResolvedValueOnce(2);
      const result = await invoiceService.getInvoices({ page: 1, limit: 20 }, {});
      expect(result.data).toHaveLength(2);
    });
  });

  describe('voidInvoice', () => {
    it('voids an issued invoice', async () => {
      mockInvoiceRepository.findById.mockResolvedValueOnce(INVOICE_ISSUED);
      mockInvoiceRepository.update.mockResolvedValueOnce({ ...INVOICE_ISSUED, status: InvoiceStatus.VOID });
      const result = await invoiceService.voidInvoice(INVOICE_ISSUED.id);
      expect(result.status).toBe(InvoiceStatus.VOID);
    });

    it('throws InvoiceNotFoundError for missing invoice', async () => {
      mockInvoiceRepository.findById.mockResolvedValueOnce(null);
      await expect(invoiceService.voidInvoice('unknown')).rejects.toThrow(InvoiceNotFoundError);
    });

    it('throws on attempt to void already voided invoice', async () => {
      mockInvoiceRepository.findById.mockResolvedValueOnce(INVOICE_VOID);
      await expect(invoiceService.voidInvoice(INVOICE_VOID.id)).rejects.toThrow();
    });
  });
});