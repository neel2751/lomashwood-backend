import { PrismaClient } from '@prisma/client';


type NotificationChannel = 'EMAIL' | 'SMS' | 'PUSH' | 'IN_APP';
type ProviderType = 'SMTP' | 'AWS_SES' | 'TWILIO' | 'MSG91' | 'FIREBASE_FCM' | 'WEB_PUSH';
type ProviderStatus = 'ACTIVE' | 'INACTIVE' | 'DEGRADED';
type RetryPolicyStrategy = 'IMMEDIATE' | 'LINEAR_BACKOFF' | 'EXPONENTIAL_BACKOFF';
type TemplateCategory =
  | 'ACCOUNT_WELCOME'
  | 'ACCOUNT_PASSWORD_RESET'
  | 'APPOINTMENT_CONFIRMATION'
  | 'APPOINTMENT_INTERNAL_ALERT'
  | 'APPOINTMENT_REMINDER'
  | 'ORDER_CONFIRMATION'
  | 'PAYMENT_RECEIPT'
  | 'BROCHURE_REQUEST_CONFIRMATION'
  | 'BROCHURE_INTERNAL_ALERT'
  | 'BUSINESS_ENQUIRY_INTERNAL_ALERT'
  | 'NEWSLETTER_WELCOME'
  | 'CONTACT_ACKNOWLEDGEMENT'
  | 'LOYALTY_POINTS_EARNED';
type TemplateStatus = 'DRAFT' | 'ACTIVE' | 'ARCHIVED';
type TemplateType = 'EMAIL' | 'SMS' | 'PUSH' | 'IN_APP';





const prisma = new PrismaClient({
  log: [
    { emit: 'stdout', level: 'query' },
    { emit: 'stdout', level: 'info' },
    { emit: 'stdout', level: 'warn' },
    { emit: 'stdout', level: 'error' },
  ],
});

function log(section: string, message: string): void {
  console.log(`[SEED] [${section}] ${message}`);
}

function logCreated(entity: string, identifier: string): void {
  console.log(`  ✓  ${entity}: ${identifier}`);
}


async function seedRetryPolicies(): Promise<void> {
  log('RetryPolicies', 'Seeding retry policies...');

  const policies: Array<{
    name: string;
    channel: NotificationChannel;
    strategy: RetryPolicyStrategy;
    maxAttempts: number;
    initialDelayMs: number;
    maxDelayMs: number;
    multiplier: number;
    isDefault: boolean;
  }> = [
    {
      name: 'email-exponential-default',
      channel: 'EMAIL',
      strategy: 'EXPONENTIAL_BACKOFF',
      maxAttempts: 4,
      initialDelayMs: 5000,
      maxDelayMs: 300000,
      multiplier: 2.0,
      isDefault: true,
    },
    {
      name: 'email-critical-fast',
      channel: 'EMAIL',
      strategy: 'LINEAR_BACKOFF',
      maxAttempts: 6,
      initialDelayMs: 2000,
      maxDelayMs: 60000,
      multiplier: 1.5,
      isDefault: false,
    },
    {
      name: 'sms-exponential-default',
      channel: 'SMS',
      strategy: 'EXPONENTIAL_BACKOFF',
      maxAttempts: 3,
      initialDelayMs: 3000,
      maxDelayMs: 120000,
      multiplier: 2.0,
      isDefault: true,
    },
    {
      name: 'sms-immediate',
      channel: 'SMS',
      strategy: 'IMMEDIATE',
      maxAttempts: 2,
      initialDelayMs: 0,
      maxDelayMs: 0,
      multiplier: 1.0,
      isDefault: false,
    },
    {
      name: 'push-exponential-default',
      channel: 'PUSH',
      strategy: 'EXPONENTIAL_BACKOFF',
      maxAttempts: 3,
      initialDelayMs: 2000,
      maxDelayMs: 60000,
      multiplier: 2.0,
      isDefault: true,
    },
  ];

  for (const policy of policies) {
    
    
    
    await (prisma as any).retryPolicy.upsert({
      where: { name: policy.name },
      update: policy,
      create: policy,
    });
    logCreated('RetryPolicy', policy.name);
  }
}


async function seedProviders(): Promise<void> {
  log('Providers', 'Seeding notification providers...');

  const providers: Array<{
    name: string;
    type: ProviderType;
    channel: NotificationChannel;
    status: ProviderStatus;
    isDefault: boolean;
    priority: number;
    config: Record<string, unknown>;
    rateLimitPerSecond?: number;
    rateLimitPerMinute?: number;
    rateLimitPerHour?: number;
    rateLimitPerDay?: number;
  }> = [
    
    {
      name: 'nodemailer-smtp',
      type: 'SMTP',
      channel: 'EMAIL',
      status: 'ACTIVE',
      isDefault: true,
      priority: 1,
      config: {
        host: process.env['SMTP_HOST'] ?? 'smtp.mailtrap.io',
        port: Number(process.env['SMTP_PORT'] ?? 587),
        secure: process.env['SMTP_SECURE'] === 'true',
        auth: {
          user: process.env['SMTP_USER'] ?? 'dev_user',
          pass: '*** REDACTED ***',
        },
        pool: true,
        maxConnections: 5,
        maxMessages: 100,
      },
      rateLimitPerSecond: 10,
      rateLimitPerMinute: 300,
      rateLimitPerHour: 5000,
      rateLimitPerDay: 50000,
    },

    
    {
      name: 'aws-ses',
      type: 'AWS_SES',
      channel: 'EMAIL',
      status: 'INACTIVE',
      isDefault: false,
      priority: 2,
      config: {
        region: process.env['AWS_REGION'] ?? 'eu-west-2',
        configurationSet:
          process.env['AWS_SES_CONFIGURATION_SET'] ?? 'lomash-wood-transactional',
        fromAddress:
          process.env['EMAIL_FROM_ADDRESS'] ?? 'noreply@lomashwood.co.uk',
      },
      rateLimitPerSecond: 14,
      rateLimitPerMinute: 840,
      rateLimitPerHour: 50000,
      rateLimitPerDay: 1000000,
    },

    
    {
      name: 'twilio-sms',
      type: 'TWILIO',
      channel: 'SMS',
      status: 'ACTIVE',
      isDefault: true,
      priority: 1,
      config: {
        accountSid: process.env['TWILIO_ACCOUNT_SID'] ?? 'AC_PLACEHOLDER',
        messagingServiceSid:
          process.env['TWILIO_MESSAGING_SERVICE_SID'] ?? 'MG_PLACEHOLDER',
        from: process.env['SMS_FROM'] ?? '+441234567890',
      },
      rateLimitPerSecond: 1,
      rateLimitPerMinute: 60,
      rateLimitPerHour: 3600,
      rateLimitPerDay: 86400,
    },

    
    {
      name: 'msg91-sms',
      type: 'MSG91',
      channel: 'SMS',
      status: 'INACTIVE',
      isDefault: false,
      priority: 2,
      config: {
        senderId: process.env['MSG91_SENDER_ID'] ?? 'LOMASH',
        route: process.env['MSG91_ROUTE'] ?? '4',
        country: process.env['MSG91_COUNTRY'] ?? '44',
      },
      rateLimitPerSecond: 5,
      rateLimitPerMinute: 300,
      rateLimitPerHour: 18000,
      rateLimitPerDay: 100000,
    },

    
    {
      name: 'firebase-fcm',
      type: 'FIREBASE_FCM',
      channel: 'PUSH',
      status: 'ACTIVE',
      isDefault: true,
      priority: 1,
      config: {
        projectId: process.env['FIREBASE_PROJECT_ID'] ?? 'lomash-wood',
        clientEmail:
          process.env['FIREBASE_CLIENT_EMAIL'] ??
          'firebase@lomash-wood.iam.gserviceaccount.com',
      },
      rateLimitPerSecond: 500,
      rateLimitPerMinute: 20000,
    },

    
    {
      name: 'web-push-vapid',
      type: 'WEB_PUSH',
      channel: 'PUSH',
      status: 'ACTIVE',
      isDefault: false,
      priority: 2,
      config: {
        subject:
          process.env['WEBPUSH_SUBJECT'] ?? 'mailto:hello@lomashwood.co.uk',
        publicKey:
          process.env['WEBPUSH_PUBLIC_KEY'] ?? 'VAPID_PUBLIC_KEY_PLACEHOLDER',
      },
      rateLimitPerSecond: 100,
      rateLimitPerMinute: 6000,
    },
  ];

  for (const provider of providers) {
    
    
    
    await (prisma as any).notificationProvider.upsert({
      where: { name: provider.name },
      update: {
        type: provider.type,
        channel: provider.channel,
        status: provider.status,
        isDefault: provider.isDefault,
        priority: provider.priority,
        config: provider.config,
        rateLimitPerSecond: provider.rateLimitPerSecond ?? null,
        rateLimitPerMinute: provider.rateLimitPerMinute ?? null,
        rateLimitPerHour: provider.rateLimitPerHour ?? null,
        rateLimitPerDay: provider.rateLimitPerDay ?? null,
      },
      create: {
        name: provider.name,
        type: provider.type,
        channel: provider.channel,
        status: provider.status,
        isDefault: provider.isDefault,
        priority: provider.priority,
        config: provider.config,
        rateLimitPerSecond: provider.rateLimitPerSecond ?? null,
        rateLimitPerMinute: provider.rateLimitPerMinute ?? null,
        rateLimitPerHour: provider.rateLimitPerHour ?? null,
        rateLimitPerDay: provider.rateLimitPerDay ?? null,
      },
    });
    logCreated('Provider', provider.name);
  }
}


