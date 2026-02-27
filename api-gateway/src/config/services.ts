import { env } from './env';

export interface ServiceConfig {
  url: string;
  timeout: number;
  retryAttempts: number;
  retryDelay: number;
  circuitBreakerThreshold: number;
  circuitBreakerTimeout: number;
  healthCheckInterval: number;
  healthCheckPath: string;
}

export interface ServicesConfiguration {
  auth: ServiceConfig;
  product: ServiceConfig;
  orderPayment: ServiceConfig;
  appointment: ServiceConfig;
  content: ServiceConfig;
  customer: ServiceConfig;
  notification: ServiceConfig;
  analytics: ServiceConfig;
}

const createServiceConfig = (
  url: string,
  timeout: number,
  options?: Partial<ServiceConfig>
): ServiceConfig => ({
  url,
  timeout,
  retryAttempts: options?.retryAttempts || env.SERVICE_RETRY_ATTEMPTS,
  retryDelay: options?.retryDelay || env.SERVICE_RETRY_DELAY,
  circuitBreakerThreshold: options?.circuitBreakerThreshold || env.CIRCUIT_BREAKER_THRESHOLD,
  circuitBreakerTimeout: options?.circuitBreakerTimeout || env.CIRCUIT_BREAKER_TIMEOUT,
  healthCheckInterval: options?.healthCheckInterval || 30000,
  healthCheckPath: options?.healthCheckPath || '/health',
});

export const servicesConfig: ServicesConfiguration = {
  auth: createServiceConfig(
    env.AUTH_SERVICE_URL,
    env.AUTH_SERVICE_TIMEOUT,
    {
      retryAttempts: 2,
      circuitBreakerThreshold: 3,
    }
  ),

  product: createServiceConfig(
    env.PRODUCT_SERVICE_URL,
    env.PRODUCT_SERVICE_TIMEOUT,
    {
      retryAttempts: 3,
      circuitBreakerThreshold: 5,
    }
  ),

  orderPayment: createServiceConfig(
    env.ORDER_PAYMENT_SERVICE_URL,
    env.ORDER_PAYMENT_SERVICE_TIMEOUT,
    {
      retryAttempts: 2,
      circuitBreakerThreshold: 3,
      circuitBreakerTimeout: 120000,
    }
  ),

  appointment: createServiceConfig(
    env.APPOINTMENT_SERVICE_URL,
    env.APPOINTMENT_SERVICE_TIMEOUT,
    {
      retryAttempts: 3,
      circuitBreakerThreshold: 5,
    }
  ),

  content: createServiceConfig(
    env.CONTENT_SERVICE_URL,
    env.CONTENT_SERVICE_TIMEOUT,
    {
      retryAttempts: 3,
      circuitBreakerThreshold: 5,
    }
  ),

  customer: createServiceConfig(
    env.CUSTOMER_SERVICE_URL,
    env.CUSTOMER_SERVICE_TIMEOUT,
    {
      retryAttempts: 3,
      circuitBreakerThreshold: 5,
    }
  ),

  notification: createServiceConfig(
    env.NOTIFICATION_SERVICE_URL,
    env.NOTIFICATION_SERVICE_TIMEOUT,
    {
      retryAttempts: 2,
      circuitBreakerThreshold: 5,
    }
  ),

  analytics: createServiceConfig(
    env.ANALYTICS_SERVICE_URL,
    env.ANALYTICS_SERVICE_TIMEOUT,
    {
      retryAttempts: 2,
      circuitBreakerThreshold: 10,
    }
  ),
};

export const getServiceConfig = (serviceName: keyof ServicesConfiguration): ServiceConfig => {
  const config = servicesConfig[serviceName];
  if (!config) {
    throw new Error(`Service configuration not found for: ${serviceName}`);
  }
  return config;
};

export const getAllServiceUrls = (): Record<string, string> => {
  return Object.entries(servicesConfig).reduce((acc, [key, value]) => {
    acc[key] = value.url;
    return acc;
  }, {} as Record<string, string>);
};

export const getHealthCheckUrls = (): Record<string, string> => {
  return Object.entries(servicesConfig).reduce((acc, [key, value]) => {
    acc[key] = `${value.url}${value.healthCheckPath}`;
    return acc;
  }, {} as Record<string, string>);
};

