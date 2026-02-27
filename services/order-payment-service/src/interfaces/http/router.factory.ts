import { Application, Router } from 'express';
import { PrismaClient } from '@prisma/client';
import Stripe from 'stripe';
import { buildRefundRouter } from '../../app/refunds/refund.routes';
import { buildOrderRouter } from '../../app/orders/order.routes';
import { buildPaymentRouter } from '../../app/payments/payment.routes';
import { buildInvoiceRouter } from '../../app/invoices/invoice.routes';
import { RefundController } from '../../app/refunds/refund.controller';
import { RefundService } from '../../app/refunds/refund.service';
import { RefundRepository } from '../../app/refunds/refund.repository';
import { OrderController } from '../../app/orders/order.controller';
import { OrderService } from '../../app/orders/order.service';
import { OrderRepository } from '../../app/orders/order.repository';
import { PaymentController } from '../../app/payments/payment.controller';
import { PaymentService } from '../../app/payments/payment.service';
import { PaymentRepository } from '../../app/payments/payment.repository';
import { InvoiceController } from '../../app/invoices/invoice.controller';
import { InvoiceService } from '../../app/invoices/invoice.service';
import { InvoiceRepository } from '../../app/invoices/invoice.repository';
import { WebhookHandler } from '../../infrastructure/payments/webhook-handler';
import { EventProducer } from '../../infrastructure/messaging/event-producer';
import { TransactionHelper } from '../../infrastructure/db/transaction.helper';
import { errorMiddleware } from './middleware.factory';

const API_PREFIX = '/v1';

export type RouterFactoryDeps = {
  prisma: PrismaClient;
  stripe: Stripe;
  eventProducer: EventProducer;
  transactionHelper: TransactionHelper;
};

export function registerRoutes(app: Application, deps: RouterFactoryDeps): void {
  const {
    prisma,
    stripe,
    eventProducer,
    transactionHelper,
  } = deps;

  const refundRepository  = new RefundRepository(prisma);
  const orderRepository   = new OrderRepository(prisma);
  const paymentRepository = new PaymentRepository(prisma);
  const invoiceRepository = new InvoiceRepository(prisma);

  const refundService = new RefundService(
    refundRepository,
    prisma,
    stripe,
    eventProducer,
    transactionHelper,
  );

  const orderService = new OrderService(
    orderRepository,
    prisma,
    eventProducer,
    transactionHelper,
  );

  const paymentService = new PaymentService(
    paymentRepository,
    prisma,
    stripe,
    eventProducer,
    transactionHelper,
  );

  const invoiceService = new InvoiceService(
    invoiceRepository,
    prisma,
    eventProducer,
  );

  const webhookHandler = new WebhookHandler({
    eventProducer,
    onPaymentIntentSucceeded: (intent) => paymentService.handlePaymentSucceeded(intent),
    onPaymentIntentFailed:    (intent) => paymentService.handlePaymentFailed(intent),
    onPaymentIntentCancelled: (intent) => paymentService.handlePaymentCancelled(intent),
    onRefundUpdated:          (refund) => refundService.handleStripeWebhook(refund),
    onChargeDisputeCreated:   (dispute) => paymentService.handleDisputeCreated(dispute),
    onChargeDisputeUpdated:   (dispute) => paymentService.handleDisputeUpdated(dispute),
  });

  const refundController  = new RefundController(refundService);
  const orderController   = new OrderController(orderService);
  const paymentController = new PaymentController(paymentService, webhookHandler);
  const invoiceController = new InvoiceController(invoiceService);

  const apiRouter = Router();

  apiRouter.use('/refunds',  buildRefundRouter(refundController));
  apiRouter.use('/orders',   buildOrderRouter(orderController));
  apiRouter.use('/payments', buildPaymentRouter(paymentController, webhookHandler));
  apiRouter.use('/invoices', buildInvoiceRouter(invoiceController));

  app.use(API_PREFIX, apiRouter);

  app.use(errorMiddleware);
}