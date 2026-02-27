import type { NotificationPreference } from '@prisma/client';
import { FIXED_DATE, FIXED_UUIDS } from './common.fixture';

export const appointmentEmailPreferenceFixture: NotificationPreference = {
  id:                   FIXED_UUIDS.PREFERENCE_1,
  userId:               FIXED_UUIDS.USER_1,
  subscriptionId:       FIXED_UUIDS.SUBSCRIPTION_1,
  category:             'APPOINTMENT_CONFIRMATION',
  channel:              'EMAIL',
  enabled:              true,
  quietHoursEnabled:    false,
  quietHoursStart:      null,
  quietHoursEnd:        null,
  timezone:             'Europe/London',
  createdAt:            FIXED_DATE,
  updatedAt:            FIXED_DATE,
};

export const appointmentSmsPreferenceFixture: NotificationPreference = {
  id:                   'clxpref20000000000000000002',
  userId:               FIXED_UUIDS.USER_1,
  subscriptionId:       FIXED_UUIDS.SUBSCRIPTION_2,
  category:             'APPOINTMENT_CONFIRMATION',
  channel:              'SMS',
  enabled:              true,
  quietHoursEnabled:    true,
  quietHoursStart:      '22:00',
  quietHoursEnd:        '08:00',
  timezone:             'Europe/London',
  createdAt:            FIXED_DATE,
  updatedAt:            FIXED_DATE,
};

export const disabledMarketingEmailPreferenceFixture: NotificationPreference = {
  id:                   'clxpref30000000000000000003',
  userId:               FIXED_UUIDS.USER_1,
  subscriptionId:       FIXED_UUIDS.SUBSCRIPTION_1,
  category:             'NEWSLETTER_CAMPAIGN',
  channel:              'EMAIL',
  enabled:              false,
  quietHoursEnabled:    false,
  quietHoursStart:      null,
  quietHoursEnd:        null,
  timezone:             'Europe/London',
  createdAt:            FIXED_DATE,
  updatedAt:            FIXED_DATE,
};

export const orderEmailPreferenceFixture: NotificationPreference = {
  id:                   'clxpref40000000000000000004',
  userId:               FIXED_UUIDS.USER_2,
  subscriptionId:       null,
  category:             'ORDER_CONFIRMATION',
  channel:              'EMAIL',
  enabled:              true,
  quietHoursEnabled:    false,
  quietHoursStart:      null,
  quietHoursEnd:        null,
  timezone:             'Europe/London',
  createdAt:            FIXED_DATE,
  updatedAt:            FIXED_DATE,
};

export const allPreferencesFixture: NotificationPreference[] = [
  appointmentEmailPreferenceFixture,
  appointmentSmsPreferenceFixture,
  disabledMarketingEmailPreferenceFixture,
  orderEmailPreferenceFixture,
];