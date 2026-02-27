import Stripe from 'stripe';
import { Request, Response } from 'express';
import { stripeClient } from './stripe.client';
import { razorpayClient } from './razorpay.client';
import { redisService } from '../cache/redis.client';
import { RedisKeys, RedisTTL } from '../cache/redis.keys';
import { env } from '../../config/env';
import { logger } from '../../config/logger';
import { EventProducer } from '../messaging/event-producer';
import { PAYMENT_EVENTS } from '../../events/payment-succeeded.event';
import { ORDER_EVENTS } from '../../events/order-created.event';
import { REFUND_EVENTS } from '../../events/refund-issued.event';

export type WebhookHandlerDeps = {
  eventProducer: EventProducer;
  onPaymentIntentSucceeded: (intent: Stripe.PaymentIntent) => Promise<void>;
  onPaymentIntentFailed: (intent: Stripe.PaymentIntent) => Promise<void>;
  onPaymentIntentCancelled: (intent: Stripe.PaymentIntent) => Promise<void>;
  onRefundUpdated: (refund: Stripe.Refund) => Promise<void>;
  onChargeDisputeCreated: (dispute: Stripe.Dispute) => Promise<void>;
  onChargeDisputeUpdated: (dispute: Stripe.Dispute) => Promise<void>;
};

export class WebhookHandler {
  constructor(private readonly deps: WebhookHandlerDeps) {}

  // ── Stripe ─────────────────────────────────────────────────────────────────

  async handleStripeWebhook(req: Request, res: Response): Promise<void> {
    const signature = req.headers['stripe-signature'];

    if (!signature || typeof signature !== 'string') {
      logger.warn('Stripe webhook received without signature header');
      res.status(400).json({ error: 'Missing stripe-signature header' });
      return;
    }

    let event: Stripe.Event;

    try {
      event = stripeClient.constructWebhookEvent(
        req.body as Buffer,
        signature,
        env.STRIPE_WEBHOOK_SECRET,
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      logger.warn('Stripe webhook signature verification failed', { error: message });
      res.status(400).json({ error: `Webhook signature verification failed: ${message}` });
      return;
    }

    const idempotent = await this.guardStripeIdempotency(event.id);
    if (idempotent) {
      logger.info('Stripe webhook event already processed — skipping', { eventId: event.id });
      res.status(200).json({ received: true, duplicate: true });
      return;
    }

    logger.info('Processing Stripe webhook event', {
      eventId: event.id,
      type: event.type,
      livemode: event.livemode,
    });

    try {
      await this.routeStripeEvent(event);
      await this.markStripeEventProcessed(event.id);
      res.status(200).json({ received: true });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);

      logger.error('Stripe webhook handler threw an error', {
        eventId: event.id,
        type: event.type,
        error: message,
      });

      res.status(500).json({ error: 'Webhook processing failed' });
    }
  }

  private async routeStripeEvent(event: Stripe.Event): Promise<void> {
    switch (event.type) {
      case 'payment_intent.succeeded':
        await this.deps.onPaymentIntentSucceeded(
          event.data.object as Stripe.PaymentIntent,
        );
        break;

      case 'payment_intent.payment_failed':
        await this.deps.onPaymentIntentFailed(
          event.data.object as Stripe.PaymentIntent,
        );
        break;

      case 'payment_intent.canceled':
        await this.deps.onPaymentIntentCancelled(
          event.data.object as Stripe.PaymentIntent,
        );
        break;

      case 'refund.updated':
        await this.deps.onRefundUpdated(
          event.data.object as Stripe.Refund,
        );
        break;

      case 'charge.refunded':
        await this.handleChargeRefunded(event.data.object as Stripe.Charge);
        break;

      case 'charge.dispute.created':
        await this.deps.onChargeDisputeCreated(
          event.data.object as Stripe.Dispute,
        );
        break;

      case 'charge.dispute.updated':
        await this.deps.onChargeDisputeUpdated(
          event.data.object as Stripe.Dispute,
        );
        break;

      case 'payment_intent.processing':
        await this.handlePaymentIntentProcessing(
          event.data.object as Stripe.PaymentIntent,
        );
        break;

      case 'payment_intent.requires_action':
        await this.handlePaymentIntentRequiresAction(
          event.data.object as Stripe.PaymentIntent,
        );
        break;

      default:
        logger.debug('Unhandled Stripe event type — ignoring', { type: event.type });
    }
  }

  private async handleChargeRefunded(charge: Stripe.Charge): Promise<void> {
    logger.info('Stripe charge refunded', {
      chargeId: charge.id,
      amountRefunded: charge.amount_refunded,
      refunded: charge.refunded,
    });

    await this.deps.eventProducer.publish(REFUND_EVENTS.CHARGE_REFUNDED, {
      chargeId: charge.id,
      paymentIntentId:
        typeof charge.payment_intent === 'string'
          ? charge.payment_intent
          : charge.payment_intent?.id ?? null,
      amountRefunded: charge.amount_refunded,
      currency: charge.currency,
      refunded: charge.refunded,
      timestamp: new Date().toISOString(),
    });
  }

