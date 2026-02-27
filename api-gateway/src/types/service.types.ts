export interface ServiceConfig {
  baseURL: string;
  timeout: number;
  retries: number;
  retryDelay: number;
}

export interface ServiceResponse<T = any> {
  success: boolean;
  data?: T;
  error?: ServiceError;
  statusCode: number;
}

export interface ServiceError {
  code: string;
  message: string;
  details?: any;
  statusCode?: number;
}

export interface AuthServiceConfig extends ServiceConfig {
  jwtSecret: string;
  jwtExpiresIn: string;
  refreshTokenExpiresIn: string;
}

export interface ProductServiceConfig extends ServiceConfig {
  cacheTTL: number;
  defaultPageSize: number;
  maxPageSize: number;
}

export interface OrderServiceConfig extends ServiceConfig {
  paymentGateway: 'STRIPE' | 'RAZORPAY';
  webhookSecret: string;
  invoiceStoragePath: string;
}

export interface AppointmentServiceConfig extends ServiceConfig {
  slotDuration: number;
  reminderTime: number;
  maxAdvanceBookingDays: number;
}

export interface ContentServiceConfig extends ServiceConfig {
  mediaStoragePath: string;
  maxFileSize: number;
  allowedFileTypes: string[];
}

export interface CustomerServiceConfig extends ServiceConfig {
  loyaltyPointsEnabled: boolean;
  referralBonusPoints: number;
}

export interface NotificationServiceConfig extends ServiceConfig {
  emailProvider: 'NODEMAILER' | 'SES';
  smsProvider: 'TWILIO' | 'MSG91';
  pushProvider: 'FIREBASE';
}

export interface AnalyticsServiceConfig extends ServiceConfig {
  trackingEnabled: boolean;
  dataRetentionDays: number;
}

export interface ServiceRegistry {
  auth: AuthServiceClient;
  product: ProductServiceClient;
  order: OrderServiceClient;
  appointment: AppointmentServiceClient;
  content: ContentServiceClient;
  customer: CustomerServiceClient;
  notification: NotificationServiceClient;
  analytics: AnalyticsServiceClient;
}

export interface AuthServiceClient {
  register(data: RegisterPayload): Promise<ServiceResponse<AuthTokens>>;
  login(data: LoginPayload): Promise<ServiceResponse<AuthTokens>>;
  logout(token: string): Promise<ServiceResponse<void>>;
  refreshToken(token: string): Promise<ServiceResponse<AuthTokens>>;
  verifyToken(token: string): Promise<ServiceResponse<TokenPayload>>;
  forgotPassword(email: string): Promise<ServiceResponse<void>>;
  resetPassword(token: string, password: string): Promise<ServiceResponse<void>>;
  verifyEmail(token: string): Promise<ServiceResponse<void>>;
  getProfile(userId: string): Promise<ServiceResponse<UserProfile>>;
  updateProfile(userId: string, data: UpdateProfilePayload): Promise<ServiceResponse<UserProfile>>;
}

export interface ProductServiceClient {
  getProducts(filters: ProductFilters): Promise<ServiceResponse<PaginatedProducts>>;
  getProductById(id: string): Promise<ServiceResponse<Product>>;
  getProductBySlug(slug: string): Promise<ServiceResponse<Product>>;
  createProduct(data: CreateProductPayload): Promise<ServiceResponse<Product>>;
  updateProduct(id: string, data: UpdateProductPayload): Promise<ServiceResponse<Product>>;
  deleteProduct(id: string): Promise<ServiceResponse<void>>;
  getColours(): Promise<ServiceResponse<Colour[]>>;
  createColour(data: CreateColourPayload): Promise<ServiceResponse<Colour>>;
  bulkUpdateProducts(ids: string[], updates: BulkUpdatePayload): Promise<ServiceResponse<BulkOperationResult>>;
}

