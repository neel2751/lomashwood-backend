import { FIXED_DATE, FIXED_RANGE_START, FIXED_RANGE_END, FIXED_IDS, FIXED_URLS } from './common.fixture';

export interface IFunnelDefinition {
  id:          string;
  name:        string;
  description: string;
  steps:       IFunnelStepDefinition[];
  isActive:    boolean;
  createdAt:   Date;
  updatedAt:   Date;
}

export interface IFunnelStepDefinition {
  order:        number;
  name:         string;
  eventName:    string;
  url?:         string;
  conditions?:  Record<string, unknown>;
}

export interface IFunnelAnalysis {
  funnelId:    string;
  funnelName:  string;
  dateRange:   { from: Date; to: Date };
  totalEntered: number;
  steps:       IFunnelAnalysisStep[];
  overallConversionRate: number;
  avgTimeToConvertSeconds: number | null;
}

export interface IFunnelAnalysisStep {
  order:           number;
  name:            string;
  entered:         number;
  completed:       number;
  dropped:         number;
  completionRate:  number;
  dropOffRate:     number;
  avgTimeSeconds:  number | null;
}

export const appointmentFunnelDefinitionFixture: IFunnelDefinition = {
  id:          FIXED_IDS.FUNNEL_1,
  name:        'Appointment Booking Funnel',
  description: 'Tracks user journey from homepage to confirmed appointment.',
  steps: [
    { order: 1, name: 'Viewed Kitchens Page',      eventName: 'Page Viewed',        url: FIXED_URLS.KITCHENS },
    { order: 2, name: 'Viewed Product',            eventName: 'Product Viewed'                               },
    { order: 3, name: 'Clicked Book Appointment',  eventName: 'Button Clicked',     conditions: { buttonId: 'cta-book-appointment' } },
    { order: 4, name: 'Viewed Booking Page',       eventName: 'Page Viewed',        url: FIXED_URLS.BOOKING  },
    { order: 5, name: 'Appointment Booked',        eventName: 'Appointment Booked'                           },
  ],
  isActive:  true,
  createdAt: FIXED_DATE,
  updatedAt: FIXED_DATE,
};

export const orderFunnelDefinitionFixture: IFunnelDefinition = {
  id:          'clxfunl20000000000000000002',
  name:        'Order Conversion Funnel',
  description: 'Tracks user journey from product view to completed order.',
  steps: [
    { order: 1, name: 'Product Viewed',    eventName: 'Product Viewed'  },
    { order: 2, name: 'Quote Requested',   eventName: 'Quote Requested' },
    { order: 3, name: 'Order Placed',      eventName: 'Order Placed'    },
  ],
  isActive:  true,
  createdAt: FIXED_DATE,
  updatedAt: FIXED_DATE,
};

export const appointmentFunnelAnalysisFixture: IFunnelAnalysis = {
  funnelId:    FIXED_IDS.FUNNEL_1,
  funnelName:  'Appointment Booking Funnel',
  dateRange:   { from: FIXED_RANGE_START, to: FIXED_RANGE_END },
  totalEntered: 1240,
  steps: [
    {
      order:          1,
      name:           'Viewed Kitchens Page',
      entered:        1240,
      completed:      890,
      dropped:        350,
      completionRate: 0.7177,
      dropOffRate:    0.2823,
      avgTimeSeconds: null,
    },
    {
      order:          2,
      name:           'Viewed Product',
      entered:        890,
      completed:      620,
      dropped:        270,
      completionRate: 0.6966,
      dropOffRate:    0.3034,
      avgTimeSeconds: 68,
    },
    {
      order:          3,
      name:           'Clicked Book Appointment',
      entered:        620,
      completed:      310,
      dropped:        310,
      completionRate: 0.5,
      dropOffRate:    0.5,
      avgTimeSeconds: 142,
    },
    {
      order:          4,
      name:           'Viewed Booking Page',
      entered:        310,
      completed:      280,
      dropped:        30,
      completionRate: 0.9032,
      dropOffRate:    0.0968,
      avgTimeSeconds: 12,
    },
    {
      order:          5,
      name:           'Appointment Booked',
      entered:        280,
      completed:      84,
      dropped:        196,
      completionRate: 0.3,
      dropOffRate:    0.7,
      avgTimeSeconds: 312,
    },
  ],
  overallConversionRate:    0.0677,
  avgTimeToConvertSeconds:  534,
};

export const orderFunnelAnalysisFixture: IFunnelAnalysis = {
  funnelId:    'clxfunl20000000000000000002',
  funnelName:  'Order Conversion Funnel',
  dateRange:   { from: FIXED_RANGE_START, to: FIXED_RANGE_END },
  totalEntered: 620,
  steps: [
    {
      order:          1,
      name:           'Product Viewed',
      entered:        620,
      completed:      180,
      dropped:        440,
      completionRate: 0.2903,
      dropOffRate:    0.7097,
      avgTimeSeconds: null,
    },
    {
      order:          2,
      name:           'Quote Requested',
      entered:        180,
      completed:      48,
      dropped:        132,
      completionRate: 0.2667,
      dropOffRate:    0.7333,
      avgTimeSeconds: 240,
    },
    {
      order:          3,
      name:           'Order Placed',
      entered:        48,
      completed:      8,
      dropped:        40,
      completionRate: 0.1667,
      dropOffRate:    0.8333,
      avgTimeSeconds: 1728000,
    },
  ],
  overallConversionRate:    0.0129,
  avgTimeToConvertSeconds:  1728480,
};

export const emptyFunnelAnalysisFixture: IFunnelAnalysis = {
  ...appointmentFunnelAnalysisFixture,
  funnelId:   'clxfunl30000000000000000003',
  totalEntered: 0,
  steps: appointmentFunnelAnalysisFixture.steps.map((s) => ({
    ...s,
    entered: 0, completed: 0, dropped: 0, completionRate: 0, dropOffRate: 0, avgTimeSeconds: null,
  })),
  overallConversionRate:    0,
  avgTimeToConvertSeconds:  null,
};

export const allFunnelDefinitionsFixture: IFunnelDefinition[] = [
  appointmentFunnelDefinitionFixture,
  orderFunnelDefinitionFixture,
];