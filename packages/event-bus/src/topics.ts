export const AUTH_TOPICS = {
  USER_CREATED: "auth.user.created",
  USER_UPDATED: "auth.user.updated",
  USER_DELETED: "auth.user.deleted",
  USER_LOGGED_IN: "auth.user.logged_in",
  USER_LOGGED_OUT: "auth.user.logged_out",
  PASSWORD_RESET_REQUESTED: "auth.password.reset_requested",
  PASSWORD_RESET_COMPLETED: "auth.password.reset_completed",
  EMAIL_VERIFIED: "auth.email.verified",
  ROLE_ASSIGNED: "auth.role.assigned",
  ROLE_REVOKED: "auth.role.revoked",
  SESSION_REVOKED: "auth.session.revoked",
} as const;

export const PRODUCT_TOPICS = {
  PRODUCT_CREATED: "product.created",
  PRODUCT_UPDATED: "product.updated",
  PRODUCT_DELETED: "product.deleted",
  PRODUCT_PUBLISHED: "product.published",
  PRODUCT_UNPUBLISHED: "product.unpublished",
  INVENTORY_UPDATED: "product.inventory.updated",
  INVENTORY_LOW: "product.inventory.low",
  PRICE_CHANGED: "product.price.changed",
  COLOUR_CREATED: "product.colour.created",
  COLOUR_UPDATED: "product.colour.updated",
  SALE_CREATED: "product.sale.created",
  SALE_EXPIRED: "product.sale.expired",
} as const;

export const ORDER_TOPICS = {
  ORDER_CREATED: "order.created",
  ORDER_CONFIRMED: "order.confirmed",
  ORDER_CANCELLED: "order.cancelled",
  ORDER_COMPLETED: "order.completed",
  ORDER_SHIPPED: "order.shipped",
  ORDER_DELIVERED: "order.delivered",
  PAYMENT_INITIATED: "order.payment.initiated",
  PAYMENT_SUCCEEDED: "order.payment.succeeded",
  PAYMENT_FAILED: "order.payment.failed",
  PAYMENT_REFUND_ISSUED: "order.payment.refund_issued",
  PAYMENT_REFUND_FAILED: "order.payment.refund_failed",
  INVOICE_GENERATED: "order.invoice.generated",
  COUPON_APPLIED: "order.coupon.applied",
} as const;

export const APPOINTMENT_TOPICS = {
  BOOKING_CREATED: "appointment.booking.created",
  BOOKING_CONFIRMED: "appointment.booking.confirmed",
  BOOKING_CANCELLED: "appointment.booking.cancelled",
  BOOKING_RESCHEDULED: "appointment.booking.rescheduled",
  BOOKING_COMPLETED: "appointment.booking.completed",
  BOOKING_NO_SHOW: "appointment.booking.no_show",
  REMINDER_SCHEDULED: "appointment.reminder.scheduled",
  REMINDER_SENT: "appointment.reminder.sent",
  CONSULTANT_UPDATED: "appointment.consultant.updated",
  AVAILABILITY_CHANGED: "appointment.availability.changed",
} as const;

export const CONTENT_TOPICS = {
  BLOG_PUBLISHED: "content.blog.published",
  BLOG_UPDATED: "content.blog.updated",
  BLOG_ARCHIVED: "content.blog.archived",
  PAGE_PUBLISHED: "content.page.published",
  PAGE_UPDATED: "content.page.updated",
  MEDIA_UPLOADED: "content.media.uploaded",
  MEDIA_DELETED: "content.media.deleted",
  SEO_UPDATED: "content.seo.updated",
  SITEMAP_REGENERATE: "content.sitemap.regenerate",
  SHOWROOM_UPDATED: "content.showroom.updated",
} as const;

export const CUSTOMER_TOPICS = {
  PROFILE_CREATED: "customer.profile.created",
  PROFILE_UPDATED: "customer.profile.updated",
  ADDRESS_ADDED: "customer.address.added",
  WISHLIST_UPDATED: "customer.wishlist.updated",
  REVIEW_CREATED: "customer.review.created",
  REVIEW_APPROVED: "customer.review.approved",
  SUPPORT_TICKET_CREATED: "customer.support.ticket_created",
  SUPPORT_TICKET_RESOLVED: "customer.support.ticket_resolved",
  LOYALTY_POINTS_EARNED: "customer.loyalty.points_earned",
  LOYALTY_POINTS_REDEEMED: "customer.loyalty.points_redeemed",
  BROCHURE_REQUESTED: "customer.brochure.requested",
  BUSINESS_INQUIRY_SUBMITTED: "customer.business_inquiry.submitted",
  NEWSLETTER_SUBSCRIBED: "customer.newsletter.subscribed",
  NEWSLETTER_UNSUBSCRIBED: "customer.newsletter.unsubscribed",
} as const;

export const NOTIFICATION_TOPICS = {
  EMAIL_SENT: "notification.email.sent",
  EMAIL_FAILED: "notification.email.failed",
  EMAIL_BOUNCED: "notification.email.bounced",
  SMS_SENT: "notification.sms.sent",
  SMS_FAILED: "notification.sms.failed",
  PUSH_SENT: "notification.push.sent",
  PUSH_FAILED: "notification.push.failed",
  NOTIFICATION_FAILED: "notification.failed",
} as const;

export const ANALYTICS_TOPICS = {
  EVENT_TRACKED: "analytics.event.tracked",
  PAGE_VIEW_TRACKED: "analytics.pageview.tracked",
  FUNNEL_COMPLETED: "analytics.funnel.completed",
  REPORT_GENERATED: "analytics.report.generated",
  DASHBOARD_REFRESHED: "analytics.dashboard.refreshed",
} as const;

export const ALL_TOPICS = {
  ...AUTH_TOPICS,
  ...PRODUCT_TOPICS,
  ...ORDER_TOPICS,
  ...APPOINTMENT_TOPICS,
  ...CONTENT_TOPICS,
  ...CUSTOMER_TOPICS,
  ...NOTIFICATION_TOPICS,
  ...ANALYTICS_TOPICS,
} as const;

export type AuthTopic = (typeof AUTH_TOPICS)[keyof typeof AUTH_TOPICS];
export type ProductTopic = (typeof PRODUCT_TOPICS)[keyof typeof PRODUCT_TOPICS];
export type OrderTopic = (typeof ORDER_TOPICS)[keyof typeof ORDER_TOPICS];
export type AppointmentTopic = (typeof APPOINTMENT_TOPICS)[keyof typeof APPOINTMENT_TOPICS];
export type ContentTopic = (typeof CONTENT_TOPICS)[keyof typeof CONTENT_TOPICS];
export type CustomerTopic = (typeof CUSTOMER_TOPICS)[keyof typeof CUSTOMER_TOPICS];
export type NotificationTopic = (typeof NOTIFICATION_TOPICS)[keyof typeof NOTIFICATION_TOPICS];
export type AnalyticsTopic = (typeof ANALYTICS_TOPICS)[keyof typeof ANALYTICS_TOPICS];
export type EventTopic = (typeof ALL_TOPICS)[keyof typeof ALL_TOPICS];