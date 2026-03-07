import { HttpClient } from '../utils/http';
import { PaginatedResponse } from '../types/api.types';

interface Pricing {
  id: string;
  productId: string;
  price: number;
  currency: string;
  createdAt: string;
  updatedAt: string;
}

interface CreatePricingRequest {
  productId: string;
  price: number;
  currency: string;
  startDate?: string;
  endDate?: string;
  [key: string]: any;
}

interface UpdatePricingRequest {
  price?: number;
  currency?: string;
  startDate?: string;
  endDate?: string;
  [key: string]: any;
}

interface PricingFilters {
  productId?: string;
  currency?: string;
  status?: string;
  startDate?: string;
  endDate?: string;
}

export class PricingService {
  constructor(private HttpClient: HttpClient) {}

  async getPricing(params?: PricingFilters & {
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }): Promise<PaginatedResponse<Pricing[]>> {
    return this.HttpClient.get<PaginatedResponse<Pricing[]>>('/pricing', { params });
  }

  async getPricingItem(pricingId: string): Promise<Pricing> {
    return this.HttpClient.get<Pricing>(`/pricing/${pricingId}`);
  }

  async getProductPricing(productId: string): Promise<Pricing[]> {
    return this.HttpClient.get<Pricing[]>(`/pricing/product/${productId}`);
  }

  async createPricing(pricingData: CreatePricingRequest): Promise<Pricing> {
    return this.HttpClient.post<Pricing>('/pricing', pricingData);
  }

  async updatePricing(pricingId: string, updateData: UpdatePricingRequest): Promise<Pricing> {
    return this.HttpClient.put<Pricing>(`/pricing/${pricingId}`, updateData);
  }

  async deletePricing(pricingId: string): Promise<void> {
    return this.HttpClient.delete<void>(`/pricing/${pricingId}`);
  }

  async getPriceRules(params?: {
    page?: number;
    limit?: number;
    type?: 'DISCOUNT' | 'SURCHARGE' | 'TIERED' | 'BULK';
    status?: 'ACTIVE' | 'INACTIVE' | 'SCHEDULED';
  }): Promise<PaginatedResponse<Array<{
    id: string;
    name: string;
    description?: string;
    type: 'DISCOUNT' | 'SURCHARGE' | 'TIERED' | 'BULK';
    conditions: Array<{
      field: string;
      operator: string;
      value: any;
    }>;
    actions: Array<{
      type: string;
      value: any;
    }>;
    priority: number;
    status: 'ACTIVE' | 'INACTIVE' | 'SCHEDULED';
    startDate?: string;
    endDate?: string;
    createdAt: string;
  }>>> {
    return this.HttpClient.get<PaginatedResponse<any[]>>('/pricing/rules', { params });
  }

  async getPriceRule(ruleId: string): Promise<{
    id: string;
    name: string;
    description?: string;
    type: 'DISCOUNT' | 'SURCHARGE' | 'TIERED' | 'BULK';
    conditions: Array<{
      field: string;
      operator: string;
      value: any;
    }>;
    actions: Array<{
      type: string;
      value: any;
    }>;
    priority: number;
    status: 'ACTIVE' | 'INACTIVE' | 'SCHEDULED';
    startDate?: string;
    endDate?: string;
    createdAt: string;
    updatedAt: string;
  }> {
    return this.HttpClient.get<any>(`/pricing/rules/${ruleId}`);
  }

  async createPriceRule(ruleData: {
    name: string;
    description?: string;
    type: 'DISCOUNT' | 'SURCHARGE' | 'TIERED' | 'BULK';
    conditions: Array<{
      field: string;
      operator: string;
      value: any;
    }>;
    actions: Array<{
      type: string;
      value: any;
    }>;
    priority?: number;
    startDate?: string;
    endDate?: string;
  }): Promise<any> {
    return this.HttpClient.post<any>('/pricing/rules', ruleData);
  }

