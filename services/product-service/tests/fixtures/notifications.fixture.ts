import { NotificationType, NotificationStatus, NotificationChannel, NotificationPriority } from '@prisma/client';

export interface NotificationFixture {
  id: string;
  notificationNumber: string;
  userId: string;
  userEmail: string;
  userName?: string;
  type: NotificationType;
  channel: NotificationChannel;
  priority: NotificationPriority;
  status: NotificationStatus;
  subject: string;
  body: string;
  templateId?: string;
  templateVariables?: Record<string, any>;
  recipientEmail?: string;
  recipientPhone?: string;
  metadata?: Record<string, any>;
  scheduledFor?: Date;
  sentAt?: Date;
  deliveredAt?: Date;
  readAt?: Date;
  failedAt?: Date;
  failureReason?: string;
  retryCount: number;
  maxRetries: number;
  createdAt: Date;
  updatedAt: Date;
}

export const bookingConfirmationEmail: NotificationFixture = {
  id: 'notif_email_001',
  notificationNumber: 'NOTIF-2026-001001',
  userId: 'usr_001',
  userEmail: 'john.doe@example.com',
  userName: 'John Doe',
  type: NotificationType.BOOKING_CONFIRMATION,
  channel: NotificationChannel.EMAIL,
  priority: NotificationPriority.HIGH,
  status: NotificationStatus.DELIVERED,
  subject: 'Your Kitchen Consultation is Confirmed',
  body: 'Dear John Doe, your home measurement appointment for kitchen design is confirmed for February 15, 2026 at 10:00 AM.',
  templateId: 'booking_confirmation_v1',
  templateVariables: {
    customerName: 'John Doe',
    appointmentType: 'Home Measurement',
    serviceType: 'Kitchen',
    scheduledDate: '2026-02-15',
    scheduledTime: '10:00',
    consultantName: 'Sarah Mitchell',
    bookingNumber: 'BKG-2026-001001',
  },
  recipientEmail: 'john.doe@example.com',
  metadata: {
    bookingId: 'bkg_home_001',
    appointmentType: 'HOME_MEASUREMENT',
  },
  sentAt: new Date('2026-02-10T10:30:00Z'),
  deliveredAt: new Date('2026-02-10T10:30:30Z'),
  retryCount: 0,
  maxRetries: 3,
  createdAt: new Date('2026-02-10T10:30:00Z'),
  updatedAt: new Date('2026-02-10T10:30:30Z'),
};

export const bookingConfirmationSMS: NotificationFixture = {
  id: 'notif_sms_001',
  notificationNumber: 'NOTIF-2026-001002',
  userId: 'usr_001',
  userEmail: 'john.doe@example.com',
  userName: 'John Doe',
  type: NotificationType.BOOKING_CONFIRMATION,
  channel: NotificationChannel.SMS,
  priority: NotificationPriority.HIGH,
  status: NotificationStatus.DELIVERED,
  subject: 'Booking Confirmed',
  body: 'Your kitchen consultation is confirmed for 15 Feb 2026 at 10:00 AM. Ref: BKG-2026-001001',
  recipientPhone: '+44 7700 900123',
  metadata: {
    bookingId: 'bkg_home_001',
    appointmentType: 'HOME_MEASUREMENT',
  },
  sentAt: new Date('2026-02-10T10:30:00Z'),
  deliveredAt: new Date('2026-02-10T10:30:15Z'),
  retryCount: 0,
  maxRetries: 3,
  createdAt: new Date('2026-02-10T10:30:00Z'),
  updatedAt: new Date('2026-02-10T10:30:15Z'),
};

