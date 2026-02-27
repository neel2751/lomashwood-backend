import type {
  FunnelEntity,
  FunnelResultEntity,
  FunnelResponse,
  FunnelResultResponse,
  FunnelWithResultsResponse,
  FunnelStep,
  FunnelStepResult,
} from './funnel.types';

export class FunnelMapper {
  static toResponse(entity: FunnelEntity): FunnelResponse {
    return {
      id: entity.id,
      name: entity.name,
      description: entity.description,
      status: entity.status,
      steps: entity.steps as unknown as FunnelStep[],
      createdBy: entity.createdBy,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    };
  }

  static toResultResponse(entity: FunnelResultEntity): FunnelResultResponse {
    return {
      id: entity.id,
      funnelId: entity.funnelId,
      periodStart: entity.periodStart,
      periodEnd: entity.periodEnd,
      stepResults: entity.stepResults as unknown as FunnelStepResult[],
      totalEntries: entity.totalEntries,
      totalCompletions: entity.totalCompletions,
      conversionRate: Number(entity.conversionRate),
      computedAt: entity.computedAt,
    };
  }

  static toWithResultsResponse(
    entity: FunnelEntity,
    latestResult: FunnelResultEntity | null,
  ): FunnelWithResultsResponse {
    return {
      ...FunnelMapper.toResponse(entity),
      latestResult: latestResult ? FunnelMapper.toResultResponse(latestResult) : null,
    };
  }
}