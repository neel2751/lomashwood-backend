import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { setupTestEnvironment } from '../../src/tests-helpers/setup';
import {
  mockBookingRepository,
  mockSlotRepository,
  mockConsultantRepository,
  mockShowroomRepository,
  mockEventProducer,
  mockEmailClient,
} from '../../src/tests-helpers/mocks';
import {
  bookingShowroomKitchenFixture,
  bookingsListFixture,
  createBookingPayload,
} from '../fixtures/bookings.fixture';
import {
  appointmentResponseFixture,
  appointmentsListResponseFixture,
} from '../fixtures/appointments.fixture';
import { slotAvailableFixture } from '../fixtures/time-slots.fixture';
import { consultantKitchenFixture } from '../fixtures/consultants.fixture';
import { showroomClaphamFixture } from '../fixtures/locations.fixture';
import { FIXED_IDS } from '../fixtures/common.fixture';
import {
  BookingNotFoundError,
  SlotUnavailableError,
  ConsultantNotFoundError,
  ConsultantNotActiveError,
  ConsultantSpecialisationMismatchError,
} from '../../src/shared/errors';
import { APPOINTMENT_TYPE, CONSULTANT_SPECIALISATION } from '../../src/shared/constants';

setupTestEnvironment();

const mockDeps = {
  bookingRepository: mockBookingRepository,
  slotRepository: mockSlotRepository,
  consultantRepository: mockConsultantRepository,
  showroomRepository: mockShowroomRepository,
  eventProducer: mockEventProducer,
  emailClient: mockEmailClient,
};

let AppointmentService: any;

beforeEach(async () => {
  jest.resetModules();
  ({ AppointmentService } = await import('../../src/app/appointment/appointment.service'));
});

describe('AppointmentService.createAppointment', () => {
  it('creates appointment for SHOWROOM type with kitchen specialisation', async () => {
    mockSlotRepository.findById.mockResolvedValue(slotAvailableFixture);
    mockConsultantRepository.findById.mockResolvedValue(consultantKitchenFixture);
    mockShowroomRepository.findById.mockResolvedValue(showroomClaphamFixture);
    mockBookingRepository.create.mockResolvedValue(bookingShowroomKitchenFixture);
    mockSlotRepository.markBooked.mockResolvedValue(undefined);
    mockEventProducer.publish.mockResolvedValue(undefined);
    mockEmailClient.sendBookingConfirmation.mockResolvedValue(undefined);

    const service = new AppointmentService(mockDeps);
    const result = await service.createAppointment(createBookingPayload);

    expect(result.id).toBe(FIXED_IDS.bookingId);
    expect(result.appointmentType).toBe(APPOINTMENT_TYPE.SHOWROOM);
  });

  it('throws ConsultantSpecialisationMismatchError when consultant cannot handle appointment type', async () => {
    const bedroomConsultant = { ...consultantKitchenFixture, specialisation: CONSULTANT_SPECIALISATION.BEDROOM };
    mockSlotRepository.findById.mockResolvedValue(slotAvailableFixture);
    mockConsultantRepository.findById.mockResolvedValue(bedroomConsultant);

    const service = new AppointmentService(mockDeps);
    await expect(
      service.createAppointment({ ...createBookingPayload, isKitchen: true }),
    ).rejects.toThrow(ConsultantSpecialisationMismatchError);
  });

  it('throws ConsultantNotActiveError when consultant is inactive', async () => {
    const inactive = { ...consultantKitchenFixture, isActive: false };
    mockSlotRepository.findById.mockResolvedValue(slotAvailableFixture);
    mockConsultantRepository.findById.mockResolvedValue(inactive);

    const service = new AppointmentService(mockDeps);
    await expect(service.createAppointment(createBookingPayload)).rejects.toThrow(ConsultantNotActiveError);
  });

  it('throws SlotUnavailableError when slot is not available', async () => {
    mockSlotRepository.findById.mockResolvedValue(null);

    const service = new AppointmentService(mockDeps);
    await expect(service.createAppointment(createBookingPayload)).rejects.toThrow(SlotUnavailableError);
  });
});

describe('AppointmentService.getAppointmentById', () => {
  it('returns hydrated appointment response with consultant and showroom', async () => {
    mockBookingRepository.findById.mockResolvedValue(bookingShowroomKitchenFixture);
    mockConsultantRepository.findById.mockResolvedValue(consultantKitchenFixture);
    mockShowroomRepository.findById.mockResolvedValue(showroomClaphamFixture);

    const service = new AppointmentService(mockDeps);
    const result = await service.getAppointmentById(FIXED_IDS.bookingId, FIXED_IDS.customerId, 'CUSTOMER');

    expect(result.consultant?.id).toBe(FIXED_IDS.consultantId);
    expect(result.showroom?.id).toBe(FIXED_IDS.showroomId);
  });

  it('throws BookingNotFoundError when appointment does not exist', async () => {
    mockBookingRepository.findById.mockResolvedValue(null);

    const service = new AppointmentService(mockDeps);
    await expect(
      service.getAppointmentById('nonexistent', FIXED_IDS.customerId, 'CUSTOMER'),
    ).rejects.toThrow(BookingNotFoundError);
  });
});

describe('AppointmentService.listAppointments', () => {
  it('returns paginated appointment list', async () => {
    mockBookingRepository.findAll.mockResolvedValue(bookingsListFixture);
    mockBookingRepository.count.mockResolvedValue(bookingsListFixture.length);

    const service = new AppointmentService(mockDeps);
    const result = await service.listAppointments({ page: 1, limit: 20 });

    expect(result.data).toHaveLength(bookingsListFixture.length);
    expect(result.meta.page).toBe(1);
  });
});