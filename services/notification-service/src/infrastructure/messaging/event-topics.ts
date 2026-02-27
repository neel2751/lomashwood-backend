export const EVENT_TOPICS = {
  AUTH: {
    USER_CREATED: 'auth.user.created',
    USER_LOGGED_IN: 'auth.user.logged-in',
    PASSWORD_RESET: 'auth.user.password-reset',
    ROLE_UPDATED: 'auth.user.role-updated',
  },
  PRODUCT: {
    PRODUCT_CREATED: 'product.product.created',
    PRODUCT_UPDATED: 'product.product.updated',
    INVENTORY_UPDATED: 'product.inventory.updated',
    PRICE_CHANGED: 'product.pricing.changed',
  },
  ORDER: {
    ORDER_CREATED: 'order.order.created',
    ORDER_CANCELLED: 'order.order.cancelled',
    PAYMENT_SUCCEEDED: 'order.payment.succeeded',
    REFUND_ISSUED: 'order.refund.issued',
  },
  APPOINTMENT: {
    BOOKING_CREATED: 'appointment.booking.created',
    BOOKING_CANCELLED: 'appointment.booking.cancelled',
    REMINDER_SENT: 'appointment.reminder.due',
    CONSULTANT_UPDATED: 'appointment.consultant.updated',
  },
  CONTENT: {
    BLOG_PUBLISHED: 'content.blog.published',
    BLOG_UPDATED: 'content.blog.updated',
    MEDIA_UPLOADED: 'content.media.uploaded',
    PAGE_PUBLISHED: 'content.page.published',
  },
  CUSTOMER: {
    PROFILE_UPDATED: 'customer.profile.updated',
    REVIEW_CREATED: 'customer.review.created',
    SUPPORT_TICKET_CREATED: 'customer.support.ticket-created',
    LOYALTY_POINTS_EARNED: 'customer.loyalty.points-earned',
  },
  NOTIFICATION: {
    EMAIL_SENT: 'notification.email.sent',
    SMS_SENT: 'notification.sms.sent',
    PUSH_SENT: 'notification.push.sent',
    NOTIFICATION_FAILED: 'notification.delivery.failed',
  },
} as const;

export type EventTopic =
  | (typeof EVENT_TOPICS.AUTH)[keyof typeof EVENT_TOPICS.AUTH]
  | (typeof EVENT_TOPICS.PRODUCT)[keyof typeof EVENT_TOPICS.PRODUCT]
  | (typeof EVENT_TOPICS.ORDER)[keyof typeof EVENT_TOPICS.ORDER]
  | (typeof EVENT_TOPICS.APPOINTMENT)[keyof typeof EVENT_TOPICS.APPOINTMENT]
  | (typeof EVENT_TOPICS.CONTENT)[keyof typeof EVENT_TOPICS.CONTENT]
  | (typeof EVENT_TOPICS.CUSTOMER)[keyof typeof EVENT_TOPICS.CUSTOMER]
  | (typeof EVENT_TOPICS.NOTIFICATION)[keyof typeof EVENT_TOPICS.NOTIFICATION];

export const ALL_TOPICS: string[] = Object.values(EVENT_TOPICS).flatMap((group) =>
  Object.values(group),
);