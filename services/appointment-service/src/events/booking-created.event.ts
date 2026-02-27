import { AppointmentType, BookingStatus } from '@prisma/client';
import { eventTopics } from '../infrastructure/messaging/event-topics';
import { eventMetadata } from '../infrastructure/messaging/event-metadata';
import { EventProducer } from '../infrastructure/messaging/event-producer';
import { logger } from '../config/logger';



export interface BookingCreatedPayload {
  eventId: string;
  eventVersion: '1.0';
  eventName: 'booking.created';
  occurredAt: string; 
  service: 'appointment-service';
  data: BookingCreatedData;
}

export interface BookingCreatedData {
  bookingId: string;
  customerId: string | null;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  postcode: string;
  address: string;
  appointmentType: AppointmentType;
  forKitchen: boolean;
  forBedroom: boolean;
  scheduledAt: string; 
  status: BookingStatus;
  showroomId: string | null;
  consultantId: string | null;
  /**
   * Derived flag — true when forKitchen && forBedroom.
   * The notification-service uses this to dispatch emails
   * to both the kitchen and bedroom internal teams (FR5.6).
   */
  requiresDualTeamNotification: boolean;
}



export function buildBookingCreatedPayload(
  data: BookingCreatedData,
): BookingCreatedPayload {
  return {
    eventId: eventMetadata.generateEventId(),
    eventVersion: '1.0',
    eventName: 'booking.created',
    occurredAt: new Date().toISOString(),
    service: 'appointment-service',
    data: {
      ...data,
      requiresDualTeamNotification: data.forKitchen && data.forBedroom,
    },
  };
}



export class BookingCreatedEvent {
  constructor(private readonly producer: EventProducer) {}

  async publish(data: BookingCreatedData): Promise<void> {
    const payload = buildBookingCreatedPayload(data);

    try {
      await this.producer.publish(
        eventTopics.BOOKING_CREATED,
        payload.eventId,
        payload,
      );

      logger.info(
        {
          eventId: payload.eventId,
          bookingId: data.bookingId,
          appointmentType: data.appointmentType,
          requiresDualTeamNotification: payload.data.requiresDualTeamNotification,
        },
        '[BookingCreatedEvent] Published successfully',
      );
    } catch (error) {
      logger.error(
        {
          eventId: payload.eventId,
          bookingId: data.bookingId,
          error,
        },
        '[BookingCreatedEvent] Failed to publish event',
      );

      
      
      throw error;
    }
  }
}