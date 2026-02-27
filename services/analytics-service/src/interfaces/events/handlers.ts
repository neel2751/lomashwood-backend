import { getPrismaClient } from '../../infrastructure/db/prisma.client';
import { publishEvent } from '../../infrastructure/messaging/event-consumer';
import { ANALYTICS_EVENT_TOPICS } from '../../infrastructure/messaging/event-topics';
import { logger } from '../../config/logger';
import type { ConsumedEventEnvelope } from '../../infrastructure/messaging/event-metadata';
import type {
  OrderCreatedEventPayload,
  PaymentSucceededEventPayload,
  AppointmentCreatedEventPayload,
  AppointmentCompletedEventPayload,
  ProductViewedEventPayload,
  UserCreatedEventPayload,
  UserLoggedInEventPayload,
  ReviewCreatedEventPayload,
  BrochureRequestedEventPayload,
} from './payload.types';

const db = getPrismaClient() as any;

export async function handleOrderCreated(
  envelope: ConsumedEventEnvelope<OrderCreatedEventPayload>,
): Promise<void> {
  const { payload, metadata } = envelope;

  await db.conversionEvent.create({
    data: {
      sessionId:      payload.correlationId ?? 'unknown',
      visitorId:      payload.userId,
      userId:         payload.userId,
      conversionType: 'ORDER_CREATED',
      value:          payload.totalAmount,
      currency:       payload.currency,
      orderId:        payload.orderId,
      properties: {
        itemCount: payload.itemCount,
        source:    metadata.service,
      },
    },
  });

  await publishEvent(
    ANALYTICS_EVENT_TOPICS.PUBLISH.EVENT_TRACKED,
    { type: 'ORDER_CREATED', orderId: payload.orderId },
    { correlationId: metadata.correlationId, userId: payload.userId },
  );

  logger.info({ orderId: payload.orderId, userId: payload.userId }, 'Order created event tracked');
}

export async function handlePaymentSucceeded(
  envelope: ConsumedEventEnvelope<PaymentSucceededEventPayload>,
): Promise<void> {
  const { payload, metadata } = envelope;

  await db.conversionEvent.create({
    data: {
      sessionId:      payload.correlationId ?? 'unknown',
      visitorId:      payload.userId,
      userId:         payload.userId,
      conversionType: 'PAYMENT_SUCCEEDED',
      value:          payload.amount,
      currency:       payload.currency,
      orderId:        payload.orderId,
      properties: {
        paymentId: payload.paymentId,
        source:    metadata.service,
      },
    },
  });

  logger.info(
    { paymentId: payload.paymentId, userId: payload.userId },
    'Payment succeeded event tracked',
  );
}

export async function handleAppointmentCreated(
  envelope: ConsumedEventEnvelope<AppointmentCreatedEventPayload>,
): Promise<void> {
  const { payload, metadata } = envelope;

  await db.analyticsEvent.create({
    data: {
      sessionId: payload.correlationId ?? 'unknown',
      visitorId: payload.userId,
      userId:    payload.userId,
      eventType: 'APPOINTMENT_START',
      eventName: 'appointment_created',
      properties: {
        appointmentId:   payload.appointmentId,
        appointmentType: payload.appointmentType,
        consultantId:    payload.consultantId,
        forKitchen:      payload.forKitchen,
        forBedroom:      payload.forBedroom,
        source:          metadata.service,
      },
    },
  });

  logger.info(
    { appointmentId: payload.appointmentId, userId: payload.userId },
    'Appointment created event tracked',
  );
}