  async updatePriceRule(ruleId: string, updateData: {
    name?: string;
    description?: string;
    conditions?: Array<{
      field: string;
      operator: string;
      value: any;
    }>;
    actions?: Array<{
      type: string;
      value: any;
    }>;
    priority?: number;
    status?: 'ACTIVE' | 'INACTIVE' | 'SCHEDULED';
    startDate?: string;
    endDate?: string;
  }): Promise<any> {
    return this.HttpClient.put<any>(`/pricing/rules/${ruleId}`, updateData);
  }

  async deletePriceRule(ruleId: string): Promise<void> {
    return this.HttpClient.delete<void>(`/pricing/rules/${ruleId}`);
  }

  async calculatePrice(params: {
    productId: string;
    quantity?: number;
    customerId?: string;
    locationId?: string;
    date?: string;
    context?: Record<string, any>;
  }): Promise<{
    basePrice: number;
    finalPrice: number;
    currency: string;
    discounts: Array<{
      id: string;
      name: string;
      type: 'PERCENTAGE' | 'FIXED' | 'TIERED';
      value: number;
      amount: number;
    }>;
    surcharges: Array<{
      id: string;
      name: string;
      type: 'PERCENTAGE' | 'FIXED';
      value: number;
      amount: number;
    }>;
    totalDiscount: number;
    totalSurcharge: number;
    appliedRules: Array<{
      ruleId: string;
      ruleName: string;
      priority: number;
    }>;
    validUntil?: string;
  }> {
    return this.HttpClient.post<any>('/pricing/calculate', params);
  }

  async bulkCalculatePrices(requests: Array<{
    productId: string;
    quantity?: number;
    customerId?: string;
    locationId?: string;
    date?: string;
    context?: Record<string, any>;
  }>): Promise<Array<{
    productId: string;
    basePrice: number;
    finalPrice: number;
    currency: string;
    discounts: any[];
    surcharges: any[];
    totalDiscount: number;
    totalSurcharge: number;
  }>> {
    return this.HttpClient.post<any[]>('/pricing/bulk-calculate', { requests });
  }

  async getPriceHistory(productId: string, params?: {
    startDate?: string;
    endDate?: string;
    page?: number;
    limit?: number;
  }): Promise<PaginatedResponse<Array<{
    id: string;
    productId: string;
    price: number;
    currency: string;
    reason: string;
    changedBy: string;
    createdAt: string;
  }>>> {
    return this.HttpClient.get<PaginatedResponse<any[]>>(`/pricing/history/${productId}`, { params });
  }

  async getPriceChanges(params?: {
    page?: number;
    limit?: number;
    productId?: string;
    reason?: string;
    startDate?: string;
    endDate?: string;
  }): Promise<PaginatedResponse<Array<{
    id: string;
    productId: string;
    productName: string;
    oldPrice: number;
    newPrice: number;
    change: number;
    changePercent: number;
    reason: string;
    changedBy: string;
    createdAt: string;
  }>>> {
    return this.HttpClient.get<PaginatedResponse<any[]>>('/pricing/changes', { params });
  }

  async comparePrices(productId: string, params?: {
    competitorIds?: string[];
    locationIds?: string[];
    date?: string;
  }): Promise<{
    productId: string;
    productName: string;
    ourPrice: number;
    competitors: Array<{
      competitorId: string;
      competitorName: string;
      price: number;
      difference: number;
      differencePercent: number;
      lastUpdated: string;
    }>;
    locations: Array<{
      locationId: string;
      locationName: string;
      price: number;
      difference: number;
      differencePercent: number;
    }>;
    marketAverage: number;
    marketPosition: 'LOWEST' | 'BELOW_AVERAGE' | 'AVERAGE' | 'ABOVE_AVERAGE' | 'HIGHEST';
  }> {
    return this.HttpClient.get<any>(`/pricing/compare/${productId}`, { params });
  }

