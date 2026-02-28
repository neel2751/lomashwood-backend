

import { axiosInstance } from "./axios";



export type ApiResponse<T> = {
  data: T;
  message?: string;
  meta?: PaginationMeta;
};

export type PaginationMeta = {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
};

export type PaginatedResponse<T> = ApiResponse<T[]>;

export type RequestConfig = {
  params?: Record<string, unknown>;
  signal?: AbortSignal;
};

export function createResourceClient<
  TItem,
  TCreateDto = Partial<TItem>,
  TUpdateDto = Partial<TItem>,
>(basePath: string) {
  return {
   
    getAll: (
      params?: Record<string, unknown>,
      config?: RequestConfig,
    ): Promise<PaginatedResponse<TItem>> =>
      axiosInstance
        .get<PaginatedResponse<TItem>>(basePath, {
          params,
          signal: config?.signal,
        })
        .then((r) => r.data),

  
    getById: (id: string | number, config?: RequestConfig): Promise<ApiResponse<TItem>> =>
      axiosInstance
        .get<ApiResponse<TItem>>(`${basePath}/${id}`, { signal: config?.signal })
        .then((r) => r.data),

    create: (payload: TCreateDto): Promise<ApiResponse<TItem>> =>
      axiosInstance
        .post<ApiResponse<TItem>>(basePath, payload)
        .then((r) => r.data),

   
    update: (id: string | number, payload: TUpdateDto): Promise<ApiResponse<TItem>> =>
      axiosInstance
        .put<ApiResponse<TItem>>(`${basePath}/${id}`, payload)
        .then((r) => r.data),

    patch: (
      id: string | number,
      payload: Partial<TUpdateDto>,
    ): Promise<ApiResponse<TItem>> =>
      axiosInstance
        .patch<ApiResponse<TItem>>(`${basePath}/${id}`, payload)
        .then((r) => r.data),

    remove: (id: string | number): Promise<ApiResponse<void>> =>
      axiosInstance
        .delete<ApiResponse<void>>(`${basePath}/${id}`)
        .then((r) => r.data),
  };
}


