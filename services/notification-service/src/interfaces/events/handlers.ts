import { Logger } from 'winston';
import type { ConsumedEvent } from '../../infrastructure/messaging/event-consumer';
import type {
  UserCreatedPayload,
  OrderCreatedPayload,
  OrderCancelledPayload,
  PaymentSucceededPayload,
  RefundIssuedPayload,
  BookingCreatedPayload,
  BookingCancelledPayload,
  ReminderDuePayload,
  BlogPublishedPayload,
} from './payload.types';
import type { EmailService } from '../../app/email/email.service';
import type { SmsService } from '../../app/sms/sms.service';
import type { PushService } from '../../app/push/push.service';
import type { TemplateService } from '../../app/templates/template.service';
import { SYSTEM_TEMPLATES } from '../../app/templates/template.constants';

export class NotificationEventHandlers {
  constructor(
    private readonly emailService: EmailService,
    private readonly smsService: SmsService,
    private readonly pushService: PushService,
    private readonly templateService: TemplateService,
    private readonly logger: Logger,
  ) {}

  
  onUserCreated = async (event: ConsumedEvent<UserCreatedPayload>): Promise<void> => {
    const { userId, email, firstName } = event.payload;
    this.logger.info('Handling user.created event', { userId });

    try {
      const rendered = await this.templateService.render({
        slug: SYSTEM_TEMPLATES.WELCOME_EMAIL,
        channel: 'EMAIL',
        variables: { firstName, email },
      });

      await this.emailService.send({
        to: email,
        subject: rendered.subject ?? 'Welcome to Lomash Wood',
        htmlBody: rendered.htmlBody,
        textBody: rendered.textBody,
      });
    } catch (err: unknown) {
      this.logger.error('Failed to send welcome email', {
        userId,
        error: (err as Error).message,
      });
    }
  };

  

  onOrderCreated = async (event: ConsumedEvent<OrderCreatedPayload>): Promise<void> => {
    const { orderId, userId, customerEmail, customerPhone, totalAmount, currency } =
      event.payload;
    this.logger.info('Handling order.created event', { orderId, userId });

    try {
      const rendered = await this.templateService.render({
        slug: SYSTEM_TEMPLATES.PAYMENT_RECEIPT_EMAIL,
        channel: 'EMAIL',
        variables: {
          orderId,
          totalAmount: String(totalAmount),
          currency,
        },
      });

      await this.emailService.send({
        to: customerEmail,
        subject: rendered.subject ?? `Order Confirmation #${orderId}`,
        htmlBody: rendered.htmlBody,
        textBody: rendered.textBody,
      });

      if (customerPhone) {
        await this.smsService.send({
          to: customerPhone,
          body: `Lomash Wood: Your order #${orderId} has been confirmed. Total: ${currency} ${totalAmount}`,
        });
      }
    } catch (err: unknown) {
      this.logger.error('Failed to send order created notification', {
        orderId,
        error: (err as Error).message,
      });
    }
  };

  onOrderCancelled = async (event: ConsumedEvent<OrderCancelledPayload>): Promise<void> => {
    const { orderId, customerEmail, reason } = event.payload;
    this.logger.info('Handling order.cancelled event', { orderId });

    try {
      await this.emailService.send({
        to: customerEmail,
        subject: `Your Lomash Wood Order #${orderId} Has Been Cancelled`,
        textBody: `Your order #${orderId} has been cancelled. Reason: ${reason ?? 'No reason provided'}.`,
      });
    } catch (err: unknown) {
      this.logger.error('Failed to send order cancelled notification', {
        orderId,
        error: (err as Error).message,
      });
    }
  };

  onPaymentSucceeded = async (
    event: ConsumedEvent<PaymentSucceededPayload>,
  ): Promise<void> => {
    const { orderId, customerEmail, amount, currency, paymentMethod } = event.payload;
    this.logger.info('Handling payment.succeeded event', { orderId });

    try {
      const rendered = await this.templateService.render({
        slug: SYSTEM_TEMPLATES.PAYMENT_RECEIPT_EMAIL,
        channel: 'EMAIL',
        variables: {
          orderId,
          amount: String(amount),
          currency,
          paymentMethod: paymentMethod ?? 'Card',
        },
      });

      await this.emailService.send({
        to: customerEmail,
        subject: rendered.subject ?? `Payment Confirmed — Order #${orderId}`,
        htmlBody: rendered.htmlBody,
        textBody: rendered.textBody,
      });
    } catch (err: unknown) {
      this.logger.error('Failed to send payment receipt', {
        orderId,
        error: (err as Error).message,
      });
    }
  };

