import { EventType, DeviceType, SessionStatus, ConversionType } from '@prisma/client';

export interface EventFixture {
  id: string;
  eventNumber: string;
  sessionId: string;
  userId?: string;
  eventType: EventType;
  eventName: string;
  timestamp: Date;
  properties?: Record<string, any>;
  page?: {
    url: string;
    path: string;
    title: string;
    referrer?: string;
  };
  device?: {
    type: DeviceType;
    browser: string;
    os: string;
    screenResolution?: string;
  };
  location?: {
    country: string;
    city?: string;
    region?: string;
    ipAddress?: string;
  };
  metadata?: Record<string, any>;
  createdAt: Date;
}

export interface SessionFixture {
  id: string;
  sessionNumber: string;
  userId?: string;
  status: SessionStatus;
  startedAt: Date;
  endedAt?: Date;
  duration?: number;
  pageviews: number;
  events: number;
  device: {
    type: DeviceType;
    browser: string;
    os: string;
  };
  location: {
    country: string;
    city?: string;
  };
  entryPage: string;
  exitPage?: string;
  referrer?: string;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  isConverted: boolean;
  conversionValue?: number;
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

export interface ConversionFixture {
  id: string;
  conversionNumber: string;
  sessionId: string;
  userId?: string;
  type: ConversionType;
  value: number;
  currency: string;
  orderId?: string;
  bookingId?: string;
  productId?: string;
  properties?: Record<string, any>;
  timestamp: Date;
  createdAt: Date;
}

export interface MetricFixture {
  id: string;
  name: string;
  value: number;
  dimension?: string;
  date: Date;
  metadata?: Record<string, any>;
}

export const pageViewEvent: EventFixture = {
  id: 'evt_pageview_001',
  eventNumber: 'EVT-2026-001001',
  sessionId: 'ses_001',
  userId: 'usr_001',
  eventType: EventType.PAGE_VIEW,
  eventName: 'page_viewed',
  timestamp: new Date('2026-02-10T10:00:00Z'),
  properties: {
    pageType: 'product_listing',
    category: 'kitchen',
  },
  page: {
    url: 'https://lomashwood.com/kitchens',
    path: '/kitchens',
    title: 'Kitchen Designs | Lomash Wood',
    referrer: 'https://google.com/search',
  },
  device: {
    type: DeviceType.DESKTOP,
    browser: 'Chrome',
    os: 'Windows',
    screenResolution: '1920x1080',
  },
  location: {
    country: 'United Kingdom',
    city: 'London',
    region: 'England',
    ipAddress: '192.168.1.1',
  },
  createdAt: new Date('2026-02-10T10:00:00Z'),
};

export const productViewEvent: EventFixture = {
  id: 'evt_product_001',
  eventNumber: 'EVT-2026-001002',
  sessionId: 'ses_001',
  userId: 'usr_001',
  eventType: EventType.PRODUCT_VIEW,
  eventName: 'product_viewed',
  timestamp: new Date('2026-02-10T10:05:00Z'),
  properties: {
    productId: 'prod_kitchen_001',
    productName: 'Luna White Kitchen',
    productCategory: 'kitchen',
    productPrice: 8500.00,
    productCurrency: 'GBP',
  },
  page: {
    url: 'https://lomashwood.com/kitchens/luna-white',
    path: '/kitchens/luna-white',
    title: 'Luna White Kitchen | Lomash Wood',
  },
  device: {
    type: DeviceType.DESKTOP,
    browser: 'Chrome',
    os: 'Windows',
  },
  location: {
    country: 'United Kingdom',
    city: 'London',
  },
  metadata: {
    viewDuration: 120,
    scrollDepth: 75,
  },
  createdAt: new Date('2026-02-10T10:05:00Z'),
};

export const addToCartEvent: EventFixture = {
  id: 'evt_cart_001',
  eventNumber: 'EVT-2026-001003',
  sessionId: 'ses_001',
  userId: 'usr_001',
  eventType: EventType.ADD_TO_CART,
  eventName: 'item_added_to_cart',
  timestamp: new Date('2026-02-10T10:10:00Z'),
  properties: {
    productId: 'prod_kitchen_001',
    productName: 'Luna White Kitchen',
    productCategory: 'kitchen',
    quantity: 1,
    price: 8500.00,
    currency: 'GBP',
  },
  device: {
    type: DeviceType.DESKTOP,
    browser: 'Chrome',
    os: 'Windows',
  },
  location: {
    country: 'United Kingdom',
    city: 'London',
  },
  createdAt: new Date('2026-02-10T10:10:00Z'),
};

export const bookingStartedEvent: EventFixture = {
  id: 'evt_booking_001',
  eventNumber: 'EVT-2026-001004',
  sessionId: 'ses_002',
  userId: 'usr_002',
  eventType: EventType.BOOKING_STARTED,
  eventName: 'booking_flow_started',
  timestamp: new Date('2026-02-09T14:00:00Z'),
  properties: {
    appointmentType: 'HOME_MEASUREMENT',
    serviceType: 'bedroom',
  },
  page: {
    url: 'https://lomashwood.com/book-appointment',
    path: '/book-appointment',
    title: 'Book Consultation | Lomash Wood',
  },
  device: {
    type: DeviceType.MOBILE,
    browser: 'Safari',
    os: 'iOS',
  },
  location: {
    country: 'United Kingdom',
    city: 'Manchester',
  },
  createdAt: new Date('2026-02-09T14:00:00Z'),
};

export const bookingCompletedEvent: EventFixture = {
  id: 'evt_booking_002',
  eventNumber: 'EVT-2026-001005',
  sessionId: 'ses_002',
  userId: 'usr_002',
  eventType: EventType.BOOKING_COMPLETED,
  eventName: 'booking_completed',
  timestamp: new Date('2026-02-09T14:10:00Z'),
  properties: {
    bookingId: 'bkg_home_002',
    bookingNumber: 'BKG-2026-001002',
    appointmentType: 'HOME_MEASUREMENT',
    serviceType: 'bedroom',
    scheduledDate: '2026-02-16',
    scheduledTime: '14:00',
  },
  device: {
    type: DeviceType.MOBILE,
    browser: 'Safari',
    os: 'iOS',
  },
  location: {
    country: 'United Kingdom',
    city: 'Manchester',
  },
  createdAt: new Date('2026-02-09T14:10:00Z'),
};

export const checkoutStartedEvent: EventFixture = {
  id: 'evt_checkout_001',
  eventNumber: 'EVT-2026-001006',
  sessionId: 'ses_003',
  userId: 'usr_003',
  eventType: EventType.CHECKOUT_STARTED,
  eventName: 'checkout_started',
  timestamp: new Date('2026-02-08T09:00:00Z'),
  properties: {
    cartValue: 6500.00,
    currency: 'GBP',
    itemCount: 2,
    products: [
      {
        productId: 'prod_bedroom_001',
        productName: 'Classic Wardrobes Set',
        quantity: 2,
        price: 3250.00,
      },
    ],
  },
  page: {
    url: 'https://lomashwood.com/checkout',
    path: '/checkout',
    title: 'Checkout | Lomash Wood',
  },
  device: {
    type: DeviceType.DESKTOP,
    browser: 'Firefox',
    os: 'MacOS',
  },
  location: {
    country: 'United Kingdom',
    city: 'Birmingham',
  },
  createdAt: new Date('2026-02-08T09:00:00Z'),
};

export const purchaseEvent: EventFixture = {
  id: 'evt_purchase_001',
  eventNumber: 'EVT-2026-001007',
  sessionId: 'ses_003',
  userId: 'usr_003',
  eventType: EventType.PURCHASE,
  eventName: 'purchase_completed',
  timestamp: new Date('2026-02-08T09:15:00Z'),
  properties: {
    orderId: 'ord_bedroom_001',
    orderNumber: 'ORD-2026-001236',
    revenue: 7650.00,
    tax: 1300.00,
    shipping: 100.00,
    currency: 'GBP',
    paymentMethod: 'stripe',
    products: [
      {
        productId: 'prod_bedroom_001',
        productName: 'Classic Wardrobes Set',
        quantity: 2,
        price: 3250.00,
      },
    ],
  },
  device: {
    type: DeviceType.DESKTOP,
    browser: 'Firefox',
    os: 'MacOS',
  },
  location: {
    country: 'United Kingdom',
    city: 'Birmingham',
  },
  createdAt: new Date('2026-02-08T09:15:00Z'),
};

export const searchEvent: EventFixture = {
  id: 'evt_search_001',
  eventNumber: 'EVT-2026-001008',
  sessionId: 'ses_004',
  eventType: EventType.SEARCH,
  eventName: 'site_search',
  timestamp: new Date('2026-02-11T11:00:00Z'),
  properties: {
    searchQuery: 'white kitchen',
    searchResults: 12,
    filterApplied: {
      colour: 'white',
      category: 'kitchen',
    },
  },
  page: {
    url: 'https://lomashwood.com/kitchens?search=white+kitchen',
    path: '/kitchens',
    title: 'Search Results | Lomash Wood',
  },
  device: {
    type: DeviceType.TABLET,
    browser: 'Chrome',
    os: 'Android',
  },
  location: {
    country: 'United Kingdom',
    city: 'Leeds',
  },
  createdAt: new Date('2026-02-11T11:00:00Z'),
};

export const filterAppliedEvent: EventFixture = {
  id: 'evt_filter_001',
  eventNumber: 'EVT-2026-001009',
  sessionId: 'ses_004',
  eventType: EventType.FILTER_APPLIED,
  eventName: 'filter_applied',
  timestamp: new Date('2026-02-11T11:05:00Z'),
  properties: {
    filterType: 'colour',
    filterValue: 'grey',
    resultsCount: 8,
  },
  page: {
    url: 'https://lomashwood.com/kitchens?colour=grey',
    path: '/kitchens',
    title: 'Grey Kitchens | Lomash Wood',
  },
  device: {
    type: DeviceType.TABLET,
    browser: 'Chrome',
    os: 'Android',
  },
  location: {
    country: 'United Kingdom',
    city: 'Leeds',
  },
  createdAt: new Date('2026-02-11T11:05:00Z'),
};

export const videoPlayedEvent: EventFixture = {
  id: 'evt_video_001',
  eventNumber: 'EVT-2026-001010',
  sessionId: 'ses_005',
  userId: 'usr_005',
  eventType: EventType.VIDEO_PLAYED,
  eventName: 'video_played',
  timestamp: new Date('2026-02-07T15:00:00Z'),
  properties: {
    videoTitle: 'Kitchen Installation Process',
    videoId: 'vid_install_001',
    videoDuration: 180,
    watchedPercentage: 85,
  },
  page: {
    url: 'https://lomashwood.com/our-process',
    path: '/our-process',
    title: 'Our Process | Lomash Wood',
  },
  device: {
    type: DeviceType.DESKTOP,
    browser: 'Edge',
    os: 'Windows',
  },
  location: {
    country: 'United Kingdom',
    city: 'Bristol',
  },
  createdAt: new Date('2026-02-07T15:00:00Z'),
};

export const brochureRequestEvent: EventFixture = {
  id: 'evt_brochure_001',
  eventNumber: 'EVT-2026-001011',
  sessionId: 'ses_006',
  userId: 'usr_006',
  eventType: EventType.FORM_SUBMITTED,
  eventName: 'brochure_requested',
  timestamp: new Date('2026-02-11T13:00:00Z'),
  properties: {
    formType: 'brochure_request',
    brochureType: 'complete_catalogue',
  },
  page: {
    url: 'https://lomashwood.com/brochure',
    path: '/brochure',
    title: 'Request Brochure | Lomash Wood',
  },
  device: {
    type: DeviceType.MOBILE,
    browser: 'Chrome',
    os: 'Android',
  },
  location: {
    country: 'United Kingdom',
    city: 'Liverpool',
  },
  createdAt: new Date('2026-02-11T13:00:00Z'),
};

export const activeSession: SessionFixture = {
  id: 'ses_001',
  sessionNumber: 'SES-2026-001001',
  userId: 'usr_001',
  status: SessionStatus.ACTIVE,
  startedAt: new Date('2026-02-10T10:00:00Z'),
  pageviews: 5,
  events: 8,
  device: {
    type: DeviceType.DESKTOP,
    browser: 'Chrome',
    os: 'Windows',
  },
  location: {
    country: 'United Kingdom',
    city: 'London',
  },
  entryPage: '/kitchens',
  referrer: 'https://google.com/search',
  utmSource: 'google',
  utmMedium: 'organic',
  isConverted: false,
  createdAt: new Date('2026-02-10T10:00:00Z'),
  updatedAt: new Date('2026-02-10T10:15:00Z'),
};

export const completedSession: SessionFixture = {
  id: 'ses_002',
  sessionNumber: 'SES-2026-001002',
  userId: 'usr_002',
  status: SessionStatus.COMPLETED,
  startedAt: new Date('2026-02-09T14:00:00Z'),
  endedAt: new Date('2026-02-09T14:25:00Z'),
  duration: 1500,
  pageviews: 7,
  events: 12,
  device: {
    type: DeviceType.MOBILE,
    browser: 'Safari',
    os: 'iOS',
  },
  location: {
    country: 'United Kingdom',
    city: 'Manchester',
  },
  entryPage: '/bedrooms',
  exitPage: '/book-appointment/confirmation',
  referrer: 'https://facebook.com',
  utmSource: 'facebook',
  utmMedium: 'social',
  utmCampaign: 'spring_bedrooms',
  isConverted: true,
  conversionValue: 0,
  metadata: {
    bookingCompleted: true,
    bookingId: 'bkg_home_002',
  },
  createdAt: new Date('2026-02-09T14:00:00Z'),
  updatedAt: new Date('2026-02-09T14:25:00Z'),
};

export const convertedSession: SessionFixture = {
  id: 'ses_003',
  sessionNumber: 'SES-2026-001003',
  userId: 'usr_003',
  status: SessionStatus.COMPLETED,
  startedAt: new Date('2026-02-08T09:00:00Z'),
  endedAt: new Date('2026-02-08T09:20:00Z'),
  duration: 1200,
  pageviews: 10,
  events: 15,
  device: {
    type: DeviceType.DESKTOP,
    browser: 'Firefox',
    os: 'MacOS',
  },
  location: {
    country: 'United Kingdom',
    city: 'Birmingham',
  },
  entryPage: '/bedrooms/classic-wardrobes',
  exitPage: '/checkout/success',
  referrer: 'https://google.com/search',
  utmSource: 'google',
  utmMedium: 'cpc',
  utmCampaign: 'bedroom_spring_sale',
  isConverted: true,
  conversionValue: 7650.00,
  metadata: {
    orderId: 'ord_bedroom_001',
    revenue: 7650.00,
  },
  createdAt: new Date('2026-02-08T09:00:00Z'),
  updatedAt: new Date('2026-02-08T09:20:00Z'),
};

export const bounceSession: SessionFixture = {
  id: 'ses_007',
  sessionNumber: 'SES-2026-001007',
  status: SessionStatus.BOUNCED,
  startedAt: new Date('2026-02-12T08:00:00Z'),
  endedAt: new Date('2026-02-12T08:00:15Z'),
  duration: 15,
  pageviews: 1,
  events: 1,
  device: {
    type: DeviceType.MOBILE,
    browser: 'Chrome',
    os: 'Android',
  },
  location: {
    country: 'United Kingdom',
    city: 'Newcastle',
  },
  entryPage: '/kitchens/luna-white',
  exitPage: '/kitchens/luna-white',
  referrer: 'https://pinterest.com',
  isConverted: false,
  createdAt: new Date('2026-02-12T08:00:00Z'),
  updatedAt: new Date('2026-02-12T08:00:15Z'),
};

export const purchaseConversion: ConversionFixture = {
  id: 'conv_purchase_001',
  conversionNumber: 'CONV-2026-001001',
  sessionId: 'ses_003',
  userId: 'usr_003',
  type: ConversionType.PURCHASE,
  value: 7650.00,
  currency: 'GBP',
  orderId: 'ord_bedroom_001',
  productId: 'prod_bedroom_001',
  properties: {
    orderNumber: 'ORD-2026-001236',
    productName: 'Classic Wardrobes Set',
    quantity: 2,
  },
  timestamp: new Date('2026-02-08T09:15:00Z'),
  createdAt: new Date('2026-02-08T09:15:00Z'),
};

export const bookingConversion: ConversionFixture = {
  id: 'conv_booking_001',
  conversionNumber: 'CONV-2026-001002',
  sessionId: 'ses_002',
  userId: 'usr_002',
  type: ConversionType.BOOKING,
  value: 0,
  currency: 'GBP',
  bookingId: 'bkg_home_002',
  properties: {
    bookingNumber: 'BKG-2026-001002',
    appointmentType: 'HOME_MEASUREMENT',
    serviceType: 'bedroom',
  },
  timestamp: new Date('2026-02-09T14:10:00Z'),
  createdAt: new Date('2026-02-09T14:10:00Z'),
};

export const leadConversion: ConversionFixture = {
  id: 'conv_lead_001',
  conversionNumber: 'CONV-2026-001003',
  sessionId: 'ses_006',
  userId: 'usr_006',
  type: ConversionType.LEAD,
  value: 0,
  currency: 'GBP',
  properties: {
    leadType: 'brochure_request',
    source: 'organic',
  },
  timestamp: new Date('2026-02-11T13:00:00Z'),
  createdAt: new Date('2026-02-11T13:00:00Z'),
};

export const totalRevenueMetric: MetricFixture = {
  id: 'metric_revenue_001',
  name: 'total_revenue',
  value: 42850.00,
  date: new Date('2026-02-10'),
  metadata: {
    currency: 'GBP',
    orderCount: 5,
  },
};

export const conversionRateMetric: MetricFixture = {
  id: 'metric_conversion_001',
  name: 'conversion_rate',
  value: 3.2,
  date: new Date('2026-02-10'),
  metadata: {
    sessions: 1250,
    conversions: 40,
  },
};

export const avgOrderValueMetric: MetricFixture = {
  id: 'metric_aov_001',
  name: 'average_order_value',
  value: 8570.00,
  date: new Date('2026-02-10'),
  metadata: {
    currency: 'GBP',
    orderCount: 5,
  },
};

export const bounceRateMetric: MetricFixture = {
  id: 'metric_bounce_001',
  name: 'bounce_rate',
  value: 42.5,
  date: new Date('2026-02-10'),
  metadata: {
    totalSessions: 1250,
    bouncedSessions: 531,
  },
};

export const avgSessionDurationMetric: MetricFixture = {
  id: 'metric_duration_001',
  name: 'avg_session_duration',
  value: 245,
  date: new Date('2026-02-10'),
  metadata: {
    unit: 'seconds',
    totalDuration: 306250,
    sessionCount: 1250,
  },
};

export const pageviewsMetric: MetricFixture = {
  id: 'metric_pageviews_001',
  name: 'total_pageviews',
  value: 5670,
  date: new Date('2026-02-10'),
  metadata: {
    uniquePageviews: 4230,
  },
};

export const kitchenCategoryMetric: MetricFixture = {
  id: 'metric_kitchen_001',
  name: 'category_revenue',
  value: 28500.00,
  dimension: 'kitchen',
  date: new Date('2026-02-10'),
  metadata: {
    currency: 'GBP',
    orderCount: 3,
  },
};

export const bedroomCategoryMetric: MetricFixture = {
  id: 'metric_bedroom_001',
  name: 'category_revenue',
  value: 14350.00,
  dimension: 'bedroom',
  date: new Date('2026-02-10'),
  metadata: {
    currency: 'GBP',
    orderCount: 2,
  },
};

export const eventFixtures: EventFixture[] = [
  pageViewEvent,
  productViewEvent,
  addToCartEvent,
  bookingStartedEvent,
  bookingCompletedEvent,
  checkoutStartedEvent,
  purchaseEvent,
  searchEvent,
  filterAppliedEvent,
  videoPlayedEvent,
  brochureRequestEvent,
];

export const sessionFixtures: SessionFixture[] = [
  activeSession,
  completedSession,
  convertedSession,
  bounceSession,
];

export const conversionFixtures: ConversionFixture[] = [
  purchaseConversion,
  bookingConversion,
  leadConversion,
];

export const metricFixtures: MetricFixture[] = [
  totalRevenueMetric,
  conversionRateMetric,
  avgOrderValueMetric,
  bounceRateMetric,
  avgSessionDurationMetric,
  pageviewsMetric,
  kitchenCategoryMetric,
  bedroomCategoryMetric,
];

export const getEventById = (id: string): EventFixture | undefined => {
  return eventFixtures.find(event => event.id === id);
};

export const getEventsByType = (type: EventType): EventFixture[] => {
  return eventFixtures.filter(event => event.eventType === type);
};

export const getEventsBySessionId = (sessionId: string): EventFixture[] => {
  return eventFixtures.filter(event => event.sessionId === sessionId);
};

export const getEventsByUserId = (userId: string): EventFixture[] => {
  return eventFixtures.filter(event => event.userId === userId);
};

export const getSessionById = (id: string): SessionFixture | undefined => {
  return sessionFixtures.find(session => session.id === id);
};

export const getSessionsByStatus = (status: SessionStatus): SessionFixture[] => {
  return sessionFixtures.filter(session => session.status === status);
};

export const getSessionsByUserId = (userId: string): SessionFixture[] => {
  return sessionFixtures.filter(session => session.userId === userId);
};

export const getConvertedSessions = (): SessionFixture[] => {
  return sessionFixtures.filter(session => session.isConverted);
};

export const getBouncedSessions = (): SessionFixture[] => {
  return sessionFixtures.filter(session => session.status === SessionStatus.BOUNCED);
};

export const getConversionById = (id: string): ConversionFixture | undefined => {
  return conversionFixtures.find(conversion => conversion.id === id);
};

export const getConversionsByType = (type: ConversionType): ConversionFixture[] => {
  return conversionFixtures.filter(conversion => conversion.type === type);
};

export const getConversionsBySessionId = (sessionId: string): ConversionFixture[] => {
  return conversionFixtures.filter(conversion => conversion.sessionId === sessionId);
};

export const getMetricByName = (name: string): MetricFixture[] => {
  return metricFixtures.filter(metric => metric.name === name);
};

export const getMetricsByDimension = (dimension: string): MetricFixture[] => {
  return metricFixtures.filter(metric => metric.dimension === dimension);
};

export const getMetricsByDate = (date: Date): MetricFixture[] => {
  return metricFixtures.filter(metric => 
    metric.date.toDateString() === date.toDateString()
  );
};

export const createEventFixture = (overrides: Partial<EventFixture> = {}): EventFixture => {
  const timestamp = new Date();
  const defaultEvent: EventFixture = {
    id: `evt_${Date.now()}`,
    eventNumber: `EVT-2026-${Math.floor(Math.random() * 999999).toString().padStart(6, '0')}`,
    sessionId: 'ses_default',
    eventType: EventType.PAGE_VIEW,
    eventName: 'page_viewed',
    timestamp,
    page: {
      url: 'https://lomashwood.com',
      path: '/',
      title: 'Home | Lomash Wood',
    },
    device: {
      type: DeviceType.DESKTOP,
      browser: 'Chrome',
      os: 'Windows',
    },
    location: {
      country: 'United Kingdom',
    },
    createdAt: timestamp,
    ...overrides,
  };

  return defaultEvent;
};

export const createSessionFixture = (overrides: Partial<SessionFixture> = {}): SessionFixture => {
  const timestamp = new Date();
  const defaultSession: SessionFixture = {
    id: `ses_${Date.now()}`,
    sessionNumber: `SES-2026-${Math.floor(Math.random() * 999999).toString().padStart(6, '0')}`,
    status: SessionStatus.ACTIVE,
    startedAt: timestamp,
    pageviews: 0,
    events: 0,
    device: {
      type: DeviceType.DESKTOP,
      browser: 'Chrome',
      os: 'Windows',
    },
    location: {
      country: 'United Kingdom',
    },
    entryPage: '/',
    isConverted: false,
    createdAt: timestamp,
    updatedAt: timestamp,
    ...overrides,
  };

  return defaultSession;
};

export const createConversionFixture = (overrides: Partial<ConversionFixture> = {}): ConversionFixture => {
  const timestamp = new Date();
  const defaultConversion: ConversionFixture = {
    id: `conv_${Date.now()}`,
    conversionNumber: `CONV-2026-${Math.floor(Math.random() * 999999).toString().padStart(6, '0')}`,
    sessionId: 'ses_default',
    type: ConversionType.LEAD,
    value: 0,
    currency: 'GBP',
    timestamp,
    createdAt: timestamp,
    ...overrides,
  };

  return defaultConversion;
};

export default {
  eventFixtures,
  sessionFixtures,
  conversionFixtures,
  metricFixtures,
  pageViewEvent,
  productViewEvent,
  addToCartEvent,
  bookingStartedEvent,
  bookingCompletedEvent,
  checkoutStartedEvent,
  purchaseEvent,
  searchEvent,
  filterAppliedEvent,
  videoPlayedEvent,
  brochureRequestEvent,
  activeSession,
  completedSession,
  convertedSession,
  bounceSession,
  purchaseConversion,
  bookingConversion,
  leadConversion,
  totalRevenueMetric,
  conversionRateMetric,
  avgOrderValueMetric,
  bounceRateMetric,
  avgSessionDurationMetric,
  pageviewsMetric,
  kitchenCategoryMetric,
  bedroomCategoryMetric,
  getEventById,
  getEventsByType,
  getEventsBySessionId,
  getEventsByUserId,
  getSessionById,
  getSessionsByStatus,
  getSessionsByUserId,
  getConvertedSessions,
  getBouncedSessions,
  getConversionById,
  getConversionsByType,
  getConversionsBySessionId,
  getMetricByName,
  getMetricsByDimension,
  getMetricsByDate,
  createEventFixture,
  createSessionFixture,
  createConversionFixture,
};