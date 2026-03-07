import { v4 as uuidv4 } from 'uuid';

interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

interface PaginatedResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  error?: string;
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

interface Event {
  id: string;
  userId?: string;
  sessionId?: string;
  event: string;
  category: string;
  action?: string;
  label?: string;
  value?: number;
  properties?: any;
  timestamp: Date;
  userAgent?: string;
  ip?: string;
  referrer?: string;
  url?: string;
}

interface Dashboard {
  id: string;
  name: string;
  description?: string;
  widgets: Widget[];
  isActive: boolean;
  isPublic: boolean;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

interface Widget {
  id: string;
  dashboardId: string;
  type: 'LINE_CHART' | 'BAR_CHART' | 'PIE_CHART' | 'NUMBER' | 'TABLE' | 'GAUGE';
  title: string;
  description?: string;
  query: any;
  config: any;
  position: { x: number; y: number; w: number; h: number };
  refreshInterval?: number;
  createdAt: Date;
  updatedAt: Date;
}

interface Funnel {
  id: string;
  name: string;
  description?: string;
  steps: FunnelStep[];
  isActive: boolean;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

interface FunnelStep {
  id: string;
  name: string;
  event: string;
  condition?: any;
  order: number;
}

interface GetEventsParams {
  page: number;
  limit: number;
  filters: {
    userId?: string;
    event?: string;
    category?: string;
    startDate?: Date;
    endDate?: Date;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  };
}

interface GetDashboardsParams {
  page: number;
  limit: number;
  filters: {
    active?: boolean;
    search?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  };
}

interface GetWidgetsParams {
  page: number;
  limit: number;
  filters: {
    dashboardId?: string;
    type?: string;
    search?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  };
}

interface GetFunnelsParams {
  page: number;
  limit: number;
  filters: {
    active?: boolean;
    search?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  };
}

interface EventMetricsParams {
  event?: string;
  category?: string;
  startDate: Date;
  endDate: Date;
  groupBy: 'hour' | 'day' | 'week' | 'month';
}

interface OverviewStatsParams {
  startDate: Date;
  endDate: Date;
}

export class AnalyticsService {
  private events: Event[] = [];
  private dashboards: Dashboard[] = [];
  private widgets: Widget[] = [];
  private funnels: Funnel[] = [];

  constructor() {
    this.initializeMockData();
  }

  async trackEvent(eventData: Omit<Event, 'id' | 'timestamp'>): Promise<ApiResponse<Event>> {
    try {
      const event: Event = {
        id: uuidv4(),
        ...eventData,
        timestamp: new Date(),
      };

      this.events.push(event);

      return {
        success: true,
        data: event,
      };
    } catch (error) {
      console.error('Track event error:', error);
      return {
        success: false,
        message: 'Failed to track event',
        error: 'TRACK_EVENT_FAILED',
      };
    }
  }

  async getEvents(params: GetEventsParams): Promise<PaginatedResponse<Event[]>> {
    try {
      let filteredEvents = [...this.events];

      if (params.filters.userId) {
        filteredEvents = filteredEvents.filter(e => e.userId === params.filters.userId);
      }

      if (params.filters.event) {
        filteredEvents = filteredEvents.filter(e => e.event === params.filters.event);
      }

      if (params.filters.category) {
        filteredEvents = filteredEvents.filter(e => e.category === params.filters.category);
      }

      if (params.filters.startDate) {
        filteredEvents = filteredEvents.filter(e => e.timestamp >= params.filters.startDate!);
      }

      if (params.filters.endDate) {
        filteredEvents = filteredEvents.filter(e => e.timestamp <= params.filters.endDate!);
      }

      const sortBy = params.filters.sortBy || 'timestamp';
      const sortOrder = params.filters.sortOrder || 'desc';

      filteredEvents.sort((a, b) => {
        let aValue: any = a[sortBy as keyof Event];
        let bValue: any = b[sortBy as keyof Event];

        if (aValue instanceof Date) {
          aValue = aValue.getTime();
          bValue = (bValue as Date).getTime();
        }

        if (sortOrder === 'asc') {
          return aValue > bValue ? 1 : aValue < bValue ? -1 : 0;
        } else {
          return aValue < bValue ? 1 : aValue > bValue ? -1 : 0;
        }
      });

      const total = filteredEvents.length;
      const totalPages = Math.ceil(total / params.limit);
      const startIndex = (params.page - 1) * params.limit;
      const endIndex = startIndex + params.limit;
      const paginatedEvents = filteredEvents.slice(startIndex, endIndex);

      return {
        success: true,
        data: paginatedEvents,
        pagination: {
          page: params.page,
          limit: params.limit,
          total,
          totalPages,
          hasNext: params.page < totalPages,
          hasPrev: params.page > 1,
        },
      };
    } catch (error) {
      console.error('Get events error:', error);
      return {
        success: false,
        data: [],
        message: 'Failed to fetch events',
        error: 'GET_EVENTS_FAILED',
        pagination: { page: 1, limit: params.limit, total: 0, totalPages: 0, hasNext: false, hasPrev: false },
      };
    }
  }

