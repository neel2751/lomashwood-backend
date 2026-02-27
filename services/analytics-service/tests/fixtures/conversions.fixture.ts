import { FIXED_DATE, FIXED_IDS, FIXED_URLS, FIXED_UTM } from './common.fixture';

export interface IConversion {
  id:            string;
  sessionId:     string;
  userId:        string | null;
  anonymousId:   string;
  goalId:        string;
  goalName:      string;
  goalType:      'APPOINTMENT' | 'BROCHURE_REQUEST' | 'QUOTE_REQUEST' | 'ORDER' | 'ACCOUNT_CREATED' | 'NEWSLETTER_SIGNUP';
  value:         number;
  currency:      string;
  properties:    Record<string, unknown>;
  utmSource:     string | null;
  utmMedium:     string | null;
  utmCampaign:   string | null;
  convertedAt:   Date;
  createdAt:     Date;
}

export const appointmentConversionFixture: IConversion = {
  id:          FIXED_IDS.CONVERSION_1,
  sessionId:   FIXED_IDS.SESSION_1,
  userId:      FIXED_IDS.USER_1,
  anonymousId: FIXED_IDS.ANONYMOUS_1,
  goalId:      'goal_appointment_booking',
  goalName:    'Appointment Booked',
  goalType:    'APPOINTMENT',
  value:       0,
  currency:    'GBP',
  properties:  {
    appointmentId:   'APT-2025-001',
    appointmentType: 'Kitchen Design',
    showroom:        'London Showroom',
  },
  utmSource:   FIXED_UTM.GOOGLE_CPC.utm_source,
  utmMedium:   FIXED_UTM.GOOGLE_CPC.utm_medium,
  utmCampaign: FIXED_UTM.GOOGLE_CPC.utm_campaign,
  convertedAt: FIXED_DATE,
  createdAt:   FIXED_DATE,
};

export const brochureConversionFixture: IConversion = {
  id:          'clxconv20000000000000000002',
  sessionId:   FIXED_IDS.SESSION_2,
  userId:      null,
  anonymousId: FIXED_IDS.ANONYMOUS_2,
  goalId:      'goal_brochure_request',
  goalName:    'Brochure Requested',
  goalType:    'BROCHURE_REQUEST',
  value:       0,
  currency:    'GBP',
  properties:  { brochureType: 'Kitchen & Bedroom Collection' },
  utmSource:   null,
  utmMedium:   null,
  utmCampaign: null,
  convertedAt: FIXED_DATE,
  createdAt:   FIXED_DATE,
};

export const quoteConversionFixture: IConversion = {
  id:          'clxconv30000000000000000003',
  sessionId:   FIXED_IDS.SESSION_2,
  userId:      null,
  anonymousId: FIXED_IDS.ANONYMOUS_2,
  goalId:      'goal_quote_request',
  goalName:    'Quote Requested',
  goalType:    'QUOTE_REQUEST',
  value:       0,
  currency:    'GBP',
  properties:  { quoteType: 'Kitchen', budget: '10000-15000' },
  utmSource:   null,
  utmMedium:   null,
  utmCampaign: null,
  convertedAt: FIXED_DATE,
  createdAt:   FIXED_DATE,
};

export const orderConversionFixture: IConversion = {
  id:          'clxconv40000000000000000004',
  sessionId:   FIXED_IDS.SESSION_1,
  userId:      FIXED_IDS.USER_1,
  anonymousId: FIXED_IDS.ANONYMOUS_1,
  goalId:      'goal_order_placed',
  goalName:    'Order Placed',
  goalType:    'ORDER',
  value:       15000,
  currency:    'GBP',
  properties:  {
    orderId:  'ORD-2025-001',
    items:    2,
    revenue:  15000,
  },
  utmSource:   FIXED_UTM.EMAIL_CAMPAIGN.utm_source,
  utmMedium:   FIXED_UTM.EMAIL_CAMPAIGN.utm_medium,
  utmCampaign: FIXED_UTM.EMAIL_CAMPAIGN.utm_campaign,
  convertedAt: FIXED_DATE,
  createdAt:   FIXED_DATE,
};

export const accountCreatedConversionFixture: IConversion = {
  id:          'clxconv50000000000000000005',
  sessionId:   FIXED_IDS.SESSION_1,
  userId:      FIXED_IDS.USER_1,
  anonymousId: FIXED_IDS.ANONYMOUS_1,
  goalId:      'goal_account_created',
  goalName:    'Account Created',
  goalType:    'ACCOUNT_CREATED',
  value:       0,
  currency:    'GBP',
  properties:  { registrationMethod: 'email' },
  utmSource:   FIXED_UTM.GOOGLE_CPC.utm_source,
  utmMedium:   FIXED_UTM.GOOGLE_CPC.utm_medium,
  utmCampaign: FIXED_UTM.GOOGLE_CPC.utm_campaign,
  convertedAt: FIXED_DATE,
  createdAt:   FIXED_DATE,
};

export const conversionSummaryFixture = {
  totalConversions:   84,
  conversionRate:     0.067,
  totalRevenue:       1260000,
  avgOrderValue:      15000,
  byGoalType: [
    { goalType: 'APPOINTMENT',      count: 42, conversionRate: 0.034, totalValue: 0 },
    { goalType: 'BROCHURE_REQUEST', count: 28, conversionRate: 0.022, totalValue: 0 },
    { goalType: 'QUOTE_REQUEST',    count: 18, conversionRate: 0.014, totalValue: 0 },
    { goalType: 'ORDER',            count: 8,  conversionRate: 0.006, totalValue: 1260000 },
  ],
  bySource: [
    { source: 'google',    medium: 'cpc',    conversions: 38, revenue: 720000  },
    { source: 'direct',    medium: null,     conversions: 22, revenue: 300000  },
    { source: 'email',     medium: 'email',  conversions: 14, revenue: 180000  },
    { source: 'instagram', medium: 'social', conversions: 10, revenue: 60000   },
  ],
};

export const allConversionsFixture: IConversion[] = [
  appointmentConversionFixture,
  brochureConversionFixture,
  quoteConversionFixture,
  orderConversionFixture,
  accountCreatedConversionFixture,
];