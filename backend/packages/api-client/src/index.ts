
export { authService } from './services/auth.service';
export { productService } from './services/product.service';
export { appointmentService } from './services/appointment.service';
export { OrderService } from './services/order.service';
export { CustomerService } from './services/customer.service';
export { ContentService } from './services/content.service';
export { NotificationService } from './services/notification.service';
export { AnalyticsService } from './services/analytics.service';
export { UploadService } from './services/upload.service';


export {
  HttpClient,
  createAuthService,
  createProductService,
  createOrderService,
  createAppointmentService,
  createCustomerService,
  createContentService,
  createNotificationService,
  createAnalyticsService,
  createUploadService,
} from './utils/http';
export {
  handleApiError,
  ApiError,
  ValidationError,
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
  ConflictError,
  RateLimitError,
  ServerError,
} from './utils/error';
export { logger, createServiceLogger, LogLevel } from './utils/logger';
export {
  validateSchema,
  validateAndThrow,
  validateBody,
  validateQuery,
  validateParams,
} from './utils/validation';



export * from './types/api.types';




export type {
  User,
  LoginRequest,
  RegisterRequest,
  ForgotPasswordRequest,
  ResetPasswordRequest,
  ChangePasswordRequest,
  AuthResponse,
  RefreshTokenRequest,
} from './types/auth.types';
export type { Session as AuthSession } from './types/auth.types';



export type {
  Blog,
  BlogCategory,
  CreateBlogRequest,
  UpdateBlogRequest,
  MediaItem,
  CreateMediaItemRequest,
  UpdateMediaItemRequest,
  CmsPage,
  CreateCmsPageRequest,
  UpdateCmsPageRequest,
  Showroom,
  CreateShowroomRequest,
  UpdateShowroomRequest,
  SeoMeta,
  UpdateSeoRequest,
  LandingPage,
  CreateLandingPageRequest,
  UpdateLandingPageRequest,
} from './types/content.types';




export type {
  Notification,
  SendNotificationRequest,
  EmailLog,
  SendEmailRequest,
  SmsLog,
  SendSmsRequest,
  PushLog,
  SendPushRequest,
} from './types/notification.types';
export type { NotificationTemplate as NotificationTemplateType } from './types/notification.types';
export type { CreateTemplateRequest as CreateNotificationTemplateRequest } from './types/notification.types';
export type { UpdateTemplateRequest as UpdateNotificationTemplateRequest } from './types/notification.types';




export type {
  Category,
  CreateCategoryRequest,
  UpdateCategoryRequest,
  Colour,
  CreateColourRequest,
  UpdateColourRequest,
  Size,
  UpdateSizeRequest,
  Product,
  CreateProductRequest,
  UpdateProductRequest,
  FilterProductRequest,
  Inventory,
  CreateInventoryRequest,
  UpdateInventoryRequest,
  Pricing,
  CreatePricingRequest,
  UpdatePricingRequest,
} from './types/product.types';
export type { CreateSizeRequest as CreateProductSizeRequest } from './types/product.types';




export type {
  Customer,
  CreateCustomerRequest,
  UpdateCustomerRequest,
  ModerateReviewRequest,
  CreateTicketRequest,
  UpdateTicketRequest,
  AddTicketMessageRequest,
  LoyaltyAccount,
  LoyaltyTransaction,
  AdjustLoyaltyRequest,
  Wishlist,
  AddToWishlistRequest,
  SavedDesign,
  CreateSavedDesignRequest,
  UpdateSavedDesignRequest,
} from './types/customer.types';
export type { SupportTicket as CustomerSupportTicket } from './types/customer.types';
export type { Review as CustomerReview } from './types/customer.types';
export type { CreateReviewRequest as CreateCustomerReviewRequest } from './types/customer.types';





export type {
  FileVariant,
  UpdateUploadRequest,
  FileValidationResult,
  FileCategory,
  FileTag,
  FileBackup,
  FileRestore,
  UploadPreset,
  FileAnalytics,
  FileSearchResult,
  FileSearchFilters,
  FileWebhook,
  FileWebhookEvent,
  CreateProcessingJobRequest,
} from './types/upload.types';
export type { UploadedFile as UploadedFileType } from './types/upload.types';
export type { CreateUploadRequest as CreateFileUploadRequest } from './types/upload.types';
export type { FileProcessingJob as FileProcessingJobType } from './types/upload.types';
export type { UploadStats as FileUploadStats } from './types/upload.types';
export type { UploadFilters as FileUploadFilters } from './types/upload.types';


export * from './types/appointment.types';
export * from './types/order.types';
export * from './types/analytics.types';