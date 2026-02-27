import { Request, Response, NextFunction } from 'express';
import { BookingService } from './booking.service';
import { CreateBookingSchema, UpdateBookingSchema, BookingQuerySchema } from './booking.schemas';
import { successResponse, paginatedResponse } from '../../shared/utils';
import { HTTP_STATUS } from '../../shared/constants';

export class BookingController {
  constructor(private readonly bookingService: BookingService) {}

  async createBooking(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const validated = CreateBookingSchema.parse(req.body);
      const booking = await this.bookingService.createBooking(validated, req.user!.id);
      res.status(HTTP_STATUS.CREATED).json(successResponse(booking, 'Booking created successfully'));
    } catch (error) {
      next(error);
    }
  }

  async getBookingById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const booking = await this.bookingService.getBookingById(req.params.id);
      res.status(HTTP_STATUS.OK).json(successResponse(booking));
    } catch (error) {
      next(error);
    }
  }

  async getAllBookings(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const query = BookingQuerySchema.parse(req.query);
      const result = await this.bookingService.getAllBookings(query);
      res.status(HTTP_STATUS.OK).json(paginatedResponse(result.data, result.meta));
    } catch (error) {
      next(error);
    }
  }

  async getMyBookings(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const query = BookingQuerySchema.parse(req.query);
      const result = await this.bookingService.getBookingsByCustomer(req.user!.id, query);
      res.status(HTTP_STATUS.OK).json(paginatedResponse(result.data, result.meta));
    } catch (error) {
      next(error);
    }
  }

  async updateBooking(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const validated = UpdateBookingSchema.parse(req.body);
      const booking = await this.bookingService.updateBooking(req.params.id, validated, req.user!.id);
      res.status(HTTP_STATUS.OK).json(successResponse(booking, 'Booking updated successfully'));
    } catch (error) {
      next(error);
    }
  }

  async cancelBooking(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const booking = await this.bookingService.cancelBooking(req.params.id, req.user!.id);
      res.status(HTTP_STATUS.OK).json(successResponse(booking, 'Booking cancelled successfully'));
    } catch (error) {
      next(error);
    }
  }

  async rescheduleBooking(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { slotId } = req.body;
      const booking = await this.bookingService.rescheduleBooking(req.params.id, slotId, req.user!.id);
      res.status(HTTP_STATUS.OK).json(successResponse(booking, 'Booking rescheduled successfully'));
    } catch (error) {
      next(error);
    }
  }

  async confirmBooking(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const booking = await this.bookingService.confirmBooking(req.params.id);
      res.status(HTTP_STATUS.OK).json(successResponse(booking, 'Booking confirmed successfully'));
    } catch (error) {
      next(error);
    }
  }

  async deleteBooking(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await this.bookingService.deleteBooking(req.params.id);
      res.status(HTTP_STATUS.NO_CONTENT).send();
    } catch (error) {
      next(error);
    }
  }
}