  onRefundIssued = async (event: ConsumedEvent<RefundIssuedPayload>): Promise<void> => {
    const { orderId, customerEmail, refundAmount, currency } = event.payload;
    this.logger.info('Handling refund.issued event', { orderId });

    try {
      await this.emailService.send({
        to: customerEmail,
        subject: `Refund Issued for Order #${orderId}`,
        textBody: `A refund of ${currency} ${refundAmount} has been issued for your order #${orderId}. Please allow 3–5 business days to appear on your statement.`,
      });
    } catch (err: unknown) {
      this.logger.error('Failed to send refund notification', {
        orderId,
        error: (err as Error).message,
      });
    }
  };

 

  onBookingCreated = async (event: ConsumedEvent<BookingCreatedPayload>): Promise<void> => {
    const {
      bookingId,
      userId,
      customerEmail,
      customerPhone,
      appointmentType,
      scheduledAt,
      isKitchen,
      isBedroom,
    } = event.payload;
    this.logger.info('Handling booking.created event', { bookingId, userId });

    try {
      const rendered = await this.templateService.render({
        slug: SYSTEM_TEMPLATES.BOOKING_CONFIRMATION_EMAIL,
        channel: 'EMAIL',
        variables: {
          bookingId,
          appointmentType,
          scheduledAt,
          rooms: [isKitchen && 'Kitchen', isBedroom && 'Bedroom']
            .filter(Boolean)
            .join(' & '),
        },
      });

      await this.emailService.send({
        to: customerEmail,
        subject: rendered.subject ?? 'Booking Confirmed — Lomash Wood',
        htmlBody: rendered.htmlBody,
        textBody: rendered.textBody,
      });

     
      if (customerPhone) {
        const smsRendered = await this.templateService.render({
          slug: SYSTEM_TEMPLATES.BOOKING_CONFIRMATION_SMS,
          channel: 'SMS',
          variables: { bookingId, scheduledAt, appointmentType },
        });

        await this.smsService.send({ to: customerPhone, body: smsRendered.textBody });
      }

      
      if (isKitchen && isBedroom) {
        const adminEmail = process.env.ADMIN_DUAL_BOOKING_EMAIL ?? '';
        if (adminEmail) {
          await this.emailService.send({
            to: adminEmail,
            subject: `[ACTION] Dual Booking — Kitchen & Bedroom — ${bookingId}`,
            textBody: `A customer has booked consultations for both Kitchen and Bedroom.\n\nBooking ID: ${bookingId}\nType: ${appointmentType}\nScheduled: ${scheduledAt}`,
          });
        }
      }
    } catch (err: unknown) {
      this.logger.error('Failed to send booking confirmation', {
        bookingId,
        error: (err as Error).message,
      });
    }
  };

  onBookingCancelled = async (
    event: ConsumedEvent<BookingCancelledPayload>,
  ): Promise<void> => {
    const { bookingId, customerEmail, scheduledAt } = event.payload;
    this.logger.info('Handling booking.cancelled event', { bookingId });

    try {
      const rendered = await this.templateService.render({
        slug: SYSTEM_TEMPLATES.BOOKING_CANCELLATION_EMAIL,
        channel: 'EMAIL',
        variables: { bookingId, scheduledAt },
      });

      await this.emailService.send({
        to: customerEmail,
        subject: rendered.subject ?? 'Booking Cancelled — Lomash Wood',
        htmlBody: rendered.htmlBody,
        textBody: rendered.textBody,
      });
    } catch (err: unknown) {
      this.logger.error('Failed to send booking cancellation notification', {
        bookingId,
        error: (err as Error).message,
      });
    }
  };

  onReminderDue = async (event: ConsumedEvent<ReminderDuePayload>): Promise<void> => {
    const { bookingId, customerEmail, customerPhone, scheduledAt, appointmentType } =
      event.payload;
    this.logger.info('Handling reminder.due event', { bookingId });

    try {
      const rendered = await this.templateService.render({
        slug: SYSTEM_TEMPLATES.BOOKING_REMINDER_EMAIL,
        channel: 'EMAIL',
        variables: { bookingId, scheduledAt, appointmentType },
      });

      await this.emailService.send({
        to: customerEmail,
        subject: rendered.subject ?? 'Reminder — Your Lomash Wood Appointment',
        htmlBody: rendered.htmlBody,
        textBody: rendered.textBody,
      });

      if (customerPhone) {
        await this.smsService.send({
          to: customerPhone,
          body: `Reminder: Your Lomash Wood appointment (${appointmentType}) is scheduled for ${scheduledAt}. Ref: ${bookingId}`,
        });
      }
    } catch (err: unknown) {
      this.logger.error('Failed to send appointment reminder', {
        bookingId,
        error: (err as Error).message,
      });
    }
  };

 

  onBlogPublished = async (event: ConsumedEvent<BlogPublishedPayload>): Promise<void> => {
    const { blogId, title, slug } = event.payload;
    this.logger.info('Handling blog.published event', { blogId, slug });
   
  };
}