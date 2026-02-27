export interface BaseEventMetadata {
  userId?: string;
  sessionId?: string;
  correlationId?: string;
  source?: string;
  version?: string;
  ipAddress?: string;
  userAgent?: string;
}

export interface UserCreatedPayload {
  userId: string;
  email: string;
  name: string;
  role: string;
  isEmailVerified: boolean;
  createdAt: string;
}

export interface UserUpdatedPayload {
  userId: string;
  changes: {
    email?: string;
    name?: string;
    phone?: string;
    role?: string;
  };
  updatedAt: string;
}

export interface UserDeletedPayload {
  userId: string;
  email: string;
  deletedAt: string;
  reason?: string;
}

export interface UserLoggedInPayload {
  userId: string;
  email: string;
  sessionId: string;
  ipAddress: string;
  userAgent: string;
  timestamp: string;
}

export interface UserLoggedOutPayload {
  userId: string;
  sessionId: string;
  timestamp: string;
}

export interface UserPasswordChangedPayload {
  userId: string;
  email: string;
  timestamp: string;
}

export interface UserEmailVerifiedPayload {
  userId: string;
  email: string;
  verifiedAt: string;
}

export interface SessionCreatedPayload {
  sessionId: string;
  userId: string;
  expiresAt: string;
  createdAt: string;
}

export interface SessionExpiredPayload {
  sessionId: string;
  userId: string;
  expiredAt: string;
}

export interface SessionRevokedPayload {
  sessionId: string;
  userId: string;
  revokedAt: string;
  reason?: string;
}

export interface ProductCreatedPayload {
  productId: string;
  title: string;
  description: string;
  category: string;
  price: number;
  images: string[];
  colours: string[];
  createdAt: string;
}

export interface ProductUpdatedPayload {
  productId: string;
  changes: {
    title?: string;
    description?: string;
    price?: number;
    images?: string[];
    colours?: string[];
  };
  updatedAt: string;
}

export interface ProductDeletedPayload {
  productId: string;
  title: string;
  deletedAt: string;
}

export interface ProductPriceChangedPayload {
  productId: string;
  oldPrice: number;
  newPrice: number;
  changedAt: string;
}

export interface InventoryUpdatedPayload {
  productId: string;
  sku: string;
  oldQuantity: number;
  newQuantity: number;
  reason: string;
  updatedAt: string;
}

export interface InventoryLowStockPayload {
  productId: string;
  sku: string;
  currentQuantity: number;
  threshold: number;
  timestamp: string;
}

export interface InventoryOutOfStockPayload {
  productId: string;
  sku: string;
  timestamp: string;
}

export interface OrderCreatedPayload {
  orderId: string;
  customerId: string;
  customerEmail: string;
  items: Array<{
    productId: string;
    quantity: number;
    price: number;
  }>;
  subtotal: number;
  tax: number;
  shipping: number;
  total: number;
  status: string;
  createdAt: string;
}

export interface OrderUpdatedPayload {
  orderId: string;
  changes: {
    status?: string;
    shippingAddress?: any;
    trackingNumber?: string;
  };
  updatedAt: string;
}

export interface OrderCancelledPayload {
  orderId: string;
  customerId: string;
  items: Array<{
    productId: string;
    quantity: number;
  }>;
  amount: number;
  paymentId?: string;
  reason?: string;
  cancelledAt: string;
}

export interface OrderCompletedPayload {
  orderId: string;
  customerId: string;
  total: number;
  completedAt: string;
}

export interface OrderShippedPayload {
  orderId: string;
  trackingNumber: string;
  carrier: string;
  estimatedDelivery: string;
  shippedAt: string;
}

export interface OrderDeliveredPayload {
  orderId: string;
  deliveredAt: string;
  signedBy?: string;
}

export interface PaymentInitiatedPayload {
  paymentId: string;
  orderId: string;
  amount: number;
  currency: string;
  method: string;
  initiatedAt: string;
}

export interface PaymentSucceededPayload {
  paymentId: string;
  orderId: string;
  transactionId: string;
  amount: number;
  currency: string;
  method: string;
  customerEmail: string;
  succeededAt: string;
}

export interface PaymentFailedPayload {
  paymentId: string;
  orderId: string;
  amount: number;
  currency: string;
  method: string;
  error: string;
  failedAt: string;
}

