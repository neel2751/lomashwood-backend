import { BOOKING_STATUS } from '../../src/shared/constants';
import { BookingEntity } from '../../src/shared/types';
import { FIXED_DATE_NOW, FIXED_IDS, futureDate } from './common.fixture';
import { bookingShowroomKitchenFixture } from './bookings.fixture';



export const reschedulePayload = {
  bookingId: FIXED_IDS.bookingId,
  newSlotId: FIXED_IDS.rescheduleSlotId,
};

export const rescheduledBookingFixture: BookingEntity = {
  ...bookingShowroomKitchenFixture,
  id: 'a2a2a2a2-a2a2-4a2a-aa2a-a2a2a2a2a2a2',
  slotId: FIXED_IDS.rescheduleSlotId,
  slotDate: futureDate(14),
  slotStartTime: '10:00',
  slotEndTime: '11:00',
  status: BOOKING_STATUS.CONFIRMED,
  rescheduledFromId: FIXED_IDS.bookingId,
  updatedAt: FIXED_DATE_NOW,
};

export const originalBookingAfterRescheduleFixture: BookingEntity = {
  ...bookingShowroomKitchenFixture,
  status: BOOKING_STATUS.RESCHEDULED,
  updatedAt: FIXED_DATE_NOW,
};

export const rescheduleEventPayload = {
  originalBookingId: FIXED_IDS.bookingId,
  newBookingId: 'a2a2a2a2-a2a2-4a2a-aa2a-a2a2a2a2a2a2',
  customerId: FIXED_IDS.customerId,
  consultantId: FIXED_IDS.consultantId,
  previousSlotId: FIXED_IDS.slotId,
  previousSlotDate: futureDate(7),
  previousSlotStartTime: '10:00',
  newSlotId: FIXED_IDS.rescheduleSlotId,
  newSlotDate: futureDate(14),
  newSlotStartTime: '10:00',
  rescheduledAt: FIXED_DATE_NOW,
};

export const rescheduleToSameSlotPayload = {
  bookingId: FIXED_IDS.bookingId,
  newSlotId: FIXED_IDS.slotId,
};

export const rescheduleCompletedBookingPayload = {
  bookingId: 'e1e1e1e1-e1e1-4e1e-ae1e-e1e1e1e1e1e1',
  newSlotId: FIXED_IDS.rescheduleSlotId,
};



interface ReschedulePayloadOverrides {
  bookingId: string;
  newTimeSlotId: string;
  reason: string;
}

export const rescheduelsFixture = {
  
  
  createPayload: (overrides: ReschedulePayloadOverrides) => ({
    bookingId:     overrides.bookingId,
    newTimeSlotId: overrides.newTimeSlotId,
    reason:        overrides.reason,
  }),
};


export { rescheduelsFixture as reschedulesFixture };