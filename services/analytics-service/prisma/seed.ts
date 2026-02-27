import { PrismaClient } from '@prisma/client';

// ─── Local enum definitions ───────────────────────────────────────────────────
// These enums don't exist in the generated Prisma client yet because the models
// haven't been added to schema.prisma. Once you add them and run:
//   npx prisma migrate dev --name add_analytics_models
// Replace these with: import { EventType, FunnelStatus, DashboardType, MetricPeriod, MetricAggregation } from '@prisma/client';

const EventType = {
  PAGE_VIEW:            'PAGE_VIEW',
  APPOINTMENT_START:    'APPOINTMENT_START',
  APPOINTMENT_COMPLETE: 'APPOINTMENT_COMPLETE',
  BROCHURE_REQUEST:     'BROCHURE_REQUEST',
  PRODUCT_VIEW:         'PRODUCT_VIEW',
  FORM_SUBMIT:          'FORM_SUBMIT',
  CTA_CLICK:            'CTA_CLICK',
  CUSTOM:               'CUSTOM',
} as const;

const FunnelStatus = {
  DRAFT:    'DRAFT',
  ACTIVE:   'ACTIVE',
  PAUSED:   'PAUSED',
  ARCHIVED: 'ARCHIVED',
} as const;

const DashboardType = {
  OVERVIEW: 'OVERVIEW',
  SALES:    'SALES',
  CUSTOM:   'CUSTOM',
} as const;

const MetricPeriod = {
  HOURLY:  'HOURLY',
  DAILY:   'DAILY',
  WEEKLY:  'WEEKLY',
  MONTHLY: 'MONTHLY',
} as const;

const MetricAggregation = {
  COUNT:  'COUNT',
  UNIQUE: 'UNIQUE',
  SUM:    'SUM',
  AVG:    'AVG',
  MIN:    'MIN',
  MAX:    'MAX',
} as const;

// ─────────────────────────────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = new PrismaClient() as unknown as Record<string, any> & PrismaClient;

// ─── Seed functions ───────────────────────────────────────────────────────────

async function seedTrackingConfigs(): Promise<void> {
  const configs = [
    {
      key:         'gtm',
      name:        'Google Tag Manager',
      description: 'GTM container tracking configuration',
      enabled:     true,
      config:      { containerId: 'GTM-XXXXXXX', environment: 'production' },
    },
    {
      key:         'google_search_console',
      name:        'Google Search Console',
      description: 'Search console verification and tracking',
      enabled:     true,
      config:      { verificationCode: '', sitemapUrl: '/sitemap.xml' },
    },
    {
      key:         'session_recording',
      name:        'Session Recording',
      description: 'Records user sessions for analysis',
      enabled:     false,
      config:      { sampleRate: 0.1, excludePaths: ['/admin', '/account'] },
    },
    {
      key:         'heatmap',
      name:        'Heatmap Tracking',
      description: 'Click and scroll heatmap tracking',
      enabled:     false,
      config:      { pages: ['/', '/kitchens', '/bedrooms'] },
    },
  ];

  for (const config of configs) {
    await db['trackingConfig'].upsert({
      where:  { key: config.key },
      update: {},
      create: config,
    });
  }
}

async function seedDashboards(): Promise<void> {
  const overviewDashboard = await db['dashboard'].upsert({
    where:  { id: 'dashboard-overview-default' },
    update: {},
    create: {
      id:          'dashboard-overview-default',
      name:        'Overview Dashboard',
      description: 'Main business overview dashboard',
      type:        DashboardType.OVERVIEW,
      isDefault:   true,
      createdBy:   'system',
      config: {
        refreshInterval: 300,
        dateRange:       '30d',
        timezone:        'Europe/London',
      },
    },
  });

  const widgets = [
    {
      dashboardId: overviewDashboard.id,
      title:       'Total Sessions',
      widgetType:  'metric_card',
      metricKey:   'sessions.total',
      config:      { format: 'number', comparison: 'previous_period' },
      position:    { x: 0, y: 0, w: 3, h: 2 },
    },
    {
      dashboardId: overviewDashboard.id,
      title:       'Unique Visitors',
      widgetType:  'metric_card',
      metricKey:   'visitors.unique',
      config:      { format: 'number', comparison: 'previous_period' },
      position:    { x: 3, y: 0, w: 3, h: 2 },
    },
    {
      dashboardId: overviewDashboard.id,
      title:       'Appointments Booked',
      widgetType:  'metric_card',
      metricKey:   'appointments.booked',
      config:      { format: 'number', comparison: 'previous_period' },
      position:    { x: 6, y: 0, w: 3, h: 2 },
    },
    {
      dashboardId: overviewDashboard.id,
      title:       'Brochure Requests',
      widgetType:  'metric_card',
      metricKey:   'brochures.requested',
      config:      { format: 'number', comparison: 'previous_period' },
      position:    { x: 9, y: 0, w: 3, h: 2 },
    },
    {
      dashboardId: overviewDashboard.id,
      title:       'Sessions Over Time',
      widgetType:  'line_chart',
      metricKey:   'sessions.daily',
      config:      { period: 'daily', days: 30 },
      position:    { x: 0, y: 2, w: 8, h: 4 },
    },
    {
      dashboardId: overviewDashboard.id,
      title:       'Traffic by Device',
      widgetType:  'pie_chart',
      metricKey:   'sessions.by_device',
      config:      {},
      position:    { x: 8, y: 2, w: 4, h: 4 },
    },
    {
      dashboardId: overviewDashboard.id,
      title:       'Top Pages',
      widgetType:  'table',
      metricKey:   'pageviews.top',
      config:      { limit: 10, columns: ['page', 'views', 'avg_time'] },
      position:    { x: 0, y: 6, w: 6, h: 4 },
    },
    {
      dashboardId: overviewDashboard.id,
      title:       'Traffic Sources',
      widgetType:  'bar_chart',
      metricKey:   'sessions.by_source',
      config:      {},
      position:    { x: 6, y: 6, w: 6, h: 4 },
    },
  ];

  for (const widget of widgets) {
    await db['dashboardWidget'].create({ data: widget });
  }

  await db['dashboard'].upsert({
    where:  { id: 'dashboard-sales-default' },
    update: {},
    create: {
      id:          'dashboard-sales-default',
      name:        'Sales & Appointments Dashboard',
      description: 'Sales pipeline and appointment tracking',
      type:        DashboardType.SALES,
      isDefault:   false,
      createdBy:   'system',
      config: {
        refreshInterval: 600,
        dateRange:       '7d',
        timezone:        'Europe/London',
      },
    },
  });
}

