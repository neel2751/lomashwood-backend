import { REMINDER_CHANNEL, REMINDER_STATUS, REMINDER_TYPE } from '../../src/shared/constants';
import { ReminderEntity } from '../../src/shared/types';
import { FIXED_DATE_NOW, FIXED_IDS, futureDate, futureDateWithTime } from './common.fixture';



export const reminder24hEmailFixture: ReminderEntity = {
  id: FIXED_IDS.reminderId,
  bookingId: FIXED_IDS.bookingId,
  customerId: FIXED_IDS.customerId,
  reminderType: REMINDER_TYPE.APPOINTMENT_24H,
  channel: REMINDER_CHANNEL.EMAIL,
  status: REMINDER_STATUS.PENDING,
  scheduledAt: futureDateWithTime(6, '10:00'),
  sentAt: null,
  deliveredAt: null,
  failedAt: null,
  failureReason: null,
  retryCount: 0,
  createdAt: FIXED_DATE_NOW,
  updatedAt: FIXED_DATE_NOW,
  deletedAt: null,
};

export const reminder1hEmailFixture: ReminderEntity = {
  id: 'b3b3b3b3-b3b3-4b3b-ab3b-b3b3b3b3b3b3',
  bookingId: FIXED_IDS.bookingId,
  customerId: FIXED_IDS.customerId,
  reminderType: REMINDER_TYPE.APPOINTMENT_1H,
  channel: REMINDER_CHANNEL.EMAIL,
  status: REMINDER_STATUS.PENDING,
  scheduledAt: futureDateWithTime(7, '09:00'),
  sentAt: null,
  deliveredAt: null,
  failedAt: null,
  failureReason: null,
  retryCount: 0,
  createdAt: FIXED_DATE_NOW,
  updatedAt: FIXED_DATE_NOW,
  deletedAt: null,
};

export const reminder24hSmsFixture: ReminderEntity = {
  id: 'c3c3c3c3-c3c3-4c3c-ac3c-c3c3c3c3c3c3',
  bookingId: FIXED_IDS.bookingId,
  customerId: FIXED_IDS.customerId,
  reminderType: REMINDER_TYPE.APPOINTMENT_24H,
  channel: REMINDER_CHANNEL.SMS,
  status: REMINDER_STATUS.PENDING,
  scheduledAt: futureDateWithTime(6, '10:00'),
  sentAt: null,
  deliveredAt: null,
  failedAt: null,
  failureReason: null,
  retryCount: 0,
  createdAt: FIXED_DATE_NOW,
  updatedAt: FIXED_DATE_NOW,
  deletedAt: null,
};

export const reminderSentFixture: ReminderEntity = {
  id: 'd3d3d3d3-d3d3-4d3d-ad3d-d3d3d3d3d3d3',
  bookingId: FIXED_IDS.bookingId,
  customerId: FIXED_IDS.customerId,
  reminderType: REMINDER_TYPE.APPOINTMENT_24H,
  channel: REMINDER_CHANNEL.EMAIL,
  status: REMINDER_STATUS.SENT,
  scheduledAt: futureDateWithTime(6, '10:00'),
  sentAt: FIXED_DATE_NOW,
  deliveredAt: null,
  failedAt: null,
  failureReason: null,
  retryCount: 0,
  createdAt: FIXED_DATE_NOW,
  updatedAt: FIXED_DATE_NOW,
  deletedAt: null,
};

export const reminderDeliveredFixture: ReminderEntity = {
  id: 'e3e3e3e3-e3e3-4e3e-ae3e-e3e3e3e3e3e3',
  bookingId: FIXED_IDS.bookingId,
  customerId: FIXED_IDS.customerId,
  reminderType: REMINDER_TYPE.APPOINTMENT_24H,
  channel: REMINDER_CHANNEL.EMAIL,
  status: REMINDER_STATUS.DELIVERED,
  scheduledAt: futureDateWithTime(6, '10:00'),
  sentAt: FIXED_DATE_NOW,
  deliveredAt: FIXED_DATE_NOW,
  failedAt: null,
  failureReason: null,
  retryCount: 0,
  createdAt: FIXED_DATE_NOW,
  updatedAt: FIXED_DATE_NOW,
  deletedAt: null,
};

export const reminderFailedFixture: ReminderEntity = {
  id: 'f3f3f3f3-f3f3-4f3f-af3f-f3f3f3f3f3f3',
  bookingId: FIXED_IDS.bookingId,
  customerId: FIXED_IDS.customerId,
  reminderType: REMINDER_TYPE.APPOINTMENT_24H,
  channel: REMINDER_CHANNEL.SMS,
  status: REMINDER_STATUS.FAILED,
  scheduledAt: futureDateWithTime(6, '10:00'),
  sentAt: null,
  deliveredAt: null,
  failedAt: FIXED_DATE_NOW,
  failureReason: 'SMS provider returned 503',
  retryCount: 3,
  createdAt: FIXED_DATE_NOW,
  updatedAt: FIXED_DATE_NOW,
  deletedAt: null,
};

export const reminderConfirmationFixture: ReminderEntity = {
  id: 'a3a3a3a3-a3a3-4a3a-aa3a-a3a3a3a3a3a3',
  bookingId: FIXED_IDS.bookingId,
  customerId: FIXED_IDS.customerId,
  reminderType: REMINDER_TYPE.APPOINTMENT_CONFIRMATION,
  channel: REMINDER_CHANNEL.EMAIL,
  status: REMINDER_STATUS.DELIVERED,
  scheduledAt: FIXED_DATE_NOW,
  sentAt: FIXED_DATE_NOW,
  deliveredAt: FIXED_DATE_NOW,
  failedAt: null,
  failureReason: null,
  retryCount: 0,
  createdAt: FIXED_DATE_NOW,
  updatedAt: FIXED_DATE_NOW,
  deletedAt: null,
};

export const pendingRemindersListFixture: ReminderEntity[] = [
  reminder24hEmailFixture,
  reminder1hEmailFixture,
  reminder24hSmsFixture,
];

export const bookingRemindersListFixture: ReminderEntity[] = [
  reminderConfirmationFixture,
  reminder24hEmailFixture,
  reminder24hSmsFixture,
  reminder1hEmailFixture,
];

export const createReminderPayload = {
  bookingId: FIXED_IDS.bookingId,
  customerId: FIXED_IDS.customerId,
  reminderType: REMINDER_TYPE.APPOINTMENT_24H,
  channel: REMINDER_CHANNEL.EMAIL,
  scheduledAt: futureDateWithTime(6, '10:00'),
};



interface ReminderPayloadOverrides {
  bookingId: string;
  channel: string;
  scheduledAt: string;
}

interface ReminderRawOverrides {
  bookingId: string;
  status?: string;
}

export const remindersFixture = {
  
  createPayload: (overrides: ReminderPayloadOverrides) => ({
    bookingId:   overrides.bookingId,
    channel:     overrides.channel,
    scheduledAt: overrides.scheduledAt,
  }),

  
  raw: (overrides: ReminderRawOverrides) => ({
    bookingId:    overrides.bookingId,
    channel:      REMINDER_CHANNEL.EMAIL,
    reminderType: REMINDER_TYPE.APPOINTMENT_24H,
    status:       overrides.status ?? REMINDER_STATUS.PENDING,
    scheduledAt:  new Date(Date.now() + 3600000),
    retryCount:   0,
  }),
};