import { EventProducer } from '../infrastructure/messaging/event-producer';
import { REFUND_ISSUED_TOPIC } from '../infrastructure/messaging/event-topics';
import { buildEventMetadata } from '../infrastructure/messaging/event-metadata';
import { createLogger } from '../config/logger';
import { AppError } from '../shared/errors';
import { OrderStatus } from '../shared/types';

const logger = createLogger('refund-issued.event');

export type RefundInitiator = 'CUSTOMER' | 'ADMIN' | 'SYSTEM';

export type RefundReason =
  | 'CUSTOMER_REQUEST'
  | 'PRODUCT_UNAVAILABLE'
  | 'DEFECTIVE_ITEM'
  | 'ORDER_CANCELLED'
  | 'DUPLICATE_CHARGE'
  | 'FRAUDULENT_CHARGE'
  | 'PRICING_ERROR'
  | 'DELIVERY_FAILED'
  | 'ADMIN_OVERRIDE'
  | 'OTHER';

export type RefundType = 'FULL' | 'PARTIAL';

export type RefundStatus = 'PENDING' | 'PROCESSING' | 'SUCCEEDED' | 'FAILED' | 'CANCELLED';

export interface RefundIssuedCustomer {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string | null;
}

export interface RefundIssuedItem {
  id: string;
  orderItemId: string;
  productId: string;
  productTitle: string;
  categoryType: 'KITCHEN' | 'BEDROOM';
  quantity: number;
  unitPrice: number;
  refundedAmount: number;
  currency: string;
}

export interface RefundIssuedGatewayMeta {
  gateway: 'STRIPE' | 'RAZORPAY';
  gatewayRefundId: string;
  gatewayPaymentId: string;
  gatewayChargeId: string | null;
  gatewayBalanceTransactionId: string | null;
  rawStatus: string;
}

export interface RefundIssuedEventPayload {
  eventId: string;
  eventType: 'REFUND_ISSUED';
  eventVersion: '1.0';
  occurredAt: string;

  refundId: string;
  paymentId: string;
  orderId: string;
  orderNumber: string;
  invoiceId: string | null;
  orderStatus: OrderStatus;

  customer: RefundIssuedCustomer;

  refundType: RefundType;
  refundStatus: RefundStatus;
  refundReason: RefundReason;
  refundNote: string | null;

  refundedItems: RefundIssuedItem[];
  refundedItemCount: number;

  originalAmount: number;
  refundAmount: number;
  remainingAmount: number;
  currency: string;

  gatewayMeta: RefundIssuedGatewayMeta;

  initiatedBy: RefundInitiator;
  initiatedByUserId: string | null;
  initiatedAt: string;

  includesKitchen: boolean;
  includesBedroom: boolean;

  appointmentId: string | null;

  idempotencyKey: string | null;

  metadata: Record<string, unknown>;
}

export async function publishRefundIssuedEvent(
  eventProducer: EventProducer,
  payload: Omit<
    RefundIssuedEventPayload,
    'eventId' | 'eventType' | 'eventVersion' | 'occurredAt'
  >,
): Promise<void> {
  const fullPayload: RefundIssuedEventPayload = {
    ...payload,
    eventId: buildEventMetadata().eventId,
    eventType: 'REFUND_ISSUED',
    eventVersion: '1.0',
    occurredAt: new Date().toISOString(),
  };

  logger.info(
    {
      eventId: fullPayload.eventId,
      refundId: fullPayload.refundId,
      paymentId: fullPayload.paymentId,
      orderId: fullPayload.orderId,
      orderNumber: fullPayload.orderNumber,
      customerId: fullPayload.customer.id,
      refundType: fullPayload.refundType,
      refundReason: fullPayload.refundReason,
      refundAmount: fullPayload.refundAmount,
      currency: fullPayload.currency,
      initiatedBy: fullPayload.initiatedBy,
      gateway: fullPayload.gatewayMeta.gateway,
      gatewayRefundId: fullPayload.gatewayMeta.gatewayRefundId,
    },
    'Publishing REFUND_ISSUED event',
  );

  try {
    await eventProducer.publish(REFUND_ISSUED_TOPIC, fullPayload);

    logger.info(
      {
        eventId: fullPayload.eventId,
        refundId: fullPayload.refundId,
        orderId: fullPayload.orderId,
      },
      'REFUND_ISSUED event published successfully',
    );
  } catch (err) {
    logger.error(
      {
        eventId: fullPayload.eventId,
        refundId: fullPayload.refundId,
        orderId: fullPayload.orderId,
        error: err,
      },
      'Failed to publish REFUND_ISSUED event',
    );

    throw new AppError(
      'EVENT_PUBLISH_FAILED',
      `Failed to publish REFUND_ISSUED event for refund ${fullPayload.refundId}`,
      500,
      { cause: err },
    );
  }
}

export interface BuildRefundIssuedPayloadInput {
  refundId: string;
  paymentId: string;
  orderId: string;
  orderNumber: string;
  invoiceId: string | null;
  orderStatus: OrderStatus;
  customer: RefundIssuedCustomer;
  refundType: RefundType;
  refundStatus: RefundStatus;
  refundReason: RefundReason;
  refundNote: string | null;
  refundedItems: RefundIssuedItem[];
  originalAmount: number;
  refundAmount: number;
  currency: string;
  gatewayMeta: RefundIssuedGatewayMeta;
  initiatedBy: RefundInitiator;
  initiatedByUserId: string | null;
  initiatedAt: Date;
  appointmentId: string | null;
  idempotencyKey: string | null;
  metadata?: Record<string, unknown>;
}

export function buildRefundIssuedPayload(
  input: BuildRefundIssuedPayloadInput,
): Omit<RefundIssuedEventPayload, 'eventId' | 'eventType' | 'eventVersion' | 'occurredAt'> {
  const includesKitchen = input.refundedItems.some((i) => i.categoryType === 'KITCHEN');
  const includesBedroom = input.refundedItems.some((i) => i.categoryType === 'BEDROOM');
  const remainingAmount = Math.max(0, input.originalAmount - input.refundAmount);

  return {
    refundId: input.refundId,
    paymentId: input.paymentId,
    orderId: input.orderId,
    orderNumber: input.orderNumber,
    invoiceId: input.invoiceId,
    orderStatus: input.orderStatus,
    customer: input.customer,
    refundType: input.refundType,
    refundStatus: input.refundStatus,
    refundReason: input.refundReason,
    refundNote: input.refundNote,
    refundedItems: input.refundedItems,
    refundedItemCount: input.refundedItems.length,
    originalAmount: input.originalAmount,
    refundAmount: input.refundAmount,
    remainingAmount,
    currency: input.currency,
    gatewayMeta: input.gatewayMeta,
    initiatedBy: input.initiatedBy,
    initiatedByUserId: input.initiatedByUserId,
    initiatedAt: input.initiatedAt.toISOString(),
    includesKitchen,
    includesBedroom,
    appointmentId: input.appointmentId,
    idempotencyKey: input.idempotencyKey,
    metadata: {
      ...(input.metadata ?? {}),
      publishedBy: 'order-payment-service',
    },
  };
}