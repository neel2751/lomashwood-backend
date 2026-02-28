
export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "https://your-api-url.com";

export const API_TIMEOUT_MS = 15_000;

export const DEFAULT_PAGE_SIZE = 20;

export const PAGE_SIZE_OPTIONS = [10, 20, 50, 100] as const;



export const APP_NAME = "Lomash Wood Admin";
export const APP_DESCRIPTION = "Administration console for Lomash Wood — kitchen & bedroom design.";
export const APP_VERSION = process.env.NEXT_PUBLIC_APP_VERSION ?? "1.0.0";

export const TOKEN_REFRESH_BUFFER_MS = 60_000; 

export const AUTH_STORAGE_KEY = "lw_admin_auth";



export const PRODUCT_CATEGORIES = ["kitchen", "bedroom"] as const;
export type ProductCategory = (typeof PRODUCT_CATEGORIES)[number];

export const PRODUCT_CATEGORY_LABELS: Record<ProductCategory, string> = {
  kitchen: "Kitchen",
  bedroom: "Bedroom",
};



export const APPOINTMENT_TYPES = ["home", "online", "showroom"] as const;
export type AppointmentType = (typeof APPOINTMENT_TYPES)[number];

export const APPOINTMENT_TYPE_LABELS: Record<AppointmentType, string> = {
  home: "Home Measurement",
  online: "Online Consultation",
  showroom: "Showroom Visit",
};

export const ORDER_STATUSES = [
  "pending",
  "confirmed",
  "processing",
  "shipped",
  "delivered",
  "cancelled",
  "refunded",
] as const;
export type OrderStatus = (typeof ORDER_STATUSES)[number];

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  pending: "Pending",
  confirmed: "Confirmed",
  processing: "Processing",
  shipped: "Shipped",
  delivered: "Delivered",
  cancelled: "Cancelled",
  refunded: "Refunded",
};

export const ORDER_STATUS_COLOURS: Record<OrderStatus, string> = {
  pending: "bg-yellow-100 text-yellow-800",
  confirmed: "bg-blue-100 text-blue-800",
  processing: "bg-purple-100 text-purple-800",
  shipped: "bg-indigo-100 text-indigo-800",
  delivered: "bg-green-100 text-green-800",
  cancelled: "bg-red-100 text-red-800",
  refunded: "bg-gray-100 text-gray-800",
};

export const REVIEW_STATUSES = ["pending", "approved", "rejected"] as const;
export type ReviewStatus = (typeof REVIEW_STATUSES)[number];

export const REVIEW_STATUS_LABELS: Record<ReviewStatus, string> = {
  pending: "Pending",
  approved: "Approved",
  rejected: "Rejected",
};

export const SUPPORT_STATUSES = ["open", "in_progress", "resolved", "closed"] as const;
export type SupportStatus = (typeof SUPPORT_STATUSES)[number];

export const NOTIFICATION_CHANNELS = ["email", "sms", "push"] as const;
export type NotificationChannel = (typeof NOTIFICATION_CHANNELS)[number];

export const MANAGED_PAGE_SLUGS = [
  "finance",
  "media-wall",
  "about-us",
  "our-process",
  "why-choose-us",
  "customer-reviews",
  "contact-us",
  "career",
  "faqs",
  "newsletter",
] as const;
export type ManagedPageSlug = (typeof MANAGED_PAGE_SLUGS)[number];


export const GTM_ID = process.env.NEXT_PUBLIC_GTM_ID ?? "";
export const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID ?? "";


export const MAX_PRODUCT_IMAGES = 10;

export const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024;


export const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];


export const ACCEPTED_VIDEO_TYPES = ["video/mp4", "video/webm"];


export const ACCEPTED_MEDIA_TYPES = [...ACCEPTED_IMAGE_TYPES, ...ACCEPTED_VIDEO_TYPES];



export const PRODUCT_FINISH_OPTIONS = [
  { label: "Gloss", value: "gloss" },
  { label: "Matt", value: "matt" },
  { label: "Satin", value: "satin" },
  { label: "Handleless", value: "handleless" },
  { label: "Shaker", value: "shaker" },
  { label: "In-Frame", value: "in-frame" },
] as const;

export const PRODUCT_STYLE_OPTIONS = [
  { label: "Contemporary", value: "contemporary" },
  { label: "Traditional", value: "traditional" },
  { label: "Modern", value: "modern" },
  { label: "Classic", value: "classic" },
  { label: "Rustic", value: "rustic" },
] as const;

export const PRODUCT_SORT_OPTIONS = [
  { label: "Newest", value: "newest" },
  { label: "Price: Low to High", value: "price_asc" },
  { label: "Price: High to Low", value: "price_desc" },
  { label: "Popularity", value: "popularity" },
  { label: "Name A–Z", value: "name_asc" },
] as const;


export const LOYALTY_TIERS = ["bronze", "silver", "gold", "platinum"] as const;
export type LoyaltyTier = (typeof LOYALTY_TIERS)[number];

export const LOYALTY_TIER_LABELS: Record<LoyaltyTier, string> = {
  bronze: "Bronze",
  silver: "Silver",
  gold: "Gold",
  platinum: "Platinum",
};


export const DATE_FORMAT = "dd/MM/yyyy";
export const DATETIME_FORMAT = "dd/MM/yyyy HH:mm";
export const TIME_FORMAT = "HH:mm";


export const SEARCH_DEBOUNCE_MS = 350;


export const TOAST_DURATION_MS = 5_000;


export const SIDEBAR_COLLAPSED_WIDTH = 64;

export const SIDEBAR_EXPANDED_WIDTH = 256;



export const ROLES = {
  SUPER_ADMIN: "super_admin",
  ADMIN: "admin",
  MANAGER: "manager",
  CONSULTANT: "consultant",
  VIEWER: "viewer",
} as const;
export type RoleName = (typeof ROLES)[keyof typeof ROLES];



export const PERMISSIONS = {
  
  PRODUCTS_VIEW: "products:view",
  PRODUCTS_CREATE: "products:create",
  PRODUCTS_UPDATE: "products:update",
  PRODUCTS_DELETE: "products:delete",
  
  ORDERS_VIEW: "orders:view",
  ORDERS_UPDATE: "orders:update",
  
  APPOINTMENTS_VIEW: "appointments:view",
  APPOINTMENTS_UPDATE: "appointments:update",
  
  CUSTOMERS_VIEW: "customers:view",
  CUSTOMERS_UPDATE: "customers:update",
  
  CONTENT_VIEW: "content:view",
  CONTENT_CREATE: "content:create",
  CONTENT_UPDATE: "content:update",
  CONTENT_DELETE: "content:delete",
  
  ANALYTICS_VIEW: "analytics:view",
  ANALYTICS_EXPORT: "analytics:export",
  
  USERS_VIEW: "users:view",
  USERS_MANAGE: "users:manage",
  ROLES_MANAGE: "roles:manage",
  SETTINGS_VIEW: "settings:view",
  SETTINGS_MANAGE: "settings:manage",
} as const;
export type PermissionKey = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];

export const CONTACT_EMAIL_KITCHEN = process.env.NEXT_PUBLIC_KITCHEN_EMAIL ?? "kitchen@lomashwood.com";
export const CONTACT_EMAIL_BEDROOM = process.env.NEXT_PUBLIC_BEDROOM_EMAIL ?? "bedroom@lomashwood.com";
export const CONTACT_EMAIL_BUSINESS = process.env.NEXT_PUBLIC_BUSINESS_EMAIL ?? "business@lomashwood.com";