  async getEventMetrics(params: EventMetricsParams): Promise<ApiResponse<any>> {
    try {
      let filteredEvents = [...this.events];

      filteredEvents = filteredEvents.filter(e =>
        e.timestamp >= params.startDate && e.timestamp <= params.endDate
      );

      if (params.event) {
        filteredEvents = filteredEvents.filter(e => e.event === params.event);
      }

      if (params.category) {
        filteredEvents = filteredEvents.filter(e => e.category === params.category);
      }

      const groupedData = this.groupEventsByTime(filteredEvents, params.groupBy);

      return {
        success: true,
        data: {
          metrics: groupedData,
          totalEvents: filteredEvents.length,
          uniqueUsers: new Set(filteredEvents.map(e => e.userId).filter(Boolean)).size,
          dateRange: {
            start: params.startDate,
            end: params.endDate,
          },
        },
      };
    } catch (error) {
      console.error('Get event metrics error:', error);
      return {
        success: false,
        message: 'Failed to fetch event metrics',
        error: 'GET_EVENT_METRICS_FAILED',
      };
    }
  }

  async getDashboard(id: string): Promise<ApiResponse<Dashboard>> {
    try {
      const dashboard = this.dashboards.find(d => d.id === id);

      if (!dashboard) {
        return {
          success: false,
          message: 'Dashboard not found',
          error: 'DASHBOARD_NOT_FOUND',
        };
      }

      const dashboardWidgets = this.widgets.filter(w => w.dashboardId === id);

      return {
        success: true,
        data: {
          ...dashboard,
          widgets: dashboardWidgets,
        },
      };
    } catch (error) {
      console.error('Get dashboard error:', error);
      return {
        success: false,
        message: 'Failed to fetch dashboard',
        error: 'GET_DASHBOARD_FAILED',
      };
    }
  }

  async getDashboards(params: GetDashboardsParams): Promise<PaginatedResponse<Dashboard[]>> {
    try {
      let filteredDashboards = [...this.dashboards];

      if (params.filters.active !== undefined) {
        filteredDashboards = filteredDashboards.filter(d => d.isActive === params.filters.active);
      }

      if (params.filters.search) {
        const searchTerm = params.filters.search.toLowerCase();
        filteredDashboards = filteredDashboards.filter(d =>
          d.name.toLowerCase().includes(searchTerm) ||
          d.description?.toLowerCase().includes(searchTerm)
        );
      }

      const sortBy = params.filters.sortBy || 'createdAt';
      const sortOrder = params.filters.sortOrder || 'desc';

      filteredDashboards.sort((a, b) => {
        let aValue: any = a[sortBy as keyof Dashboard];
        let bValue: any = b[sortBy as keyof Dashboard];

        if (aValue instanceof Date) {
          aValue = aValue.getTime();
          bValue = (bValue as Date).getTime();
        }

        if (sortOrder === 'asc') {
          return aValue > bValue ? 1 : aValue < bValue ? -1 : 0;
        } else {
          return aValue < bValue ? 1 : aValue > bValue ? -1 : 0;
        }
      });

      const total = filteredDashboards.length;
      const totalPages = Math.ceil(total / params.limit);
      const startIndex = (params.page - 1) * params.limit;
      const endIndex = startIndex + params.limit;
      const paginatedDashboards = filteredDashboards.slice(startIndex, endIndex);

      return {
        success: true,
        data: paginatedDashboards,
        pagination: {
          page: params.page,
          limit: params.limit,
          total,
          totalPages,
          hasNext: params.page < totalPages,
          hasPrev: params.page > 1,
        },
      };
    } catch (error) {
      console.error('Get dashboards error:', error);
      return {
        success: false,
        data: [],
        message: 'Failed to fetch dashboards',
        error: 'GET_DASHBOARDS_FAILED',
        pagination: { page: 1, limit: params.limit, total: 0, totalPages: 0, hasNext: false, hasPrev: false },
      };
    }
  }