export async function handleAppointmentCompleted(
  envelope: ConsumedEventEnvelope<AppointmentCompletedEventPayload>,
): Promise<void> {
  const { payload, metadata } = envelope;

  await db.analyticsEvent.create({
    data: {
      sessionId: payload.correlationId ?? 'unknown',
      visitorId: payload.userId,
      userId:    payload.userId,
      eventType: 'APPOINTMENT_COMPLETE',
      eventName: 'appointment_completed',
      properties: {
        appointmentId:   payload.appointmentId,
        appointmentType: payload.appointmentType,
        consultantId:    payload.consultantId,
        source:          metadata.service,
      },
    },
  });

  await publishEvent(
    ANALYTICS_EVENT_TOPICS.PUBLISH.FUNNEL_COMPLETED,
    { funnelType: 'appointment', appointmentId: payload.appointmentId, userId: payload.userId },
    { correlationId: metadata.correlationId, userId: payload.userId },
  );

  logger.info(
    { appointmentId: payload.appointmentId, userId: payload.userId },
    'Appointment completed event tracked',
  );
}

export async function handleProductViewed(
  envelope: ConsumedEventEnvelope<ProductViewedEventPayload>,
): Promise<void> {
  const { payload } = envelope;

  await db.analyticsEvent.create({
    data: {
      sessionId: payload.sessionId,
      visitorId: payload.visitorId,
      userId:    payload.userId,
      eventType: 'PRODUCT_VIEW',
      eventName: 'product_viewed',
      page:      payload.page,
      properties: {
        productId: payload.productId,
        category:  payload.category,
      },
    },
  });

  logger.debug(
    { productId: payload.productId, visitorId: payload.visitorId },
    'Product viewed event tracked',
  );
}

export async function handleUserCreated(
  envelope: ConsumedEventEnvelope<UserCreatedEventPayload>,
): Promise<void> {
  const { payload } = envelope;

  await db.analyticsEvent.create({
    data: {
      sessionId: payload.correlationId ?? 'unknown',
      visitorId: payload.userId,
      userId:    payload.userId,
      eventType: 'CUSTOM',
      eventName: 'user_registered',
      properties: {
        role: payload.role,
      },
    },
  });

  logger.info({ userId: payload.userId }, 'User created event tracked');
}

export async function handleUserLoggedIn(
  envelope: ConsumedEventEnvelope<UserLoggedInEventPayload>,
): Promise<void> {
  const { payload } = envelope;

  await db.analyticsEvent.create({
    data: {
      sessionId: payload.sessionId,
      visitorId: payload.userId,
      userId:    payload.userId,
      eventType: 'SESSION_START',
      eventName: 'user_logged_in',
      ipHash:    payload.ipHash,
      properties: {
        deviceType: payload.deviceType,
        country:    payload.country,
      },
    },
  });

  logger.debug({ userId: payload.userId }, 'User login event tracked');
}

export async function handleReviewCreated(
  envelope: ConsumedEventEnvelope<ReviewCreatedEventPayload>,
): Promise<void> {
  const { payload } = envelope;

  await db.conversionEvent.create({
    data: {
      sessionId:      payload.correlationId ?? 'unknown',
      visitorId:      payload.userId,
      userId:         payload.userId,
      conversionType: 'REVIEW_SUBMITTED',
      properties: {
        reviewId:  payload.reviewId,
        productId: payload.productId,
        rating:    payload.rating,
      },
    },
  });

  logger.debug(
    { reviewId: payload.reviewId, userId: payload.userId },
    'Review created event tracked',
  );
}

export async function handleBrochureRequested(
  envelope: ConsumedEventEnvelope<BrochureRequestedEventPayload>,
): Promise<void> {
  const { payload } = envelope;

  await db.analyticsEvent.create({
    data: {
      sessionId: payload.correlationId ?? 'unknown',
      visitorId: payload.userId ?? payload.email,
      userId:    payload.userId,
      eventType: 'BROCHURE_REQUEST',
      eventName: 'brochure_requested',
      properties: {
        requestId: payload.requestId,
        postcode:  payload.postcode,
      },
    },
  });

  await publishEvent(
    ANALYTICS_EVENT_TOPICS.PUBLISH.FUNNEL_COMPLETED,
    { funnelType: 'brochure_request', requestId: payload.requestId },
    { correlationId: payload.correlationId },
  );

  logger.info({ requestId: payload.requestId }, 'Brochure request event tracked');
}