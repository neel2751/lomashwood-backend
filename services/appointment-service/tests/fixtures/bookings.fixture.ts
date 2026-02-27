import { APPOINTMENT_TYPE, BOOKING_STATUS } from '../../src/shared/constants';
import { BookingEntity, CreateBookingInput } from '../../src/shared/types';
import { CUSTOMER_DETAILS, FIXED_DATE_NOW, FIXED_IDS, futureDate } from './common.fixture';



export const bookingShowroomKitchenFixture: BookingEntity = {
  id: FIXED_IDS.bookingId,
  ...CUSTOMER_DETAILS,
  appointmentType: APPOINTMENT_TYPE.SHOWROOM,
  isKitchen: true,
  isBedroom: false,
  slotId: FIXED_IDS.slotId,
  slotDate: futureDate(7),
  slotStartTime: '10:00',
  slotEndTime: '11:00',
  consultantId: FIXED_IDS.consultantId,
  showroomId: FIXED_IDS.showroomId,
  status: BOOKING_STATUS.CONFIRMED,
  cancellationReason: null,
  rescheduledFromId: null,
  notes: null,
  confirmationEmailSentAt: FIXED_DATE_NOW,
  internalNotificationSentAt: FIXED_DATE_NOW,
  createdAt: FIXED_DATE_NOW,
  updatedAt: FIXED_DATE_NOW,
  deletedAt: null,
};

export const bookingShowroomBedroomFixture: BookingEntity = {
  id: FIXED_IDS.secondBookingId,
  ...CUSTOMER_DETAILS,
  customerId: 'f1f1f1f1-f1f1-4f1f-af1f-f1f1f1f1f1f1',
  customerName: 'Laura Bennett',
  customerEmail: 'laura.bennett@example.com',
  customerPhone: '07711223344',
  appointmentType: APPOINTMENT_TYPE.SHOWROOM,
  isKitchen: false,
  isBedroom: true,
  slotId: FIXED_IDS.secondSlotId,
  slotDate: futureDate(10),
  slotStartTime: '14:00',
  slotEndTime: '15:00',
  consultantId: FIXED_IDS.secondConsultantId,
  showroomId: FIXED_IDS.secondShowroomId,
  status: BOOKING_STATUS.CONFIRMED,
  cancellationReason: null,
  rescheduledFromId: null,
  notes: 'Customer prefers modern minimalist style.',
  confirmationEmailSentAt: FIXED_DATE_NOW,
  internalNotificationSentAt: FIXED_DATE_NOW,
  createdAt: FIXED_DATE_NOW,
  updatedAt: FIXED_DATE_NOW,
  deletedAt: null,
};

export const bookingOnlineFixture: BookingEntity = {
  id: 'b1b1b1b1-b1b1-4b1b-ab1b-b1b1b1b1b1b1',
  ...CUSTOMER_DETAILS,
  customerId: 'f2f2f2f2-f2f2-4f2f-af2f-f2f2f2f2f2f2',
  customerName: 'Peter Walsh',
  customerEmail: 'peter.walsh@example.com',
  customerPhone: '07733445566',
  appointmentType: APPOINTMENT_TYPE.ONLINE,
  isKitchen: true,
  isBedroom: true,
  slotId: 'a0a0a0a0-a0a0-4a0a-aa0a-a0a0a0a0a0a0',
  slotDate: futureDate(5),
  slotStartTime: '14:00',
  slotEndTime: '15:00',
  consultantId: FIXED_IDS.secondConsultantId,
  showroomId: null,
  status: BOOKING_STATUS.PENDING,
  cancellationReason: null,
  rescheduledFromId: null,
  notes: null,
  confirmationEmailSentAt: null,
  internalNotificationSentAt: null,
  createdAt: FIXED_DATE_NOW,
  updatedAt: FIXED_DATE_NOW,
  deletedAt: null,
};

