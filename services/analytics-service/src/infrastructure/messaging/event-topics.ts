export const ANALYTICS_EVENT_TOPICS = {
  SUBSCRIBE: {
    ORDER_CREATED: 'order.created',
    ORDER_CANCELLED: 'order.cancelled',
    PAYMENT_SUCCEEDED: 'payment.succeeded',
    APPOINTMENT_CREATED: 'appointment.created',
    APPOINTMENT_CANCELLED: 'appointment.cancelled',
    APPOINTMENT_COMPLETED: 'appointment.completed',
    PRODUCT_VIEWED: 'product.viewed',
    PRODUCT_CREATED: 'product.created',
    PRODUCT_UPDATED: 'product.updated',
    USER_CREATED: 'user.created',
    USER_LOGGED_IN: 'user.logged_in',
    REVIEW_CREATED: 'review.created',
    BROCHURE_REQUESTED: 'brochure.requested',
    NEWSLETTER_SUBSCRIBED: 'newsletter.subscribed',
    SUPPORT_TICKET_CREATED: 'support_ticket.created',
  },

  PUBLISH: {
    EVENT_TRACKED: 'analytics.event_tracked',
    REPORT_GENERATED: 'analytics.report_generated',
    FUNNEL_COMPLETED: 'analytics.funnel_completed',
    DASHBOARD_REFRESHED: 'analytics.dashboard_refreshed',
  },
} as const;

export type AnalyticsSubscribeTopic =
  (typeof ANALYTICS_EVENT_TOPICS.SUBSCRIBE)[keyof typeof ANALYTICS_EVENT_TOPICS.SUBSCRIBE];

export type AnalyticsPublishTopic =
  (typeof ANALYTICS_EVENT_TOPICS.PUBLISH)[keyof typeof ANALYTICS_EVENT_TOPICS.PUBLISH];