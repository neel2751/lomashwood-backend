import { NotificationPreference } from '@prisma/client';
import { FIXED_DATE, FIXED_IDS } from './common.fixture';

export const notificationPreferenceFixtures = {
  allOff: {
    id: 'npf-00000000-0000-0000-0000-000000000001',
    customerId: FIXED_IDS.customer1,
    emailOrder: true,
    emailMarketing: false,
    emailNewsletter: false,
    emailReview: true,
    smsOrder: false,
    smsMarketing: false,
    pushOrder: false,
    pushMarketing: false,
    createdAt: FIXED_DATE,
    updatedAt: FIXED_DATE,
  } satisfies NotificationPreference,

  allOn: {
    id: 'npf-00000000-0000-0000-0000-000000000002',
    customerId: FIXED_IDS.customer2,
    emailOrder: true,
    emailMarketing: true,
    emailNewsletter: true,
    emailReview: true,
    smsOrder: true,
    smsMarketing: true,
    pushOrder: true,
    pushMarketing: true,
    createdAt: FIXED_DATE,
    updatedAt: FIXED_DATE,
  } satisfies NotificationPreference,
};

export const updatePreferencesDto = {
  emailOrder: true,
  emailMarketing: true,
  emailNewsletter: false,
  emailReview: true,
  smsOrder: false,
  smsMarketing: false,
  pushOrder: true,
  pushMarketing: false,
};