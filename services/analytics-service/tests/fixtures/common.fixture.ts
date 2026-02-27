export const FIXED_DATE          = new Date('2025-01-15T10:00:00.000Z');
export const FIXED_DATE_STRING   = '2025-01-15T10:00:00.000Z';
export const FIXED_PAST_DATE     = new Date('2025-01-01T00:00:00.000Z');
export const FIXED_FUTURE_DATE   = new Date('2025-02-01T00:00:00.000Z');
export const FIXED_RANGE_START   = new Date('2025-01-01T00:00:00.000Z');
export const FIXED_RANGE_END     = new Date('2025-01-31T23:59:59.999Z');

export const FIXED_IDS = {
  USER_1:       'clxuser1000000000000000001',
  USER_2:       'clxuser2000000000000000002',
  USER_3:       'clxuser3000000000000000003',
  ANONYMOUS_1:  'anon_abc123def456ghi789jkl',
  ANONYMOUS_2:  'anon_xyz987wvu654tsr321qpo',
  SESSION_1:    'clxsess10000000000000000001',
  SESSION_2:    'clxsess20000000000000000002',
  SESSION_3:    'clxsess30000000000000000003',
  EVENT_1:      'clxevnt10000000000000000001',
  EVENT_2:      'clxevnt20000000000000000002',
  PAGEVIEW_1:   'clxpgv110000000000000000001',
  CONVERSION_1: 'clxconv10000000000000000001',
  FUNNEL_1:     'clxfunl10000000000000000001',
  COHORT_1:     'clxchrt10000000000000000001',
  DASHBOARD_1:  'clxdash10000000000000000001',
  REPORT_1:     'clxrprt10000000000000000001',
  EXPORT_1:     'clxexpt10000000000000000001',
} as const;

export const FIXED_IPS = {
  UK_1:  '81.2.69.142',
  UK_2:  '81.2.69.143',
  EU_1:  '185.220.101.50',
  US_1:  '104.28.34.100',
} as const;

export const FIXED_USER_AGENTS = {
  CHROME_DESKTOP: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  SAFARI_MOBILE:  'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
  FIREFOX:        'Mozilla/5.0 (X11; Linux x86_64; rv:109.0) Gecko/20100101 Firefox/115.0',
  BOT:            'Googlebot/2.1 (+http://www.google.com/bot.html)',
} as const;

export const FIXED_URLS = {
  HOME:            'https://www.lomashwood.co.uk/',
  KITCHENS:        'https://www.lomashwood.co.uk/kitchens',
  BEDROOMS:        'https://www.lomashwood.co.uk/bedrooms',
  PRODUCT_1:       'https://www.lomashwood.co.uk/kitchens/handleless-gloss-white',
  PRODUCT_2:       'https://www.lomashwood.co.uk/bedrooms/fitted-wardrobe-oak',
  BOOKING:         'https://www.lomashwood.co.uk/book-appointment',
  BOOKING_SUCCESS: 'https://www.lomashwood.co.uk/book-appointment/success',
  BROCHURE:        'https://www.lomashwood.co.uk/brochure',
  QUOTE:           'https://www.lomashwood.co.uk/get-a-quote',
  CHECKOUT:        'https://www.lomashwood.co.uk/checkout',
  ORDER_SUCCESS:   'https://www.lomashwood.co.uk/order/success',
  ACCOUNT:         'https://www.lomashwood.co.uk/account',
} as const;

export const FIXED_REFERRERS = {
  GOOGLE:    'https://www.google.com/',
  FACEBOOK:  'https://www.facebook.com/',
  INSTAGRAM: 'https://www.instagram.com/',
  DIRECT:    null,
  EMAIL:     'https://email.lomashwood.co.uk/',
  HOUZZ:     'https://www.houzz.co.uk/',
} as const;

export const FIXED_UTM = {
  GOOGLE_CPC: {
    utm_source:   'google',
    utm_medium:   'cpc',
    utm_campaign: 'kitchens-jan-2025',
    utm_term:     'fitted kitchen',
    utm_content:  'ad_variant_a',
  },
  EMAIL_CAMPAIGN: {
    utm_source:   'email',
    utm_medium:   'email',
    utm_campaign: 'spring-collection-launch',
    utm_content:  'cta_button',
  },
  ORGANIC: {
    utm_source:   null,
    utm_medium:   null,
    utm_campaign: null,
    utm_term:     null,
    utm_content:  null,
  },
} as const;

export const FIXED_GEO = {
  LONDON:     { country: 'GB', region: 'England', city: 'London',     lat: 51.5074,  lng: -0.1278  },
  MANCHESTER: { country: 'GB', region: 'England', city: 'Manchester', lat: 53.4808,  lng: -2.2426  },
  EDINBURGH:  { country: 'GB', region: 'Scotland', city: 'Edinburgh', lat: 55.9533,  lng: -3.1883  },
  NEW_YORK:   { country: 'US', region: 'New York', city: 'New York',  lat: 40.7128,  lng: -74.006  },
} as const;

export const FIXED_DEVICES = {
  DESKTOP: { type: 'desktop', os: 'Windows 10', browser: 'Chrome 120', screenWidth: 1920, screenHeight: 1080 },
  MOBILE:  { type: 'mobile',  os: 'iOS 17',     browser: 'Safari 17',  screenWidth: 390,  screenHeight: 844  },
  TABLET:  { type: 'tablet',  os: 'iPadOS 17',  browser: 'Safari 17',  screenWidth: 820,  screenHeight: 1180 },
} as const;