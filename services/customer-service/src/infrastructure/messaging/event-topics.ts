export const CUSTOMER_EVENT_TOPICS = {
  PROFILE_UPDATED: 'customer.profile.updated',
  PROFILE_DELETED: 'customer.profile.deleted',

  ADDRESS_CREATED: 'customer.address.created',
  ADDRESS_UPDATED: 'customer.address.updated',
  ADDRESS_DELETED: 'customer.address.deleted',

  WISHLIST_ITEM_ADDED: 'customer.wishlist.item.added',
  WISHLIST_ITEM_REMOVED: 'customer.wishlist.item.removed',

  REVIEW_CREATED: 'customer.review.created',
  REVIEW_APPROVED: 'customer.review.approved',
  REVIEW_REJECTED: 'customer.review.rejected',

  SUPPORT_TICKET_CREATED: 'customer.support.ticket.created',
  SUPPORT_TICKET_UPDATED: 'customer.support.ticket.updated',
  SUPPORT_TICKET_RESOLVED: 'customer.support.ticket.resolved',
  SUPPORT_TICKET_CLOSED: 'customer.support.ticket.closed',
  SUPPORT_MESSAGE_ADDED: 'customer.support.message.added',

  LOYALTY_POINTS_EARNED: 'customer.loyalty.points.earned',
  LOYALTY_POINTS_REDEEMED: 'customer.loyalty.points.redeemed',
  LOYALTY_POINTS_EXPIRED: 'customer.loyalty.points.expired',
  LOYALTY_TIER_UPGRADED: 'customer.loyalty.tier.upgraded',

  REFERRAL_CREATED: 'customer.referral.created',
  REFERRAL_COMPLETED: 'customer.referral.completed',
} as const;

export type CustomerEventTopic =
  (typeof CUSTOMER_EVENT_TOPICS)[keyof typeof CUSTOMER_EVENT_TOPICS];

export const INBOUND_EVENT_TOPICS = {
  ORDER_COMPLETED: 'order.completed',
  ORDER_CANCELLED: 'order.cancelled',
  PAYMENT_SUCCEEDED: 'payment.succeeded',
  APPOINTMENT_BOOKED: 'appointment.booked',
  APPOINTMENT_CANCELLED: 'appointment.cancelled',
  USER_REGISTERED: 'auth.user.created',
} as const;

export type InboundEventTopic =
  (typeof INBOUND_EVENT_TOPICS)[keyof typeof INBOUND_EVENT_TOPICS];