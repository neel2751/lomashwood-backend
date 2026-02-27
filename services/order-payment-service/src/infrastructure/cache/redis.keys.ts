const SERVICE_PREFIX = 'order-payment';

const ns = (...parts: string[]): string =>
  [SERVICE_PREFIX, ...parts].join(':');

export const RedisKeys = {
  order: {
    byId: (orderId: string) => ns('order', orderId),
    status: (orderId: string) => ns('order', orderId, 'status'),
    lock: (orderId: string) => ns('order', orderId, 'lock'),
    eligibility: (orderId: string) => ns('order', orderId, 'refund-eligibility'),
    summary: (orderId: string) => ns('order', orderId, 'refund-summary'),
    list: (customerId: string) => ns('order', 'customer', customerId, 'list'),
    pattern: {
      all: () => ns('order', '*'),
      byCustomer: (customerId: string) => ns('order', 'customer', customerId, '*'),
    },
  },

  payment: {
    byId: (paymentId: string) => ns('payment', paymentId),
    byIntent: (intentId: string) => ns('payment', 'intent', intentId),
    lock: (paymentId: string) => ns('payment', paymentId, 'lock'),
    idempotency: (idempotencyKey: string) => ns('payment', 'idempotency', idempotencyKey),
    pattern: {
      all: () => ns('payment', '*'),
      byOrder: (orderId: string) => ns('payment', 'order', orderId, '*'),
    },
  },

  refund: {
    byId: (refundId: string) => ns('refund', refundId),
    lock: (refundId: string) => ns('refund', refundId, 'lock'),
    byOrder: (orderId: string) => ns('refund', 'order', orderId),
    statusBreakdown: () => ns('refund', 'status-breakdown'),
    eligibility: (orderId: string) => ns('refund', 'eligibility', orderId),
    retryQueue: () => ns('refund', 'retry-queue'),
    staleQueue: () => ns('refund', 'stale-queue'),
    pattern: {
      all: () => ns('refund', '*'),
      byOrder: (orderId: string) => ns('refund', 'order', orderId, '*'),
    },
  },

  invoice: {
    byId: (invoiceId: string) => ns('invoice', invoiceId),
    byOrder: (orderId: string) => ns('invoice', 'order', orderId),
    pattern: {
      all: () => ns('invoice', '*'),
    },
  },

  webhook: {
    idempotency: (eventId: string) => ns('webhook', 'idempotency', eventId),
    retryQueue: () => ns('webhook', 'retry-queue'),
    deadLetter: () => ns('webhook', 'dead-letter'),
    pattern: {
      all: () => ns('webhook', '*'),
    },
  },

  rateLimit: {
    ip: (ip: string, endpoint: string) => ns('rate-limit', 'ip', ip, endpoint),
    user: (userId: string, endpoint: string) => ns('rate-limit', 'user', userId, endpoint),
    global: (endpoint: string) => ns('rate-limit', 'global', endpoint),
  },

  session: {
    byToken: (token: string) => ns('session', 'token', token),
    byUser: (userId: string) => ns('session', 'user', userId),
  },

  lock: {
    orderCheckout: (orderId: string) => ns('lock', 'order-checkout', orderId),
    paymentIntent: (orderId: string) => ns('lock', 'payment-intent', orderId),
    refundCreate: (orderId: string) => ns('lock', 'refund-create', orderId),
    reconcileJob: () => ns('lock', 'job', 'reconcile-payments'),
    expireOrdersJob: () => ns('lock', 'job', 'expire-orders'),
    retryWebhooksJob: () => ns('lock', 'job', 'retry-failed-webhooks'),
    closeAbandonedJob: () => ns('lock', 'job', 'close-abandoned-checkouts'),
  },

  analytics: {
    revenueDaily: (date: string) => ns('analytics', 'revenue', 'daily', date),
    revenueMonthly: (yearMonth: string) => ns('analytics', 'revenue', 'monthly', yearMonth),
    orderCountDaily: (date: string) => ns('analytics', 'order-count', 'daily', date),
    refundCountDaily: (date: string) => ns('analytics', 'refund-count', 'daily', date),
    pattern: {
      all: () => ns('analytics', '*'),
    },
  },
} as const;

export const RedisTTL = {
  order: {
    detail: 300,
    status: 60,
    eligibility: 120,
    summary: 120,
    list: 60,
  },

  payment: {
    detail: 300,
    intent: 1800,
    idempotency: 86400,
  },

  refund: {
    detail: 300,
    byOrder: 120,
    statusBreakdown: 60,
    eligibility: 120,
  },

  invoice: {
    detail: 600,
  },

  webhook: {
    idempotency: 86400,
  },

  rateLimit: {
    default: 60,
    refundCreate: 900,
  },

  session: {
    token: 3600,
  },

  lock: {
    default: 30,
    checkout: 60,
    paymentIntent: 120,
    refundCreate: 30,
    job: 300,
  },

  analytics: {
    daily: 3600,
    monthly: 7200,
  },
} as const;