  private async handlePaymentIntentProcessing(
    intent: Stripe.PaymentIntent,
  ): Promise<void> {
    logger.info('Stripe PaymentIntent processing', {
      intentId: intent.id,
      amount: intent.amount,
      currency: intent.currency,
    });

    await this.deps.eventProducer.publish(PAYMENT_EVENTS.PAYMENT_PROCESSING, {
      paymentIntentId: intent.id,
      amount: intent.amount,
      currency: intent.currency,
      metadata: intent.metadata,
      timestamp: new Date().toISOString(),
    });
  }

  private async handlePaymentIntentRequiresAction(
    intent: Stripe.PaymentIntent,
  ): Promise<void> {
    logger.warn('Stripe PaymentIntent requires action', {
      intentId: intent.id,
      nextAction: intent.next_action?.type,
    });

    await this.deps.eventProducer.publish(PAYMENT_EVENTS.PAYMENT_REQUIRES_ACTION, {
      paymentIntentId: intent.id,
      nextActionType: intent.next_action?.type ?? null,
      clientSecret: intent.client_secret,
      timestamp: new Date().toISOString(),
    });
  }

  private async guardStripeIdempotency(eventId: string): Promise<boolean> {
    const key = RedisKeys.webhook.idempotency(eventId);
    const exists = await redisService.exists(key);
    return exists > 0;
  }

  private async markStripeEventProcessed(eventId: string): Promise<void> {
    const key = RedisKeys.webhook.idempotency(eventId);
    await redisService.set(key, '1', RedisTTL.webhook.idempotency);
  }

  // ── Razorpay ───────────────────────────────────────────────────────────────

