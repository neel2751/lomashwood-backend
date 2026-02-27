export interface BaseEventPayload {
  eventId: string;
  timestamp: string;
  correlationId?: string;
}

export interface OrderCreatedEventPayload extends BaseEventPayload {
  orderId: string;
  userId: string;
  totalAmount: number;
  currency: string;
  itemCount: number;
}

export interface OrderCancelledEventPayload extends BaseEventPayload {
  orderId: string;
  userId: string;
  reason?: string;
  cancelledAt: string;
}

export interface PaymentSucceededEventPayload extends BaseEventPayload {
  paymentId: string;
  orderId: string;
  userId: string;
  amount: number;
  currency: string;
}

export interface AppointmentCreatedEventPayload extends BaseEventPayload {
  appointmentId: string;
  userId: string;
  consultantId: string;
  appointmentType: string;
  forKitchen: boolean;
  forBedroom: boolean;
  scheduledAt: string;
}

export interface AppointmentCancelledEventPayload extends BaseEventPayload {
  appointmentId: string;
  userId: string;
  reason?: string;
  cancelledAt: string;
}

export interface AppointmentCompletedEventPayload extends BaseEventPayload {
  appointmentId: string;
  userId: string;
  consultantId: string;
  appointmentType: string;
  completedAt: string;
}

export interface ProductViewedEventPayload extends BaseEventPayload {
  productId: string;
  userId?: string;
  sessionId: string;
  visitorId: string;
  category: string;
  page: string;
}

export interface ProductCreatedEventPayload extends BaseEventPayload {
  productId: string;
  category: string;
  title: string;
  createdBy: string;
}

export interface ProductUpdatedEventPayload extends BaseEventPayload {
  productId: string;
  category: string;
  changedFields: string[];
  updatedBy: string;
}

export interface UserCreatedEventPayload extends BaseEventPayload {
  userId: string;
  email: string;
  role: string;
}

export interface UserLoggedInEventPayload extends BaseEventPayload {
  userId: string;
  sessionId: string;
  ipHash?: string;
  deviceType?: string;
  country?: string;
}

export interface ReviewCreatedEventPayload extends BaseEventPayload {
  reviewId: string;
  userId: string;
  productId?: string;
  rating: number;
}

export interface BrochureRequestedEventPayload extends BaseEventPayload {
  requestId: string;
  userId?: string;
  email: string;
  postcode: string;
}

export interface NewsletterSubscribedEventPayload extends BaseEventPayload {
  subscriptionId: string;
  email: string;
  userId?: string;
}

export interface SupportTicketCreatedEventPayload extends BaseEventPayload {
  ticketId: string;
  userId: string;
  category: string;
  priority: string;
}