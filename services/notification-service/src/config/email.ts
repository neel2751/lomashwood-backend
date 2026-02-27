import { env } from './env';
import type { NodemailerConfig } from '../infrastructure/email/nodemailer.client';
import type { SESConfig } from '../infrastructure/email/ses.client';

export const nodemailerConfig: NodemailerConfig = {
  host: env.SMTP_HOST ?? '',
  port: env.SMTP_PORT ?? 587,
  secure: env.SMTP_SECURE ?? false,
  auth: {
    user: env.SMTP_USER ?? '',
    pass: env.SMTP_PASS ?? '',
  },
  from: env.SMTP_FROM ?? '',
  pool: true,
  maxConnections: 5,
  maxMessages: 100,
  rateDelta: 1_000,
  rateLimit: 5,
};

export const sesConfig: SESConfig = {
  region: env.AWS_REGION ?? 'eu-west-1',
  accessKeyId: env.AWS_ACCESS_KEY_ID ?? '',
  secretAccessKey: env.AWS_SECRET_ACCESS_KEY ?? '',
  from: env.SES_FROM ?? '',
  configurationSetName: env.SES_CONFIGURATION_SET,
};

export const emailConfig = {
  activeProvider: env.ACTIVE_EMAIL_PROVIDER,
  nodemailer: nodemailerConfig,
  ses: sesConfig,
} as const;