export interface PaymentRefundedPayload {
  paymentId: string;
  refundId: string;
  orderId: string;
  amount: number;
  currency: string;
  reason?: string;
  refundedAt: string;
}

export interface AppointmentCreatedPayload {
  appointmentId: string;
  customerId: string;
  customerEmail: string;
  customerPhone: string;
  type: string;
  category: string;
  date: string;
  time: string;
  consultantId?: string;
  showroomId?: string;
  createdAt: string;
}

export interface AppointmentUpdatedPayload {
  appointmentId: string;
  changes: {
    date?: string;
    time?: string;
    status?: string;
    consultantId?: string;
  };
  updatedAt: string;
}

export interface AppointmentCancelledPayload {
  appointmentId: string;
  customerId: string;
  reason?: string;
  cancelledAt: string;
}

export interface AppointmentCompletedPayload {
  appointmentId: string;
  customerId: string;
  consultantId?: string;
  completedAt: string;
}

export interface AppointmentReminderSentPayload {
  appointmentId: string;
  customerId: string;
  customerEmail: string;
  customerPhone: string;
  channel: string;
  sentAt: string;
}

export interface BlogCreatedPayload {
  blogId: string;
  title: string;
  slug: string;
  author: string;
  status: string;
  createdAt: string;
}

export interface BlogUpdatedPayload {
  blogId: string;
  changes: {
    title?: string;
    content?: string;
    status?: string;
  };
  updatedAt: string;
}

export interface BlogPublishedPayload {
  blogId: string;
  title: string;
  slug: string;
  author: string;
  publishedAt: string;
}

export interface BlogDeletedPayload {
  blogId: string;
  title: string;
  deletedAt: string;
}

export interface MediaUploadedPayload {
  mediaId: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  url: string;
  uploadedBy: string;
  uploadedAt: string;
}

export interface MediaDeletedPayload {
  mediaId: string;
  fileName: string;
  url: string;
  deletedAt: string;
}

export interface EmailSentPayload {
  emailId: string;
  to: string;
  from: string;
  subject: string;
  template: string;
  sentAt: string;
}

export interface EmailFailedPayload {
  emailId: string;
  to: string;
  subject: string;
  error: string;
  failedAt: string;
}

export interface EmailDeliveredPayload {
  emailId: string;
  to: string;
  deliveredAt: string;
}

export interface EmailOpenedPayload {
  emailId: string;
  to: string;
  openedAt: string;
  ipAddress?: string;
  userAgent?: string;
}

export interface EmailClickedPayload {
  emailId: string;
  to: string;
  url: string;
  clickedAt: string;
}

export interface SMSSentPayload {
  smsId: string;
  to: string;
  message: string;
  sentAt: string;
}

export interface SMSFailedPayload {
  smsId: string;
  to: string;
  error: string;
  failedAt: string;
}

export interface SMSDeliveredPayload {
  smsId: string;
  to: string;
  deliveredAt: string;
}

export interface PushSentPayload {
  pushId: string;
  userId: string;
  title: string;
  body: string;
  sentAt: string;
}

export interface PushFailedPayload {
  pushId: string;
  userId: string;
  error: string;
  failedAt: string;
}

export interface PushDeliveredPayload {
  pushId: string;
  userId: string;
  deliveredAt: string;
}

export interface ReviewCreatedPayload {
  reviewId: string;
  productId: string;
  customerId: string;
  rating: number;
  title: string;
  comment: string;
  status: string;
  createdAt: string;
}

export interface ReviewUpdatedPayload {
  reviewId: string;
  changes: {
    rating?: number;
    title?: string;
    comment?: string;
    status?: string;
  };
  updatedAt: string;
}

export interface ReviewDeletedPayload {
  reviewId: string;
  productId: string;
  deletedAt: string;
}

export interface ReviewApprovedPayload {
  reviewId: string;
  productId: string;
  approvedBy: string;
  approvedAt: string;
}

export interface ReviewRejectedPayload {
  reviewId: string;
  productId: string;
  rejectedBy: string;
  reason: string;
  rejectedAt: string;
}

export interface WishlistItemAddedPayload {
  customerId: string;
  productId: string;
  addedAt: string;
}

export interface WishlistItemRemovedPayload {
  customerId: string;
  productId: string;
  removedAt: string;
}