  async createDashboard(dashboardData: Omit<Dashboard, 'id' | 'createdAt' | 'updatedAt'>): Promise<ApiResponse<Dashboard>> {
    try {
      const dashboard: Dashboard = {
        id: uuidv4(),
        ...dashboardData,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      this.dashboards.push(dashboard);

      return {
        success: true,
        data: dashboard,
      };
    } catch (error) {
      console.error('Create dashboard error:', error);
      return {
        success: false,
        message: 'Failed to create dashboard',
        error: 'CREATE_DASHBOARD_FAILED',
      };
    }
  }

  async updateDashboard(id: string, dashboardData: Partial<Omit<Dashboard, 'id' | 'createdAt' | 'updatedAt'>>): Promise<ApiResponse<Dashboard>> {
    try {
      const dashboardIndex = this.dashboards.findIndex(d => d.id === id);

      if (dashboardIndex === -1) {
        return {
          success: false,
          message: 'Dashboard not found',
          error: 'DASHBOARD_NOT_FOUND',
        };
      }

      const updatedDashboard: Dashboard = {
        ...this.dashboards[dashboardIndex],
        ...dashboardData,
        updatedAt: new Date(),
      };

      this.dashboards[dashboardIndex] = updatedDashboard;

      return {
        success: true,
        data: updatedDashboard,
      };
    } catch (error) {
      console.error('Update dashboard error:', error);
      return {
        success: false,
        message: 'Failed to update dashboard',
        error: 'UPDATE_DASHBOARD_FAILED',
      };
    }
  }

  async getWidget(id: string): Promise<ApiResponse<Widget>> {
    try {
      const widget = this.widgets.find(w => w.id === id);

      if (!widget) {
        return {
          success: false,
          message: 'Widget not found',
          error: 'WIDGET_NOT_FOUND',
        };
      }

      return {
        success: true,
        data: widget,
      };
    } catch (error) {
      console.error('Get widget error:', error);
      return {
        success: false,
        message: 'Failed to fetch widget',
        error: 'GET_WIDGET_FAILED',
      };
    }
  }

  async getWidgets(params: GetWidgetsParams): Promise<PaginatedResponse<Widget[]>> {
    try {
      let filteredWidgets = [...this.widgets];

      if (params.filters.dashboardId) {
        filteredWidgets = filteredWidgets.filter(w => w.dashboardId === params.filters.dashboardId);
      }

      if (params.filters.type) {
        filteredWidgets = filteredWidgets.filter(w => w.type === params.filters.type);
      }

      if (params.filters.search) {
        const searchTerm = params.filters.search.toLowerCase();
        filteredWidgets = filteredWidgets.filter(w =>
          w.title.toLowerCase().includes(searchTerm) ||
          w.description?.toLowerCase().includes(searchTerm)
        );
      }

      const sortBy = params.filters.sortBy || 'createdAt';
      const sortOrder = params.filters.sortOrder || 'desc';

      filteredWidgets.sort((a, b) => {
        let aValue: any = a[sortBy as keyof Widget];
        let bValue: any = b[sortBy as keyof Widget];

        if (aValue instanceof Date) {
          aValue = aValue.getTime();
          bValue = (bValue as Date).getTime();
        }

        if (sortOrder === 'asc') {
          return aValue > bValue ? 1 : aValue < bValue ? -1 : 0;
        } else {
          return aValue < bValue ? 1 : aValue > bValue ? -1 : 0;
        }
      });

      const total = filteredWidgets.length;
      const totalPages = Math.ceil(total / params.limit);
      const startIndex = (params.page - 1) * params.limit;
      const endIndex = startIndex + params.limit;
      const paginatedWidgets = filteredWidgets.slice(startIndex, endIndex);

      return {
        success: true,
        data: paginatedWidgets,
        pagination: {
          page: params.page,
          limit: params.limit,
          total,
          totalPages,
          hasNext: params.page < totalPages,
          hasPrev: params.page > 1,
        },
      };
    } catch (error) {
      console.error('Get widgets error:', error);
      return {
        success: false,
        data: [],
        message: 'Failed to fetch widgets',
        error: 'GET_WIDGETS_FAILED',
        pagination: { page: 1, limit: params.limit, total: 0, totalPages: 0, hasNext: false, hasPrev: false },
      };
    }
  }

  async createWidget(widgetData: Omit<Widget, 'id' | 'createdAt' | 'updatedAt'>): Promise<ApiResponse<Widget>> {
    try {
      const widget: Widget = {
        id: uuidv4(),
        ...widgetData,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      this.widgets.push(widget);

      return {
        success: true,
        data: widget,
      };
    } catch (error) {
      console.error('Create widget error:', error);
      return {
        success: false,
        message: 'Failed to create widget',
        error: 'CREATE_WIDGET_FAILED',
      };
    }
  }

  async updateWidget(id: string, widgetData: Partial<Omit<Widget, 'id' | 'createdAt' | 'updatedAt'>>): Promise<ApiResponse<Widget>> {
    try {
      const widgetIndex = this.widgets.findIndex(w => w.id === id);

      if (widgetIndex === -1) {
        return {
          success: false,
          message: 'Widget not found',
          error: 'WIDGET_NOT_FOUND',
        };
      }

      const updatedWidget: Widget = {
        ...this.widgets[widgetIndex],
        ...widgetData,
        updatedAt: new Date(),
      };

      this.widgets[widgetIndex] = updatedWidget;

      return {
        success: true,
        data: updatedWidget,
      };
    } catch (error) {
      console.error('Update widget error:', error);
      return {
        success: false,
        message: 'Failed to update widget',
        error: 'UPDATE_WIDGET_FAILED',
      };
    }
  }

  async getFunnel(id: string): Promise<ApiResponse<Funnel>> {
    try {
      const funnel = this.funnels.find(f => f.id === id);

      if (!funnel) {
        return {
          success: false,
          message: 'Funnel not found',
          error: 'FUNNEL_NOT_FOUND',
        };
      }

      const funnelMetrics = this.calculateFunnelMetrics(funnel);

      return {
        success: true,
        data: {
          ...funnel,
          metrics: funnelMetrics,
        } as any,
      };
    } catch (error) {
      console.error('Get funnel error:', error);
      return {
        success: false,
        message: 'Failed to fetch funnel',
        error: 'GET_FUNNEL_FAILED',
      };
    }
  }

  async getFunnels(params: GetFunnelsParams): Promise<PaginatedResponse<Funnel[]>> {
    try {
      let filteredFunnels = [...this.funnels];

      if (params.filters.active !== undefined) {
        filteredFunnels = filteredFunnels.filter(f => f.isActive === params.filters.active);
      }

      if (params.filters.search) {
        const searchTerm = params.filters.search.toLowerCase();
        filteredFunnels = filteredFunnels.filter(f =>
          f.name.toLowerCase().includes(searchTerm) ||
          f.description?.toLowerCase().includes(searchTerm)
        );
      }

      const sortBy = params.filters.sortBy || 'createdAt';
      const sortOrder = params.filters.sortOrder || 'desc';

      filteredFunnels.sort((a, b) => {
        let aValue: any = a[sortBy as keyof Funnel];
        let bValue: any = b[sortBy as keyof Funnel];

        if (aValue instanceof Date) {
          aValue = aValue.getTime();
          bValue = (bValue as Date).getTime();
        }

        if (sortOrder === 'asc') {
          return aValue > bValue ? 1 : aValue < bValue ? -1 : 0;
        } else {
          return aValue < bValue ? 1 : aValue > bValue ? -1 : 0;
        }
      });

      const total = filteredFunnels.length;
      const totalPages = Math.ceil(total / params.limit);
      const startIndex = (params.page - 1) * params.limit;
      const endIndex = startIndex + params.limit;
      const paginatedFunnels = filteredFunnels.slice(startIndex, endIndex);

      return {
        success: true,
        data: paginatedFunnels,
        pagination: {
          page: params.page,
          limit: params.limit,
          total,
          totalPages,
          hasNext: params.page < totalPages,
          hasPrev: params.page > 1,
        },
      };
    } catch (error) {
      console.error('Get funnels error:', error);
      return {
        success: false,
        data: [],
        message: 'Failed to fetch funnels',
        error: 'GET_FUNNELS_FAILED',
        pagination: { page: 1, limit: params.limit, total: 0, totalPages: 0, hasNext: false, hasPrev: false },
      };
    }
  }

  async getRealTimeStats(): Promise<ApiResponse<any>> {
    try {
      const now = new Date();
      const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
      const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

      const lastHourEvents = this.events.filter(e => e.timestamp >= oneHourAgo);
      const lastDayEvents = this.events.filter(e => e.timestamp >= oneDayAgo);

      return {
        success: true,
        data: {
          eventsLastHour: lastHourEvents.length,
          eventsLastDay: lastDayEvents.length,
          activeUsers: new Set(lastHourEvents.map(e => e.userId).filter(Boolean)).size,
          topEvents: this.getTopEvents(lastHourEvents, 5),
          conversionRate: this.calculateConversionRate(lastDayEvents),
        },
      };
    } catch (error) {
      console.error('Get real-time stats error:', error);
      return {
        success: false,
        message: 'Failed to fetch real-time stats',
        error: 'GET_REAL_TIME_STATS_FAILED',
      };
    }
  }

  async getOverviewStats(params: OverviewStatsParams): Promise<ApiResponse<any>> {
    try {
      const filteredEvents = this.events.filter(e =>
        e.timestamp >= params.startDate && e.timestamp <= params.endDate
      );

      const uniqueUsers = new Set(filteredEvents.map(e => e.userId).filter(Boolean)).size;
      const pageViews = filteredEvents.filter(e => e.event === 'page_view').length;
      const sessions = new Set(filteredEvents.map(e => e.sessionId).filter(Boolean)).size;

      return {
        success: true,
        data: {
          totalEvents: filteredEvents.length,
          uniqueUsers,
          pageViews,
          sessions,
          avgEventsPerSession: sessions > 0 ? filteredEvents.length / sessions : 0,
          topPages: this.getTopPages(filteredEvents, 10),
          topEvents: this.getTopEvents(filteredEvents, 10),
          userGrowth: this.calculateUserGrowth(filteredEvents),
        },
      };
    } catch (error) {
      console.error('Get overview stats error:', error);
      return {
        success: false,
        message: 'Failed to fetch overview stats',
        error: 'GET_OVERVIEW_STATS_FAILED',
      };
    }
  }

  private groupEventsByTime(events: Event[], groupBy: 'hour' | 'day' | 'week' | 'month'): any[] {
    const grouped: Record<string, number> = {};

    events.forEach(event => {
      const date = new Date(event.timestamp);
      let key: string;

      switch (groupBy) {
        case 'hour':
          key = `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}-${date.getHours()}`;
          break;
        case 'day':
          key = `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
          break;
        case 'week':
          const weekStart = new Date(date.setDate(date.getDate() - date.getDay()));
          key = `${weekStart.getFullYear()}-W${Math.ceil(weekStart.getDate() / 7)}`;
          break;
        case 'month':
          key = `${date.getFullYear()}-${date.getMonth() + 1}`;
          break;
      }

      grouped[key] = (grouped[key] || 0) + 1;
    });

    return Object.entries(grouped).map(([timestamp, count]) => ({
      timestamp,
      count,
    }));
  }

  private calculateFunnelMetrics(funnel: Funnel): any {
    const metrics = funnel.steps.map(step => {
      const stepEvents = this.events.filter(e => e.event === step.event);
      const uniqueUsers = new Set(stepEvents.map(e => e.userId).filter(Boolean)).size;

      return {
        stepId: step.id,
        stepName: step.name,
        event: step.event,
        users: uniqueUsers,
        conversionRate: 0,
      };
    });

    if (metrics.length > 0) {
      const firstStepUsers = metrics[0].users;
      metrics.forEach(metric => {
        metric.conversionRate = firstStepUsers > 0 ? (metric.users / firstStepUsers) * 100 : 0;
      });
    }

    return {
      totalUsers: metrics.length > 0 ? metrics[0].users : 0,
      steps: metrics,
      overallConversionRate: metrics.length > 1 ? metrics[metrics.length - 1].conversionRate : 100,
    };
  }

  private getTopEvents(events: Event[], limit: number): any[] {
    const eventCounts: Record<string, number> = {};

    events.forEach(event => {
      eventCounts[event.event] = (eventCounts[event.event] || 0) + 1;
    });

    return Object.entries(eventCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, limit)
      .map(([event, count]) => ({ event, count }));
  }

  private getTopPages(events: Event[], limit: number): any[] {
    const pageViews = events.filter(e => e.event === 'page_view' && e.url);
    const pageCounts: Record<string, number> = {};

    pageViews.forEach(event => {
      if (event.url) {
        pageCounts[event.url] = (pageCounts[event.url] || 0) + 1;
      }
    });

    return Object.entries(pageCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, limit)
      .map(([url, count]) => ({ url, count }));
  }

  private calculateConversionRate(events: Event[]): number {
    const purchaseEvents = events.filter(e => e.event === 'purchase').length;
    const sessionStartEvents = events.filter(e => e.event === 'session_start').length;

    return sessionStartEvents > 0 ? (purchaseEvents / sessionStartEvents) * 100 : 0;
  }

  private calculateUserGrowth(events: Event[]): any {
    const usersByDate: Record<string, Set<string>> = {};

    events.forEach(event => {
      if (event.userId) {
        const date = event.timestamp.toISOString().split('T')[0];
        if (!usersByDate[date]) {
          usersByDate[date] = new Set();
        }
        usersByDate[date].add(event.userId);
      }
    });

    return Object.entries(usersByDate)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, users]) => ({
        date,
        newUsers: users.size,
      }));
  }

  private initializeMockData(): void {
    this.dashboards = [
      {
        id: uuidv4(),
        name: 'E-commerce Dashboard',
        description: 'Overview of e-commerce metrics',
        widgets: [],
        isActive: true,
        isPublic: true,
        createdBy: 'user-1',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    this.widgets = [
      {
        id: uuidv4(),
        dashboardId: this.dashboards[0].id,
        type: 'NUMBER',
        title: 'Total Revenue',
        query: { event: 'purchase', aggregation: 'sum', field: 'value' },
        config: { format: 'currency', currency: 'GBP' },
        position: { x: 0, y: 0, w: 4, h: 2 },
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    this.funnels = [
      {
        id: uuidv4(),
        name: 'Purchase Funnel',
        description: 'User journey from visit to purchase',
        steps: [
          { id: uuidv4(), name: 'Visit', event: 'page_view', order: 1 },
          { id: uuidv4(), name: 'Add to Cart', event: 'add_to_cart', order: 2 },
          { id: uuidv4(), name: 'Purchase', event: 'purchase', order: 3 },
        ],
        isActive: true,
        createdBy: 'user-1',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    this.events = [
      {
        id: uuidv4(),
        userId: 'user-1',
        sessionId: 'session-1',
        event: 'page_view',
        category: 'engagement',
        url: '/products/kitchen-cabinets',
        timestamp: new Date(),
        userAgent: 'Mozilla/5.0...',
        ip: '192.168.1.1',
      },
      {
        id: uuidv4(),
        userId: 'user-1',
        sessionId: 'session-1',
        event: 'add_to_cart',
        category: 'ecommerce',
        properties: { productId: 'product-1', price: 2499.99 },
        timestamp: new Date(),
      },
    ];
  }
}