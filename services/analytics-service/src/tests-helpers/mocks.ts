import type { Response, NextFunction } from 'express';

export function makeMockPrisma() {
  const mockGroupBy    = jest.fn();
  const mockAggregate  = jest.fn();
  const mockFindMany   = jest.fn();
  const mockFindFirst  = jest.fn();
  const mockFindUnique = jest.fn();
  const mockCount      = jest.fn();
  const mockCreate     = jest.fn();
  const mockUpdate     = jest.fn();
  const mockDelete     = jest.fn();
  const mockUpdateMany = jest.fn();

  const makeModel = () => ({
    findMany:   mockFindMany,
    findFirst:  mockFindFirst,
    findUnique: mockFindUnique,
    count:      mockCount,
    create:     mockCreate,
    update:     mockUpdate,
    delete:     mockDelete,
    updateMany: mockUpdateMany,
    aggregate:  mockAggregate,
    groupBy:    mockGroupBy,
  });

  return {
    notification:             makeModel(),
    deliveryReport:           makeModel(),
    notificationTemplate:     makeModel(),
    notificationProvider:     makeModel(),
    notificationSubscription: makeModel(),
    notificationPreference:   makeModel(),
    notificationLog:          makeModel(),
    campaign:                 makeModel(),
    retryPolicy:              makeModel(),
    webhookEvent:             makeModel(),
    $transaction:             jest.fn((fn: (tx: unknown) => unknown) => fn({})),
    $disconnect:              jest.fn().mockResolvedValue(undefined),
    $connect:                 jest.fn().mockResolvedValue(undefined),
    $queryRaw:                jest.fn(),
    $executeRaw:              jest.fn(),
  };
}

export type MockPrisma = ReturnType<typeof makeMockPrisma>;

export function makeMockRedis() {
  return {
    get:         jest.fn(),
    set:         jest.fn(),
    setex:       jest.fn(),
    del:         jest.fn(),
    exists:      jest.fn(),
    incr:        jest.fn(),
    expire:      jest.fn(),
    ttl:         jest.fn(),
    keys:        jest.fn(),
    hget:        jest.fn(),
    hset:        jest.fn(),
    hgetall:     jest.fn(),
    hdel:        jest.fn(),
    pipeline:    jest.fn().mockReturnThis(),
    exec:        jest.fn(),
    publish:     jest.fn(),
    subscribe:   jest.fn(),
    quit:        jest.fn().mockResolvedValue('OK'),
    ping:        jest.fn().mockResolvedValue('PONG'),
    flushall:    jest.fn().mockResolvedValue('OK'),
    scan:        jest.fn().mockResolvedValue(['0', []]),
  };
}

export type MockRedis = ReturnType<typeof makeMockRedis>;

export function makeMockLogger() {
  return {
    info:  jest.fn(),
    warn:  jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
    trace: jest.fn(),
    fatal: jest.fn(),
    child: jest.fn().mockReturnThis(),
  };
}

export type MockLogger = ReturnType<typeof makeMockLogger>;

export function makeMockQueue() {
  return {
    add:              jest.fn(),
    addBulk:          jest.fn(),
    getJob:           jest.fn(),
    getJobs:          jest.fn(),
    getJobCounts:     jest.fn(),
    pause:            jest.fn(),
    resume:           jest.fn(),
    drain:            jest.fn(),
    clean:            jest.fn(),
    obliterate:       jest.fn(),
    close:            jest.fn(),
    on:               jest.fn(),
    once:             jest.fn(),
    removeAllListeners: jest.fn(),
  };
}

export type MockQueue = ReturnType<typeof makeMockQueue>;

export function makeMockRequest(overrides: Record<string, any> = {}): any {
  return {
    params:  {},
    query:   {},
    body:    {},
    headers: {},
    method:  'GET',
    path:    '/',
    user:    { id: 'clxuser1000000000000000001', role: 'USER' },
    ...overrides,
  };
}

export function makeMockResponse(): {
  res:     Partial<Response>;
  status:  jest.Mock;
  json:    jest.Mock;
  send:    jest.Mock;
  set:     jest.Mock;
  end:     jest.Mock;
  download: jest.Mock;
} {
  const json     = jest.fn();
  const send     = jest.fn();
  const set      = jest.fn();
  const end      = jest.fn();
  const download = jest.fn();
  const status   = jest.fn().mockReturnValue({ json, send, end });

  return {
    res: { status, json, send, set, end, download } as unknown as Partial<Response>,
    status,
    json,
    send,
    set,
    end,
    download,
  };
}

export function makeMockNext(): jest.MockedFunction<NextFunction> {
  return jest.fn() as jest.MockedFunction<NextFunction>;
}

export function makeMockEventEmitter() {
  return {
    emit:              jest.fn(),
    on:                jest.fn(),
    once:              jest.fn(),
    off:               jest.fn(),
    removeListener:    jest.fn(),
    removeAllListeners: jest.fn(),
    listenerCount:     jest.fn().mockReturnValue(0),
  };
}

export function makeMockCacheService() {
  return {
    get:         jest.fn(),
    set:         jest.fn(),
    del:         jest.fn(),
    exists:      jest.fn(),
    getOrSet:    jest.fn(),
    invalidate:  jest.fn(),
    flush:       jest.fn(),
    ttl:         jest.fn(),
  };
}

export type MockCacheService = ReturnType<typeof makeMockCacheService>;

export function makeMockAnalyticsRepository() {
  return {
    getNotificationMetrics:   jest.fn(),
    getEngagementMetrics:     jest.fn(),
    getDashboardSummary:      jest.fn(),
    getChannelBreakdown:      jest.fn(),
    getCampaignStats:         jest.fn(),
    getProviderPerformance:   jest.fn(),
    getDeliveryFunnel:        jest.fn(),
    getEngagementTrend:       jest.fn(),
    getNotificationTrend:     jest.fn(),
    getRealTimeStats:         jest.fn(),
    getTopTemplates:          jest.fn(),
    getTopCampaigns:          jest.fn(),
    getRetentionData:         jest.fn(),
  };
}

export type MockAnalyticsRepository = ReturnType<typeof makeMockAnalyticsRepository>;

export function makeMockExportService() {
  return {
    requestExport:   jest.fn(),
    getExportStatus: jest.fn(),
    generateCsv:     jest.fn(),
    generateJson:    jest.fn(),
    generateXlsx:    jest.fn(),
  };
}

export function makeMockMetricsService() {
  return {
    getNotificationMetrics:   jest.fn(),
    getEngagementMetrics:     jest.fn(),
    getDashboardSummary:      jest.fn(),
    getChannelBreakdown:      jest.fn(),
    getProviderPerformance:   jest.fn(),
    getRealTimeStats:         jest.fn(),
  };
}

export function makeMockCampaignAnalyticsService() {
  return {
    getCampaignStats:  jest.fn(),
    getTopCampaigns:   jest.fn(),
    compareCampaigns:  jest.fn(),
  };
}