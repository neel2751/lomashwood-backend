import { FIXED_DATE, FIXED_IDS, FIXED_IPS, FIXED_USER_AGENTS, FIXED_URLS, FIXED_UTM, FIXED_GEO, FIXED_DEVICES, FIXED_REFERRERS } from './common.fixture';

export interface ISession {
  id:              string;
  userId:          string | null;
  anonymousId:     string;
  startedAt:       Date;
  endedAt:         Date | null;
  durationSeconds: number | null;
  pageViewCount:   number;
  eventCount:      number;
  bounced:         boolean;
  converted:       boolean;
  entryUrl:        string;
  exitUrl:         string | null;
  referrer:        string | null;
  utmSource:       string | null;
  utmMedium:       string | null;
  utmCampaign:     string | null;
  utmTerm:         string | null;
  utmContent:      string | null;
  ip:              string;
  userAgent:       string;
  deviceType:      string;
  os:              string;
  browser:         string;
  country:         string | null;
  region:          string | null;
  city:            string | null;
  createdAt:       Date;
  updatedAt:       Date;
}

export const desktopSessionFixture: ISession = {
  id:              FIXED_IDS.SESSION_1,
  userId:          FIXED_IDS.USER_1,
  anonymousId:     FIXED_IDS.ANONYMOUS_1,
  startedAt:       FIXED_DATE,
  endedAt:         new Date('2025-01-15T10:08:42.000Z'),
  durationSeconds: 522,
  pageViewCount:   6,
  eventCount:      14,
  bounced:         false,
  converted:       true,
  entryUrl:        FIXED_URLS.KITCHENS,
  exitUrl:         FIXED_URLS.BOOKING_SUCCESS,
  referrer:        FIXED_REFERRERS.GOOGLE,
  utmSource:       FIXED_UTM.GOOGLE_CPC.utm_source,
  utmMedium:       FIXED_UTM.GOOGLE_CPC.utm_medium,
  utmCampaign:     FIXED_UTM.GOOGLE_CPC.utm_campaign,
  utmTerm:         FIXED_UTM.GOOGLE_CPC.utm_term,
  utmContent:      FIXED_UTM.GOOGLE_CPC.utm_content,
  ip:              FIXED_IPS.UK_1,
  userAgent:       FIXED_USER_AGENTS.CHROME_DESKTOP,
  deviceType:      FIXED_DEVICES.DESKTOP.type,
  os:              FIXED_DEVICES.DESKTOP.os,
  browser:         FIXED_DEVICES.DESKTOP.browser,
  country:         FIXED_GEO.LONDON.country,
  region:          FIXED_GEO.LONDON.region,
  city:            FIXED_GEO.LONDON.city,
  createdAt:       FIXED_DATE,
  updatedAt:       new Date('2025-01-15T10:08:42.000Z'),
};

export const mobileSessionFixture: ISession = {
  id:              FIXED_IDS.SESSION_2,
  userId:          null,
  anonymousId:     FIXED_IDS.ANONYMOUS_2,
  startedAt:       FIXED_DATE,
  endedAt:         new Date('2025-01-15T10:03:15.000Z'),
  durationSeconds: 195,
  pageViewCount:   3,
  eventCount:      5,
  bounced:         false,
  converted:       false,
  entryUrl:        FIXED_URLS.HOME,
  exitUrl:         FIXED_URLS.BROCHURE,
  referrer:        FIXED_REFERRERS.INSTAGRAM,
  utmSource:       null,
  utmMedium:       null,
  utmCampaign:     null,
  utmTerm:         null,
  utmContent:      null,
  ip:              FIXED_IPS.UK_2,
  userAgent:       FIXED_USER_AGENTS.SAFARI_MOBILE,
  deviceType:      FIXED_DEVICES.MOBILE.type,
  os:              FIXED_DEVICES.MOBILE.os,
  browser:         FIXED_DEVICES.MOBILE.browser,
  country:         FIXED_GEO.LONDON.country,
  region:          FIXED_GEO.LONDON.region,
  city:            FIXED_GEO.LONDON.city,
  createdAt:       FIXED_DATE,
  updatedAt:       new Date('2025-01-15T10:03:15.000Z'),
};

export const bouncedSessionFixture: ISession = {
  ...mobileSessionFixture,
  id:              FIXED_IDS.SESSION_3,
  anonymousId:     'anon_bounce_001',
  endedAt:         new Date('2025-01-15T10:00:28.000Z'),
  durationSeconds: 28,
  pageViewCount:   1,
  eventCount:      1,
  bounced:         true,
  converted:       false,
  exitUrl:         FIXED_URLS.HOME,
  referrer:        FIXED_REFERRERS.FACEBOOK,
  createdAt:       FIXED_DATE,
  updatedAt:       new Date('2025-01-15T10:00:28.000Z'),
};

export const activeSessionFixture: ISession = {
  ...desktopSessionFixture,
  id:              'clxsess40000000000000000004',
  endedAt:         null,
  durationSeconds: null,
  converted:       false,
  exitUrl:         null,
  updatedAt:       FIXED_DATE,
};

export const directSessionFixture: ISession = {
  ...desktopSessionFixture,
  id:          'clxsess50000000000000000005',
  referrer:    FIXED_REFERRERS.DIRECT,
  utmSource:   null,
  utmMedium:   null,
  utmCampaign: null,
  utmTerm:     null,
  utmContent:  null,
  entryUrl:    FIXED_URLS.HOME,
};

export const emailCampaignSessionFixture: ISession = {
  ...desktopSessionFixture,
  id:          'clxsess60000000000000000006',
  referrer:    FIXED_REFERRERS.EMAIL,
  utmSource:   FIXED_UTM.EMAIL_CAMPAIGN.utm_source,
  utmMedium:   FIXED_UTM.EMAIL_CAMPAIGN.utm_medium,
  utmCampaign: FIXED_UTM.EMAIL_CAMPAIGN.utm_campaign,
  utmContent:  FIXED_UTM.EMAIL_CAMPAIGN.utm_content,
  entryUrl:    FIXED_URLS.KITCHENS,
};

export const sessionSummaryFixture = {
  totalSessions:       1250,
  uniqueUsers:         980,
  newUsers:            640,
  returningUsers:      340,
  avgDurationSeconds:  312,
  avgPageViewsPerSession: 3.8,
  bounceRate:          0.38,
  conversionRate:      0.067,
  topEntryPages: [
    { url: FIXED_URLS.HOME,     sessions: 480, bounceRate: 0.42 },
    { url: FIXED_URLS.KITCHENS, sessions: 310, bounceRate: 0.31 },
    { url: FIXED_URLS.BEDROOMS, sessions: 180, bounceRate: 0.36 },
  ],
  topExitPages: [
    { url: FIXED_URLS.BOOKING_SUCCESS, sessions: 84,  exitRate: 0.92 },
    { url: FIXED_URLS.HOME,            sessions: 210, exitRate: 0.55 },
  ],
  deviceBreakdown: [
    { type: 'desktop', count: 625, percent: 0.5  },
    { type: 'mobile',  count: 500, percent: 0.4  },
    { type: 'tablet',  count: 125, percent: 0.1  },
  ],
};

export const allSessionsFixture: ISession[] = [
  desktopSessionFixture,
  mobileSessionFixture,
  bouncedSessionFixture,
  activeSessionFixture,
  directSessionFixture,
  emailCampaignSessionFixture,
];