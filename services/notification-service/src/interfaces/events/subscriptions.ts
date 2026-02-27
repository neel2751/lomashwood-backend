import { Logger } from 'winston';
import { EventConsumer } from '../../infrastructure/messaging/event-consumer';
import { NotificationEventHandlers } from './handlers';
import type { EmailService } from '../../app/email/email.service';
import type { SmsService } from '../../app/sms/sms.service';
import type { PushService } from '../../app/push/push.service';
import type { TemplateService } from '../../app/templates/template.service';

export interface SubscriptionDependencies {
  eventConsumer: EventConsumer;
  emailService: EmailService;
  smsService: SmsService;
  pushService: PushService;
  templateService: TemplateService;
  logger: Logger;
}

export async function registerEventSubscriptions(
  deps: SubscriptionDependencies,
): Promise<void> {
  const handlers = new NotificationEventHandlers(
    deps.emailService,
    deps.smsService,
    deps.pushService,
    deps.templateService,
    deps.logger,
  );

  deps.eventConsumer.subscribeToNotificationEvents({
    onUserCreated: handlers.onUserCreated,
    onOrderCreated: handlers.onOrderCreated,
    onOrderCancelled: handlers.onOrderCancelled,
    onPaymentSucceeded: handlers.onPaymentSucceeded,
    onRefundIssued: handlers.onRefundIssued,
    onBookingCreated: handlers.onBookingCreated,
    onBookingCancelled: handlers.onBookingCancelled,
    onReminderDue: handlers.onReminderDue,
    onBlogPublished: handlers.onBlogPublished,
  });

  deps.logger.info('Notification event subscriptions registered', {
    handlers: [
      'auth.user.created',
      'order.order.created',
      'order.order.cancelled',
      'order.payment.succeeded',
      'order.refund.issued',
      'appointment.booking.created',
      'appointment.booking.cancelled',
      'appointment.reminder.due',
      'content.blog.published',
    ],
  });
}