export interface OrderServiceClient {
  createOrder(data: CreateOrderPayload): Promise<ServiceResponse<Order>>;
  getOrders(filters: OrderFilters): Promise<ServiceResponse<PaginatedOrders>>;
  getOrderById(id: string): Promise<ServiceResponse<Order>>;
  updateOrderStatus(id: string, status: OrderStatus, notes?: string): Promise<ServiceResponse<Order>>;
  cancelOrder(id: string, reason: string): Promise<ServiceResponse<Order>>;
  createPaymentIntent(orderId: string): Promise<ServiceResponse<PaymentIntent>>;
  handleWebhook(event: WebhookEvent): Promise<ServiceResponse<void>>;
  generateInvoice(orderId: string): Promise<ServiceResponse<Invoice>>;
  applyCoupon(code: string, total: number): Promise<ServiceResponse<CouponResult>>;
  calculateShipping(postcode: string, items: OrderItem[]): Promise<ServiceResponse<ShippingRate>>;
  createQuote(data: CreateQuotePayload): Promise<ServiceResponse<Quote>>;
}

export interface AppointmentServiceClient {
  createBooking(data: CreateBookingPayload): Promise<ServiceResponse<Booking>>;
  getBookings(filters: BookingFilters): Promise<ServiceResponse<PaginatedBookings>>;
  getBookingById(id: string): Promise<ServiceResponse<Booking>>;
  updateBookingStatus(id: string, status: BookingStatus, notes?: string): Promise<ServiceResponse<Booking>>;
  rescheduleBooking(id: string, newDate: string, newTimeSlot: string, reason: string): Promise<ServiceResponse<Booking>>;
  cancelBooking(id: string, reason: string): Promise<ServiceResponse<Booking>>;
  getAvailableSlots(type: AppointmentType, date: string, showroomId?: string): Promise<ServiceResponse<AvailableSlot[]>>;
  assignConsultant(bookingId: string, consultantId: string): Promise<ServiceResponse<Booking>>;
  sendReminder(bookingId: string): Promise<ServiceResponse<void>>;
}

export interface ContentServiceClient {
  getBlogs(filters: BlogFilters): Promise<ServiceResponse<PaginatedBlogs>>;
  getBlogBySlug(slug: string): Promise<ServiceResponse<Blog>>;
  createBlog(data: CreateBlogPayload): Promise<ServiceResponse<Blog>>;
  updateBlog(id: string, data: UpdateBlogPayload): Promise<ServiceResponse<Blog>>;
  deleteBlog(id: string): Promise<ServiceResponse<void>>;
  getPage(slug: string): Promise<ServiceResponse<Page>>;
  updatePage(slug: string, data: UpdatePagePayload): Promise<ServiceResponse<Page>>;
  uploadMedia(file: MulterFile): Promise<ServiceResponse<MediaFile>>;
}

export interface MulterFile {
  fieldname: string;
  originalname: string;
  encoding: string;
  mimetype: string;
  size: number;
  buffer: Buffer;
  destination?: string;
  filename?: string;
  path?: string;
}

export interface CustomerServiceClient {
  getProfile(userId: string): Promise<ServiceResponse<CustomerProfile>>;
  updateProfile(userId: string, data: UpdateCustomerPayload): Promise<ServiceResponse<CustomerProfile>>;
  getWishlist(userId: string): Promise<ServiceResponse<WishlistItem[]>>;
  addToWishlist(userId: string, productId: string): Promise<ServiceResponse<WishlistItem>>;
  removeFromWishlist(userId: string, productId: string): Promise<ServiceResponse<void>>;
  createReview(data: CreateReviewPayload): Promise<ServiceResponse<Review>>;
  getReviews(productId: string): Promise<ServiceResponse<Review[]>>;
  createSupportTicket(data: CreateSupportTicketPayload): Promise<ServiceResponse<SupportTicket>>;
  getLoyaltyPoints(userId: string): Promise<ServiceResponse<LoyaltyPoints>>;
}

export interface NotificationServiceClient {
  sendEmail(data: EmailPayload): Promise<ServiceResponse<void>>;
  sendSMS(data: SMSPayload): Promise<ServiceResponse<void>>;
  sendPushNotification(data: PushPayload): Promise<ServiceResponse<void>>;
  sendBookingConfirmation(booking: Booking): Promise<ServiceResponse<void>>;
  sendOrderConfirmation(order: Order): Promise<ServiceResponse<void>>;
  sendBrochureEmail(email: string, brochureUrl: string): Promise<ServiceResponse<void>>;
  sendInternalNotification(type: string, data: any): Promise<ServiceResponse<void>>;
}

