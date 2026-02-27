import { BOOKING_STATUS } from '../../src/shared/constants';
import { BookingEntity } from '../../src/shared/types';
import { CUSTOMER_DETAILS, FIXED_DATE_NOW, FIXED_IDS, futureDate, pastDate } from './common.fixture';
import { bookingShowroomKitchenFixture } from './bookings.fixture';



export const cancellationByCustomerPayload = {
  bookingId: FIXED_IDS.bookingId,
  cancellationReason: 'Change of plans, no longer require a kitchen consultation.',
};

export const cancellationByAdminPayload = {
  bookingId: FIXED_IDS.bookingId,
  cancellationReason: 'Consultant unavailable due to illness.',
};

export const cancelledBookingFixture: BookingEntity = {
  ...bookingShowroomKitchenFixture,
  status: BOOKING_STATUS.CANCELLED,
  cancellationReason: 'Change of plans, no longer require a kitchen consultation.',
  updatedAt: FIXED_DATE_NOW,
};

export const cancelledBookingByAdminFixture: BookingEntity = {
  ...bookingShowroomKitchenFixture,
  id: 'd2d2d2d2-d2d2-4d2d-ad2d-d2d2d2d2d2d2',
  status: BOOKING_STATUS.CANCELLED,
  cancellationReason: 'Consultant unavailable due to illness.',
  updatedAt: FIXED_DATE_NOW,
};

export const cancelledBookingWithinWindowFixture: BookingEntity = {
  ...bookingShowroomKitchenFixture,
  id: 'e2e2e2e2-e2e2-4e2e-ae2e-e2e2e2e2e2e2',
  slotDate: futureDate(2),
  status: BOOKING_STATUS.CANCELLED,
  cancellationReason: 'Customer requested last-minute cancellation.',
  updatedAt: FIXED_DATE_NOW,
};

export const alreadyCancelledBookingFixture: BookingEntity = {
  ...bookingShowroomKitchenFixture,
  id: 'f2f2f2f2-f2f2-4f2f-af2f-f2f2f2f2f2f2',
  status: BOOKING_STATUS.CANCELLED,
  cancellationReason: 'Previously cancelled.',
  updatedAt: pastDate(2),
};

export const cancellationEventPayload = {
  bookingId: FIXED_IDS.bookingId,
  customerId: FIXED_IDS.customerId,
  consultantId: FIXED_IDS.consultantId,
  slotId: FIXED_IDS.slotId,
  cancellationReason: 'Change of plans, no longer require a kitchen consultation.',
  cancelledAt: FIXED_DATE_NOW,
  cancelledByCustomer: true,
};



interface CancellationPayloadOverrides {
  bookingId: string;
  reason: string;
}

export const cancellationsFixture = {
  
  createPayload: (overrides: CancellationPayloadOverrides) => ({
    bookingId: overrides.bookingId,
    reason:    overrides.reason,
  }),
};