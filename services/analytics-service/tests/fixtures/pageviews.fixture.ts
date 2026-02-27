import { FIXED_DATE, FIXED_IDS, FIXED_IPS, FIXED_USER_AGENTS, FIXED_URLS, FIXED_GEO, FIXED_DEVICES } from './common.fixture';

export interface IPageView {
  id:              string;
  sessionId:       string;
  userId:          string | null;
  anonymousId:     string;
  url:             string;
  path:            string;
  title:           string;
  referrer:        string | null;
  durationSeconds: number | null;
  scrollDepth:     number | null;
  isEntryPage:     boolean;
  isExitPage:      boolean;
  deviceType:      string;
  country:         string | null;
  viewedAt:        Date;
  createdAt:       Date;
}

export const homepageViewFixture: IPageView = {
  id:              FIXED_IDS.PAGEVIEW_1,
  sessionId:       FIXED_IDS.SESSION_1,
  userId:          FIXED_IDS.USER_1,
  anonymousId:     FIXED_IDS.ANONYMOUS_1,
  url:             FIXED_URLS.HOME,
  path:            '/',
  title:           'Lomash Wood – Premium Kitchens & Bedrooms',
  referrer:        'https://www.google.com/',
  durationSeconds: 45,
  scrollDepth:     62,
  isEntryPage:     true,
  isExitPage:      false,
  deviceType:      FIXED_DEVICES.DESKTOP.type,
  country:         FIXED_GEO.LONDON.country,
  viewedAt:        FIXED_DATE,
  createdAt:       FIXED_DATE,
};

export const kitchensPageViewFixture: IPageView = {
  ...homepageViewFixture,
  id:              'clxpgv120000000000000000002',
  url:             FIXED_URLS.KITCHENS,
  path:            '/kitchens',
  title:           'Kitchen Designs | Lomash Wood',
  referrer:        FIXED_URLS.HOME,
  durationSeconds: 112,
  scrollDepth:     88,
  isEntryPage:     false,
  isExitPage:      false,
};

export const productPageViewFixture: IPageView = {
  ...homepageViewFixture,
  id:              'clxpgv130000000000000000003',
  url:             FIXED_URLS.PRODUCT_1,
  path:            '/kitchens/handleless-gloss-white',
  title:           'Handleless Gloss White Kitchen | Lomash Wood',
  referrer:        FIXED_URLS.KITCHENS,
  durationSeconds: 204,
  scrollDepth:     95,
  isEntryPage:     false,
  isExitPage:      false,
};

export const bookingPageViewFixture: IPageView = {
  ...homepageViewFixture,
  id:              'clxpgv140000000000000000004',
  url:             FIXED_URLS.BOOKING,
  path:            '/book-appointment',
  title:           'Book a Free Appointment | Lomash Wood',
  referrer:        FIXED_URLS.PRODUCT_1,
  durationSeconds: 87,
  scrollDepth:     100,
  isEntryPage:     false,
  isExitPage:      false,
};

export const bookingSuccessViewFixture: IPageView = {
  ...homepageViewFixture,
  id:              'clxpgv150000000000000000005',
  url:             FIXED_URLS.BOOKING_SUCCESS,
  path:            '/book-appointment/success',
  title:           'Appointment Confirmed | Lomash Wood',
  referrer:        FIXED_URLS.BOOKING,
  durationSeconds: 18,
  scrollDepth:     40,
  isEntryPage:     false,
  isExitPage:      true,
};

export const mobilePageViewFixture: IPageView = {
  id:              'clxpgv160000000000000000006',
  sessionId:       FIXED_IDS.SESSION_2,
  userId:          null,
  anonymousId:     FIXED_IDS.ANONYMOUS_2,
  url:             FIXED_URLS.HOME,
  path:            '/',
  title:           'Lomash Wood – Premium Kitchens & Bedrooms',
  referrer:        'https://www.instagram.com/',
  durationSeconds: 32,
  scrollDepth:     55,
  isEntryPage:     true,
  isExitPage:      false,
  deviceType:      FIXED_DEVICES.MOBILE.type,
  country:         FIXED_GEO.LONDON.country,
  viewedAt:        FIXED_DATE,
  createdAt:       FIXED_DATE,
};

export const bouncedPageViewFixture: IPageView = {
  ...homepageViewFixture,
  id:              'clxpgv170000000000000000007',
  sessionId:       FIXED_IDS.SESSION_3,
  userId:          null,
  anonymousId:     'anon_bounce_001',
  durationSeconds: 28,
  scrollDepth:     18,
  isEntryPage:     true,
  isExitPage:      true,
};

export const pageViewStatsFixture = {
  totalPageViews:       4850,
  uniquePageViews:      3920,
  avgDurationSeconds:   98,
  avgScrollDepth:       0.71,
  bounceRate:           0.38,
  topPages: [
    { path: '/',               title: 'Home',                views: 1240, uniqueViews: 980,  avgDuration: 45,  scrollDepth: 0.62 },
    { path: '/kitchens',       title: 'Kitchens',            views: 890,  uniqueViews: 720,  avgDuration: 112, scrollDepth: 0.88 },
    { path: '/bedrooms',       title: 'Bedrooms',            views: 560,  uniqueViews: 430,  avgDuration: 98,  scrollDepth: 0.81 },
    { path: '/book-appointment', title: 'Book Appointment',  views: 380,  uniqueViews: 310,  avgDuration: 87,  scrollDepth: 1.0  },
  ],
  entryPages: [
    { path: '/',         sessions: 480, bounceRate: 0.42 },
    { path: '/kitchens', sessions: 310, bounceRate: 0.31 },
  ],
  exitPages: [
    { path: '/book-appointment/success', sessions: 84,  exitRate: 0.92 },
    { path: '/kitchens/handleless-gloss-white', sessions: 120, exitRate: 0.28 },
  ],
};

export const allPageViewsFixture: IPageView[] = [
  homepageViewFixture,
  kitchensPageViewFixture,
  productPageViewFixture,
  bookingPageViewFixture,
  bookingSuccessViewFixture,
  mobilePageViewFixture,
  bouncedPageViewFixture,
];