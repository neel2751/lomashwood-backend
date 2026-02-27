import { APPOINTMENT_TYPE, BOOKING_STATUS } from '../../src/shared/constants';
import { CUSTOMER_DETAILS, FIXED_DATE_NOW, FIXED_IDS, futureDate } from './common.fixture';

// ── Response DTO type ─────────────────────────────────────────

export interface AppointmentResponseDto {
  id: string;
  customerId: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  customerPostcode: string;
  customerAddress: string;
  appointmentType: string;
  isKitchen: boolean;
  isBedroom: boolean;
  slot: {
    id: string;
    date: Date;
    startTime: string;
    endTime: string;
  };
  consultant: {
    id: string;
    name: string;
    email: string;
  } | null;
  showroom: {
    id: string;
    name: string;
    address: string;
  } | null;
  status: string;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
}

// ── Static response fixtures ──────────────────────────────────

export const appointmentResponseFixture: AppointmentResponseDto = {
  id: FIXED_IDS.bookingId,
  ...CUSTOMER_DETAILS,
  appointmentType: APPOINTMENT_TYPE.SHOWROOM,
  isKitchen: true,
  isBedroom: false,
  slot: {
    id: FIXED_IDS.slotId,
    date: futureDate(7),
    startTime: '10:00',
    endTime: '11:00',
  },
  consultant: {
    id: FIXED_IDS.consultantId,
    name: 'Sarah Mitchell',
    email: 'sarah.mitchell@lomashwood.co.uk',
  },
  showroom: {
    id: FIXED_IDS.showroomId,
    name: 'Lomash Wood Clapham',
    address: '12 High Street, Clapham, London, SW4 7UR',
  },
  status: BOOKING_STATUS.CONFIRMED,
  notes: null,
  createdAt: FIXED_DATE_NOW,
  updatedAt: FIXED_DATE_NOW,
};

export const appointmentOnlineResponseFixture: AppointmentResponseDto = {
  id: 'b1b1b1b1-b1b1-4b1b-ab1b-b1b1b1b1b1b1',
  ...CUSTOMER_DETAILS,
  customerId: 'f2f2f2f2-f2f2-4f2f-af2f-f2f2f2f2f2f2',
  customerName: 'Peter Walsh',
  customerEmail: 'peter.walsh@example.com',
  customerPhone: '07733445566',
  appointmentType: APPOINTMENT_TYPE.ONLINE,
  isKitchen: true,
  isBedroom: true,
  slot: {
    id: 'a0a0a0a0-a0a0-4a0a-aa0a-a0a0a0a0a0a0',
    date: futureDate(5),
    startTime: '14:00',
    endTime: '15:00',
  },
  consultant: {
    id: FIXED_IDS.secondConsultantId,
    name: 'David Okafor',
    email: 'david.okafor@lomashwood.co.uk',
  },
  showroom: null,
  status: BOOKING_STATUS.PENDING,
  notes: null,
  createdAt: FIXED_DATE_NOW,
  updatedAt: FIXED_DATE_NOW,
};

export const appointmentsListResponseFixture: AppointmentResponseDto[] = [
  appointmentResponseFixture,
  appointmentOnlineResponseFixture,
];

// ── Dynamic factory fixtures (used in integration/e2e tests) ──

interface AppointmentOverrides {
  consultantId: string;
  timeSlotId: string;
  forKitchen?: boolean;
  forBedroom?: boolean;
}

const basePayload = (overrides: AppointmentOverrides) => ({
  consultantId:     overrides.consultantId,
  timeSlotId:       overrides.timeSlotId,
  forKitchen:       overrides.forKitchen ?? true,
  forBedroom:       overrides.forBedroom ?? false,
  customerName:     'Test Customer',
  customerPhone:    '07900000001',
  customerEmail:    'test@example.com',
  customerPostcode: 'SW1A 1AA',
  customerAddress:  '1 Test Street, London',
});

export const appointmentFixtures = {
  // HTTP request payloads (sent via supertest)
  createHomeAppointment: (overrides: AppointmentOverrides) => ({
    ...basePayload(overrides),
    type: APPOINTMENT_TYPE.HOME_MEASUREMENT,
  }),

  createOnlineAppointment: (overrides: AppointmentOverrides) => ({
    ...basePayload(overrides),
    type: APPOINTMENT_TYPE.ONLINE,
  }),

  createShowroomAppointment: (overrides: AppointmentOverrides) => ({
    ...basePayload(overrides),
    type: APPOINTMENT_TYPE.SHOWROOM,
  }),

  // Raw Prisma shape (used with prisma.appointment.create directly)
  raw: (overrides: AppointmentOverrides) => ({
    ...basePayload(overrides),
    type:   APPOINTMENT_TYPE.HOME_MEASUREMENT,
    status: BOOKING_STATUS.PENDING,
  }),
};