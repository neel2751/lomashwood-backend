import type { NotificationProvider } from '@prisma/client';
import { FIXED_DATE, FIXED_UUIDS } from './common.fixture';

export const nodemailerProviderFixture: NotificationProvider = {
  id:                  FIXED_UUIDS.PROVIDER_1,
  name:                'nodemailer-smtp',
  type:                'SMTP',
  channel:             'EMAIL',
  status:              'ACTIVE',
  isDefault:           true,
  priority:            1,
  config:              {
    host:   'smtp.mailtrap.io',
    port:   587,
    secure: false,
    auth:   { user: 'test_user', pass: 'test_pass' },
  },
  rateLimitPerSecond:  10,
  rateLimitPerMinute:  300,
  rateLimitPerHour:    5000,
  rateLimitPerDay:     50000,
  lastHealthCheckAt:   FIXED_DATE,
  lastHealthStatus:    true,
  consecutiveFailures: 0,
  failoverAt:          null,
  createdAt:           FIXED_DATE,
  updatedAt:           FIXED_DATE,
  deletedAt:           null,
};

export const sesProviderFixture: NotificationProvider = {
  id:                  FIXED_UUIDS.PROVIDER_2,
  name:                'aws-ses',
  type:                'AWS_SES',
  channel:             'EMAIL',
  status:              'INACTIVE',
  isDefault:           false,
  priority:            2,
  config:              {
    region:       'eu-west-2',
    configSet:    'lomash-wood-transactional',
    fromAddress:  'noreply@lomashwood.co.uk',
  },
  rateLimitPerSecond:  14,
  rateLimitPerMinute:  840,
  rateLimitPerHour:    50000,
  rateLimitPerDay:     1000000,
  lastHealthCheckAt:   null,
  lastHealthStatus:    null,
  consecutiveFailures: 0,
  failoverAt:          null,
  createdAt:           FIXED_DATE,
  updatedAt:           FIXED_DATE,
  deletedAt:           null,
};

export const twilioProviderFixture: NotificationProvider = {
  id:                  'clxprov30000000000000000003',
  name:                'twilio-sms',
  type:                'TWILIO',
  channel:             'SMS',
  status:              'ACTIVE',
  isDefault:           true,
  priority:            1,
  config:              {
    accountSid:          'AC_TEST_SID',
    messagingServiceSid: 'MG_TEST_SID',
    from:                '+441234567890',
  },
  rateLimitPerSecond:  1,
  rateLimitPerMinute:  60,
  rateLimitPerHour:    3600,
  rateLimitPerDay:     86400,
  lastHealthCheckAt:   FIXED_DATE,
  lastHealthStatus:    true,
  consecutiveFailures: 0,
  failoverAt:          null,
  createdAt:           FIXED_DATE,
  updatedAt:           FIXED_DATE,
  deletedAt:           null,
};

export const firebaseProviderFixture: NotificationProvider = {
  id:                  'clxprov40000000000000000004',
  name:                'firebase-fcm',
  type:                'FIREBASE_FCM',
  channel:             'PUSH',
  status:              'ACTIVE',
  isDefault:           true,
  priority:            1,
  config:              {
    projectId:    'lomash-wood-test',
    clientEmail:  'firebase@lomash-wood-test.iam.gserviceaccount.com',
  },
  rateLimitPerSecond:  500,
  rateLimitPerMinute:  20000,
  rateLimitPerHour:    null,
  rateLimitPerDay:     null,
  lastHealthCheckAt:   FIXED_DATE,
  lastHealthStatus:    true,
  consecutiveFailures: 0,
  failoverAt:          null,
  createdAt:           FIXED_DATE,
  updatedAt:           FIXED_DATE,
  deletedAt:           null,
};

export const degradedProviderFixture: NotificationProvider = {
  ...nodemailerProviderFixture,
  id:                  'clxprov50000000000000000005',
  name:                'nodemailer-degraded',
  status:              'DEGRADED',
  consecutiveFailures: 5,
  lastHealthStatus:    false,
  failoverAt:          FIXED_DATE,
};

export const allProvidersFixture: NotificationProvider[] = [
  nodemailerProviderFixture,
  sesProviderFixture,
  twilioProviderFixture,
  firebaseProviderFixture,
];