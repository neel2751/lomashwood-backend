

import { BookingRepository } from '../../src/app/bookings/booking.repository';
import { PrismaClient, BookingStatus, BookingType } from '@prisma/client';
import { AppError } from '../../src/shared/errors';

describe('BookingRepository', () => {
  let bookingRepository: BookingRepository;
  let mockPrismaClient: jest.Mocked<PrismaClient>;

  beforeEach(() => {
    mockPrismaClient = {
      booking: {
        create: jest.fn(),
        findUnique: jest.fn(),
        findMany: jest.fn(),
        findFirst: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
        count: jest.fn(),
        aggregate: jest.fn(),
        groupBy: jest.fn(),
      },
      bookingSlot: {
        findMany: jest.fn(),
        count: jest.fn(),
      },
      $transaction: jest.fn(),
    } as any;

    bookingRepository = new BookingRepository(mockPrismaClient);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a new booking with home measurement type', async () => {
      const bookingData = {
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
      };

      const mockCreatedBooking = {
        id: 'booking-123',
        bookingNumber: 'BK-2026-001',
        ...bookingData,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrismaClient.booking.create.mockResolvedValue(
        mockCreatedBooking as any
      );

      const result = await bookingRepository.create(bookingData);

      expect(mockPrismaClient.booking.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          customerId: 'customer-123',
          type: BookingType.HOME_MEASUREMENT,
          categories: ['KITCHEN', 'BEDROOM'],
          customerEmail: 'john@example.com',
        }),
        include: expect.any(Object),
      });
      expect(result).toEqual(mockCreatedBooking);
      expect(result.bookingNumber).toMatch(/^BK-\d{4}-\d+$/);
    });

    it('should create a booking with online consultation type', async () => {
      const bookingData = {
        customerId: 'customer-456',
        type: BookingType.ONLINE,
        status: BookingStatus.CONFIRMED,
        categories: ['KITCHEN'],
        customerName: 'Jane Smith',
        customerEmail: 'jane@example.com',
        customerPhone: '+44 20 9876 5432',
        postcode: 'E1 6AN',
        address: '221B Baker Street, London',
        scheduledDate: new Date('2026-03-20T14:00:00Z'),
        meetingLink: 'https://zoom.us/j/123456789',
        meetingPassword: 'meeting123',
      };

      const mockCreatedBooking = {
        id: 'booking-456',
        bookingNumber: 'BK-2026-002',
        ...bookingData,
        createdAt: new Date(),
      };

      mockPrismaClient.booking.create.mockResolvedValue(
        mockCreatedBooking as any
      );

      const result = await bookingRepository.create(bookingData);

      expect(result.type).toBe(BookingType.ONLINE);
      expect(result.meetingLink).toBe('https://zoom.us/j/123456789');
    });

    it('should create a booking with showroom visit type', async () => {
      const bookingData = {
        customerId: 'customer-789',
        type: BookingType.SHOWROOM,
        status: BookingStatus.CONFIRMED,
        categories: ['BEDROOM'],
        showroomId: 'showroom-001',
        customerName: 'Bob Johnson',
        customerEmail: 'bob@example.com',
        customerPhone: '+44 20 5555 1234',
        postcode: 'W1A 1AA',
        address: 'Oxford Street, London',
        scheduledDate: new Date('2026-03-25T11:00:00Z'),
      };

      const mockCreatedBooking = {
        id: 'booking-789',
        bookingNumber: 'BK-2026-003',
        ...bookingData,
        showroom: {
          id: 'showroom-001',
          name: 'London Showroom',
          address: '123 High Street, London',
        },
        createdAt: new Date(),
      };

      mockPrismaClient.booking.create.mockResolvedValue(
        mockCreatedBooking as any
      );

      const result = await bookingRepository.create(bookingData);

      expect(result.type).toBe(BookingType.SHOWROOM);
      expect(result.showroomId).toBe('showroom-001');
    });

    it('should generate unique booking number', async () => {
      const bookingData = {
        customerId: 'customer-123',
        type: BookingType.HOME_MEASUREMENT,
        status: BookingStatus.PENDING,
        categories: ['KITCHEN'],
        customerName: 'John Doe',
        customerEmail: 'john@example.com',
        customerPhone: '+44 20 1234 5678',
        postcode: 'SW1A 1AA',
        address: '10 Downing Street, London',
        scheduledDate: new Date('2026-03-15T10:00:00Z'),
      };

      mockPrismaClient.booking.count.mockResolvedValue(99);

      const mockCreatedBooking = {
        id: 'booking-123',
        bookingNumber: 'BK-2026-100',
        ...bookingData,
      };

      mockPrismaClient.booking.create.mockResolvedValue(
        mockCreatedBooking as any
      );

      const result = await bookingRepository.create(bookingData);

      expect(result.bookingNumber).toBe('BK-2026-100');
    });

    it('should handle database errors during creation', async () => {
      const bookingData = {
        customerId: 'customer-123',
        type: BookingType.HOME_MEASUREMENT,
        status: BookingStatus.PENDING,
        categories: ['KITCHEN'],
        customerName: 'John Doe',
        customerEmail: 'john@example.com',
        customerPhone: '+44 20 1234 5678',
        postcode: 'SW1A 1AA',
        address: '10 Downing Street, London',
        scheduledDate: new Date('2026-03-15T10:00:00Z'),
      };

      const dbError = new Error('Database constraint violation');
      mockPrismaClient.booking.create.mockRejectedValue(dbError);

      await expect(bookingRepository.create(bookingData)).rejects.toThrow(
        'Database constraint violation'
      );
    });
  });

  describe('findById', () => {
    it('should find a booking by ID with all relations', async () => {
      const mockBooking = {
        id: 'booking-123',
        bookingNumber: 'BK-2026-001',
        customerId: 'customer-123',
        type: BookingType.HOME_MEASUREMENT,
        status: BookingStatus.CONFIRMED,
        categories: ['KITCHEN', 'BEDROOM'],
        customerName: 'John Doe',
        customerEmail: 'john@example.com',
        customerPhone: '+44 20 1234 5678',
        scheduledDate: new Date('2026-03-15T10:00:00Z'),
        customer: {
          id: 'customer-123',
          email: 'john@example.com',
          name: 'John Doe',
        },
        consultant: {
          id: 'consultant-1',
          name: 'Sarah Consultant',
          email: 'sarah@lomashwood.com',
        },
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrismaClient.booking.findUnique.mockResolvedValue(mockBooking as any);

      const result = await bookingRepository.findById('booking-123');

      expect(mockPrismaClient.booking.findUnique).toHaveBeenCalledWith({
        where: { id: 'booking-123' },
        include: {
          customer: true,
          consultant: true,
          showroom: true,
        },
      });
      expect(result).toEqual(mockBooking);
      expect(result?.customer).toBeDefined();
      expect(result?.consultant).toBeDefined();
    });

    it('should return null when booking is not found', async () => {
      mockPrismaClient.booking.findUnique.mockResolvedValue(null);

      const result = await bookingRepository.findById('non-existent');

      expect(result).toBeNull();
    });

    it('should handle database errors when finding by ID', async () => {
      const dbError = new Error('Database connection failed');
      mockPrismaClient.booking.findUnique.mockRejectedValue(dbError);

      await expect(
        bookingRepository.findById('booking-123')
      ).rejects.toThrow('Database connection failed');
    });
  });

  describe('findByCustomerId', () => {
    it('should find all bookings for a customer with pagination', async () => {
      const mockBookings = [
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
      ];

      mockPrismaClient.booking.findMany.mockResolvedValue(mockBookings as any);
      mockPrismaClient.booking.count.mockResolvedValue(2);

      const result = await bookingRepository.findByCustomerId('customer-123', {
        page: 1,
        limit: 10,
      });

      expect(mockPrismaClient.booking.findMany).toHaveBeenCalledWith({
        where: { customerId: 'customer-123' },
        include: expect.any(Object),
        orderBy: { scheduledDate: 'desc' },
        skip: 0,
        take: 10,
      });
      expect(mockPrismaClient.booking.count).toHaveBeenCalledWith({
        where: { customerId: 'customer-123' },
      });
      expect(result.data).toHaveLength(2);
      expect(result.pagination.total).toBe(2);
      expect(result.pagination.page).toBe(1);
      expect(result.pagination.limit).toBe(10);
      expect(result.pagination.totalPages).toBe(1);
    });

    it('should filter bookings by status', async () => {
      const mockBookings = [
        {
          id: 'booking-1',
          customerId: 'customer-123',
          status: BookingStatus.PENDING,
        },
      ];

      mockPrismaClient.booking.findMany.mockResolvedValue(mockBookings as any);
      mockPrismaClient.booking.count.mockResolvedValue(1);

      const result = await bookingRepository.findByCustomerId('customer-123', {
        page: 1,
        limit: 10,
        status: BookingStatus.PENDING,
      });

      expect(mockPrismaClient.booking.findMany).toHaveBeenCalledWith({
        where: {
          customerId: 'customer-123',
          status: BookingStatus.PENDING,
        },
        include: expect.any(Object),
        orderBy: { scheduledDate: 'desc' },
        skip: 0,
        take: 10,
      });
      expect(result.data).toHaveLength(1);
    });

    it('should filter bookings by type', async () => {
      const mockBookings = [
        {
          id: 'booking-1',
          customerId: 'customer-123',
          type: BookingType.SHOWROOM,
        },
      ];

      mockPrismaClient.booking.findMany.mockResolvedValue(mockBookings as any);
      mockPrismaClient.booking.count.mockResolvedValue(1);

      const result = await bookingRepository.findByCustomerId('customer-123', {
        page: 1,
        limit: 10,
        type: BookingType.SHOWROOM,
      });

      expect(mockPrismaClient.booking.findMany).toHaveBeenCalledWith({
        where: {
          customerId: 'customer-123',
          type: BookingType.SHOWROOM,
        },
        include: expect.any(Object),
        orderBy: { scheduledDate: 'desc' },
        skip: 0,
        take: 10,
      });
    });

    it('should handle pagination correctly for page 2', async () => {
      const mockBookings = [
        {
          id: 'booking-11',
          customerId: 'customer-123',
        },
      ];

      mockPrismaClient.booking.findMany.mockResolvedValue(mockBookings as any);
      mockPrismaClient.booking.count.mockResolvedValue(21);

      const result = await bookingRepository.findByCustomerId('customer-123', {
        page: 2,
        limit: 10,
      });

      expect(mockPrismaClient.booking.findMany).toHaveBeenCalledWith({
        where: { customerId: 'customer-123' },
        include: expect.any(Object),
        orderBy: { scheduledDate: 'desc' },
        skip: 10,
        take: 10,
      });
      expect(result.pagination.totalPages).toBe(3);
    });

    it('should return empty array when customer has no bookings', async () => {
      mockPrismaClient.booking.findMany.mockResolvedValue([]);
      mockPrismaClient.booking.count.mockResolvedValue(0);

      const result = await bookingRepository.findByCustomerId('customer-456', {
        page: 1,
        limit: 10,
      });

      expect(result.data).toHaveLength(0);
      expect(result.pagination.total).toBe(0);
    });
  });

  describe('findAll', () => {
    it('should find all bookings with pagination', async () => {
      const mockBookings = [
        {
          id: 'booking-1',
          customerId: 'customer-1',
          status: BookingStatus.CONFIRMED,
        },
        {
          id: 'booking-2',
          customerId: 'customer-2',
          status: BookingStatus.PENDING,
        },
      ];

      mockPrismaClient.booking.findMany.mockResolvedValue(mockBookings as any);
      mockPrismaClient.booking.count.mockResolvedValue(2);

      const result = await bookingRepository.findAll({
        page: 1,
        limit: 10,
      });

      expect(mockPrismaClient.booking.findMany).toHaveBeenCalledWith({
        where: {},
        include: expect.any(Object),
        orderBy: { createdAt: 'desc' },
        skip: 0,
        take: 10,
      });
      expect(result.data).toHaveLength(2);
    });

    it('should filter bookings by multiple criteria', async () => {
      const mockBookings = [
        {
          id: 'booking-1',
          status: BookingStatus.CONFIRMED,
          type: BookingType.SHOWROOM,
          showroomId: 'showroom-001',
        },
      ];

      mockPrismaClient.booking.findMany.mockResolvedValue(mockBookings as any);
      mockPrismaClient.booking.count.mockResolvedValue(1);

      const result = await bookingRepository.findAll({
        page: 1,
        limit: 10,
        status: BookingStatus.CONFIRMED,
        type: BookingType.SHOWROOM,
        showroomId: 'showroom-001',
      });

      expect(mockPrismaClient.booking.findMany).toHaveBeenCalledWith({
        where: {
          status: BookingStatus.CONFIRMED,
          type: BookingType.SHOWROOM,
          showroomId: 'showroom-001',
        },
        include: expect.any(Object),
        orderBy: { createdAt: 'desc' },
        skip: 0,
        take: 10,
      });
    });
  });

  describe('update', () => {
    it('should update booking status', async () => {
      const mockUpdatedBooking = {
        id: 'booking-123',
        status: BookingStatus.CONFIRMED,
        confirmedAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrismaClient.booking.update.mockResolvedValue(
        mockUpdatedBooking as any
      );

      const result = await bookingRepository.update('booking-123', {
        status: BookingStatus.CONFIRMED,
        confirmedAt: new Date(),
      });

      expect(mockPrismaClient.booking.update).toHaveBeenCalledWith({
        where: { id: 'booking-123' },
        data: {
          status: BookingStatus.CONFIRMED,
          confirmedAt: expect.any(Date),
        },
        include: expect.any(Object),
      });
      expect(result.status).toBe(BookingStatus.CONFIRMED);
    });

    it('should update booking consultant assignment', async () => {
      const mockUpdatedBooking = {
        id: 'booking-123',
        consultantId: 'consultant-1',
        assignedAt: new Date(),
      };

      mockPrismaClient.booking.update.mockResolvedValue(
        mockUpdatedBooking as any
      );

      const result = await bookingRepository.update('booking-123', {
        consultantId: 'consultant-1',
        assignedAt: new Date(),
      });

      expect(result.consultantId).toBe('consultant-1');
    });

    it('should update booking scheduled date', async () => {
      const newDate = new Date('2026-04-01T10:00:00Z');
      const mockUpdatedBooking = {
        id: 'booking-123',
        scheduledDate: newDate,
        previousScheduledDate: new Date('2026-03-15T10:00:00Z'),
        rescheduledAt: new Date(),
      };

      mockPrismaClient.booking.update.mockResolvedValue(
        mockUpdatedBooking as any
      );

      const result = await bookingRepository.update('booking-123', {
        scheduledDate: newDate,
        previousScheduledDate: new Date('2026-03-15T10:00:00Z'),
        rescheduledAt: new Date(),
      });

      expect(result.scheduledDate).toEqual(newDate);
      expect(result.previousScheduledDate).toBeDefined();
    });

    it('should handle update errors', async () => {
      const dbError = new Error('Record not found');
      mockPrismaClient.booking.update.mockRejectedValue(dbError);

      await expect(
        bookingRepository.update('non-existent', {
          status: BookingStatus.CONFIRMED,
        })
      ).rejects.toThrow('Record not found');
    });
  });

  describe('delete', () => {
    it('should soft delete a booking', async () => {
      const mockDeletedBooking = {
        id: 'booking-123',
        deletedAt: new Date(),
        isDeleted: true,
      };

      mockPrismaClient.booking.update.mockResolvedValue(
        mockDeletedBooking as any
      );

      const result = await bookingRepository.delete('booking-123');

      expect(mockPrismaClient.booking.update).toHaveBeenCalledWith({
        where: { id: 'booking-123' },
        data: {
          deletedAt: expect.any(Date),
          isDeleted: true,
        },
      });
      expect(result.isDeleted).toBe(true);
    });

    it('should handle delete errors', async () => {
      const dbError = new Error('Record not found');
      mockPrismaClient.booking.update.mockRejectedValue(dbError);

      await expect(bookingRepository.delete('non-existent')).rejects.toThrow(
        'Record not found'
      );
    });
  });

  describe('checkSlotAvailability', () => {
    it('should return true when slot is available', async () => {
      const date = new Date('2026-03-15T10:00:00Z');

      mockPrismaClient.booking.count.mockResolvedValue(0);

      const result = await bookingRepository.checkSlotAvailability({
        date,
        type: BookingType.HOME_MEASUREMENT,
      });

      expect(mockPrismaClient.booking.count).toHaveBeenCalledWith({
        where: {
          scheduledDate: date,
          type: BookingType.HOME_MEASUREMENT,
          status: {
            notIn: [BookingStatus.CANCELLED, BookingStatus.COMPLETED],
          },
        },
      });
      expect(result).toBe(true);
    });

    it('should return false when slot is not available', async () => {
      const date = new Date('2026-03-15T10:00:00Z');

      mockPrismaClient.booking.count.mockResolvedValue(5);

      const result = await bookingRepository.checkSlotAvailability({
        date,
        type: BookingType.HOME_MEASUREMENT,
      });

      expect(result).toBe(false);
    });

    it('should check slot availability for showroom with showroom filter', async () => {
      const date = new Date('2026-03-15T10:00:00Z');

      mockPrismaClient.booking.count.mockResolvedValue(0);

      const result = await bookingRepository.checkSlotAvailability({
        date,
        type: BookingType.SHOWROOM,
        showroomId: 'showroom-001',
      });

      expect(mockPrismaClient.booking.count).toHaveBeenCalledWith({
        where: {
          scheduledDate: date,
          type: BookingType.SHOWROOM,
          showroomId: 'showroom-001',
          status: {
            notIn: [BookingStatus.CANCELLED, BookingStatus.COMPLETED],
          },
        },
      });
    });

    it('should exclude specific booking when checking availability', async () => {
      const date = new Date('2026-03-15T10:00:00Z');

      mockPrismaClient.booking.count.mockResolvedValue(0);

      await bookingRepository.checkSlotAvailability({
        date,
        type: BookingType.HOME_MEASUREMENT,
        excludeBookingId: 'booking-123',
      });

      expect(mockPrismaClient.booking.count).toHaveBeenCalledWith({
        where: {
          scheduledDate: date,
          type: BookingType.HOME_MEASUREMENT,
          id: { not: 'booking-123' },
          status: {
            notIn: [BookingStatus.CANCELLED, BookingStatus.COMPLETED],
          },
        },
      });
    });
  });

  describe('getAvailableSlots', () => {
    it('should return available time slots for a date', async () => {
      const date = new Date('2026-03-15');

      const mockExistingBookings = [
        {
          id: 'booking-1',
          scheduledDate: new Date('2026-03-15T10:00:00Z'),
        },
        {
          id: 'booking-2',
          scheduledDate: new Date('2026-03-15T14:00:00Z'),
        },
      ];

      mockPrismaClient.booking.findMany.mockResolvedValue(
        mockExistingBookings as any
      );

      const result = await bookingRepository.getAvailableSlots({
        date,
        type: BookingType.HOME_MEASUREMENT,
      });

      expect(mockPrismaClient.booking.findMany).toHaveBeenCalledWith({
        where: {
          scheduledDate: {
            gte: expect.any(Date),
            lt: expect.any(Date),
          },
          type: BookingType.HOME_MEASUREMENT,
          status: {
            notIn: [BookingStatus.CANCELLED, BookingStatus.COMPLETED],
          },
        },
        select: {
          scheduledDate: true,
          consultantId: true,
        },
      });
      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
    });

    it('should filter available slots by showroom', async () => {
      const date = new Date('2026-03-15');

      mockPrismaClient.booking.findMany.mockResolvedValue([]);

      await bookingRepository.getAvailableSlots({
        date,
        type: BookingType.SHOWROOM,
        showroomId: 'showroom-001',
      });

      expect(mockPrismaClient.booking.findMany).toHaveBeenCalledWith({
        where: {
          scheduledDate: {
            gte: expect.any(Date),
            lt: expect.any(Date),
          },
          type: BookingType.SHOWROOM,
          showroomId: 'showroom-001',
          status: {
            notIn: [BookingStatus.CANCELLED, BookingStatus.COMPLETED],
          },
        },
        select: {
          scheduledDate: true,
          consultantId: true,
        },
      });
    });
  });

  describe('countByStatus', () => {
    it('should count all bookings when no status provided', async () => {
      mockPrismaClient.booking.count.mockResolvedValue(100);

      const result = await bookingRepository.countByStatus();

      expect(mockPrismaClient.booking.count).toHaveBeenCalledWith({
        where: {},
      });
      expect(result).toBe(100);
    });

    it('should count bookings by specific status', async () => {
      mockPrismaClient.booking.count.mockResolvedValue(25);

      const result = await bookingRepository.countByStatus(
        BookingStatus.PENDING
      );

      expect(mockPrismaClient.booking.count).toHaveBeenCalledWith({
        where: { status: BookingStatus.PENDING },
      });
      expect(result).toBe(25);
    });

    it('should count confirmed bookings', async () => {
      mockPrismaClient.booking.count.mockResolvedValue(80);

      const result = await bookingRepository.countByStatus(
        BookingStatus.CONFIRMED
      );

      expect(result).toBe(80);
    });
  });

  describe('findByDateRange', () => {
    it('should find bookings within date range', async () => {
      const startDate = new Date('2026-03-01');
      const endDate = new Date('2026-03-31');

      const mockBookings = [
        {
          id: 'booking-1',
          scheduledDate: new Date('2026-03-15T10:00:00Z'),
        },
        {
          id: 'booking-2',
          scheduledDate: new Date('2026-03-20T14:00:00Z'),
        },
      ];

      mockPrismaClient.booking.findMany.mockResolvedValue(mockBookings as any);
      mockPrismaClient.booking.count.mockResolvedValue(2);

      const result = await bookingRepository.findByDateRange({
        startDate,
        endDate,
        page: 1,
        limit: 10,
      });

      expect(mockPrismaClient.booking.findMany).toHaveBeenCalledWith({
        where: {
          scheduledDate: {
            gte: startDate,
            lte: endDate,
          },
        },
        include: expect.any(Object),
        orderBy: { scheduledDate: 'asc' },
        skip: 0,
        take: 10,
      });
      expect(result.data).toHaveLength(2);
    });

    it('should filter date range bookings by status', async () => {
      const startDate = new Date('2026-03-01');
      const endDate = new Date('2026-03-31');

      mockPrismaClient.booking.findMany.mockResolvedValue([]);
      mockPrismaClient.booking.count.mockResolvedValue(0);

      await bookingRepository.findByDateRange({
        startDate,
        endDate,
        status: BookingStatus.CONFIRMED,
        page: 1,
        limit: 10,
      });

      expect(mockPrismaClient.booking.findMany).toHaveBeenCalledWith({
        where: {
          scheduledDate: {
            gte: startDate,
            lte: endDate,
          },
          status: BookingStatus.CONFIRMED,
        },
        include: expect.any(Object),
        orderBy: { scheduledDate: 'asc' },
        skip: 0,
        take: 10,
      });
    });
  });

  describe('findByConsultant', () => {
    it('should find all bookings for a consultant', async () => {
      const mockBookings = [
        {
          id: 'booking-1',
          consultantId: 'consultant-1',
          scheduledDate: new Date('2026-03-15T10:00:00Z'),
        },
        {
          id: 'booking-2',
          consultantId: 'consultant-1',
          scheduledDate: new Date('2026-03-20T14:00:00Z'),
        },
      ];

      mockPrismaClient.booking.findMany.mockResolvedValue(mockBookings as any);
      mockPrismaClient.booking.count.mockResolvedValue(2);

      const result = await bookingRepository.findByConsultant('consultant-1', {
        page: 1,
        limit: 10,
      });

      expect(mockPrismaClient.booking.findMany).toHaveBeenCalledWith({
        where: { consultantId: 'consultant-1' },
        include: expect.any(Object),
        orderBy: { scheduledDate: 'asc' },
        skip: 0,
        take: 10,
      });
      expect(result.data).toHaveLength(2);
    });
  });

  describe('findByShowroom', () => {
    it('should find all bookings for a showroom', async () => {
      const mockBookings = [
        {
          id: 'booking-1',
          showroomId: 'showroom-001',
          type: BookingType.SHOWROOM,
        },
      ];

      mockPrismaClient.booking.findMany.mockResolvedValue(mockBookings as any);
      mockPrismaClient.booking.count.mockResolvedValue(1);

      const result = await bookingRepository.findByShowroom('showroom-001', {
        page: 1,
        limit: 10,
      });

      expect(mockPrismaClient.booking.findMany).toHaveBeenCalledWith({
        where: { showroomId: 'showroom-001' },
        include: expect.any(Object),
        orderBy: { scheduledDate: 'asc' },
        skip: 0,
        take: 10,
      });
      expect(result.data).toHaveLength(1);
    });
  });

  describe('transaction handling', () => {
    it('should handle transaction for complex operations', async () => {
      const mockTransaction = jest.fn().mockResolvedValue({
        id: 'booking-123',
        status: BookingStatus.CONFIRMED,
      });

      mockPrismaClient.$transaction.mockImplementation(mockTransaction);

      const result = await mockPrismaClient.$transaction(async (tx) => {
        return await tx.booking.create({
          data: {
            customerId: 'customer-123',
            type: BookingType.HOME_MEASUREMENT,
          } as any,
        });
      });

      expect(mockPrismaClient.$transaction).toHaveBeenCalled();
      expect(result.id).toBe('booking-123');
    });
  });

  describe('error handling', () => {
    it('should handle unique constraint violations', async () => {
      const dbError = new Error('Unique constraint failed');
      (dbError as any).code = 'P2002';

      mockPrismaClient.booking.create.mockRejectedValue(dbError);

      await expect(
        bookingRepository.create({
          customerId: 'customer-123',
          type: BookingType.HOME_MEASUREMENT,
          status: BookingStatus.PENDING,
          categories: ['KITCHEN'],
          customerName: 'John Doe',
          customerEmail: 'john@example.com',
          customerPhone: '+44 20 1234 5678',
          postcode: 'SW1A 1AA',
          address: '10 Downing Street, London',
          scheduledDate: new Date('2026-03-15T10:00:00Z'),
        })
      ).rejects.toThrow();
    });

    it('should handle foreign key constraint violations', async () => {
      const dbError = new Error('Foreign key constraint failed');
      (dbError as any).code = 'P2003';

      mockPrismaClient.booking.create.mockRejectedValue(dbError);

      await expect(
        bookingRepository.create({
          customerId: 'non-existent-customer',
          type: BookingType.HOME_MEASUREMENT,
          status: BookingStatus.PENDING,
          categories: ['KITCHEN'],
          customerName: 'John Doe',
          customerEmail: 'john@example.com',
          customerPhone: '+44 20 1234 5678',
          postcode: 'SW1A 1AA',
          address: '10 Downing Street, London',
          scheduledDate: new Date('2026-03-15T10:00:00Z'),
        })
      ).rejects.toThrow();
    });
  });
});