async function seedFunnels(): Promise<void> {
  const funnels = [
    {
      id:          'funnel-appointment-booking',
      name:        'Appointment Booking Funnel',
      description: 'Tracks user journey through the appointment booking flow',
      status:      FunnelStatus.ACTIVE,
      createdBy:   'system',
      steps: [
        { order: 1, name: 'View Appointment Page',    eventType: EventType.PAGE_VIEW,            page:    '/book-appointment'   },
        { order: 2, name: 'Select Appointment Type',  eventType: EventType.APPOINTMENT_START                                   },
        { order: 3, name: 'Enter Customer Details',   eventType: EventType.FORM_SUBMIT,          formId:  'appointment-details' },
        { order: 4, name: 'Select Time Slot',         eventType: EventType.CUSTOM,               eventName: 'slot_selected'    },
        { order: 5, name: 'Appointment Confirmed',    eventType: EventType.APPOINTMENT_COMPLETE                                },
      ],
    },
    {
      id:          'funnel-brochure-request',
      name:        'Brochure Request Funnel',
      description: 'Tracks brochure request conversion flow',
      status:      FunnelStatus.ACTIVE,
      createdBy:   'system',
      steps: [
        { order: 1, name: 'View Brochure Page', eventType: EventType.PAGE_VIEW,      page:      '/brochure-request'    },
        { order: 2, name: 'Start Form',         eventType: EventType.CUSTOM,         eventName: 'brochure_form_start'  },
        { order: 3, name: 'Submit Request',     eventType: EventType.BROCHURE_REQUEST                                  },
      ],
    },
    {
      id:          'funnel-product-discovery',
      name:        'Product Discovery Funnel',
      description: 'Tracks product browsing to consultation conversion',
      status:      FunnelStatus.ACTIVE,
      createdBy:   'system',
      steps: [
        { order: 1, name: 'View Product List',      eventType: EventType.PAGE_VIEW,            page:  '/kitchens'          },
        { order: 2, name: 'View Product Detail',    eventType: EventType.PRODUCT_VIEW                                     },
        { order: 3, name: 'Click Consultation CTA', eventType: EventType.CTA_CLICK,            ctaId: 'book-consultation'  },
        { order: 4, name: 'Complete Appointment',   eventType: EventType.APPOINTMENT_COMPLETE                              },
      ],
    },
  ];

  for (const funnel of funnels) {
    await db['funnel'].upsert({
      where:  { id: funnel.id },
      update: {},
      create: funnel,
    });
  }
}

async function seedMetricSnapshots(): Promise<void> {
  const now = new Date();

  const metrics = [
    { metricKey: 'sessions.total',        period: MetricPeriod.DAILY, value: 245,  aggregation: MetricAggregation.COUNT  },
    { metricKey: 'visitors.unique',        period: MetricPeriod.DAILY, value: 198,  aggregation: MetricAggregation.UNIQUE },
    { metricKey: 'pageviews.total',        period: MetricPeriod.DAILY, value: 876,  aggregation: MetricAggregation.COUNT  },
    { metricKey: 'appointments.booked',    period: MetricPeriod.DAILY, value: 12,   aggregation: MetricAggregation.COUNT  },
    { metricKey: 'brochures.requested',    period: MetricPeriod.DAILY, value: 7,    aggregation: MetricAggregation.COUNT  },
    { metricKey: 'bounce_rate',            period: MetricPeriod.DAILY, value: 42.5, aggregation: MetricAggregation.AVG    },
    { metricKey: 'avg_session_duration',   period: MetricPeriod.DAILY, value: 187,  aggregation: MetricAggregation.AVG    },
  ];

  const dayStart = new Date(now);
  dayStart.setHours(0, 0, 0, 0);
  const dayEnd = new Date(now);
  dayEnd.setHours(23, 59, 59, 999);

  for (const metric of metrics) {
    await db['metricSnapshot'].upsert({
      where: {
        metricKey_period_periodStart_periodEnd: {
          metricKey:   metric.metricKey,
          period:      metric.period,
          periodStart: dayStart,
          periodEnd:   dayEnd,
        },
      },
      update: { value: metric.value },
      create: {
        metricKey:   metric.metricKey,
        period:      metric.period,
        periodStart: dayStart,
        periodEnd:   dayEnd,
        value:       metric.value,
        aggregation: metric.aggregation,
        dimensions:  {},
      },
    });
  }
}

async function main(): Promise<void> {
  console.log('Seeding analytics-service database...');

  await seedTrackingConfigs();
  console.log('Tracking configs seeded.');

  await seedDashboards();
  console.log('Dashboards and widgets seeded.');

  await seedFunnels();
  console.log('Funnels seeded.');

  await seedMetricSnapshots();
  console.log('Metric snapshots seeded.');

  console.log('Analytics-service database seeding completed.');
}

main()
  .catch((error) => {
    console.error('Seeding failed:', error);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });