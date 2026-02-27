import { Logger } from 'winston';
import {
  SendPushRequest,
  BulkSendPushRequest,
  SendPushToUserRequest,
  RegisterTokenRequest,
  PushNotificationFilter,
  PushNotificationListResponse,
  PushNotificationRecord,
  PushProvider,
  PushStatus,
  BulkPushSendResult,
  PushSendResult,
} from './push.types';
import { PushProviderFactory, IPushProvider } from './push.provider';
import { PUSH_ERRORS, PUSH_EVENTS } from './push.constants';
import type { PrismaClient } from '@prisma/client';
import type { RedisClientType } from 'redis';
import type { IEventProducer } from '../../infrastructure/messaging/event-producer';
import { PushMapper } from './push.mapper';
import { AppError } from '../../shared/errors';

export class PushService {
  private readonly providers: Map<PushProvider, IPushProvider> = new Map();

  constructor(
    private readonly prisma: PrismaClient,
    private readonly redis: RedisClientType,
    private readonly eventProducer: IEventProducer,
    private readonly logger: Logger,
    private readonly config: {
      firebase?: { serviceAccount: Record<string, unknown>; projectId: string };
      webpush?: { vapidPublicKey: string; vapidPrivateKey: string; subject: string };
    },
  ) {
    this.initProviders();
  }

  private initProviders(): void {
    for (const provider of Object.values(PushProvider)) {
      try {
        const instance = PushProviderFactory.create(provider, this.config, this.logger);
        this.providers.set(provider, instance);
      } catch (err) {
        this.logger.warn(`Push provider ${provider} not initialized`, { error: (err as Error).message });
      }
    }
  }

  private getProvider(provider: PushProvider): IPushProvider {
    const instance = this.providers.get(provider);
    if (!instance) {
      throw new AppError(PUSH_ERRORS.PROVIDER_UNAVAILABLE, `Push provider ${provider} is not available`, 503);
    }
    return instance;
  }

  async send(req: SendPushRequest): Promise<PushSendResult> {
    const provider = this.getProvider(req.provider);

    const record = await this.prisma.pushNotification.create({
      data: {
        userId: req.userId,
        token: req.token,
        provider: req.provider,
        title: req.payload.title,
        body: req.payload.body,
        data: req.payload.data,
        status: PushStatus.PENDING,
        priority: req.payload.priority ?? 'NORMAL',
      },
    });

    const result = await provider.send(req.token, req.payload);

    await this.prisma.pushNotification.update({
      where: { id: record.id },
      data: {
        status: result.success ? PushStatus.SENT : PushStatus.FAILED,
        providerId: result.messageId,
        errorMessage: result.errorMessage,
        sentAt: result.success ? new Date() : undefined,
      },
    });

    await this.eventProducer.publish(
      result.success ? PUSH_EVENTS.SENT : PUSH_EVENTS.FAILED,
      {
        notificationId: record.id,
        userId: req.userId,
        token: req.token,
        provider: req.provider,
        success: result.success,
        messageId: result.messageId,
        error: result.errorMessage,
      },
    );

    this.logger.info('Push notification send attempt', {
      notificationId: record.id,
      success: result.success,
      provider: req.provider,
    });

    return result;
  }

  async sendBulk(req: BulkSendPushRequest): Promise<BulkPushSendResult> {
    const provider = this.getProvider(req.provider);

    const result = await provider.sendBulk(req.tokens, req.payload);

    const records = result.results.map((r) => ({
      userId: req.userId,
      token: r.token,
      provider: req.provider,
      title: req.payload.title,
      body: req.payload.body,
      data: req.payload.data,
      status: r.success ? PushStatus.SENT : PushStatus.FAILED,
      priority: req.payload.priority ?? 'NORMAL',
      providerId: r.messageId,
      errorMessage: r.errorMessage,
      sentAt: r.success ? new Date() : undefined,
    }));

    await this.prisma.pushNotification.createMany({ data: records });

    this.logger.info('Bulk push send completed', {
      successCount: result.successCount,
      failureCount: result.failureCount,
      provider: req.provider,
    });

    return result;
  }

  async sendToUser(userId: string, req: SendPushToUserRequest): Promise<BulkPushSendResult> {
    const tokenRecords = await this.prisma.pushToken.findMany({
      where: { userId, isActive: true },
    });

    if (!tokenRecords.length) {
      throw new AppError(PUSH_ERRORS.NO_TOKENS_REGISTERED, 'No push tokens registered for user', 404);
    }

    const results: PushSendResult[] = [];

    for (const tokenRecord of tokenRecords) {
      const provider = this.providers.get(tokenRecord.provider as PushProvider);
      if (!provider) continue;

      const result = await provider.send(tokenRecord.token, req.payload);

      if (!result.success && result.errorCode === PUSH_ERRORS.TOKEN_NOT_REGISTERED) {
        await this.prisma.pushToken.update({
          where: { id: tokenRecord.id },
          data: { isActive: false },
        });
      }

      results.push(result);
    }

    return PushMapper.toBulkPushSendResult(results);
  }

  async registerToken(userId: string, req: RegisterTokenRequest): Promise<void> {
    await this.prisma.pushToken.upsert({
      where: { token: req.token },
      create: {
        userId,
        token: req.token,
        provider: req.provider,
        deviceId: req.deviceId,
        deviceType: req.deviceType,
        isActive: true,
      },
      update: {
        userId,
        provider: req.provider,
        deviceId: req.deviceId,
        deviceType: req.deviceType,
        isActive: true,
      },
    });

    await this.eventProducer.publish(PUSH_EVENTS.TOKEN_REGISTERED, { userId, token: req.token, provider: req.provider });

    this.logger.info('Push token registered', { userId, provider: req.provider });
  }

  async unregisterToken(userId: string, token: string): Promise<void> {
    const record = await this.prisma.pushToken.findFirst({ where: { token, userId } });

    if (!record) {
      throw new AppError(PUSH_ERRORS.TOKEN_NOT_REGISTERED, 'Token not found', 404);
    }

    await this.prisma.pushToken.update({
      where: { id: record.id },
      data: { isActive: false },
    });

    await this.eventProducer.publish(PUSH_EVENTS.TOKEN_UNREGISTERED, { userId, token });

    this.logger.info('Push token unregistered', { userId });
  }

  async list(filter: PushNotificationFilter): Promise<PushNotificationListResponse> {
    const { page = 1, limit = 20, userId, status, provider } = filter;
    const skip = (page - 1) * limit;

    const where = {
      ...(userId && { userId }),
      ...(status && { status }),
      ...(provider && { provider }),
    };

    const [data, total] = await this.prisma.$transaction([
      this.prisma.pushNotification.findMany({ where, skip, take: limit, orderBy: { createdAt: 'desc' } }),
      this.prisma.pushNotification.count({ where }),
    ]);

    return {
      data: data.map(PushMapper.toPushNotificationRecord),
      total,
      page,
      limit,
    };
  }

  async getById(id: string): Promise<PushNotificationRecord> {
    const record = await this.prisma.pushNotification.findUnique({ where: { id } });
    if (!record) {
      throw new AppError(PUSH_ERRORS.SEND_FAILED, 'Push notification not found', 404);
    }
    return PushMapper.toPushNotificationRecord(record);
  }

  async checkProvidersHealth(): Promise<Record<string, boolean>> {
    const results: Record<string, boolean> = {};
    for (const [name, provider] of this.providers.entries()) {
      results[name] = await provider.isHealthy();
    }
    return results;
  }
}