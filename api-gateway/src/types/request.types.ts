import { Request } from 'express';
import {
  RegisterInput,
  LoginInput,
  ForgotPasswordInput,
  ResetPasswordInput,
  ChangePasswordInput,
  UpdateProfileInput,
  VerifyEmailInput,
  ResendVerificationInput,
} from '../validators/auth.validator';
import {
  GetProductByIdInput,
  GetProductBySlugInput,
  CreateProductInput,
  UpdateProductInput,
  DeleteProductInput,
  BulkUpdateProductsInput,
} from '../validators/product.validator';
import {
  CreateOrderInput,
  GetOrderByIdInput,
  UpdateOrderStatusInput,
  CancelOrderInput,
  ApplyCouponInput,
  CalculateShippingInput,
  CreateQuoteInput,
  GetOrderInvoiceInput,
  TrackOrderInput,
  AddOrderNoteInput,
} from '../validators/order.validator';
import {
  CreateBookingInput,
  GetBookingByIdInput,
  UpdateBookingStatusInput,
  RescheduleBookingInput,
  CancelBookingInput,
  AssignConsultantInput,
  AddBookingNoteInput,
  SendBookingReminderInput,
  BulkUpdateBookingsInput,
} from '../validators/booking.validator';

export interface AuthenticatedUser {
  id: string;
  email: string;
  name: string;
  role: 'ADMIN' | 'USER' | 'CONSULTANT';
  isEmailVerified: boolean;
}

export interface AuthRequest<T = any> extends Request {
  user?: AuthenticatedUser;
  body: T;
}

export interface RegisterRequest extends AuthRequest<RegisterInput> {}
export interface LoginRequest extends AuthRequest<LoginInput> {}
export interface ForgotPasswordRequest extends AuthRequest<ForgotPasswordInput> {}
export interface ResetPasswordRequest extends AuthRequest<ResetPasswordInput> {}
export interface ChangePasswordRequest extends AuthRequest<ChangePasswordInput> {}
export interface UpdateProfileRequest extends AuthRequest<UpdateProfileInput> {}
export interface VerifyEmailRequest extends AuthRequest<VerifyEmailInput> {}
export interface ResendVerificationRequest extends AuthRequest<ResendVerificationInput> {}

// ✅ Fix: query typed as any to avoid ParsedQs incompatibility (Express types query as string-only)
export interface GetProductsRequest extends Request {
  query: any;
}

export interface GetProductByIdRequest extends Request {
  params: GetProductByIdInput;
}

export interface GetProductBySlugRequest extends Request {
  params: GetProductBySlugInput;
}

export interface CreateProductRequest extends AuthRequest<CreateProductInput> {}

export interface UpdateProductRequest extends AuthRequest {
  params: UpdateProductInput['params'];
  body: UpdateProductInput['body'];
}

export interface DeleteProductRequest extends Request {
  params: DeleteProductInput;
}

export interface GetProductsByRangeRequest extends Request {
  query: any;
}

// ✅ Fix: query typed as any
export interface GetProductsByCategoryRequest extends Request {
  params: GetProductByIdInput;
  query: any;
}

export interface BulkUpdateProductsRequest extends AuthRequest<BulkUpdateProductsInput> {}

export interface CreateOrderRequest extends AuthRequest<CreateOrderInput> {}

// ✅ Fix: query typed as any
export interface GetOrdersRequest extends AuthRequest {
  query: any;
}

export interface GetOrderByIdRequest extends AuthRequest {
  params: GetOrderByIdInput;
}

export interface UpdateOrderStatusRequest extends AuthRequest {
  params: UpdateOrderStatusInput['params'];
  body: UpdateOrderStatusInput['body'];
}

export interface CancelOrderRequest extends AuthRequest {
  params: CancelOrderInput['params'];
  body: CancelOrderInput['body'];
}

export interface ApplyCouponRequest extends AuthRequest<ApplyCouponInput> {}
export interface CalculateShippingRequest extends AuthRequest<CalculateShippingInput> {}
export interface CreateQuoteRequest extends AuthRequest<CreateQuoteInput> {}

export interface GetOrderInvoiceRequest extends AuthRequest {
  params: GetOrderInvoiceInput;
}

export interface TrackOrderRequest extends Request {
  params: TrackOrderInput;
}

export interface AddOrderNoteRequest extends AuthRequest {
  params: AddOrderNoteInput['params'];
  body: AddOrderNoteInput['body'];
}

export interface CreateBookingRequest extends AuthRequest<CreateBookingInput> {}

// ✅ Fix: query typed as any
export interface GetBookingsRequest extends AuthRequest {
  query: any;
}

export interface GetBookingByIdRequest extends AuthRequest {
  params: GetBookingByIdInput;
}

export interface UpdateBookingStatusRequest extends AuthRequest {
  params: UpdateBookingStatusInput['params'];
  body: UpdateBookingStatusInput['body'];
}

export interface RescheduleBookingRequest extends AuthRequest {
  params: RescheduleBookingInput['params'];
  body: RescheduleBookingInput['body'];
}

export interface CancelBookingRequest extends AuthRequest {
  params: CancelBookingInput['params'];
  body: CancelBookingInput['body'];
}

export interface GetAvailableSlotsRequest extends Request {
  query: any;
}

export interface AssignConsultantRequest extends AuthRequest {
  params: AssignConsultantInput['params'];
  body: AssignConsultantInput['body'];
}

export interface AddBookingNoteRequest extends AuthRequest {
  params: AddBookingNoteInput['params'];
  body: AddBookingNoteInput['body'];
}

export interface SendBookingReminderRequest extends AuthRequest {
  params: SendBookingReminderInput;
}

export interface GetBookingsByDateRangeRequest extends AuthRequest {
  query: any;
}

export interface BulkUpdateBookingsRequest extends AuthRequest<BulkUpdateBookingsInput> {}

export interface PaginationQuery {
  page?: number;
  limit?: number;
}

export interface SortQuery {
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface SearchQuery {
  search?: string;
}

export interface DateRangeQuery {
  startDate?: string;
  endDate?: string;
}

export interface FilterQuery extends PaginationQuery, SortQuery, SearchQuery, DateRangeQuery {}