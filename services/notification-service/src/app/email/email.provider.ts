import type { IEmailJobPayload, IEmailProviderResult } from './email.types';
import { createLogger }     from '../../config/logger';
import { prisma }           from '../../infrastructure/db/prisma.client';
import { NodemailerClient } from '../../infrastructure/email/nodemailer.client';
import { SESClient_ }       from '../../infrastructure/email/ses.client';
import { env }              from '../../config/env';
import { ProviderError, ServiceUnavailableError } from '../../shared/errors';

const logger = createLogger('email.provider');

// instantiate email clients using runtime env configuration
const nodemailerClient = new NodemailerClient(
  {
    host: env.SMTP_HOST ?? '',
    port: env.SMTP_PORT ?? 587,
    secure: env.SMTP_SECURE ?? false,
    auth: { user: env.SMTP_USER ?? '', pass: env.SMTP_PASS ?? '' },
    from: env.SMTP_FROM ?? '',
  },
  logger,
);

const sesClient = new SESClient_(
  {
    region: env.AWS_REGION ?? '',
    accessKeyId: env.AWS_ACCESS_KEY_ID ?? '',
    secretAccessKey: env.AWS_SECRET_ACCESS_KEY ?? '',
    from: env.SES_FROM ?? '',
    configurationSetName: env.SES_CONFIGURATION_SET ?? undefined,
  },
  logger,
);

export interface IEmailProvider {
  send(payload: IEmailJobPayload): Promise<IEmailProviderResult>;
  name: string;
}

class NodemailerProvider implements IEmailProvider {
  readonly name = 'nodemailer-smtp';

  async send(payload: IEmailJobPayload): Promise<IEmailProviderResult> {
    logger.debug('Sending via Nodemailer.', { to: payload.to.email, subject: payload.subject });
    const req = {
      from: payload.from ? `${payload.from.name ? `\"${payload.from.name}\" ` : ''}<${payload.from.address}>` : undefined,
      replyTo: payload.from.replyTo,
      to: payload.to.name ? `"${payload.to.name}" <${payload.to.email}>` : payload.to.email,
      subject: payload.subject,
      htmlBody: payload.htmlBody,
      textBody: payload.textBody,
      attachments: payload.attachments?.map((a) => ({
        filename: a.filename,
        content: a.content,
        contentType: a.contentType,
        encoding: a.encoding,
      })),
    };

    const result = await nodemailerClient.send(req as any);

    return {
      providerMessageId: result.messageId ?? '',
      providerResponse: { success: result.success, errorCode: (result as any).errorCode, errorMessage: (result as any).errorMessage },
      sentAt: new Date(),
    };
  }
}

class SesProvider implements IEmailProvider {
  readonly name = 'aws-ses';

  async send(payload: IEmailJobPayload): Promise<IEmailProviderResult> {
    logger.debug('Sending via AWS SES.', { to: payload.to.email, subject: payload.subject });
    const req = {
      from: payload.from ? `${payload.from.name ? `\"${payload.from.name}\" ` : ''}<${payload.from.address}>` : undefined,
      to: payload.to.email,
      subject: payload.subject,
      htmlBody: payload.htmlBody,
      textBody: payload.textBody,
      attachments: payload.attachments?.map((a) => ({
        filename: a.filename,
        content: a.content,
        contentType: a.contentType,
        encoding: a.encoding,
      })),
      replyTo: payload.from.replyTo,
    };

    const result = await sesClient.send(req as any);

    return {
      providerMessageId: result.messageId ?? '',
      providerResponse: { success: result.success, errorCode: (result as any).errorCode, errorMessage: (result as any).errorMessage },
      sentAt: new Date(),
    };
  }
}

async function resolveProvider(): Promise<IEmailProvider> {
  if (env.ACTIVE_EMAIL_PROVIDER === 'ses') {
    return new SesProvider();
  }
  return new NodemailerProvider();
}

async function resolveProviderWithFallback(): Promise<IEmailProvider> {
  const primary = await resolveProvider();

  const dbProvider = await (prisma as any).notificationProvider.findFirst({
    where: { channel: 'EMAIL', status: 'ACTIVE', isDefault: true, deletedAt: null },
    orderBy: { priority: 'asc' },
  });

  if (dbProvider === null) {
    logger.warn('No active default email provider found in DB — using config-based provider.');
  }

  return primary;
}

export async function sendViaProvider(payload: IEmailJobPayload): Promise<IEmailProviderResult> {
  const provider = await resolveProviderWithFallback();

  try {
    const result = await provider.send(payload);

    logger.info('Email sent successfully.', {
      provider:          provider.name,
      notificationId:    payload.notificationId,
      providerMessageId: result.providerMessageId,
    });

    return result;

  } catch (err: unknown) {
    logger.error('Primary email provider failed.', {
      err,
      provider:       provider.name,
      notificationId: payload.notificationId,
    });

    if (provider.name === 'nodemailer-smtp') {
      logger.warn('Attempting SES fallback...');
      try {
        const fallback = new SesProvider();
        const result   = await fallback.send(payload);
        logger.info('SES fallback succeeded.', { notificationId: payload.notificationId });
        return result;
      } catch (fallbackErr: unknown) {
        logger.error('SES fallback also failed.', { fallbackErr });
        throw new ServiceUnavailableError('All email providers');
      }
    }

    throw new ProviderError(provider.name, 'Email provider failed to send message.');
  }
}