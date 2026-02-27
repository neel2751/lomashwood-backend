import { v4 as uuidv4 } from 'uuid';
import jwt from 'jsonwebtoken';
import {
  APPOINTMENT_TYPE,
  BOOKING_STATUS,
  CONSULTANT_SPECIALISATION,
  REMINDER_CHANNEL,
  REMINDER_STATUS,
  REMINDER_TYPE,
  SLOT_STATUS,
} from '../shared/constants';
import {
  AvailabilityEntity,
  BookingEntity,
  ConsultantEntity,
  CreateBookingInput,
  CreateConsultantInput,
  CreateReminderInput,
  CreateSlotInput,
  ReminderEntity,
  ShowroomEntity,
  SlotEntity,
} from '../shared/types';
export function generateUserToken({ userId }: { userId: string }): string {
  return jwt.sign(
    { userId, role: 'USER' },
    process.env.JWT_SECRET ?? 'test-secret',
    { expiresIn: '1h' }
  );
}
export function buildShowroom(overrides: Partial<ShowroomEntity> = {}): ShowroomEntity {
  const id = uuidv4();
  const now = new Date();
  return {
    id,
    name: 'Lomash Wood Clapham',
    address: '12 High Street, Clapham, London, SW4 7UR',
    imageUrl: 'https://cdn.lomashwood.co.uk/showrooms/clapham.jpg',
    email: 'clapham@lomashwood.co.uk',
    phone: '02012345678',
    openingHours: 'Mon-Sat 9am-6pm, Sun 10am-4pm',
    mapLink: 'https://maps.google.com/?q=Lomash+Wood+Clapham',
    isActive: true,
    createdAt: now,
    updatedAt: now,
    deletedAt: null,
    ...overrides,
  };
}

export function buildConsultant(overrides: Partial<ConsultantEntity> = {}): ConsultantEntity {
  const id = uuidv4();
  const now = new Date();
  return {
    id,
    name: 'Sarah Mitchell',
    email: 'sarah.mitchell@lomashwood.co.uk',
    phone: '07712345678',
    specialisation: CONSULTANT_SPECIALISATION.BOTH,
    showroomId: uuidv4(),
    isActive: true,
    bio: 'Senior kitchen and bedroom design consultant with 8 years experience.',
    avatarUrl: 'https://cdn.lomashwood.co.uk/consultants/sarah-mitchell.jpg',
    createdAt: now,
    updatedAt: now,
    deletedAt: null,
    ...overrides,
  };
}

export function buildAvailability(overrides: Partial<AvailabilityEntity> = {}): AvailabilityEntity {
  const id = uuidv4();
  const now = new Date();
  return {
    id,
    consultantId: uuidv4(),
    dayOfWeek: 1,
    startTime: '09:00',
    endTime: '17:00',
    isActive: true,
    createdAt: now,
    updatedAt: now,
    deletedAt: null,
    ...overrides,
  };
}

export function buildSlot(overrides: Partial<SlotEntity> = {}): SlotEntity {
  const id = uuidv4();
  const now = new Date();
  const slotDate = new Date();
  slotDate.setDate(slotDate.getDate() + 7);
  return {
    id,
    consultantId: uuidv4(),
    date: slotDate,
    startTime: '10:00',
    endTime: '11:00',
    status: SLOT_STATUS.AVAILABLE,
    bookingId: null,
    showroomId: null,
    createdAt: now,
    updatedAt: now,
    deletedAt: null,
    ...overrides,
  };
}

export function buildBooking(overrides: Partial<BookingEntity> = {}): BookingEntity {
  const id = uuidv4();
  const now = new Date();
  const appointmentDate = new Date();
  appointmentDate.setDate(appointmentDate.getDate() + 7);
  return {
    id,
    customerId: uuidv4(),
    customerName: 'James Clarke',
    customerEmail: 'james.clarke@example.com',
    customerPhone: '07798765432',
    customerPostcode: 'SW4 7UR',
    customerAddress: '45 Elm Road, London',
    appointmentType: APPOINTMENT_TYPE.SHOWROOM,
    isKitchen: true,
    isBedroom: false,
    slotId: uuidv4(),
    slotDate: appointmentDate,
    slotStartTime: '10:00',
    slotEndTime: '11:00',
    consultantId: uuidv4(),
    showroomId: uuidv4(),
    status: BOOKING_STATUS.CONFIRMED,
    cancellationReason: null,
    rescheduledFromId: null,
    notes: null,
    confirmationEmailSentAt: now,
    internalNotificationSentAt: null,
    createdAt: now,
    updatedAt: now,
    deletedAt: null,
    ...overrides,
  };
}

