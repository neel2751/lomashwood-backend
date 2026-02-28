export const apiConfig = {
  baseUrl: process.env.NEXT_PUBLIC_API_BASE_URL ?? "https://api.lomashwood.com/v1",
  timeoutMs: 15_000,
  version: "v1",

  services: {
    auth: {
      baseUrl: process.env.NEXT_PUBLIC_AUTH_SERVICE_URL ?? "https://api.lomashwood.com/v1",
      paths: {
        login: "/auth/login",
        logout: "/auth/logout",
        refresh: "/auth/refresh",
        me: "/auth/me",
        users: "/auth/users",
        roles: "/auth/roles",
        sessions: "/auth/sessions",
      },
    },
    product: {
      baseUrl: process.env.NEXT_PUBLIC_PRODUCT_SERVICE_URL ?? "https://api.lomashwood.com/v1",
      paths: {
        products: "/products",
        categories: "/products/categories",
        colours: "/products/colours",
        sizes: "/products/sizes",
        inventory: "/products/inventory",
        pricing: "/products/pricing",
      },
    },
    order: {
      baseUrl: process.env.NEXT_PUBLIC_ORDER_SERVICE_URL ?? "https://api.lomashwood.com/v1",
      paths: {
        orders: "/orders",
        payments: "/orders/payments",
        invoices: "/orders/invoices",
        refunds: "/orders/refunds",
      },
    },
    appointment: {
      baseUrl: process.env.NEXT_PUBLIC_APPOINTMENT_SERVICE_URL ?? "https://api.lomashwood.com/v1",
      paths: {
        appointments: "/appointments",
        availability: "/appointments/availability",
        consultants: "/appointments/consultants",
        reminders: "/appointments/reminders",
        slots: "/appointments/slots",
      },
    },
    customer: {
      baseUrl: process.env.NEXT_PUBLIC_CUSTOMER_SERVICE_URL ?? "https://api.lomashwood.com/v1",
      paths: {
        customers: "/customers",
        reviews: "/customers/reviews",
        support: "/customers/support",
        loyalty: "/customers/loyalty",
      },
    },
    content: {
      baseUrl: process.env.NEXT_PUBLIC_CONTENT_SERVICE_URL ?? "https://api.lomashwood.com/v1",
      paths: {
        blogs: "/content/blogs",
        mediaWall: "/content/media-wall",
        cms: "/content/cms",
        seo: "/content/seo",
        landingPages: "/content/landing-pages",
      },
    },
    notification: {
      baseUrl: process.env.NEXT_PUBLIC_NOTIFICATION_SERVICE_URL ?? "https://api.lomashwood.com/v1",
      paths: {
        notifications: "/notifications",
        email: "/notifications/email",
        sms: "/notifications/sms",
        push: "/notifications/push",
        templates: "/notifications/templates",
        stats: "/notifications/stats",
      },
    },
    analytics: {
      baseUrl: process.env.NEXT_PUBLIC_ANALYTICS_SERVICE_URL ?? "https://api.lomashwood.com/v1",
      paths: {
        overview: "/analytics",
        tracking: "/analytics/tracking",
        funnels: "/analytics/funnels",
        dashboards: "/analytics/dashboards",
        exports: "/analytics/exports",
        revenue: "/analytics/revenue",
        orders: "/analytics/orders",
        appointments: "/analytics/appointments",
        customers: "/analytics/customers",
        topProducts: "/analytics/top-products",
        cohorts: "/analytics/cohorts",
      },
    },
  },

  bff: {
    basePath: "/api",
    paths: {
      auth: {
        login: "/api/auth/login",
        logout: "/api/auth/logout",
      },
      products: "/api/products",
      orders: "/api/orders",
      appointments: "/api/appointments",
      customers: "/api/customers",
      content: "/api/content",
      notifications: "/api/notifications",
      analytics: "/api/analytics",
    },
  },

  upload: {
    maxFileSizeBytes: 10 * 1024 * 1024,
    maxProductImages: 10,
    acceptedImageTypes: ["image/jpeg", "image/png", "image/webp", "image/gif"],
    acceptedVideoTypes: ["video/mp4", "video/webm"],
    paths: {
      productImages: (productId: string) => `/products/${productId}/images`,
      mediaWall: "/content/media-wall/upload",
      blogImages: "/content/blogs/upload",
      landingPageAssets: "/content/landing-pages/upload",
    },
  },

  pagination: {
    defaultPageSize: 20,
    pageSizeOptions: [10, 20, 50, 100] as number[],
    maxPageSize: 100,
  },

  cache: {
    staleTimeMs: 60_000,
    gcTimeMs: 5 * 60_000,
    maxRetries: 2,
  },

  export: {
    formats: ["csv", "xlsx", "json"] as const,
    maxDateRangeDays: 366,
    paths: {
      orders: "/orders/export",
      products: "/products/export",
      customers: "/customers/export",
      appointments: "/appointments/export",
      payments: "/orders/payments/export",
      refunds: "/orders/refunds/export",
      inventory: "/products/inventory/export",
      analytics: "/analytics/exports",
    },
  },

  webhooks: {
    secret: process.env.WEBHOOK_SECRET ?? "",
    events: {
      orderCreated: "order.created",
      orderUpdated: "order.updated",
      appointmentBooked: "appointment.booked",
      appointmentCancelled: "appointment.cancelled",
      paymentReceived: "payment.received",
      refundIssued: "refund.issued",
    },
  },

  integrations: {
    gtm: {
      id: process.env.NEXT_PUBLIC_GTM_ID ?? "",
      enabled: Boolean(process.env.NEXT_PUBLIC_GTM_ID),
    },
    googleSearchConsole: {
      verificationId: process.env.NEXT_PUBLIC_GSC_VERIFICATION ?? "",
    },
    googleAnalytics: {
      measurementId: process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID ?? "",
      enabled: Boolean(process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID),
    },
  },
} as const;

export function getServiceBaseUrl(
  service: keyof typeof apiConfig.services,
): string {
  return apiConfig.services[service].baseUrl;
}

export function getServicePath(
  service: keyof typeof apiConfig.services,
  path: string,
): string {
  return `${getServiceBaseUrl(service)}${path}`;
}

export function isUploadAllowed(file: File): boolean {
  const { acceptedImageTypes, acceptedVideoTypes, maxFileSizeBytes } = apiConfig.upload;
  const allowedTypes = [...acceptedImageTypes, ...acceptedVideoTypes];
  return file.size <= maxFileSizeBytes && allowedTypes.includes(file.type);
}