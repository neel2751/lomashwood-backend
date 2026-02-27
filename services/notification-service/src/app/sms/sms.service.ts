import { v4 as uuidv4 }       from 'uuid';
import type {
  ISendSmsDto,
  ISendBulkSmsDto,
  ISmsResponse,
  IBulkSmsResponse,
} from './sms.types';
import { mapSendDtoToJobPayload, mapNotificationToResponse } from './sms.mapper';
import { SMS_DEFAULTS, SMS_JOB_NAMES, SMS_RETRY }           from './sms.constants';
import { prisma }              from '../../infrastructure/db/prisma.client';
import { smsQueue }            from '../../infrastructure/messaging/queues/sms.queue';
import { renderTemplate }      from '../../infrastructure/email/template.renderer';
import { createLogger }        from '../../config/logger';
import { env }                 from '../../config/env';
import { AppError }            from '../../shared/errors';

const logger = createLogger('sms.service');

export class SmsService {
  async send(dto: ISendSmsDto): Promise<ISmsResponse> {
    if (dto.idempotencyKey !== undefined) {
      const existing = await prisma.notification.findUnique({
        where: { idempotencyKey: dto.idempotencyKey },
      });

      if (existing !== null) {
        logger.info(
          { idempotencyKey: dto.idempotencyKey, notificationId: existing.id },
          'Duplicate SMS detected via idempotency key — returning existing record.',
        );
        return mapNotificationToResponse(existing);
      }
    }

    let body = dto.body;

    if (dto.templateSlug !== undefined) {
      const template = await prisma.notificationTemplate.findUnique({
        where: { slug: dto.templateSlug },
      });

      if (template === null) {
        throw new AppError(`SMS template not found: ${dto.templateSlug}`, 404);
      }

      if (template.smsBody === null) {
        throw new AppError(`Template '${dto.templateSlug}' has no SMS body.`, 400);
      }

      body = await renderTemplate(template.smsBody, dto.templateVars ?? {});
    }

    const notification = await prisma.notification.create({
      data: {
        channel:        'SMS',
        status:         'PENDING',
        priority:       dto.priority   ?? 'NORMAL',
        recipientId:    dto.recipientId ?? null,
        recipientPhone: dto.to.phone,
        fromAddress:    dto.from       ?? SMS_DEFAULTS.FROM,
        body,
        scheduledAt:    dto.scheduledAt    ?? null,
        idempotencyKey: dto.idempotencyKey ?? null,
        campaignId:     dto.campaignId     ?? null,
        batchId:        dto.batchId        ?? null,
        metadata:       (dto.metadata as object | undefined) ?? null,
        maxRetries:     SMS_RETRY.MAX_ATTEMPTS,
      },
    });

    await prisma.notificationLog.create({
      data: {
        notificationId: notification.id,
        event:          'CREATED',
        status:         'PENDING',
        message:        'SMS notification record created.',
      },
    });

    const jobPayload = mapSendDtoToJobPayload(notification.id, { ...dto, body });

    const job = await smsQueue.add(
      SMS_JOB_NAMES.SEND,
      jobPayload,
      {
        jobId:    notification.id,
        delay:    dto.scheduledAt !== undefined
                    ? Math.max(0, dto.scheduledAt.getTime() - Date.now())
                    : 0,
        priority: this.mapPriorityToNumber(dto.priority ?? 'NORMAL'),
        attempts: SMS_RETRY.MAX_ATTEMPTS,
        backoff: {
          type:  'exponential',
          delay: SMS_RETRY.INITIAL_DELAY_MS,
        },
        removeOnComplete: { count: 100 },
        removeOnFail:     { count: 500 },
      },
    );

    await prisma.notification.update({
      where: { id: notification.id },
      data:  { status: 'QUEUED', jobId: job.id, queueName: env.QUEUE_SMS_NAME },
    });

    await prisma.notificationLog.create({
      data: {
        notificationId: notification.id,
        event:          'QUEUED',
        status:         'QUEUED',
        message:        `SMS job enqueued with ID: ${job.id}`,
      },
    });

    logger.info(
      { notificationId: notification.id, jobId: job.id, to: dto.to.phone },
      'SMS queued successfully.',
    );

    return mapNotificationToResponse(notification, job.id ?? undefined);
  }

  async sendBulk(dto: ISendBulkSmsDto): Promise<IBulkSmsResponse> {
    const batchId         = dto.batchId ?? `batch_${uuidv4()}`;
    const notificationIds: string[] = [];
    let   totalFailed     = 0;

    for (const recipient of dto.recipients) {
      try {
        const result = await this.send({
          to:           recipient,
          from:         dto.from,
          body:         dto.body,
          templateSlug: dto.templateSlug,
          templateVars: dto.templateVars,
          priority:     dto.priority,
          campaignId:   dto.campaignId,
          batchId,
        });
        notificationIds.push(result.notificationId);
      } catch (err: unknown) {
        totalFailed++;
        logger.error(
          { err, phone: recipient.phone, batchId },
          'Failed to queue bulk SMS for recipient.',
        );
      }
    }

    logger.info(
      { batchId, totalQueued: notificationIds.length, totalFailed },
      'Bulk SMS batch queued.',
    );

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
      where: { id, channel: 'SMS', deletedAt: null },
      include: {
        deliveryReports: { orderBy: { createdAt: 'desc' }, take: 1 },
        logs:            { orderBy: { occurredAt: 'desc' }, take: 10 },
      },
    });

    if (notification === null) {
      throw new AppError(`SMS notification not found: ${id}`, 404);
    }

    return notification;
  }

  async cancel(id: string): Promise<void> {
    const notification = await prisma.notification.findFirst({
      where: { id, channel: 'SMS', deletedAt: null },
    });

    if (notification === null) {
      throw new AppError(`SMS notification not found: ${id}`, 404);
    }

    if (!['PENDING', 'QUEUED'].includes(notification.status)) {
      throw new AppError(
        `Cannot cancel SMS with status: ${notification.status}`,
        409,
      );
    }

    const job = await smsQueue.getJob(id);
    if (job !== undefined) {
      await job.remove();
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
        message:        'SMS job cancelled by user.',
      },
    });
  }

  private mapPriorityToNumber(priority: string): number {
    const map: Record<string, number> = {
      CRITICAL: 1,
      HIGH:     2,
      NORMAL:   3,
      LOW:      4,
    };
    return map[priority] ?? 3;
  }
}

export const smsService = new SmsService();