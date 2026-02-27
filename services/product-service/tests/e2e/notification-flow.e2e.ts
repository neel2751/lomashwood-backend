import request from 'supertest';
import { Express } from 'express';
import { PrismaClient } from '@prisma/client';
import { app } from '../../src/app';
import { prisma } from '../../src/infrastructure/db/prisma.client';
import { redis } from '../../src/infrastructure/cache/redis.client';

describe('Notification Flow E2E Tests', () => {
  let testApp: Express;
  let authToken: string;
  let testUserId: string;
  let testOrderId: string;
  let testBookingId: string;
  let testEmailNotificationId: string;
  let testSmsNotificationId: string;
  let testPushNotificationId: string;
  let testTemplateId: string;

  beforeAll(async () => {
    testApp = app;
    await prisma.$connect();
    await redis.connect();

    const registerResponse = await request(testApp)
      .post('/api/v1/auth/register')
      .send({
        email: 'notification.test@example.com',
        password: 'SecurePass123!',
        firstName: 'Notification',
        lastName: 'User',
        phone: '+447700900400',
      });

    testUserId = registerResponse.body.data.user.id;

    const loginResponse = await request(testApp)
      .post('/api/v1/auth/login')
      .send({
        email: 'notification.test@example.com',
        password: 'SecurePass123!',
      });

    authToken = loginResponse.body.data.accessToken;

    const category = await prisma.category.create({
      data: {
        name: 'Test Category',
        slug: 'test-category',
        type: 'KITCHEN',
        isActive: true,
      },
    });

    const product = await prisma.product.create({
      data: {
        title: 'Test Product',
        slug: 'test-product',
        description: 'Test product description',
        categoryId: category.id,
        basePrice: 5000.00,
        isActive: true,
        stockStatus: 'IN_STOCK',
      },
    });

    const address = await prisma.address.create({
      data: {
        userId: testUserId,
        type: 'SHIPPING',
        firstName: 'Notification',
        lastName: 'User',
        addressLine1: '100 Test Street',
        city: 'London',
        postcode: 'SW1A 1AA',
        country: 'United Kingdom',
        phone: '+447700900400',
        isDefault: true,
      },
    });

    const order = await prisma.order.create({
      data: {
        userId: testUserId,
        orderNumber: `LW-${Date.now()}`,
        status: 'PENDING',
        paymentStatus: 'PENDING',
        shippingAddressId: address.id,
        billingAddressId: address.id,
        subtotal: 5000.00,
        taxAmount: 1000.00,
        totalAmount: 6000.00,
        items: {
          create: [
            {
              productId: product.id,
              quantity: 1,
              unitPrice: 5000.00,
              totalPrice: 5000.00,
            },
          ],
        },
      },
    });

    testOrderId = order.id;

    const consultant = await prisma.consultant.create({
      data: {
        firstName: 'Test',
        lastName: 'Consultant',
        email: 'consultant@lomashwood.com',
        phone: '+447700900401',
        specialization: 'KITCHEN',
        isActive: true,
      },
    });

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(14, 0, 0, 0);

    const timeSlot = await prisma.timeSlot.create({
      data: {
        consultantId: consultant.id,
        startTime: tomorrow,
        endTime: new Date(tomorrow.getTime() + 60 * 60 * 1000),
        isAvailable: true,
        appointmentType: 'ONLINE',
      },
    });

    const booking = await prisma.booking.create({
      data: {
        userId: testUserId,
        timeSlotId: timeSlot.id,
        consultantId: consultant.id,
        appointmentType: 'ONLINE',
        isKitchen: true,
        isBedroom: false,
        status: 'PENDING',
        customerFirstName: 'Notification',
        customerLastName: 'User',
        customerPhone: '+447700900400',
        customerEmail: 'notification.test@example.com',
        customerPostcode: 'SW1A 1AA',
        customerAddress: '100 Test Street, London',
      },
    });

    testBookingId = booking.id;
  });

  afterAll(async () => {
    await prisma.notification.deleteMany({
      where: { userId: testUserId },
    });

    await prisma.booking.deleteMany({
      where: { userId: testUserId },
    });

    await prisma.timeSlot.deleteMany({});

    await prisma.consultant.deleteMany({});

    await prisma.orderItem.deleteMany({
      where: { order: { userId: testUserId } },
    });

    await prisma.order.deleteMany({
      where: { userId: testUserId },
    });

    await prisma.address.deleteMany({
      where: { userId: testUserId },
    });

    await prisma.product.deleteMany({});

    await prisma.category.deleteMany({});

    await prisma.user.delete({
      where: { id: testUserId },
    });

    await prisma.$disconnect();
    await redis.disconnect();
  });

  describe('Email Notifications', () => {
    it('should send order confirmation email', async () => {
      const response = await request(testApp)
        .post('/api/v1/notifications/email/send')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          type: 'ORDER_CONFIRMATION',
          recipientEmail: 'notification.test@example.com',
          recipientName: 'Notification User',
          subject: 'Order Confirmation',
          templateData: {
            orderNumber: `LW-${Date.now()}`,
            orderTotal: 6000.00,
            orderItems: [
              {
                name: 'Test Product',
                quantity: 1,
                price: 5000.00,
              },
            ],
          },
          referenceId: testOrderId,
          referenceType: 'ORDER',
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.notification).toMatchObject({
        type: 'ORDER_CONFIRMATION',
        channel: 'EMAIL',
        status: 'SENT',
        recipientEmail: 'notification.test@example.com',
      });

      testEmailNotificationId = response.body.data.notification.id;
    });

    it('should send booking confirmation email', async () => {
      const response = await request(testApp)
        .post('/api/v1/notifications/email/send')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          type: 'BOOKING_CONFIRMATION',
          recipientEmail: 'notification.test@example.com',
          recipientName: 'Notification User',
          subject: 'Booking Confirmation',
          templateData: {
            bookingDate: new Date().toISOString(),
            appointmentType: 'ONLINE',
            consultantName: 'Test Consultant',
          },
          referenceId: testBookingId,
          referenceType: 'BOOKING',
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.notification.type).toBe('BOOKING_CONFIRMATION');
    });

    it('should send payment success email', async () => {
      const response = await request(testApp)
        .post('/api/v1/notifications/email/send')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          type: 'PAYMENT_SUCCESS',
          recipientEmail: 'notification.test@example.com',
          recipientName: 'Notification User',
          subject: 'Payment Successful',
          templateData: {
            orderNumber: `LW-${Date.now()}`,
            amount: 6000.00,
            paymentMethod: 'Card ending in 4242',
          },
          referenceId: testOrderId,
          referenceType: 'ORDER',
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.notification.type).toBe('PAYMENT_SUCCESS');
    });

    it('should send shipping notification email', async () => {
      const response = await request(testApp)
        .post('/api/v1/notifications/email/send')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          type: 'ORDER_SHIPPED',
          recipientEmail: 'notification.test@example.com',
          recipientName: 'Notification User',
          subject: 'Your Order Has Been Shipped',
          templateData: {
            orderNumber: `LW-${Date.now()}`,
            trackingNumber: 'TRK123456789',
            carrier: 'Royal Mail',
            estimatedDelivery: '2026-03-01',
          },
          referenceId: testOrderId,
          referenceType: 'ORDER',
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.notification.type).toBe('ORDER_SHIPPED');
    });

    it('should send brochure request email', async () => {
      const response = await request(testApp)
        .post('/api/v1/notifications/email/send')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          type: 'BROCHURE_REQUEST',
          recipientEmail: 'notification.test@example.com',
          recipientName: 'Notification User',
          subject: 'Your Brochure Request',
          templateData: {
            brochureType: 'Kitchen Collection 2026',
            downloadLink: 'https://example.com/brochures/kitchen-2026.pdf',
          },
          referenceType: 'BROCHURE',
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.notification.type).toBe('BROCHURE_REQUEST');
    });

    it('should send newsletter email', async () => {
      const response = await request(testApp)
        .post('/api/v1/notifications/email/send')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          type: 'NEWSLETTER',
          recipientEmail: 'notification.test@example.com',
          recipientName: 'Notification User',
          subject: 'Lomash Wood Newsletter - March 2026',
          templateData: {
            content: 'Newsletter content here...',
            unsubscribeLink: 'https://example.com/unsubscribe',
          },
          referenceType: 'NEWSLETTER',
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.notification.type).toBe('NEWSLETTER');
    });

    it('should validate email format', async () => {
      const response = await request(testApp)
        .post('/api/v1/notifications/email/send')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          type: 'ORDER_CONFIRMATION',
          recipientEmail: 'invalid-email',
          recipientName: 'Test User',
          subject: 'Test',
          templateData: {},
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('INVALID_EMAIL');
    });

    it('should handle email sending failure gracefully', async () => {
      const response = await request(testApp)
        .post('/api/v1/notifications/email/send')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          type: 'ORDER_CONFIRMATION',
          recipientEmail: 'fail@test.lomashwood.com',
          recipientName: 'Fail Test',
          subject: 'Test Failure',
          templateData: {},
          simulateFailure: true,
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.notification.status).toBe('FAILED');
    });
  });

  describe('SMS Notifications', () => {
    it('should send booking reminder SMS', async () => {
      const response = await request(testApp)
        .post('/api/v1/notifications/sms/send')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          type: 'BOOKING_REMINDER',
          recipientPhone: '+447700900400',
          message: 'Reminder: Your appointment with Lomash Wood is tomorrow at 2:00 PM',
          referenceId: testBookingId,
          referenceType: 'BOOKING',
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.notification).toMatchObject({
        type: 'BOOKING_REMINDER',
        channel: 'SMS',
        status: 'SENT',
        recipientPhone: '+447700900400',
      });

      testSmsNotificationId = response.body.data.notification.id;
    });

    it('should send order status SMS', async () => {
      const response = await request(testApp)
        .post('/api/v1/notifications/sms/send')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          type: 'ORDER_STATUS_UPDATE',
          recipientPhone: '+447700900400',
          message: 'Your order LW-123456 has been shipped. Track: https://track.com/123',
          referenceId: testOrderId,
          referenceType: 'ORDER',
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.notification.type).toBe('ORDER_STATUS_UPDATE');
    });

    it('should send delivery notification SMS', async () => {
      const response = await request(testApp)
        .post('/api/v1/notifications/sms/send')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          type: 'DELIVERY_NOTIFICATION',
          recipientPhone: '+447700900400',
          message: 'Your order will be delivered today between 9 AM - 5 PM',
          referenceId: testOrderId,
          referenceType: 'ORDER',
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.notification.type).toBe('DELIVERY_NOTIFICATION');
    });

    it('should validate phone number format', async () => {
      const response = await request(testApp)
        .post('/api/v1/notifications/sms/send')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          type: 'BOOKING_REMINDER',
          recipientPhone: 'invalid-phone',
          message: 'Test message',
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('INVALID_PHONE_NUMBER');
    });

    it('should enforce SMS character limit', async () => {
      const longMessage = 'A'.repeat(1000);

      const response = await request(testApp)
        .post('/api/v1/notifications/sms/send')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          type: 'BOOKING_REMINDER',
          recipientPhone: '+447700900400',
          message: longMessage,
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('MESSAGE_TOO_LONG');
    });
  });

  describe('Push Notifications', () => {
    let deviceToken: string;

    beforeAll(async () => {
      const deviceResponse = await request(testApp)
        .post('/api/v1/notifications/push/register-device')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          deviceToken: 'test_device_token_123',
          deviceType: 'ios',
          deviceName: 'iPhone 13',
        })
        .expect(200);

      deviceToken = deviceResponse.body.data.device.token;
    });

    it('should send order update push notification', async () => {
      const response = await request(testApp)
        .post('/api/v1/notifications/push/send')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          type: 'ORDER_UPDATE',
          title: 'Order Update',
          body: 'Your order has been shipped',
          data: {
            orderId: testOrderId,
            screen: 'OrderDetails',
          },
          referenceId: testOrderId,
          referenceType: 'ORDER',
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.notification).toMatchObject({
        type: 'ORDER_UPDATE',
        channel: 'PUSH',
        status: 'SENT',
      });

      testPushNotificationId = response.body.data.notification.id;
    });

    it('should send promotional push notification', async () => {
      const response = await request(testApp)
        .post('/api/v1/notifications/push/send')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          type: 'PROMOTIONAL',
          title: 'Flash Sale!',
          body: '20% off all kitchens this weekend',
          data: {
            saleId: 'sale-123',
            screen: 'SaleDetails',
          },
          referenceType: 'PROMOTION',
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.notification.type).toBe('PROMOTIONAL');
    });

    it('should send booking reminder push notification', async () => {
      const response = await request(testApp)
        .post('/api/v1/notifications/push/send')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          type: 'BOOKING_REMINDER',
          title: 'Appointment Reminder',
          body: 'Your appointment is in 1 hour',
          data: {
            bookingId: testBookingId,
            screen: 'BookingDetails',
          },
          referenceId: testBookingId,
          referenceType: 'BOOKING',
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.notification.type).toBe('BOOKING_REMINDER');
    });

    it('should unregister device token', async () => {
      const response = await request(testApp)
        .delete('/api/v1/notifications/push/unregister-device')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          deviceToken,
        })
        .expect(200);

      expect(response.body.success).toBe(true);
    });
  });

  describe('Notification Templates', () => {
    it('should create email template', async () => {
      const response = await request(testApp)
        .post('/api/v1/admin/notifications/templates')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Order Confirmation Template',
          slug: 'order-confirmation',
          type: 'ORDER_CONFIRMATION',
          channel: 'EMAIL',
          subject: 'Order Confirmation - {{orderNumber}}',
          body: 'Hello {{customerName}}, your order {{orderNumber}} has been confirmed.',
          variables: JSON.stringify([
            'orderNumber',
            'customerName',
            'orderTotal',
            'orderItems',
          ]),
          isActive: true,
        })
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.template).toMatchObject({
        name: 'Order Confirmation Template',
        slug: 'order-confirmation',
        type: 'ORDER_CONFIRMATION',
        channel: 'EMAIL',
      });

      testTemplateId = response.body.data.template.id;
    });

    it('should update template', async () => {
      const response = await request(testApp)
        .patch(`/api/v1/admin/notifications/templates/${testTemplateId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          subject: 'Order Confirmation - Order {{orderNumber}}',
          body: 'Updated template body',
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.template.subject).toBe('Order Confirmation - Order {{orderNumber}}');
    });

    it('should retrieve all templates', async () => {
      const response = await request(testApp)
        .get('/api/v1/admin/notifications/templates')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data.templates)).toBe(true);
    });

    it('should filter templates by channel', async () => {
      const response = await request(testApp)
        .get('/api/v1/admin/notifications/templates')
        .set('Authorization', `Bearer ${authToken}`)
        .query({
          channel: 'EMAIL',
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(
        response.body.data.templates.every((t: any) => t.channel === 'EMAIL')
      ).toBe(true);
    });

    it('should preview template with test data', async () => {
      const response = await request(testApp)
        .post(`/api/v1/admin/notifications/templates/${testTemplateId}/preview`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          variables: {
            orderNumber: 'LW-1234567890',
            customerName: 'John Doe',
            orderTotal: 15000.00,
          },
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.preview).toContain('LW-1234567890');
      expect(response.body.data.preview).toContain('John Doe');
    });

    it('should delete template', async () => {
      const tempTemplate = await prisma.notificationTemplate.create({
        data: {
          name: 'Temp Template',
          slug: 'temp-template',
          type: 'ORDER_CONFIRMATION',
          channel: 'EMAIL',
          subject: 'Test',
          body: 'Test body',
          isActive: true,
        },
      });

      const response = await request(testApp)
        .delete(`/api/v1/admin/notifications/templates/${tempTemplate.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
    });
  });

  describe('Notification Preferences', () => {
    it('should retrieve user notification preferences', async () => {
      const response = await request(testApp)
        .get('/api/v1/notifications/preferences')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.preferences).toMatchObject({
        emailNotifications: expect.any(Boolean),
        smsNotifications: expect.any(Boolean),
        pushNotifications: expect.any(Boolean),
      });
    });

    it('should update email notification preferences', async () => {
      const response = await request(testApp)
        .patch('/api/v1/notifications/preferences')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          emailNotifications: true,
          orderUpdates: true,
          promotionalEmails: false,
          newsletter: true,
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.preferences.emailNotifications).toBe(true);
      expect(response.body.data.preferences.promotionalEmails).toBe(false);
    });

    it('should update SMS notification preferences', async () => {
      const response = await request(testApp)
        .patch('/api/v1/notifications/preferences')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          smsNotifications: true,
          bookingReminders: true,
          deliveryUpdates: true,
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.preferences.smsNotifications).toBe(true);
    });

    it('should update push notification preferences', async () => {
      const response = await request(testApp)
        .patch('/api/v1/notifications/preferences')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          pushNotifications: true,
          orderUpdates: true,
          promotionalPush: false,
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.preferences.pushNotifications).toBe(true);
      expect(response.body.data.preferences.promotionalPush).toBe(false);
    });

    it('should respect user opt-out preferences', async () => {
      await request(testApp)
        .patch('/api/v1/notifications/preferences')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          promotionalEmails: false,
        })
        .expect(200);

      const response = await request(testApp)
        .post('/api/v1/notifications/email/send')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          type: 'PROMOTIONAL',
          recipientEmail: 'notification.test@example.com',
          recipientName: 'Notification User',
          subject: 'Promotional Email',
          templateData: {},
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('USER_OPTED_OUT');
    });

    it('should allow opting out of all notifications', async () => {
      const response = await request(testApp)
        .patch('/api/v1/notifications/preferences')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          emailNotifications: false,
          smsNotifications: false,
          pushNotifications: false,
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.preferences.emailNotifications).toBe(false);
      expect(response.body.data.preferences.smsNotifications).toBe(false);
      expect(response.body.data.preferences.pushNotifications).toBe(false);
    });

    it('should reset preferences to default', async () => {
      const response = await request(testApp)
        .post('/api/v1/notifications/preferences/reset')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.preferences).toMatchObject({
        emailNotifications: true,
        smsNotifications: true,
        pushNotifications: true,
      });
    });
  });

  describe('Notification History', () => {
    it('should retrieve user notification history', async () => {
      const response = await request(testApp)
        .get('/api/v1/notifications/history')
        .set('Authorization', `Bearer ${authToken}`)
        .query({
          page: 1,
          limit: 10,
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data.notifications)).toBe(true);
    });

    it('should filter notifications by channel', async () => {
      const response = await request(testApp)
        .get('/api/v1/notifications/history')
        .set('Authorization', `Bearer ${authToken}`)
        .query({
          channel: 'EMAIL',
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(
        response.body.data.notifications.every((n: any) => n.channel === 'EMAIL')
      ).toBe(true);
    });

    it('should filter notifications by type', async () => {
      const response = await request(testApp)
        .get('/api/v1/notifications/history')
        .set('Authorization', `Bearer ${authToken}`)
        .query({
          type: 'ORDER_CONFIRMATION',
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(
        response.body.data.notifications.every((n: any) => n.type === 'ORDER_CONFIRMATION')
      ).toBe(true);
    });

    it('should filter notifications by status', async () => {
      const response = await request(testApp)
        .get('/api/v1/notifications/history')
        .set('Authorization', `Bearer ${authToken}`)
        .query({
          status: 'SENT',
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(
        response.body.data.notifications.every((n: any) => n.status === 'SENT')
      ).toBe(true);
    });

    it('should retrieve specific notification details', async () => {
      const response = await request(testApp)
        .get(`/api/v1/notifications/${testEmailNotificationId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.notification).toMatchObject({
        id: testEmailNotificationId,
        type: 'ORDER_CONFIRMATION',
        channel: 'EMAIL',
      });
    });

    it('should mark notification as read', async () => {
      const response = await request(testApp)
        .patch(`/api/v1/notifications/${testEmailNotificationId}/read`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.notification.isRead).toBe(true);
    });

    it('should mark all notifications as read', async () => {
      const response = await request(testApp)
        .patch('/api/v1/notifications/mark-all-read')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.updated).toBeGreaterThan(0);
    });

    it('should delete notification from history', async () => {
      const tempNotification = await prisma.notification.create({
        data: {
          userId: testUserId,
          type: 'PROMOTIONAL',
          channel: 'EMAIL',
          status: 'SENT',
          recipientEmail: 'notification.test@example.com',
          subject: 'Test',
          body: 'Test body',
        },
      });

      const response = await request(testApp)
        .delete(`/api/v1/notifications/${tempNotification.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
    });
  });

  describe('Notification Delivery Tracking', () => {
    it('should track email delivery status', async () => {
      const response = await request(testApp)
        .get(`/api/v1/notifications/${testEmailNotificationId}/delivery-status`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.deliveryStatus).toMatchObject({
        status: expect.any(String),
        attempts: expect.any(Number),
        lastAttemptAt: expect.any(String),
      });
    });

    it('should track SMS delivery status', async () => {
      const response = await request(testApp)
        .get(`/api/v1/notifications/${testSmsNotificationId}/delivery-status`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.deliveryStatus).toBeDefined();
    });

    it('should track push notification delivery status', async () => {
      const response = await request(testApp)
        .get(`/api/v1/notifications/${testPushNotificationId}/delivery-status`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.deliveryStatus).toBeDefined();
    });

    it('should retrieve notification delivery analytics', async () => {
      const response = await request(testApp)
        .get('/api/v1/admin/notifications/analytics/delivery')
        .set('Authorization', `Bearer ${authToken}`)
        .query({
          startDate: '2026-01-01',
          endDate: '2026-12-31',
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.analytics).toMatchObject({
        totalSent: expect.any(Number),
        totalDelivered: expect.any(Number),
        totalFailed: expect.any(Number),
        deliveryRate: expect.any(Number),
      });
    });
  });

  describe('Scheduled Notifications', () => {
    it('should schedule notification for future delivery', async () => {
      const scheduledDate = new Date();
      scheduledDate.setHours(scheduledDate.getHours() + 2);

      const response = await request(testApp)
        .post('/api/v1/notifications/schedule')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          type: 'PROMOTIONAL',
          channel: 'EMAIL',
          recipientEmail: 'notification.test@example.com',
          recipientName: 'Notification User',
          subject: 'Scheduled Promotional Email',
          templateData: {},
          scheduledFor: scheduledDate.toISOString(),
        })
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.notification.status).toBe('SCHEDULED');
      expect(response.body.data.notification.scheduledFor).toBeDefined();
    });

    it('should retrieve scheduled notifications', async () => {
      const response = await request(testApp)
        .get('/api/v1/notifications/scheduled')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data.notifications)).toBe(true);
    });

    it('should cancel scheduled notification', async () => {
      const scheduledDate = new Date();
      scheduledDate.setHours(scheduledDate.getHours() + 3);

      const scheduleResponse = await request(testApp)
        .post('/api/v1/notifications/schedule')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          type: 'PROMOTIONAL',
          channel: 'EMAIL',
          recipientEmail: 'notification.test@example.com',
          recipientName: 'Notification User',
          subject: 'Test Cancel',
          templateData: {},
          scheduledFor: scheduledDate.toISOString(),
        })
        .expect(201);

      const notificationId = scheduleResponse.body.data.notification.id;

      const response = await request(testApp)
        .delete(`/api/v1/notifications/scheduled/${notificationId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.notification.status).toBe('CANCELLED');
    });

    it('should not schedule notification in the past', async () => {
      const pastDate = new Date();
      pastDate.setHours(pastDate.getHours() - 2);

      const response = await request(testApp)
        .post('/api/v1/notifications/schedule')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          type: 'PROMOTIONAL',
          channel: 'EMAIL',
          recipientEmail: 'notification.test@example.com',
          recipientName: 'Notification User',
          subject: 'Test Past Date',
          templateData: {},
          scheduledFor: pastDate.toISOString(),
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('INVALID_SCHEDULED_DATE');
    });
  });

  describe('Bulk Notifications', () => {
    it('should send bulk email notifications', async () => {
      const response = await request(testApp)
        .post('/api/v1/admin/notifications/bulk/email')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          type: 'PROMOTIONAL',
          subject: 'Bulk Promotional Email',
          templateId: testTemplateId,
          recipients: [
            {
              email: 'notification.test@example.com',
              name: 'Notification User',
              templateData: {
                orderNumber: 'LW-1234567890',
              },
            },
          ],
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.sent).toBe(1);
    });

    it('should send bulk SMS notifications', async () => {
      const response = await request(testApp)
        .post('/api/v1/admin/notifications/bulk/sms')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          type: 'PROMOTIONAL',
          message: 'Bulk SMS message',
          recipients: [
            {
              phone: '+447700900400',
            },
          ],
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.sent).toBe(1);
    });

    it('should track bulk notification progress', async () => {
      const bulkResponse = await request(testApp)
        .post('/api/v1/admin/notifications/bulk/email')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          type: 'PROMOTIONAL',
          subject: 'Bulk Test',
          templateId: testTemplateId,
          recipients: [
            {
              email: 'notification.test@example.com',
              name: 'Test User',
              templateData: {},
            },
          ],
        })
        .expect(200);

      const batchId = bulkResponse.body.data.batchId;

      const response = await request(testApp)
        .get(`/api/v1/admin/notifications/bulk/${batchId}/progress`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.progress).toMatchObject({
        total: expect.any(Number),
        sent: expect.any(Number),
        failed: expect.any(Number),
        pending: expect.any(Number),
      });
    });
  });

  describe('Notification Webhooks', () => {
    it('should handle email delivery webhook', async () => {
      const webhookPayload = {
        event: 'email.delivered',
        notificationId: testEmailNotificationId,
        timestamp: new Date().toISOString(),
        provider: 'sendgrid',
      };

      const response = await request(testApp)
        .post('/api/v1/webhooks/notifications/email')
        .send(webhookPayload)
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    it('should handle SMS delivery webhook', async () => {
      const webhookPayload = {
        event: 'sms.delivered',
        notificationId: testSmsNotificationId,
        timestamp: new Date().toISOString(),
        provider: 'twilio',
      };

      const response = await request(testApp)
        .post('/api/v1/webhooks/notifications/sms')
        .send(webhookPayload)
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    it('should handle notification bounce webhook', async () => {
      const webhookPayload = {
        event: 'email.bounced',
        notificationId: testEmailNotificationId,
        timestamp: new Date().toISOString(),
        reason: 'Invalid email address',
      };

      const response = await request(testApp)
        .post('/api/v1/webhooks/notifications/email')
        .send(webhookPayload)
        .expect(200);

      expect(response.body.success).toBe(true);

      const notification = await prisma.notification.findUnique({
        where: { id: testEmailNotificationId },
      });

      expect(notification?.status).toBe('BOUNCED');
    });
  });

  describe('Notification Rate Limiting', () => {
    it('should rate limit notification sending', async () => {
      const requests = 20;
      const responses = [];

      for (let i = 0; i < requests; i++) {
        const response = await request(testApp)
          .post('/api/v1/notifications/email/send')
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            type: 'PROMOTIONAL',
            recipientEmail: 'notification.test@example.com',
            recipientName: 'Test User',
            subject: `Test Email ${i}`,
            templateData: {},
          });

        responses.push(response);
      }

      const rateLimitedResponses = responses.filter(r => r.status === 429);
      expect(rateLimitedResponses.length).toBeGreaterThan(0);
    });
  });
});