interface TemplateData {
  name: string;
  slug: string;
  description: string;
  category: TemplateCategory;
  type: TemplateType;
  status: TemplateStatus;
  subject?: string;
  preheader?: string;
  htmlBody?: string;
  textBody?: string;
  smsBody?: string;
  pushTitle?: string;
  pushBody?: string;
  /** Optional icon path / URL used for push notifications. */
  pushIcon?: string;
  variables?: Record<string, unknown>[];
  engine: string;
  version: number;
}


const EMAIL_TEMPLATES: TemplateData[] = [
  
  {
    name: 'Account Welcome Email',
    slug: 'account-welcome-email',
    description: 'Sent to new customers upon registration.',
    category: 'ACCOUNT_WELCOME',
    type: 'EMAIL',
    status: 'ACTIVE',
    subject: 'Welcome to Lomash Wood, {{customerName}}!',
    preheader: 'Your kitchen & bedroom journey starts here.',
    htmlBody: `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><title>Welcome to Lomash Wood</title></head>
<body style="font-family:Arial,sans-serif;background:#f9f6f2;margin:0;padding:0;">
  <table width="600" align="center" cellpadding="0" cellspacing="0" style="background:#ffffff;margin:40px auto;border-radius:8px;overflow:hidden;">
    <tr><td style="background:#2c1810;padding:32px 40px;text-align:center;">
      <h1 style="color:#f5e6d3;margin:0;font-size:28px;">Lomash Wood</h1>
      <p style="color:#c9a882;margin:8px 0 0;font-size:14px;">Kitchen &amp; Bedroom Design</p>
    </td></tr>
    <tr><td style="padding:40px;">
      <h2 style="color:#2c1810;margin:0 0 16px;">Welcome, {{customerName}}!</h2>
      <p style="color:#555;line-height:1.7;">Thank you for joining Lomash Wood. We craft beautiful kitchens and bedrooms tailored to your lifestyle.</p>
      <p style="color:#555;line-height:1.7;">Explore our collections, book a free consultation, or request a brochure to get started.</p>
      <div style="text-align:center;margin:32px 0;">
        <a href="{{baseUrl}}/products" style="background:#2c1810;color:#fff;padding:14px 32px;border-radius:4px;text-decoration:none;font-weight:bold;">Explore Collections</a>
      </div>
      <p style="color:#888;font-size:13px;">If you did not create this account, please contact us at <a href="mailto:hello@lomashwood.co.uk">hello@lomashwood.co.uk</a>.</p>
    </td></tr>
    <tr><td style="background:#f5e6d3;padding:20px 40px;text-align:center;">
      <p style="color:#888;font-size:12px;margin:0;">© {{currentYear}} Lomash Wood Ltd. All rights reserved.</p>
      <p style="color:#888;font-size:12px;margin:4px 0 0;"><a href="{{unsubscribeUrl}}" style="color:#888;">Unsubscribe</a> | <a href="{{privacyUrl}}" style="color:#888;">Privacy Policy</a></p>
    </td></tr>
  </table>
</body>
</html>`,
    textBody: `Welcome to Lomash Wood, {{customerName}}!

Thank you for joining us. We craft beautiful kitchens and bedrooms tailored to your lifestyle.

Explore our collections: {{baseUrl}}/products
Book a consultation: {{baseUrl}}/book-appointment

Questions? Contact us at hello@lomashwood.co.uk

© {{currentYear}} Lomash Wood Ltd.
Unsubscribe: {{unsubscribeUrl}}`,
    variables: [
      { key: 'customerName', required: true, type: 'string' },
      { key: 'baseUrl', required: true, type: 'string' },
      { key: 'unsubscribeUrl', required: true, type: 'string' },
      { key: 'privacyUrl', required: true, type: 'string' },
      { key: 'currentYear', required: true, type: 'number' },
    ],
    engine: 'handlebars',
    version: 1,
  },

  
  {
    name: 'Password Reset Email',
    slug: 'account-password-reset-email',
    description: 'Sent when a user requests a password reset.',
    category: 'ACCOUNT_PASSWORD_RESET',
    type: 'EMAIL',
    status: 'ACTIVE',
    subject: 'Reset your Lomash Wood password',
    preheader: 'Your reset link is valid for 30 minutes.',
    htmlBody: `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><title>Reset Password</title></head>
<body style="font-family:Arial,sans-serif;background:#f9f6f2;margin:0;padding:0;">
  <table width="600" align="center" cellpadding="0" cellspacing="0" style="background:#ffffff;margin:40px auto;border-radius:8px;overflow:hidden;">
    <tr><td style="background:#2c1810;padding:32px 40px;text-align:center;">
      <h1 style="color:#f5e6d3;margin:0;font-size:28px;">Lomash Wood</h1>
    </td></tr>
    <tr><td style="padding:40px;">
      <h2 style="color:#2c1810;">Reset Your Password</h2>
      <p style="color:#555;line-height:1.7;">Hi {{customerName}}, we received a request to reset your password. Click the button below. This link expires in <strong>30 minutes</strong>.</p>
      <div style="text-align:center;margin:32px 0;">
        <a href="{{resetUrl}}" style="background:#2c1810;color:#fff;padding:14px 32px;border-radius:4px;text-decoration:none;font-weight:bold;">Reset Password</a>
      </div>
      <p style="color:#888;font-size:13px;">If you did not request this, you can safely ignore this email. Your password will not change.</p>
    </td></tr>
    <tr><td style="background:#f5e6d3;padding:20px 40px;text-align:center;">
      <p style="color:#888;font-size:12px;margin:0;">© {{currentYear}} Lomash Wood Ltd.</p>
    </td></tr>
  </table>
</body>
</html>`,
    textBody: `Reset your Lomash Wood password

Hi {{customerName}},

Click the link below to reset your password (valid for 30 minutes):
{{resetUrl}}

If you did not request this, ignore this email.

© {{currentYear}} Lomash Wood Ltd.`,
    variables: [
      { key: 'customerName', required: true, type: 'string' },
      { key: 'resetUrl', required: true, type: 'string' },
      { key: 'currentYear', required: true, type: 'number' },
    ],
    engine: 'handlebars',
    version: 1,
  },

  
  {
    name: 'Appointment Confirmation Email',
    slug: 'appointment-confirmation-email',
    description: 'Sent to customer upon successful appointment booking. (SRS FR5.5)',
    category: 'APPOINTMENT_CONFIRMATION',
    type: 'EMAIL',
    status: 'ACTIVE',
    subject: 'Your Lomash Wood appointment is confirmed – {{appointmentDate}}',
    preheader: 'We look forward to seeing you!',
    htmlBody: `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><title>Appointment Confirmed</title></head>
<body style="font-family:Arial,sans-serif;background:#f9f6f2;margin:0;padding:0;">
  <table width="600" align="center" cellpadding="0" cellspacing="0" style="background:#ffffff;margin:40px auto;border-radius:8px;overflow:hidden;">
    <tr><td style="background:#2c1810;padding:32px 40px;text-align:center;">
      <h1 style="color:#f5e6d3;margin:0;font-size:28px;">Lomash Wood</h1>
      <p style="color:#c9a882;margin:8px 0 0;">Appointment Confirmed</p>
    </td></tr>
    <tr><td style="padding:40px;">
      <h2 style="color:#2c1810;">Hi {{customerName}}, your appointment is confirmed!</h2>
      <table width="100%" cellpadding="12" cellspacing="0" style="background:#f9f6f2;border-radius:6px;margin:24px 0;">
        <tr><td style="color:#888;font-size:13px;width:40%;">Appointment Type</td><td style="color:#2c1810;font-weight:bold;">{{appointmentType}}</td></tr>
        <tr><td style="color:#888;font-size:13px;">Date &amp; Time</td><td style="color:#2c1810;font-weight:bold;">{{appointmentDate}} at {{appointmentTime}}</td></tr>
        {{#if showroomName}}<tr><td style="color:#888;font-size:13px;">Showroom</td><td style="color:#2c1810;font-weight:bold;">{{showroomName}}</td></tr>{{/if}}
        {{#if showroomAddress}}<tr><td style="color:#888;font-size:13px;">Address</td><td style="color:#2c1810;">{{showroomAddress}}</td></tr>{{/if}}
        <tr><td style="color:#888;font-size:13px;">For</td><td style="color:#2c1810;font-weight:bold;">{{appointmentScope}}</td></tr>
        <tr><td style="color:#888;font-size:13px;">Reference</td><td style="color:#2c1810;font-family:monospace;">{{appointmentRef}}</td></tr>
      </table>
      <p style="color:#555;line-height:1.7;">If you need to reschedule or cancel, please contact us at least 24 hours in advance.</p>
      <div style="text-align:center;margin:32px 0;">
        <a href="{{manageUrl}}" style="background:#2c1810;color:#fff;padding:14px 32px;border-radius:4px;text-decoration:none;font-weight:bold;">Manage Appointment</a>
      </div>
    </td></tr>
    <tr><td style="background:#f5e6d3;padding:20px 40px;text-align:center;">
      <p style="color:#888;font-size:12px;margin:0;">© {{currentYear}} Lomash Wood Ltd. | <a href="{{privacyUrl}}" style="color:#888;">Privacy Policy</a></p>
    </td></tr>
  </table>
</body>
</html>`,
    textBody: `Your Lomash Wood appointment is confirmed!

Hi {{customerName}},

Appointment Type: {{appointmentType}}
Date & Time:      {{appointmentDate}} at {{appointmentTime}}
{{#if showroomName}}Showroom:         {{showroomName}}{{/if}}
{{#if showroomAddress}}Address:          {{showroomAddress}}{{/if}}
For:              {{appointmentScope}}
Reference:        {{appointmentRef}}

To manage your appointment: {{manageUrl}}

© {{currentYear}} Lomash Wood Ltd.`,
    variables: [
      { key: 'customerName', required: true, type: 'string' },
      { key: 'appointmentType', required: true, type: 'string' },
      { key: 'appointmentDate', required: true, type: 'string' },
      { key: 'appointmentTime', required: true, type: 'string' },
      { key: 'appointmentRef', required: true, type: 'string' },
      { key: 'appointmentScope', required: true, type: 'string' },
      { key: 'showroomName', required: false, type: 'string' },
      { key: 'showroomAddress', required: false, type: 'string' },
      { key: 'manageUrl', required: true, type: 'string' },
      { key: 'privacyUrl', required: true, type: 'string' },
      { key: 'currentYear', required: true, type: 'number' },
    ],
    engine: 'handlebars',
    version: 1,
  },

  
  {
    name: 'Appointment Internal Alert Email',
    slug: 'appointment-internal-alert-email',
    description:
      'Sent to internal kitchen/bedroom teams when a dual appointment is booked. (SRS FR5.6)',
    category: 'APPOINTMENT_INTERNAL_ALERT',
    type: 'EMAIL',
    status: 'ACTIVE',
    subject:
      '[INTERNAL] New {{appointmentScope}} Appointment – {{appointmentDate}} – Ref: {{appointmentRef}}',
    preheader: 'Action required: new appointment booked.',
    htmlBody: `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><title>New Appointment – Internal</title></head>
<body style="font-family:Arial,sans-serif;background:#f0f0f0;margin:0;padding:0;">
  <table width="600" align="center" cellpadding="0" cellspacing="0" style="background:#ffffff;margin:40px auto;border-radius:8px;overflow:hidden;">
    <tr><td style="background:#1a3a2a;padding:24px 40px;">
      <h1 style="color:#fff;margin:0;font-size:20px;">🔔 New Appointment – Internal Notification</h1>
    </td></tr>
    <tr><td style="padding:32px 40px;">
      <table width="100%" cellpadding="10" cellspacing="0" style="background:#f9f9f9;border-radius:6px;">
        <tr><td style="color:#666;width:40%;">Customer Name</td><td style="color:#111;font-weight:bold;">{{customerName}}</td></tr>
        <tr><td style="color:#666;">Email</td><td style="color:#111;">{{customerEmail}}</td></tr>
        <tr><td style="color:#666;">Phone</td><td style="color:#111;">{{customerPhone}}</td></tr>
        <tr><td style="color:#666;">Postcode</td><td style="color:#111;">{{customerPostcode}}</td></tr>
        <tr><td style="color:#666;">Appointment Type</td><td style="color:#111;font-weight:bold;">{{appointmentType}}</td></tr>
        <tr><td style="color:#666;">Scope</td><td style="color:#111;font-weight:bold;">{{appointmentScope}}</td></tr>
        <tr><td style="color:#666;">Date &amp; Time</td><td style="color:#111;font-weight:bold;">{{appointmentDate}} at {{appointmentTime}}</td></tr>
        <tr><td style="color:#666;">Reference</td><td style="color:#111;font-family:monospace;">{{appointmentRef}}</td></tr>
      </table>
      <div style="text-align:center;margin:28px 0;">
        <a href="{{adminUrl}}" style="background:#1a3a2a;color:#fff;padding:12px 28px;border-radius:4px;text-decoration:none;font-weight:bold;">View in Admin Dashboard</a>
      </div>
    </td></tr>
    <tr><td style="background:#e8e8e8;padding:16px 40px;text-align:center;">
      <p style="color:#999;font-size:12px;margin:0;">Lomash Wood Internal System – Do not reply to this email.</p>
    </td></tr>
  </table>
</body>
</html>`,
    textBody: `[INTERNAL] New Appointment Alert

Customer:     {{customerName}}
Email:        {{customerEmail}}
Phone:        {{customerPhone}}
Postcode:     {{customerPostcode}}
Type:         {{appointmentType}}
Scope:        {{appointmentScope}}
Date & Time:  {{appointmentDate}} at {{appointmentTime}}
Reference:    {{appointmentRef}}

Admin dashboard: {{adminUrl}}

Lomash Wood Internal System.`,
    variables: [
      { key: 'customerName', required: true, type: 'string' },
      { key: 'customerEmail', required: true, type: 'string' },
      { key: 'customerPhone', required: true, type: 'string' },
      { key: 'customerPostcode', required: true, type: 'string' },
      { key: 'appointmentType', required: true, type: 'string' },
      { key: 'appointmentScope', required: true, type: 'string' },
      { key: 'appointmentDate', required: true, type: 'string' },
      { key: 'appointmentTime', required: true, type: 'string' },
      { key: 'appointmentRef', required: true, type: 'string' },
      { key: 'adminUrl', required: true, type: 'string' },
    ],
    engine: 'handlebars',
    version: 1,
  },

  
  {
    name: 'Appointment Reminder Email',
    slug: 'appointment-reminder-email',
    description: 'Reminder sent 24 hours before the appointment.',
    category: 'APPOINTMENT_REMINDER',
    type: 'EMAIL',
    status: 'ACTIVE',
    subject: 'Reminder: Your Lomash Wood appointment is tomorrow at {{appointmentTime}}',
    preheader: 'Just a friendly reminder.',
    htmlBody: `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><title>Appointment Reminder</title></head>
<body style="font-family:Arial,sans-serif;background:#f9f6f2;margin:0;padding:0;">
  <table width="600" align="center" cellpadding="0" cellspacing="0" style="background:#ffffff;margin:40px auto;border-radius:8px;overflow:hidden;">
    <tr><td style="background:#2c1810;padding:32px 40px;text-align:center;">
      <h1 style="color:#f5e6d3;margin:0;font-size:28px;">Lomash Wood</h1>
    </td></tr>
    <tr><td style="padding:40px;">
      <h2 style="color:#2c1810;">Your appointment is tomorrow!</h2>
      <p style="color:#555;">Hi {{customerName}}, this is a reminder for your upcoming appointment.</p>
      <table width="100%" cellpadding="10" cellspacing="0" style="background:#f9f6f2;border-radius:6px;margin:20px 0;">
        <tr><td style="color:#888;width:40%;">Type</td><td style="color:#2c1810;font-weight:bold;">{{appointmentType}}</td></tr>
        <tr><td style="color:#888;">Date &amp; Time</td><td style="color:#2c1810;font-weight:bold;">{{appointmentDate}} at {{appointmentTime}}</td></tr>
        {{#if showroomName}}<tr><td style="color:#888;">Showroom</td><td style="color:#2c1810;font-weight:bold;">{{showroomName}}</td></tr>{{/if}}
        <tr><td style="color:#888;">Reference</td><td style="color:#2c1810;font-family:monospace;">{{appointmentRef}}</td></tr>
      </table>
      <div style="text-align:center;margin:28px 0;">
        <a href="{{manageUrl}}" style="background:#2c1810;color:#fff;padding:14px 32px;border-radius:4px;text-decoration:none;">Manage Appointment</a>
      </div>
    </td></tr>
    <tr><td style="background:#f5e6d3;padding:20px 40px;text-align:center;">
      <p style="color:#888;font-size:12px;margin:0;">© {{currentYear}} Lomash Wood Ltd.</p>
    </td></tr>
  </table>
</body>
</html>`,
    textBody: `Appointment Reminder

Hi {{customerName}},

Your Lomash Wood appointment is tomorrow!

Type:      {{appointmentType}}
Date/Time: {{appointmentDate}} at {{appointmentTime}}
{{#if showroomName}}Showroom:  {{showroomName}}{{/if}}
Reference: {{appointmentRef}}

Manage: {{manageUrl}}

© {{currentYear}} Lomash Wood Ltd.`,
    variables: [
      { key: 'customerName', required: true, type: 'string' },
      { key: 'appointmentType', required: true, type: 'string' },
      { key: 'appointmentDate', required: true, type: 'string' },
      { key: 'appointmentTime', required: true, type: 'string' },
      { key: 'appointmentRef', required: true, type: 'string' },
      { key: 'showroomName', required: false, type: 'string' },
      { key: 'manageUrl', required: true, type: 'string' },
      { key: 'currentYear', required: true, type: 'number' },
    ],
    engine: 'handlebars',
    version: 1,
  },

  
  {
    name: 'Order Confirmation Email',
    slug: 'order-confirmation-email',
    description: 'Sent to customer after a successful order is placed.',
    category: 'ORDER_CONFIRMATION',
    type: 'EMAIL',
    status: 'ACTIVE',
    subject: 'Order confirmed – {{orderRef}} | Lomash Wood',
    preheader: 'Thank you for your order.',
    htmlBody: `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><title>Order Confirmed</title></head>
<body style="font-family:Arial,sans-serif;background:#f9f6f2;margin:0;padding:0;">
  <table width="600" align="center" cellpadding="0" cellspacing="0" style="background:#ffffff;margin:40px auto;border-radius:8px;overflow:hidden;">
    <tr><td style="background:#2c1810;padding:32px 40px;text-align:center;">
      <h1 style="color:#f5e6d3;margin:0;font-size:28px;">Lomash Wood</h1>
    </td></tr>
    <tr><td style="padding:40px;">
      <h2 style="color:#2c1810;">Order Confirmed, {{customerName}}!</h2>
      <p style="color:#555;line-height:1.7;">Thank you for your order. We will be in touch with an update shortly.</p>
      <table width="100%" cellpadding="10" cellspacing="0" style="background:#f9f6f2;border-radius:6px;margin:20px 0;">
        <tr><td style="color:#888;width:40%;">Order Reference</td><td style="color:#2c1810;font-weight:bold;font-family:monospace;">{{orderRef}}</td></tr>
        <tr><td style="color:#888;">Order Date</td><td style="color:#2c1810;">{{orderDate}}</td></tr>
        <tr><td style="color:#888;">Total Amount</td><td style="color:#2c1810;font-weight:bold;">£{{totalAmount}}</td></tr>
        <tr><td style="color:#888;">Payment Status</td><td style="color:#2c1810;">{{paymentStatus}}</td></tr>
      </table>
      <div style="text-align:center;margin:28px 0;">
        <a href="{{orderUrl}}" style="background:#2c1810;color:#fff;padding:14px 32px;border-radius:4px;text-decoration:none;">View Order</a>
      </div>
    </td></tr>
    <tr><td style="background:#f5e6d3;padding:20px 40px;text-align:center;">
      <p style="color:#888;font-size:12px;margin:0;">© {{currentYear}} Lomash Wood Ltd. | <a href="{{privacyUrl}}" style="color:#888;">Privacy Policy</a></p>
    </td></tr>
  </table>
</body>
</html>`,
    textBody: `Order Confirmed – {{orderRef}}

Hi {{customerName}},

Thank you for your order!

Order Reference: {{orderRef}}
Order Date:      {{orderDate}}
Total Amount:    £{{totalAmount}}
Payment Status:  {{paymentStatus}}

View your order: {{orderUrl}}

© {{currentYear}} Lomash Wood Ltd.`,
    variables: [
      { key: 'customerName', required: true, type: 'string' },
      { key: 'orderRef', required: true, type: 'string' },
      { key: 'orderDate', required: true, type: 'string' },
      { key: 'totalAmount', required: true, type: 'string' },
      { key: 'paymentStatus', required: true, type: 'string' },
      { key: 'orderUrl', required: true, type: 'string' },
      { key: 'privacyUrl', required: true, type: 'string' },
      { key: 'currentYear', required: true, type: 'number' },
    ],
    engine: 'handlebars',
    version: 1,
  },

  
  {
    name: 'Payment Receipt Email',
    slug: 'payment-receipt-email',
    description: 'Sent to customer after a successful payment.',
    category: 'PAYMENT_RECEIPT',
    type: 'EMAIL',
    status: 'ACTIVE',
    subject: 'Payment received – £{{amount}} | Lomash Wood',
    preheader: 'Your payment has been processed.',
    htmlBody: `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><title>Payment Receipt</title></head>
<body style="font-family:Arial,sans-serif;background:#f9f6f2;margin:0;padding:0;">
  <table width="600" align="center" cellpadding="0" cellspacing="0" style="background:#ffffff;margin:40px auto;border-radius:8px;overflow:hidden;">
    <tr><td style="background:#2c1810;padding:32px 40px;text-align:center;">
      <h1 style="color:#f5e6d3;margin:0;font-size:28px;">Lomash Wood</h1>
    </td></tr>
    <tr><td style="padding:40px;">
      <h2 style="color:#2c1810;">Payment Receipt</h2>
      <p style="color:#555;">Hi {{customerName}}, we have received your payment.</p>
      <table width="100%" cellpadding="10" cellspacing="0" style="background:#f9f6f2;border-radius:6px;margin:20px 0;">
        <tr><td style="color:#888;width:40%;">Transaction ID</td><td style="color:#2c1810;font-family:monospace;">{{transactionId}}</td></tr>
        <tr><td style="color:#888;">Amount Paid</td><td style="color:#2c1810;font-weight:bold;">£{{amount}}</td></tr>
        <tr><td style="color:#888;">Payment Date</td><td style="color:#2c1810;">{{paymentDate}}</td></tr>
        <tr><td style="color:#888;">Payment Method</td><td style="color:#2c1810;">{{paymentMethod}}</td></tr>
        <tr><td style="color:#888;">Order Reference</td><td style="color:#2c1810;font-family:monospace;">{{orderRef}}</td></tr>
      </table>
    </td></tr>
    <tr><td style="background:#f5e6d3;padding:20px 40px;text-align:center;">
      <p style="color:#888;font-size:12px;margin:0;">© {{currentYear}} Lomash Wood Ltd.</p>
    </td></tr>
  </table>
</body>
</html>`,
    textBody: `Payment Receipt

Hi {{customerName}},

Transaction ID:  {{transactionId}}
Amount Paid:     £{{amount}}
Payment Date:    {{paymentDate}}
Payment Method:  {{paymentMethod}}
Order Reference: {{orderRef}}

© {{currentYear}} Lomash Wood Ltd.`,
    variables: [
      { key: 'customerName', required: true, type: 'string' },
      { key: 'transactionId', required: true, type: 'string' },
      { key: 'amount', required: true, type: 'string' },
      { key: 'paymentDate', required: true, type: 'string' },
      { key: 'paymentMethod', required: true, type: 'string' },
      { key: 'orderRef', required: true, type: 'string' },
      { key: 'currentYear', required: true, type: 'number' },
    ],
    engine: 'handlebars',
    version: 1,
  },

  
  {
    name: 'Brochure Request Confirmation Email',
    slug: 'brochure-request-confirmation-email',
    description: 'Sent to the customer confirming their brochure request. (SRS FR8.1 / FR8.2)',
    category: 'BROCHURE_REQUEST_CONFIRMATION',
    type: 'EMAIL',
    status: 'ACTIVE',
    subject: 'Your Lomash Wood brochure is on its way, {{customerName}}!',
    preheader: 'Beautiful kitchens & bedrooms delivered to your door.',
    htmlBody: `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><title>Brochure Request</title></head>
<body style="font-family:Arial,sans-serif;background:#f9f6f2;margin:0;padding:0;">
  <table width="600" align="center" cellpadding="0" cellspacing="0" style="background:#ffffff;margin:40px auto;border-radius:8px;overflow:hidden;">
    <tr><td style="background:#2c1810;padding:32px 40px;text-align:center;">
      <h1 style="color:#f5e6d3;margin:0;font-size:28px;">Lomash Wood</h1>
    </td></tr>
    <tr><td style="padding:40px;">
      <h2 style="color:#2c1810;">Brochure on its way, {{customerName}}!</h2>
      <p style="color:#555;line-height:1.7;">Thank you for requesting our brochure. It will be dispatched to your address within 3–5 working days.</p>
      <table width="100%" cellpadding="10" cellspacing="0" style="background:#f9f6f2;border-radius:6px;margin:20px 0;">
        <tr><td style="color:#888;width:40%;">Delivery Address</td><td style="color:#2c1810;">{{address}}, {{postcode}}</td></tr>
      </table>
      <p style="color:#555;">In the meantime, <a href="{{catalogueUrl}}" style="color:#2c1810;">browse our online catalogue</a> or <a href="{{appointmentUrl}}" style="color:#2c1810;">book a free consultation</a>.</p>
    </td></tr>
    <tr><td style="background:#f5e6d3;padding:20px 40px;text-align:center;">
      <p style="color:#888;font-size:12px;margin:0;">© {{currentYear}} Lomash Wood Ltd. | <a href="{{unsubscribeUrl}}" style="color:#888;">Unsubscribe</a></p>
    </td></tr>
  </table>
</body>
</html>`,
    textBody: `Your Lomash Wood brochure is on its way!

Hi {{customerName}},

Your brochure will be dispatched to: {{address}}, {{postcode}}
Expected arrival: 3–5 working days.

Browse online: {{catalogueUrl}}
Book a consultation: {{appointmentUrl}}

© {{currentYear}} Lomash Wood Ltd.
Unsubscribe: {{unsubscribeUrl}}`,
    variables: [
      { key: 'customerName', required: true, type: 'string' },
      { key: 'address', required: true, type: 'string' },
      { key: 'postcode', required: true, type: 'string' },
      { key: 'catalogueUrl', required: true, type: 'string' },
      { key: 'appointmentUrl', required: true, type: 'string' },
      { key: 'unsubscribeUrl', required: true, type: 'string' },
      { key: 'currentYear', required: true, type: 'number' },
    ],
    engine: 'handlebars',
    version: 1,
  },

  
  {
    name: 'Brochure Internal Alert Email',
    slug: 'brochure-internal-alert-email',
    description:
      'Internal notification to admin when a new brochure request is submitted. (SRS FR8.2)',
    category: 'BROCHURE_INTERNAL_ALERT',
    type: 'EMAIL',
    status: 'ACTIVE',
    subject: '[INTERNAL] New Brochure Request – {{customerName}} – {{postcode}}',
    preheader: 'A new brochure request requires fulfilment.',
    htmlBody: `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><title>New Brochure Request</title></head>
<body style="font-family:Arial,sans-serif;background:#f0f0f0;margin:0;padding:0;">
  <table width="600" align="center" cellpadding="0" cellspacing="0" style="background:#ffffff;margin:40px auto;border-radius:8px;overflow:hidden;">
    <tr><td style="background:#1a3a2a;padding:24px 40px;">
      <h1 style="color:#fff;margin:0;font-size:20px;">📦 New Brochure Request</h1>
    </td></tr>
    <tr><td style="padding:32px 40px;">
      <table width="100%" cellpadding="10" cellspacing="0" style="background:#f9f9f9;border-radius:6px;">
        <tr><td style="color:#666;width:35%;">Name</td><td style="color:#111;font-weight:bold;">{{customerName}}</td></tr>
        <tr><td style="color:#666;">Email</td><td style="color:#111;">{{customerEmail}}</td></tr>
        <tr><td style="color:#666;">Phone</td><td style="color:#111;">{{customerPhone}}</td></tr>
        <tr><td style="color:#666;">Address</td><td style="color:#111;">{{address}}</td></tr>
        <tr><td style="color:#666;">Postcode</td><td style="color:#111;font-weight:bold;">{{postcode}}</td></tr>
        <tr><td style="color:#666;">Submitted At</td><td style="color:#111;">{{submittedAt}}</td></tr>
      </table>
      <div style="text-align:center;margin:24px 0;">
        <a href="{{adminUrl}}" style="background:#1a3a2a;color:#fff;padding:12px 28px;border-radius:4px;text-decoration:none;font-weight:bold;">View in Admin</a>
      </div>
    </td></tr>
    <tr><td style="background:#e8e8e8;padding:16px;text-align:center;">
      <p style="color:#999;font-size:12px;margin:0;">Lomash Wood Internal – Do not reply.</p>
    </td></tr>
  </table>
</body>
</html>`,
    textBody: `[INTERNAL] New Brochure Request

Name:         {{customerName}}
Email:        {{customerEmail}}
Phone:        {{customerPhone}}
Address:      {{address}}
Postcode:     {{postcode}}
Submitted At: {{submittedAt}}

Admin: {{adminUrl}}`,
    variables: [
      { key: 'customerName', required: true, type: 'string' },
      { key: 'customerEmail', required: true, type: 'string' },
      { key: 'customerPhone', required: true, type: 'string' },
      { key: 'address', required: true, type: 'string' },
      { key: 'postcode', required: true, type: 'string' },
      { key: 'submittedAt', required: true, type: 'string' },
      { key: 'adminUrl', required: true, type: 'string' },
    ],
    engine: 'handlebars',
    version: 1,
  },

  
  {
    name: 'Business Enquiry Internal Alert Email',
    slug: 'business-enquiry-internal-alert-email',
    description:
      'Internal mail notification upon Business With Us submission. (SRS FR8.4)',
    category: 'BUSINESS_ENQUIRY_INTERNAL_ALERT',
    type: 'EMAIL',
    status: 'ACTIVE',
    subject: '[INTERNAL] New Business Enquiry – {{businessName}} – {{businessType}}',
    preheader: 'A new business enquiry has been submitted.',
    htmlBody: `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><title>Business Enquiry</title></head>
<body style="font-family:Arial,sans-serif;background:#f0f0f0;margin:0;padding:0;">
  <table width="600" align="center" cellpadding="0" cellspacing="0" style="background:#ffffff;margin:40px auto;border-radius:8px;overflow:hidden;">
    <tr><td style="background:#1a3a2a;padding:24px 40px;">
      <h1 style="color:#fff;margin:0;font-size:20px;">🤝 New Business Enquiry</h1>
    </td></tr>
    <tr><td style="padding:32px 40px;">
      <table width="100%" cellpadding="10" cellspacing="0" style="background:#f9f9f9;border-radius:6px;">
        <tr><td style="color:#666;width:35%;">Name</td><td style="color:#111;font-weight:bold;">{{contactName}}</td></tr>
        <tr><td style="color:#666;">Email</td><td style="color:#111;">{{contactEmail}}</td></tr>
        <tr><td style="color:#666;">Phone</td><td style="color:#111;">{{contactPhone}}</td></tr>
        <tr><td style="color:#666;">Business Name</td><td style="color:#111;font-weight:bold;">{{businessName}}</td></tr>
        <tr><td style="color:#666;">Business Type</td><td style="color:#111;font-weight:bold;">{{businessType}}</td></tr>
        <tr><td style="color:#666;">Submitted At</td><td style="color:#111;">{{submittedAt}}</td></tr>
      </table>
      <div style="text-align:center;margin:24px 0;">
        <a href="{{adminUrl}}" style="background:#1a3a2a;color:#fff;padding:12px 28px;border-radius:4px;text-decoration:none;font-weight:bold;">View in Admin</a>
      </div>
    </td></tr>
    <tr><td style="background:#e8e8e8;padding:16px;text-align:center;">
      <p style="color:#999;font-size:12px;margin:0;">Lomash Wood Internal – Do not reply.</p>
    </td></tr>
  </table>
</body>
</html>`,
    textBody: `[INTERNAL] New Business Enquiry

Name:          {{contactName}}
Email:         {{contactEmail}}
Phone:         {{contactPhone}}
Business Name: {{businessName}}
Business Type: {{businessType}}
Submitted At:  {{submittedAt}}

Admin: {{adminUrl}}`,
    variables: [
      { key: 'contactName', required: true, type: 'string' },
      { key: 'contactEmail', required: true, type: 'string' },
      { key: 'contactPhone', required: true, type: 'string' },
      { key: 'businessName', required: true, type: 'string' },
      { key: 'businessType', required: true, type: 'string' },
      { key: 'submittedAt', required: true, type: 'string' },
      { key: 'adminUrl', required: true, type: 'string' },
    ],
    engine: 'handlebars',
    version: 1,
  },

  
  {
    name: 'Newsletter Welcome Email',
    slug: 'newsletter-welcome-email',
    description: 'Sent upon newsletter subscription. (SRS FR9.6)',
    category: 'NEWSLETTER_WELCOME',
    type: 'EMAIL',
    status: 'ACTIVE',
    subject: 'Welcome to the Lomash Wood newsletter!',
    preheader: 'Design inspiration direct to your inbox.',
    htmlBody: `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><title>Newsletter Welcome</title></head>
<body style="font-family:Arial,sans-serif;background:#f9f6f2;margin:0;padding:0;">
  <table width="600" align="center" cellpadding="0" cellspacing="0" style="background:#ffffff;margin:40px auto;border-radius:8px;overflow:hidden;">
    <tr><td style="background:#2c1810;padding:32px 40px;text-align:center;">
      <h1 style="color:#f5e6d3;margin:0;font-size:28px;">Lomash Wood</h1>
    </td></tr>
    <tr><td style="padding:40px;text-align:center;">
      <h2 style="color:#2c1810;">You're subscribed!</h2>
      <p style="color:#555;line-height:1.7;">Thank you for subscribing to the Lomash Wood newsletter. Expect design inspiration, exclusive offers, and new collection announcements delivered straight to your inbox.</p>
      <div style="margin:28px 0;">
        <a href="{{baseUrl}}" style="background:#2c1810;color:#fff;padding:14px 32px;border-radius:4px;text-decoration:none;font-weight:bold;">Explore Our Collections</a>
      </div>
    </td></tr>
    <tr><td style="background:#f5e6d3;padding:20px 40px;text-align:center;">
      <p style="color:#888;font-size:12px;margin:0;">© {{currentYear}} Lomash Wood Ltd. | <a href="{{unsubscribeUrl}}" style="color:#888;">Unsubscribe</a></p>
    </td></tr>
  </table>
</body>
</html>`,
    textBody: `You're subscribed to the Lomash Wood newsletter!

Thank you for subscribing. Expect design inspiration, exclusive offers, and new collection announcements.

Explore: {{baseUrl}}

© {{currentYear}} Lomash Wood Ltd.
Unsubscribe: {{unsubscribeUrl}}`,
    variables: [
      { key: 'baseUrl', required: true, type: 'string' },
      { key: 'unsubscribeUrl', required: true, type: 'string' },
      { key: 'currentYear', required: true, type: 'number' },
    ],
    engine: 'handlebars',
    version: 1,
  },

  
  {
    name: 'Contact Acknowledgement Email',
    slug: 'contact-acknowledgement-email',
    description: 'Auto-reply sent to customers who submit the contact form.',
    category: 'CONTACT_ACKNOWLEDGEMENT',
    type: 'EMAIL',
    status: 'ACTIVE',
    subject: 'We received your message, {{customerName}}',
    preheader: 'We will be in touch within 1–2 business days.',
    htmlBody: `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><title>Message Received</title></head>
<body style="font-family:Arial,sans-serif;background:#f9f6f2;margin:0;padding:0;">
  <table width="600" align="center" cellpadding="0" cellspacing="0" style="background:#ffffff;margin:40px auto;border-radius:8px;overflow:hidden;">
    <tr><td style="background:#2c1810;padding:32px 40px;text-align:center;">
      <h1 style="color:#f5e6d3;margin:0;font-size:28px;">Lomash Wood</h1>
    </td></tr>
    <tr><td style="padding:40px;">
      <h2 style="color:#2c1810;">Message Received</h2>
      <p style="color:#555;line-height:1.7;">Hi {{customerName}}, thank you for getting in touch. A member of our team will respond within 1–2 business days.</p>
      <p style="color:#888;font-size:13px;">Your message: <em>{{messagePreview}}</em></p>
    </td></tr>
    <tr><td style="background:#f5e6d3;padding:20px 40px;text-align:center;">
      <p style="color:#888;font-size:12px;margin:0;">© {{currentYear}} Lomash Wood Ltd.</p>
    </td></tr>
  </table>
</body>
</html>`,
    textBody: `Message Received

Hi {{customerName}},

Thank you for contacting Lomash Wood. We will respond within 1–2 business days.

Your message: {{messagePreview}}

© {{currentYear}} Lomash Wood Ltd.`,
    variables: [
      { key: 'customerName', required: true, type: 'string' },
      { key: 'messagePreview', required: true, type: 'string' },
      { key: 'currentYear', required: true, type: 'number' },
    ],
    engine: 'handlebars',
    version: 1,
  },
];