export const bookingHomeMeasurementFixture: BookingEntity = {
  id: 'c1c1c1c1-c1c1-4c1c-ac1c-c1c1c1c1c1c1',
  ...CUSTOMER_DETAILS,
  appointmentType: APPOINTMENT_TYPE.HOME_MEASUREMENT,
  isKitchen: true,
  isBedroom: false,
  slotId: '80808080-8080-4080-a080-808080808080',
  slotDate: futureDate(7),
  slotStartTime: '14:00',
  slotEndTime: '15:00',
  consultantId: FIXED_IDS.consultantId,
  showroomId: null,
  status: BOOKING_STATUS.CONFIRMED,
  cancellationReason: null,
  rescheduledFromId: null,
  notes: 'Please ring doorbell on arrival.',
  confirmationEmailSentAt: FIXED_DATE_NOW,
  internalNotificationSentAt: FIXED_DATE_NOW,
  createdAt: FIXED_DATE_NOW,
  updatedAt: FIXED_DATE_NOW,
  deletedAt: null,
};

export const bookingPendingFixture: BookingEntity = {
  ...bookingShowroomKitchenFixture,
  id: 'd1d1d1d1-d1d1-4d1d-ad1d-d1d1d1d1d1d1',
  status: BOOKING_STATUS.PENDING,
  confirmationEmailSentAt: null,
  internalNotificationSentAt: null,
};

export const bookingCompletedFixture: BookingEntity = {
  ...bookingShowroomKitchenFixture,
  id: 'e1e1e1e1-e1e1-4e1e-ae1e-e1e1e1e1e1e1',
  status: BOOKING_STATUS.COMPLETED,
  slotDate: new Date('2026-02-10T10:00:00.000Z'),
};

export const bookingsListFixture: BookingEntity[] = [
  bookingShowroomKitchenFixture,
  bookingShowroomBedroomFixture,
  bookingOnlineFixture,
  bookingHomeMeasurementFixture,
];

export const createBookingPayload: CreateBookingInput = {
  ...CUSTOMER_DETAILS,
  appointmentType: APPOINTMENT_TYPE.SHOWROOM,
  isKitchen: true,
  isBedroom: false,
  slotId: FIXED_IDS.slotId,
  consultantId: FIXED_IDS.consultantId,
  showroomId: FIXED_IDS.showroomId,
};

export const createOnlineBookingPayload: CreateBookingInput = {
  ...CUSTOMER_DETAILS,
  appointmentType: APPOINTMENT_TYPE.ONLINE,
  isKitchen: true,
  isBedroom: true,
  slotId: 'a0a0a0a0-a0a0-4a0a-aa0a-a0a0a0a0a0a0',
  consultantId: FIXED_IDS.secondConsultantId,
};



interface BookingPayloadOverrides {
  timeSlotId: string;
  forKitchen?: boolean;
  forBedroom?: boolean;
  customerEmail?: string;
}

export const bookingsFixture = {
  
  createPayload: (overrides: BookingPayloadOverrides) => ({
    timeSlotId:       overrides.timeSlotId,
    forKitchen:       overrides.forKitchen ?? true,
    forBedroom:       overrides.forBedroom ?? false,
    customerName:     'Test Customer',
    customerPhone:    '07900000001',
    customerEmail:    overrides.customerEmail ?? 'test@example.com',
    customerPostcode: 'SW1A 1AA',
    customerAddress:  '1 Test Street, London',
    appointmentType:  APPOINTMENT_TYPE.HOME_MEASUREMENT,
  }),

  
  raw: (overrides: { timeSlotId: string; status?: string; userId?: string }) => ({
    timeSlotId:       overrides.timeSlotId,
    forKitchen:       true,
    forBedroom:       false,
    customerName:     'Test Customer',
    customerPhone:    '07900000001',
    customerEmail:    'test@example.com',
    customerPostcode: 'SW1A 1AA',
    customerAddress:  '1 Test Street, London',
    appointmentType:  APPOINTMENT_TYPE.HOME_MEASUREMENT,
    status:           overrides.status ?? BOOKING_STATUS.PENDING,
    ...(overrides.userId && { userId: overrides.userId }),
  }),
};