export interface CartItemAddedPayload {
  sessionId: string;
  customerId?: string;
  productId: string;
  quantity: number;
  addedAt: string;
}

export interface CartItemRemovedPayload {
  sessionId: string;
  customerId?: string;
  productId: string;
  removedAt: string;
}

export interface CartClearedPayload {
  sessionId: string;
  customerId?: string;
  clearedAt: string;
}

export interface AnalyticsEventTrackedPayload {
  event: string;
  properties: Record<string, any>;
  userId?: string;
  sessionId?: string;
  timestamp: string;
}

export interface AnalyticsPageViewedPayload {
  page: string;
  url: string;
  referrer?: string;
  userId?: string;
  sessionId?: string;
  timestamp: string;
}

export interface AnalyticsConversionTrackedPayload {
  type: string;
  value: number;
  currency: string;
  userId?: string;
  sessionId?: string;
  timestamp: string;
}

export type EventPayloadMap = {
  'user.created': UserCreatedPayload;
  'user.updated': UserUpdatedPayload;
  'user.deleted': UserDeletedPayload;
  'user.logged_in': UserLoggedInPayload;
  'user.logged_out': UserLoggedOutPayload;
  'user.password_changed': UserPasswordChangedPayload;
  'user.email_verified': UserEmailVerifiedPayload;
  'session.created': SessionCreatedPayload;
  'session.expired': SessionExpiredPayload;
  'session.revoked': SessionRevokedPayload;
  'product.created': ProductCreatedPayload;
  'product.updated': ProductUpdatedPayload;
  'product.deleted': ProductDeletedPayload;
  'product.price_changed': ProductPriceChangedPayload;
  'inventory.updated': InventoryUpdatedPayload;
  'inventory.low_stock': InventoryLowStockPayload;
  'inventory.out_of_stock': InventoryOutOfStockPayload;
  'order.created': OrderCreatedPayload;
  'order.updated': OrderUpdatedPayload;
  'order.cancelled': OrderCancelledPayload;
  'order.completed': OrderCompletedPayload;
  'order.shipped': OrderShippedPayload;
  'order.delivered': OrderDeliveredPayload;
  'payment.initiated': PaymentInitiatedPayload;
  'payment.succeeded': PaymentSucceededPayload;
  'payment.failed': PaymentFailedPayload;
  'payment.refunded': PaymentRefundedPayload;
  'appointment.created': AppointmentCreatedPayload;
  'appointment.updated': AppointmentUpdatedPayload;
  'appointment.cancelled': AppointmentCancelledPayload;
  'appointment.completed': AppointmentCompletedPayload;
  'appointment.reminder_sent': AppointmentReminderSentPayload;
  'blog.created': BlogCreatedPayload;
  'blog.updated': BlogUpdatedPayload;
  'blog.published': BlogPublishedPayload;
  'blog.deleted': BlogDeletedPayload;
  'media.uploaded': MediaUploadedPayload;
  'media.deleted': MediaDeletedPayload;
  'email.sent': EmailSentPayload;
  'email.failed': EmailFailedPayload;
  'email.delivered': EmailDeliveredPayload;
  'email.opened': EmailOpenedPayload;
  'email.clicked': EmailClickedPayload;
  'sms.sent': SMSSentPayload;
  'sms.failed': SMSFailedPayload;
  'sms.delivered': SMSDeliveredPayload;
  'push.sent': PushSentPayload;
  'push.failed': PushFailedPayload;
  'push.delivered': PushDeliveredPayload;
  'review.created': ReviewCreatedPayload;
  'review.updated': ReviewUpdatedPayload;
  'review.deleted': ReviewDeletedPayload;
  'review.approved': ReviewApprovedPayload;
  'review.rejected': ReviewRejectedPayload;
  'wishlist.item_added': WishlistItemAddedPayload;
  'wishlist.item_removed': WishlistItemRemovedPayload;
  'cart.item_added': CartItemAddedPayload;
  'cart.item_removed': CartItemRemovedPayload;
  'cart.cleared': CartClearedPayload;
  'analytics.event_tracked': AnalyticsEventTrackedPayload;
  'analytics.page_viewed': AnalyticsPageViewedPayload;
  'analytics.conversion_tracked': AnalyticsConversionTrackedPayload;
};