const SMS_TEMPLATES: TemplateData[] = [
  {
    name: 'Appointment Confirmation SMS',
    slug: 'appointment-confirmation-sms',
    description: 'SMS confirmation sent to customer after booking. (SRS FR5.5)',
    category: 'APPOINTMENT_CONFIRMATION',
    type: 'SMS',
    status: 'ACTIVE',
    smsBody:
      'Lomash Wood: Hi {{customerName}}, your {{appointmentType}} appointment is confirmed for {{appointmentDate}} at {{appointmentTime}}. Ref: {{appointmentRef}}. Manage: {{manageUrl}}',
    variables: [
      { key: 'customerName', required: true, type: 'string' },
      { key: 'appointmentType', required: true, type: 'string' },
      { key: 'appointmentDate', required: true, type: 'string' },
      { key: 'appointmentTime', required: true, type: 'string' },
      { key: 'appointmentRef', required: true, type: 'string' },
      { key: 'manageUrl', required: true, type: 'string' },
    ],
    engine: 'handlebars',
    version: 1,
  },
  {
    name: 'Appointment Reminder SMS',
    slug: 'appointment-reminder-sms',
    description: 'SMS reminder sent 24 hours before appointment.',
    category: 'APPOINTMENT_REMINDER',
    type: 'SMS',
    status: 'ACTIVE',
    smsBody:
      'Lomash Wood reminder: Your {{appointmentType}} appointment is tomorrow at {{appointmentTime}}. Ref: {{appointmentRef}}. Need to change? {{manageUrl}}',
    variables: [
      { key: 'appointmentType', required: true, type: 'string' },
      { key: 'appointmentTime', required: true, type: 'string' },
      { key: 'appointmentRef', required: true, type: 'string' },
      { key: 'manageUrl', required: true, type: 'string' },
    ],
    engine: 'handlebars',
    version: 1,
  },
  {
    name: 'Order Confirmation SMS',
    slug: 'order-confirmation-sms',
    description: 'SMS sent to customer after order is placed.',
    category: 'ORDER_CONFIRMATION',
    type: 'SMS',
    status: 'ACTIVE',
    smsBody:
      'Lomash Wood: Order {{orderRef}} confirmed. Total: £{{totalAmount}}. View: {{orderUrl}}',
    variables: [
      { key: 'orderRef', required: true, type: 'string' },
      { key: 'totalAmount', required: true, type: 'string' },
      { key: 'orderUrl', required: true, type: 'string' },
    ],
    engine: 'handlebars',
    version: 1,
  },
  {
    name: 'Payment Receipt SMS',
    slug: 'payment-receipt-sms',
    description: 'SMS payment receipt after successful charge.',
    category: 'PAYMENT_RECEIPT',
    type: 'SMS',
    status: 'ACTIVE',
    smsBody:
      'Lomash Wood: Payment of £{{amount}} received for order {{orderRef}}. Txn: {{transactionId}}.',
    variables: [
      { key: 'amount', required: true, type: 'string' },
      { key: 'orderRef', required: true, type: 'string' },
      { key: 'transactionId', required: true, type: 'string' },
    ],
    engine: 'handlebars',
    version: 1,
  },
];