  async getPriceRecommendations(productId: string, params?: {
    strategy?: 'COMPETITIVE' | 'VALUE_BASED' | 'COST_PLUS' | 'DYNAMIC';
    targetMargin?: number;
    marketPosition?: 'LEADER' | 'FOLLOWER' | 'CHALLENGER';
  }): Promise<{
    productId: string;
    productName: string;
    currentPrice: number;
    recommendedPrice: number;
    strategy: string;
    reasoning: string;
    factors: Array<{
      factor: string;
      impact: number;
      description: string;
    }>;
    competitors: Array<{
      name: string;
      price: number;
      position: string;
    }>;
    confidence: number;
    validUntil: string;
  }> {
    return this.HttpClient.get<any>(`/pricing/recommendations/${productId}`, { params });
  }

  async getBulkPriceRecommendations(params: {
    productIds: string[];
    strategy?: 'COMPETITIVE' | 'VALUE_BASED' | 'COST_PLUS' | 'DYNAMIC';
    targetMargin?: number;
    marketPosition?: 'LEADER' | 'FOLLOWER' | 'CHALLENGER';
  }): Promise<Array<{
    productId: string;
    productName: string;
    currentPrice: number;
    recommendedPrice: number;
    strategy: string;
    reasoning: string;
    confidence: number;
  }>> {
    return this.HttpClient.post<any[]>('/pricing/bulk-recommendations', params);
  }

  async getPricingAnalytics(params?: {
    startDate?: string;
    endDate?: string;
    productId?: string;
    categoryId?: string;
    locationId?: string;
  }): Promise<{
    totalRevenue: number;
    averagePrice: number;
    priceRange: {
      min: number;
      max: number;
      median: number;
    };
    priceDistribution: Array<{
      range: string;
      count: number;
      revenue: number;
    }>;
    priceTrends: Array<{
      date: string;
      averagePrice: number;
      revenue: number;
      unitsSold: number;
    }>;
    priceElasticity: {
      elasticity: number;
      interpretation: string;
    };
    competitorAnalysis: Array<{
      competitorId: string;
      competitorName: string;
      averagePrice: number;
      marketShare: number;
      pricePosition: string;
    }>;
  }> {
    return this.HttpClient.get<any>('/pricing/analytics', { params });
  }

  async getPriceElasticity(productId: string, params?: {
    startDate?: string;
    endDate?: string;
    granularity?: 'DAILY' | 'WEEKLY' | 'MONTHLY';
  }): Promise<{
    productId: string;
    elasticity: number;
    interpretation: string;
    dataPoints: Array<{
      date: string;
      price: number;
      quantity: number;
      revenue: number;
    }>;
    calculation: {
      method: string;
      confidence: number;
      sampleSize: number;
    };
  }> {
    return this.HttpClient.get<any>(`/pricing/elasticity/${productId}`, { params });
  }

  async optimizePrices(params: {
    productIds: string[];
    objective: 'MAXIMIZE_REVENUE' | 'MAXIMIZE_PROFIT' | 'MAXIMIZE_VOLUME' | 'BALANCED';
    constraints?: {
      minMargin?: number;
      maxPrice?: number;
      minPrice?: number;
      budget?: number;
    };
    timeHorizon?: number;
  }): Promise<{
    optimizationId: string;
    status: 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED';
    results?: Array<{
      productId: string;
      currentPrice: number;
      optimizedPrice: number;
      expectedRevenue: number;
      expectedProfit: number;
      expectedVolume: number;
      improvement: {
        revenue: number;
        profit: number;
        volume: number;
      };
    }>;
    summary?: {
      totalRevenue: number;
      totalProfit: number;
      totalVolume: number;
      improvement: {
        revenue: number;
        profit: number;
        volume: number;
      };
    };
  }> {
    return this.HttpClient.post<any>('/pricing/optimize', params);
  }

