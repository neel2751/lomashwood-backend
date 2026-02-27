import { redisSubscriber } from '../../infrastructure/cache/redis.client';
import { logger } from '../../config/logger';
import { INBOUND_EVENT_TOPICS, InboundEventTopic } from '../../infrastructure/messaging/event-topics';
import {
  handleOrderCompleted,
  handleOrderCancelled,
  handlePaymentSucceeded,
  handleAppointmentBooked,
  handleAppointmentCancelled,
  handleUserRegistered,
} from './handlers';
import {
  OrderCompletedPayload,
  OrderCancelledPayload,
  PaymentSucceededPayload,
  AppointmentBookedPayload,
  AppointmentCancelledPayload,
  UserRegisteredPayload,
  InboundEventEnvelope,
} from './payload.types';

type TopicHandler = (message: string) => Promise<void>;

const topicHandlerMap: Record<InboundEventTopic, TopicHandler> = {
  [INBOUND_EVENT_TOPICS.ORDER_COMPLETED]: async (message) => {
    const envelope = parseEnvelope<OrderCompletedPayload>(message);
    if (envelope) await handleOrderCompleted(envelope);
  },
  [INBOUND_EVENT_TOPICS.ORDER_CANCELLED]: async (message) => {
    const envelope = parseEnvelope<OrderCancelledPayload>(message);
    if (envelope) await handleOrderCancelled(envelope);
  },
  [INBOUND_EVENT_TOPICS.PAYMENT_SUCCEEDED]: async (message) => {
    const envelope = parseEnvelope<PaymentSucceededPayload>(message);
    if (envelope) await handlePaymentSucceeded(envelope);
  },
  [INBOUND_EVENT_TOPICS.APPOINTMENT_BOOKED]: async (message) => {
    const envelope = parseEnvelope<AppointmentBookedPayload>(message);
    if (envelope) await handleAppointmentBooked(envelope);
  },
  [INBOUND_EVENT_TOPICS.APPOINTMENT_CANCELLED]: async (message) => {
    const envelope = parseEnvelope<AppointmentCancelledPayload>(message);
    if (envelope) await handleAppointmentCancelled(envelope);
  },
  [INBOUND_EVENT_TOPICS.USER_REGISTERED]: async (message) => {
    const envelope = parseEnvelope<UserRegisteredPayload>(message);
    if (envelope) await handleUserRegistered(envelope);
  },
};

export async function registerEventSubscriptions(): Promise<void> {
  const topics = Object.values(INBOUND_EVENT_TOPICS);

  await redisSubscriber.subscribe(...topics);

  redisSubscriber.on('message', async (channel: string, message: string) => {
    const topic = channel as InboundEventTopic;
    const handler = topicHandlerMap[topic];

    if (!handler) {
      logger.warn({ topic: channel }, 'No handler registered for topic');
      return;
    }

    try {
      await handler(message);
    } catch (error) {
      logger.error(
        {
          topic: channel,
          error: (error as Error).message,
          stack: (error as Error).stack,
        },
        'Unhandled error in event handler',
      );
    }
  });

  redisSubscriber.on('subscribe', (channel: string, count: number) => {
    logger.info({ topic: channel, totalSubscriptions: count }, 'Subscribed to topic');
  });

  redisSubscriber.on('error', (err: Error) => {
    logger.error({ error: err.message }, 'Redis subscriber error');
  });

  logger.info(
    { topics, count: topics.length },
    'Event subscriptions registered',
  );
}

export async function deregisterEventSubscriptions(): Promise<void> {
  const topics = Object.values(INBOUND_EVENT_TOPICS);
  await redisSubscriber.unsubscribe(...topics);
  logger.info({ count: topics.length }, 'Event subscriptions deregistered');
}

function parseEnvelope<T>(message: string): InboundEventEnvelope<T> | null {
  try {
    return JSON.parse(message) as InboundEventEnvelope<T>;
  } catch (error) {
    logger.error(
      { error: (error as Error).message, raw: message.slice(0, 200) },
      'Failed to parse event envelope',
    );
    return null;
  }
}