const PUSH_TEMPLATES: TemplateData[] = [
  {
    name: 'Appointment Reminder Push',
    slug: 'appointment-reminder-push',
    description: 'Push notification reminder 24 hours before appointment.',
    category: 'APPOINTMENT_REMINDER',
    type: 'PUSH',
    status: 'ACTIVE',
    pushTitle: 'Appointment Tomorrow – Lomash Wood',
    pushBody: 'Your {{appointmentType}} appointment is tomorrow at {{appointmentTime}}. Tap to manage.',
    pushIcon: '/icons/calendar.png',
    variables: [
      { key: 'appointmentType', required: true, type: 'string' },
      { key: 'appointmentTime', required: true, type: 'string' },
      { key: 'appointmentRef', required: true, type: 'string' },
    ],
    engine: 'handlebars',
    version: 1,
  },
  {
    name: 'Order Confirmation Push',
    slug: 'order-confirmation-push',
    description: 'Push notification after order placed.',
    category: 'ORDER_CONFIRMATION',
    type: 'PUSH',
    status: 'ACTIVE',
    pushTitle: 'Order Confirmed – Lomash Wood',
    pushBody: 'Your order {{orderRef}} has been confirmed. Total: £{{totalAmount}}.',
    pushIcon: '/icons/checkmark.png',
    variables: [
      { key: 'orderRef', required: true, type: 'string' },
      { key: 'totalAmount', required: true, type: 'string' },
    ],
    engine: 'handlebars',
    version: 1,
  },
  {
    name: 'Loyalty Points Earned Push',
    slug: 'loyalty-points-earned-push',
    description: 'Push notification when loyalty points are earned.',
    category: 'LOYALTY_POINTS_EARNED',
    type: 'PUSH',
    status: 'ACTIVE',
    pushTitle: 'You earned {{points}} loyalty points!',
    pushBody: 'Keep designing with Lomash Wood to unlock rewards.',
    pushIcon: '/icons/star.png',
    variables: [{ key: 'points', required: true, type: 'number' }],
    engine: 'handlebars',
    version: 1,
  },
];

