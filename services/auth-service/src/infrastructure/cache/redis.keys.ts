export class RedisKeys {
  private static readonly PREFIX = 'lomash_wood';
  private static readonly SEPARATOR = ':';

  private static buildKey(parts: string[]): string {
    return [this.PREFIX, ...parts].join(this.SEPARATOR);
  }

  static auth = {
    session: (sessionId: string) => this.buildKey(['auth', 'session', sessionId]),
    user: (userId: string) => this.buildKey(['auth', 'user', userId]),
    token: (token: string) => this.buildKey(['auth', 'token', token]),
    refreshToken: (token: string) => this.buildKey(['auth', 'refresh', token]),
    blacklist: (token: string) => this.buildKey(['auth', 'blacklist', token]),
    otp: (identifier: string) => this.buildKey(['auth', 'otp', identifier]),
    passwordReset: (token: string) => this.buildKey(['auth', 'password_reset', token]),
    emailVerification: (token: string) => this.buildKey(['auth', 'email_verify', token]),
    loginAttempts: (identifier: string) => this.buildKey(['auth', 'login_attempts', identifier]),
    twoFactor: (userId: string) => this.buildKey(['auth', '2fa', userId]),
  };

  static user = {
    profile: (userId: string) => this.buildKey(['user', 'profile', userId]),
    preferences: (userId: string) => this.buildKey(['user', 'preferences', userId]),
    permissions: (userId: string) => this.buildKey(['user', 'permissions', userId]),
    roles: (userId: string) => this.buildKey(['user', 'roles', userId]),
    activity: (userId: string) => this.buildKey(['user', 'activity', userId]),
    settings: (userId: string) => this.buildKey(['user', 'settings', userId]),
  };

  static product = {
    detail: (productId: string) => this.buildKey(['product', 'detail', productId]),
    list: (category: string, page: number) => this.buildKey(['product', 'list', category, String(page)]),
    search: (query: string, page: number) => this.buildKey(['product', 'search', query, String(page)]),
    featured: () => this.buildKey(['product', 'featured']),
    trending: () => this.buildKey(['product', 'trending']),
    new: () => this.buildKey(['product', 'new']),
    bestsellers: () => this.buildKey(['product', 'bestsellers']),
    related: (productId: string) => this.buildKey(['product', 'related', productId]),
    reviews: (productId: string) => this.buildKey(['product', 'reviews', productId]),
    rating: (productId: string) => this.buildKey(['product', 'rating', productId]),
    inventory: (productId: string) => this.buildKey(['product', 'inventory', productId]),
    price: (productId: string) => this.buildKey(['product', 'price', productId]),
  };

  static category = {
    detail: (categoryId: string) => this.buildKey(['category', 'detail', categoryId]),
    list: () => this.buildKey(['category', 'list']),
    tree: () => this.buildKey(['category', 'tree']),
    products: (categoryId: string) => this.buildKey(['category', 'products', categoryId]),
  };

  static colour = {
    detail: (colourId: string) => this.buildKey(['colour', 'detail', colourId]),
    list: () => this.buildKey(['colour', 'list']),
    products: (colourId: string) => this.buildKey(['colour', 'products', colourId]),
  };

  static order = {
    detail: (orderId: string) => this.buildKey(['order', 'detail', orderId]),
    user: (userId: string) => this.buildKey(['order', 'user', userId]),
    status: (orderId: string) => this.buildKey(['order', 'status', orderId]),
    cart: (sessionId: string) => this.buildKey(['order', 'cart', sessionId]),
    checkout: (sessionId: string) => this.buildKey(['order', 'checkout', sessionId]),
    invoice: (orderId: string) => this.buildKey(['order', 'invoice', orderId]),
    tracking: (orderId: string) => this.buildKey(['order', 'tracking', orderId]),
  };

  static payment = {
    intent: (intentId: string) => this.buildKey(['payment', 'intent', intentId]),
    transaction: (transactionId: string) => this.buildKey(['payment', 'transaction', transactionId]),
    status: (paymentId: string) => this.buildKey(['payment', 'status', paymentId]),
    webhook: (webhookId: string) => this.buildKey(['payment', 'webhook', webhookId]),
    refund: (refundId: string) => this.buildKey(['payment', 'refund', refundId]),
  };

  static appointment = {
    detail: (appointmentId: string) => this.buildKey(['appointment', 'detail', appointmentId]),
    user: (userId: string) => this.buildKey(['appointment', 'user', userId]),
    availability: (consultantId: string, date: string) =>
      this.buildKey(['appointment', 'availability', consultantId, date]),
    slots: (date: string) => this.buildKey(['appointment', 'slots', date]),
    reminders: (appointmentId: string) => this.buildKey(['appointment', 'reminders', appointmentId]),
    consultant: (consultantId: string) => this.buildKey(['appointment', 'consultant', consultantId]),
  };

  static showroom = {
    detail: (showroomId: string) => this.buildKey(['showroom', 'detail', showroomId]),
    list: () => this.buildKey(['showroom', 'list']),
    location: (latitude: string, longitude: string) =>
      this.buildKey(['showroom', 'location', latitude, longitude]),
    hours: (showroomId: string) => this.buildKey(['showroom', 'hours', showroomId]),
  };

  static content = {
    blog: (slug: string) => this.buildKey(['content', 'blog', slug]),
    blogList: (page: number) => this.buildKey(['content', 'blog_list', String(page)]),
    page: (slug: string) => this.buildKey(['content', 'page', slug]),
    mediaWall: () => this.buildKey(['content', 'media_wall']),
    finance: () => this.buildKey(['content', 'finance']),
    faq: () => this.buildKey(['content', 'faq']),
    testimonials: () => this.buildKey(['content', 'testimonials']),
    carousel: (location: string) => this.buildKey(['content', 'carousel', location]),
  };

  static sale = {
    detail: (saleId: string) => this.buildKey(['sale', 'detail', saleId]),
    list: () => this.buildKey(['sale', 'list']),
    active: () => this.buildKey(['sale', 'active']),
    products: (saleId: string) => this.buildKey(['sale', 'products', saleId]),
  };

  static package = {
    detail: (packageId: string) => this.buildKey(['package', 'detail', packageId]),
    list: () => this.buildKey(['package', 'list']),
    products: (packageId: string) => this.buildKey(['package', 'products', packageId]),
  };

  static customer = {
    profile: (customerId: string) => this.buildKey(['customer', 'profile', customerId]),
    wishlist: (customerId: string) => this.buildKey(['customer', 'wishlist', customerId]),
    addresses: (customerId: string) => this.buildKey(['customer', 'addresses', customerId]),
    reviews: (customerId: string) => this.buildKey(['customer', 'reviews', customerId]),
    loyalty: (customerId: string) => this.buildKey(['customer', 'loyalty', customerId]),
    preferences: (customerId: string) => this.buildKey(['customer', 'preferences', customerId]),
  };

  static notification = {
    user: (userId: string) => this.buildKey(['notification', 'user', userId]),
    unread: (userId: string) => this.buildKey(['notification', 'unread', userId]),
    email: (emailId: string) => this.buildKey(['notification', 'email', emailId]),
    sms: (smsId: string) => this.buildKey(['notification', 'sms', smsId]),
    push: (pushId: string) => this.buildKey(['notification', 'push', pushId]),
    template: (templateId: string) => this.buildKey(['notification', 'template', templateId]),
  };

  static analytics = {
    pageView: (pageId: string, date: string) => this.buildKey(['analytics', 'page_view', pageId, date]),
    event: (eventName: string, date: string) => this.buildKey(['analytics', 'event', eventName, date]),
    conversion: (type: string, date: string) => this.buildKey(['analytics', 'conversion', type, date]),
    funnel: (funnelId: string) => this.buildKey(['analytics', 'funnel', funnelId]),
    dashboard: (dashboardId: string) => this.buildKey(['analytics', 'dashboard', dashboardId]),
  };

  static cache = {
    api: (endpoint: string, params: string) => this.buildKey(['cache', 'api', endpoint, params]),
    query: (queryHash: string) => this.buildKey(['cache', 'query', queryHash]),
    html: (path: string) => this.buildKey(['cache', 'html', path]),
    image: (imageId: string) => this.buildKey(['cache', 'image', imageId]),
  };

  static rateLimit = {
    global: (identifier: string) => this.buildKey(['rate_limit', 'global', identifier]),
    endpoint: (identifier: string, endpoint: string) => this.buildKey(['rate_limit', 'endpoint', identifier, endpoint]),
    login: (identifier: string) => this.buildKey(['rate_limit', 'login', identifier]),
    api: (identifier: string) => this.buildKey(['rate_limit', 'api', identifier]),
  };

  static queue = {
    job: (jobId: string) => this.buildKey(['queue', 'job', jobId]),
    pending: (queueName: string) => this.buildKey(['queue', 'pending', queueName]),
    processing: (queueName: string) => this.buildKey(['queue', 'processing', queueName]),
    completed: (queueName: string) => this.buildKey(['queue', 'completed', queueName]),
    failed: (queueName: string) => this.buildKey(['queue', 'failed', queueName]),
  };

  static lock = {
    resource: (resourceId: string) => this.buildKey(['lock', 'resource', resourceId]),
    process: (processId: string) => this.buildKey(['lock', 'process', processId]),
    distributed: (lockName: string) => this.buildKey(['lock', 'distributed', lockName]),
  };

  static search = {
    index: (indexName: string) => this.buildKey(['search', 'index', indexName]),
    query: (query: string) => this.buildKey(['search', 'query', query]),
    suggestions: (prefix: string) => this.buildKey(['search', 'suggestions', prefix]),
    history: (userId: string) => this.buildKey(['search', 'history', userId]),
  };

  static metrics = {
    counter: (name: string) => this.buildKey(['metrics', 'counter', name]),
    gauge: (name: string) => this.buildKey(['metrics', 'gauge', name]),
    histogram: (name: string) => this.buildKey(['metrics', 'histogram', name]),
  };

  static temporary = {
    data: (key: string) => this.buildKey(['temp', 'data', key]),
    upload: (uploadId: string) => this.buildKey(['temp', 'upload', uploadId]),
    session: (sessionId: string) => this.buildKey(['temp', 'session', sessionId]),
  };

  static pattern = {
    all: () => `${this.PREFIX}${this.SEPARATOR}*`,
    auth: () => `${this.PREFIX}${this.SEPARATOR}auth${this.SEPARATOR}*`,
    product: () => `${this.PREFIX}${this.SEPARATOR}product${this.SEPARATOR}*`,
    order: () => `${this.PREFIX}${this.SEPARATOR}order${this.SEPARATOR}*`,
    cache: () => `${this.PREFIX}${this.SEPARATOR}cache${this.SEPARATOR}*`,
    temporary: () => `${this.PREFIX}${this.SEPARATOR}temp${this.SEPARATOR}*`,
  };
}

export default RedisKeys;