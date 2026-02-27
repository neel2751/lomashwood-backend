import type { WebhookEvent } from '@prisma/client';
import { FIXED_DATE, FIXED_UUIDS } from './common.fixture';

export const deliveredWebhookFixture: WebhookEvent = {
  id:             FIXED_UUIDS.WEBHOOK_1,
  notificationId: 'clxnotif3000000000000000003',
  provider:       'nodemailer-smtp',
  eventType:      'DELIVERED',
  payload:        {
    event:             'delivered',
    messageId:         'provider_msg_id_001',
    timestamp:         FIXED_DATE.toISOString(),
    recipient:         'john.doe@example.com',
  },
  processed:    true,
  processedAt:  FIXED_DATE,
  error:        null,
  createdAt:    FIXED_DATE,
  updatedAt:    FIXED_DATE,
};

export const openedWebhookFixture: WebhookEvent = {
  id:             'clxwebhk2000000000000000002',
  notificationId: 'clxnotif3000000000000000003',
  provider:       'aws-ses',
  eventType:      'OPENED',
  payload:        {
    event:     'open',
    messageId: 'provider_msg_id_001',
    timestamp: FIXED_DATE.toISOString(),
    ipAddress: '1.2.3.4',
    userAgent: 'Mozilla/5.0',
  },
  processed:   true,
  processedAt: FIXED_DATE,
  error:       null,
  createdAt:   FIXED_DATE,
  updatedAt:   FIXED_DATE,
};

export const clickedWebhookFixture: WebhookEvent = {
  id:             'clxwebhk3000000000000000003',
  notificationId: 'clxnotif3000000000000000003',
  provider:       'aws-ses',
  eventType:      'CLICKED',
  payload:        {
    event:     'click',
    messageId: 'provider_msg_id_001',
    timestamp: FIXED_DATE.toISOString(),
    link:      'https://lomashwood.co.uk/products',
  },
  processed:   true,
  processedAt: FIXED_DATE,
  error:       null,
  createdAt:   FIXED_DATE,
  updatedAt:   FIXED_DATE,
};

export const bouncedWebhookFixture: WebhookEvent = {
  id:             'clxwebhk4000000000000000004',
  notificationId: 'clxnotif5000000000000000005',
  provider:       'aws-ses',
  eventType:      'BOUNCED',
  payload:        {
    event:        'bounce',
    messageId:    'provider_msg_id_bounce_001',
    timestamp:    FIXED_DATE.toISOString(),
    bounceType:   'Permanent',
    bounceSubType:'General',
    recipient:    'invalid@example.com',
  },
  processed:   true,
  processedAt: FIXED_DATE,
  error:       null,
  createdAt:   FIXED_DATE,
  updatedAt:   FIXED_DATE,
};

export const unprocessedWebhookFixture: WebhookEvent = {
  id:             'clxwebhk5000000000000000005',
  notificationId: 'clxnotif4000000000000000004',
  provider:       'twilio',
  eventType:      'DELIVERED',
  payload:        {
    MessageSid:    'SM_twilio_new_001',
    MessageStatus: 'delivered',
    To:            '+441234567890',
  },
  processed:   false,
  processedAt: null,
  error:       null,
  createdAt:   FIXED_DATE,
  updatedAt:   FIXED_DATE,
};

export const failedWebhookFixture: WebhookEvent = {
  id:             'clxwebhk6000000000000000006',
  notificationId: null,
  provider:       'aws-ses',
  eventType:      'FAILED',
  payload:        {
    event:     'failed',
    messageId: 'provider_msg_id_unknown',
    timestamp: FIXED_DATE.toISOString(),
  },
  processed:   false,
  processedAt: null,
  error:       'Notification record not found for messageId: provider_msg_id_unknown',
  createdAt:   FIXED_DATE,
  updatedAt:   FIXED_DATE,
};

export const allWebhooksFixture: WebhookEvent[] = [
  deliveredWebhookFixture,
  openedWebhookFixture,
  clickedWebhookFixture,
  bouncedWebhookFixture,
  unprocessedWebhookFixture,
];