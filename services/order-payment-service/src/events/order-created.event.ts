import { EventProducer } from '../infrastructure/messaging/event-producer';
import { ORDER_CREATED_TOPIC } from '../infrastructure/messaging/event-topics';
import { buildEventMetadata } from '../infrastructure/messaging/event-metadata';
import { createLogger } from '../config/logger';
import { AppError } from '../shared/errors';
import { OrderStatus, PaymentStatus } from '../shared/types';

const logger = createLogger('order-created.event');


export interface OrderCreatedCustomer {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string | null;
}

export interface OrderCreatedAddress {
  line1: string;
  line2: string | null;
  city: string;
  county: string | null;
  postcode: string;
  country: string;
}

export interface OrderCreatedItem {
  id: string;
  productId: string;
  productTitle: string;
  categoryType: 'KITCHEN' | 'BEDROOM';
  rangeId: string | null;
  rangeName: string | null;
  colourId: string | null;
  colourName: string | null;
  colourHex: string | null;
  sizeId: string | null;
  sizeLabel: string | null;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
  currency: string;
  imageUrl: string | null;
}

export interface OrderCreatedPayment {
  id: string;
  stripePaymentIntentId: string | null;
  stripeClientSecret: string | null;
  method: string | null;
  status: PaymentStatus;
  amount: number;
  currency: string;
}

export interface OrderCreatedCoupon {
  code: string;
  discountType: 'PERCENTAGE' | 'FIXED';
  discountValue: number;
  discountAmount: number;
}

export interface OrderCreatedEventPayload {
  
  eventId: string;
  eventType: 'ORDER_CREATED';
  eventVersion: '1.0';
  occurredAt: string;

  orderId: string;
  orderNumber: string;
  orderStatus: OrderStatus;
  customer: OrderCreatedCustomer;

  shippingAddress: OrderCreatedAddress;
  billingAddress: OrderCreatedAddress;

  items: OrderCreatedItem[];
  itemCount: number;

  subtotal: number;
  shippingCost: number;
  taxAmount: number;
  discountAmount: number;
  totalAmount: number;
  currency: string;

  coupon: OrderCreatedCoupon | null;

  appointmentId: string | null;

  payment: OrderCreatedPayment | null;

  includesKitchen: boolean;
  includesBedroom: boolean;

  source: 'WEB' | 'ADMIN' | 'API';

  metadata: Record<string, unknown>;
}

export async function publishOrderCreatedEvent(
  eventProducer: EventProducer,
  payload: Omit<OrderCreatedEventPayload, 'eventId' | 'eventType' | 'eventVersion' | 'occurredAt'>,
): Promise<void> {
  const fullPayload: OrderCreatedEventPayload = {
    ...payload,
    eventId: buildEventMetadata().eventId,
    eventType: 'ORDER_CREATED',
    eventVersion: '1.0',
    occurredAt: new Date().toISOString(),
  };

  logger.info(
    {
      eventId: fullPayload.eventId,
      orderId: fullPayload.orderId,
      orderNumber: fullPayload.orderNumber,
      customerId: fullPayload.customer.id,
      totalAmount: fullPayload.totalAmount,
      currency: fullPayload.currency,
      includesKitchen: fullPayload.includesKitchen,
      includesBedroom: fullPayload.includesBedroom,
    },
    'Publishing ORDER_CREATED event',
  );

  try {
    await eventProducer.publish(ORDER_CREATED_TOPIC, fullPayload);

    logger.info(
      { eventId: fullPayload.eventId, orderId: fullPayload.orderId },
      'ORDER_CREATED event published successfully',
    );
  } catch (err) {
    logger.error(
      { eventId: fullPayload.eventId, orderId: fullPayload.orderId, error: err },
      'Failed to publish ORDER_CREATED event',
    );

    throw new AppError(
      'EVENT_PUBLISH_FAILED',
      `Failed to publish ORDER_CREATED event for order ${fullPayload.orderId}`,
      500,
      { cause: err },
    );
  }
}


export interface BuildOrderCreatedPayloadInput {
  orderId: string;
  orderNumber: string;
  orderStatus: OrderStatus;
  customer: OrderCreatedCustomer;
  shippingAddress: OrderCreatedAddress;
  billingAddress: OrderCreatedAddress;
  items: OrderCreatedItem[];
  subtotal: number;
  shippingCost: number;
  taxAmount: number;
  discountAmount: number;
  totalAmount: number;
  currency: string;
  coupon: OrderCreatedCoupon | null;
  appointmentId: string | null;
  payment: OrderCreatedPayment | null;
  source: OrderCreatedEventPayload['source'];
  metadata?: Record<string, unknown>;
}

export function buildOrderCreatedPayload(
  input: BuildOrderCreatedPayloadInput,
): Omit<OrderCreatedEventPayload, 'eventId' | 'eventType' | 'eventVersion' | 'occurredAt'> {
  const includesKitchen = input.items.some((i) => i.categoryType === 'KITCHEN');
  const includesBedroom = input.items.some((i) => i.categoryType === 'BEDROOM');

  return {
    orderId: input.orderId,
    orderNumber: input.orderNumber,
    orderStatus: input.orderStatus,
    customer: input.customer,
    shippingAddress: input.shippingAddress,
    billingAddress: input.billingAddress,
    items: input.items,
    itemCount: input.items.length,
    subtotal: input.subtotal,
    shippingCost: input.shippingCost,
    taxAmount: input.taxAmount,
    discountAmount: input.discountAmount,
    totalAmount: input.totalAmount,
    currency: input.currency,
    coupon: input.coupon,
    appointmentId: input.appointmentId,
    payment: input.payment,
    includesKitchen,
    includesBedroom,
    source: input.source,
    metadata: {
      ...(input.metadata ?? {}),
      publishedBy: 'order-payment-service',
    },
  };
}