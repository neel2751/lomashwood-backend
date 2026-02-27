import type { Campaign } from '@prisma/client';
import { FIXED_DATE, FIXED_FUTURE_DATE, FIXED_UUIDS } from './common.fixture';

export const draftCampaignFixture: Campaign = {
  id:                 FIXED_UUIDS.CAMPAIGN_1,
  name:               'Spring Kitchen Collection Launch',
  description:        'Announcing the new spring kitchen range to all subscribers.',
  channel:            'EMAIL',
  status:             'DRAFT',
  audienceType:       'ALL_USERS',
  audienceFilter:     null,
  audienceList:       null,
  scheduledAt:        null,
  startedAt:          null,
  completedAt:        null,
  cancelledAt:        null,
  totalRecipients:    0,
  totalSent:          0,
  totalDelivered:     0,
  totalFailed:        0,
  totalOpened:        0,
  totalClicked:       0,
  totalBounced:       0,
  totalUnsubscribed:  0,
  createdBy:          FIXED_UUIDS.ADMIN_1,
  updatedBy:          null,
  createdAt:          FIXED_DATE,
  updatedAt:          FIXED_DATE,
  deletedAt:          null,
};

export const scheduledCampaignFixture: Campaign = {
  ...draftCampaignFixture,
  id:          'clxcamp20000000000000000002',
  name:        'Bedroom Summer Sale Notification',
  status:      'SCHEDULED',
  scheduledAt: FIXED_FUTURE_DATE,
};

export const runningCampaignFixture: Campaign = {
  ...draftCampaignFixture,
  id:              'clxcamp30000000000000000003',
  name:            'Newsletter – January Inspiration',
  channel:         'EMAIL',
  status:          'RUNNING',
  scheduledAt:     FIXED_DATE,
  startedAt:       FIXED_DATE,
  totalRecipients: 2500,
  totalSent:       1200,
  totalDelivered:  1150,
  totalFailed:     50,
  totalOpened:     430,
  totalClicked:    85,
};

export const completedCampaignFixture: Campaign = {
  ...draftCampaignFixture,
  id:               'clxcamp40000000000000000004',
  name:             'Black Friday Kitchen Deals',
  status:           'COMPLETED',
  scheduledAt:      FIXED_DATE,
  startedAt:        FIXED_DATE,
  completedAt:      FIXED_DATE,
  totalRecipients:  5000,
  totalSent:        4950,
  totalDelivered:   4800,
  totalFailed:      150,
  totalOpened:      1920,
  totalClicked:     384,
  totalBounced:     50,
  totalUnsubscribed: 12,
};

export const cancelledCampaignFixture: Campaign = {
  ...scheduledCampaignFixture,
  id:          'clxcamp50000000000000000005',
  name:        'Cancelled Campaign',
  status:      'CANCELLED',
  cancelledAt: FIXED_DATE,
};

export const smsCampaignFixture: Campaign = {
  ...draftCampaignFixture,
  id:      'clxcamp60000000000000000006',
  name:    'Appointment Reminder Blast',
  channel: 'SMS',
  status:  'SCHEDULED',
  scheduledAt: FIXED_FUTURE_DATE,
  audienceType: 'SEGMENT',
  audienceFilter: { hasUpcomingAppointment: true, daysUntilAppointment: 1 },
};

export const segmentCampaignFixture: Campaign = {
  ...draftCampaignFixture,
  id:             'clxcamp70000000000000000007',
  name:           'Kitchen Wishlist Re-engagement',
  audienceType:   'SEGMENT',
  audienceFilter: { hasWishlistItems: true, category: 'KITCHEN', inactiveDays: 30 },
};

export const allCampaignsFixture: Campaign[] = [
  draftCampaignFixture,
  scheduledCampaignFixture,
  runningCampaignFixture,
  completedCampaignFixture,
  cancelledCampaignFixture,
];