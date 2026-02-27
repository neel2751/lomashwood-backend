export type AppointmentType = 'HOME_MEASUREMENT' | 'ONLINE' | 'SHOWROOM';

export type AppointmentStatus =
  | 'PENDING'
  | 'CONFIRMED'
  | 'RESCHEDULED'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'NO_SHOW';

export type AppointmentCategory = 'KITCHEN' | 'BEDROOM' | 'BOTH';

export type ConsultantStatus = 'ACTIVE' | 'INACTIVE' | 'ON_LEAVE';

export type ReminderChannel = 'EMAIL' | 'SMS' | 'PUSH';

export type ReminderStatus = 'PENDING' | 'SENT' | 'FAILED' | 'CANCELLED';

export type SlotDuration = 30 | 60 | 90 | 120;

export interface TimeSlot {
  readonly id: string;
  readonly consultantId: string | null;
  readonly showroomId: string | null;
  readonly date: string;
  readonly startTime: string;
  readonly endTime: string;
  readonly duration: SlotDuration;
  readonly isAvailable: boolean;
  readonly isBooked: boolean;
  readonly bookedAt: Date | null;
}

export interface Consultant {
  readonly id: string;
  readonly userId: string;
  readonly firstName: string;
  readonly lastName: string;
  readonly email: string;
  readonly phone: string | null;
  readonly avatarUrl: string | null;
  readonly specialisms: readonly AppointmentCategory[];
  readonly showroomId: string | null;
  readonly status: ConsultantStatus;
  readonly bio: string | null;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

export interface Showroom {
  readonly id: string;
  readonly name: string;
  readonly slug: string;
  readonly address: string;
  readonly city: string;
  readonly postcode: string;
  readonly country: string;
  readonly email: string;
  readonly phone: string;
  readonly imageUrl: string | null;
  readonly openingHours: OpeningHours;
  readonly mapLink: string | null;
  readonly latitude: number | null;
  readonly longitude: number | null;
  readonly isActive: boolean;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

export interface OpeningHours {
  readonly monday: DayHours | null;
  readonly tuesday: DayHours | null;
  readonly wednesday: DayHours | null;
  readonly thursday: DayHours | null;
  readonly friday: DayHours | null;
  readonly saturday: DayHours | null;
  readonly sunday: DayHours | null;
}

export interface DayHours {
  readonly open: string;
  readonly close: string;
  readonly isClosed: boolean;
}

export interface BookingCustomerDetails {
  readonly firstName: string;
  readonly lastName: string;
  readonly email: string;
  readonly phone: string;
  readonly postcode: string;
  readonly address: string | null;
}

export interface Booking {
  readonly id: string;
  readonly referenceNumber: string;
  readonly userId: string | null;
  readonly appointmentType: AppointmentType;
  readonly category: AppointmentCategory;
  readonly status: AppointmentStatus;
  readonly customerDetails: BookingCustomerDetails;
  readonly slotId: string;
  readonly date: string;
  readonly startTime: string;
  readonly endTime: string;
  readonly consultantId: string | null;
  readonly showroomId: string | null;
  readonly notes: string | null;
  readonly isKitchen: boolean;
  readonly isBedroom: boolean;
  readonly cancelledAt: Date | null;
  readonly cancellationReason: string | null;
  readonly completedAt: Date | null;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

export interface BookingSummary {
  readonly id: string;
  readonly referenceNumber: string;
  readonly appointmentType: AppointmentType;
  readonly category: AppointmentCategory;
  readonly status: AppointmentStatus;
  readonly customerName: string;
  readonly customerEmail: string;
  readonly date: string;
  readonly startTime: string;
  readonly showroomName: string | null;
  readonly consultantName: string | null;
  readonly createdAt: Date;
}

export interface CreateBookingPayload {
  readonly appointmentType: AppointmentType;
  readonly category: AppointmentCategory;
  readonly isKitchen: boolean;
  readonly isBedroom: boolean;
  readonly slotId: string;
  readonly customerDetails: BookingCustomerDetails;
  readonly notes?: string | undefined;
  readonly userId?: string | undefined;
}

export interface RescheduleBookingPayload {
  readonly newSlotId: string;
  readonly reason?: string | undefined;
}

export interface CancelBookingPayload {
  readonly reason: string;
}

export interface Reminder {
  readonly id: string;
  readonly bookingId: string;
  readonly channel: ReminderChannel;
  readonly status: ReminderStatus;
  readonly scheduledFor: Date;
  readonly sentAt: Date | null;
  readonly failureReason: string | null;
  readonly createdAt: Date;
}

export interface AvailabilityQuery {
  readonly appointmentType: AppointmentType;
  readonly category: AppointmentCategory;
  readonly fromDate: string;
  readonly toDate: string;
  readonly showroomId?: string | undefined;
  readonly consultantId?: string | undefined;
}

export interface AvailabilityResult {
  readonly date: string;
  readonly slots: readonly TimeSlot[];
}

export interface BookingCreatedEventPayload {
  readonly bookingId: string;
  readonly referenceNumber: string;
  readonly appointmentType: AppointmentType;
  readonly category: AppointmentCategory;
  readonly isKitchen: boolean;
  readonly isBedroom: boolean;
  readonly customerEmail: string;
  readonly customerName: string;
  readonly date: string;
  readonly startTime: string;
  readonly showroomId: string | null;
  readonly consultantId: string | null;
  readonly createdAt: Date;
}

export interface BookingCancelledEventPayload {
  readonly bookingId: string;
  readonly referenceNumber: string;
  readonly customerEmail: string;
  readonly reason: string;
  readonly cancelledAt: Date;
}

export interface ReminderSentEventPayload {
  readonly reminderId: string;
  readonly bookingId: string;
  readonly channel: ReminderChannel;
  readonly customerEmail: string;
  readonly sentAt: Date;
}

export interface ConsultantUpdatedEventPayload {
  readonly consultantId: string;
  readonly updatedFields: readonly string[];
  readonly updatedAt: Date;
}