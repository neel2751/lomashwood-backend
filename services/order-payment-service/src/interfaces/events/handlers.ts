import { EventProducer, EventEnvelope } from '../../infrastructure/messaging/event-producer';
import { OrderTopics, PaymentTopics, RefundTopics } from '../../infrastructure/messaging/event-topics';
import { logger } from '../../config/logger';
import { prisma } from '../../infrastructure/db/prisma.client';
import { redisService } from '../../infrastructure/cache/redis.client';
import { RedisKeys, RedisTTL } from '../../infrastructure/cache/redis.keys';
import { OrderStatus, PaymentStatus, RefundStatus } from '@prisma/client';

// ── Payload types ──────────────────────────────────────────────────────────────

type OrderCreatedPayload = {
  orderId:    string;
  customerId: string;
  amount:     number;
  currency:   string;
  items:      Array<{ productId: string; quantity: number; price: number }>;
  timestamp:  string;
};

type OrderCancelledPayload = {
  orderId:    string;
  customerId: string;
  reason:     string;
  timestamp:  string;
};

type PaymentSucceededPayload = {
  paymentIntentId: string;
  orderId:         string;
  amount:          number;
  currency:        string;
  customerId:      string | null;
  timestamp:       string;
};

type PaymentFailedPayload = {
  paymentIntentId: string;
  orderId:         string;
  errorCode:       string | null;
  errorMessage:    string;
  timestamp:       string;
};

type RefundInitiatedPayload = {
  refundId:    string;
  orderId:     string;
  amount:      number;
  currency:    string;
  requestedBy: string;
  timestamp:   string;
};

type RefundStatusUpdatedPayload = {
  refundId:      string;
  orderId:       string;
  newStatus:     RefundStatus;
  stripeRefundId: string;
  timestamp:     string;
};

type InventoryReservedPayload = {
  orderId:   string;
  items:     Array<{ productId: string; quantity: number }>;
  timestamp: string;
};

type InventoryReleasedPayload = {
  orderId:   string;
  items:     Array<{ productId: string; quantity: number }>;
  timestamp: string;
};

// ── Handler registration ───────────────────────────────────────────────────────

export function registerEventHandlers(eventProducer: EventProducer): void {
  eventProducer.subscribe<OrderCreatedPayload>(
    OrderTopics.CREATED,
    handleOrderCreated,
  );

  eventProducer.subscribe<OrderCancelledPayload>(
    OrderTopics.CANCELLED,
    handleOrderCancelled,
  );

  eventProducer.subscribe<PaymentSucceededPayload>(
    PaymentTopics.SUCCEEDED,
    handlePaymentSucceeded,
  );

  eventProducer.subscribe<PaymentFailedPayload>(
    PaymentTopics.FAILED,
    handlePaymentFailed,
  );

  eventProducer.subscribe<RefundInitiatedPayload>(
    RefundTopics.INITIATED,
    handleRefundInitiated,
  );

  eventProducer.subscribe<RefundStatusUpdatedPayload>(
    RefundTopics.STATUS_UPDATED,
    handleRefundStatusUpdated,
  );

  logger.info('Event handlers registered', {
    handlers: [
      OrderTopics.CREATED,
      OrderTopics.CANCELLED,
      PaymentTopics.SUCCEEDED,
      PaymentTopics.FAILED,
      RefundTopics.INITIATED,
      RefundTopics.STATUS_UPDATED,
    ],
  });
}

// ── Handlers ───────────────────────────────────────────────────────────────────