export async function uploadFiles(
  path: string,
  files: File[],
  meta?: Record<string, string>,
): Promise<ApiResponse<{ urls: string[] }>> {
  const form = new FormData();
  files.forEach((file) => form.append("files", file));
  if (meta) {
    Object.entries(meta).forEach(([key, value]) => form.append(key, value));
  }
  const response = await axiosInstance.post<ApiResponse<{ urls: string[] }>>(path, form, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return response.data;
}


export const authClient = {
  login: (credentials: { email: string; password: string }) =>
    axiosInstance
      .post<ApiResponse<{ accessToken: string; refreshToken: string }>>("/auth/login", credentials)
      .then((r) => r.data),

  logout: () =>
    axiosInstance.post<ApiResponse<void>>("/auth/logout").then((r) => r.data),

  refreshToken: (refreshToken: string) =>
    axiosInstance
      .post<ApiResponse<{ accessToken: string }>>("/auth/refresh", { refreshToken })
      .then((r) => r.data),

  me: () =>
    axiosInstance.get<ApiResponse<AdminUser>>("/auth/me").then((r) => r.data),

  users: createResourceClient<AdminUser>("/auth/users"),
  roles: createResourceClient<Role>("/auth/roles"),
  sessions: createResourceClient<Session>("/auth/sessions"),
};


export const productClient = {
  products: createResourceClient<Product>("/products"),
  categories: createResourceClient<Category>("/products/categories"),
  colours: createResourceClient<Colour>("/products/colours"),
  sizes: createResourceClient<Size>("/products/sizes"),
  inventory: createResourceClient<InventoryItem>("/products/inventory"),
  pricing: createResourceClient<PricingRule>("/products/pricing"),

  uploadImages: (productId: string, files: File[]) =>
    uploadFiles(`/products/${productId}/images`, files),
};


export const orderClient = {
  orders: createResourceClient<Order>("/orders"),
  payments: createResourceClient<Payment>("/orders/payments"),
  invoices: createResourceClient<Invoice>("/orders/invoices"),
  refunds: createResourceClient<Refund>("/orders/refunds"),
};


export const appointmentClient = {
  appointments: createResourceClient<Appointment>("/appointments"),
  availability: createResourceClient<Availability>("/appointments/availability"),
  consultants: createResourceClient<Consultant>("/appointments/consultants"),
  reminders: createResourceClient<Reminder>("/appointments/reminders"),

 
  getSlots: (params: { date: string; consultantId?: string }) =>
    axiosInstance
      .get<ApiResponse<TimeSlot[]>>("/appointments/slots", { params })
      .then((r) => r.data),
};


export const customerClient = {
  customers: createResourceClient<Customer>("/customers"),
  reviews: createResourceClient<Review>("/customers/reviews"),
  support: createResourceClient<SupportTicket>("/customers/support"),
  loyalty: createResourceClient<LoyaltyAccount>("/customers/loyalty"),
};


export const contentClient = {
  blogs: createResourceClient<BlogPost>("/content/blogs"),
  mediaWall: createResourceClient<MediaWallItem>("/content/media-wall"),
  cmsPages: createResourceClient<CmsPage>("/content/cms"),
  seo: createResourceClient<SeoMeta>("/content/seo"),
  landingPages: createResourceClient<LandingPage>("/content/landing-pages"),

  uploadMedia: (files: File[], meta?: Record<string, string>) =>
    uploadFiles("/content/media-wall/upload", files, meta),
};


export const notificationClient = {
  notifications: createResourceClient<Notification>("/notifications"),
  email: createResourceClient<EmailLog>("/notifications/email"),
  sms: createResourceClient<SmsLog>("/notifications/sms"),
  push: createResourceClient<PushLog>("/notifications/push"),
  templates: createResourceClient<NotificationTemplate>("/notifications/templates"),
};


export const analyticsClient = {
  overview: (params?: Record<string, unknown>) =>
    axiosInstance
      .get<ApiResponse<AnalyticsOverview>>("/analytics", { params })
      .then((r) => r.data),

  tracking: createResourceClient<TrackingEvent>("/analytics/tracking"),
  funnels: createResourceClient<Funnel>("/analytics/funnels"),
  dashboards: createResourceClient<AnalyticsDashboard>("/analytics/dashboards"),

  export: (params: { startDate: string; endDate: string; format: "csv" | "xlsx" | "json" }) =>
    axiosInstance
      .get("/analytics/exports", { params, responseType: "blob" })
      .then((r) => r.data as Blob),
};




export type AdminUser = {
  id: string;
  name: string;
  email: string;
  role: string;
  createdAt: string;
};

export type Role = {
  id: string;
  name: string;
  permissions: string[];
};

export type Session = {
  id: string;
  userId: string;
  ip: string;
  userAgent: string;
  createdAt: string;
  expiresAt: string;
};

export type Product = {
  id: string;
  title: string;
  description: string;
  category: "kitchen" | "bedroom";
  rangeName: string;
  images: string[];
  price?: number;
  colours: Colour[];
  sizes: Size[];
  createdAt: string;
};

export type Category = { id: string; name: string; type: "kitchen" | "bedroom" };
export type Colour = { id: string; name: string; hexCode: string };
export type Size = { id: string; image: string; title: string; description: string };
export type InventoryItem = { id: string; productId: string; quantity: number; sku: string };
export type PricingRule = { id: string; productId: string; price: number; label: string };

export type Order = {
  id: string;
  customerId: string;
  status: string;
  total: number;
  createdAt: string;
};

export type Payment = { id: string; orderId: string; amount: number; status: string };
export type Invoice = { id: string; orderId: string; url: string; issuedAt: string };
export type Refund = { id: string; orderId: string; amount: number; reason: string };

export type Appointment = {
  id: string;
  type: "home" | "online" | "showroom";
  forKitchen: boolean;
  forBedroom: boolean;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  postcode: string;
  address: string;
  slot: string;
  status: string;
  createdAt: string;
};

export type Availability = { id: string; consultantId: string; date: string; slots: string[] };
export type TimeSlot = { id: string; time: string; available: boolean };
export type Consultant = { id: string; name: string; email: string; speciality: string };
export type Reminder = { id: string; appointmentId: string; sentAt: string; type: string };

export type Customer = {
  id: string;
  name: string;
  email: string;
  phone: string;
  postcode: string;
  address: string;
  loyaltyPoints: number;
  createdAt: string;
};

export type Review = { id: string; customerId: string; rating: number; content: string; status: string };
export type SupportTicket = { id: string; customerId: string; subject: string; status: string };
export type LoyaltyAccount = { id: string; customerId: string; points: number; tier: string };

export type BlogPost = { id: string; title: string; slug: string; content: string; image: string; publishedAt: string };
export type MediaWallItem = { id: string; title: string; description: string; mediaUrl: string; backgroundImage: string; type: "image" | "video" };
export type CmsPage = { id: string; slug: string; title: string; content: string };
export type SeoMeta = { id: string; pageSlug: string; title: string; description: string; keywords: string[] };
export type LandingPage = { id: string; slug: string; title: string; sections: unknown[] };

export type Notification = { id: string; type: string; recipient: string; status: string; sentAt: string };
export type EmailLog = { id: string; to: string; subject: string; status: string; sentAt: string };
export type SmsLog = { id: string; to: string; body: string; status: string; sentAt: string };
export type PushLog = { id: string; token: string; title: string; status: string; sentAt: string };
export type NotificationTemplate = { id: string; name: string; channel: string; subject?: string; body: string };

export type AnalyticsOverview = {
  totalRevenue: number;
  totalOrders: number;
  totalAppointments: number;
  totalCustomers: number;
  revenueChart: { date: string; value: number }[];
};

export type TrackingEvent = { id: string; event: string; userId?: string; properties: Record<string, unknown> };
export type Funnel = { id: string; name: string; steps: string[]; conversionRate: number };
export type AnalyticsDashboard = { id: string; name: string; widgets: unknown[] };