export const appointmentReminderEmail: NotificationFixture = {
  id: 'notif_email_002',
  notificationNumber: 'NOTIF-2026-001003',
  userId: 'usr_001',
  userEmail: 'john.doe@example.com',
  userName: 'John Doe',
  type: NotificationType.APPOINTMENT_REMINDER,
  channel: NotificationChannel.EMAIL,
  priority: NotificationPriority.MEDIUM,
  status: NotificationStatus.SENT,
  subject: 'Reminder: Your Kitchen Consultation Tomorrow',
  body: 'This is a reminder that your kitchen consultation is scheduled for tomorrow, February 15, 2026 at 10:00 AM.',
  templateId: 'appointment_reminder_v1',
  templateVariables: {
    customerName: 'John Doe',
    appointmentType: 'Home Measurement',
    serviceType: 'Kitchen',
    scheduledDate: '2026-02-15',
    scheduledTime: '10:00',
    consultantName: 'Sarah Mitchell',
  },
  recipientEmail: 'john.doe@example.com',
  metadata: {
    bookingId: 'bkg_home_001',
    reminderType: '24_hours_before',
  },
  scheduledFor: new Date('2026-02-14T10:00:00Z'),
  sentAt: new Date('2026-02-14T10:00:00Z'),
  retryCount: 0,
  maxRetries: 3,
  createdAt: new Date('2026-02-13T10:00:00Z'),
  updatedAt: new Date('2026-02-14T10:00:00Z'),
};

export const paymentSuccessEmail: NotificationFixture = {
  id: 'notif_email_003',
  notificationNumber: 'NOTIF-2026-001004',
  userId: 'usr_001',
  userEmail: 'john.doe@example.com',
  userName: 'John Doe',
  type: NotificationType.PAYMENT_SUCCESS,
  channel: NotificationChannel.EMAIL,
  priority: NotificationPriority.HIGH,
  status: NotificationStatus.DELIVERED,
  subject: 'Payment Received - Order #ORD-2026-001234',
  body: 'Thank you for your payment of £9,700.00. Your order for Luna White Kitchen has been confirmed.',
  templateId: 'payment_success_v1',
  templateVariables: {
    customerName: 'John Doe',
    orderNumber: 'ORD-2026-001234',
    amount: 9700.00,
    currency: 'GBP',
    paymentNumber: 'PAY-2026-001001',
    productName: 'Luna White Kitchen',
    receiptUrl: 'https://stripe.com/receipts/payment/ABC123',
  },
  recipientEmail: 'john.doe@example.com',
  metadata: {
    orderId: 'ord_kitchen_001',
    paymentId: 'pay_stripe_001',
  },
  sentAt: new Date('2026-02-10T10:15:30Z'),
  deliveredAt: new Date('2026-02-10T10:15:45Z'),
  retryCount: 0,
  maxRetries: 3,
  createdAt: new Date('2026-02-10T10:15:30Z'),
  updatedAt: new Date('2026-02-10T10:15:45Z'),
};

export const paymentFailedEmail: NotificationFixture = {
  id: 'notif_email_004',
  notificationNumber: 'NOTIF-2026-001005',
  userId: 'usr_013',
  userEmail: 'test.failed@example.com',
  type: NotificationType.PAYMENT_FAILED,
  channel: NotificationChannel.EMAIL,
  priority: NotificationPriority.HIGH,
  status: NotificationStatus.DELIVERED,
  subject: 'Payment Failed - Order #ORD-2026-001242',
  body: 'Your payment for £5,500.00 was declined. Please update your payment method to complete your order.',
  templateId: 'payment_failed_v1',
  templateVariables: {
    orderNumber: 'ORD-2026-001242',
    amount: 5500.00,
    currency: 'GBP',
    failureReason: 'Your card was declined',
    retryUrl: 'https://lomashwood.com/checkout/retry/ord_kitchen_003',
  },
  recipientEmail: 'test.failed@example.com',
  metadata: {
    orderId: 'ord_kitchen_003',
    paymentId: 'pay_stripe_003',
    failureCode: 'card_declined',
  },
  sentAt: new Date('2026-02-11T14:05:00Z'),
  deliveredAt: new Date('2026-02-11T14:05:15Z'),
  retryCount: 0,
  maxRetries: 3,
  createdAt: new Date('2026-02-11T14:05:00Z'),
  updatedAt: new Date('2026-02-11T14:05:15Z'),
};

