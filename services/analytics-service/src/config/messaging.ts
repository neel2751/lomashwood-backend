import { env } from './env';

export const messagingConfig = {
  broker: env.EVENT_BUS_BROKER,
  connection: {
    host: env.EVENT_BUS_HOST,
    port: env.EVENT_BUS_PORT,
    password: env.EVENT_BUS_PASSWORD || undefined,
  },
  consumer: {
    group: env.EVENT_BUS_CONSUMER_GROUP,
    id: env.EVENT_BUS_CONSUMER_ID,
  },
  retry: {
    maxAttempts: 3,
    backoffMs: 1000,
    maxBackoffMs: 10000,
  },
  topics: {
    subscribe: [
      'order.created',
      'order.cancelled',
      'payment.succeeded',
      'appointment.created',
      'appointment.cancelled',
      'appointment.completed',
      'product.viewed',
      'product.created',
      'product.updated',
      'user.created',
      'user.logged_in',
      'review.created',
      'brochure.requested',
      'newsletter.subscribed',
      'support_ticket.created',
    ],
    publish: [
      'analytics.event_tracked',
      'analytics.report_generated',
      'analytics.funnel_completed',
      'analytics.dashboard_refreshed',
    ],
  },
} as const;