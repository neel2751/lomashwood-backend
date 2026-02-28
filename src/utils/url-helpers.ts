import { toSearchParams, fromSearchParams } from "@/lib/utils";

export { toSearchParams, fromSearchParams };

export const ROUTES = {
  root: "/",
  login: "/login",
  forgotPassword: "/forgot-password",
  resetPassword: "/reset-password",

  dashboard: "/",

  analytics: {
    root: "/analytics",
    tracking: "/analytics/tracking",
    funnels: "/analytics/funnels",
    funnelNew: "/analytics/funnels/new",
    funnelDetail: (id: string) => `/analytics/funnels/${id}`,
    dashboards: "/analytics/dashboards",
    dashboardNew: "/analytics/dashboards/new",
    dashboardDetail: (id: string) => `/analytics/dashboards/${id}`,
    exports: "/analytics/exports",
  },

  products: {
    root: "/products",
    new: "/products/new",
    detail: (id: string) => `/products/${id}`,
    categories: "/products/categories",
    categoryNew: "/products/categories/new",
    categoryDetail: (id: string) => `/products/categories/${id}`,
    colours: "/products/colours",
    colourNew: "/products/colours/new",
    colourDetail: (id: string) => `/products/colours/${id}`,
    sizes: "/products/sizes",
    sizeNew: "/products/sizes/new",
    sizeDetail: (id: string) => `/products/sizes/${id}`,
    inventory: "/products/inventory",
    inventoryDetail: (id: string) => `/products/inventory/${id}`,
    pricing: "/products/pricing",
    pricingNew: "/products/pricing/new",
    pricingDetail: (id: string) => `/products/pricing/${id}`,
  },

  orders: {
    root: "/orders",
    detail: (id: string) => `/orders/${id}`,
    payments: "/orders/payments",
    paymentDetail: (id: string) => `/orders/payments/${id}`,
    invoices: "/orders/invoices",
    invoiceDetail: (id: string) => `/orders/invoices/${id}`,
    refunds: "/orders/refunds",
    refundNew: "/orders/refunds/new",
    refundDetail: (id: string) => `/orders/refunds/${id}`,
  },

  appointments: {
    root: "/appointments",
    detail: (id: string) => `/appointments/${id}`,
    availability: "/appointments/availability",
    consultants: "/appointments/consultants",
    consultantNew: "/appointments/consultants/new",
    consultantDetail: (id: string) => `/appointments/consultants/${id}`,
    reminders: "/appointments/reminders",
    reminderDetail: (id: string) => `/appointments/reminders/${id}`,
  },

  customers: {
    root: "/customers",
    detail: (id: string) => `/customers/${id}`,
    reviews: "/customers/reviews",
    reviewDetail: (id: string) => `/customers/reviews/${id}`,
    support: "/customers/support",
    supportDetail: (id: string) => `/customers/support/${id}`,
    loyalty: "/customers/loyalty",
    loyaltyDetail: (id: string) => `/customers/loyalty/${id}`,
  },

  content: {
    root: "/content",
    blogs: "/content/blogs",
    blogNew: "/content/blogs/new",
    blogDetail: (id: string) => `/content/blogs/${id}`,
    mediaWall: "/content/media-wall",
    mediaWallDetail: (id: string) => `/content/media-wall/${id}`,
    cms: "/content/cms",
    cmsNew: "/content/cms/new",
    cmsDetail: (id: string) => `/content/cms/${id}`,
    seo: "/content/seo",
    seoDetail: (id: string) => `/content/seo/${id}`,
    landingPages: "/content/landing-pages",
    landingPageNew: "/content/landing-pages/new",
    landingPageDetail: (id: string) => `/content/landing-pages/${id}`,
  },

  notifications: {
    root: "/notifications",
    email: "/notifications/email",
    emailDetail: (id: string) => `/notifications/email/${id}`,
    sms: "/notifications/sms",
    smsDetail: (id: string) => `/notifications/sms/${id}`,
    push: "/notifications/push",
    pushDetail: (id: string) => `/notifications/push/${id}`,
    templates: "/notifications/templates",
    templateNew: "/notifications/templates/new",
    templateDetail: (id: string) => `/notifications/templates/${id}`,
  },

  auth: {
    root: "/auth",
    users: "/auth/users",
    userNew: "/auth/users/new",
    userDetail: (id: string) => `/auth/users/${id}`,
    roles: "/auth/roles",
    roleNew: "/auth/roles/new",
    roleDetail: (id: string) => `/auth/roles/${id}`,
    sessions: "/auth/sessions",
    sessionDetail: (id: string) => `/auth/sessions/${id}`,
  },

  settings: {
    root: "/settings",
    general: "/settings/general",
    security: "/settings/security",
    integrations: "/settings/integrations",
    auditLogs: "/settings/audit-logs",
  },
} as const;

export function withParams(
  path: string,
  params: Record<string, string | number | boolean | null | undefined>,
): string {
  const query = toSearchParams(params);
  return `${path}${query}`;
}

export function withPage(path: string, page: number, limit?: number): string {
  return withParams(path, { page, ...(limit ? { limit } : {}) });
}

export function withSearch(path: string, search: string): string {
  return withParams(path, { search: search || undefined });
}

export function withFilters(
  path: string,
  filters: Record<string, string | number | boolean | null | undefined>,
): string {
  return withParams(path, filters);
}

export function getReturnUrl(searchParams: URLSearchParams): string {
  const returnUrl = searchParams.get("returnUrl");
  if (!returnUrl) return ROUTES.dashboard;
  if (!returnUrl.startsWith("/")) return ROUTES.dashboard;
  return returnUrl;
}

export function buildReturnUrl(currentPath: string): string {
  return `${ROUTES.login}?returnUrl=${encodeURIComponent(currentPath)}`;
}

export function isActiveRoute(pathname: string, href: string): boolean {
  if (href === "/") return pathname === "/";
  return pathname.startsWith(href);
}

export function isExactRoute(pathname: string, href: string): boolean {
  return pathname === href;
}

export function stripTrailingSlash(path: string): string {
  return path.endsWith("/") && path.length > 1 ? path.slice(0, -1) : path;
}

export function getParentRoute(pathname: string): string {
  const segments = pathname.split("/").filter(Boolean);
  if (segments.length <= 1) return "/";
  return "/" + segments.slice(0, -1).join("/");
}

export function isDetailRoute(pathname: string): boolean {
  const segments = pathname.split("/").filter(Boolean);
  const lastSegment = segments[segments.length - 1];
  return (
    /^[0-9a-f-]{36}$/.test(lastSegment) ||
    /^\d+$/.test(lastSegment)
  );
}

export function extractIdFromPath(pathname: string): string | null {
  const segments = pathname.split("/").filter(Boolean);
  const last = segments[segments.length - 1];
  if (/^[0-9a-f-]{36}$/.test(last) || /^\d+$/.test(last)) {
    return last;
  }
  return null;
}