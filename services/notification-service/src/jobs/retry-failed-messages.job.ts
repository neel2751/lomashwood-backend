import cron from 'node-cron';
import { Logger } from 'winston';
import type { PrismaClient } from '@prisma/client';
import type { EmailService } from '../app/email/email.service';
import type { SmsService } from '../app/sms/sms.service';
import type { PushService } from '../app/push/push.service';

const MAX_RETRY_ATTEMPTS = 3;
const BATCH_SIZE = 50;

export function startRetryFailedMessagesJob(deps: {
  prisma: PrismaClient;
  emailService: EmailService;
  smsService: SmsService;
  pushService: PushService;
  logger: Logger;
}): cron.ScheduledTask {
  return cron.schedule('*/15 * * * *', async () => {
    deps.logger.info('retry-failed-messages job started');

    try {
      await retryFailedEmails(deps);
      await retryFailedSms(deps);
      await retryFailedPush(deps);
    } catch (err: unknown) {
      deps.logger.error('retry-failed-messages job error', {
        error: (err as Error).message,
      });
    }

    deps.logger.info('retry-failed-messages job completed');
  });
}

async function retryFailedEmails(deps: {
  prisma: PrismaClient;
  emailService: EmailService;
  logger: Logger;
}): Promise<void> {
  const failed = await deps.prisma.emailNotification.findMany({
    where: {
      status: 'FAILED',
      retryCount: { lt: MAX_RETRY_ATTEMPTS },
    },
    take: BATCH_SIZE,
    orderBy: { createdAt: 'asc' },
  });

  for (const record of failed) {
    try {
      await deps.emailService.send({
        to: record.to,
        subject: record.subject,
        htmlBody: record.htmlBody ?? undefined,
        textBody: record.textBody,
      });

      await deps.prisma.emailNotification.update({
        where: { id: record.id },
        data: { status: 'SENT', sentAt: new Date() },
      });
    } catch {
      await deps.prisma.emailNotification.update({
        where: { id: record.id },
        data: { retryCount: { increment: 1 } },
      });
    }
  }

  deps.logger.info('Email retry batch done', { count: failed.length });
}

async function retryFailedSms(deps: {
  prisma: PrismaClient;
  smsService: SmsService;
  logger: Logger;
}): Promise<void> {
  const failed = await deps.prisma.smsNotification.findMany({
    where: {
      status: 'FAILED',
      retryCount: { lt: MAX_RETRY_ATTEMPTS },
    },
    take: BATCH_SIZE,
    orderBy: { createdAt: 'asc' },
  });

  for (const record of failed) {
    try {
      await deps.smsService.send({ to: record.to, body: record.body });

      await deps.prisma.smsNotification.update({
        where: { id: record.id },
        data: { status: 'SENT', sentAt: new Date() },
      });
    } catch {
      await deps.prisma.smsNotification.update({
        where: { id: record.id },
        data: { retryCount: { increment: 1 } },
      });
    }
  }

  deps.logger.info('SMS retry batch done', { count: failed.length });
}

async function retryFailedPush(deps: {
  prisma: PrismaClient;
  pushService: PushService;
  logger: Logger;
}): Promise<void> {
  const failed = await deps.prisma.pushNotification.findMany({
    where: {
      status: 'FAILED',
      retryCount: { lt: MAX_RETRY_ATTEMPTS },
    },
    take: BATCH_SIZE,
    orderBy: { createdAt: 'asc' },
  });

  for (const record of failed) {
    try {
      await deps.pushService.send({
        token: record.token,
        provider: record.provider as never,
        payload: {
          title: record.title,
          body: record.body,
          data: (record.data as Record<string, string>) ?? undefined,
        },
      });

      await deps.prisma.pushNotification.update({
        where: { id: record.id },
        data: { status: 'SENT', sentAt: new Date() },
      });
    } catch {
      await deps.prisma.pushNotification.update({
        where: { id: record.id },
        data: { retryCount: { increment: 1 } },
      });
    }
  }

  deps.logger.info('Push retry batch done', { count: failed.length });
}