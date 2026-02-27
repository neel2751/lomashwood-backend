export interface EventMetadata {
  eventId: string;
  topic: string;
  service: string;
  version: string;
  timestamp: string;
  correlationId?: string;
  userId?: string;
}

export interface ConsumedEventEnvelope<T = unknown> {
  metadata: EventMetadata;
  payload: T;
}

export interface OrderCreatedPayload {
  orderId: string;
  userId: string;
  totalAmount: number;
  currency: string;
  itemCount: number;
  createdAt: string;
}

export interface PaymentSucceededPayload {
  paymentId: string;
  orderId: string;
  userId: string;
  amount: number;
  currency: string;
  createdAt: string;
}

export interface AppointmentCreatedPayload {
  appointmentId: string;
  userId: string;
  consultantId: string;
  appointmentType: string;
  scheduledAt: string;
  createdAt: string;
}

export interface AppointmentCompletedPayload {
  appointmentId: string;
  userId: string;
  consultantId: string;
  appointmentType: string;
  completedAt: string;
}

export interface ProductViewedPayload {
  productId: string;
  userId?: string;
  sessionId: string;
  visitorId: string;
  category: string;
  page: string;
  viewedAt: string;
}

export interface UserCreatedPayload {
  userId: string;
  email: string;
  role: string;
  createdAt: string;
}

export interface UserLoggedInPayload {
  userId: string;
  sessionId: string;
  ipAddress?: string;
  userAgent?: string;
  loggedInAt: string;
}

export interface BrochureRequestedPayload {
  requestId: string;
  userId?: string;
  email: string;
  postcode: string;
  requestedAt: string;
}

export interface ReviewCreatedPayload {
  reviewId: string;
  userId: string;
  productId?: string;
  rating: number;
  createdAt: string;
}

export function buildEventMetadata(
  topic: string,
  correlationId?: string,
  userId?: string,
): EventMetadata {
  return {
    eventId: crypto.randomUUID(),
    topic,
    service: 'analytics-service',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    correlationId,
    userId,
  };
}