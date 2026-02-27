import { registerEventHandler } from '../../infrastructure/messaging/event-consumer';
import { ANALYTICS_EVENT_TOPICS } from '../../infrastructure/messaging/event-topics';
import { logger } from '../../config/logger';
import {
  handleOrderCreated,
  handlePaymentSucceeded,
  handleAppointmentCreated,
  handleAppointmentCompleted,
  handleProductViewed,
  handleUserCreated,
  handleUserLoggedIn,
  handleReviewCreated,
  handleBrochureRequested,
} from './handlers';
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

export async function registerEventSubscriptions(): Promise<void> {
  registerEventHandler<OrderCreatedEventPayload>(
    ANALYTICS_EVENT_TOPICS.SUBSCRIBE.ORDER_CREATED,
    handleOrderCreated,
  );

  registerEventHandler<PaymentSucceededEventPayload>(
    ANALYTICS_EVENT_TOPICS.SUBSCRIBE.PAYMENT_SUCCEEDED,
    handlePaymentSucceeded,
  );

  registerEventHandler<AppointmentCreatedEventPayload>(
    ANALYTICS_EVENT_TOPICS.SUBSCRIBE.APPOINTMENT_CREATED,
    handleAppointmentCreated,
  );

  registerEventHandler<AppointmentCompletedEventPayload>(
    ANALYTICS_EVENT_TOPICS.SUBSCRIBE.APPOINTMENT_COMPLETED,
    handleAppointmentCompleted,
  );

  registerEventHandler<ProductViewedEventPayload>(
    ANALYTICS_EVENT_TOPICS.SUBSCRIBE.PRODUCT_VIEWED,
    handleProductViewed,
  );

  registerEventHandler<UserCreatedEventPayload>(
    ANALYTICS_EVENT_TOPICS.SUBSCRIBE.USER_CREATED,
    handleUserCreated,
  );

  registerEventHandler<UserLoggedInEventPayload>(
    ANALYTICS_EVENT_TOPICS.SUBSCRIBE.USER_LOGGED_IN,
    handleUserLoggedIn,
  );

  registerEventHandler<ReviewCreatedEventPayload>(
    ANALYTICS_EVENT_TOPICS.SUBSCRIBE.REVIEW_CREATED,
    handleReviewCreated,
  );

  registerEventHandler<BrochureRequestedEventPayload>(
    ANALYTICS_EVENT_TOPICS.SUBSCRIBE.BROCHURE_REQUESTED,
    handleBrochureRequested,
  );

  logger.info('All analytics event subscriptions registered');
}