import { EventTopic } from "./topics";

export interface BaseEventPayload {
  eventId: string;
  topic: EventTopic;
  version: string;
  timestamp: string;
  source: string;
  correlationId?: string;
  causationId?: string;
  metadata?: Record<string, unknown>;
}

export interface UserCreatedPayload extends BaseEventPayload {
  topic: "auth.user.created";
  data: {
    userId: string;
    email: string;
    firstName: string;
    lastName: string;
    role: string;
  };
}

export interface UserUpdatedPayload extends BaseEventPayload {
  topic: "auth.user.updated";
  data: {
    userId: string;
    changes: Record<string, unknown>;
  };
}

export interface UserLoggedInPayload extends BaseEventPayload {
  topic: "auth.user.logged_in";
  data: {
    userId: string;
    sessionId: string;
    ipAddress: string;
    userAgent: string;
  };
}

export interface PasswordResetRequestedPayload extends BaseEventPayload {
  topic: "auth.password.reset_requested";
  data: {
    userId: string;
    email: string;
    resetToken: string;
    expiresAt: string;
  };
}

export interface EmailVerifiedPayload extends BaseEventPayload {
  topic: "auth.email.verified";
  data: {
    userId: string;
    email: string;
  };
}

export interface ProductCreatedPayload extends BaseEventPayload {
  topic: "product.created";
  data: {
    productId: string;
    title: string;
    category: string;
    slug: string;
  };
}

export interface ProductUpdatedPayload extends BaseEventPayload {
  topic: "product.updated";
  data: {
    productId: string;
    changes: Record<string, unknown>;
  };
}

export interface InventoryUpdatedPayload extends BaseEventPayload {
  topic: "product.inventory.updated";
  data: {
    productId: string;
    previousQuantity: number;
    newQuantity: number;
    reason: string;
  };
}

export interface InventoryLowPayload extends BaseEventPayload {
  topic: "product.inventory.low";
  data: {
    productId: string;
    currentQuantity: number;
    threshold: number;
  };
}

export interface PriceChangedPayload extends BaseEventPayload {
  topic: "product.price.changed";
  data: {
    productId: string;
    previousPrice: number | null;
    newPrice: number | null;
    currency: string;
  };
}

export interface OrderCreatedPayload extends BaseEventPayload {
  topic: "order.created";
  data: {
    orderId: string;
    userId: string;
    totalAmount: number;
    currency: string;
    itemCount: number;
  };
}

export interface OrderCancelledPayload extends BaseEventPayload {
  topic: "order.cancelled";
  data: {
    orderId: string;
    userId: string;
    reason: string;
    cancelledAt: string;
  };
}

export interface PaymentSucceededPayload extends BaseEventPayload {
  topic: "order.payment.succeeded";
  data: {
    orderId: string;
    transactionId: string;
    amount: number;
    currency: string;
    gateway: string;
    userId: string;
  };
}

export interface PaymentFailedPayload extends BaseEventPayload {
  topic: "order.payment.failed";
  data: {
    orderId: string;
    transactionId: string;
    failureCode: string;
    failureMessage: string;
    gateway: string;
    userId: string;
  };
}

export interface RefundIssuedPayload extends BaseEventPayload {
  topic: "order.payment.refund_issued";
  data: {
    orderId: string;
    refundId: string;
    transactionId: string;
    amount: number;
    currency: string;
    reason: string;
    userId: string;
  };
}

export interface BookingCreatedPayload extends BaseEventPayload {
  topic: "appointment.booking.created";
  data: {
    bookingId: string;
    userId?: string;
    customerEmail: string;
    appointmentType: string;
    forKitchen: boolean;
    forBedroom: boolean;
    date: string;
    consultantId?: string;
    showroomId?: string;
  };
}

export interface BookingCancelledPayload extends BaseEventPayload {
  topic: "appointment.booking.cancelled";
  data: {
    bookingId: string;
    customerEmail: string;
    reason: string;
    cancelledAt: string;
  };
}

