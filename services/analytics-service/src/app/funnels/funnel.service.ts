import { getRedisClient } from '../../infrastructure/cache/redis.client';
import { logger } from '../../config/logger';
import { AppError } from '../../shared/errors';
import { FunnelRepository } from './funnel.repository';
import { FunnelMapper } from './funnel.mapper';
import { FUNNEL_CACHE_KEYS, FUNNEL_CACHE_TTL, FUNNEL_ERRORS } from './funnel.constants';
import type {
  CreateFunnelInput,
  UpdateFunnelInput,
  ComputeFunnelInput,
  FunnelListFilters,
  FunnelResponse,
  FunnelResultResponse,
  FunnelWithResultsResponse,
  PaginatedFunnelsResponse,
  FunnelStep,
  FunnelStepResult,
} from './funnel.types';

export class FunnelService {
  private readonly repository: FunnelRepository;

  constructor(repository: FunnelRepository) {
    this.repository = repository;
  }

  async createFunnel(input: CreateFunnelInput): Promise<FunnelResponse> {
    const funnel = await this.repository.create(input);

    await this.invalidateFunnelListCache();

    logger.info({ funnelId: funnel.id, name: funnel.name }, 'Funnel created');

    return FunnelMapper.toResponse(funnel);
  }

  async getFunnelById(id: string): Promise<FunnelWithResultsResponse> {
    const redis = getRedisClient();
    const cacheKey = FUNNEL_CACHE_KEYS.funnel(id);
    const cached = await redis.get(cacheKey);

    if (cached) {
      return JSON.parse(cached) as FunnelWithResultsResponse;
    }

    const funnel = await this.repository.findById(id);

    if (!funnel) {
      throw new AppError(FUNNEL_ERRORS.NOT_FOUND, 404);
    }

    const latestResult = await this.repository.findLatestResult(id);

    const response = FunnelMapper.toWithResultsResponse(funnel, latestResult);

    await redis.setex(cacheKey, String(FUNNEL_CACHE_TTL.FUNNEL), JSON.stringify(response));

    return response;
  }

