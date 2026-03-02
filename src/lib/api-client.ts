import axios from "@/lib/axios";

function makeService(basePath: string) {
  return {
    getAll: (params?: Record<string, any>) =>
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

export function createLomashApiClient() {
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
    colours: makeService("/colours"),
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
      getByChannel: (channel: string, params?: Record<string, any>) =>
        axios.get(`/notifications/${channel}`, { params }).then((r) => r.data),
    },
    templates: makeService("/templates"),

    analytics: {
      get: (params?: Record<string, any>) =>
        axios.get("/analytics", { params }).then((r) => r.data),
      getOverview: (params?: Record<string, any>) =>
        axios.get("/analytics/overview", { params }).then((r) => r.data),
      getTracking: (params?: Record<string, any>) =>
        axios.get("/analytics/tracking", { params }).then((r) => r.data),
      getRevenue: (params?: Record<string, any>) =>
        axios.get("/analytics/revenue", { params }).then((r) => r.data),
      getOrders: (params?: Record<string, any>) =>
        axios.get("/analytics/orders", { params }).then((r) => r.data),
      getAppointments: (params?: Record<string, any>) =>
        axios.get("/analytics/appointments", { params }).then((r) => r.data),
      getCustomers: (params?: Record<string, any>) =>
        axios.get("/analytics/customers", { params }).then((r) => r.data),
    },
    funnels: makeService("/funnels"),
    dashboards: makeService("/dashboards"),
    exports: {
      getAll: (params?: Record<string, any>) =>
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

export type LomashApiClient = ReturnType<typeof createLomashApiClient>;