export const EVENT_TOPICS = {
  PRODUCT: {
    CREATED: 'product.created',
    UPDATED: 'product.updated',
    DELETED: 'product.deleted',
    INVENTORY_UPDATED: 'product.inventory.updated',
    PRICE_CHANGED: 'product.price.changed',
    CATEGORY_UPDATED: 'product.category.updated',
    COLOUR_UPDATED: 'product.colour.updated',
    SIZE_UPDATED: 'product.size.updated',
  },

  ORDER: {
    CREATED: 'order.created',
    UPDATED: 'order.updated',
    CANCELLED: 'order.cancelled',
    CONFIRMED: 'order.confirmed',
    COMPLETED: 'order.completed',
    FAILED: 'order.failed',
    ITEM_ADDED: 'order.item.added',
    ITEM_REMOVED: 'order.item.removed',
  },

  PAYMENT: {
    INITIATED: 'payment.initiated',
    SUCCEEDED: 'payment.succeeded',
    FAILED: 'payment.failed',
    REFUND_INITIATED: 'payment.refund.initiated',
    REFUND_ISSUED: 'payment.refund.issued',
    REFUND_FAILED: 'payment.refund.failed',
    WEBHOOK_RECEIVED: 'payment.webhook.received',
    INVOICE_GENERATED: 'payment.invoice.generated',
  },

  APPOINTMENT: {
    BOOKING_CREATED: 'appointment.booking.created',
    BOOKING_UPDATED: 'appointment.booking.updated',
    BOOKING_CANCELLED: 'appointment.booking.cancelled',
    BOOKING_CONFIRMED: 'appointment.booking.confirmed',
    BOOKING_COMPLETED: 'appointment.booking.completed',
    REMINDER_SENT: 'appointment.reminder.sent',
    CONSULTANT_ASSIGNED: 'appointment.consultant.assigned',
    CONSULTANT_UPDATED: 'appointment.consultant.updated',
    SLOT_RELEASED: 'appointment.slot.released',
    RESCHEDULE_REQUESTED: 'appointment.reschedule.requested',
  },

  CONTENT: {
    BLOG_CREATED: 'content.blog.created',
    BLOG_UPDATED: 'content.blog.updated',
    BLOG_PUBLISHED: 'content.blog.published',
    BLOG_DELETED: 'content.blog.deleted',
    MEDIA_UPLOADED: 'content.media.uploaded',
    MEDIA_DELETED: 'content.media.deleted',
    PAGE_PUBLISHED: 'content.page.published',
    PAGE_UPDATED: 'content.page.updated',
    SEO_UPDATED: 'content.seo.updated',
    LANDING_PAGE_CREATED: 'content.landing.created',
  },

  CUSTOMER: {
    REGISTERED: 'customer.registered',
    PROFILE_UPDATED: 'customer.profile.updated',
    PROFILE_DELETED: 'customer.profile.deleted',
    REVIEW_CREATED: 'customer.review.created',
    REVIEW_UPDATED: 'customer.review.updated',
    REVIEW_DELETED: 'customer.review.deleted',
    SUPPORT_TICKET_CREATED: 'customer.support.ticket.created',
    SUPPORT_TICKET_UPDATED: 'customer.support.ticket.updated',
    LOYALTY_POINTS_EARNED: 'customer.loyalty.points.earned',
    LOYALTY_POINTS_REDEEMED: 'customer.loyalty.points.redeemed',
    WISHLIST_ITEM_ADDED: 'customer.wishlist.item.added',
    WISHLIST_ITEM_REMOVED: 'customer.wishlist.item.removed',
  },

  NOTIFICATION: {
    EMAIL_SENT: 'notification.email.sent',
    EMAIL_FAILED: 'notification.email.failed',
    EMAIL_BOUNCED: 'notification.email.bounced',
    SMS_SENT: 'notification.sms.sent',
    SMS_FAILED: 'notification.sms.failed',
    PUSH_SENT: 'notification.push.sent',
    PUSH_FAILED: 'notification.push.failed',
    TEMPLATE_CREATED: 'notification.template.created',
    TEMPLATE_UPDATED: 'notification.template.updated',
  },

  ANALYTICS: {
    EVENT_TRACKED: 'analytics.event.tracked',
    PAGE_VIEW_TRACKED: 'analytics.pageview.tracked',
    CONVERSION_TRACKED: 'analytics.conversion.tracked',
    FUNNEL_COMPLETED: 'analytics.funnel.completed',
    SESSION_STARTED: 'analytics.session.started',
    SESSION_ENDED: 'analytics.session.ended',
    REPORT_GENERATED: 'analytics.report.generated',
    DASHBOARD_REFRESHED: 'analytics.dashboard.refreshed',
  },

  USER: {
    CREATED: 'user.created',
    UPDATED: 'user.updated',
    DELETED: 'user.deleted',
    LOGGED_IN: 'user.logged.in',
    LOGGED_OUT: 'user.logged.out',
    PASSWORD_RESET: 'user.password.reset',
    PASSWORD_CHANGED: 'user.password.changed',
    ROLE_UPDATED: 'user.role.updated',
    SESSION_EXPIRED: 'user.session.expired',
    ACCOUNT_LOCKED: 'user.account.locked',
    ACCOUNT_UNLOCKED: 'user.account.unlocked',
  },

  BROCHURE: {
    REQUESTED: 'brochure.requested',
    SENT: 'brochure.sent',
    DOWNLOADED: 'brochure.downloaded',
    FAILED: 'brochure.failed',
  },

  BUSINESS_INQUIRY: {
    CREATED: 'business.inquiry.created',
    UPDATED: 'business.inquiry.updated',
    RESPONDED: 'business.inquiry.responded',
    CLOSED: 'business.inquiry.closed',
  },

  SHOWROOM: {
    CREATED: 'showroom.created',
    UPDATED: 'showroom.updated',
    DELETED: 'showroom.deleted',
    HOURS_UPDATED: 'showroom.hours.updated',
  },

  SALE: {
    CREATED: 'sale.created',
    UPDATED: 'sale.updated',
    ACTIVATED: 'sale.activated',
    DEACTIVATED: 'sale.deactivated',
    EXPIRED: 'sale.expired',
  },

  PACKAGE: {
    CREATED: 'package.created',
    UPDATED: 'package.updated',
    DELETED: 'package.deleted',
    PURCHASED: 'package.purchased',
  },

  FINANCE: {
    APPLICATION_SUBMITTED: 'finance.application.submitted',
    APPLICATION_APPROVED: 'finance.application.approved',
    APPLICATION_REJECTED: 'finance.application.rejected',
    CONTENT_UPDATED: 'finance.content.updated',
  },

  NEWSLETTER: {
    SUBSCRIBED: 'newsletter.subscribed',
    UNSUBSCRIBED: 'newsletter.unsubscribed',
    CAMPAIGN_SENT: 'newsletter.campaign.sent',
  },

  SYSTEM: {
    HEALTH_CHECK: 'system.health.check',
    CACHE_CLEARED: 'system.cache.cleared',
    BACKUP_COMPLETED: 'system.backup.completed',
    BACKUP_FAILED: 'system.backup.failed',
    MIGRATION_STARTED: 'system.migration.started',
    MIGRATION_COMPLETED: 'system.migration.completed',
    ERROR_OCCURRED: 'system.error.occurred',
  },
} as const;

export type EventTopicKey = keyof typeof EVENT_TOPICS;
export type EventTopicValue = typeof EVENT_TOPICS[EventTopicKey];

export const getAllTopics = (): string[] => {
  const topics: string[] = [];
  
  Object.values(EVENT_TOPICS).forEach((category) => {
    Object.values(category).forEach((topic) => {
      topics.push(topic);
    });
  });
  
  return topics;
};

export const getTopicsByCategory = (category: EventTopicKey): string[] => {
  return Object.values(EVENT_TOPICS[category]);
};

export const isValidTopic = (topic: string): boolean => {
  return getAllTopics().includes(topic);
};

export const getTopicCategory = (topic: string): string | null => {
  for (const [category, topics] of Object.entries(EVENT_TOPICS)) {
    if (Object.values(topics).includes(topic as any)) {
      return category;
    }
  }
  return null;
};