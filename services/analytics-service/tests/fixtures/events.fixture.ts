import { FIXED_DATE, FIXED_IDS, FIXED_IPS, FIXED_USER_AGENTS, FIXED_URLS, FIXED_UTM, FIXED_GEO, FIXED_DEVICES } from './common.fixture';

export interface IAnalyticsEvent {
  id:          string;
  eventType:   string;
  eventName:   string;
  sessionId:   string;
  userId:      string | null;
  anonymousId: string;
  properties:  Record<string, unknown>;
  context:     {
    ip:        string;
    userAgent: string;
    page:      { url: string; referrer: string | null; title: string };
    utm:       Record<string, string | null>;
    geo:       Record<string, unknown> | null;
    device:    Record<string, unknown>;
  };
  receivedAt:  Date;
  sentAt:      Date;
  createdAt:   Date;
}

export const pageViewEventFixture: IAnalyticsEvent = {
  id:          FIXED_IDS.EVENT_1,
  eventType:   'page',
  eventName:   'Page Viewed',
  sessionId:   FIXED_IDS.SESSION_1,
  userId:      FIXED_IDS.USER_1,
  anonymousId: FIXED_IDS.ANONYMOUS_1,
  properties:  {
    path:     '/kitchens',
    title:    'Kitchen Designs | Lomash Wood',
    duration: null,
  },
  context: {
    ip:        FIXED_IPS.UK_1,
    userAgent: FIXED_USER_AGENTS.CHROME_DESKTOP,
    page:      { url: FIXED_URLS.KITCHENS, referrer: 'https://www.google.com/', title: 'Kitchen Designs | Lomash Wood' },
    utm:       FIXED_UTM.GOOGLE_CPC,
    geo:       FIXED_GEO.LONDON,
    device:    FIXED_DEVICES.DESKTOP,
  },
  receivedAt: FIXED_DATE,
  sentAt:     FIXED_DATE,
  createdAt:  FIXED_DATE,
};

export const buttonClickEventFixture: IAnalyticsEvent = {
  id:          FIXED_IDS.EVENT_2,
  eventType:   'track',
  eventName:   'Button Clicked',
  sessionId:   FIXED_IDS.SESSION_1,
  userId:      FIXED_IDS.USER_1,
  anonymousId: FIXED_IDS.ANONYMOUS_1,
  properties:  {
    buttonLabel: 'Book a Free Appointment',
    buttonId:    'cta-book-appointment',
    page:        '/kitchens',
    position:    'hero',
  },
  context: {
    ip:        FIXED_IPS.UK_1,
    userAgent: FIXED_USER_AGENTS.CHROME_DESKTOP,
    page:      { url: FIXED_URLS.KITCHENS, referrer: null, title: 'Kitchen Designs | Lomash Wood' },
    utm:       FIXED_UTM.ORGANIC,
    geo:       FIXED_GEO.LONDON,
    device:    FIXED_DEVICES.DESKTOP,
  },
  receivedAt: FIXED_DATE,
  sentAt:     FIXED_DATE,
  createdAt:  FIXED_DATE,
};

export const appointmentBookedEventFixture: IAnalyticsEvent = {
  id:          'clxevnt30000000000000000003',
  eventType:   'track',
  eventName:   'Appointment Booked',
  sessionId:   FIXED_IDS.SESSION_1,
  userId:      FIXED_IDS.USER_1,
  anonymousId: FIXED_IDS.ANONYMOUS_1,
  properties:  {
    appointmentId:   'APT-2025-001',
    appointmentType: 'Kitchen Design',
    showroom:        'London Showroom',
    date:            '2025-02-01',
    time:            '10:00',
    value:           0,
  },
  context: {
    ip:        FIXED_IPS.UK_1,
    userAgent: FIXED_USER_AGENTS.CHROME_DESKTOP,
    page:      { url: FIXED_URLS.BOOKING_SUCCESS, referrer: FIXED_URLS.BOOKING, title: 'Appointment Confirmed | Lomash Wood' },
    utm:       FIXED_UTM.GOOGLE_CPC,
    geo:       FIXED_GEO.LONDON,
    device:    FIXED_DEVICES.DESKTOP,
  },
  receivedAt: FIXED_DATE,
  sentAt:     FIXED_DATE,
  createdAt:  FIXED_DATE,
};

export const brochureRequestedEventFixture: IAnalyticsEvent = {
  id:          'clxevnt40000000000000000004',
  eventType:   'track',
  eventName:   'Brochure Requested',
  sessionId:   FIXED_IDS.SESSION_2,
  userId:      null,
  anonymousId: FIXED_IDS.ANONYMOUS_2,
  properties:  {
    brochureType: 'Kitchen & Bedroom Collection',
    postcode:     'SW1A 1AA',
  },
  context: {
    ip:        FIXED_IPS.UK_2,
    userAgent: FIXED_USER_AGENTS.SAFARI_MOBILE,
    page:      { url: FIXED_URLS.BROCHURE, referrer: 'https://www.houzz.co.uk/', title: 'Request a Brochure | Lomash Wood' },
    utm:       FIXED_UTM.ORGANIC,
    geo:       FIXED_GEO.LONDON,
    device:    FIXED_DEVICES.MOBILE,
  },
  receivedAt: FIXED_DATE,
  sentAt:     FIXED_DATE,
  createdAt:  FIXED_DATE,
};

