

export interface UserCreatedPayload {
  userId: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  createdAt: string;
}


export interface OrderCreatedPayload {
  orderId: string;
  userId: string;
  customerEmail: string;
  customerPhone?: string;
  totalAmount: number;
  currency: string;
  items: Array<{
    productId: string;
    productName: string;
    quantity: number;
    unitPrice: number;
  }>;
  createdAt: string;
}

export interface OrderCancelledPayload {
  orderId: string;
  userId: string;
  customerEmail: string;
  reason?: string;
  cancelledAt: string;
}

export interface PaymentSucceededPayload {
  paymentId: string;
  orderId: string;
  userId: string;
  customerEmail: string;
  amount: number;
  currency: string;
  paymentMethod?: string;
  paidAt: string;
}

export interface RefundIssuedPayload {
  refundId: string;
  orderId: string;
  userId: string;
  customerEmail: string;
  refundAmount: number;
  currency: string;
  issuedAt: string;
}



export interface BookingCreatedPayload {
  bookingId: string;
  userId: string;
  customerEmail: string;
  customerPhone?: string;
  appointmentType: 'HOME_MEASUREMENT' | 'ONLINE' | 'SHOWROOM';
  isKitchen: boolean;
  isBedroom: boolean;
  scheduledAt: string;
  showroomId?: string;
  createdAt: string;
}

export interface BookingCancelledPayload {
  bookingId: string;
  userId: string;
  customerEmail: string;
  scheduledAt: string;
  reason?: string;
  cancelledAt: string;
}

export interface ReminderDuePayload {
  reminderId: string;
  bookingId: string;
  userId: string;
  customerEmail: string;
  customerPhone?: string;
  appointmentType: string;
  scheduledAt: string;
}


export interface BlogPublishedPayload {
  blogId: string;
  title: string;
  slug: string;
  authorId: string;
  publishedAt: string;
}