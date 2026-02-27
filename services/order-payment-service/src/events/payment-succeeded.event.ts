import { EventProducer } from '../infrastructure/messaging/event-producer';
import { PAYMENT_SUCCEEDED_TOPIC } from '../infrastructure/messaging/event-topics';
import { buildEventMetadata } from '../infrastructure/messaging/event-metadata';
import { createLogger } from '../config/logger';
import { AppError } from '../shared/errors';
import { OrderStatus } from '../shared/types';

const logger = createLogger('payment-succeeded.event');

export type PaymentMethod =
  | 'CARD'
  | 'BANK_TRANSFER'
  | 'WALLET'
  | 'BUY_NOW_PAY_LATER'
  | 'OTHER';

export type PaymentGateway = 'STRIPE' | 'RAZORPAY';

export interface PaymentSucceededCustomer {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string | null;
}

export interface PaymentSucceededAddress {
  line1: string;
  line2: string | null;
  city: string;
  county: string | null;
  postcode: string;
  country: string;
}

export interface PaymentSucceededItem {
  id: string;
  productId: string;
  productTitle: string;
  categoryType: 'KITCHEN' | 'BEDROOM';
  quantity: number;
  unitPrice: number;
  lineTotal: number;
  currency: string;
}

export interface PaymentSucceededCard {
  brand: string | null;
  last4: string | null;
  expMonth: number | null;
  expYear: number | null;
  funding: string | null;
  country: string | null;
}

export interface PaymentSucceededGatewayMeta {
  gateway: PaymentGateway;
  gatewayPaymentId: string;
  gatewayCustomerId: string | null;
  gatewayChargeId: string | null;
  gatewayReceiptUrl: string | null;
  gatewayBalanceTransactionId: string | null;
  gatewayPaymentMethodId: string | null;
  rawStatus: string;
}

export interface PaymentSucceededEventPayload {
  eventId: string;
  eventType: 'PAYMENT_SUCCEEDED';
  eventVersion: '1.0';
  occurredAt: string;

  paymentId: string;
  orderId: string;
  orderNumber: string;
  invoiceId: string | null;
  orderStatus: OrderStatus;

  customer: PaymentSucceededCustomer;
  billingAddress: PaymentSucceededAddress;

  items: PaymentSucceededItem[];
  itemCount: number;

  paymentMethod: PaymentMethod;
  gatewayMeta: PaymentSucceededGatewayMeta;
  card: PaymentSucceededCard | null;

  subtotal: number;
  shippingCost: number;
  taxAmount: number;
  discountAmount: number;
  totalAmount: number;
  amountCaptured: number;
  currency: string;

  paidAt: string;

  includesKitchen: boolean;
  includesBedroom: boolean;

  appointmentId: string | null;

  idempotencyKey: string | null;

  metadata: Record<string, unknown>;
}

export async function publishPaymentSucceededEvent(
  eventProducer: EventProducer,
  payload: Omit<
    PaymentSucceededEventPayload,
    'eventId' | 'eventType' | 'eventVersion' | 'occurredAt'
  >,
): Promise<void> {
  const fullPayload: PaymentSucceededEventPayload = {
    ...payload,
    eventId: buildEventMetadata().eventId,
    eventType: 'PAYMENT_SUCCEEDED',
    eventVersion: '1.0',
    occurredAt: new Date().toISOString(),
  };

  logger.info(
    {
      eventId: fullPayload.eventId,
      paymentId: fullPayload.paymentId,
      orderId: fullPayload.orderId,
      orderNumber: fullPayload.orderNumber,
      customerId: fullPayload.customer.id,
      totalAmount: fullPayload.totalAmount,
      amountCaptured: fullPayload.amountCaptured,
      currency: fullPayload.currency,
      gateway: fullPayload.gatewayMeta.gateway,
      gatewayPaymentId: fullPayload.gatewayMeta.gatewayPaymentId,
    },
    'Publishing PAYMENT_SUCCEEDED event',
  );

  try {
    await eventProducer.publish(PAYMENT_SUCCEEDED_TOPIC, fullPayload);

    logger.info(
      {
        eventId: fullPayload.eventId,
        paymentId: fullPayload.paymentId,
        orderId: fullPayload.orderId,
      },
      'PAYMENT_SUCCEEDED event published successfully',
    );
  } catch (err) {
    logger.error(
      {
        eventId: fullPayload.eventId,
        paymentId: fullPayload.paymentId,
        orderId: fullPayload.orderId,
        error: err,
      },
      'Failed to publish PAYMENT_SUCCEEDED event',
    );

    throw new AppError(
      'EVENT_PUBLISH_FAILED',
      `Failed to publish PAYMENT_SUCCEEDED event for payment ${fullPayload.paymentId}`,
      500,
      { cause: err },
    );
  }
}

export interface BuildPaymentSucceededPayloadInput {
  paymentId: string;
  orderId: string;
  orderNumber: string;
  invoiceId: string | null;
  orderStatus: OrderStatus;
  customer: PaymentSucceededCustomer;
  billingAddress: PaymentSucceededAddress;
  items: PaymentSucceededItem[];
  paymentMethod: PaymentMethod;
  gatewayMeta: PaymentSucceededGatewayMeta;
  card: PaymentSucceededCard | null;
  subtotal: number;
  shippingCost: number;
  taxAmount: number;
  discountAmount: number;
  totalAmount: number;
  amountCaptured: number;
  currency: string;
  paidAt: Date;
  appointmentId: string | null;
  idempotencyKey: string | null;
  metadata?: Record<string, unknown>;
}

export function buildPaymentSucceededPayload(
  input: BuildPaymentSucceededPayloadInput,
): Omit<PaymentSucceededEventPayload, 'eventId' | 'eventType' | 'eventVersion' | 'occurredAt'> {
  const includesKitchen = input.items.some((i) => i.categoryType === 'KITCHEN');
  const includesBedroom = input.items.some((i) => i.categoryType === 'BEDROOM');

  return {
    paymentId: input.paymentId,
    orderId: input.orderId,
    orderNumber: input.orderNumber,
    invoiceId: input.invoiceId,
    orderStatus: input.orderStatus,
    customer: input.customer,
    billingAddress: input.billingAddress,
    items: input.items,
    itemCount: input.items.length,
    paymentMethod: input.paymentMethod,
    gatewayMeta: input.gatewayMeta,
    card: input.card,
    subtotal: input.subtotal,
    shippingCost: input.shippingCost,
    taxAmount: input.taxAmount,
    discountAmount: input.discountAmount,
    totalAmount: input.totalAmount,
    amountCaptured: input.amountCaptured,
    currency: input.currency,
    paidAt: input.paidAt.toISOString(),
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