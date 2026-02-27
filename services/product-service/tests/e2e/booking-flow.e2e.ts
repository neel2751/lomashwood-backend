import request from 'supertest';
import { Express } from 'express';
import { PrismaClient } from '@prisma/client';
import { app } from '../../src/app';
import { prisma } from '../../src/infrastructure/db/prisma.client';
import { redis } from '../../src/infrastructure/cache/redis.client';

describe('Booking Flow E2E Tests', () => {
  let testApp: Express;
  let authToken: string;
  let testUserId: string;
  let testShowroomId: string;
  let testConsultantId: string;
  let testSlotId: string;
  let createdBookingId: string;

  beforeAll(async () => {
    testApp = app;
    await prisma.$connect();
    await redis.connect();
    const registerResponse = await request(testApp)
      .post('/api/v1/auth/register')
      .send({
        email: 'booking.test@example.com',
        password: 'SecurePass123!',
        firstName: 'John',
        lastName: 'Doe',
        phone: '+447700900000',
      });

    testUserId = registerResponse.body.data.user.id;

    const loginResponse = await request(testApp)
      .post('/api/v1/auth/login')
      .send({
        email: 'booking.test@example.com',
        password: 'SecurePass123!',
      });

    authToken = loginResponse.body.data.accessToken;

    const showroom = await prisma.showroom.create({
      data: {
        name: 'Test Showroom Central',
        address: '123 Design Street, London',
        city: 'London',
        postcode: 'SW1A 1AA',
        email: 'central@lomashwood.com',
        phone: '+442012345678',
        openingHours: JSON.stringify({
          monday: '09:00-18:00',
          tuesday: '09:00-18:00',
          wednesday: '09:00-18:00',
          thursday: '09:00-18:00',
          friday: '09:00-18:00',
          saturday: '10:00-16:00',
          sunday: 'Closed',
        }),
        mapLink: 'https://maps.google.com/?q=123+Design+Street+London',
        image: 'https://example.com/showroom-central.jpg',
        isActive: true,
      },
    });

    testShowroomId = showroom.id;

    const consultant = await prisma.consultant.create({
      data: {
        firstName: 'Sarah',
        lastName: 'Williams',
        email: 'sarah.williams@lomashwood.com',
        phone: '+447700900001',
        specialization: 'KITCHEN_AND_BEDROOM',
        bio: 'Expert in kitchen and bedroom design with 10 years experience',
        image: 'https://example.com/consultant-sarah.jpg',
        isActive: true,
      },
    });

    testConsultantId = consultant.id;
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(14, 0, 0, 0);

    const slot = await prisma.timeSlot.create({
      data: {
        consultantId: testConsultantId,
        showroomId: testShowroomId,
        startTime: tomorrow,
        endTime: new Date(tomorrow.getTime() + 60 * 60 * 1000),
        isAvailable: true,
        appointmentType: 'SHOWROOM',
      },
    });

    testSlotId = slot.id;
  });

  afterAll(async () => {
  
    await prisma.booking.deleteMany({
      where: { userId: testUserId },
    });

    await prisma.timeSlot.deleteMany({
      where: { consultantId: testConsultantId },
    });

    await prisma.consultant.delete({
      where: { id: testConsultantId },
    });

    await prisma.showroom.delete({
      where: { id: testShowroomId },
    });

    await prisma.user.delete({
      where: { id: testUserId },
    });

    await prisma.$disconnect();
    await redis.disconnect();
  });

  describe('Step 1: Get Appointment Type Options (FR5.1)', () => {
    it('should return available appointment types', async () => {
      const response = await request(testApp)
        .get('/api/v1/bookings/appointment-types')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.appointmentTypes).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            type: 'HOME_MEASUREMENT',
            title: expect.any(String),
            description: expect.any(String),
            icon: expect.any(String),
          }),
          expect.objectContaining({
            type: 'ONLINE',
            title: expect.any(String),
            description: expect.any(String),
            icon: expect.any(String),
          }),
          expect.objectContaining({
            type: 'SHOWROOM',
            title: expect.any(String),
            description: expect.any(String),
            icon: expect.any(String),
          }),
        ])
      );
    });

    it('should return showrooms when appointment type is SHOWROOM', async () => {
      const response = await request(testApp)
        .get('/api/v1/showrooms')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.showrooms).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            id: testShowroomId,
            name: 'Test Showroom Central',
            address: expect.any(String),
            city: 'London',
            postcode: 'SW1A 1AA',
          }),
        ])
      );
    });
  });

  describe('Step 2: Specify Room Type (FR5.2)', () => {
    it('should accept valid room type selection', async () => {
      const response = await request(testApp)
        .post('/api/v1/bookings/validate-room-type')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          isKitchen: true,
          isBedroom: true,
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.valid).toBe(true);
    });

    it('should require at least one room type', async () => {
      const response = await request(testApp)
        .post('/api/v1/bookings/validate-room-type')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          isKitchen: false,
          isBedroom: false,
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toContain('at least one room type');
    });
  });

  describe('Step 3: Customer Details (FR5.3)', () => {
    it('should validate customer details format', async () => {
      const response = await request(testApp)
        .post('/api/v1/bookings/validate-customer-details')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          firstName: 'John',
          lastName: 'Doe',
          phone: '+447700900000',
          email: 'john.doe@example.com',
          postcode: 'SW1A 1AA',
          address: '10 Downing Street, Westminster',
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.valid).toBe(true);
    });

    it('should reject invalid email format', async () => {
      const response = await request(testApp)
        .post('/api/v1/bookings/validate-customer-details')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          firstName: 'John',
          lastName: 'Doe',
          phone: '+447700900000',
          email: 'invalid-email',
          postcode: 'SW1A 1AA',
          address: '10 Downing Street, Westminster',
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should reject invalid phone format', async () => {
      const response = await request(testApp)
        .post('/api/v1/bookings/validate-customer-details')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          firstName: 'John',
          lastName: 'Doe',
          phone: 'invalid-phone',
          email: 'john.doe@example.com',
          postcode: 'SW1A 1AA',
          address: '10 Downing Street, Westminster',
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('Step 4: Available Slots and Booking (FR5.4)', () => {
    it('should return available time slots for selected date', async () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const dateString = tomorrow.toISOString().split('T')[0];

      const response = await request(testApp)
        .get('/api/v1/availability/slots')
        .query({
          date: dateString,
          appointmentType: 'SHOWROOM',
          showroomId: testShowroomId,
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.slots).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            id: testSlotId,
            startTime: expect.any(String),
            endTime: expect.any(String),
            isAvailable: true,
          }),
        ])
      );
    });

    it('should not return unavailable slots', async () => {
 
      await prisma.timeSlot.update({
        where: { id: testSlotId },
        data: { isAvailable: false },
      });

      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const dateString = tomorrow.toISOString().split('T')[0];

      const response = await request(testApp)
        .get('/api/v1/availability/slots')
        .query({
          date: dateString,
          appointmentType: 'SHOWROOM',
          showroomId: testShowroomId,
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(
        response.body.data.slots.find((s: any) => s.id === testSlotId)
      ).toBeUndefined();

 
      await prisma.timeSlot.update({
        where: { id: testSlotId },
        data: { isAvailable: true },
      });
    });
  });

  describe('Complete Booking Flow', () => {
    it('should successfully create a complete booking for SHOWROOM appointment', async () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(14, 0, 0, 0);

      const response = await request(testApp)
        .post('/api/v1/bookings')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          appointmentType: 'SHOWROOM',
          isKitchen: true,
          isBedroom: false,
          customerDetails: {
            firstName: 'John',
            lastName: 'Doe',
            phone: '+447700900000',
            email: 'john.doe@example.com',
            postcode: 'SW1A 1AA',
            address: '10 Downing Street, Westminster',
          },
          timeSlotId: testSlotId,
          showroomId: testShowroomId,
          consultantId: testConsultantId,
          notes: 'Looking for modern kitchen design',
        })
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.booking).toMatchObject({
        id: expect.any(String),
        appointmentType: 'SHOWROOM',
        isKitchen: true,
        isBedroom: false,
        status: 'PENDING',
        customerFirstName: 'John',
        customerLastName: 'Doe',
        customerPhone: '+447700900000',
        customerEmail: 'john.doe@example.com',
      });

      createdBookingId = response.body.data.booking.id;
    });

    it('should successfully create a booking for BOTH kitchen and bedroom', async () => {
   
      const dayAfterTomorrow = new Date();
      dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 2);
      dayAfterTomorrow.setHours(15, 0, 0, 0);

      const newSlot = await prisma.timeSlot.create({
        data: {
          consultantId: testConsultantId,
          showroomId: testShowroomId,
          startTime: dayAfterTomorrow,
          endTime: new Date(dayAfterTomorrow.getTime() + 60 * 60 * 1000),
          isAvailable: true,
          appointmentType: 'HOME_MEASUREMENT',
        },
      });

      const response = await request(testApp)
        .post('/api/v1/bookings')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          appointmentType: 'HOME_MEASUREMENT',
          isKitchen: true,
          isBedroom: true,
          customerDetails: {
            firstName: 'Jane',
            lastName: 'Smith',
            phone: '+447700900002',
            email: 'jane.smith@example.com',
            postcode: 'W1A 1AA',
            address: '221B Baker Street, London',
          },
          timeSlotId: newSlot.id,
          consultantId: testConsultantId,
          notes: 'Complete home renovation - kitchen and bedroom',
        })
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.booking).toMatchObject({
        appointmentType: 'HOME_MEASUREMENT',
        isKitchen: true,
        isBedroom: true,
        status: 'PENDING',
      });

     
      expect(response.body.data.notificationSent).toBe(true);

      await prisma.booking.delete({
        where: { id: response.body.data.booking.id },
      });
      await prisma.timeSlot.delete({
        where: { id: newSlot.id },
      });
    });

    it('should successfully create an ONLINE appointment booking', async () => {
      const dayAfterTomorrow = new Date();
      dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 2);
      dayAfterTomorrow.setHours(16, 0, 0, 0);

      const onlineSlot = await prisma.timeSlot.create({
        data: {
          consultantId: testConsultantId,
          startTime: dayAfterTomorrow,
          endTime: new Date(dayAfterTomorrow.getTime() + 60 * 60 * 1000),
          isAvailable: true,
          appointmentType: 'ONLINE',
        },
      });

      const response = await request(testApp)
        .post('/api/v1/bookings')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          appointmentType: 'ONLINE',
          isKitchen: false,
          isBedroom: true,
          customerDetails: {
            firstName: 'Michael',
            lastName: 'Johnson',
            phone: '+447700900003',
            email: 'michael.johnson@example.com',
            postcode: 'E1 6AN',
            address: '15 High Street, London',
          },
          timeSlotId: onlineSlot.id,
          consultantId: testConsultantId,
          notes: 'Virtual consultation for bedroom design',
        })
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.booking).toMatchObject({
        appointmentType: 'ONLINE',
        isKitchen: false,
        isBedroom: true,
        status: 'PENDING',
      });

      
      await prisma.booking.delete({
        where: { id: response.body.data.booking.id },
      });
      await prisma.timeSlot.delete({
        where: { id: onlineSlot.id },
      });
    });
  });

  describe('Acknowledgement Email (FR5.5)', () => {
    it('should send acknowledgement email after successful booking', async () => {
    
      const booking = await prisma.booking.findUnique({
        where: { id: createdBookingId },
        include: {
          timeSlot: true,
          consultant: true,
          showroom: true,
        },
      });

      expect(booking).toBeTruthy();
      expect(booking?.customerEmail).toBe('john.doe@example.com');
      
      // Check if notification was created
      const notification = await prisma.notification.findFirst({
        where: {
          userId: testUserId,
          type: 'BOOKING_CONFIRMATION',
          referenceId: createdBookingId,
        },
      });

      expect(notification).toBeTruthy();
      expect(notification?.status).toBe('SENT');
    });
  });

  describe('Admin Appointment Table (FR5.7)', () => {
    it('should display booking in admin appointment table', async () => {
      // Admin authentication (assuming admin role)
      const adminLoginResponse = await request(testApp)
        .post('/api/v1/auth/login')
        .send({
          email: 'admin@lomashwood.com',
          password: 'AdminSecurePass123!',
        });

      const adminToken = adminLoginResponse.body.data.accessToken;

      const response = await request(testApp)
        .get('/api/v1/bookings/admin/all')
        .set('Authorization', `Bearer ${adminToken}`)
        .query({
          page: 1,
          limit: 10,
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.bookings).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            id: createdBookingId,
            appointmentType: 'SHOWROOM',
            customerFirstName: 'John',
            customerLastName: 'Doe',
            status: 'PENDING',
          }),
        ])
      );
    });

    it('should allow filtering bookings by appointment type', async () => {
      const adminLoginResponse = await request(testApp)
        .post('/api/v1/auth/login')
        .send({
          email: 'admin@lomashwood.com',
          password: 'AdminSecurePass123!',
        });

      const adminToken = adminLoginResponse.body.data.accessToken;

      const response = await request(testApp)
        .get('/api/v1/bookings/admin/all')
        .set('Authorization', `Bearer ${adminToken}`)
        .query({
          appointmentType: 'SHOWROOM',
          page: 1,
          limit: 10,
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(
        response.body.data.bookings.every(
          (b: any) => b.appointmentType === 'SHOWROOM'
        )
      ).toBe(true);
    });

    it('should allow filtering bookings by date range', async () => {
      const adminLoginResponse = await request(testApp)
        .post('/api/v1/auth/login')
        .send({
          email: 'admin@lomashwood.com',
          password: 'AdminSecurePass123!',
        });

      const adminToken = adminLoginResponse.body.data.accessToken;

      const today = new Date().toISOString().split('T')[0];
      const nextWeek = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
        .toISOString()
        .split('T')[0];

      const response = await request(testApp)
        .get('/api/v1/bookings/admin/all')
        .set('Authorization', `Bearer ${adminToken}`)
        .query({
          startDate: today,
          endDate: nextWeek,
          page: 1,
          limit: 10,
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data.bookings)).toBe(true);
    });
  });

  describe('Booking Validation', () => {
    it('should prevent double booking of same time slot', async () => {
      const response = await request(testApp)
        .post('/api/v1/bookings')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          appointmentType: 'SHOWROOM',
          isKitchen: true,
          isBedroom: false,
          customerDetails: {
            firstName: 'Another',
            lastName: 'Customer',
            phone: '+447700900004',
            email: 'another.customer@example.com',
            postcode: 'SW1A 1AA',
            address: '10 Downing Street, Westminster',
          },
          timeSlotId: testSlotId,
          showroomId: testShowroomId,
          consultantId: testConsultantId,
        })
        .expect(409);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('TIME_SLOT_NOT_AVAILABLE');
    });

    it('should reject booking without required fields', async () => {
      const response = await request(testApp)
        .post('/api/v1/bookings')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          appointmentType: 'SHOWROOM',
          // Missing required fields
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should reject booking for past date', async () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      yesterday.setHours(14, 0, 0, 0);

      const pastSlot = await prisma.timeSlot.create({
        data: {
          consultantId: testConsultantId,
          showroomId: testShowroomId,
          startTime: yesterday,
          endTime: new Date(yesterday.getTime() + 60 * 60 * 1000),
          isAvailable: true,
          appointmentType: 'SHOWROOM',
        },
      });

      const response = await request(testApp)
        .post('/api/v1/bookings')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          appointmentType: 'SHOWROOM',
          isKitchen: true,
          isBedroom: false,
          customerDetails: {
            firstName: 'John',
            lastName: 'Doe',
            phone: '+447700900000',
            email: 'john.doe@example.com',
            postcode: 'SW1A 1AA',
            address: '10 Downing Street, Westminster',
          },
          timeSlotId: pastSlot.id,
          showroomId: testShowroomId,
          consultantId: testConsultantId,
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('INVALID_TIME_SLOT');

      // Cleanup
      await prisma.timeSlot.delete({
        where: { id: pastSlot.id },
      });
    });
  });

  describe('Booking Retrieval', () => {
    it('should retrieve user bookings', async () => {
      const response = await request(testApp)
        .get('/api/v1/bookings/my-bookings')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.bookings).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            id: createdBookingId,
            appointmentType: 'SHOWROOM',
          }),
        ])
      );
    });

    it('should retrieve specific booking details', async () => {
      const response = await request(testApp)
        .get(`/api/v1/bookings/${createdBookingId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.booking).toMatchObject({
        id: createdBookingId,
        appointmentType: 'SHOWROOM',
        isKitchen: true,
        isBedroom: false,
        status: 'PENDING',
        consultant: expect.objectContaining({
          firstName: 'Sarah',
          lastName: 'Williams',
        }),
        showroom: expect.objectContaining({
          name: 'Test Showroom Central',
        }),
      });
    });
  });

  describe('Booking Cancellation', () => {
    it('should allow user to cancel their booking', async () => {
      const response = await request(testApp)
        .patch(`/api/v1/bookings/${createdBookingId}/cancel`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          cancellationReason: 'Schedule conflict',
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.booking.status).toBe('CANCELLED');

    
      const slot = await prisma.timeSlot.findUnique({
        where: { id: testSlotId },
      });

      expect(slot?.isAvailable).toBe(true);
    });

    it('should not allow cancelling already cancelled booking', async () => {
      const response = await request(testApp)
        .patch(`/api/v1/bookings/${createdBookingId}/cancel`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          cancellationReason: 'Already cancelled',
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('BOOKING_ALREADY_CANCELLED');
    });
  });
});