export const orderConfirmationEmail: NotificationFixture = {
  id: 'notif_email_005',
  notificationNumber: 'NOTIF-2026-001006',
  userId: 'usr_002',
  userEmail: 'jane.smith@example.com',
  userName: 'Jane Smith',
  type: NotificationType.ORDER_CONFIRMATION,
  channel: NotificationChannel.EMAIL,
  priority: NotificationPriority.HIGH,
  status: NotificationStatus.DELIVERED,
  subject: 'Order Confirmed - #ORD-2026-001235',
  body: 'Your order for J-Pull Pebble Grey Gloss Kitchen has been confirmed and is being processed.',
  templateId: 'order_confirmation_v1',
  templateVariables: {
    customerName: 'Jane Smith',
    orderNumber: 'ORD-2026-001235',
    productName: 'J-Pull Pebble Grey Gloss Kitchen',
    totalAmount: 14550.00,
    currency: 'GBP',
    estimatedDelivery: '2026-03-15',
  },
  recipientEmail: 'jane.smith@example.com',
  metadata: {
    orderId: 'ord_kitchen_002',
    orderStatus: 'CONFIRMED',
  },
  sentAt: new Date('2026-02-09T15:00:30Z'),
  deliveredAt: new Date('2026-02-09T15:00:45Z'),
  retryCount: 0,
  maxRetries: 3,
  createdAt: new Date('2026-02-09T15:00:30Z'),
  updatedAt: new Date('2026-02-09T15:00:45Z'),
};

export const orderShippedEmail: NotificationFixture = {
  id: 'notif_email_006',
  notificationNumber: 'NOTIF-2026-001007',
  userId: 'usr_004',
  userEmail: 'sarah.williams@example.com',
  userName: 'Sarah Williams',
  type: NotificationType.ORDER_SHIPPED,
  channel: NotificationChannel.EMAIL,
  priority: NotificationPriority.MEDIUM,
  status: NotificationStatus.DELIVERED,
  subject: 'Your Order Has Shipped - #ORD-2026-001237',
  body: 'Great news! Your Modern Sliding Wardrobe has been shipped and is on its way.',
  templateId: 'order_shipped_v1',
  templateVariables: {
    customerName: 'Sarah Williams',
    orderNumber: 'ORD-2026-001237',
    productName: 'Modern Sliding Wardrobe',
    trackingNumber: 'TRK123456789GB',
    trackingUrl: 'https://track.carrier.com/TRK123456789GB',
    estimatedDelivery: '2026-02-12',
  },
  recipientEmail: 'sarah.williams@example.com',
  metadata: {
    orderId: 'ord_bedroom_002',
    orderStatus: 'SHIPPED',
    carrier: 'DHL',
  },
  sentAt: new Date('2026-02-09T10:30:00Z'),
  deliveredAt: new Date('2026-02-09T10:30:15Z'),
  retryCount: 0,
  maxRetries: 3,
  createdAt: new Date('2026-02-09T10:30:00Z'),
  updatedAt: new Date('2026-02-09T10:30:15Z'),
};

export const refundProcessedEmail: NotificationFixture = {
  id: 'notif_email_007',
  notificationNumber: 'NOTIF-2026-001008',
  userId: 'usr_006',
  userEmail: 'emily.davis@example.com',
  userName: 'Emily Davis',
  type: NotificationType.REFUND_PROCESSED,
  channel: NotificationChannel.EMAIL,
  priority: NotificationPriority.HIGH,
  status: NotificationStatus.DELIVERED,
  subject: 'Refund Processed - Order #ORD-2026-001239',
  body: 'Your refund of £6,960.00 has been processed and will appear in your account within 5-10 business days.',
  templateId: 'refund_processed_v1',
  templateVariables: {
    customerName: 'Emily Davis',
    orderNumber: 'ORD-2026-001239',
    refundAmount: 6960.00,
    currency: 'GBP',
    refundNumber: 'REF-2026-001001',
    refundReason: 'Customer requested cancellation',
  },
  recipientEmail: 'emily.davis@example.com',
  metadata: {
    orderId: 'ord_cancelled_001',
    refundId: 'ref_001',
  },
  sentAt: new Date('2026-02-07T10:00:30Z'),
  deliveredAt: new Date('2026-02-07T10:00:45Z'),
  retryCount: 0,
  maxRetries: 3,
  createdAt: new Date('2026-02-07T10:00:30Z'),
  updatedAt: new Date('2026-02-07T10:00:45Z'),
};

