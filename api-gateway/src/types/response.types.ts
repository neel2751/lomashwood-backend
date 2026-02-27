export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  error?: ErrorDetails;
  meta?: ResponseMeta;
}

export interface ErrorDetails {
  code: string;
  message: string;
  details?: any;
  stack?: string;
}

export interface ResponseMeta {
  timestamp: string;
  requestId?: string;
  pagination?: PaginationMeta;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export interface AuthResponse {
  user: UserResponse;
  tokens: TokenResponse;
}

export interface UserResponse {
  id: string;
  email: string;
  name: string;
  phone?: string;
  role: 'ADMIN' | 'USER' | 'CONSULTANT';
  isEmailVerified: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface TokenResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface ProductResponse {
  id: string;
  title: string;
  slug: string;
  description: string;
  category: 'KITCHEN' | 'BEDROOM';
  rangeName: string;
  price?: number;
  images: string[];
  colours: ColourResponse[];
  units?: ProductUnitResponse[];
  style?: string;
  finish?: string;
  isActive: boolean;
  isFeatured: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ColourResponse {
  id: string;
  name: string;
  hexCode: string;
}

export interface ProductUnitResponse {
  id: string;
  image: string;
  title: string;
  description: string;
}

export interface PaginatedProductsResponse {
  products: ProductResponse[];
  pagination: PaginationMeta;
}

export interface OrderResponse {
  id: string;
  orderNumber: string;
  userId: string;
  items: OrderItemResponse[];
  shippingAddress: AddressResponse;
  billingAddress?: AddressResponse;
  subtotal: number;
  shippingCost: number;
  taxAmount: number;
  discountAmount: number;
  total: number;
  status: 'PENDING' | 'CONFIRMED' | 'PROCESSING' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED' | 'REFUNDED';
  paymentStatus: 'PENDING' | 'PAID' | 'FAILED' | 'REFUNDED';
  couponCode?: string;
  notes?: string;
  trackingNumber?: string;
  createdAt: string;
  updatedAt: string;
}

export interface OrderItemResponse {
  id: string;
  productId: string;
  productTitle: string;
  productImage: string;
  quantity: number;
  price: number;
  selectedColour?: ColourResponse;
  selectedUnit?: ProductUnitResponse;
  subtotal: number;
}

export interface AddressResponse {
  name: string;
  phone: string;
  email: string;
  postcode: string;
  address: string;
  city?: string;
  country?: string;
}

export interface PaginatedOrdersResponse {
  orders: OrderResponse[];
  pagination: PaginationMeta;
}

export interface BookingResponse {
  id: string;
  bookingNumber: string;
  userId?: string;
  appointmentType: 'HOME_MEASUREMENT' | 'ONLINE' | 'SHOWROOM';
  serviceType: {
    kitchen: boolean;
    bedroom: boolean;
  };
  customerDetails: CustomerDetailsResponse;
  slotBooking: SlotBookingResponse;
  showroom?: ShowroomResponse;
  consultant?: ConsultantResponse;
  status: 'PENDING' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED' | 'RESCHEDULED';
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CustomerDetailsResponse {
  name: string;
  phone: string;
  email: string;
  postcode: string;
  address: string;
}

export interface SlotBookingResponse {
  date: string;
  timeSlot: string;
}

export interface ShowroomResponse {
  id: string;
  name: string;
  address: string;
  image?: string;
  email: string;
  phone: string;
  openingHours: string;
  mapLink?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ConsultantResponse {
  id: string;
  name: string;
  email: string;
  phone?: string;
  specialization?: string[];
  isActive: boolean;
}

export interface PaginatedBookingsResponse {
  bookings: BookingResponse[];
  pagination: PaginationMeta;
}

export interface AvailableSlotResponse {
  date: string;
  slots: TimeSlotResponse[];
}

export interface TimeSlotResponse {
  time: string;
  isAvailable: boolean;
  consultantId?: string;
}

export interface QuoteResponse {
  id: string;
  quoteNumber: string;
  items: OrderItemResponse[];
  customerDetails: CustomerDetailsResponse;
  subtotal: number;
  estimatedTotal: number;
  notes?: string;
  status: 'DRAFT' | 'SENT' | 'ACCEPTED' | 'REJECTED' | 'EXPIRED';
  validUntil: string;
  createdAt: string;
  updatedAt: string;
}

export interface InvoiceResponse {
  id: string;
  invoiceNumber: string;
  orderId: string;
  customerDetails: CustomerDetailsResponse;
  items: OrderItemResponse[];
  subtotal: number;
  taxAmount: number;
  total: number;
  issuedDate: string;
  dueDate: string;
  pdfUrl?: string;
}

export interface CouponResponse {
  id: string;
  code: string;
  discountType: 'PERCENTAGE' | 'FIXED';
  discountValue: number;
  minimumOrderValue?: number;
  maximumDiscountAmount?: number;
  isActive: boolean;
  validFrom: string;
  validUntil: string;
}

export interface ShippingRateResponse {
  postcode: string;
  cost: number;
  estimatedDays: number;
  carrier?: string;
}

export interface HealthCheckResponse {
  status: 'healthy' | 'unhealthy';
  timestamp: string;
  uptime: number;
  services: {
    database: ServiceStatus;
    redis: ServiceStatus;
    authService: ServiceStatus;
    productService: ServiceStatus;
    orderService: ServiceStatus;
    appointmentService: ServiceStatus;
  };
}

export interface ServiceStatus {
  status: 'up' | 'down';
  responseTime?: number;
  message?: string;
}

export interface BulkOperationResponse {
  success: number;
  failed: number;
  total: number;
  errors?: Array<{
    id: string;
    error: string;
  }>;
}

export interface FileUploadResponse {
  url: string;
  filename: string;
  size: number;
  mimeType: string;
  uploadedAt: string;
}