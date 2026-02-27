import { v4 as uuidv4 }        from 'uuid';
import type {
  ISendEmailDto,
  ISendBulkEmailDto,
  IEmailResponse,
  IBulkEmailResponse,
} from './email.types';
import { mapSendDtoToJobPayload, mapNotificationToResponse } from './email.mapper';
import { EMAIL_DEFAULTS, EMAIL_RETRY }                       from './email.constants';
import { sendViaProvider }   from './email.provider';
import { prisma }            from '../../infrastructure/db/prisma.client';
import { renderTemplate }    from '../../infrastructure/email/template.renderer';
import { createLogger }      from '../../config/logger';
import { NotFoundError, ConflictError } from '../../shared/errors';

const logger = createLogger('email.service');

export class EmailService {

  async send(dto: ISendEmailDto): Promise<IEmailResponse> {

    if (dto.idempotencyKey !== undefined) {
      const existing = await prisma.notification.findUnique({
        where: { idempotencyKey: dto.idempotencyKey },
      });
      if (existing !== null) {
        logger.info('Duplicate email detected via idempotency key — returning existing record.', {
          idempotencyKey: dto.idempotencyKey,
          notificationId: existing.id,
        });
        return mapNotificationToResponse(existing);
      }
    }

    let htmlBody = dto.htmlBody;
    let textBody = dto.textBody;

    if (dto.templateSlug !== undefined) {
      const template = await prisma.notificationTemplate.findUnique({
        where: { slug: dto.templateSlug },
      });
      if (template === null) {
        throw new NotFoundError('EmailTemplate', dto.templateSlug);
      }
      if (template.htmlBody !== null) {
        htmlBody = await renderTemplate(template.htmlBody, dto.templateVars ?? {});
      }
      if (template.textBody !== null) {
        textBody = await renderTemplate(template.textBody, dto.templateVars ?? {});
      }
    }

    const notification = await prisma.notification.create({
      data: {
        channel:        'EMAIL',
        status:         'PENDING',
        priority:       dto.priority    ?? 'NORMAL',
        recipientId:    dto.recipientId ?? null,
        recipientEmail: dto.to.email,
        fromName:       dto.from?.name     ?? EMAIL_DEFAULTS.FROM_NAME,
        fromAddress:    dto.from?.address  ?? EMAIL_DEFAULTS.FROM_ADDRESS,
        replyTo:        dto.from?.replyTo  ?? EMAIL_DEFAULTS.REPLY_TO,
        subject:        dto.subject,
        htmlBody:       htmlBody           ?? null,
        body:           textBody           ?? null,
        attachments:    dto.attachments
                          ? (dto.attachments as unknown as Record<string, unknown>[])
                          : null,
        scheduledAt:    dto.scheduledAt    ?? null,
        idempotencyKey: dto.idempotencyKey ?? null,
        campaignId:     dto.campaignId     ?? null,
        batchId:        dto.batchId        ?? null,
        metadata:       (dto.metadata as object | undefined) ?? null,
        maxRetries:     EMAIL_RETRY.MAX_ATTEMPTS,
      },
    });

    await prisma.notificationLog.create({
      data: {
        notificationId: notification.id,
        event:          'CREATED',
        status:         'PENDING',
        message:        'Notification record created.',
      },
    });

    const jobPayload = mapSendDtoToJobPayload(notification.id, dto);

    try {
      await prisma.notification.update({
        where: { id: notification.id },
        data:  { status: 'PROCESSING' },
      });

      const result = await sendViaProvider(jobPayload);

      await prisma.notification.update({
        where: { id: notification.id },
        data: {
          status:            'SENT',
          sentAt:            result.sentAt,
          providerMessageId: result.providerMessageId,
        },
      });

      await prisma.notificationLog.create({
        data: {
          notificationId: notification.id,
          event:          'SENT',
          status:         'SENT',
          message:        `Sent via provider. Message ID: ${result.providerMessageId}`,
        },
      });

      logger.info('Email sent successfully.', {
        notificationId:    notification.id,
        providerMessageId: result.providerMessageId,
        to:                dto.to.email,
      });

    } catch (err: unknown) {
      await prisma.notification.update({
        where: { id: notification.id },
        data:  { status: 'FAILED' },
      });
      await prisma.notificationLog.create({
        data: {
          notificationId: notification.id,
          event:          'FAILED',
          status:         'FAILED',
          message:        err instanceof Error ? err.message : 'Unknown error',
        },
      });
      throw err;
    }

    return mapNotificationToResponse(notification);
  }

  async sendBulk(dto: ISendBulkEmailDto): Promise<IBulkEmailResponse> {
    const batchId             = dto.batchId ?? `batch_${uuidv4()}`;
    const notificationIds: string[] = [];
    let   totalFailed         = 0;

    const template = await prisma.notificationTemplate.findUnique({
      where: { slug: dto.templateSlug },
    });
    if (template === null) {
      throw new NotFoundError('EmailTemplate', dto.templateSlug);
    }

    for (const recipient of dto.recipients) {
      try {
        const result = await this.send({
          to:           recipient,
          from:         dto.from,
          subject:      dto.subject,
          templateSlug: dto.templateSlug,
          templateVars: dto.templateVars,
          priority:     dto.priority,
          campaignId:   dto.campaignId,
          batchId,
        });
        notificationIds.push(result.notificationId);
      } catch (err: unknown) {
        totalFailed++;
        logger.error('Failed to send bulk email for recipient.', {
          err,
          recipient: recipient.email,
          batchId,
        });
      }
    }

    logger.info('Bulk email batch completed.', {
      batchId,
      totalSent:   notificationIds.length,
      totalFailed,
    });

    return {
      batchId,
      totalQueued:     notificationIds.length,
      totalFailed,
      notificationIds,
      queuedAt:        new Date(),
    };
  }

  async getById(id: string) {
    const notification = await prisma.notification.findFirst({
      where: { id, channel: 'EMAIL', deletedAt: null },
      include: {
        deliveryReports: { orderBy: { createdAt: 'desc' }, take: 1 },
        logs:            { orderBy: { occurredAt: 'desc' }, take: 10 },
      },
    });
    if (notification === null) {
      throw new NotFoundError('EmailNotification', id);
    }
    return notification;
  }

  async cancel(id: string): Promise<void> {
    const notification = await prisma.notification.findFirst({
      where: { id, channel: 'EMAIL', deletedAt: null },
    });
    if (notification === null) {
      throw new NotFoundError('EmailNotification', id);
    }
    if (notification.status !== 'PENDING') {
      throw new ConflictError(
        `Cannot cancel email with status: ${notification.status}`,
      );
    }
    await prisma.notification.update({
      where: { id },
      data:  { status: 'CANCELLED' },
    });
    await prisma.notificationLog.create({
      data: {
        notificationId: id,
        event:          'CANCELLED',
        status:         'CANCELLED',
        message:        'Email cancelled by user.',
      },
    });
  }
}

export const emailService = new EmailService();