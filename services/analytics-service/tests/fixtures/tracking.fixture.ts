import { FIXED_DATE, FIXED_IDS, FIXED_IPS, FIXED_USER_AGENTS, FIXED_URLS, FIXED_UTM, FIXED_GEO } from './common.fixture';

export interface ITrackEventPayload {
  eventType:   'track' | 'page' | 'identify' | 'screen';
  eventName:   string;
  anonymousId: string;
  userId?:     string;
  sessionId?:  string;
  properties?: Record<string, unknown>;
  context?:    {
    ip?:        string;
    userAgent?: string;
    page?:      { url?: string; referrer?: string; title?: string };
    utm?:       Record<string, string | null>;
    locale?:    string;
    timezone?:  string;
  };
  sentAt?: string;
}

export const validTrackPayloadFixture: ITrackEventPayload = {
  eventType:   'track',
  eventName:   'Button Clicked',
  anonymousId: FIXED_IDS.ANONYMOUS_1,
  userId:      FIXED_IDS.USER_1,
  sessionId:   FIXED_IDS.SESSION_1,
  properties:  {
    buttonLabel: 'Book a Free Appointment',
    buttonId:    'cta-book-appointment',
    page:        '/kitchens',
  },
  context: {
    ip:        FIXED_IPS.UK_1,
    userAgent: FIXED_USER_AGENTS.CHROME_DESKTOP,
    page:      { url: FIXED_URLS.KITCHENS, referrer: FIXED_URLS.HOME, title: 'Kitchen Designs | Lomash Wood' },
    utm:       FIXED_UTM.GOOGLE_CPC,
    locale:    'en-GB',
    timezone:  'Europe/London',
  },
  sentAt: FIXED_DATE.toISOString(),
};

export const validPagePayloadFixture: ITrackEventPayload = {
  eventType:   'page',
  eventName:   'Page Viewed',
  anonymousId: FIXED_IDS.ANONYMOUS_1,
  userId:      FIXED_IDS.USER_1,
  properties:  {
    path:  '/kitchens',
    title: 'Kitchen Designs | Lomash Wood',
  },
  context: {
    ip:        FIXED_IPS.UK_1,
    userAgent: FIXED_USER_AGENTS.CHROME_DESKTOP,
    page:      { url: FIXED_URLS.KITCHENS, referrer: FIXED_URLS.HOME, title: 'Kitchen Designs | Lomash Wood' },
    utm:       FIXED_UTM.GOOGLE_CPC,
    locale:    'en-GB',
    timezone:  'Europe/London',
  },
  sentAt: FIXED_DATE.toISOString(),
};

export const validIdentifyPayloadFixture: ITrackEventPayload = {
  eventType:   'identify',
  eventName:   'User Identified',
  anonymousId: FIXED_IDS.ANONYMOUS_1,
  userId:      FIXED_IDS.USER_1,
  properties:  {
    email:     'john.doe@example.com',
    name:      'John Doe',
    plan:      'registered',
    createdAt: FIXED_DATE.toISOString(),
  },
  context: {
    ip:        FIXED_IPS.UK_1,
    userAgent: FIXED_USER_AGENTS.CHROME_DESKTOP,
    locale:    'en-GB',
    timezone:  'Europe/London',
  },
  sentAt: FIXED_DATE.toISOString(),
};

export const anonymousTrackPayloadFixture: ITrackEventPayload = {
  eventType:   'track',
  eventName:   'Product Viewed',
  anonymousId: FIXED_IDS.ANONYMOUS_2,
  properties:  {
    productId:   'PROD-KITCHEN-HGW-001',
    productName: 'Handleless Gloss White Kitchen',
    category:    'KITCHEN',
    price:       12000,
  },
  context: {
    userAgent: FIXED_USER_AGENTS.SAFARI_MOBILE,
    page:      { url: FIXED_URLS.PRODUCT_1, referrer: FIXED_URLS.KITCHENS },
  },
  sentAt: FIXED_DATE.toISOString(),
};

export const missingAnonymousIdPayloadFixture = {
  eventType:  'track',
  eventName:  'Button Clicked',
  properties: { buttonId: 'cta' },
};

export const missingEventNamePayloadFixture = {
  eventType:   'track',
  anonymousId: FIXED_IDS.ANONYMOUS_1,
  properties:  { buttonId: 'cta' },
};

export const invalidEventTypePayloadFixture = {
  eventType:   'invalid_type',
  eventName:   'Something',
  anonymousId: FIXED_IDS.ANONYMOUS_1,
};

export const batchTrackPayloadFixture = {
  batch: [
    validTrackPayloadFixture,
    validPagePayloadFixture,
    anonymousTrackPayloadFixture,
  ],
};

export const largeBatchPayloadFixture = {
  batch: Array.from({ length: 200 }, (_, i) => ({
    eventType:   'track' as const,
    eventName:   `Event ${i}`,
    anonymousId: `anon_batch_${String(i).padStart(3, '0')}`,
    properties:  { index: i },
    sentAt:      FIXED_DATE.toISOString(),
  })),
};

export const oversizedBatchPayloadFixture = {
  batch: Array.from({ length: 1001 }, (_, i) => ({
    eventType:   'track' as const,
    eventName:   `Event ${i}`,
    anonymousId: `anon_over_${i}`,
  })),
};

export const trackingResponseFixture = {
  received: 3,
  accepted: 3,
  rejected: 0,
  batchId:  'batch_track_001',
};

export const trackingBatchRejectedFixture = {
  received:  3,
  accepted:  2,
  rejected:  1,
  batchId:   'batch_track_002',
  rejections: [
    { index: 2, reason: 'Missing anonymousId' },
  ],
};

export const sdkConfigFixture = {
  writeKey:       'lmsh_wk_test_abc123def456',
  endpoint:       'https://analytics.lomashwood.co.uk/v1',
  flushInterval:  5000,
  flushAt:        20,
  maxQueueSize:   100,
};