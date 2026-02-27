import { getPrismaClient } from '../../infrastructure/db/prisma.client';
import type {
  TrackEventInput,
  StartSessionInput,
  EndSessionInput,
  TrackPageViewInput,
  CreateTrackingConfigInput,
  UpdateTrackingConfigInput,
  AnalyticsEventEntity,
  AnalyticsSessionEntity,
  PageViewEntity,
  TrackingConfigEntity,
} from './tracking.types';

const db = getPrismaClient() as any;

export class TrackingRepository {
  async createEvent(input: TrackEventInput): Promise<AnalyticsEventEntity> {
    return db.analyticsEvent.create({
      data: {
        sessionId:   input.sessionId,
        visitorId:   input.visitorId,
        userId:      input.userId,
        eventType:   input.eventType,
        eventName:   input.eventName,
        page:        input.page,
        referrer:    input.referrer,
        utmSource:   input.utmSource,
        utmMedium:   input.utmMedium,
        utmCampaign: input.utmCampaign,
        utmContent:  input.utmContent,
        utmTerm:     input.utmTerm,
        deviceType:  input.deviceType ?? 'UNKNOWN',
        browser:     input.browser,
        os:          input.os,
        country:     input.country,
        region:      input.region,
        city:        input.city,
        ipHash:      input.ipHash,
        properties:  input.properties ?? {},
        duration:    input.duration,
      },
    });
  }

  async createManyEvents(inputs: TrackEventInput[]): Promise<AnalyticsEventEntity[]> {
    const data = inputs.map((input) => ({
      sessionId:   input.sessionId,
      visitorId:   input.visitorId,
      userId:      input.userId      ?? null,
      eventType:   input.eventType,
      eventName:   input.eventName   ?? null,
      page:        input.page        ?? null,
      referrer:    input.referrer    ?? null,
      utmSource:   input.utmSource   ?? null,
      utmMedium:   input.utmMedium   ?? null,
      utmCampaign: input.utmCampaign ?? null,
      utmContent:  input.utmContent  ?? null,
      utmTerm:     input.utmTerm     ?? null,
      deviceType:  input.deviceType  ?? 'UNKNOWN',
      browser:     input.browser     ?? null,
      os:          input.os          ?? null,
      country:     input.country     ?? null,
      region:      input.region      ?? null,
      city:        input.city        ?? null,
      ipHash:      input.ipHash      ?? null,
      properties:  input.properties  ?? {},
      duration:    input.duration    ?? null,
    }));

    await db.analyticsEvent.createMany({ data, skipDuplicates: true });

    return db.analyticsEvent.findMany({
      where: {
        sessionId: { in: [...new Set(inputs.map((i) => i.sessionId))] },
        createdAt: { gte: new Date(Date.now() - 5000) },
      },
      orderBy: { createdAt: 'desc' },
      take:    inputs.length,
    });
  }

  async createSession(input: StartSessionInput): Promise<AnalyticsSessionEntity> {
    return db.analyticsSession.create({
      data: {
        visitorId:   input.visitorId,
        userId:      input.userId,
        deviceType:  input.deviceType ?? 'UNKNOWN',
        browser:     input.browser,
        os:          input.os,
        country:     input.country,
        region:      input.region,
        city:        input.city,
        ipHash:      input.ipHash,
        referrer:    input.referrer,
        landingPage: input.landingPage,
        utmSource:   input.utmSource,
        utmMedium:   input.utmMedium,
        utmCampaign: input.utmCampaign,
        properties:  input.properties ?? {},
      },
    });
  }

  async findSessionById(id: string): Promise<AnalyticsSessionEntity | null> {
    return db.analyticsSession.findUnique({ where: { id } });
  }

  async endSession(input: EndSessionInput): Promise<AnalyticsSessionEntity> {
    return db.analyticsSession.update({
      where: { id: input.sessionId },
      data: {
        endedAt:   new Date(),
        exitPage:  input.exitPage,
        duration:  input.duration,
        pageViews: input.pageViews,
        bounced:   input.bounced,
        converted: input.converted,
      },
    });
  }

  async incrementSessionPageViews(sessionId: string): Promise<void> {
    await db.analyticsSession.update({
      where: { id: sessionId },
      data:  { pageViews: { increment: 1 } },
    });
  }

  async createPageView(input: TrackPageViewInput): Promise<PageViewEntity> {
    return db.pageView.create({
      data: {
        sessionId:   input.sessionId,
        visitorId:   input.visitorId,
        userId:      input.userId,
        page:        input.page,
        title:       input.title,
        referrer:    input.referrer,
        deviceType:  input.deviceType ?? 'UNKNOWN',
        timeOnPage:  input.timeOnPage,
        scrollDepth: input.scrollDepth,
        country:     input.country,
      },
    });
  }

  async findTrackingConfigByKey(key: string): Promise<TrackingConfigEntity | null> {
    return db.trackingConfig.findUnique({ where: { key } });
  }

  async findAllTrackingConfigs(enabledOnly?: boolean): Promise<TrackingConfigEntity[]> {
    return db.trackingConfig.findMany({
      where:   enabledOnly ? { enabled: true } : undefined,
      orderBy: { createdAt: 'asc' },
    });
  }

  async createTrackingConfig(input: CreateTrackingConfigInput): Promise<TrackingConfigEntity> {
    return db.trackingConfig.create({
      data: {
        key:         input.key,
        name:        input.name,
        description: input.description,
        enabled:     input.enabled ?? true,
        config:      input.config ?? {},
      },
    });
  }

  async updateTrackingConfig(
    key: string,
    input: UpdateTrackingConfigInput,
  ): Promise<TrackingConfigEntity> {
    return db.trackingConfig.update({
      where: { key },
      data: {
        name:        input.name,
        description: input.description,
        enabled:     input.enabled,
        config:      input.config,
      },
    });
  }

  async deleteTrackingConfig(key: string): Promise<void> {
    await db.trackingConfig.delete({ where: { key } });
  }
}