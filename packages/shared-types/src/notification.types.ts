export type NotificationChannel = 'EMAIL' | 'SMS' | 'PUSH';

export type NotificationStatus = 'PENDING' | 'QUEUED' | 'SENT' | 'DELIVERED' | 'FAILED' | 'CANCELLED';

export type NotificationCategory =
  | 'BOOKING_CONFIRMATION'
  | 'BOOKING_REMINDER'
  | 'BOOKING_CANCELLATION'
  | 'BOOKING_RESCHEDULED'
  | 'ORDER_CONFIRMATION'
  | 'ORDER_DISPATCHED'
  | 'ORDER_DELIVERED'
  | 'ORDER_CANCELLED'
  | 'PAYMENT_RECEIPT'
  | 'PAYMENT_FAILED'
  | 'REFUND_PROCESSED'
  | 'BROCHURE_DELIVERY'
  | 'BUSINESS_INQUIRY_RECEIVED'
  | 'NEWSLETTER_WELCOME'
  | 'PASSWORD_RESET'
  | 'EMAIL_VERIFICATION'
  | 'ADMIN_ALERT'
  | 'MARKETING'
  | 'CUSTOM';

export type TemplateType = 'EMAIL' | 'SMS' | 'PUSH';

export type SmsProvider = 'TWILIO' | 'MSG91';

export type EmailProvider = 'SES' | 'NODEMAILER';

export type PushProvider = 'FIREBASE' | 'WEBPUSH';

export interface EmailPayload {
  readonly to: readonly string[];
  readonly cc?: readonly string[] | undefined;
  readonly bcc?: readonly string[] | undefined;
  readonly replyTo?: string | undefined;
  readonly subject: string;
  readonly html: string;
  readonly text?: string | undefined;
  readonly attachments?: readonly EmailAttachment[] | undefined;
}

export interface EmailAttachment {
  readonly filename: string;
  readonly content: string | Buffer;
  readonly contentType: string;
}

export interface SmsPayload {
  readonly to: string;
  readonly body: string;
  readonly from?: string | undefined;
}

export interface PushPayload {
  readonly token: string;
  readonly title: string;
  readonly body: string;
  readonly imageUrl?: string | undefined;
  readonly data?: Record<string, string> | undefined;
  readonly badge?: number | undefined;
}

export interface NotificationTemplate {
  readonly id: string;
  readonly name: string;
  readonly slug: string;
  readonly type: TemplateType;
  readonly category: NotificationCategory;
  readonly subject: string | null;
  readonly body: string;
  readonly variables: readonly string[];
  readonly isActive: boolean;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

export interface NotificationRecord {
  readonly id: string;
  readonly userId: string | null;
  readonly channel: NotificationChannel;
  readonly category: NotificationCategory;
  readonly recipient: string;
  readonly subject: string | null;
  readonly body: string;
  readonly status: NotificationStatus;
  readonly provider: string;
  readonly providerMessageId: string | null;
  readonly attemptCount: number;
  readonly lastAttemptAt: Date | null;
  readonly deliveredAt: Date | null;
  readonly failureReason: string | null;
  readonly metadata: Record<string, unknown>;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

export interface SendEmailPayload {
  readonly userId?: string | undefined;
  readonly templateSlug: string;
  readonly to: readonly string[];
  readonly variables: Record<string, string>;
  readonly category: NotificationCategory;
  readonly attachments?: readonly EmailAttachment[] | undefined;
}

export interface SendSmsPayload {
  readonly userId?: string | undefined;
  readonly templateSlug: string;
  readonly to: string;
  readonly variables: Record<string, string>;
  readonly category: NotificationCategory;
}

export interface SendPushPayload {
  readonly userId: string;
  readonly templateSlug: string;
  readonly tokens: readonly string[];
  readonly variables: Record<string, string>;
  readonly category: NotificationCategory;
  readonly data?: Record<string, string> | undefined;
}

export interface BookingConfirmationData {
  readonly customerName: string;
  readonly referenceNumber: string;
  readonly appointmentType: string;
  readonly category: string;
  readonly date: string;
  readonly startTime: string;
  readonly showroomName: string | null;
  readonly showroomAddress: string | null;
  readonly consultantName: string | null;
}

export interface PaymentReceiptData {
  readonly customerName: string;
  readonly orderNumber: string;
  readonly amount: string;
  readonly currency: string;
  readonly paymentMethod: string;
  readonly paidAt: string;
  readonly invoiceUrl: string | null;
}

export interface BrochureDeliveryData {
  readonly customerName: string;
  readonly brochureUrl: string;
  readonly expiresAt: string | null;
}

export interface EmailSentEventPayload {
  readonly notificationId: string;
  readonly userId: string | null;
  readonly category: NotificationCategory;
  readonly recipient: string;
  readonly provider: EmailProvider;
  readonly providerMessageId: string | null;
  readonly sentAt: Date;
}

export interface SmsSentEventPayload {
  readonly notificationId: string;
  readonly userId: string | null;
  readonly category: NotificationCategory;
  readonly recipient: string;
  readonly provider: SmsProvider;
  readonly providerMessageId: string | null;
  readonly sentAt: Date;
}

export interface PushSentEventPayload {
  readonly notificationId: string;
  readonly userId: string;
  readonly category: NotificationCategory;
  readonly provider: PushProvider;
  readonly sentAt: Date;
}

export interface NotificationFailedEventPayload {
  readonly notificationId: string;
  readonly channel: NotificationChannel;
  readonly category: NotificationCategory;
  readonly recipient: string;
  readonly failureReason: string;
  readonly attemptCount: number;
  readonly failedAt: Date;
}