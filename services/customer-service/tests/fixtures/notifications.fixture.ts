import { FIXED_DATE, FIXED_IDS } from './common.fixture';

export interface NotificationEntry {
  id: string;
  customerId: string;
  type: string;
  channel: 'EMAIL' | 'SMS' | 'PUSH';
  subject?: string;
  body: string;
  sentAt: Date | null;
  read: boolean;
  metadata: Record<string, unknown> | null;
  createdAt: Date;
}

export const notificationFixtures: Record<string, NotificationEntry> = {
  orderEmailSent: {
    id: 'not-00000000-0000-0000-0000-000000000001',
    customerId: FIXED_IDS.customer1,
    type: 'ORDER_CONFIRMED',
    channel: 'EMAIL',
    subject: 'Your order has been confirmed',
    body: 'Thank you for your order. Your items are being prepared.',
    sentAt: FIXED_DATE,
    read: true,
    metadata: { orderId: FIXED_IDS.order1 },
    createdAt: FIXED_DATE,
  },

  loyaltyPushPending: {
    id: 'not-00000000-0000-0000-0000-000000000002',
    customerId: FIXED_IDS.customer1,
    type: 'LOYALTY_POINTS_EARNED',
    channel: 'PUSH',
    subject: undefined,
    body: "You've earned 125 points! Your balance is now 375.",
    sentAt: null,
    read: false,
    metadata: { points: 125, newBalance: 375 },
    createdAt: FIXED_DATE,
  },

  supportSmsSent: {
    id: 'not-00000000-0000-0000-0000-000000000003',
    customerId: FIXED_IDS.customer2,
    type: 'TICKET_REPLY',
    channel: 'SMS',
    subject: undefined,
    body: 'Your support ticket TKT-ABCD1234 has been updated. Reply STOP to opt out.',
    sentAt: FIXED_DATE,
    read: false,
    metadata: { ticketRef: 'TKT-ABCD1234' },
    createdAt: FIXED_DATE,
  },
};

export const notificationChannelPreferencesFixture = {
  email: { subscribed: true, unsubscribedCategories: ['MARKETING'] },
  sms: { subscribed: false, unsubscribedCategories: [] },
  push: { subscribed: true, unsubscribedCategories: [] },
};