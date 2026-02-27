export const RedisKeys = {
  product: {
    byId: (id: string) => `product:id:${id}`,
    bySlug: (slug: string) => `product:slug:${slug}`,
    byCategoryId: (categoryId: string) => `product:category:${categoryId}`,
    list: (page: number, limit: number, filters: string) =>
      `product:list:${page}:${limit}:${filters}`,
    featured: () => `product:featured`,
    search: (query: string, page: number) => `product:search:${query}:${page}`,
    colours: (productId: string) => `product:colours:${productId}`,
    sizes: (productId: string) => `product:sizes:${productId}`,
  },

  pricing: {
    byId: (id: string) => `pricing:id:${id}`,
    byProductId: (productId: string) => `pricing:product:${productId}`,
    active: (productId: string, sizeId?: string) =>
      sizeId
        ? `pricing:active:${productId}:size:${sizeId}`
        : `pricing:active:${productId}`,
    estimate: (productId: string, sizeId?: string, quantity?: number) =>
      `pricing:estimate:${productId}:${sizeId ?? 'default'}:${quantity ?? 1}`,
    list: (page: number, limit: number, filters: string) =>
      `pricing:list:${page}:${limit}:${filters}`,
  },

  category: {
    byId: (id: string) => `category:id:${id}`,
    bySlug: (slug: string) => `category:slug:${slug}`,
    all: () => `category:all`,
    tree: () => `category:tree`,
  },

  colour: {
    byId: (id: string) => `colour:id:${id}`,
    all: () => `colour:all`,
    byProductId: (productId: string) => `colour:product:${productId}`,
  },

  sale: {
    byId: (id: string) => `sale:id:${id}`,
    active: () => `sale:active`,
    list: (page: number, limit: number) => `sale:list:${page}:${limit}`,
    byProductId: (productId: string) => `sale:product:${productId}`,
  },

  appointment: {
    byId: (id: string) => `appointment:id:${id}`,
    byCustomerId: (customerId: string) => `appointment:customer:${customerId}`,
    availability: (date: string, type: string) =>
      `appointment:availability:${date}:${type}`,
    slots: (date: string, showroomId?: string) =>
      showroomId
        ? `appointment:slots:${date}:showroom:${showroomId}`
        : `appointment:slots:${date}`,
    list: (page: number, limit: number, filters: string) =>
      `appointment:list:${page}:${limit}:${filters}`,
  },

  showroom: {
    byId: (id: string) => `showroom:id:${id}`,
    bySlug: (slug: string) => `showroom:slug:${slug}`,
    all: () => `showroom:all`,
    list: (page: number, limit: number) => `showroom:list:${page}:${limit}`,
    search: (query: string) => `showroom:search:${query}`,
  },

  blog: {
    byId: (id: string) => `blog:id:${id}`,
    bySlug: (slug: string) => `blog:slug:${slug}`,
    list: (page: number, limit: number, filters: string) =>
      `blog:list:${page}:${limit}:${filters}`,
    featured: () => `blog:featured`,
    byTag: (tag: string, page: number) => `blog:tag:${tag}:${page}`,
  },

  page: {
    bySlug: (slug: string) => `page:slug:${slug}`,
    finance: () => `page:finance`,
    about: () => `page:about`,
    process: () => `page:process`,
    whyChoose: () => `page:why-choose`,
    contact: () => `page:contact`,
  },

  mediaWall: {
    all: () => `media-wall:all`,
    byId: (id: string) => `media-wall:id:${id}`,
  },

  review: {
    all: () => `review:all`,
    featured: () => `review:featured`,
    list: (page: number, limit: number) => `review:list:${page}:${limit}`,
  },

  user: {
    byId: (id: string) => `user:id:${id}`,
    byEmail: (email: string) => `user:email:${email}`,
    session: (sessionId: string) => `user:session:${sessionId}`,
    bookings: (userId: string) => `user:bookings:${userId}`,
    inquiries: (userId: string) => `user:inquiries:${userId}`,
  },

  auth: {
    refreshToken: (userId: string) => `auth:refresh:${userId}`,
    resetToken: (token: string) => `auth:reset:${token}`,
    verifyToken: (token: string) => `auth:verify:${token}`,
    rateLimitLogin: (ip: string) => `auth:rate:login:${ip}`,
    rateLimitRegister: (ip: string) => `auth:rate:register:${ip}`,
  },

  rateLimit: {
    byIp: (ip: string, route: string) => `rate:ip:${ip}:${route}`,
    byUserId: (userId: string, route: string) => `rate:user:${userId}:${route}`,
    global: (route: string) => `rate:global:${route}`,
  },

  sitemap: {
    index: () => `sitemap:index`,
    products: (page: number) => `sitemap:products:${page}`,
    blog: (page: number) => `sitemap:blog:${page}`,
    showrooms: () => `sitemap:showrooms`,
  },

  analytics: {
    pageViews: (slug: string) => `analytics:views:${slug}`,
    productViews: (productId: string) => `analytics:product:views:${productId}`,
    topProducts: (period: string) => `analytics:top:products:${period}`,
    appointmentStats: (period: string) => `analytics:appointments:${period}`,
  },

  health: {
    db: () => `health:db`,
    redis: () => `health:redis`,
    overall: () => `health:overall`,
  },
} as const;

export const RedisTTL = {
  FIVE_SECONDS: 5,
  THIRTY_SECONDS: 30,
  ONE_MINUTE: 60,
  FIVE_MINUTES: 300,
  FIFTEEN_MINUTES: 900,
  THIRTY_MINUTES: 1800,
  ONE_HOUR: 3600,
  THREE_HOURS: 10800,
  SIX_HOURS: 21600,
  TWELVE_HOURS: 43200,
  ONE_DAY: 86400,
  THREE_DAYS: 259200,
  ONE_WEEK: 604800,
  ONE_MONTH: 2592000,
} as const;

export const RedisPatterns = {
  allProducts: () => `product:*`,
  allPricing: () => `pricing:*`,
  allCategories: () => `category:*`,
  allColours: () => `colour:*`,
  allSales: () => `sale:*`,
  allAppointments: () => `appointment:*`,
  allShowrooms: () => `showroom:*`,
  allBlog: () => `blog:*`,
  allPages: () => `page:*`,
  allMediaWall: () => `media-wall:*`,
  allReviews: () => `review:*`,
  allUsers: () => `user:*`,
  allAuth: () => `auth:*`,
  allSitemap: () => `sitemap:*`,
  allAnalytics: () => `analytics:*`,
  productById: (id: string) => `product:id:${id}*`,
  pricingByProduct: (productId: string) => `pricing:*:${productId}*`,
  appointmentsByDate: (date: string) => `appointment:*:${date}*`,
} as const;