async function seedTemplates(): Promise<void> {
  log('Templates', 'Seeding notification templates...');

  const allTemplates = [...EMAIL_TEMPLATES, ...SMS_TEMPLATES, ...PUSH_TEMPLATES];

  for (const tpl of allTemplates) {
    
    await (prisma as any).notificationTemplate.upsert({
      where: { slug: tpl.slug },
      update: {
        name: tpl.name,
        description: tpl.description,
        category: tpl.category,
        type: tpl.type,
        status: tpl.status,
        subject: tpl.subject ?? null,
        preheader: tpl.preheader ?? null,
        htmlBody: tpl.htmlBody ?? null,
        textBody: tpl.textBody ?? null,
        smsBody: tpl.smsBody ?? null,
        pushTitle: tpl.pushTitle ?? null,
        pushBody: tpl.pushBody ?? null,
        pushIcon: tpl.pushIcon ?? null,
        variables: tpl.variables ?? null,
        engine: tpl.engine,
        version: tpl.version,
        publishedAt: tpl.status === 'ACTIVE' ? new Date() : null,
      },
      create: {
        name: tpl.name,
        slug: tpl.slug,
        description: tpl.description,
        category: tpl.category,
        type: tpl.type,
        status: tpl.status,
        subject: tpl.subject ?? null,
        preheader: tpl.preheader ?? null,
        htmlBody: tpl.htmlBody ?? null,
        textBody: tpl.textBody ?? null,
        smsBody: tpl.smsBody ?? null,
        pushTitle: tpl.pushTitle ?? null,
        pushBody: tpl.pushBody ?? null,
        pushIcon: tpl.pushIcon ?? null,
        variables: tpl.variables ?? null,
        engine: tpl.engine,
        version: tpl.version,
        publishedAt: tpl.status === 'ACTIVE' ? new Date() : null,
      },
    });
    logCreated('Template', `[${tpl.type}] ${tpl.slug}`);
  }
}


async function main(): Promise<void> {
  console.log('');
  console.log('════════════════════════════════════════════════════════════════');
  console.log('  LOMASH WOOD – Notification Service Seed');
  console.log('════════════════════════════════════════════════════════════════');
  console.log('');

  await seedRetryPolicies();
  console.log('');

  await seedProviders();
  console.log('');

  await seedTemplates();
  console.log('');

  console.log('════════════════════════════════════════════════════════════════');
  console.log('  ✅  Seed completed successfully.');
  console.log('════════════════════════════════════════════════════════════════');
  console.log('');
}

main()
  .catch((error: unknown) => {
    console.error('[SEED] ❌ Seed failed:', error);
    process.exit(1);
  })
  .finally(() => {
    void prisma.$disconnect();
  });