export const orderPlacedEventFixture: IAnalyticsEvent = {
  id:          'clxevnt50000000000000000005',
  eventType:   'track',
  eventName:   'Order Placed',
  sessionId:   FIXED_IDS.SESSION_1,
  userId:      FIXED_IDS.USER_1,
  anonymousId: FIXED_IDS.ANONYMOUS_1,
  properties:  {
    orderId:    'ORD-2025-001',
    revenue:    15000,
    currency:   'GBP',
    items:      [
      { name: 'Handleless Gloss White Kitchen', category: 'KITCHEN', price: 12000, quantity: 1 },
      { name: 'Installation Service',           category: 'SERVICE',  price: 3000,  quantity: 1 },
    ],
    couponCode: null,
  },
  context: {
    ip:        FIXED_IPS.UK_1,
    userAgent: FIXED_USER_AGENTS.CHROME_DESKTOP,
    page:      { url: FIXED_URLS.ORDER_SUCCESS, referrer: FIXED_URLS.CHECKOUT, title: 'Order Confirmed | Lomash Wood' },
    utm:       FIXED_UTM.EMAIL_CAMPAIGN,
    geo:       FIXED_GEO.LONDON,
    device:    FIXED_DEVICES.DESKTOP,
  },
  receivedAt: FIXED_DATE,
  sentAt:     FIXED_DATE,
  createdAt:  FIXED_DATE,
};

export const quoteRequestedEventFixture: IAnalyticsEvent = {
  id:          'clxevnt60000000000000000006',
  eventType:   'track',
  eventName:   'Quote Requested',
  sessionId:   FIXED_IDS.SESSION_2,
  userId:      null,
  anonymousId: FIXED_IDS.ANONYMOUS_2,
  properties:  {
    quoteType:  'Kitchen',
    budget:     '10000-15000',
    postcode:   'M1 1AE',
    hasDesigner: false,
  },
  context: {
    ip:        FIXED_IPS.UK_2,
    userAgent: FIXED_USER_AGENTS.FIREFOX,
    page:      { url: FIXED_URLS.QUOTE, referrer: FIXED_URLS.KITCHENS, title: 'Get a Quote | Lomash Wood' },
    utm:       FIXED_UTM.ORGANIC,
    geo:       FIXED_GEO.MANCHESTER,
    device:    FIXED_DEVICES.DESKTOP,
  },
  receivedAt: FIXED_DATE,
  sentAt:     FIXED_DATE,
  createdAt:  FIXED_DATE,
};

export const userIdentifiedEventFixture: IAnalyticsEvent = {
  id:          'clxevnt70000000000000000007',
  eventType:   'identify',
  eventName:   'User Identified',
  sessionId:   FIXED_IDS.SESSION_1,
  userId:      FIXED_IDS.USER_1,
  anonymousId: FIXED_IDS.ANONYMOUS_1,
  properties:  {
    email:     'john.doe@example.com',
    name:      'John Doe',
    createdAt: FIXED_DATE.toISOString(),
  },
  context: {
    ip:        FIXED_IPS.UK_1,
    userAgent: FIXED_USER_AGENTS.CHROME_DESKTOP,
    page:      { url: FIXED_URLS.ACCOUNT, referrer: null, title: 'My Account | Lomash Wood' },
    utm:       FIXED_UTM.ORGANIC,
    geo:       FIXED_GEO.LONDON,
    device:    FIXED_DEVICES.DESKTOP,
  },
  receivedAt: FIXED_DATE,
  sentAt:     FIXED_DATE,
  createdAt:  FIXED_DATE,
};

export const productViewedEventFixture: IAnalyticsEvent = {
  id:          'clxevnt80000000000000000008',
  eventType:   'track',
  eventName:   'Product Viewed',
  sessionId:   FIXED_IDS.SESSION_2,
  userId:      null,
  anonymousId: FIXED_IDS.ANONYMOUS_2,
  properties:  {
    productId:   'PROD-KITCHEN-HGW-001',
    productName: 'Handleless Gloss White Kitchen',
    category:    'KITCHEN',
    price:       12000,
    currency:    'GBP',
    imageCount:  8,
  },
  context: {
    ip:        FIXED_IPS.UK_2,
    userAgent: FIXED_USER_AGENTS.SAFARI_MOBILE,
    page:      { url: FIXED_URLS.PRODUCT_1, referrer: FIXED_URLS.KITCHENS, title: 'Handleless Gloss White Kitchen | Lomash Wood' },
    utm:       FIXED_UTM.ORGANIC,
    geo:       FIXED_GEO.LONDON,
    device:    FIXED_DEVICES.MOBILE,
  },
  receivedAt: FIXED_DATE,
  sentAt:     FIXED_DATE,
  createdAt:  FIXED_DATE,
};

export const allEventsFixture: IAnalyticsEvent[] = [
  pageViewEventFixture,
  buttonClickEventFixture,
  appointmentBookedEventFixture,
  brochureRequestedEventFixture,
  orderPlacedEventFixture,
  quoteRequestedEventFixture,
  userIdentifiedEventFixture,
  productViewedEventFixture,
];