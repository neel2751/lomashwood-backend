

import { Request, Response, NextFunction } from 'express';
import { BookingController } from '../../src/app/bookings/booking.controller';
import { BookingService } from '../../src/app/bookings/booking.service';
import { AppError } from '../../src/shared/errors';
import { BookingStatus, BookingType } from '@prisma/client';

describe('BookingController', () => {
  let bookingController: BookingController;
  let mockBookingService: jest.Mocked<BookingService>;
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    mockBookingService = {
      createBooking: jest.fn(),
      getBookingById: jest.fn(),
      getBookingsByCustomer: jest.fn(),
      updateBookingStatus: jest.fn(),
      cancelBooking: jest.fn(),
      rescheduleBooking: jest.fn(),
      getAvailableSlots: jest.fn(),
      getBookings: jest.fn(),
      getBookingStatistics: jest.fn(),
      getUpcomingBookings: jest.fn(),
      sendBookingReminder: jest.fn(),
      assignConsultant: jest.fn(),
    } as any;

    bookingController = new BookingController(mockBookingService);

    mockRequest = {
      body: {},
      params: {},
      query: {},
      user: {
        id: 'user-123',
        email: 'test@example.com',
        role: 'CUSTOMER',
      },
    };

    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };

    mockNext = jest.fn();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createBooking', () => {
    it('should create a home measurement booking successfully', async () => {
      const bookingData = {
        type: BookingType.HOME_MEASUREMENT,
        categories: ['KITCHEN', 'BEDROOM'],
        customerDetails: {
          name: 'John Doe',
          email: 'john@example.com',
          phone: '+44 20 1234 5678',
          postcode: 'SW1A 1AA',
          address: '10 Downing Street, London',
        },
        scheduledDate: '2026-03-15T10:00:00Z',
        notes: 'Please call before arriving',
      };

      const mockCreatedBooking = {
        id: 'booking-123',
        bookingNumber: 'BK-2026-001',
        customerId: 'user-123',
        type: BookingType.HOME_MEASUREMENT,
        status: BookingStatus.PENDING,
        categories: ['KITCHEN', 'BEDROOM'],
        customerName: 'John Doe',
        customerEmail: 'john@example.com',
        customerPhone: '+44 20 1234 5678',
        postcode: 'SW1A 1AA',
        address: '10 Downing Street, London',
        scheduledDate: new Date('2026-03-15T10:00:00Z'),
        notes: 'Please call before arriving',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockRequest.body = bookingData;
      mockBookingService.createBooking.mockResolvedValue(
        mockCreatedBooking as any
      );

      await bookingController.createBooking(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockBookingService.createBooking).toHaveBeenCalledWith({
        customerId: 'user-123',
        type: BookingType.HOME_MEASUREMENT,
        categories: ['KITCHEN', 'BEDROOM'],
        customerDetails: bookingData.customerDetails,
        scheduledDate: new Date('2026-03-15T10:00:00Z'),
        notes: 'Please call before arriving',
      });
      expect(mockResponse.status).toHaveBeenCalledWith(201);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: mockCreatedBooking,
        message: 'Booking created successfully. Confirmation email sent.',
      });
    });

    it('should create an online consultation booking successfully', async () => {
      const bookingData = {
        type: BookingType.ONLINE,
        categories: ['KITCHEN'],
        customerDetails: {
          name: 'Jane Smith',
          email: 'jane@example.com',
          phone: '+44 20 9876 5432',
          postcode: 'E1 6AN',
          address: '221B Baker Street, London',
        },
        scheduledDate: '2026-03-20T14:00:00Z',
        preferredPlatform: 'Zoom',
      };

      const mockCreatedBooking = {
        id: 'booking-456',
        bookingNumber: 'BK-2026-002',
        type: BookingType.ONLINE,
        status: BookingStatus.CONFIRMED,
        categories: ['KITCHEN'],
        scheduledDate: new Date('2026-03-20T14:00:00Z'),
        meetingLink: 'https://zoom.us/j/123456789',
        meetingPassword: 'meeting123',
        createdAt: new Date(),
      };

      mockRequest.body = bookingData;
      mockBookingService.createBooking.mockResolvedValue(
        mockCreatedBooking as any
      );

      await bookingController.createBooking(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.status).toHaveBeenCalledWith(201);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: mockCreatedBooking,
        message: 'Booking created successfully. Confirmation email sent.',
      });
    });

    it('should create a showroom visit booking successfully', async () => {
      const bookingData = {
        type: BookingType.SHOWROOM,
        categories: ['BEDROOM'],
        showroomId: 'showroom-001',
        customerDetails: {
          name: 'Bob Johnson',
          email: 'bob@example.com',
          phone: '+44 20 5555 1234',
          postcode: 'W1A 1AA',
          address: 'Oxford Street, London',
        },
        scheduledDate: '2026-03-25T11:00:00Z',
      };

      const mockCreatedBooking = {
        id: 'booking-789',
        bookingNumber: 'BK-2026-003',
        type: BookingType.SHOWROOM,
        status: BookingStatus.CONFIRMED,
        showroomId: 'showroom-001',
        categories: ['BEDROOM'],
        scheduledDate: new Date('2026-03-25T11:00:00Z'),
        showroom: {
          id: 'showroom-001',
          name: 'London Showroom',
          address: '123 High Street, London',
        },
        createdAt: new Date(),
      };

      mockRequest.body = bookingData;
      mockBookingService.createBooking.mockResolvedValue(
        mockCreatedBooking as any
      );

      await bookingController.createBooking(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockBookingService.createBooking).toHaveBeenCalledWith(
        expect.objectContaining({
          type: BookingType.SHOWROOM,
          showroomId: 'showroom-001',
        })
      );
      expect(mockResponse.status).toHaveBeenCalledWith(201);
    });

    it('should handle validation errors for missing categories', async () => {
      const invalidBookingData = {
        type: BookingType.HOME_MEASUREMENT,
        categories: [],
        customerDetails: {
          name: 'John Doe',
          email: 'john@example.com',
          phone: '+44 20 1234 5678',
          postcode: 'SW1A 1AA',
          address: '10 Downing Street, London',
        },
        scheduledDate: '2026-03-15T10:00:00Z',
      };

      mockRequest.body = invalidBookingData;
      const validationError = new AppError(
        'At least one category (Kitchen or Bedroom) must be selected',
        400
      );
      mockBookingService.createBooking.mockRejectedValue(validationError);

      await bookingController.createBooking(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith(validationError);
    });

    it('should handle validation errors for missing customer details', async () => {
      const invalidBookingData = {
        type: BookingType.HOME_MEASUREMENT,
        categories: ['KITCHEN'],
        customerDetails: {
          name: '',
          email: '',
          phone: '',
          postcode: '',
          address: '',
        },
        scheduledDate: '2026-03-15T10:00:00Z',
      };

      mockRequest.body = invalidBookingData;
      const validationError = new AppError(
        'Customer details are required',
        400
      );
      mockBookingService.createBooking.mockRejectedValue(validationError);

      await bookingController.createBooking(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith(validationError);
    });

    it('should handle slot unavailability errors', async () => {
      const bookingData = {
        type: BookingType.HOME_MEASUREMENT,
        categories: ['KITCHEN'],
        customerDetails: {
          name: 'John Doe',
          email: 'john@example.com',
          phone: '+44 20 1234 5678',
          postcode: 'SW1A 1AA',
          address: '10 Downing Street, London',
        },
        scheduledDate: '2026-03-15T10:00:00Z',
      };

      mockRequest.body = bookingData;
      const slotError = new AppError(
        'Selected time slot is not available',
        400
      );
      mockBookingService.createBooking.mockRejectedValue(slotError);

      await bookingController.createBooking(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith(slotError);
    });

    it('should handle past date validation errors', async () => {
      const invalidBookingData = {
        type: BookingType.HOME_MEASUREMENT,
        categories: ['KITCHEN'],
        customerDetails: {
          name: 'John Doe',
          email: 'john@example.com',
          phone: '+44 20 1234 5678',
          postcode: 'SW1A 1AA',
          address: '10 Downing Street, London',
        },
        scheduledDate: '2025-01-01T10:00:00Z',
      };

      mockRequest.body = invalidBookingData;
      const dateError = new AppError(
        'Cannot book appointments in the past',
        400
      );
      mockBookingService.createBooking.mockRejectedValue(dateError);

      await bookingController.createBooking(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith(dateError);
    });

    it('should handle showroom booking without showroomId', async () => {
      const invalidBookingData = {
        type: BookingType.SHOWROOM,
        categories: ['KITCHEN'],
        customerDetails: {
          name: 'John Doe',
          email: 'john@example.com',
          phone: '+44 20 1234 5678',
          postcode: 'SW1A 1AA',
          address: '10 Downing Street, London',
        },
        scheduledDate: '2026-03-15T10:00:00Z',
      };

      mockRequest.body = invalidBookingData;
      const validationError = new AppError(
        'Showroom ID is required for showroom bookings',
        400
      );
      mockBookingService.createBooking.mockRejectedValue(validationError);

      await bookingController.createBooking(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith(validationError);
    });

    it('should send special notification for both categories booking', async () => {
      const bookingData = {
        type: BookingType.HOME_MEASUREMENT,
        categories: ['KITCHEN', 'BEDROOM'],
        customerDetails: {
          name: 'John Doe',
          email: 'john@example.com',
          phone: '+44 20 1234 5678',
          postcode: 'SW1A 1AA',
          address: '10 Downing Street, London',
        },
        scheduledDate: '2026-03-15T10:00:00Z',
      };

      const mockCreatedBooking = {
        id: 'booking-123',
        categories: ['KITCHEN', 'BEDROOM'],
        requiresMultiTeamNotification: true,
      };

      mockRequest.body = bookingData;
      mockBookingService.createBooking.mockResolvedValue(
        mockCreatedBooking as any
      );

      await bookingController.createBooking(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Booking created successfully. Confirmation email sent.',
        })
      );
    });
  });

  describe('getBookingById', () => {
    it('should retrieve a booking by ID', async () => {
      const mockBooking = {
        id: 'booking-123',
        bookingNumber: 'BK-2026-001',
        customerId: 'user-123',
        type: BookingType.HOME_MEASUREMENT,
        status: BookingStatus.CONFIRMED,
        categories: ['KITCHEN'],
        scheduledDate: new Date('2026-03-15T10:00:00Z'),
        customer: {
          id: 'user-123',
          email: 'john@example.com',
          name: 'John Doe',
        },
        createdAt: new Date(),
      };

      mockRequest.params = { id: 'booking-123' };
      mockBookingService.getBookingById.mockResolvedValue(mockBooking as any);

      await bookingController.getBookingById(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockBookingService.getBookingById).toHaveBeenCalledWith(
        'booking-123'
      );
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: mockBooking,
      });
    });

    it('should return 404 when booking is not found', async () => {
      mockRequest.params = { id: 'non-existent' };
      const notFoundError = new AppError('Booking not found', 404);
      mockBookingService.getBookingById.mockRejectedValue(notFoundError);

      await bookingController.getBookingById(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith(notFoundError);
    });

    it('should prevent unauthorized access to other users bookings', async () => {
      mockRequest.params = { id: 'booking-123' };
      mockRequest.user = { id: 'other-user', role: 'CUSTOMER' };

      const unauthorizedError = new AppError(
        'Unauthorized to access this booking',
        403
      );
      mockBookingService.getBookingById.mockRejectedValue(unauthorizedError);

      await bookingController.getBookingById(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith(unauthorizedError);
    });

    it('should allow admin to access any booking', async () => {
      const mockBooking = {
        id: 'booking-123',
        customerId: 'other-user',
        status: BookingStatus.CONFIRMED,
      };

      mockRequest.params = { id: 'booking-123' };
      mockRequest.user = { id: 'admin-123', role: 'ADMIN' };
      mockBookingService.getBookingById.mockResolvedValue(mockBooking as any);

      await bookingController.getBookingById(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: mockBooking,
      });
    });
  });

  describe('getMyBookings', () => {
    it('should retrieve all bookings for the authenticated user', async () => {
      const mockBookings = {
        data: [
          {
            id: 'booking-1',
            customerId: 'user-123',
            type: BookingType.HOME_MEASUREMENT,
            status: BookingStatus.CONFIRMED,
            scheduledDate: new Date('2026-03-15T10:00:00Z'),
          },
          {
            id: 'booking-2',
            customerId: 'user-123',
            type: BookingType.ONLINE,
            status: BookingStatus.COMPLETED,
            scheduledDate: new Date('2026-02-10T14:00:00Z'),
          },
        ],
        pagination: {
          total: 2,
          page: 1,
          limit: 10,
          totalPages: 1,
        },
      };

      mockRequest.query = { page: '1', limit: '10' };
      mockBookingService.getBookingsByCustomer.mockResolvedValue(
        mockBookings as any
      );

      await bookingController.getMyBookings(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockBookingService.getBookingsByCustomer).toHaveBeenCalledWith(
        'user-123',
        { page: 1, limit: 10 }
      );
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: mockBookings.data,
        pagination: mockBookings.pagination,
      });
    });

    it('should filter bookings by status', async () => {
      const mockBookings = {
        data: [
          {
            id: 'booking-1',
            status: BookingStatus.PENDING,
          },
        ],
        pagination: {
          total: 1,
          page: 1,
          limit: 10,
          totalPages: 1,
        },
      };

      mockRequest.query = {
        page: '1',
        limit: '10',
        status: 'PENDING',
      };
      mockBookingService.getBookingsByCustomer.mockResolvedValue(
        mockBookings as any
      );

      await bookingController.getMyBookings(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockBookingService.getBookingsByCustomer).toHaveBeenCalledWith(
        'user-123',
        {
          page: 1,
          limit: 10,
          status: BookingStatus.PENDING,
        }
      );
    });

    it('should filter bookings by type', async () => {
      const mockBookings = {
        data: [
          {
            id: 'booking-1',
            type: BookingType.SHOWROOM,
          },
        ],
        pagination: {
          total: 1,
          page: 1,
          limit: 10,
          totalPages: 1,
        },
      };

      mockRequest.query = {
        page: '1',
        limit: '10',
        type: 'SHOWROOM',
      };
      mockBookingService.getBookingsByCustomer.mockResolvedValue(
        mockBookings as any
      );

      await bookingController.getMyBookings(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockBookingService.getBookingsByCustomer).toHaveBeenCalledWith(
        'user-123',
        {
          page: 1,
          limit: 10,
          type: BookingType.SHOWROOM,
        }
      );
    });
  });

  describe('getAllBookings', () => {
    it('should retrieve all bookings for admin users', async () => {
      mockRequest.user = { id: 'admin-123', role: 'ADMIN' };
      mockRequest.query = { page: '1', limit: '20' };

      const mockBookings = {
        data: [
          {
            id: 'booking-1',
            customerId: 'customer-1',
            status: BookingStatus.PENDING,
          },
          {
            id: 'booking-2',
            customerId: 'customer-2',
            status: BookingStatus.CONFIRMED,
          },
        ],
        pagination: {
          total: 50,
          page: 1,
          limit: 20,
          totalPages: 3,
        },
      };

      mockBookingService.getBookings.mockResolvedValue(mockBookings as any);

      await bookingController.getAllBookings(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockBookingService.getBookings).toHaveBeenCalledWith({
        page: 1,
        limit: 20,
      });
      expect(mockResponse.status).toHaveBeenCalledWith(200);
    });

    it('should filter bookings by status for admin', async () => {
      mockRequest.user = { id: 'admin-123', role: 'ADMIN' };
      mockRequest.query = {
        page: '1',
        limit: '20',
        status: 'PENDING',
      };

      const mockBookings = {
        data: [{ id: 'booking-1', status: BookingStatus.PENDING }],
        pagination: { total: 1, page: 1, limit: 20, totalPages: 1 },
      };

      mockBookingService.getBookings.mockResolvedValue(mockBookings as any);

      await bookingController.getAllBookings(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockBookingService.getBookings).toHaveBeenCalledWith({
        page: 1,
        limit: 20,
        status: BookingStatus.PENDING,
      });
    });

    it('should deny access to non-admin users', async () => {
      mockRequest.user = { id: 'user-123', role: 'CUSTOMER' };

      const unauthorizedError = new AppError(
        'Admin access required',
        403
      );

      await bookingController.getAllBookings(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({ statusCode: 403 })
      );
    });
  });

  describe('updateBookingStatus', () => {
    it('should update booking status successfully', async () => {
      mockRequest.user = { id: 'admin-123', role: 'ADMIN' };
      mockRequest.params = { id: 'booking-123' };
      mockRequest.body = { status: 'CONFIRMED' };

      const mockUpdatedBooking = {
        id: 'booking-123',
        status: BookingStatus.CONFIRMED,
        confirmedAt: new Date(),
        updatedAt: new Date(),
      };

      mockBookingService.updateBookingStatus.mockResolvedValue(
        mockUpdatedBooking as any
      );

      await bookingController.updateBookingStatus(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockBookingService.updateBookingStatus).toHaveBeenCalledWith(
        'booking-123',
        BookingStatus.CONFIRMED
      );
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: mockUpdatedBooking,
        message: 'Booking status updated successfully',
      });
    });

    it('should reject invalid status transitions', async () => {
      mockRequest.user = { id: 'admin-123', role: 'ADMIN' };
      mockRequest.params = { id: 'booking-123' };
      mockRequest.body = { status: 'PENDING' };

      const transitionError = new AppError('Invalid status transition', 400);
      mockBookingService.updateBookingStatus.mockRejectedValue(transitionError);

      await bookingController.updateBookingStatus(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith(transitionError);
    });

    it('should require admin role for status updates', async () => {
      mockRequest.user = { id: 'user-123', role: 'CUSTOMER' };
      mockRequest.params = { id: 'booking-123' };
      mockRequest.body = { status: 'CONFIRMED' };

      await bookingController.updateBookingStatus(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({ statusCode: 403 })
      );
    });
  });

  describe('cancelBooking', () => {
    it('should cancel a booking successfully', async () => {
      const mockCancelledBooking = {
        id: 'booking-123',
        status: BookingStatus.CANCELLED,
        cancellationReason: 'Customer request',
        cancelledAt: new Date(),
      };

      mockRequest.params = { id: 'booking-123' };
      mockRequest.body = { reason: 'Customer request' };
      mockBookingService.cancelBooking.mockResolvedValue(
        mockCancelledBooking as any
      );

      await bookingController.cancelBooking(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockBookingService.cancelBooking).toHaveBeenCalledWith(
        'booking-123',
        {
          reason: 'Customer request',
          cancelledBy: 'user-123',
        }
      );
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: mockCancelledBooking,
        message: 'Booking cancelled successfully',
      });
    });

    it('should prevent cancellation less than 24 hours before appointment', async () => {
      mockRequest.params = { id: 'booking-123' };
      mockRequest.body = { reason: 'Customer request' };

      const cancelError = new AppError(
        'Cannot cancel booking less than 24 hours before scheduled time',
        400
      );
      mockBookingService.cancelBooking.mockRejectedValue(cancelError);

      await bookingController.cancelBooking(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith(cancelError);
    });

    it('should prevent cancellation of completed bookings', async () => {
      mockRequest.params = { id: 'booking-123' };
      mockRequest.body = { reason: 'Customer request' };

      const cancelError = new AppError(
        'Cannot cancel completed booking',
        400
      );
      mockBookingService.cancelBooking.mockRejectedValue(cancelError);

      await bookingController.cancelBooking(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith(cancelError);
    });

    it('should require cancellation reason', async () => {
      mockRequest.params = { id: 'booking-123' };
      mockRequest.body = { reason: '' };

      const validationError = new AppError(
        'Cancellation reason is required',
        400
      );
      mockBookingService.cancelBooking.mockRejectedValue(validationError);

      await bookingController.cancelBooking(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith(validationError);
    });
  });

  describe('rescheduleBooking', () => {
    it('should reschedule a booking successfully', async () => {
      const newScheduledDate = '2026-03-20T14:00:00Z';

      const mockRescheduledBooking = {
        id: 'booking-123',
        scheduledDate: new Date(newScheduledDate),
        previousScheduledDate: new Date('2026-03-15T10:00:00Z'),
        rescheduledAt: new Date(),
      };

      mockRequest.params = { id: 'booking-123' };
      mockRequest.body = { scheduledDate: newScheduledDate };
      mockBookingService.rescheduleBooking.mockResolvedValue(
        mockRescheduledBooking as any
      );

      await bookingController.rescheduleBooking(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockBookingService.rescheduleBooking).toHaveBeenCalledWith(
        'booking-123',
        new Date(newScheduledDate)
      );
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: mockRescheduledBooking,
        message: 'Booking rescheduled successfully',
      });
    });

    it('should handle new slot unavailability', async () => {
      mockRequest.params = { id: 'booking-123' };
      mockRequest.body = { scheduledDate: '2026-03-20T14:00:00Z' };

      const slotError = new AppError('New time slot is not available', 400);
      mockBookingService.rescheduleBooking.mockRejectedValue(slotError);

      await bookingController.rescheduleBooking(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith(slotError);
    });

    it('should prevent rescheduling to past dates', async () => {
      mockRequest.params = { id: 'booking-123' };
      mockRequest.body = { scheduledDate: '2025-01-01T10:00:00Z' };

      const dateError = new AppError(
        'Cannot reschedule to a past date',
        400
      );
      mockBookingService.rescheduleBooking.mockRejectedValue(dateError);

      await bookingController.rescheduleBooking(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith(dateError);
    });
  });

  describe('getAvailableSlots', () => {
    it('should retrieve available time slots for a date', async () => {
      const mockAvailableSlots = [
        { time: '09:00', available: true, consultantId: 'consultant-1' },
        { time: '10:00', available: true, consultantId: 'consultant-1' },
        { time: '11:00', available: false, consultantId: null },
        { time: '14:00', available: true, consultantId: 'consultant-2' },
      ];

      mockRequest.query = {
        date: '2026-03-15',
        type: 'HOME_MEASUREMENT',
      };
      mockBookingService.getAvailableSlots.mockResolvedValue(
        mockAvailableSlots as any
      );

      await bookingController.getAvailableSlots(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockBookingService.getAvailableSlots).toHaveBeenCalledWith({
        date: new Date('2026-03-15'),
        type: BookingType.HOME_MEASUREMENT,
      });
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: mockAvailableSlots,
      });
    });

    it('should filter slots by showroom', async () => {
      const mockAvailableSlots = [
        { time: '10:00', available: true, showroomId: 'showroom-001' },
      ];

      mockRequest.query = {
        date: '2026-03-15',
        type: 'SHOWROOM',
        showroomId: 'showroom-001',
      };
      mockBookingService.getAvailableSlots.mockResolvedValue(
        mockAvailableSlots as any
      );

      await bookingController.getAvailableSlots(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockBookingService.getAvailableSlots).toHaveBeenCalledWith({
        date: new Date('2026-03-15'),
        type: BookingType.SHOWROOM,
        showroomId: 'showroom-001',
      });
    });

    it('should handle missing date parameter', async () => {
      mockRequest.query = { type: 'HOME_MEASUREMENT' };

      await bookingController.getAvailableSlots(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({ statusCode: 400 })
      );
    });
  });

  describe('getBookingStatistics', () => {
    it('should retrieve booking statistics for admin', async () => {
      mockRequest.user = { id: 'admin-123', role: 'ADMIN' };

      const mockStats = {
        total: 150,
        pending: 25,
        confirmed: 80,
        completed: 40,
        cancelled: 5,
        byType: {
          HOME_MEASUREMENT: 60,
          ONLINE: 50,
          SHOWROOM: 40,
        },
        byCategory: {
          KITCHEN: 80,
          BEDROOM: 50,
          BOTH: 20,
        },
      };

      mockBookingService.getBookingStatistics.mockResolvedValue(
        mockStats as any
      );

      await bookingController.getBookingStatistics(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockBookingService.getBookingStatistics).toHaveBeenCalled();
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: mockStats,
      });
    });

    it('should deny access to non-admin users', async () => {
      mockRequest.user = { id: 'user-123', role: 'CUSTOMER' };

      await bookingController.getBookingStatistics(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({ statusCode: 403 })
      );
    });
  });

  describe('getUpcomingBookings', () => {
    it('should retrieve upcoming bookings', async () => {
      const mockUpcomingBookings = {
        data: [
          {
            id: 'booking-1',
            scheduledDate: new Date('2026-03-15T10:00:00Z'),
            status: BookingStatus.CONFIRMED,
          },
          {
            id: 'booking-2',
            scheduledDate: new Date('2026-03-20T14:00:00Z'),
            status: BookingStatus.CONFIRMED,
          },
        ],
        pagination: {
          total: 2,
          page: 1,
          limit: 10,
          totalPages: 1,
        },
      };

      mockRequest.query = { page: '1', limit: '10' };
      mockBookingService.getUpcomingBookings.mockResolvedValue(
        mockUpcomingBookings as any
      );

      await bookingController.getUpcomingBookings(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockBookingService.getUpcomingBookings).toHaveBeenCalledWith({
        page: 1,
        limit: 10,
      });
      expect(mockResponse.status).toHaveBeenCalledWith(200);
    });
  });

  describe('assignConsultant', () => {
    it('should assign a consultant to a booking', async () => {
      mockRequest.user = { id: 'admin-123', role: 'ADMIN' };
      mockRequest.params = { id: 'booking-123' };
      mockRequest.body = { consultantId: 'consultant-1' };

      const mockUpdatedBooking = {
        id: 'booking-123',
        consultantId: 'consultant-1',
        assignedAt: new Date(),
        consultant: {
          id: 'consultant-1',
          name: 'Sarah Consultant',
          email: 'sarah@lomashwood.com',
        },
      };

      mockBookingService.assignConsultant.mockResolvedValue(
        mockUpdatedBooking as any
      );

      await bookingController.assignConsultant(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockBookingService.assignConsultant).toHaveBeenCalledWith(
        'booking-123',
        'consultant-1'
      );
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: mockUpdatedBooking,
        message: 'Consultant assigned successfully',
      });
    });

    it('should require admin role', async () => {
      mockRequest.user = { id: 'user-123', role: 'CUSTOMER' };
      mockRequest.params = { id: 'booking-123' };
      mockRequest.body = { consultantId: 'consultant-1' };

      await bookingController.assignConsultant(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({ statusCode: 403 })
      );
    });
  });

  describe('error handling', () => {
    it('should handle database errors gracefully', async () => {
      mockRequest.params = { id: 'booking-123' };
      const dbError = new Error('Database connection failed');
      mockBookingService.getBookingById.mockRejectedValue(dbError);

      await bookingController.getBookingById(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith(dbError);
    });

    it('should handle service unavailable errors', async () => {
      mockRequest.body = {
        type: BookingType.HOME_MEASUREMENT,
        categories: ['KITCHEN'],
        customerDetails: {
          name: 'John Doe',
          email: 'john@example.com',
          phone: '+44 20 1234 5678',
          postcode: 'SW1A 1AA',
          address: '10 Downing Street, London',
        },
        scheduledDate: '2026-03-15T10:00:00Z',
      };

      const serviceError = new AppError(
        'Notification service temporarily unavailable',
        503
      );
      mockBookingService.createBooking.mockRejectedValue(serviceError);

      await bookingController.createBooking(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith(serviceError);
    });
  });
});