export interface BookingRescheduledPayload extends BaseEventPayload {
  topic: "appointment.booking.rescheduled";
  data: {
    bookingId: string;
    customerEmail: string;
    previousDate: string;
    newDate: string;
  };
}

export interface ReminderSentPayload extends BaseEventPayload {
  topic: "appointment.reminder.sent";
  data: {
    bookingId: string;
    reminderType: string;
    customerEmail: string;
    channel: string;
  };
}

export interface BlogPublishedPayload extends BaseEventPayload {
  topic: "content.blog.published";
  data: {
    blogId: string;
    title: string;
    slug: string;
    authorId: string;
    publishedAt: string;
  };
}

export interface MediaUploadedPayload extends BaseEventPayload {
  topic: "content.media.uploaded";
  data: {
    mediaId: string;
    url: string;
    mediaType: string;
    uploadedBy: string;
  };
}

export interface SitemapRegeneratePayload extends BaseEventPayload {
  topic: "content.sitemap.regenerate";
  data: {
    triggeredBy: string;
    reason: string;
  };
}

export interface ProfileCreatedPayload extends BaseEventPayload {
  topic: "customer.profile.created";
  data: {
    customerId: string;
    userId: string;
    email: string;
  };
}

export interface ReviewCreatedPayload extends BaseEventPayload {
  topic: "customer.review.created";
  data: {
    reviewId: string;
    customerId: string;
    productId?: string;
    rating: number;
  };
}

export interface BrochureRequestedPayload extends BaseEventPayload {
  topic: "customer.brochure.requested";
  data: {
    requestId: string;
    email: string;
    name: string;
    postcode: string;
    interests: string[];
  };
}

export interface BusinessInquirySubmittedPayload extends BaseEventPayload {
  topic: "customer.business_inquiry.submitted";
  data: {
    inquiryId: string;
    email: string;
    name: string;
    businessType: string;
    companyName?: string;
  };
}

export interface NewsletterSubscribedPayload extends BaseEventPayload {
  topic: "customer.newsletter.subscribed";
  data: {
    subscriptionId: string;
    email: string;
    preferences: string[];
  };
}

export interface LoyaltyPointsEarnedPayload extends BaseEventPayload {
  topic: "customer.loyalty.points_earned";
  data: {
    customerId: string;
    points: number;
    reason: string;
    orderId?: string;
    totalPoints: number;
  };
}

export interface EmailSentPayload extends BaseEventPayload {
  topic: "notification.email.sent";
  data: {
    notificationId: string;
    to: string;
    subject: string;
    notificationType: string;
    userId?: string;
  };
}

export interface NotificationFailedPayload extends BaseEventPayload {
  topic: "notification.failed";
  data: {
    notificationId: string;
    channel: string;
    recipient: string;
    notificationType: string;
    error: string;
    attempt: number;
  };
}

export interface EventTrackedPayload extends BaseEventPayload {
  topic: "analytics.event.tracked";
  data: {
    eventType: string;
    sessionId: string;
    userId?: string;
    properties: Record<string, unknown>;
  };
}

export type AnyEventPayload =
  | UserCreatedPayload
  | UserUpdatedPayload
  | UserLoggedInPayload
  | PasswordResetRequestedPayload
  | EmailVerifiedPayload
  | ProductCreatedPayload
  | ProductUpdatedPayload
  | InventoryUpdatedPayload
  | InventoryLowPayload
  | PriceChangedPayload
  | OrderCreatedPayload
  | OrderCancelledPayload
  | PaymentSucceededPayload
  | PaymentFailedPayload
  | RefundIssuedPayload
  | BookingCreatedPayload
  | BookingCancelledPayload
  | BookingRescheduledPayload
  | ReminderSentPayload
  | BlogPublishedPayload
  | MediaUploadedPayload
  | SitemapRegeneratePayload
  | ProfileCreatedPayload
  | ReviewCreatedPayload
  | BrochureRequestedPayload
  | BusinessInquirySubmittedPayload
  | NewsletterSubscribedPayload
  | LoyaltyPointsEarnedPayload
  | EmailSentPayload
  | NotificationFailedPayload
  | EventTrackedPayload;