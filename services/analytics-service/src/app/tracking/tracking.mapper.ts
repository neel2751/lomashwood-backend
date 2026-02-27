import type {
  AnalyticsEventEntity,
  AnalyticsSessionEntity,
  PageViewEntity,
  TrackingConfigEntity,
  TrackingEventResponse,
  SessionResponse,
  PageViewResponse,
  TrackingConfigResponse,
} from './tracking.types';

export class TrackingMapper {
  static toEventResponse(entity: AnalyticsEventEntity): TrackingEventResponse {
    return {
      id:        entity.id,
      sessionId: entity.sessionId,
      visitorId: entity.visitorId,
      eventType: entity.eventType,
      eventName: entity.eventName ?? null, 
      createdAt: entity.createdAt,
    };
  }

  static toSessionResponse(entity: AnalyticsSessionEntity): SessionResponse {
    return {
      id:         entity.id,
      visitorId:  entity.visitorId,
      userId:     entity.userId     ?? null,  
      startedAt:  entity.startedAt  ?? null, 
      endedAt:    entity.endedAt    ?? null,
      deviceType: (entity.deviceType ?? 'UNKNOWN') as SessionResponse['deviceType'],
      country:    entity.country    ?? null, 
    };
  }

  static toPageViewResponse(entity: PageViewEntity): PageViewResponse {
    return {
      id:        entity.id,
      sessionId: entity.sessionId,
      visitorId: entity.visitorId,
      page:      entity.page,
      createdAt: entity.createdAt,
    };
  }

  static toConfigResponse(entity: TrackingConfigEntity): TrackingConfigResponse {
    return {
      id:          entity.id,
      key:         entity.key,
      name:        entity.name,
      description: entity.description ?? null,
      enabled:     entity.enabled,
      config:      entity.config as Record<string, unknown>,
      createdAt:   entity.createdAt,
      updatedAt:   entity.updatedAt,
    };
  }
}