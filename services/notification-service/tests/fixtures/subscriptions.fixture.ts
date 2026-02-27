import type { NotificationSubscription } from '@prisma/client';
import { FIXED_DATE, FIXED_UUIDS, FIXED_EMAILS, FIXED_PHONES, FIXED_PUSH_TOKENS } from './common.fixture';

export const emailSubscriptionFixture: NotificationSubscription = {
  id:             FIXED_UUIDS.SUBSCRIPTION_1,
  userId:         FIXED_UUIDS.USER_1,
  channel:        'EMAIL',
  status:         'SUBSCRIBED',
  address:        FIXED_EMAILS.CUSTOMER_1,
  deviceId:       null,
  deviceType:     null,
  pushToken:      null,
  confirmedAt:    FIXED_DATE,
  unsubscribedAt: null,
  bouncedAt:      null,
  createdAt:      FIXED_DATE,
  updatedAt:      FIXED_DATE,
};

export const smsSubscriptionFixture: NotificationSubscription = {
  id:             FIXED_UUIDS.SUBSCRIPTION_2,
  userId:         FIXED_UUIDS.USER_1,
  channel:        'SMS',
  status:         'SUBSCRIBED',
  address:        FIXED_PHONES.UK_1,
  deviceId:       null,
  deviceType:     null,
  pushToken:      null,
  confirmedAt:    FIXED_DATE,
  unsubscribedAt: null,
  bouncedAt:      null,
  createdAt:      FIXED_DATE,
  updatedAt:      FIXED_DATE,
};

export const pushSubscriptionFixture: NotificationSubscription = {
  id:             'clxsubs30000000000000000003',
  userId:         FIXED_UUIDS.USER_1,
  channel:        'PUSH',
  status:         'SUBSCRIBED',
  address:        FIXED_PUSH_TOKENS.FCM_1,
  deviceId:       'device_001_ios',
  deviceType:     'ios',
  pushToken:      FIXED_PUSH_TOKENS.FCM_1,
  confirmedAt:    FIXED_DATE,
  unsubscribedAt: null,
  bouncedAt:      null,
  createdAt:      FIXED_DATE,
  updatedAt:      FIXED_DATE,
};

export const unsubscribedEmailSubscriptionFixture: NotificationSubscription = {
  ...emailSubscriptionFixture,
  id:             'clxsubs40000000000000000004',
  userId:         FIXED_UUIDS.USER_2,
  address:        FIXED_EMAILS.CUSTOMER_2,
  status:         'UNSUBSCRIBED',
  unsubscribedAt: FIXED_DATE,
};

export const bouncedEmailSubscriptionFixture: NotificationSubscription = {
  ...emailSubscriptionFixture,
  id:        'clxsubs50000000000000000005',
  address:   'bounced@example.com',
  status:    'BOUNCED',
  bouncedAt: FIXED_DATE,
};

export const pendingEmailSubscriptionFixture: NotificationSubscription = {
  ...emailSubscriptionFixture,
  id:          'clxsubs60000000000000000006',
  address:     'pending@example.com',
  status:      'PENDING',
  confirmedAt: null,
};

export const allSubscriptionsFixture: NotificationSubscription[] = [
  emailSubscriptionFixture,
  smsSubscriptionFixture,
  pushSubscriptionFixture,
  unsubscribedEmailSubscriptionFixture,
];