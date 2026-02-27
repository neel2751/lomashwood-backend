import { getRedisClient } from '../../infrastructure/cache/redis.client';
import { logger } from '../../config/logger';
import { AppError } from '../../shared/errors';
import { TrackingRepository } from './tracking.repository';
import { TrackingMapper } from './tracking.mapper';
import {
  TRACKING_CACHE_KEYS,
  TRACKING_CACHE_TTL,
  TRACKING_ERRORS,
} from './tracking.constants';
import type {
  TrackEventInput,
  TrackBatchInput,
  StartSessionInput,
  EndSessionInput,
  TrackPageViewInput,
  CreateTrackingConfigInput,
  UpdateTrackingConfigInput,
  TrackingEventResponse,
  SessionResponse,
  PageViewResponse,
  TrackingConfigResponse,
  TrackBatchResponse,
} from './tracking.types';

export class TrackingService {
  private readonly repository: TrackingRepository;

  constructor(repository: TrackingRepository) {
    this.repository = repository;
  }

  async trackEvent(input: TrackEventInput): Promise<TrackingEventResponse> {
    const session = await this.repository.findSessionById(input.sessionId);

    if (!session) {
      throw new AppError(TRACKING_ERRORS.SESSION_NOT_FOUND, 404);
    }

    const event = await this.repository.createEvent(input);

    logger.debug({ eventId: event.id, eventType: event.eventType }, 'Event tracked');

    return TrackingMapper.toEventResponse(event);
  }

  async trackBatch(input: TrackBatchInput): Promise<TrackBatchResponse> {
    const sessionIds = [...new Set(input.events.map((e) => e.sessionId))];

    const sessionChecks = await Promise.allSettled(
      sessionIds.map((id) => this.repository.findSessionById(id)),
    );

    const validSessionIds = new Set(
      sessionChecks
        .map((result, index) =>
          result.status === 'fulfilled' && result.value ? sessionIds[index] : null,
        )
        .filter((id): id is string => id !== null),
    );

    const validEvents = input.events.filter((e) => validSessionIds.has(e.sessionId));
    const invalidCount = input.events.length - validEvents.length;

    if (validEvents.length === 0) {
      return { processed: 0, failed: invalidCount, eventIds: [] };
    }

    const createdEvents = await this.repository.createManyEvents(validEvents);

    logger.debug(
      { processed: createdEvents.length, failed: invalidCount },
      'Batch events tracked',
    );

    return {
      processed: createdEvents.length,
      failed: invalidCount,
      eventIds: createdEvents.map((e) => e.id),
    };
  }

  async startSession(input: StartSessionInput): Promise<SessionResponse> {
    const session = await this.repository.createSession(input);

    const redis = getRedisClient();
    await redis.setex(
      TRACKING_CACHE_KEYS.sessionExists(session.id),
      String(TRACKING_CACHE_TTL.SESSION),
      '1',
    );

    logger.debug({ sessionId: session.id, visitorId: session.visitorId }, 'Session started');

    return TrackingMapper.toSessionResponse(session);
  }

  async endSession(input: EndSessionInput): Promise<SessionResponse> {
    const session = await this.repository.findSessionById(input.sessionId);

    if (!session) {
      throw new AppError(TRACKING_ERRORS.SESSION_NOT_FOUND, 404);
    }

    const updated = await this.repository.endSession(input);

    const redis = getRedisClient();
    await redis.del(TRACKING_CACHE_KEYS.sessionExists(input.sessionId));

    logger.debug({ sessionId: updated.id }, 'Session ended');

    return TrackingMapper.toSessionResponse(updated);
  }

  async trackPageView(input: TrackPageViewInput): Promise<PageViewResponse> {
    const session = await this.repository.findSessionById(input.sessionId);

    if (!session) {
      throw new AppError(TRACKING_ERRORS.SESSION_NOT_FOUND, 404);
    }

    const [pageView] = await Promise.all([
      this.repository.createPageView(input),
      this.repository.incrementSessionPageViews(input.sessionId),
    ]);

    return TrackingMapper.toPageViewResponse(pageView);
  }

  async getAllTrackingConfigs(enabledOnly?: boolean): Promise<TrackingConfigResponse[]> {
    const redis = getRedisClient();
    const cacheKey = TRACKING_CACHE_KEYS.allConfigs();
    const cached = await redis.get(cacheKey);

    if (cached) {
      const configs = JSON.parse(cached) as TrackingConfigResponse[];
      return enabledOnly ? configs.filter((c) => c.enabled) : configs;
    }

    const configs = await this.repository.findAllTrackingConfigs();
    const responses = configs.map(TrackingMapper.toConfigResponse);

    await redis.setex(cacheKey, String(TRACKING_CACHE_TTL.CONFIG), JSON.stringify(responses));

    return enabledOnly ? responses.filter((c) => c.enabled) : responses;
  }

  async getTrackingConfigByKey(key: string): Promise<TrackingConfigResponse> {
    const redis = getRedisClient();
    const cacheKey = TRACKING_CACHE_KEYS.config(key);
    const cached = await redis.get(cacheKey);

    if (cached) {
      return JSON.parse(cached) as TrackingConfigResponse;
    }

    const config = await this.repository.findTrackingConfigByKey(key);

    if (!config) {
      throw new AppError(TRACKING_ERRORS.CONFIG_NOT_FOUND, 404);
    }

    const response = TrackingMapper.toConfigResponse(config);
    await redis.setex(cacheKey, String(TRACKING_CACHE_TTL.CONFIG), JSON.stringify(response));

    return response;
  }

  async createTrackingConfig(input: CreateTrackingConfigInput): Promise<TrackingConfigResponse> {
    const existing = await this.repository.findTrackingConfigByKey(input.key);

    if (existing) {
      throw new AppError(TRACKING_ERRORS.CONFIG_KEY_EXISTS, 409);
    }

    const config = await this.repository.createTrackingConfig(input);

    await this.invalidateConfigCache(input.key);

    return TrackingMapper.toConfigResponse(config);
  }

  async updateTrackingConfig(
    key: string,
    input: UpdateTrackingConfigInput,
  ): Promise<TrackingConfigResponse> {
    const existing = await this.repository.findTrackingConfigByKey(key);

    if (!existing) {
      throw new AppError(TRACKING_ERRORS.CONFIG_NOT_FOUND, 404);
    }

    const updated = await this.repository.updateTrackingConfig(key, input);

    await this.invalidateConfigCache(key);

    return TrackingMapper.toConfigResponse(updated);
  }

  async deleteTrackingConfig(key: string): Promise<void> {
    const existing = await this.repository.findTrackingConfigByKey(key);

    if (!existing) {
      throw new AppError(TRACKING_ERRORS.CONFIG_NOT_FOUND, 404);
    }

    await this.repository.deleteTrackingConfig(key);
    await this.invalidateConfigCache(key);
  }

  private async invalidateConfigCache(key: string): Promise<void> {
    const redis = getRedisClient();
    await Promise.all([
      redis.del(TRACKING_CACHE_KEYS.config(key)),
      redis.del(TRACKING_CACHE_KEYS.allConfigs()),
    ]);
  }
}