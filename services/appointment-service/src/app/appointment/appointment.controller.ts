import { Request, Response, NextFunction } from 'express';
import { BookingService } from '../bookings/booking.service';

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────

interface AppointmentControllerDeps {
  bookingService: BookingService;
}

// ─────────────────────────────────────────────────────────────
// Controller
// Named export — matches:
//   ({ AppointmentController } = await import('...appointment.controller'))
// ─────────────────────────────────────────────────────────────

export class AppointmentController {
  private readonly bookingService: BookingService;

  constructor({ bookingService }: AppointmentControllerDeps) {
    this.bookingService = bookingService;

    // Bind methods so they work correctly when passed as route handlers
    this.create    = this.create.bind(this);
    this.getById   = this.getById.bind(this);
    this.list      = this.list.bind(this);
    this.update    = this.update.bind(this);
    this.cancel    = this.cancel.bind(this);
    this.remove    = this.remove.bind(this);
  }

  // ── POST /appointments ──────────────────────────────────────
  // Test expects: 201 + { id: bookingId }
  async create(req: Request, res: Response, next?: NextFunction): Promise<void> {
    try {
      const userId = (req as any).user?.userId;
      const appointment = await this.bookingService.createBooking({
        ...req.body,
        customerId: userId,
      });

      res.status(201).json(appointment);
    } catch (error) {
      if (next) return next(error);
      throw error;
    }
  }

  // ── GET /appointments/:id ───────────────────────────────────
  // Test expects: 200 + appointment | next(BookingNotFoundError)
  async getById(req: Request, res: Response, next?: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const appointment = await this.bookingService.getBookingById(id);

      res.status(200).json(appointment);
    } catch (error) {
      if (next) return next(error);
      throw error;
    }
  }

  // ── GET /appointments ───────────────────────────────────────
  // Test expects: 200 + { data, meta }
  async list(req: Request, res: Response, next?: NextFunction): Promise<void> {
    try {
      const page  = parseInt((req.query.page  as string) ?? '1',  10);
      const limit = parseInt((req.query.limit as string) ?? '20', 10);

      const result = await this.bookingService.getAllBookings({ page, limit });

      res.status(200).json(result);
    } catch (error) {
      if (next) return next(error);
      throw error;
    }
  }

  // ── PATCH /appointments/:id ─────────────────────────────────
  async update(req: Request, res: Response, next?: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const appointment = await this.bookingService.updateBooking(id, req.body);

      res.status(200).json(appointment);
    } catch (error) {
      if (next) return next(error);
      throw error;
    }
  }

  // ── PATCH /appointments/:id/cancel ─────────────────────────
  async cancel(req: Request, res: Response, next?: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const appointment = await this.bookingService.cancelBooking(id, req.body);

      res.status(200).json(appointment);
    } catch (error) {
      if (next) return next(error);
      throw error;
    }
  }

  // ── DELETE /appointments/:id ────────────────────────────────
  async remove(req: Request, res: Response, next?: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      await this.bookingService.cancelBooking(id, { reason: 'Deleted by admin' });

      res.status(204).send();
    } catch (error) {
      if (next) return next(error);
      throw error;
    }
  }
}