export const brochureRequestEmail: NotificationFixture = {
  id: 'notif_email_008',
  notificationNumber: 'NOTIF-2026-001009',
  userId: 'usr_015',
  userEmail: 'test.brochure@example.com',
  userName: 'Test Brochure',
  type: NotificationType.BROCHURE_SENT,
  channel: NotificationChannel.EMAIL,
  priority: NotificationPriority.LOW,
  status: NotificationStatus.DELIVERED,
  subject: 'Your Lomash Wood Brochure',
  body: 'Thank you for your interest in Lomash Wood. Please find attached our latest kitchen and bedroom brochure.',
  templateId: 'brochure_delivery_v1',
  templateVariables: {
    customerName: 'Test Brochure',
    brochureType: 'Complete Catalogue',
    downloadUrl: 'https://lomashwood.com/brochures/2026-catalogue.pdf',
  },
  recipientEmail: 'test.brochure@example.com',
  metadata: {
    brochureRequestId: 'brq_001',
    brochureType: 'COMPLETE_CATALOGUE',
  },
  sentAt: new Date('2026-02-11T11:00:00Z'),
  deliveredAt: new Date('2026-02-11T11:00:15Z'),
  retryCount: 0,
  maxRetries: 3,
  createdAt: new Date('2026-02-11T11:00:00Z'),
  updatedAt: new Date('2026-02-11T11:00:15Z'),
};

export const newsletterEmail: NotificationFixture = {
  id: 'notif_email_009',
  notificationNumber: 'NOTIF-2026-001010',
  userId: 'usr_016',
  userEmail: 'newsletter@example.com',
  userName: 'Newsletter Subscriber',
  type: NotificationType.NEWSLETTER,
  channel: NotificationChannel.EMAIL,
  priority: NotificationPriority.LOW,
  status: NotificationStatus.DELIVERED,
  subject: 'February 2026 - Kitchen Design Trends',
  body: 'Discover the latest kitchen and bedroom design trends for 2026.',
  templateId: 'newsletter_monthly_v1',
  templateVariables: {
    month: 'February',
    year: 2026,
    featuredProducts: ['Luna White Kitchen', 'Modern Sliding Wardrobe'],
    articleUrl: 'https://lomashwood.com/blog/february-trends',
  },
  recipientEmail: 'newsletter@example.com',
  metadata: {
    campaignId: 'campaign_feb_2026',
    newsletterType: 'MONTHLY',
  },
  scheduledFor: new Date('2026-02-01T09:00:00Z'),
  sentAt: new Date('2026-02-01T09:00:00Z'),
  deliveredAt: new Date('2026-02-01T09:00:15Z'),
  retryCount: 0,
  maxRetries: 3,
  createdAt: new Date('2026-01-25T10:00:00Z'),
  updatedAt: new Date('2026-02-01T09:00:15Z'),
};

export const adminNotificationBothServices: NotificationFixture = {
  id: 'notif_email_010',
  notificationNumber: 'NOTIF-2026-001011',
  userId: 'admin_001',
  userEmail: 'admin@lomashwood.com',
  type: NotificationType.ADMIN_ALERT,
  channel: NotificationChannel.EMAIL,
  priority: NotificationPriority.URGENT,
  status: NotificationStatus.DELIVERED,
  subject: 'New Booking: Kitchen & Bedroom Consultation',
  body: 'A customer has booked both kitchen and bedroom consultation. Booking #BKG-2026-001003',
  templateId: 'admin_alert_both_services_v1',
  templateVariables: {
    bookingNumber: 'BKG-2026-001003',
    customerName: 'Robert Jones',
    customerEmail: 'robert.jones@example.com',
    customerPhone: '+44 7700 900789',
    appointmentType: 'Home Measurement',
    scheduledDate: '2026-02-17',
    scheduledTime: '11:00',
  },
  recipientEmail: 'admin@lomashwood.com',
  metadata: {
    bookingId: 'bkg_home_003',
    isKitchen: true,
    isBedroom: true,
    alertType: 'BOTH_SERVICES_BOOKED',
  },
  sentAt: new Date('2026-02-11T09:15:30Z'),
  deliveredAt: new Date('2026-02-11T09:15:45Z'),
  retryCount: 0,
  maxRetries: 3,
  createdAt: new Date('2026-02-11T09:15:30Z'),
  updatedAt: new Date('2026-02-11T09:15:45Z'),
};