export function buildReminder(overrides: Partial<ReminderEntity> = {}): ReminderEntity {
  const id = uuidv4();
  const now = new Date();
  const scheduledAt = new Date();
  scheduledAt.setHours(scheduledAt.getHours() + 24);
  return {
    id,
    bookingId: uuidv4(),
    customerId: uuidv4(),
    reminderType: REMINDER_TYPE.APPOINTMENT_24H,
    channel: REMINDER_CHANNEL.EMAIL,
    status: REMINDER_STATUS.PENDING,
    scheduledAt,
    sentAt: null,
    deliveredAt: null,
    failedAt: null,
    failureReason: null,
    retryCount: 0,
    createdAt: now,
    updatedAt: now,
    deletedAt: null,
    ...overrides,
  };
}

export function buildCreateBookingInput(
  overrides: Partial<CreateBookingInput> = {},
): CreateBookingInput {
  return {
    customerId: uuidv4(),
    customerName: 'James Clarke',
    customerEmail: 'james.clarke@example.com',
    customerPhone: '07798765432',
    customerPostcode: 'SW4 7UR',
    customerAddress: '45 Elm Road, London',
    appointmentType: APPOINTMENT_TYPE.SHOWROOM,
    isKitchen: true,
    isBedroom: false,
    slotId: uuidv4(),
    consultantId: uuidv4(),
    showroomId: uuidv4(),
    notes: undefined,
    ...overrides,
  };
}

export function buildCreateConsultantInput(
  overrides: Partial<CreateConsultantInput> = {},
): CreateConsultantInput {
  return {
    name: 'Sarah Mitchell',
    email: 'sarah.mitchell@lomashwood.co.uk',
    phone: '07712345678',
    specialisation: CONSULTANT_SPECIALISATION.BOTH,
    showroomId: uuidv4(),
    bio: 'Senior design consultant.',
    avatarUrl: 'https://cdn.lomashwood.co.uk/consultants/sarah-mitchell.jpg',
    ...overrides,
  };
}

export function buildCreateSlotInput(overrides: Partial<CreateSlotInput> = {}): CreateSlotInput {
  const slotDate = new Date();
  slotDate.setDate(slotDate.getDate() + 7);
  return {
    consultantId: uuidv4(),
    date: slotDate,
    startTime: '10:00',
    endTime: '11:00',
    showroomId: uuidv4(),
    ...overrides,
  };
}

export function buildCreateReminderInput(
  overrides: Partial<CreateReminderInput> = {},
): CreateReminderInput {
  const scheduledAt = new Date();
  scheduledAt.setHours(scheduledAt.getHours() + 24);
  return {
    bookingId: uuidv4(),
    customerId: uuidv4(),
    reminderType: REMINDER_TYPE.APPOINTMENT_24H,
    channel: REMINDER_CHANNEL.EMAIL,
    scheduledAt,
    ...overrides,
  };
}

export function buildManyBookings(
  count: number,
  overrides: Partial<BookingEntity> = {},
): BookingEntity[] {
  return Array.from({ length: count }, () => buildBooking(overrides));
}

export function buildManySlots(
  count: number,
  overrides: Partial<SlotEntity> = {},
): SlotEntity[] {
  return Array.from({ length: count }, () => buildSlot(overrides));
}

export function buildManyConsultants(
  count: number,
  overrides: Partial<ConsultantEntity> = {},
): ConsultantEntity[] {
  return Array.from({ length: count }, () => buildConsultant(overrides));
}
export function generateAdminToken(): string {
  return jwt.sign(
    { userId: 'e2e-admin-user-id', role: 'ADMIN' },
    process.env.JWT_SECRET ?? 'test-secret',
    { expiresIn: '1h' }
  );
}

export function generateUserToken(payload?: { userId?: string; role?: string }): string {
  return jwt.sign(
    { userId: payload?.userId ?? 'e2e-customer-user-id', role: payload?.role ?? 'CUSTOMER' },
    process.env.JWT_SECRET ?? 'test-secret',
    { expiresIn: '1h' }
  );
}