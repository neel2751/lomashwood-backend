import { APPOINTMENT_TYPE, BOOKING_STATUS, CONSULTANT_SPECIALISATION } from '../../src/shared/constants';
import { CUSTOMER_DETAILS, FIXED_DATE_NOW, FIXED_IDS, futureDate } from './common.fixture';



export const getBookingByIdRequest = {
  bookingId: FIXED_IDS.bookingId,
  requestingUserId: FIXED_IDS.customerId,
  requestingUserRole: 'CUSTOMER',
};

export const getBookingByIdAdminRequest = {
  bookingId: FIXED_IDS.bookingId,
  requestingUserId: FIXED_IDS.adminId,
  requestingUserRole: 'ADMIN',
};

export const listBookingsRequest = {
  page: 1,
  limit: 20,
  customerId: FIXED_IDS.customerId,
};

export const listBookingsAdminRequest = {
  page: 1,
  limit: 20,
  status: BOOKING_STATUS.CONFIRMED,
  appointmentType: APPOINTMENT_TYPE.SHOWROOM,
  dateFrom: futureDate(1),
  dateTo: futureDate(30),
};

export const createBookingServiceInput = {
  ...CUSTOMER_DETAILS,
  appointmentType: APPOINTMENT_TYPE.SHOWROOM,
  isKitchen: true,
  isBedroom: false,
  slotId: FIXED_IDS.slotId,
  consultantId: FIXED_IDS.consultantId,
  showroomId: FIXED_IDS.showroomId,
};

export const cancelBookingServiceInput = {
  bookingId: FIXED_IDS.bookingId,
  cancellationReason: 'Change of plans.',
  cancelledByUserId: FIXED_IDS.customerId,
};

export const rescheduleBookingServiceInput = {
  bookingId: FIXED_IDS.bookingId,
  newSlotId: FIXED_IDS.rescheduleSlotId,
  requestingUserId: FIXED_IDS.customerId,
};

export const getAvailableSlotsRequest = {
  consultantId: FIXED_IDS.consultantId,
  dateFrom: futureDate(1),
  dateTo: futureDate(30),
  showroomId: FIXED_IDS.showroomId,
};

export const listConsultantsRequest = {
  page: 1,
  limit: 20,
  specialisation: CONSULTANT_SPECIALISATION.KITCHEN,
  isActive: true,
};

export const createConsultantServiceInput = {
  name: 'New Consultant',
  email: 'new.consultant@lomashwood.co.uk',
  phone: '07756789012',
  specialisation: CONSULTANT_SPECIALISATION.BOTH,
  showroomId: FIXED_IDS.showroomId,
  bio: 'New consultant bio.',
  createdByAdminId: FIXED_IDS.adminId,
};

export const updateConsultantServiceInput = {
  consultantId: FIXED_IDS.consultantId,
  name: 'Sarah Mitchell Updated',
  phone: '07787654321',
  updatedByAdminId: FIXED_IDS.adminId,
};

export const deactivateConsultantServiceInput = {
  consultantId: FIXED_IDS.consultantId,
  updatedByAdminId: FIXED_IDS.adminId,
};

export const scheduleReminderServiceInput = {
  bookingId: FIXED_IDS.bookingId,
  customerId: FIXED_IDS.customerId,
  appointmentDate: futureDate(7),
};

export const successServiceResponse = {
  success: true,
  message: 'Operation completed successfully.',
};

export const paginatedEmptyResponse = {
  data: [],
  meta: {
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
    hasNextPage: false,
    hasPreviousPage: false,
  },
};



interface ServiceTypeOverrides {
  type: string;
}

export const servicesFixture = {
  
  createPayload: (overrides: ServiceTypeOverrides) => ({
    type:            overrides.type,
    title:           `${overrides.type} Service ${Date.now()}`,
    description:     `Description for ${overrides.type} service`,
    durationMinutes: 60,
    isActive:        true,
  }),

  
  raw: (overrides: ServiceTypeOverrides) => ({
    type:            overrides.type,
    title:           `${overrides.type} Service ${Date.now()}`,
    description:     `Description for ${overrides.type} service`,
    durationMinutes: 60,
    isActive:        true,
  }),
};