export const notificationPending: NotificationFixture = {
  id: 'notif_email_011',
  notificationNumber: 'NOTIF-2026-001012',
  userId: 'usr_017',
  userEmail: 'pending@example.com',
  type: NotificationType.ORDER_CONFIRMATION,
  channel: NotificationChannel.EMAIL,
  priority: NotificationPriority.MEDIUM,
  status: NotificationStatus.PENDING,
  subject: 'Order Confirmed - #ORD-2026-001244',
  body: 'Your order has been confirmed.',
  templateId: 'order_confirmation_v1',
  recipientEmail: 'pending@example.com',
  metadata: {
    orderId: 'ord_test_001',
  },
  scheduledFor: new Date('2026-02-13T10:00:00Z'),
  retryCount: 0,
  maxRetries: 3,
  createdAt: new Date('2026-02-12T14:00:00Z'),
  updatedAt: new Date('2026-02-12T14:00:00Z'),
};

export const notificationFailed: NotificationFixture = {
  id: 'notif_email_012',
  notificationNumber: 'NOTIF-2026-001013',
  userId: 'usr_018',
  userEmail: 'failed@example.com',
  type: NotificationType.PAYMENT_SUCCESS,
  channel: NotificationChannel.EMAIL,
  priority: NotificationPriority.HIGH,
  status: NotificationStatus.FAILED,
  subject: 'Payment Received',
  body: 'Your payment has been received.',
  templateId: 'payment_success_v1',
  recipientEmail: 'failed@example.com',
  metadata: {
    paymentId: 'pay_test_001',
  },
  failedAt: new Date('2026-02-12T12:30:00Z'),
  failureReason: 'SMTP connection timeout',
  retryCount: 3,
  maxRetries: 3,
  createdAt: new Date('2026-02-12T12:00:00Z'),
  updatedAt: new Date('2026-02-12T12:30:00Z'),
};

export const pushNotification: NotificationFixture = {
  id: 'notif_push_001',
  notificationNumber: 'NOTIF-2026-001014',
  userId: 'usr_019',
  userEmail: 'push@example.com',
  userName: 'Push User',
  type: NotificationType.ORDER_SHIPPED,
  channel: NotificationChannel.PUSH,
  priority: NotificationPriority.MEDIUM,
  status: NotificationStatus.DELIVERED,
  subject: 'Your Order Has Shipped',
  body: 'Your order is on its way! Track your delivery.',
  metadata: {
    orderId: 'ord_test_002',
    deepLink: 'lomashwood://orders/ord_test_002',
  },
  sentAt: new Date('2026-02-12T15:00:00Z'),
  deliveredAt: new Date('2026-02-12T15:00:05Z'),
  readAt: new Date('2026-02-12T15:30:00Z'),
  retryCount: 0,
  maxRetries: 3,
  createdAt: new Date('2026-02-12T15:00:00Z'),
  updatedAt: new Date('2026-02-12T15:30:00Z'),
};

export const inAppNotification: NotificationFixture = {
  id: 'notif_inapp_001',
  notificationNumber: 'NOTIF-2026-001015',
  userId: 'usr_020',
  userEmail: 'inapp@example.com',
  userName: 'InApp User',
  type: NotificationType.PROMOTIONAL,
  channel: NotificationChannel.IN_APP,
  priority: NotificationPriority.LOW,
  status: NotificationStatus.DELIVERED,
  subject: 'Spring Sale - 25% Off',
  body: 'Limited time offer! Get 25% off on selected kitchen ranges.',
  metadata: {
    campaignId: 'spring_sale_2026',
    promoCode: 'SPRING25',
    expiresAt: '2026-03-31',
  },
  sentAt: new Date('2026-02-12T08:00:00Z'),
  deliveredAt: new Date('2026-02-12T08:00:00Z'),
  retryCount: 0,
  maxRetries: 1,
  createdAt: new Date('2026-02-12T08:00:00Z'),
  updatedAt: new Date('2026-02-12T08:00:00Z'),
};

export const notificationFixtures: NotificationFixture[] = [
  bookingConfirmationEmail,
  bookingConfirmationSMS,
  appointmentReminderEmail,
  paymentSuccessEmail,
  paymentFailedEmail,
  orderConfirmationEmail,
  orderShippedEmail,
  refundProcessedEmail,
  brochureRequestEmail,
  newsletterEmail,
  adminNotificationBothServices,
  notificationPending,
  notificationFailed,
  pushNotification,
  inAppNotification,
];

