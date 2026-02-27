import { Availability, TimeSlot, Consultant, DayOfWeek } from '@prisma/client';
import { AvailabilityResponse, SlotResponse, ConsultantSummary } from './availability.types';

type AvailabilityWithRelations = Availability & {
  consultant?: Pick<Consultant, 'id' | 'name' | 'email' | 'phone'> | null;
};

export class AvailabilityMapper {
  toResponse(availability: AvailabilityWithRelations): AvailabilityResponse {
    return {
      id: availability.id,
      consultantId: availability.consultantId,
      dayOfWeek: availability.dayOfWeek as DayOfWeek,
      startTime: availability.startTime,
      endTime: availability.endTime,
      isRecurring: availability.isRecurring,
      specificDate: availability.specificDate,
      isBlocked: availability.isBlocked,
      blockReason: availability.blockReason,
      consultant: availability.consultant
        ? this.toConsultantSummary(availability.consultant)
        : undefined,
      createdAt: availability.createdAt,
      updatedAt: availability.updatedAt,
    };
  }

  toResponseList(availabilities: AvailabilityWithRelations[]): AvailabilityResponse[] {
    return availabilities.map((a) => this.toResponse(a));
  }

  toSlotResponse(slot: TimeSlot): SlotResponse {
    return {
      id: slot.id,
      date: slot.date,
      consultantId: slot.consultantId,
      showroomId: slot.showroomId,
      startTime: slot.startTime,
      endTime: slot.endTime,
      isAvailable: slot.isAvailable,
      isBlocked: slot.isBlocked,
      blockReason: slot.blockReason,
      duration: slot.duration,
      maxBookings: slot.maxBookings,
      currentBookings: slot.currentBookings,
      createdAt: slot.createdAt,
      updatedAt: slot.updatedAt,
    };
  }

  toSlotResponseList(slots: TimeSlot[]): SlotResponse[] {
    return slots.map((s) => this.toSlotResponse(s));
  }

  private toConsultantSummary(
    consultant: Pick<Consultant, 'id' | 'name' | 'email' | 'phone'>,
  ): ConsultantSummary {
    return {
      id: consultant.id,
      name: consultant.name,
      email: consultant.email,
      phone: consultant.phone ?? undefined,
    };
  }
}