  async handleRazorpayWebhook(req: Request, res: Response): Promise<void> {
    const signature = req.headers['x-razorpay-signature'];

    if (!signature || typeof signature !== 'string') {
      logger.warn('Razorpay webhook received without signature header');
      res.status(400).json({ error: 'Missing x-razorpay-signature header' });
      return;
    }

    const rawBody = (req.body as Buffer).toString('utf8');

    const isValid = razorpayClient.verifyWebhookSignature({
      rawBody,
      signature,
      secret: env.RAZORPAY_WEBHOOK_SECRET,
    });

    if (!isValid) {
      logger.warn('Razorpay webhook signature verification failed');
      res.status(400).json({ error: 'Invalid webhook signature' });
      return;
    }

    let payload: Record<string, unknown>;

    try {
      payload = JSON.parse(rawBody) as Record<string, unknown>;
    } catch {
      logger.warn('Razorpay webhook payload is not valid JSON');
      res.status(400).json({ error: 'Invalid JSON payload' });
      return;
    }

    const eventId = payload['id'] as string | undefined;
    const eventType = payload['event'] as string | undefined;

    if (!eventId || !eventType) {
      logger.warn('Razorpay webhook missing id or event field');
      res.status(400).json({ error: 'Missing id or event field' });
      return;
    }

    const idempotent = await this.guardRazorpayIdempotency(eventId);
    if (idempotent) {
      logger.info('Razorpay webhook event already processed — skipping', { eventId });
      res.status(200).json({ received: true, duplicate: true });
      return;
    }

    logger.info('Processing Razorpay webhook event', { eventId, eventType });

    try {
      await this.routeRazorpayEvent(eventType, payload);
      await this.markRazorpayEventProcessed(eventId);
      res.status(200).json({ received: true });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);

      logger.error('Razorpay webhook handler threw an error', {
        eventId,
        eventType,
        error: message,
      });

      res.status(500).json({ error: 'Webhook processing failed' });
    }
  }

  private async routeRazorpayEvent(
    eventType: string,
    payload: Record<string, unknown>,
  ): Promise<void> {
    const entity = payload['payload'] as Record<string, unknown> | undefined;

    switch (eventType) {
      case 'payment.authorized':
        await this.handleRazorpayPaymentAuthorized(entity);
        break;

      case 'payment.captured':
        await this.handleRazorpayPaymentCaptured(entity);
        break;

      case 'payment.failed':
        await this.handleRazorpayPaymentFailed(entity);
        break;

      case 'refund.created':
        await this.handleRazorpayRefundCreated(entity);
        break;

      case 'refund.processed':
        await this.handleRazorpayRefundProcessed(entity);
        break;

      case 'refund.failed':
        await this.handleRazorpayRefundFailed(entity);
        break;

      case 'order.paid':
        await this.handleRazorpayOrderPaid(entity);
        break;

      default:
        logger.debug('Unhandled Razorpay event type — ignoring', { eventType });
    }
  }

  private async handleRazorpayPaymentAuthorized(
    entity: Record<string, unknown> | undefined,
  ): Promise<void> {
    const payment = (entity?.['payment'] as { entity: Record<string, unknown> } | undefined)
      ?.entity;

    if (!payment) return;

    logger.info('Razorpay payment authorized', {
      paymentId: payment['id'],
      orderId: payment['order_id'],
      amount: payment['amount'],
    });

    await this.deps.eventProducer.publish(PAYMENT_EVENTS.RAZORPAY_PAYMENT_AUTHORIZED, {
      paymentId: payment['id'],
      orderId: payment['order_id'],
      amount: payment['amount'],
      currency: payment['currency'],
      method: payment['method'],
      timestamp: new Date().toISOString(),
    });
  }

  private async handleRazorpayPaymentCaptured(
    entity: Record<string, unknown> | undefined,
  ): Promise<void> {
    const payment = (entity?.['payment'] as { entity: Record<string, unknown> } | undefined)
      ?.entity;

    if (!payment) return;

    logger.info('Razorpay payment captured', {
      paymentId: payment['id'],
      orderId: payment['order_id'],
      amount: payment['amount'],
    });

    await this.deps.eventProducer.publish(PAYMENT_EVENTS.RAZORPAY_PAYMENT_CAPTURED, {
      paymentId: payment['id'],
      orderId: payment['order_id'],
      amount: payment['amount'],
      currency: payment['currency'],
      timestamp: new Date().toISOString(),
    });
  }

  private async handleRazorpayPaymentFailed(
    entity: Record<string, unknown> | undefined,
  ): Promise<void> {
    const payment = (entity?.['payment'] as { entity: Record<string, unknown> } | undefined)
      ?.entity;

    if (!payment) return;

    logger.warn('Razorpay payment failed', {
      paymentId: payment['id'],
      orderId: payment['order_id'],
      errorCode: payment['error_code'],
      errorDescription: payment['error_description'],
    });

    await this.deps.eventProducer.publish(PAYMENT_EVENTS.RAZORPAY_PAYMENT_FAILED, {
      paymentId: payment['id'],
      orderId: payment['order_id'],
      errorCode: payment['error_code'],
      errorDescription: payment['error_description'],
      timestamp: new Date().toISOString(),
    });
  }

  private async handleRazorpayRefundCreated(
    entity: Record<string, unknown> | undefined,
  ): Promise<void> {
    const refund = (entity?.['refund'] as { entity: Record<string, unknown> } | undefined)
      ?.entity;

    if (!refund) return;

    logger.info('Razorpay refund created', {
      refundId: refund['id'],
      paymentId: refund['payment_id'],
      amount: refund['amount'],
    });

    await this.deps.eventProducer.publish(REFUND_EVENTS.RAZORPAY_REFUND_CREATED, {
      refundId: refund['id'],
      paymentId: refund['payment_id'],
      amount: refund['amount'],
      currency: refund['currency'],
      status: refund['status'],
      timestamp: new Date().toISOString(),
    });
  }

  private async handleRazorpayRefundProcessed(
    entity: Record<string, unknown> | undefined,
  ): Promise<void> {
    const refund = (entity?.['refund'] as { entity: Record<string, unknown> } | undefined)
      ?.entity;

    if (!refund) return;

    logger.info('Razorpay refund processed', {
      refundId: refund['id'],
      paymentId: refund['payment_id'],
      amount: refund['amount'],
    });

    await this.deps.eventProducer.publish(REFUND_EVENTS.RAZORPAY_REFUND_PROCESSED, {
      refundId: refund['id'],
      paymentId: refund['payment_id'],
      amount: refund['amount'],
      currency: refund['currency'],
      timestamp: new Date().toISOString(),
    });
  }

  private async handleRazorpayRefundFailed(
    entity: Record<string, unknown> | undefined,
  ): Promise<void> {
    const refund = (entity?.['refund'] as { entity: Record<string, unknown> } | undefined)
      ?.entity;

    if (!refund) return;

    logger.warn('Razorpay refund failed', {
      refundId: refund['id'],
      paymentId: refund['payment_id'],
    });

    await this.deps.eventProducer.publish(REFUND_EVENTS.RAZORPAY_REFUND_FAILED, {
      refundId: refund['id'],
      paymentId: refund['payment_id'],
      amount: refund['amount'],
      currency: refund['currency'],
      timestamp: new Date().toISOString(),
    });
  }

  private async handleRazorpayOrderPaid(
    entity: Record<string, unknown> | undefined,
  ): Promise<void> {
    const order = (entity?.['order'] as { entity: Record<string, unknown> } | undefined)
      ?.entity;

    if (!order) return;

    logger.info('Razorpay order paid', {
      orderId: order['id'],
      receipt: order['receipt'],
      amountPaid: order['amount_paid'],
    });

    await this.deps.eventProducer.publish(ORDER_EVENTS.RAZORPAY_ORDER_PAID, {
      orderId: order['id'],
      receipt: order['receipt'],
      amountPaid: order['amount_paid'],
      currency: order['currency'],
      timestamp: new Date().toISOString(),
    });
  }

  private async guardRazorpayIdempotency(eventId: string): Promise<boolean> {
    const key = RedisKeys.webhook.idempotency(`razorpay:${eventId}`);
    const exists = await redisService.exists(key);
    return exists > 0;
  }

  private async markRazorpayEventProcessed(eventId: string): Promise<void> {
    const key = RedisKeys.webhook.idempotency(`razorpay:${eventId}`);
    await redisService.set(key, '1', RedisTTL.webhook.idempotency);
  }
}