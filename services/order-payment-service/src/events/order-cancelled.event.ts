import { EventProducer } from '../infrastructure/messaging/event-producer';
import { ORDER_CANCELLED_TOPIC } from '../infrastructure/messaging/event-topics';
import { buildEventMetadata } from '../infrastructure/messaging/event-metadata';
import { createLogger } from '../config/logger';
import { AppError } from '../shared/errors';
import { OrderStatus, PaymentStatus } from '../shared/types';

const logger = createLogger('order-cancelled.event');

export type CancellationInitiator = 'CUSTOMER' | 'ADMIN' | 'SYSTEM';

export type CancellationReason =
  | 'CUSTOMER_REQUEST'
  | 'PAYMENT_FAILED'
  | 'PAYMENT_TIMEOUT'
  | 'INVENTORY_UNAVAILABLE'
  | 'FRAUD_DETECTED'
  | 'DUPLICATE_ORDER'
  | 'ADMIN_OVERRIDE'
  | 'SYSTEM_TIMEOUT'
  | 'OTHER';

export interface OrderCancelledCustomer {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string | null;
}

export interface OrderCancelledItem {
  id: string;
  productId: string;
  productTitle: string;
  categoryType: 'KITCHEN' | 'BEDROOM';
  quantity: number;
  unitPrice: number;
  lineTotal: number;
  currency: string;
}

export interface OrderCancelledRefund {
  id: string;
  stripeRefundId: string | null;
  amount: number;
  currency: string;
  status: 'PENDING' | 'PROCESSING' | 'SUCCEEDED' | 'FAILED';
  initiatedAt: string;
}

export interface OrderCancelledPayment {
  id: string;
  stripePaymentIntentId: string | null;
  status: PaymentStatus;
  amount: number;
  currency: string;
  refund: OrderCancelledRefund | null;
}

export interface OrderCancelledEventPayload {
  eventId: string;
  eventType: 'ORDER_CANCELLED';
  eventVersion: '1.0';
  occurredAt: string;

  orderId: string;
  orderNumber: string;
  previousStatus: OrderStatus;
  currentStatus: OrderStatus;

  customer: OrderCancelledCustomer;

  items: OrderCancelledItem[];
  itemCount: number;

  subtotal: number;
  shippingCost: number;
  taxAmount: number;
  discountAmount: number;
  totalAmount: number;
  currency: string;

  cancellationInitiator: CancellationInitiator;
  cancellationReason: CancellationReason;
  cancellationNote: string | null;
  cancelledAt: string;
  cancelledByUserId: string | null;

  appointmentId: string | null;

  includesKitchen: boolean;
  includesBedroom: boolean;

  payment: OrderCancelledPayment | null;
  refundEligible: boolean;

  metadata: Record<string, unknown>;
}

export async function publishOrderCancelledEvent(
  eventProducer: EventProducer,
  payload: Omit<
    OrderCancelledEventPayload,
    'eventId' | 'eventType' | 'eventVersion' | 'occurredAt'
  >,
): Promise<void> {
  const fullPayload: OrderCancelledEventPayload = {
    ...payload,
    eventId: buildEventMetadata().eventId,
    eventType: 'ORDER_CANCELLED',
    eventVersion: '1.0',
    occurredAt: new Date().toISOString(),
  };

  logger.info(
    {
      eventId: fullPayload.eventId,
      orderId: fullPayload.orderId,
      orderNumber: fullPayload.orderNumber,
      customerId: fullPayload.customer.id,
      cancellationInitiator: fullPayload.cancellationInitiator,
      cancellationReason: fullPayload.cancellationReason,
      refundEligible: fullPayload.refundEligible,
    },
    'Publishing ORDER_CANCELLED event',
  );

  try {
    await eventProducer.publish(ORDER_CANCELLED_TOPIC, fullPayload);

    logger.info(
      { eventId: fullPayload.eventId, orderId: fullPayload.orderId },
      'ORDER_CANCELLED event published successfully',
    );
  } catch (err) {
    logger.error(
      { eventId: fullPayload.eventId, orderId: fullPayload.orderId, error: err },
      'Failed to publish ORDER_CANCELLED event',
    );

    throw new AppError(
      'EVENT_PUBLISH_FAILED',
      `Failed to publish ORDER_CANCELLED event for order ${fullPayload.orderId}`,
      500,
      { cause: err },
    );
  }
}

export interface BuildOrderCancelledPayloadInput {
  orderId: string;
  orderNumber: string;
  previousStatus: OrderStatus;
  currentStatus: OrderStatus;
  customer: OrderCancelledCustomer;
  items: OrderCancelledItem[];
  subtotal: number;
  shippingCost: number;
  taxAmount: number;
  discountAmount: number;
  totalAmount: number;
  currency: string;
  cancellationInitiator: CancellationInitiator;
  cancellationReason: CancellationReason;
  cancellationNote: string | null;
  cancelledAt: Date;
  cancelledByUserId: string | null;
  appointmentId: string | null;
  payment: OrderCancelledPayment | null;
  metadata?: Record<string, unknown>;
}

export function buildOrderCancelledPayload(
  input: BuildOrderCancelledPayloadInput,
): Omit<OrderCancelledEventPayload, 'eventId' | 'eventType' | 'eventVersion' | 'occurredAt'> {
  const includesKitchen = input.items.some((i) => i.categoryType === 'KITCHEN');
  const includesBedroom = input.items.some((i) => i.categoryType === 'BEDROOM');

  const refundEligible =
    input.payment !== null &&
    input.payment.status === PaymentStatus.SUCCEEDED &&
    input.payment.refund === null;

  return {
    orderId: input.orderId,
    orderNumber: input.orderNumber,
    previousStatus: input.previousStatus,
    currentStatus: input.currentStatus,
    customer: input.customer,
    items: input.items,
    itemCount: input.items.length,
    subtotal: input.subtotal,
    shippingCost: input.shippingCost,
    taxAmount: input.taxAmount,
    discountAmount: input.discountAmount,
    totalAmount: input.totalAmount,
    currency: input.currency,
    cancellationInitiator: input.cancellationInitiator,
    cancellationReason: input.cancellationReason,
    cancellationNote: input.cancellationNote,
    cancelledAt: input.cancelledAt.toISOString(),
    cancelledByUserId: input.cancelledByUserId,
    appointmentId: input.appointmentId,
    includesKitchen,
    includesBedroom,
    payment: input.payment,
    refundEligible,
    metadata: {
      ...(input.metadata ?? {}),
      publishedBy: 'order-payment-service',
    },
  };
}