export interface OrderCompletedPayload {
  orderId: string;
  customerId: string;
  userId: string;
  orderRef: string;
  totalAmount: number;
  currency: string;
  lineItems: Array<{
    productId: string;
    productName: string;
    quantity: number;
    unitPrice: number;
  }>;
  completedAt: string;
}

export interface OrderCancelledPayload {
  orderId: string;
  customerId: string;
  userId: string;
  orderRef: string;
  reason: string;
  cancelledAt: string;
}

export interface PaymentSucceededPayload {
  paymentId: string;
  orderId: string;
  customerId: string;
  userId: string;
  amount: number;
  currency: string;
  provider: string;
  reference: string;
  succeededAt: string;
}

export interface AppointmentBookedPayload {
  appointmentId: string;
  customerId: string;
  userId: string;
  appointmentType: 'HOME' | 'ONLINE' | 'SHOWROOM';
  showroomId?: string;
  scheduledAt: string;
  bookedAt: string;
}

export interface AppointmentCancelledPayload {
  appointmentId: string;
  customerId: string;
  userId: string;
  reason?: string;
  cancelledAt: string;
}

export interface UserRegisteredPayload {
  userId: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  role: string;
  registeredAt: string;
}

export interface InboundEventEnvelope<T> {
  metadata: {
    eventId: string;
    topic: string;
    version: string;
    timestamp: string;
    source: string;
    correlationId?: string;
    causationId?: string;
  };
  payload: T;
}