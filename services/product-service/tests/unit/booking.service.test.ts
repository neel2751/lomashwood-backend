

import { BookingService } from '../../src/app/bookings/booking.service';
import { BookingRepository } from '../../src/app/bookings/booking.repository';
import { AppError } from '../../src/shared/errors';
import { BookingStatus, BookingType } from '@prisma/client';
import { EventProducer } from '../../src/infrastructure/messaging/event-producer';

describe('BookingService', () => {
  let bookingService: BookingService;
  let mockBookingRepository: jest.Mocked<BookingRepository>;
  let mockEventProducer: jest.Mocked<EventProducer>;

  beforeEach(() => {
    mockBookingRepository = {
      create: jest.fn(),
      findById: jest.fn(),
      findByCustomerId: jest.fn(),
      findAll: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      checkSlotAvailability: jest.fn(),
      getAvailableSlots: jest.fn(),
      countByStatus: jest.fn(),
      findByDateRange: jest.fn(),
      findByConsultant: jest.fn(),
      findByShowroom: jest.fn(),
    } as any;

    mockEventProducer = {
      publish: jest.fn(),
      publishBatch: jest.fn(),
    } as any;

    bookingService = new BookingService(
      mockBookingRepository,
      mockEventProducer
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createBooking', () => {
    it('should create a booking for home measurement successfully', async () => {
      const bookingData = {
        customerId: 'customer-123',
        type: BookingType.HOME_MEASUREMENT,
        categories: ['KITCHEN', 'BEDROOM'],
        customerDetails: {
          name: 'John Doe',
          email: 'john@example.com',
          phone: '+44 20 1234 5678',
          postcode: 'SW1A 1AA',
          address: '10 Downing Street, London',
        },
        scheduledDate: new Date('2026-03-15T10:00:00Z'),
        notes: 'Please call before arriving',
      };

      const mockCreatedBooking = {
        id: 'booking-123',
        bookingNumber: 'BK-2026-001',
        customerId: 'customer-123',
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

      mockBookingRepository.checkSlotAvailability.mockResolvedValue(true);
      mockBookingRepository.create.mockResolvedValue(mockCreatedBooking as any);
      mockEventProducer.publish.mockResolvedValue(undefined);

      const result = await bookingService.createBooking(bookingData);

      expect(mockBookingRepository.checkSlotAvailability).toHaveBeenCalledWith({
        date: bookingData.scheduledDate,
        type: bookingData.type,
      });
      expect(mockBookingRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          customerId: bookingData.customerId,
          type: bookingData.type,
          categories: bookingData.categories,
        })
      );
      expect(mockEventProducer.publish).toHaveBeenCalledWith(
        'booking.created',
        expect.objectContaining({
          bookingId: 'booking-123',
          type: BookingType.HOME_MEASUREMENT,
          categories: ['KITCHEN', 'BEDROOM'],
        })
      );
      expect(result).toEqual(mockCreatedBooking);
    });

    it('should create a booking for online consultation successfully', async () => {
      const bookingData = {
        customerId: 'customer-456',
        type: BookingType.ONLINE,
        categories: ['KITCHEN'],
        customerDetails: {
          name: 'Jane Smith',
          email: 'jane@example.com',
          phone: '+44 20 9876 5432',
          postcode: 'E1 6AN',
          address: '221B Baker Street, London',
        },
        scheduledDate: new Date('2026-03-20T14:00:00Z'),
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
        createdAt: new Date(),
      };

      mockBookingRepository.checkSlotAvailability.mockResolvedValue(true);
      mockBookingRepository.create.mockResolvedValue(mockCreatedBooking as any);

      const result = await bookingService.createBooking(bookingData);

      expect(result.type).toBe(BookingType.ONLINE);
      expect(result.meetingLink).toBeDefined();
    });

    it('should create a booking for showroom visit successfully', async () => {
      const bookingData = {
        customerId: 'customer-789',
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
        scheduledDate: new Date('2026-03-25T11:00:00Z'),
      };

      const mockCreatedBooking = {
        id: 'booking-789',
        bookingNumber: 'BK-2026-003',
        type: BookingType.SHOWROOM,
        status: BookingStatus.CONFIRMED,
        showroomId: 'showroom-001',
        scheduledDate: new Date('2026-03-25T11:00:00Z'),
        createdAt: new Date(),
      };

      mockBookingRepository.checkSlotAvailability.mockResolvedValue(true);
      mockBookingRepository.create.mockResolvedValue(mockCreatedBooking as any);

      const result = await bookingService.createBooking(bookingData);

      expect(result.type).toBe(BookingType.SHOWROOM);
      expect(result.showroomId).toBe('showroom-001');
    });

    it('should throw error if slot is not available', async () => {
      const bookingData = {
        customerId: 'customer-123',
        type: BookingType.HOME_MEASUREMENT,
        categories: ['KITCHEN'],
        customerDetails: {
          name: 'John Doe',
          email: 'john@example.com',
          phone: '+44 20 1234 5678',
          postcode: 'SW1A 1AA',
          address: '10 Downing Street, London',
        },
        scheduledDate: new Date('2026-03-15T10:00:00Z'),
      };

      mockBookingRepository.checkSlotAvailability.mockResolvedValue(false);

      await expect(bookingService.createBooking(bookingData)).rejects.toThrow(
        AppError
      );
      await expect(bookingService.createBooking(bookingData)).rejects.toThrow(
        'Selected time slot is not available'
      );

      expect(mockBookingRepository.create).not.toHaveBeenCalled();
    });

    it('should throw error if scheduled date is in the past', async () => {
      const bookingData = {
        customerId: 'customer-123',
        type: BookingType.HOME_MEASUREMENT,
        categories: ['KITCHEN'],
        customerDetails: {
          name: 'John Doe',
          email: 'john@example.com',
          phone: '+44 20 1234 5678',
          postcode: 'SW1A 1AA',
          address: '10 Downing Street, London',
        },
        scheduledDate: new Date('2025-01-01T10:00:00Z'),
      };

      await expect(bookingService.createBooking(bookingData)).rejects.toThrow(
        AppError
      );
      await expect(bookingService.createBooking(bookingData)).rejects.toThrow(
        'Cannot book appointments in the past'
      );
    });

    it('should throw error if categories array is empty', async () => {
      const bookingData = {
        customerId: 'customer-123',
        type: BookingType.HOME_MEASUREMENT,
        categories: [],
        customerDetails: {
          name: 'John Doe',
          email: 'john@example.com',
          phone: '+44 20 1234 5678',
          postcode: 'SW1A 1AA',
          address: '10 Downing Street, London',
        },
        scheduledDate: new Date('2026-03-15T10:00:00Z'),
      };

      await expect(bookingService.createBooking(bookingData)).rejects.toThrow(
        AppError
      );
      await expect(bookingService.createBooking(bookingData)).rejects.toThrow(
        'At least one category (Kitchen or Bedroom) must be selected'
      );
    });

    it('should throw error if showroom booking without showroomId', async () => {
      const bookingData = {
        customerId: 'customer-123',
        type: BookingType.SHOWROOM,
        categories: ['KITCHEN'],
        customerDetails: {
          name: 'John Doe',
          email: 'john@example.com',
          phone: '+44 20 1234 5678',
          postcode: 'SW1A 1AA',
          address: '10 Downing Street, London',
        },
        scheduledDate: new Date('2026-03-15T10:00:00Z'),
      };

      await expect(bookingService.createBooking(bookingData)).rejects.toThrow(
        AppError
      );
      await expect(bookingService.createBooking(bookingData)).rejects.toThrow(
        'Showroom ID is required for showroom bookings'
      );
    });

    it('should send notification for both categories booking', async () => {
      const bookingData = {
        customerId: 'customer-123',
        type: BookingType.HOME_MEASUREMENT,
        categories: ['KITCHEN', 'BEDROOM'],
        customerDetails: {
          name: 'John Doe',
          email: 'john@example.com',
          phone: '+44 20 1234 5678',
          postcode: 'SW1A 1AA',
          address: '10 Downing Street, London',
        },
        scheduledDate: new Date('2026-03-15T10:00:00Z'),
      };

      const mockCreatedBooking = {
        id: 'booking-123',
        categories: ['KITCHEN', 'BEDROOM'],
        customerEmail: 'john@example.com',
      };

      mockBookingRepository.checkSlotAvailability.mockResolvedValue(true);
      mockBookingRepository.create.mockResolvedValue(mockCreatedBooking as any);

      await bookingService.createBooking(bookingData);

      expect(mockEventProducer.publish).toHaveBeenCalledWith(
        'booking.created',
        expect.objectContaining({
          requiresMultiTeamNotification: true,
          categories: ['KITCHEN', 'BEDROOM'],
        })
      );
    });
  });

  describe('getBookingById', () => {
    it('should retrieve a booking by ID', async () => {
      const mockBooking = {
        id: 'booking-123',
        bookingNumber: 'BK-2026-001',
        customerId: 'customer-123',
        type: BookingType.HOME_MEASUREMENT,
        status: BookingStatus.CONFIRMED,
        categories: ['KITCHEN'],
        scheduledDate: new Date('2026-03-15T10:00:00Z'),
        createdAt: new Date(),
      };

      mockBookingRepository.findById.mockResolvedValue(mockBooking as any);

      const result = await bookingService.getBookingById('booking-123');

      expect(mockBookingRepository.findById).toHaveBeenCalledWith('booking-123');
      expect(result).toEqual(mockBooking);
    });

    it('should throw error if booking not found', async () => {
      mockBookingRepository.findById.mockResolvedValue(null);

      await expect(
        bookingService.getBookingById('non-existent')
      ).rejects.toThrow(AppError);
      await expect(
        bookingService.getBookingById('non-existent')
      ).rejects.toThrow('Booking not found');
    });
  });

  describe('getBookingsByCustomer', () => {
    it('should retrieve all bookings for a customer', async () => {
      const mockBookings = {
        data: [
          {
            id: 'booking-1',
            customerId: 'customer-123',
            type: BookingType.HOME_MEASUREMENT,
            status: BookingStatus.CONFIRMED,
            scheduledDate: new Date('2026-03-15T10:00:00Z'),
          },
          {
            id: 'booking-2',
            customerId: 'customer-123',
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

      mockBookingRepository.findByCustomerId.mockResolvedValue(
        mockBookings as any
      );

      const result = await bookingService.getBookingsByCustomer('customer-123', {
        page: 1,
        limit: 10,
      });

      expect(mockBookingRepository.findByCustomerId).toHaveBeenCalledWith(
        'customer-123',
        { page: 1, limit: 10 }
      );
      expect(result.data).toHaveLength(2);
      expect(result.pagination.total).toBe(2);
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

      mockBookingRepository.findByCustomerId.mockResolvedValue(
        mockBookings as any
      );

      const result = await bookingService.getBookingsByCustomer('customer-123', {
        page: 1,
        limit: 10,
        status: BookingStatus.PENDING,
      });

      expect(mockBookingRepository.findByCustomerId).toHaveBeenCalledWith(
        'customer-123',
        {
          page: 1,
          limit: 10,
          status: BookingStatus.PENDING,
        }
      );
      expect(result.data).toHaveLength(1);
    });
  });

  describe('updateBookingStatus', () => {
    it('should update booking status to confirmed', async () => {
      const mockBooking = {
        id: 'booking-123',
        status: BookingStatus.PENDING,
      };

      const mockUpdatedBooking = {
        id: 'booking-123',
        status: BookingStatus.CONFIRMED,
        confirmedAt: new Date(),
        updatedAt: new Date(),
      };

      mockBookingRepository.findById.mockResolvedValue(mockBooking as any);
      mockBookingRepository.update.mockResolvedValue(mockUpdatedBooking as any);

      const result = await bookingService.updateBookingStatus(
        'booking-123',
        BookingStatus.CONFIRMED
      );

      expect(mockBookingRepository.update).toHaveBeenCalledWith('booking-123', {
        status: BookingStatus.CONFIRMED,
        confirmedAt: expect.any(Date),
      });
      expect(mockEventProducer.publish).toHaveBeenCalledWith(
        'booking.status.updated',
        expect.objectContaining({
          bookingId: 'booking-123',
          newStatus: BookingStatus.CONFIRMED,
          previousStatus: BookingStatus.PENDING,
        })
      );
      expect(result.status).toBe(BookingStatus.CONFIRMED);
    });

    it('should update booking status to completed', async () => {
      const mockBooking = {
        id: 'booking-123',
        status: BookingStatus.CONFIRMED,
      };

      const mockUpdatedBooking = {
        id: 'booking-123',
        status: BookingStatus.COMPLETED,
        completedAt: new Date(),
      };

      mockBookingRepository.findById.mockResolvedValue(mockBooking as any);
      mockBookingRepository.update.mockResolvedValue(mockUpdatedBooking as any);

      const result = await bookingService.updateBookingStatus(
        'booking-123',
        BookingStatus.COMPLETED
      );

      expect(result.status).toBe(BookingStatus.COMPLETED);
      expect(result.completedAt).toBeDefined();
    });

    it('should throw error for invalid status transition', async () => {
      const mockBooking = {
        id: 'booking-123',
        status: BookingStatus.COMPLETED,
      };

      mockBookingRepository.findById.mockResolvedValue(mockBooking as any);

      await expect(
        bookingService.updateBookingStatus('booking-123', BookingStatus.PENDING)
      ).rejects.toThrow(AppError);
      await expect(
        bookingService.updateBookingStatus('booking-123', BookingStatus.PENDING)
      ).rejects.toThrow('Invalid status transition');
    });

    it('should throw error if booking not found', async () => {
      mockBookingRepository.findById.mockResolvedValue(null);

      await expect(
        bookingService.updateBookingStatus(
          'non-existent',
          BookingStatus.CONFIRMED
        )
      ).rejects.toThrow(AppError);
      await expect(
        bookingService.updateBookingStatus(
          'non-existent',
          BookingStatus.CONFIRMED
        )
      ).rejects.toThrow('Booking not found');
    });
  });

  describe('cancelBooking', () => {
    it('should cancel a booking successfully', async () => {
      const mockBooking = {
        id: 'booking-123',
        status: BookingStatus.CONFIRMED,
        scheduledDate: new Date('2026-03-15T10:00:00Z'),
      };

      const mockCancelledBooking = {
        id: 'booking-123',
        status: BookingStatus.CANCELLED,
        cancellationReason: 'Customer request',
        cancelledAt: new Date(),
      };

      mockBookingRepository.findById.mockResolvedValue(mockBooking as any);
      mockBookingRepository.update.mockResolvedValue(
        mockCancelledBooking as any
      );

      const result = await bookingService.cancelBooking('booking-123', {
        reason: 'Customer request',
        cancelledBy: 'customer-123',
      });

      expect(mockBookingRepository.update).toHaveBeenCalledWith('booking-123', {
        status: BookingStatus.CANCELLED,
        cancellationReason: 'Customer request',
        cancelledAt: expect.any(Date),
        cancelledBy: 'customer-123',
      });
      expect(mockEventProducer.publish).toHaveBeenCalledWith(
        'booking.cancelled',
        expect.objectContaining({
          bookingId: 'booking-123',
          reason: 'Customer request',
        })
      );
      expect(result.status).toBe(BookingStatus.CANCELLED);
    });

    it('should throw error if cancellation is too late', async () => {
      const mockBooking = {
        id: 'booking-123',
        status: BookingStatus.CONFIRMED,
        scheduledDate: new Date(Date.now() + 2 * 60 * 60 * 1000), // 2 hours from now
      };

      mockBookingRepository.findById.mockResolvedValue(mockBooking as any);

      await expect(
        bookingService.cancelBooking('booking-123', {
          reason: 'Customer request',
          cancelledBy: 'customer-123',
        })
      ).rejects.toThrow(AppError);
      await expect(
        bookingService.cancelBooking('booking-123', {
          reason: 'Customer request',
          cancelledBy: 'customer-123',
        })
      ).rejects.toThrow(
        'Cannot cancel booking less than 24 hours before scheduled time'
      );
    });

    it('should throw error if booking is already completed', async () => {
      const mockBooking = {
        id: 'booking-123',
        status: BookingStatus.COMPLETED,
      };

      mockBookingRepository.findById.mockResolvedValue(mockBooking as any);

      await expect(
        bookingService.cancelBooking('booking-123', {
          reason: 'Customer request',
          cancelledBy: 'customer-123',
        })
      ).rejects.toThrow(AppError);
      await expect(
        bookingService.cancelBooking('booking-123', {
          reason: 'Customer request',
          cancelledBy: 'customer-123',
        })
      ).rejects.toThrow('Cannot cancel completed booking');
    });

    it('should require cancellation reason', async () => {
      const mockBooking = {
        id: 'booking-123',
        status: BookingStatus.CONFIRMED,
        scheduledDate: new Date('2026-03-15T10:00:00Z'),
      };

      mockBookingRepository.findById.mockResolvedValue(mockBooking as any);

      await expect(
        bookingService.cancelBooking('booking-123', {
          reason: '',
          cancelledBy: 'customer-123',
        })
      ).rejects.toThrow(AppError);
      await expect(
        bookingService.cancelBooking('booking-123', {
          reason: '',
          cancelledBy: 'customer-123',
        })
      ).rejects.toThrow('Cancellation reason is required');
    });
  });

  describe('rescheduleBooking', () => {
    it('should reschedule a booking successfully', async () => {
      const mockBooking = {
        id: 'booking-123',
        status: BookingStatus.CONFIRMED,
        scheduledDate: new Date('2026-03-15T10:00:00Z'),
        type: BookingType.HOME_MEASUREMENT,
      };

      const newScheduledDate = new Date('2026-03-20T14:00:00Z');

      const mockRescheduledBooking = {
        id: 'booking-123',
        scheduledDate: newScheduledDate,
        previousScheduledDate: new Date('2026-03-15T10:00:00Z'),
        rescheduledAt: new Date(),
        updatedAt: new Date(),
      };

      mockBookingRepository.findById.mockResolvedValue(mockBooking as any);
      mockBookingRepository.checkSlotAvailability.mockResolvedValue(true);
      mockBookingRepository.update.mockResolvedValue(
        mockRescheduledBooking as any
      );

      const result = await bookingService.rescheduleBooking(
        'booking-123',
        newScheduledDate
      );

      expect(mockBookingRepository.checkSlotAvailability).toHaveBeenCalledWith({
        date: newScheduledDate,
        type: BookingType.HOME_MEASUREMENT,
        excludeBookingId: 'booking-123',
      });
      expect(mockBookingRepository.update).toHaveBeenCalledWith('booking-123', {
        scheduledDate: newScheduledDate,
        previousScheduledDate: new Date('2026-03-15T10:00:00Z'),
        rescheduledAt: expect.any(Date),
      });
      expect(mockEventProducer.publish).toHaveBeenCalledWith(
        'booking.rescheduled',
        expect.objectContaining({
          bookingId: 'booking-123',
          newDate: newScheduledDate,
        })
      );
    });

    it('should throw error if new slot is not available', async () => {
      const mockBooking = {
        id: 'booking-123',
        status: BookingStatus.CONFIRMED,
        type: BookingType.HOME_MEASUREMENT,
      };

      const newScheduledDate = new Date('2026-03-20T14:00:00Z');

      mockBookingRepository.findById.mockResolvedValue(mockBooking as any);
      mockBookingRepository.checkSlotAvailability.mockResolvedValue(false);

      await expect(
        bookingService.rescheduleBooking('booking-123', newScheduledDate)
      ).rejects.toThrow(AppError);
      await expect(
        bookingService.rescheduleBooking('booking-123', newScheduledDate)
      ).rejects.toThrow('New time slot is not available');
    });

    it('should throw error if rescheduling to the past', async () => {
      const mockBooking = {
        id: 'booking-123',
        status: BookingStatus.CONFIRMED,
      };

      const pastDate = new Date('2025-01-01T10:00:00Z');

      mockBookingRepository.findById.mockResolvedValue(mockBooking as any);

      await expect(
        bookingService.rescheduleBooking('booking-123', pastDate)
      ).rejects.toThrow(AppError);
      await expect(
        bookingService.rescheduleBooking('booking-123', pastDate)
      ).rejects.toThrow('Cannot reschedule to a past date');
    });
  });

  describe('getAvailableSlots', () => {
    it('should retrieve available time slots for a date', async () => {
      const date = new Date('2026-03-15');
      const mockAvailableSlots = [
        {
          time: '09:00',
          available: true,
          consultantId: 'consultant-1',
        },
        {
          time: '10:00',
          available: true,
          consultantId: 'consultant-1',
        },
        {
          time: '11:00',
          available: false,
          consultantId: null,
        },
        {
          time: '14:00',
          available: true,
          consultantId: 'consultant-2',
        },
      ];

      mockBookingRepository.getAvailableSlots.mockResolvedValue(
        mockAvailableSlots as any
      );

      const result = await bookingService.getAvailableSlots({
        date,
        type: BookingType.HOME_MEASUREMENT,
      });

      expect(mockBookingRepository.getAvailableSlots).toHaveBeenCalledWith({
        date,
        type: BookingType.HOME_MEASUREMENT,
      });
      expect(result).toHaveLength(4);
      expect(result.filter((slot) => slot.available)).toHaveLength(3);
    });

    it('should filter slots by showroom', async () => {
      const date = new Date('2026-03-15');
      const mockAvailableSlots = [
        {
          time: '10:00',
          available: true,
          showroomId: 'showroom-001',
        },
      ];

      mockBookingRepository.getAvailableSlots.mockResolvedValue(
        mockAvailableSlots as any
      );

      const result = await bookingService.getAvailableSlots({
        date,
        type: BookingType.SHOWROOM,
        showroomId: 'showroom-001',
      });

      expect(mockBookingRepository.getAvailableSlots).toHaveBeenCalledWith({
        date,
        type: BookingType.SHOWROOM,
        showroomId: 'showroom-001',
      });
    });
  });

  describe('getBookingStatistics', () => {
    it('should retrieve booking statistics', async () => {
      const mockStats = {
        total: 150,
        pending: 25,
        confirmed: 80,
        completed: 40,
        cancelled: 5,
      };

      mockBookingRepository.countByStatus.mockImplementation(
        async (status?: BookingStatus) => {
          if (!status) return mockStats.total;
          return mockStats[status.toLowerCase() as keyof typeof mockStats] || 0;
        }
      );

      const result = await bookingService.getBookingStatistics();

      expect(result.total).toBe(150);
      expect(result.pending).toBe(25);
      expect(result.confirmed).toBe(80);
      expect(result.completed).toBe(40);
      expect(result.cancelled).toBe(5);
    });
  });

  describe('getUpcomingBookings', () => {
    it('should retrieve upcoming bookings', async () => {
      const mockBookings = {
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

      mockBookingRepository.findByDateRange.mockResolvedValue(
        mockBookings as any
      );

      const result = await bookingService.getUpcomingBookings({
        page: 1,
        limit: 10,
      });

      expect(mockBookingRepository.findByDateRange).toHaveBeenCalledWith(
        expect.objectContaining({
          startDate: expect.any(Date),
          endDate: expect.any(Date),
        })
      );
      expect(result.data).toHaveLength(2);
    });
  });

  describe('sendBookingReminder', () => {
    it('should send reminder for upcoming booking', async () => {
      const mockBooking = {
        id: 'booking-123',
        customerEmail: 'john@example.com',
        scheduledDate: new Date(Date.now() + 24 * 60 * 60 * 1000),
        type: BookingType.HOME_MEASUREMENT,
      };

      mockBookingRepository.findById.mockResolvedValue(mockBooking as any);

      await bookingService.sendBookingReminder('booking-123');

      expect(mockEventProducer.publish).toHaveBeenCalledWith(
        'booking.reminder.sent',
        expect.objectContaining({
          bookingId: 'booking-123',
          customerEmail: 'john@example.com',
        })
      );
    });

    it('should not send reminder for past bookings', async () => {
      const mockBooking = {
        id: 'booking-123',
        scheduledDate: new Date('2025-01-01T10:00:00Z'),
      };

      mockBookingRepository.findById.mockResolvedValue(mockBooking as any);

      await expect(
        bookingService.sendBookingReminder('booking-123')
      ).rejects.toThrow(AppError);
      await expect(
        bookingService.sendBookingReminder('booking-123')
      ).rejects.toThrow('Cannot send reminder for past booking');
    });
  });

  describe('error handling', () => {
    it('should handle repository errors gracefully', async () => {
      const dbError = new Error('Database connection failed');
      mockBookingRepository.findById.mockRejectedValue(dbError);

      await expect(
        bookingService.getBookingById('booking-123')
      ).rejects.toThrow('Database connection failed');
    });

    it('should handle event publishing errors gracefully', async () => {
      const bookingData = {
        customerId: 'customer-123',
        type: BookingType.HOME_MEASUREMENT,
        categories: ['KITCHEN'],
        customerDetails: {
          name: 'John Doe',
          email: 'john@example.com',
          phone: '+44 20 1234 5678',
          postcode: 'SW1A 1AA',
          address: '10 Downing Street, London',
        },
        scheduledDate: new Date('2026-03-15T10:00:00Z'),
      };

      mockBookingRepository.checkSlotAvailability.mockResolvedValue(true);
      mockBookingRepository.create.mockResolvedValue({ id: 'booking-123' } as any);
      mockEventProducer.publish.mockRejectedValue(
        new Error('Event bus unavailable')
      );

      const result = await bookingService.createBooking(bookingData);

      expect(result).toBeDefined();
      expect(result.id).toBe('booking-123');
    });
  });
});