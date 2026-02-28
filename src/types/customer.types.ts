import type { PaginationParams } from "./api.types";

export type ReviewStatus = "pending" | "approved" | "rejected";

export type SupportStatus = "open" | "in_progress" | "resolved" | "closed";

export type LoyaltyTier = "bronze" | "silver" | "gold" | "platinum";

export type Customer = {
  id: string;
  name: string;
  email: string;
  phone: string;
  postcode: string;
  address: string;
  loyaltyPoints: number;
  loyaltyTier: LoyaltyTier;
  totalSpend: number;
  orderCount: number;
  appointmentCount: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export type CustomerTimeline = {
  id: string;
  customerId: string;
  type:
    | "order"
    | "appointment"
    | "review"
    | "support"
    | "loyalty"
    | "brochure"
    | "registration";
  description: string;
  referenceId?: string;
  createdAt: string;
};

export type Review = {
  id: string;
  customerId: string;
  customerName?: string;
  rating: number;
  title?: string;
  content: string;
  images?: string[];
  video?: string;
  status: ReviewStatus;
  rejectionReason?: string;
  publishedAt?: string;
  createdAt: string;
  updatedAt: string;
};

export type SupportTicket = {
  id: string;
  customerId: string;
  customerName?: string;
  customerEmail?: string;
  subject: string;
  description: string;
  status: SupportStatus;
  assignedTo?: string;
  assignedToName?: string;
  priority: "low" | "medium" | "high" | "urgent";
  resolvedAt?: string;
  createdAt: string;
  updatedAt: string;
};

export type LoyaltyAccount = {
  id: string;
  customerId: string;
  customerName?: string;
  points: number;
  tier: LoyaltyTier;
  lifetimePoints: number;
  transactions: LoyaltyTransaction[];
  createdAt: string;
  updatedAt: string;
};

export type LoyaltyTransaction = {
  id: string;
  loyaltyAccountId: string;
  points: number;
  type: "earn" | "redeem" | "adjustment" | "expire";
  reason: string;
  referenceId?: string;
  createdAt: string;
};

export type BrochureRequest = {
  id: string;
  name: string;
  phone: string;
  email: string;
  postcode: string;
  address: string;
  createdAt: string;
};

export type BusinessEnquiry = {
  id: string;
  name: string;
  email: string;
  phone: string;
  businessType: string;
  createdAt: string;
};

export type CreateReviewPayload = {
  customerId: string;
  rating: number;
  title?: string;
  content: string;
};

export type CreateSupportTicketPayload = {
  customerId: string;
  subject: string;
  description: string;
  priority?: "low" | "medium" | "high" | "urgent";
};

export type AdjustLoyaltyPointsPayload = {
  points: number;
  reason: string;
};

export type CustomerFilterParams = PaginationParams & {
  search?: string;
  loyaltyTier?: LoyaltyTier;
  isActive?: boolean;
  startDate?: string;
  endDate?: string;
};

export type ReviewFilterParams = PaginationParams & {
  search?: string;
  status?: ReviewStatus;
  customerId?: string;
  minRating?: number;
  maxRating?: number;
};

export type SupportFilterParams = PaginationParams & {
  search?: string;
  status?: SupportStatus;
  priority?: "low" | "medium" | "high" | "urgent";
  assignedTo?: string;
  customerId?: string;
};