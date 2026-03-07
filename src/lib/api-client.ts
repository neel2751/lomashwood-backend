import axios from "@/lib/axios";

export type ApiResponse<T> = {
  data: T;
  message?: string;
  success: boolean;
};

export type PaginatedResponse<T> = {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
};

export type TrackingEvent = {
  id: string;
  event: string;
  userId?: string;
  sessionId?: string;
  properties?: Record<string, unknown>;
  createdAt: string;
};

export type AnalyticsOverview = {
  totalRevenue: number;
  totalOrders: number;
  totalCustomers: number;
  totalAppointments: number;
  revenueChange: number;
  ordersChange: number;
  customersChange: number;
  appointmentsChange: number;
};

export type Appointment = {
  id: string;
  customerId: string;
  consultantId?: string;
  status: string;
  slot: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
};

export type TimeSlot = {
  date: string;
  time: string;
  consultantId?: string;
  available: boolean;
};

type QueryParams = Record<string, unknown>;

function makeService(basePath: string) {
  return {
    getAll: (params?: QueryParams) =>
      axios.get(basePath, { params }).then((r) => r.data),

    getById: (id: string) =>
      axios.get(`${basePath}/${id}`).then((r) => r.data),

    create: (payload: unknown) =>
      axios.post(basePath, payload).then((r) => r.data),

    update: (id: string, payload: unknown) =>
      axios.patch(`${basePath}/${id}`, payload).then((r) => r.data),

    delete: (id: string) =>
      axios.delete(`${basePath}/${id}`).then((r) => r.data),
  };
}

export function createApiClient() {
  return {
    auth: {
      login: (payload: unknown) =>
        axios.post("/auth/login", payload).then((r) => r.data),
      logout: () =>
        axios.post("/auth/logout").then((r) => r.data),
      me: () =>
        axios.get("/auth/me").then((r) => r.data),
    },

    products: makeService("/products"),
    categories: makeService("/categories"),
    colors: makeService("/colors"),
    sizes: makeService("/sizes"),
    inventory: makeService("/inventory"),
    pricing: makeService("/pricing"),

    orders: makeService("/orders"),
    payments: makeService("/payments"),
    invoices: makeService("/invoices"),
    refunds: makeService("/refunds"),

    appointments: makeService("/appointments"),
    availability: makeService("/availability"),
    consultants: makeService("/consultants"),
    reminders: makeService("/reminders"),

    customers: makeService("/customers"),
    reviews: makeService("/reviews"),
    support: makeService("/support"),
    loyalty: {
      ...makeService("/loyalty"),
      adjust: (id: string, payload: unknown) =>
        axios.post(`/loyalty/${id}/adjust`, payload).then((r) => r.data),
    },

    content: makeService("/content"),
    blogs: makeService("/blogs"),
    media: {
      ...makeService("/media"),
      upload: (payload: unknown) =>
        axios.post("/media/upload", payload).then((r) => r.data),
    },
    cmsPages: makeService("/cms-pages"),
    seo: makeService("/seo"),
    landingPages: makeService("/landing-pages"),

    notifications: {
      ...makeService("/notifications"),
      getByChannel: (channel: string, params?: QueryParams) =>
        axios.get(`/notifications/${channel}`, { params }).then((r) => r.data),
    },
    templates: makeService("/templates"),

    analytics: {
      get: (params?: QueryParams) =>
        axios.get("/analytics", { params }).then((r) => r.data),
      getOverview: (params?: QueryParams): Promise<ApiResponse<AnalyticsOverview>> =>
        axios.get("/analytics/overview", { params }).then((r) => r.data),
      getTracking: (params?: QueryParams): Promise<PaginatedResponse<TrackingEvent>> =>
        axios.get("/analytics/tracking", { params }).then((r) => r.data),
      getRevenue: (params?: QueryParams) =>
        axios.get("/analytics/revenue", { params }).then((r) => r.data),
      getOrders: (params?: QueryParams) =>
        axios.get("/analytics/orders", { params }).then((r) => r.data),
      getAppointments: (params?: QueryParams) =>
        axios.get("/analytics/appointments", { params }).then((r) => r.data),
      getCustomers: (params?: QueryParams) =>
        axios.get("/analytics/customers", { params }).then((r) => r.data),
    },
    funnels: makeService("/funnels"),
    dashboards: makeService("/dashboards"),
    exports: {
      getAll: (params?: QueryParams) =>
        axios.get("/exports", { params }).then((r) => r.data),
      create: (payload: unknown) =>
        axios.post("/exports", payload).then((r) => r.data),
    },

    roles: makeService("/roles"),
    users: makeService("/users"),
    sessions: {
      ...makeService("/sessions"),
      revoke: (id: string) =>
        axios.post(`/sessions/${id}/revoke`).then((r) => r.data),
      revokeAll: (userId: string) =>
        axios.post(`/sessions/revoke-all`, { userId }).then((r) => r.data),
    },
  };
}

export type ApiClient = ReturnType<typeof createApiClient>;

export const apiClient = createApiClient();

export const analyticsClient = apiClient.analytics;
export const appointmentClient = apiClient.appointments;

export type NotificationTemplate = {
  id: string;
  name: string;
  channel: string;
  subject?: string;
  body: string;
  variables?: string[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export type SupportTicket = {
  id: string;
  customerId: string;
  subject: string;
  body: string;
  status: string;
  agentId?: string;
  createdAt: string;
  updatedAt: string;
};

export type Size = {
  id: string;
  title: string;
  value: string;
  createdAt: string;
  updatedAt: string;
};

export type SeoMeta = {
  id: string;
  pageSlug: string;
  title: string;
  description?: string;
  keywords?: string[];
  ogImage?: string;
  createdAt: string;
  updatedAt: string;
};

export type Review = {
  id: string;
  customerId: string;
  productId: string;
  rating: number;
  title?: string;
  body?: string;
  status: string;
  createdAt: string;
  updatedAt: string;
};

export type Reminder = {
  id: string;
  appointmentId: string;
  type: string;
  sentAt?: string;
  scheduledAt: string;
  status: string;
  createdAt: string;
  updatedAt: string;
};

export type PricingRule = {
  id: string;
  productId: string;
  name: string;
  type: string;
  value: number;
  startsAt?: string;
  endsAt?: string;
  createdAt: string;
  updatedAt: string;
};