export interface AnalyticsServiceClient {
  trackEvent(event: AnalyticsEvent): Promise<ServiceResponse<void>>;
  trackPageView(data: PageViewData): Promise<ServiceResponse<void>>;
  trackConversion(data: ConversionData): Promise<ServiceResponse<void>>;
  getDashboardMetrics(filters: MetricFilters): Promise<ServiceResponse<DashboardMetrics>>;
  getReports(type: ReportType, filters: ReportFilters): Promise<ServiceResponse<Report>>;
}

export interface RegisterPayload {
  email: string;
  password: string;
  name: string;
  phone?: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface TokenPayload {
  userId: string;
  email: string;
  role: string;
  iat: number;
  exp: number;
}

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  phone?: string;
  role: string;
  isEmailVerified: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface UpdateProfilePayload {
  name?: string;
  phone?: string;
  postcode?: string;
  address?: string;
}

export interface ProductFilters {
  category?: 'KITCHEN' | 'BEDROOM';
  colours?: string;
  style?: string;
  finish?: string;
  range?: string;
  sortBy?: string;
  page?: number;
  limit?: number;
  search?: string;
}

export interface PaginatedProducts {
  products: Product[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface Product {
  id: string;
  title: string;
  slug: string;
  description: string;
  category: 'KITCHEN' | 'BEDROOM';
  rangeName: string;
  price?: number;
  images: string[];
  colours: Colour[];
  units?: ProductUnit[];
  style?: string;
  finish?: string;
  isActive: boolean;
  isFeatured: boolean;
}

export interface Colour {
  id: string;
  name: string;
  hexCode: string;
}

export interface ProductUnit {
  id: string;
  image: string;
  title: string;
  description: string;
}

export interface CreateProductPayload {
  title: string;
  description: string;
  category: 'KITCHEN' | 'BEDROOM';
  rangeName: string;
  price?: number;
  images: string[];
  colourIds: string[];
  units?: Omit<ProductUnit, 'id'>[];
  style?: string;
  finish?: string;
}

export interface UpdateProductPayload extends Partial<CreateProductPayload> {}

export interface CreateColourPayload {
  name: string;
  hexCode: string;
}

export interface BulkUpdatePayload {
  isActive?: boolean;
  isFeatured?: boolean;
  price?: number;
}

export interface BulkOperationResult {
  success: number;
  failed: number;
  total: number;
}

export interface OrderFilters {
  status?: OrderStatus;
  page?: number;
  limit?: number;
  startDate?: string;
  endDate?: string;
  search?: string;
}

export interface PaginatedOrders {
  orders: Order[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface Order {
  id: string;
  orderNumber: string;
  userId: string;
  items: OrderItem[];
  shippingAddress: Address;
  billingAddress?: Address;
  subtotal: number;
  shippingCost: number;
  taxAmount: number;
  discountAmount: number;
  total: number;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
}

export interface OrderItem {
  productId: string;
  quantity: number;
  price: number;
  selectedColourId?: string;
  selectedUnitId?: string;
}

export interface Address {
  name: string;
  phone: string;
  email: string;
  postcode: string;
  address: string;
  city?: string;
  country?: string;
}

export type OrderStatus = 'PENDING' | 'CONFIRMED' | 'PROCESSING' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED' | 'REFUNDED';
export type PaymentStatus = 'PENDING' | 'PAID' | 'FAILED' | 'REFUNDED';

export interface CreateOrderPayload {
  items: OrderItem[];
  shippingAddress: Address;
  billingAddress?: Address;
  couponCode?: string;
  notes?: string;
}

export interface PaymentIntent {
  id: string;
  clientSecret: string;
  amount: number;
  currency: string;
}

export interface WebhookEvent {
  type: string;
  data: any;
  signature: string;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  orderId: string;
  pdfUrl: string;
}

export interface CouponResult {
  code: string;
  discountAmount: number;
  newTotal: number;
}

export interface ShippingRate {
  postcode: string;
  cost: number;
  estimatedDays: number;
}

export interface Quote {
  id: string;
  quoteNumber: string;
  items: OrderItem[];
  subtotal: number;
  estimatedTotal: number;
}

export interface CreateQuotePayload {
  items: OrderItem[];
  customerDetails: Address;
  notes?: string;
}

export interface BookingFilters {
  status?: BookingStatus;
  appointmentType?: AppointmentType;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
  search?: string;
  showroomId?: string;
}

export interface PaginatedBookings {
  bookings: Booking[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface Booking {
  id: string;
  bookingNumber: string;
  userId?: string;
  appointmentType: AppointmentType;
  serviceType: ServiceType;
  customerDetails: CustomerDetails;
  slotBooking: SlotBooking;
  showroomId?: string;
  consultantId?: string;
  status: BookingStatus;
  notes?: string;
}

export type AppointmentType = 'HOME_MEASUREMENT' | 'ONLINE' | 'SHOWROOM';
export type BookingStatus = 'PENDING' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED' | 'RESCHEDULED';

export interface ServiceType {
  kitchen: boolean;
  bedroom: boolean;
}

export interface CustomerDetails {
  name: string;
  phone: string;
  email: string;
  postcode: string;
  address: string;
}

export interface SlotBooking {
  date: string;
  timeSlot: string;
}

export interface CreateBookingPayload {
  appointmentType: AppointmentType;
  serviceType: ServiceType;
  customerDetails: CustomerDetails;
  slotBooking: SlotBooking;
  showroomId?: string;
  notes?: string;
}

export interface AvailableSlot {
  date: string;
  slots: TimeSlot[];
}

export interface TimeSlot {
  time: string;
  isAvailable: boolean;
}

export interface BlogFilters {
  page?: number;
  limit?: number;
  search?: string;
  category?: string;
}

export interface PaginatedBlogs {
  blogs: Blog[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface Blog {
  id: string;
  title: string;
  slug: string;
  content: string;
  excerpt: string;
  featuredImage?: string;
  author: string;
  publishedAt?: string;
}

export interface Page {
  id: string;
  slug: string;
  title: string;
  content: string;
  metadata?: Record<string, any>;
}

export interface CreateBlogPayload {
  title: string;
  content: string;
  excerpt: string;
  featuredImage?: string;
  category?: string;
}

export interface UpdateBlogPayload extends Partial<CreateBlogPayload> {}

export interface UpdatePagePayload {
  title?: string;
  content?: string;
  metadata?: Record<string, any>;
}

export interface MediaFile {
  url: string;
  filename: string;
  size: number;
  mimeType: string;
}

export interface CustomerProfile {
  id: string;
  email: string;
  name: string;
  phone?: string;
  postcode?: string;
  address?: string;
  loyaltyPoints: number;
}

export interface UpdateCustomerPayload {
  name?: string;
  phone?: string;
  postcode?: string;
  address?: string;
}

export interface WishlistItem {
  id: string;
  productId: string;
  addedAt: string;
}

export interface Review {
  id: string;
  productId: string;
  userId: string;
  rating: number;
  comment: string;
  createdAt: string;
}

export interface CreateReviewPayload {
  productId: string;
  rating: number;
  comment: string;
}

export interface SupportTicket {
  id: string;
  subject: string;
  message: string;
  status: string;
  createdAt: string;
}

export interface CreateSupportTicketPayload {
  subject: string;
  message: string;
}

export interface LoyaltyPoints {
  total: number;
  earned: number;
  redeemed: number;
  transactions: LoyaltyTransaction[];
}

export interface LoyaltyTransaction {
  id: string;
  points: number;
  type: 'EARNED' | 'REDEEMED';
  description: string;
  createdAt: string;
}

export interface EmailPayload {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export interface SMSPayload {
  to: string;
  message: string;
}

export interface PushPayload {
  userId: string;
  title: string;
  body: string;
  data?: Record<string, any>;
}

export interface AnalyticsEvent {
  eventName: string;
  userId?: string;
  properties?: Record<string, any>;
  timestamp: string;
}

export interface PageViewData {
  path: string;
  userId?: string;
  referrer?: string;
  timestamp: string;
}

export interface ConversionData {
  type: string;
  value: number;
  userId?: string;
  orderId?: string;
  timestamp: string;
}

export interface MetricFilters {
  startDate: string;
  endDate: string;
  metric?: string;
}

export interface DashboardMetrics {
  totalOrders: number;
  totalRevenue: number;
  totalBookings: number;
  conversionRate: number;
  averageOrderValue: number;
}

export type ReportType = 'SALES' | 'PRODUCTS' | 'CUSTOMERS' | 'BOOKINGS';

export interface ReportFilters {
  startDate: string;
  endDate: string;
  format?: 'JSON' | 'CSV' | 'PDF';
}

export interface Report {
  type: ReportType;
  data: any[];
  generatedAt: string;
}