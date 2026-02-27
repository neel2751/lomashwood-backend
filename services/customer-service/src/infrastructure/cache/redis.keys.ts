const SERVICE_PREFIX = 'customer-service';

export const REDIS_KEYS = {
  customer: {
    byId: (id: string) => `${SERVICE_PREFIX}:customer:${id}`,
    byUserId: (userId: string) => `${SERVICE_PREFIX}:customer:user:${userId}`,
    byEmail: (email: string) => `${SERVICE_PREFIX}:customer:email:${email}`,
    list: (page: number, limit: number) =>
      `${SERVICE_PREFIX}:customers:page:${page}:limit:${limit}`,
    pattern: () => `${SERVICE_PREFIX}:customer:*`,
  },

  profile: {
    byCustomerId: (customerId: string) =>
      `${SERVICE_PREFIX}:profile:customer:${customerId}`,
    pattern: (customerId: string) =>
      `${SERVICE_PREFIX}:profile:customer:${customerId}*`,
  },

  address: {
    list: (customerId: string) =>
      `${SERVICE_PREFIX}:addresses:customer:${customerId}`,
    byId: (id: string) => `${SERVICE_PREFIX}:address:${id}`,
    default: (customerId: string) =>
      `${SERVICE_PREFIX}:address:default:customer:${customerId}`,
    pattern: (customerId: string) =>
      `${SERVICE_PREFIX}:address*:customer:${customerId}*`,
  },

  wishlist: {
    list: (customerId: string) =>
      `${SERVICE_PREFIX}:wishlists:customer:${customerId}`,
    byId: (id: string) => `${SERVICE_PREFIX}:wishlist:${id}`,
    items: (wishlistId: string) =>
      `${SERVICE_PREFIX}:wishlist:${wishlistId}:items`,
    pattern: (customerId: string) =>
      `${SERVICE_PREFIX}:wishlist*:customer:${customerId}*`,
  },

  review: {
    byProduct: (productId: string, page: number, limit: number) =>
      `${SERVICE_PREFIX}:reviews:product:${productId}:page:${page}:limit:${limit}`,
    byCustomer: (customerId: string) =>
      `${SERVICE_PREFIX}:reviews:customer:${customerId}`,
    byId: (id: string) => `${SERVICE_PREFIX}:review:${id}`,
    stats: (productId: string) =>
      `${SERVICE_PREFIX}:review:stats:product:${productId}`,
    pattern: (productId: string) =>
      `${SERVICE_PREFIX}:reviews:product:${productId}*`,
  },

  supportTicket: {
    byId: (id: string) => `${SERVICE_PREFIX}:ticket:${id}`,
    byCustomer: (customerId: string, page: number, limit: number) =>
      `${SERVICE_PREFIX}:tickets:customer:${customerId}:page:${page}:limit:${limit}`,
    messages: (ticketId: string) =>
      `${SERVICE_PREFIX}:ticket:${ticketId}:messages`,
    pattern: (customerId: string) =>
      `${SERVICE_PREFIX}:ticket*:customer:${customerId}*`,
  },

  loyalty: {
    account: (customerId: string) =>
      `${SERVICE_PREFIX}:loyalty:account:customer:${customerId}`,
    transactions: (customerId: string, page: number, limit: number) =>
      `${SERVICE_PREFIX}:loyalty:transactions:customer:${customerId}:page:${page}:limit:${limit}`,
    pattern: (customerId: string) =>
      `${SERVICE_PREFIX}:loyalty*:customer:${customerId}*`,
  },

  referral: {
    byCode: (code: string) => `${SERVICE_PREFIX}:referral:code:${code}`,
    byCustomer: (customerId: string) =>
      `${SERVICE_PREFIX}:referrals:customer:${customerId}`,
    pattern: (customerId: string) =>
      `${SERVICE_PREFIX}:referral*:customer:${customerId}*`,
  },

  notificationPreference: {
    byCustomerId: (customerId: string) =>
      `${SERVICE_PREFIX}:notification-pref:customer:${customerId}`,
  },

  rateLimit: {
    byIp: (ip: string, endpoint: string) =>
      `${SERVICE_PREFIX}:rate-limit:${endpoint}:${ip}`,
    byCustomer: (customerId: string, endpoint: string) =>
      `${SERVICE_PREFIX}:rate-limit:${endpoint}:customer:${customerId}`,
  },

  session: {
    byCustomerId: (customerId: string) =>
      `${SERVICE_PREFIX}:session:customer:${customerId}`,
  },
} as const;

export const REDIS_TTL = {
  CUSTOMER: 60 * 15,
  PROFILE: 60 * 15,
  ADDRESS_LIST: 60 * 10,
  WISHLIST: 60 * 10,
  REVIEW_LIST: 60 * 5,
  REVIEW_STATS: 60 * 30,
  TICKET: 60 * 5,
  TICKET_MESSAGES: 60 * 5,
  LOYALTY_ACCOUNT: 60 * 10,
  LOYALTY_TRANSACTIONS: 60 * 5,
  REFERRAL: 60 * 60,
  NOTIFICATION_PREF: 60 * 30,
  RATE_LIMIT: 60,
  SESSION: 60 * 60 * 24,
} as const;