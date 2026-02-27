export const EVENT_TOPICS = {
  USER: 'user',
  AUTH: 'auth',
  PRODUCT: 'product',
  CATEGORY: 'category',
  COLOUR: 'colour',
  SIZE: 'size',
  INVENTORY: 'inventory',
  PRICING: 'pricing',
  ORDER: 'order',
  PAYMENT: 'payment',
  INVOICE: 'invoice',
  REFUND: 'refund',
  APPOINTMENT: 'appointment',
  BOOKING: 'booking',
  AVAILABILITY: 'availability',
  CONSULTANT: 'consultant',
  REMINDER: 'reminder',
  SHOWROOM: 'showroom',
  BLOG: 'blog',
  MEDIA: 'media',
  CMS: 'cms',
  SEO: 'seo',
  LANDING_PAGE: 'landing_page',
  CUSTOMER: 'customer',
  PROFILE: 'profile',
  WISHLIST: 'wishlist',
  REVIEW: 'review',
  SUPPORT: 'support',
  LOYALTY: 'loyalty',
  EMAIL: 'email',
  SMS: 'sms',
  PUSH: 'push',
  NOTIFICATION: 'notification',
  TEMPLATE: 'template',
  ANALYTICS: 'analytics',
  TRACKING: 'tracking',
  FUNNEL: 'funnel',
  DASHBOARD: 'dashboard',
  EXPORT: 'export',
  SALE: 'sale',
  PACKAGE: 'package',
  FINANCE: 'finance',
  BROCHURE: 'brochure',
  BUSINESS_INQUIRY: 'business_inquiry',
  NEWSLETTER: 'newsletter',
  CONTACT: 'contact',
} as const;

export const USER_EVENTS = {
  CREATED: 'user.created',
  UPDATED: 'user.updated',
  DELETED: 'user.deleted',
  LOGGED_IN: 'user.logged_in',
  LOGGED_OUT: 'user.logged_out',
  PASSWORD_CHANGED: 'user.password_changed',
  PASSWORD_RESET: 'user.password_reset',
  EMAIL_VERIFIED: 'user.email_verified',
  EMAIL_VERIFICATION_SENT: 'user.email_verification_sent',
  ROLE_UPDATED: 'user.role_updated',
  ACTIVATED: 'user.activated',
  DEACTIVATED: 'user.deactivated',
  PROFILE_UPDATED: 'user.profile_updated',
} as const;

export const PRODUCT_EVENTS = {
  CREATED: 'product.created',
  UPDATED: 'product.updated',
  DELETED: 'product.deleted',
  PUBLISHED: 'product.published',
  UNPUBLISHED: 'product.unpublished',
  PRICE_CHANGED: 'product.price_changed',
  STOCK_UPDATED: 'product.stock_updated',
  OUT_OF_STOCK: 'product.out_of_stock',
  BACK_IN_STOCK: 'product.back_in_stock',
} as const;

export const ORDER_EVENTS = {
  CREATED: 'order.created',
  UPDATED: 'order.updated',
  CANCELLED: 'order.cancelled',
  CONFIRMED: 'order.confirmed',
  SHIPPED: 'order.shipped',
  DELIVERED: 'order.delivered',
  RETURNED: 'order.returned',
  REFUNDED: 'order.refunded',
  FAILED: 'order.failed',
} as const;

export const PAYMENT_EVENTS = {
  INITIATED: 'payment.initiated',
  PROCESSING: 'payment.processing',
  SUCCEEDED: 'payment.succeeded',
  FAILED: 'payment.failed',
  REFUNDED: 'payment.refunded',
  PARTIALLY_REFUNDED: 'payment.partially_refunded',
  DISPUTED: 'payment.disputed',
  CANCELLED: 'payment.cancelled',
} as const;

export const APPOINTMENT_EVENTS = {
  CREATED: 'appointment.created',
  UPDATED: 'appointment.updated',
  CANCELLED: 'appointment.cancelled',
  CONFIRMED: 'appointment.confirmed',
  RESCHEDULED: 'appointment.rescheduled',
  COMPLETED: 'appointment.completed',
  NO_SHOW: 'appointment.no_show',
  REMINDER_SENT: 'appointment.reminder_sent',
} as const;

export const BOOKING_EVENTS = {
  CREATED: 'booking.created',
  UPDATED: 'booking.updated',
  CANCELLED: 'booking.cancelled',
  CONFIRMED: 'booking.confirmed',
  RESCHEDULED: 'booking.rescheduled',
  COMPLETED: 'booking.completed',
} as const;

export const NOTIFICATION_EVENTS = {
  EMAIL_SENT: 'notification.email_sent',
  EMAIL_FAILED: 'notification.email_failed',
  SMS_SENT: 'notification.sms_sent',
  SMS_FAILED: 'notification.sms_failed',
  PUSH_SENT: 'notification.push_sent',
  PUSH_FAILED: 'notification.push_failed',
  QUEUED: 'notification.queued',
  DELIVERED: 'notification.delivered',
  BOUNCED: 'notification.bounced',
  OPENED: 'notification.opened',
  CLICKED: 'notification.clicked',
} as const;

