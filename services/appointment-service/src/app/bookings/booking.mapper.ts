interface Booking {
  id: string;
  customerId: string;
  slotId: string;
  consultantId: string | null;
  appointmentType: string;
  includesKitchen: boolean;
  includesBedroom: boolean;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  postcode: string;
  address: string;
  scheduledAt: Date;
  status: string;
  notes: string | null;
  reminderSentAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}
import { BookingResponse, SlotResponse, ConsultantSummary } from './booking.types';
import { APPOINTMENT_TYPE, BOOKING_STATUS } from './booking.constants';

type BookingWithRelations = Booking & {
  slot?: {
    id: string;
    startTime: Date;
    endTime: Date;
    isAvailable: boolean;
    consultantId: string;
  } | null;
  consultant?: {
    id: string;
    name: string;
    email: string;
    phone?: string | null;
  } | null;
};

export class BookingMapper {
  toResponse(booking: BookingWithRelations): BookingResponse {
    return {
      id: booking.id,
      customerId: booking.customerId,
      slotId: booking.slotId,
      consultantId: booking.consultantId ?? undefined,
      appointmentType: booking.appointmentType as APPOINTMENT_TYPE,
      includesKitchen: booking.includesKitchen,
      includesBedroom: booking.includesBedroom,
      customerName: booking.customerName,
      customerEmail: booking.customerEmail,
      customerPhone: booking.customerPhone,
      postcode: booking.postcode,
      address: booking.address,
      scheduledAt: booking.scheduledAt,
      status: booking.status as BOOKING_STATUS,
      notes: booking.notes ?? undefined,
      reminderSentAt: booking.reminderSentAt ?? undefined,
      slot: booking.slot ? this.toSlotResponse(booking.slot) : undefined,
      consultant: booking.consultant ? this.toConsultantSummary(booking.consultant) : undefined,
      createdAt: booking.createdAt,
      updatedAt: booking.updatedAt,
    };
  }

  toResponseList(bookings: BookingWithRelations[]): BookingResponse[] {
    return bookings.map((booking) => this.toResponse(booking));
  }

  private toSlotResponse(slot: {
    id: string;
    startTime: Date;
    endTime: Date;
    isAvailable: boolean;
    consultantId: string;
  }): SlotResponse {
    return {
      id: slot.id,
      startTime: slot.startTime,
      endTime: slot.endTime,
      isAvailable: slot.isAvailable,
      consultantId: slot.consultantId,
    };
  }

  private toConsultantSummary(consultant: {
    id: string;
    name: string;
    email: string;
    phone?: string | null;
  }): ConsultantSummary {
    return {
      id: consultant.id,
      name: consultant.name,
      email: consultant.email,
      phone: consultant.phone ?? undefined,
    };
  }
}