  async listFunnels(filters: FunnelListFilters): Promise<PaginatedFunnelsResponse> {
    const { page = 1, limit = 20 } = filters;

    const { data, total } = await this.repository.findAll(filters);

    return {
      data: data.map(FunnelMapper.toResponse),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async updateFunnel(id: string, input: UpdateFunnelInput): Promise<FunnelResponse> {
    const existing = await this.repository.findById(id);

    if (!existing) {
      throw new AppError(FUNNEL_ERRORS.NOT_FOUND, 404);
    }

    const updated = await this.repository.update(id, input);

    await this.invalidateFunnelCache(id);

    logger.info({ funnelId: id }, 'Funnel updated');

    return FunnelMapper.toResponse(updated);
  }

  async pauseFunnel(id: string): Promise<FunnelResponse> {
    const funnel = await this.repository.findById(id);

    if (!funnel) {
      throw new AppError(FUNNEL_ERRORS.NOT_FOUND, 404);
    }

    if (funnel.status === 'PAUSED') {
      throw new AppError(FUNNEL_ERRORS.ALREADY_PAUSED, 409);
    }

    if (funnel.status === 'ARCHIVED') {
      throw new AppError(FUNNEL_ERRORS.ALREADY_ARCHIVED, 409);
    }

    const updated = await this.repository.updateStatus(id, 'PAUSED');

    await this.invalidateFunnelCache(id);

    logger.info({ funnelId: id }, 'Funnel paused');

    return FunnelMapper.toResponse(updated);
  }

  async resumeFunnel(id: string): Promise<FunnelResponse> {
    const funnel = await this.repository.findById(id);

    if (!funnel) {
      throw new AppError(FUNNEL_ERRORS.NOT_FOUND, 404);
    }

    if (funnel.status === 'ACTIVE') {
      throw new AppError(FUNNEL_ERRORS.ALREADY_ACTIVE, 409);
    }

    if (funnel.status === 'ARCHIVED') {
      throw new AppError(FUNNEL_ERRORS.ALREADY_ARCHIVED, 409);
    }

    const updated = await this.repository.updateStatus(id, 'ACTIVE');

    await this.invalidateFunnelCache(id);

    logger.info({ funnelId: id }, 'Funnel resumed');

    return FunnelMapper.toResponse(updated);
  }

  async archiveFunnel(id: string): Promise<void> {
    const funnel = await this.repository.findById(id);

    if (!funnel) {
      throw new AppError(FUNNEL_ERRORS.NOT_FOUND, 404);
    }

    if (funnel.status === 'ARCHIVED') {
      throw new AppError(FUNNEL_ERRORS.ALREADY_ARCHIVED, 409);
    }

    await this.repository.softDelete(id);

    await this.invalidateFunnelCache(id);

    logger.info({ funnelId: id }, 'Funnel archived');
  }

  async computeFunnel(input: ComputeFunnelInput): Promise<FunnelResultResponse> {
    const funnel = await this.repository.findById(input.funnelId);

    if (!funnel) {
      throw new AppError(FUNNEL_ERRORS.NOT_FOUND, 404);
    }

    const steps = funnel.steps as unknown as FunnelStep[];
    const sortedSteps = [...steps].sort((a, b) => a.order - b.order);

    const stepCounts: number[] = [];

    for (const step of sortedSteps) {
      const count = await this.repository.countEventsByTypeAndPage(
        step.eventType,
        step.page,
        input.periodStart,
        input.periodEnd,
      );
      stepCounts.push(count);
    }

    const firstStepCount = stepCounts[0] ?? 0;
    const lastStepCount = stepCounts[stepCounts.length - 1] ?? 0;

    const stepResults: FunnelStepResult[] = sortedSteps.map((step, index) => {
      const entries = stepCounts[index] ?? 0;
      const nextEntries = stepCounts[index + 1] ?? 0;
      const dropoffs = index < sortedSteps.length - 1 ? entries - nextEntries : 0;
      const conversionRate = firstStepCount > 0 ? (entries / firstStepCount) * 100 : 0;

      return {
        order: step.order,
        name: step.name,
        entries,
        dropoffs,
        conversionRate: Math.round(conversionRate * 100) / 100,
      };
    });

    const overallConversionRate =
      firstStepCount > 0 ? (lastStepCount / firstStepCount) * 100 : 0;

    const result = await this.repository.createResult(
      input.funnelId,
      input.periodStart,
      input.periodEnd,
      stepResults,
      firstStepCount,
      lastStepCount,
      Math.round(overallConversionRate * 100) / 100,
    );

    const cacheKey = FUNNEL_CACHE_KEYS.results(
      input.funnelId,
      `${input.periodStart.toISOString()}-${input.periodEnd.toISOString()}`,
    );
    const redis = getRedisClient();
    await redis.del(cacheKey);

    logger.info(
      { funnelId: input.funnelId, totalEntries: firstStepCount, totalCompletions: lastStepCount },
      'Funnel computation completed',
    );

    return FunnelMapper.toResultResponse(result);
  }

  async getFunnelResults(
    funnelId: string,
    filters: { periodStart?: Date; periodEnd?: Date; limit?: number },
  ): Promise<FunnelResultResponse[]> {
    const funnel = await this.repository.findById(funnelId);

    if (!funnel) {
      throw new AppError(FUNNEL_ERRORS.NOT_FOUND, 404);
    }

    const cacheKey = FUNNEL_CACHE_KEYS.results(funnelId, JSON.stringify(filters));
    const redis = getRedisClient();
    const cached = await redis.get(cacheKey);

    if (cached) {
      return JSON.parse(cached) as FunnelResultResponse[];
    }

    const results = await this.repository.findResults(funnelId, filters);
    const responses = results.map(FunnelMapper.toResultResponse);

    await redis.setex(cacheKey, String(FUNNEL_CACHE_TTL.RESULTS), JSON.stringify(responses));

    return responses;
  }

  private async invalidateFunnelCache(id: string): Promise<void> {
    const redis = getRedisClient();
    await Promise.all([
      redis.del(FUNNEL_CACHE_KEYS.funnel(id)),
      redis.del(FUNNEL_CACHE_KEYS.allFunnels()),
    ]);
  }

  private async invalidateFunnelListCache(): Promise<void> {
    const redis = getRedisClient();
    await redis.del(FUNNEL_CACHE_KEYS.allFunnels());
  }
}