  async getOptimizationResults(optimizationId: string): Promise<{
    optimizationId: string;
    status: 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED';
    results: Array<{
      productId: string;
      currentPrice: number;
      optimizedPrice: number;
      expectedRevenue: number;
      expectedProfit: number;
      expectedVolume: number;
      improvement: {
        revenue: number;
        profit: number;
        volume: number;
      };
    }>;
    summary: {
      totalRevenue: number;
      totalProfit: number;
      totalVolume: number;
      improvement: {
        revenue: number;
        profit: number;
        volume: number;
      };
    };
    completedAt?: string;
    error?: string;
  }> {
    return this.HttpClient.get<any>(`/pricing/optimize/${optimizationId}`);
  }

  async getPriceAlerts(params?: {
    page?: number;
    limit?: number;
    type?: 'COMPETITOR_PRICE_CHANGE' | 'RECOMMENDATION' | 'ELASTICITY_CHANGE';
    severity?: 'LOW' | 'MEDIUM' | 'HIGH';
    acknowledged?: boolean;
  }): Promise<PaginatedResponse<Array<{
    id: string;
    type: string;
    severity: 'LOW' | 'MEDIUM' | 'HIGH';
    productId: string;
    productName: string;
    message: string;
    data: any;
    createdAt: string;
    acknowledgedAt?: string;
  }>>> {
    return this.HttpClient.get<PaginatedResponse<any[]>>('/pricing/alerts', { params });
  }

  async acknowledgePriceAlert(alertId: string): Promise<void> {
    return this.HttpClient.post<void>(`/pricing/alerts/${alertId}/acknowledge`);
  }

  async exportPricing(params?: {
    format?: 'csv' | 'excel' | 'json';
    includeHistory?: boolean;
    includeRules?: boolean;
    productId?: string;
    categoryId?: string;
  }): Promise<Blob> {
    return this.HttpClient.get<Blob>('/pricing/export', {
      params,
      responseType: 'blob',
    });
  }

  async importPricing(file: File, options?: {
    overwrite?: boolean;
    createMissing?: boolean;
    validateProducts?: boolean;
    updateHistory?: boolean;
  }): Promise<{
    imported: number;
    updated: number;
    skipped: number;
    errors: Array<{
      row: number;
      error: string;
      data: any;
    }>;
  }> {
    const formData = new FormData();
    formData.append('file', file);

    if (options) {
      Object.entries(options).forEach(([key, value]) => {
        formData.append(key, value.toString());
      });
    }

    return this.HttpClient.post<any>('/pricing/import', formData);
  }

  async validatePricing(pricingData: CreatePricingRequest): Promise<{
    valid: boolean;
    errors?: string[];
    warnings?: string[];
    conflicts?: Array<{
      ruleId: string;
      ruleName: string;
      conflict: string;
      recommendation: string;
    }>;
  }> {
    return this.HttpClient.post<any>('/pricing/validate', pricingData);
  }

  async getPricingSettings(): Promise<{
    defaultCurrency: string;
    taxIncluded: boolean;
    roundingMethod: 'UP' | 'DOWN' | 'NEAREST';
    decimalPlaces: number;
    enableDynamicPricing: boolean;
    priceUpdateFrequency: number;
    competitorTracking: boolean;
    alertThresholds: {
      priceChange: number;
      competitorPriceDifference: number;
      elasticityChange: number;
    };
  }> {
    return this.HttpClient.get<any>('/pricing/settings');
  }

  async updatePricingSettings(settings: {
    defaultCurrency?: string;
    taxIncluded?: boolean;
    roundingMethod?: 'UP' | 'DOWN' | 'NEAREST';
    decimalPlaces?: number;
    enableDynamicPricing?: boolean;
    priceUpdateFrequency?: number;
    competitorTracking?: boolean;
    alertThresholds?: {
      priceChange?: number;
      competitorPriceDifference?: number;
      elasticityChange?: number;
    };
  }): Promise<any> {
    return this.HttpClient.put<any>('/pricing/settings', settings);
  }
}