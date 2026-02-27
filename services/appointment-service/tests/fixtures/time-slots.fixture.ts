import { SLOT_STATUS } from '../../src/shared/constants';
import { SlotEntity } from '../../src/shared/types';
import { FIXED_DATE_NOW, FIXED_IDS, futureDate } from './common.fixture';

export const slotAvailableFixture: SlotEntity = {
  id: FIXED_IDS.slotId,
  consultantId: FIXED_IDS.consultantId,
  date: futureDate(7),
  startTime: '10:00',
  endTime: '11:00',
  status: SLOT_STATUS.AVAILABLE,
  bookingId: null,
  showroomId: FIXED_IDS.showroomId,
  createdAt: FIXED_DATE_NOW,
  updatedAt: FIXED_DATE_NOW,
  deletedAt: null,
};

export const slotAvailableAfternoonFixture: SlotEntity = {
  id: '80808080-8080-4080-a080-808080808080',
  consultantId: FIXED_IDS.consultantId,
  date: futureDate(7),
  startTime: '14:00',
  endTime: '15:00',
  status: SLOT_STATUS.AVAILABLE,
  bookingId: null,
  showroomId: FIXED_IDS.showroomId,
  createdAt: FIXED_DATE_NOW,
  updatedAt: FIXED_DATE_NOW,
  deletedAt: null,
};

export const slotBookedFixture: SlotEntity = {
  id: FIXED_IDS.secondSlotId,
  consultantId: FIXED_IDS.consultantId,
  date: futureDate(7),
  startTime: '11:00',
  endTime: '12:00',
  status: SLOT_STATUS.BOOKED,
  bookingId: FIXED_IDS.bookingId,
  showroomId: FIXED_IDS.showroomId,
  createdAt: FIXED_DATE_NOW,
  updatedAt: FIXED_DATE_NOW,
  deletedAt: null,
};

export const slotBlockedFixture: SlotEntity = {
  id: '90909090-9090-4090-a090-909090909090',
  consultantId: FIXED_IDS.consultantId,
  date: futureDate(7),
  startTime: '13:00',
  endTime: '14:00',
  status: SLOT_STATUS.BLOCKED,
  bookingId: null,
  showroomId: FIXED_IDS.showroomId,
  createdAt: FIXED_DATE_NOW,
  updatedAt: FIXED_DATE_NOW,
  deletedAt: null,
};

export const slotOnlineFixture: SlotEntity = {
  id: 'a0a0a0a0-a0a0-4a0a-aa0a-a0a0a0a0a0a0',
  consultantId: FIXED_IDS.secondConsultantId,
  date: futureDate(5),
  startTime: '14:00',
  endTime: '15:00',
  status: SLOT_STATUS.AVAILABLE,
  bookingId: null,
  showroomId: null,
  createdAt: FIXED_DATE_NOW,
  updatedAt: FIXED_DATE_NOW,
  deletedAt: null,
};

export const slotRescheduleTargetFixture: SlotEntity = {
  id: FIXED_IDS.rescheduleSlotId,
  consultantId: FIXED_IDS.consultantId,
  date: futureDate(14),
  startTime: '10:00',
  endTime: '11:00',
  status: SLOT_STATUS.AVAILABLE,
  bookingId: null,
  showroomId: FIXED_IDS.showroomId,
  createdAt: FIXED_DATE_NOW,
  updatedAt: FIXED_DATE_NOW,
  deletedAt: null,
};

export const availableSlotsListFixture: SlotEntity[] = [
  slotAvailableFixture,
  slotAvailableAfternoonFixture,
  slotOnlineFixture,
];

export const createSlotPayload = {
  consultantId: FIXED_IDS.consultantId,
  date: futureDate(7),
  startTime: '10:00',
  endTime: '11:00',
  showroomId: FIXED_IDS.showroomId,
};

export const timeSlotFixtures = {
  available: (overrides: { consultantId: string }) => ({
    consultantId: overrides.consultantId,
    startTime:    new Date(Date.now() + 86400000),
    endTime:      new Date(Date.now() + 86400000 + 3600000),
    isAvailable:  true,
  }),

  booked: (overrides: { consultantId: string }) => ({
    consultantId: overrides.consultantId,
    startTime:    new Date(Date.now() + 86400000 + 7200000),
    endTime:      new Date(Date.now() + 86400000 + 10800000),
    isAvailable:  false,
  }),

  createPayload: (overrides: { consultantId: string }) => ({
    consultantId: overrides.consultantId,
    startTime:    new Date(Date.now() + 86400000).toISOString(),
    endTime:      new Date(Date.now() + 86400000 + 3600000).toISOString(),
    isAvailable:  true,
  }),

  createPast: (overrides: { consultantId: string }) => ({
    consultantId: overrides.consultantId,
    startTime:    new Date(Date.now() - 7200000).toISOString(),
    endTime:      new Date(Date.now() - 3600000).toISOString(),
    isAvailable:  true,
  }),

  bulkCreatePayload: (overrides: { consultantId: string; count: number }) => ({
    consultantId: overrides.consultantId,
    slots: Array.from({ length: overrides.count }, (_, i) => ({
      startTime: new Date(Date.now() + 86400000 * (i + 2)).toISOString(),
      endTime:   new Date(Date.now() + 86400000 * (i + 2) + 3600000).toISOString(),
    })),
  }),
};