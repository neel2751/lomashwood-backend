import { Router } from 'express';
import { InvoiceController } from './invoice.controller';
import { InvoiceService } from './invoice.service';
import { InvoiceRepository } from './invoice.repository';
import { authMiddleware } from '../../middleware/auth.middleware';
import { validateRequest } from '../../middleware/validation.middleware';
import { rateLimitMiddleware } from '../../middleware/rate-limit.middleware';
import { roleGuard } from '../../middleware/role-guard.middleware';
import {
  createInvoiceSchema,
  updateInvoiceSchema,
  generateInvoiceSchema,
  sendInvoiceSchema,
  markAsPaidSchema,
  cancelInvoiceSchema,
  voidInvoiceSchema,
  applyDiscountSchema,
  addNoteSchema,
  bulkGenerateSchema,
  invoiceQuerySchema,
  downloadInvoiceSchema,
  exportInvoicesSchema,
} from './invoice.schemas';
import { prisma } from '../../infrastructure/db/prisma.client';
import { eventProducer } from '../../infrastructure/messaging/event-producer';
import { redisClient } from '../../infrastructure/cache/redis.client';
import { pdfGenerator } from '../../infrastructure/pdf/pdf-generator';
import { emailClient } from '../../infrastructure/notifications/email.client';
import { logger } from '../../config/logger';

const router = Router();

const invoiceRepository = new InvoiceRepository(prisma);
const invoiceService = new InvoiceService(
  invoiceRepository,
  eventProducer,
  redisClient,
  pdfGenerator,
  emailClient,
  logger
);
const invoiceController = new InvoiceController(invoiceService);

router.post(
  '/',
  authMiddleware,
  roleGuard(['ADMIN', 'MANAGER']),
  rateLimitMiddleware('invoice:create', 20, 60),
  validateRequest(createInvoiceSchema),
  invoiceController.createInvoice.bind(invoiceController)
);

router.post(
  '/generate',
  authMiddleware,
  roleGuard(['ADMIN', 'MANAGER']),
  rateLimitMiddleware('invoice:generate', 30, 60),
  validateRequest(generateInvoiceSchema),
  invoiceController.generateInvoice.bind(invoiceController)
);

router.post(
  '/bulk-generate',
  authMiddleware,
  roleGuard(['ADMIN']),
  rateLimitMiddleware('invoice:bulk', 5, 60),
  validateRequest(bulkGenerateSchema),
  invoiceController.bulkGenerateInvoices.bind(invoiceController)
);

router.post(
  '/preview',
  authMiddleware,
  roleGuard(['ADMIN', 'MANAGER']),
  validateRequest(createInvoiceSchema),
  invoiceController.previewInvoice.bind(invoiceController)
);

router.post(
  '/validate',
  authMiddleware,
  roleGuard(['ADMIN', 'MANAGER']),
  validateRequest(createInvoiceSchema),
  invoiceController.validateInvoiceData.bind(invoiceController)
);

router.get(
  '/',
  authMiddleware,
  roleGuard(['ADMIN', 'MANAGER']),
  validateRequest(invoiceQuerySchema, 'query'),
  invoiceController.getInvoices.bind(invoiceController)
);

router.get(
  '/statistics',
  authMiddleware,
  roleGuard(['ADMIN', 'MANAGER']),
  invoiceController.getInvoiceStatistics.bind(invoiceController)
);

router.get(
  '/overdue',
  authMiddleware,
  roleGuard(['ADMIN', 'MANAGER']),
  invoiceController.getOverdueInvoices.bind(invoiceController)
);

router.get(
  '/export',
  authMiddleware,
  roleGuard(['ADMIN', 'MANAGER']),
  validateRequest(exportInvoicesSchema, 'query'),
  invoiceController.exportInvoices.bind(invoiceController)
);

router.get(
  '/template/:templateId',
  authMiddleware,
  roleGuard(['ADMIN', 'MANAGER']),
  invoiceController.getInvoiceTemplate.bind(invoiceController)
);

router.get(
  '/number/:invoiceNumber',
  authMiddleware,
  invoiceController.getInvoiceByNumber.bind(invoiceController)
);

router.get(
  '/order/:orderId',
  authMiddleware,
  invoiceController.getInvoiceByOrderId.bind(invoiceController)
);

router.get(
  '/customer/:customerId',
  authMiddleware,
  invoiceController.getInvoicesByCustomer.bind(invoiceController)
);

router.get(
  '/:id',
  authMiddleware,
  invoiceController.getInvoiceById.bind(invoiceController)
);

router.get(
  '/:id/history',
  authMiddleware,
  roleGuard(['ADMIN', 'MANAGER']),
  invoiceController.getInvoiceHistory.bind(invoiceController)
);

router.get(
  '/:id/download',
  authMiddleware,
  validateRequest(downloadInvoiceSchema, 'query'),
  invoiceController.downloadInvoice.bind(invoiceController)
);

router.patch(
  '/:id',
  authMiddleware,
  roleGuard(['ADMIN', 'MANAGER']),
  validateRequest(updateInvoiceSchema),
  invoiceController.updateInvoice.bind(invoiceController)
);

router.post(
  '/:id/send',
  authMiddleware,
  roleGuard(['ADMIN', 'MANAGER']),
  rateLimitMiddleware('invoice:send', 10, 60),
  validateRequest(sendInvoiceSchema),
  invoiceController.sendInvoice.bind(invoiceController)
);

router.post(
  '/:id/mark-paid',
  authMiddleware,
  roleGuard(['ADMIN', 'MANAGER']),
  validateRequest(markAsPaidSchema),
  invoiceController.markAsPaid.bind(invoiceController)
);

router.post(
  '/:id/cancel',
  authMiddleware,
  roleGuard(['ADMIN', 'MANAGER']),
  validateRequest(cancelInvoiceSchema),
  invoiceController.cancelInvoice.bind(invoiceController)
);

router.post(
  '/:id/void',
  authMiddleware,
  roleGuard(['ADMIN']),
  validateRequest(voidInvoiceSchema),
  invoiceController.voidInvoice.bind(invoiceController)
);

router.post(
  '/:id/reminder',
  authMiddleware,
  roleGuard(['ADMIN', 'MANAGER']),
  rateLimitMiddleware('invoice:reminder', 5, 60),
  invoiceController.sendPaymentReminder.bind(invoiceController)
);

router.post(
  '/:id/regenerate',
  authMiddleware,
  roleGuard(['ADMIN']),
  invoiceController.regenerateInvoice.bind(invoiceController)
);

router.post(
  '/:id/discount',
  authMiddleware,
  roleGuard(['ADMIN', 'MANAGER']),
  validateRequest(applyDiscountSchema),
  invoiceController.applyDiscount.bind(invoiceController)
);

router.post(
  '/:id/note',
  authMiddleware,
  roleGuard(['ADMIN', 'MANAGER']),
  validateRequest(addNoteSchema),
  invoiceController.addNote.bind(invoiceController)
);

export default router;