export const getNotificationById = (id: string): NotificationFixture | undefined => {
  return notificationFixtures.find(notification => notification.id === id);
};

export const getNotificationsByStatus = (status: NotificationStatus): NotificationFixture[] => {
  return notificationFixtures.filter(notification => notification.status === status);
};

export const getNotificationsByUserId = (userId: string): NotificationFixture[] => {
  return notificationFixtures.filter(notification => notification.userId === userId);
};

export const getNotificationsByType = (type: NotificationType): NotificationFixture[] => {
  return notificationFixtures.filter(notification => notification.type === type);
};

export const getNotificationsByChannel = (channel: NotificationChannel): NotificationFixture[] => {
  return notificationFixtures.filter(notification => notification.channel === channel);
};

export const getNotificationsByPriority = (priority: NotificationPriority): NotificationFixture[] => {
  return notificationFixtures.filter(notification => notification.priority === priority);
};

export const getEmailNotifications = (): NotificationFixture[] => {
  return notificationFixtures.filter(notification => notification.channel === NotificationChannel.EMAIL);
};

export const getSMSNotifications = (): NotificationFixture[] => {
  return notificationFixtures.filter(notification => notification.channel === NotificationChannel.SMS);
};

export const getPushNotifications = (): NotificationFixture[] => {
  return notificationFixtures.filter(notification => notification.channel === NotificationChannel.PUSH);
};

export const getDeliveredNotifications = (): NotificationFixture[] => {
  return notificationFixtures.filter(notification => notification.status === NotificationStatus.DELIVERED);
};

export const getFailedNotifications = (): NotificationFixture[] => {
  return notificationFixtures.filter(notification => notification.status === NotificationStatus.FAILED);
};

export const getPendingNotifications = (): NotificationFixture[] => {
  return notificationFixtures.filter(notification => notification.status === NotificationStatus.PENDING);
};

export const getScheduledNotifications = (): NotificationFixture[] => {
  return notificationFixtures.filter(notification => notification.scheduledFor !== undefined);
};

export const getReadNotifications = (): NotificationFixture[] => {
  return notificationFixtures.filter(notification => notification.readAt !== undefined);
};

export const getUnreadNotifications = (): NotificationFixture[] => {
  return notificationFixtures.filter(
    notification => notification.status === NotificationStatus.DELIVERED && notification.readAt === undefined
  );
};

export const createNotificationFixture = (overrides: Partial<NotificationFixture> = {}): NotificationFixture => {
  const timestamp = new Date();
  const defaultNotification: NotificationFixture = {
    id: `notif_${Date.now()}`,
    notificationNumber: `NOTIF-2026-${Math.floor(Math.random() * 999999).toString().padStart(6, '0')}`,
    userId: 'usr_default',
    userEmail: 'customer@example.com',
    type: NotificationType.ORDER_CONFIRMATION,
    channel: NotificationChannel.EMAIL,
    priority: NotificationPriority.MEDIUM,
    status: NotificationStatus.PENDING,
    subject: 'Test Notification',
    body: 'This is a test notification.',
    recipientEmail: 'customer@example.com',
    retryCount: 0,
    maxRetries: 3,
    createdAt: timestamp,
    updatedAt: timestamp,
    ...overrides,
  };

  return defaultNotification;
};

export default {
  notificationFixtures,
  bookingConfirmationEmail,
  bookingConfirmationSMS,
  appointmentReminderEmail,
  paymentSuccessEmail,
  paymentFailedEmail,
  orderConfirmationEmail,
  orderShippedEmail,
  refundProcessedEmail,
  brochureRequestEmail,
  newsletterEmail,
  adminNotificationBothServices,
  notificationPending,
  notificationFailed,
  pushNotification,
  inAppNotification,
  getNotificationById,
  getNotificationsByStatus,
  getNotificationsByUserId,
  getNotificationsByType,
  getNotificationsByChannel,
  getNotificationsByPriority,
  getEmailNotifications,
  getSMSNotifications,
  getPushNotifications,
  getDeliveredNotifications,
  getFailedNotifications,
  getPendingNotifications,
  getScheduledNotifications,
  getReadNotifications,
  getUnreadNotifications,
  createNotificationFixture,
};