async function handleOrderCreated(
  envelope: EventEnvelope<OrderCreatedPayload>,
): Promise<void> {
  const { payload, metadata } = envelope;

  logger.info('Handling order.created event', {
    eventId:   metadata.eventId,
    orderId:   payload.orderId,
    customerId: payload.customerId,
  });

  try {
    await redisService.del(
      RedisKeys.order.list(payload.customerId),
    );

    logger.debug('Order cache invalidated on order.created', {
      orderId:   payload.orderId,
      customerId: payload.customerId,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    logger.error('handleOrderCreated cache invalidation failed', {
      eventId: metadata.eventId,
      orderId: payload.orderId,
      error:   message,
    });
  }
}

async function handleOrderCancelled(
  envelope: EventEnvelope<OrderCancelledPayload>,
): Promise<void> {
  const { payload, metadata } = envelope;

  logger.info('Handling order.cancelled event', {
    eventId: metadata.eventId,
    orderId: payload.orderId,
    reason:  payload.reason,
  });

  try {
    await prisma.order.update({
      where: { id: payload.orderId },
      data:  { status: OrderStatus.CANCELLED, updatedAt: new Date() },
    });

    await redisService.del(
      RedisKeys.order.byId(payload.orderId),
      RedisKeys.order.status(payload.orderId),
      RedisKeys.order.eligibility(payload.orderId),
      RedisKeys.order.summary(payload.orderId),
    );

    logger.debug('Order status updated and cache invalidated on order.cancelled', {
      orderId: payload.orderId,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    logger.error('handleOrderCancelled failed', {
      eventId: metadata.eventId,
      orderId: payload.orderId,
      error:   message,
    });
  }
}

async function handlePaymentSucceeded(
  envelope: EventEnvelope<PaymentSucceededPayload>,
): Promise<void> {
  const { payload, metadata } = envelope;

  logger.info('Handling payment.succeeded event', {
    eventId:         metadata.eventId,
    paymentIntentId: payload.paymentIntentId,
    orderId:         payload.orderId,
    amount:          payload.amount,
  });

  try {
    await prisma.order.update({
      where: { id: payload.orderId },
      data:  { status: OrderStatus.PAID, updatedAt: new Date() },
    });

    await redisService.del(
      RedisKeys.order.byId(payload.orderId),
      RedisKeys.order.status(payload.orderId),
      RedisKeys.order.eligibility(payload.orderId),
      RedisKeys.payment.byId(payload.paymentIntentId),
    );

    logger.info('Order marked as PAID after payment.succeeded', {
      orderId: payload.orderId,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    logger.error('handlePaymentSucceeded failed', {
      eventId: metadata.eventId,
      orderId: payload.orderId,
      error:   message,
    });
  }
}

async function handlePaymentFailed(
  envelope: EventEnvelope<PaymentFailedPayload>,
): Promise<void> {
  const { payload, metadata } = envelope;

  logger.warn('Handling payment.failed event', {
    eventId:         metadata.eventId,
    paymentIntentId: payload.paymentIntentId,
    orderId:         payload.orderId,
    errorCode:       payload.errorCode,
  });

  try {
    await prisma.payment.updateMany({
      where: { stripePaymentIntentId: payload.paymentIntentId },
      data:  { status: PaymentStatus.FAILED, updatedAt: new Date() },
    });

    await redisService.del(
      RedisKeys.order.byId(payload.orderId),
      RedisKeys.order.status(payload.orderId),
      RedisKeys.payment.byIntent(payload.paymentIntentId),
    );

    logger.warn('Payment marked as FAILED', {
      paymentIntentId: payload.paymentIntentId,
      orderId:         payload.orderId,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    logger.error('handlePaymentFailed failed', {
      eventId: metadata.eventId,
      orderId: payload.orderId,
      error:   message,
    });
  }
}

async function handleRefundInitiated(
  envelope: EventEnvelope<RefundInitiatedPayload>,
): Promise<void> {
  const { payload, metadata } = envelope;

  logger.info('Handling refund.initiated event', {
    eventId:     metadata.eventId,
    refundId:    payload.refundId,
    orderId:     payload.orderId,
    amount:      payload.amount,
    requestedBy: payload.requestedBy,
  });

  try {
    await redisService.del(
      RedisKeys.refund.byId(payload.refundId),
      RedisKeys.refund.byOrder(payload.orderId),
      RedisKeys.refund.eligibility(payload.orderId),
      RedisKeys.order.byId(payload.orderId),
      RedisKeys.order.summary(payload.orderId),
    );

    logger.debug('Refund and order cache invalidated on refund.initiated', {
      refundId: payload.refundId,
      orderId:  payload.orderId,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    logger.error('handleRefundInitiated cache invalidation failed', {
      eventId:  metadata.eventId,
      refundId: payload.refundId,
      error:    message,
    });
  }
}

async function handleRefundStatusUpdated(
  envelope: EventEnvelope<RefundStatusUpdatedPayload>,
): Promise<void> {
  const { payload, metadata } = envelope;

  logger.info('Handling refund.status-updated event', {
    eventId:       metadata.eventId,
    refundId:      payload.refundId,
    orderId:       payload.orderId,
    newStatus:     payload.newStatus,
    stripeRefundId: payload.stripeRefundId,
  });

  try {
    await redisService.del(
      RedisKeys.refund.byId(payload.refundId),
      RedisKeys.refund.byOrder(payload.orderId),
      RedisKeys.refund.statusBreakdown(),
      RedisKeys.order.byId(payload.orderId),
      RedisKeys.order.status(payload.orderId),
      RedisKeys.order.summary(payload.orderId),
    );

    logger.debug('Cache invalidated on refund.status-updated', {
      refundId:  payload.refundId,
      newStatus: payload.newStatus,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    logger.error('handleRefundStatusUpdated cache invalidation failed', {
      eventId:  metadata.eventId,
      refundId: payload.refundId,
      error:    message,
    });
  }
}