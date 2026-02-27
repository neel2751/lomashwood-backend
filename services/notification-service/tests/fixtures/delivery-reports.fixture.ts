import type { DeliveryReport } from '@prisma/client';
import { FIXED_DATE, FIXED_UUIDS } from './common.fixture';

export const deliveredEmailReportFixture: DeliveryReport = {
  id:                FIXED_UUIDS.DELIVERY_1,
  notificationId:    'clxnotif3000000000000000003',
  providerId:        FIXED_UUIDS.PROVIDER_1,
  status:            'DELIVERED',
  providerMessageId: 'provider_msg_id_001',
  providerTimestamp: FIXED_DATE,
  providerRaw:       { event: 'delivered', timestamp: FIXED_DATE.toISOString() },
  openedAt:          null,
  clickedAt:         null,
  bouncedAt:         null,
  bounceType:        null,
  bounceReason:      null,
  complainedAt:      null,
  unsubscribedAt:    null,
  segments:          null,
  units:             null,
  createdAt:         FIXED_DATE,
  updatedAt:         FIXED_DATE,
};

export const openedEmailReportFixture: DeliveryReport = {
  ...deliveredEmailReportFixture,
  id:        'clxdeliv2000000000000000002',
  status:    'DELIVERED',
  openedAt:  FIXED_DATE,
  clickedAt: FIXED_DATE,
};

export const hardBouncedEmailReportFixture: DeliveryReport = {
  ...deliveredEmailReportFixture,
  id:           'clxdeliv3000000000000000003',
  status:       'BOUNCED',
  bouncedAt:    FIXED_DATE,
  bounceType:   'hard',
  bounceReason: 'User does not exist.',
  providerRaw:  { event: 'bounced', type: 'hard', reason: 'User does not exist.' },
};

export const softBouncedEmailReportFixture: DeliveryReport = {
  ...deliveredEmailReportFixture,
  id:           'clxdeliv4000000000000000004',
  status:       'BOUNCED',
  bouncedAt:    FIXED_DATE,
  bounceType:   'soft',
  bounceReason: 'Mailbox full.',
  providerRaw:  { event: 'bounced', type: 'soft', reason: 'Mailbox full.' },
};

export const complainedEmailReportFixture: DeliveryReport = {
  ...deliveredEmailReportFixture,
  id:           'clxdeliv5000000000000000005',
  status:       'COMPLAINED',
  complainedAt: FIXED_DATE,
  providerRaw:  { event: 'complained', timestamp: FIXED_DATE.toISOString() },
};

export const unsubscribedEmailReportFixture: DeliveryReport = {
  ...deliveredEmailReportFixture,
  id:              'clxdeliv6000000000000000006',
  status:          'UNSUBSCRIBED',
  unsubscribedAt:  FIXED_DATE,
  providerRaw:     { event: 'unsubscribed', timestamp: FIXED_DATE.toISOString() },
};

export const deliveredSmsReportFixture: DeliveryReport = {
  id:                'clxdeliv7000000000000000007',
  notificationId:    'clxnotif8000000000000000008',
  providerId:        'clxprov30000000000000000003',
  status:            'DELIVERED',
  providerMessageId: 'SM_twilio_message_id_001',
  providerTimestamp: FIXED_DATE,
  providerRaw:       { sid: 'SM_twilio_message_id_001', status: 'delivered' },
  openedAt:          null,
  clickedAt:         null,
  bouncedAt:         null,
  bounceType:        null,
  bounceReason:      null,
  complainedAt:      null,
  unsubscribedAt:    null,
  segments:          1,
  units:             1,
  createdAt:         FIXED_DATE,
  updatedAt:         FIXED_DATE,
};

export const failedSmsReportFixture: DeliveryReport = {
  ...deliveredSmsReportFixture,
  id:               'clxdeliv8000000000000000008',
  status:           'FAILED',
  providerRaw:      { sid: 'SM_failed_id_001', status: 'failed', errorCode: '30006' },
};

export const allDeliveryReportsFixture: DeliveryReport[] = [
  deliveredEmailReportFixture,
  openedEmailReportFixture,
  hardBouncedEmailReportFixture,
  deliveredSmsReportFixture,
];