export const serviceEndpoints = {
  auth: {
    register: '/auth/register',
    login: '/auth/login',
    logout: '/auth/logout',
    refresh: '/auth/refresh',
    me: '/auth/me',
    forgotPassword: '/auth/forgot-password',
    resetPassword: '/auth/reset-password',
    verifyEmail: '/auth/verify-email',
    changePassword: '/auth/change-password',
  },

  product: {
    list: '/products',
    detail: '/products/:id',
    create: '/products',
    update: '/products/:id',
    delete: '/products/:id',
    categories: '/categories',
    colours: '/colours',
    sizes: '/sizes',
    inventory: '/inventory',
    pricing: '/pricing',
  },

  orderPayment: {
    createOrder: '/orders',
    getOrder: '/orders/:id',
    updateOrder: '/orders/:id',
    cancelOrder: '/orders/:id/cancel',
    createPayment: '/payments/create-intent',
    confirmPayment: '/payments/:id/confirm',
    refundPayment: '/payments/:id/refund',
    webhooks: '/webhooks/stripe',
    invoices: '/invoices',
  },

  appointment: {
    checkAvailability: '/availability',
    createBooking: '/bookings',
    getBooking: '/bookings/:id',
    updateBooking: '/bookings/:id',
    cancelBooking: '/bookings/:id/cancel',
    rescheduleBooking: '/bookings/:id/reschedule',
    consultants: '/consultants',
    reminders: '/reminders',
  },

  content: {
    blogs: '/blogs',
    blogDetail: '/blogs/:slug',
    mediaWall: '/media-wall',
    pages: '/pages',
    pageDetail: '/pages/:slug',
    seo: '/seo',
    landingPages: '/landing-pages',
    faqs: '/faqs',
    testimonials: '/testimonials',
  },

  customer: {
    profile: '/profiles',
    updateProfile: '/profiles/:id',
    wishlist: '/wishlist',
    reviews: '/reviews',
    support: '/support',
    loyalty: '/loyalty',
  },

  notification: {
    sendEmail: '/email',
    sendSms: '/sms',
    sendPush: '/push',
    templates: '/templates',
    history: '/notifications',
  },

  analytics: {
    trackEvent: '/tracking/events',
    trackPageView: '/tracking/pageviews',
    getSessions: '/tracking/sessions',
    funnels: '/funnels',
    dashboards: '/dashboards',
    metrics: '/metrics',
    reports: '/reports',
    exports: '/exports',
  },
};

export const getServiceEndpoint = (
  serviceName: keyof typeof serviceEndpoints,
  endpointName: string,
  params?: Record<string, string>
): string => {
  const endpoints = serviceEndpoints[serviceName] as Record<string, string>;
  const endpoint = endpoints[endpointName];

  if (!endpoint) {
    throw new Error(`Endpoint not found: ${serviceName}.${endpointName}`);
  }

  if (params) {
    let processedEndpoint = endpoint;
    Object.entries(params).forEach(([key, value]) => {
      processedEndpoint = processedEndpoint.replace(`:${key}`, value);
    });
    return processedEndpoint;
  }

  return endpoint;
};

export const buildServiceUrl = (
  serviceName: keyof ServicesConfiguration,
  endpoint: string
): string => {
  const config = getServiceConfig(serviceName);
  return `${config.url}${endpoint}`;
};

const GATEWAY_USER_AGENT = 'API-Gateway/1.0';

export const serviceHeaders = {
  default: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'User-Agent': GATEWAY_USER_AGENT,
  },

  withAuth: (token: string) => ({
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'Authorization': `Bearer ${token}`,
    'User-Agent': GATEWAY_USER_AGENT,
  }),

  withApiKey: (apiKey: string) => ({
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'X-API-Key': apiKey,
    'User-Agent': GATEWAY_USER_AGENT,
  }),

  multipart: {
    'Content-Type': 'multipart/form-data',
    'Accept': 'application/json',
    'User-Agent': GATEWAY_USER_AGENT,
  },
};

export const serviceTimeouts = {
  default: env.REQUEST_TIMEOUT_MS,
  auth: env.AUTH_SERVICE_TIMEOUT,
  product: env.PRODUCT_SERVICE_TIMEOUT,
  orderPayment: env.ORDER_PAYMENT_SERVICE_TIMEOUT,
  appointment: env.APPOINTMENT_SERVICE_TIMEOUT,
  content: env.CONTENT_SERVICE_TIMEOUT,
  customer: env.CUSTOMER_SERVICE_TIMEOUT,
  notification: env.NOTIFICATION_SERVICE_TIMEOUT,
  analytics: env.ANALYTICS_SERVICE_TIMEOUT,
  upload: 60000,
  download: 120000,
  export: 180000,
};

export const servicePriorities = {
  critical: ['auth', 'orderPayment'],
  high: ['appointment', 'customer', 'product'],
  medium: ['content', 'notification'],
  low: ['analytics'],
};

export const isServiceCritical = (serviceName: string): boolean => {
  return servicePriorities.critical.includes(serviceName);
};

export const isServiceHighPriority = (serviceName: string): boolean => {
  return servicePriorities.high.includes(serviceName);
};

export const getServicePriority = (serviceName: string): 'critical' | 'high' | 'medium' | 'low' => {
  if (servicePriorities.critical.includes(serviceName)) return 'critical';
  if (servicePriorities.high.includes(serviceName)) return 'high';
  if (servicePriorities.medium.includes(serviceName)) return 'medium';
  return 'low';
};

export const config = {
  services: servicesConfig,
  endpoints: serviceEndpoints,
  headers: serviceHeaders,
  timeouts: serviceTimeouts,
  priorities: servicePriorities,
};