import { BookingRepository } from './booking.repository';
import { AvailabilityService } from '../availability/availability.service';
import { NotificationService } from '../../infrastructure/notifications/email.client';
import { EventProducer } from '../../infrastructure/messaging/event-producer';
import { BookingMapper } from './booking.mapper';
import {
  CreateBookingDto,
  UpdateBookingDto,
  BookingQueryDto,
  BookingResponse,
  PaginatedBookingResponse,
} from './booking.types';
import {
  BookingNotFoundError,
  BookingSlotUnavailableError,
  BookingCancellationError,
  BookingRescheduleError,
  UnauthorizedBookingAccessError,
} from '../../shared/errors';
import { BOOKING_STATUS, APPOINTMENT_TYPE } from './booking.constants';
import { PaginationMeta } from '../../shared/pagination';

export class BookingService {
  constructor(
    private readonly bookingRepository: BookingRepository,
    private readonly availabilityService: AvailabilityService,
    private readonly notificationService: NotificationService,
    private readonly eventProducer: EventProducer,
    private readonly bookingMapper: BookingMapper,
  ) {}

  async createBooking(dto: CreateBookingDto, customerId: string): Promise<BookingResponse> {
    const slot = await this.availabilityService.getSlotById(dto.slotId);

    if (!slot || !slot.isAvailable) {
      throw new BookingSlotUnavailableError(dto.slotId);
    }

    const existing = await this.bookingRepository.findBySlotId(dto.slotId);
    if (existing) {
      throw new BookingSlotUnavailableError(dto.slotId);
    }

    const booking = await this.bookingRepository.create({
      ...dto,
      customerId,
      status: BOOKING_STATUS.PENDING,
    });

    await this.availabilityService.markSlotAsBooked(dto.slotId);

    await this.notificationService.sendBookingConfirmation({
      to: dto.customerEmail,
      customerName: dto.customerName,
      bookingId: booking.id,
      appointmentType: booking.appointmentType,
      scheduledAt: booking.scheduledAt,
    });

    if (dto.includesKitchen && dto.includesBedroom) {
      await this.notificationService.sendInternalBookingAlert({
        bookingId: booking.id,
        customerName: dto.customerName,
        appointmentType: booking.appointmentType,
        includesKitchen: dto.includesKitchen,
        includesBedroom: dto.includesBedroom,
      });
    }

    await this.eventProducer.publish('booking.created', {
      bookingId: booking.id,
      customerId,
      appointmentType: booking.appointmentType,
      scheduledAt: booking.scheduledAt,
    });

    return this.bookingMapper.toResponse(booking);
  }

  async getBookingById(id: string): Promise<BookingResponse> {
    const booking = await this.bookingRepository.findById(id);
    if (!booking) {
      throw new BookingNotFoundError(id);
    }
    return this.bookingMapper.toResponse(booking);
  }

  async getAllBookings(query: BookingQueryDto): Promise<PaginatedBookingResponse> {
    const { data, total } = await this.bookingRepository.findAll(query);
    const meta: PaginationMeta = {
      total,
      page: query.page ?? 1,
      limit: query.limit ?? 10,
      totalPages: Math.ceil(total / (query.limit ?? 10)),
    };
    return {
      data: data.map((b) => this.bookingMapper.toResponse(b)),
      meta,
    };
  }

  async getBookingsByCustomer(customerId: string, query: BookingQueryDto): Promise<PaginatedBookingResponse> {
    const { data, total } = await this.bookingRepository.findByCustomerId(customerId, query);
    const meta: PaginationMeta = {
      total,
      page: query.page ?? 1,
      limit: query.limit ?? 10,
      totalPages: Math.ceil(total / (query.limit ?? 10)),
    };
    return {
      data: data.map((b) => this.bookingMapper.toResponse(b)),
      meta,
    };
  }

  async updateBooking(id: string, dto: UpdateBookingDto, customerId: string): Promise<BookingResponse> {
    const booking = await this.bookingRepository.findById(id);
    if (!booking) {
      throw new BookingNotFoundError(id);
    }

    if (booking.customerId !== customerId) {
      throw new UnauthorizedBookingAccessError(id);
    }

    if (booking.status === BOOKING_STATUS.CANCELLED) {
      throw new BookingCancellationError('Cannot update a cancelled booking');
    }

    const updated = await this.bookingRepository.update(id, dto);
    return this.bookingMapper.toResponse(updated);
  }

  async cancelBooking(id: string, customerId: string): Promise<BookingResponse> {
    const booking = await this.bookingRepository.findById(id);
    if (!booking) {
      throw new BookingNotFoundError(id);
    }

    if (booking.customerId !== customerId) {
      throw new UnauthorizedBookingAccessError(id);
    }

    if (booking.status === BOOKING_STATUS.CANCELLED) {
      throw new BookingCancellationError('Booking is already cancelled');
    }

    if (booking.status === BOOKING_STATUS.COMPLETED) {
      throw new BookingCancellationError('Cannot cancel a completed booking');
    }

    const cancelled = await this.bookingRepository.update(id, {
      status: BOOKING_STATUS.CANCELLED,
    });

    await this.availabilityService.markSlotAsAvailable(booking.slotId);

    await this.eventProducer.publish('booking.cancelled', {
      bookingId: id,
      customerId,
      scheduledAt: booking.scheduledAt,
    });

    return this.bookingMapper.toResponse(cancelled);
  }

  async rescheduleBooking(id: string, newSlotId: string, customerId: string): Promise<BookingResponse> {
    const booking = await this.bookingRepository.findById(id);
    if (!booking) {
      throw new BookingNotFoundError(id);
    }

    if (booking.customerId !== customerId) {
      throw new UnauthorizedBookingAccessError(id);
    }

    if (booking.status === BOOKING_STATUS.CANCELLED || booking.status === BOOKING_STATUS.COMPLETED) {
      throw new BookingRescheduleError('Cannot reschedule a cancelled or completed booking');
    }

    const newSlot = await this.availabilityService.getSlotById(newSlotId);
    if (!newSlot || !newSlot.isAvailable) {
      throw new BookingSlotUnavailableError(newSlotId);
    }

    await this.availabilityService.markSlotAsAvailable(booking.slotId);
    await this.availabilityService.markSlotAsBooked(newSlotId);

    const rescheduled = await this.bookingRepository.update(id, {
      slotId: newSlotId,
      scheduledAt: newSlot.startTime,
      status: BOOKING_STATUS.RESCHEDULED,
    });

    await this.eventProducer.publish('booking.rescheduled', {
      bookingId: id,
      customerId,
      newSlotId,
      scheduledAt: newSlot.startTime,
    });

    return this.bookingMapper.toResponse(rescheduled);
  }

  async confirmBooking(id: string): Promise<BookingResponse> {
    const booking = await this.bookingRepository.findById(id);
    if (!booking) {
      throw new BookingNotFoundError(id);
    }

    const confirmed = await this.bookingRepository.update(id, {
      status: BOOKING_STATUS.CONFIRMED,
    });

    return this.bookingMapper.toResponse(confirmed);
  }

  async deleteBooking(id: string): Promise<void> {
    const booking = await this.bookingRepository.findById(id);
    if (!booking) {
      throw new BookingNotFoundError(id);
    }
    await this.bookingRepository.softDelete(id);
  }
}