export const BLOG_EVENTS = {
  CREATED: 'blog.created',
  UPDATED: 'blog.updated',
  DELETED: 'blog.deleted',
  PUBLISHED: 'blog.published',
  UNPUBLISHED: 'blog.unpublished',
  SCHEDULED: 'blog.scheduled',
} as const;

export const REVIEW_EVENTS = {
  CREATED: 'review.created',
  UPDATED: 'review.updated',
  DELETED: 'review.deleted',
  APPROVED: 'review.approved',
  REJECTED: 'review.rejected',
  FLAGGED: 'review.flagged',
} as const;

export const ANALYTICS_EVENTS = {
  PAGE_VIEW: 'analytics.page_view',
  EVENT_TRACKED: 'analytics.event_tracked',
  CONVERSION: 'analytics.conversion',
  GOAL_COMPLETED: 'analytics.goal_completed',
  SESSION_STARTED: 'analytics.session_started',
  SESSION_ENDED: 'analytics.session_ended',
} as const;

export const INVENTORY_EVENTS = {
  UPDATED: 'inventory.updated',
  LOW_STOCK: 'inventory.low_stock',
  OUT_OF_STOCK: 'inventory.out_of_stock',
  RESTOCKED: 'inventory.restocked',
  RESERVED: 'inventory.reserved',
  RELEASED: 'inventory.released',
} as const;

export const MEDIA_EVENTS = {
  UPLOADED: 'media.uploaded',
  DELETED: 'media.deleted',
  PROCESSED: 'media.processed',
  OPTIMIZED: 'media.optimized',
  FAILED: 'media.failed',
} as const;

export const CMS_EVENTS = {
  PAGE_CREATED: 'cms.page_created',
  PAGE_UPDATED: 'cms.page_updated',
  PAGE_DELETED: 'cms.page_deleted',
  PAGE_PUBLISHED: 'cms.page_published',
  PAGE_UNPUBLISHED: 'cms.page_unpublished',
} as const;

export const CUSTOMER_EVENTS = {
  REGISTERED: 'customer.registered',
  PROFILE_UPDATED: 'customer.profile_updated',
  ADDRESS_ADDED: 'customer.address_added',
  ADDRESS_UPDATED: 'customer.address_updated',
  WISHLIST_UPDATED: 'customer.wishlist_updated',
  REVIEW_SUBMITTED: 'customer.review_submitted',
  SUPPORT_TICKET_CREATED: 'customer.support_ticket_created',
  LOYALTY_POINTS_EARNED: 'customer.loyalty_points_earned',
  LOYALTY_POINTS_REDEEMED: 'customer.loyalty_points_redeemed',
} as const;

export const SHOWROOM_EVENTS = {
  CREATED: 'showroom.created',
  UPDATED: 'showroom.updated',
  DELETED: 'showroom.deleted',
  HOURS_UPDATED: 'showroom.hours_updated',
} as const;

export const BROCHURE_EVENTS = {
  REQUESTED: 'brochure.requested',
  SENT: 'brochure.sent',
  DOWNLOADED: 'brochure.downloaded',
} as const;

export const BUSINESS_INQUIRY_EVENTS = {
  SUBMITTED: 'business_inquiry.submitted',
  REVIEWED: 'business_inquiry.reviewed',
  RESPONDED: 'business_inquiry.responded',
} as const;

export const SALE_EVENTS = {
  CREATED: 'sale.created',
  UPDATED: 'sale.updated',
  DELETED: 'sale.deleted',
  STARTED: 'sale.started',
  ENDED: 'sale.ended',
} as const;

export const PACKAGE_EVENTS = {
  CREATED: 'package.created',
  UPDATED: 'package.updated',
  DELETED: 'package.deleted',
  ACTIVATED: 'package.activated',
  DEACTIVATED: 'package.deactivated',
} as const;

export type EventTopic = typeof EVENT_TOPICS[keyof typeof EVENT_TOPICS];
export type UserEvent = typeof USER_EVENTS[keyof typeof USER_EVENTS];
export type ProductEvent = typeof PRODUCT_EVENTS[keyof typeof PRODUCT_EVENTS];
export type OrderEvent = typeof ORDER_EVENTS[keyof typeof ORDER_EVENTS];
export type PaymentEvent = typeof PAYMENT_EVENTS[keyof typeof PAYMENT_EVENTS];
export type AppointmentEvent = typeof APPOINTMENT_EVENTS[keyof typeof APPOINTMENT_EVENTS];
export type NotificationEvent = typeof NOTIFICATION_EVENTS[keyof typeof NOTIFICATION_EVENTS];
export type AnalyticsEvent = typeof ANALYTICS_EVENTS[keyof typeof ANALYTICS_EVENTS];