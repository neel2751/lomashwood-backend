import { HttpClient } from '../utils/http';
import { PaginatedResponse } from '../types/api.types';

// ── Missing types (move to api.types.ts and re-export from there if preferred) ──

export interface Inventory {
  id: string;
  productId: string;
  productName?: string;
  locationId?: string;
  quantity: number;
  reservedQuantity: number;
  availableQuantity: number;
  costPrice?: number;
  sellPrice?: number;
  sku?: string;
  status: 'IN_STOCK' | 'LOW_STOCK' | 'OUT_OF_STOCK';
  createdAt: string;
  updatedAt?: string;
}

export interface CreateInventoryRequest {
  productId: string;
  locationId?: string;
  quantity: number;
  costPrice?: number;
  sellPrice?: number;
  sku?: string;
  lowStockThreshold?: number;
  reorderPoint?: number;
  reorderQuantity?: number;
}

export interface UpdateInventoryRequest {
  locationId?: string;
  quantity?: number;
  costPrice?: number;
  sellPrice?: number;
  sku?: string;
  lowStockThreshold?: number;
  reorderPoint?: number;
  reorderQuantity?: number;
}

export interface InventoryFilters {
  productId?: string;
  locationId?: string;
  categoryId?: string;
  status?: 'IN_STOCK' | 'LOW_STOCK' | 'OUT_OF_STOCK';
  search?: string;
  startDate?: string;
  endDate?: string;
}

// ── Service ───────────────────────────────────────────────────────────────────

export class InventoryService {
  constructor(private HttpClient: HttpClient) {}

  // ── Inventory Management ─────────────────────────────────────────────────────

  async getInventory(params?: InventoryFilters & {
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }): Promise<PaginatedResponse<Inventory[]>> {
    return this.HttpClient.get<PaginatedResponse<Inventory[]>>('/inventory', { params });
  }

  async getInventoryItem(inventoryId: string): Promise<Inventory> {
    return this.HttpClient.get<Inventory>(`/inventory/${inventoryId}`);
  }

  async getProductInventory(productId: string): Promise<Inventory[]> {
    return this.HttpClient.get<Inventory[]>(`/inventory/product/${productId}`);
  }

  async createInventory(inventoryData: CreateInventoryRequest): Promise<Inventory> {
    return this.HttpClient.post<Inventory>('/inventory', inventoryData);
  }

  async updateInventory(inventoryId: string, updateData: UpdateInventoryRequest): Promise<Inventory> {
    return this.HttpClient.put<Inventory>(`/inventory/${inventoryId}`, updateData);
  }

  async deleteInventory(inventoryId: string): Promise<void> {
    return this.HttpClient.delete<void>(`/inventory/${inventoryId}`);
  }

  // ── Stock Management ─────────────────────────────────────────────────────────

  async adjustStock(inventoryId: string, adjustment: {
    quantity: number;
    reason: string;
    type: 'MANUAL' | 'SALE' | 'RETURN' | 'DAMAGE' | 'LOSS' | 'CORRECTION';
    referenceId?: string;
    notes?: string;
  }): Promise<Inventory> {
    return this.HttpClient.post<Inventory>(`/inventory/${inventoryId}/adjust`, adjustment);
  }

  async bulkAdjustStock(adjustments: Array<{
    inventoryId: string;
    quantity: number;
    reason: string;
    type: 'MANUAL' | 'SALE' | 'RETURN' | 'DAMAGE' | 'LOSS' | 'CORRECTION';
    referenceId?: string;
    notes?: string;
  }>): Promise<Inventory[]> {
    return this.HttpClient.post<Inventory[]>('/inventory/bulk-adjust', { adjustments });
  }

  async reserveStock(inventoryId: string, reservation: {
    quantity: number;
    referenceId: string;
    expiresAt?: string;
    notes?: string;
  }): Promise<{
    reservationId: string;
    quantity: number;
    expiresAt?: string;
  }> {
    return this.HttpClient.post<any>(`/inventory/${inventoryId}/reserve`, reservation);
  }

  async releaseReservation(inventoryId: string, reservationId: string): Promise<void> {
    return this.HttpClient.post<void>(`/inventory/${inventoryId}/release/${reservationId}`);
  }

  async getReservations(inventoryId: string, params?: {
    page?: number;
    limit?: number;
    status?: 'ACTIVE' | 'EXPIRED' | 'RELEASED';
  }): Promise<PaginatedResponse<Array<{
    reservationId: string;
    quantity: number;
    referenceId: string;
    status: 'ACTIVE' | 'EXPIRED' | 'RELEASED';
    createdAt: string;
    expiresAt?: string;
    releasedAt?: string;
    notes?: string;
  }>>> {
    return this.HttpClient.get<PaginatedResponse<any[]>>(`/inventory/${inventoryId}/reservations`, { params });
  }

  // ── Stock Alerts ─────────────────────────────────────────────────────────────

  async getStockAlerts(params?: {
    page?: number;
    limit?: number;
    type?: 'LOW_STOCK' | 'OUT_OF_STOCK' | 'OVERSTOCK';
    severity?: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  }): Promise<PaginatedResponse<Array<{
    id: string;
    type: 'LOW_STOCK' | 'OUT_OF_STOCK' | 'OVERSTOCK';
    severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    inventoryId: string;
    productId: string;
    productName: string;
    currentStock: number;
    threshold: number;
    message: string;
    createdAt: string;
    acknowledgedAt?: string;
  }>>> {
    return this.HttpClient.get<PaginatedResponse<any[]>>('/inventory/alerts', { params });
  }

  async acknowledgeAlert(alertId: string): Promise<void> {
    return this.HttpClient.post<void>(`/inventory/alerts/${alertId}/acknowledge`);
  }

  async getStockThresholds(inventoryId: string): Promise<{
    lowStockThreshold: number;
    outOfStockThreshold: number;
    overstockThreshold: number;
    reorderPoint: number;
    reorderQuantity: number;
  }> {
    return this.HttpClient.get<any>(`/inventory/${inventoryId}/thresholds`);
  }

  async updateStockThresholds(inventoryId: string, thresholds: {
    lowStockThreshold?: number;
    outOfStockThreshold?: number;
    overstockThreshold?: number;
    reorderPoint?: number;
    reorderQuantity?: number;
  }): Promise<any> {
    return this.HttpClient.put<any>(`/inventory/${inventoryId}/thresholds`, thresholds);
  }

  // ── Inventory Analytics ──────────────────────────────────────────────────────

  async getInventoryAnalytics(params?: {
    startDate?: string;
    endDate?: string;
    productId?: string;
    locationId?: string;
  }): Promise<{
    totalProducts: number;
    totalValue: number;
    lowStockItems: number;
    outOfStockItems: number;
    overstockItems: number;
    turnoverRate: number;
    averageDaysInStock: number;
    stockMovement: Array<{
      date: string;
      in: number;
      out: number;
      adjustment: number;
    }>;
    topSelling: Array<{
      productId: string;
      productName: string;
      quantitySold: number;
      revenue: number;
      currentStock: number;
    }>;
    slowMoving: Array<{
      productId: string;
      productName: string;
      currentStock: number;
      daysInStock: number;
      lastSold: string;
    }>;
  }> {
    return this.HttpClient.get<any>('/inventory/analytics', { params });
  }

  async getInventoryMovement(inventoryId: string, params?: {
    startDate?: string;
    endDate?: string;
    type?: 'IN' | 'OUT' | 'ADJUSTMENT';
    page?: number;
    limit?: number;
  }): Promise<PaginatedResponse<Array<{
    id: string;
    type: 'IN' | 'OUT' | 'ADJUSTMENT';
    quantity: number;
    reason: string;
    referenceId?: string;
    notes?: string;
    createdAt: string;
    createdBy: string;
  }>>> {
    return this.HttpClient.get<PaginatedResponse<any[]>>(`/inventory/${inventoryId}/movement`, { params });
  }

  // ── Inventory Reports ────────────────────────────────────────────────────────

  async generateInventoryReport(params?: {
    type?: 'STOCK_LEVELS' | 'MOVEMENT' | 'VALUATION' | 'TURNOVER' | 'LOW_STOCK';
    startDate?: string;
    endDate?: string;
    format?: 'csv' | 'excel' | 'pdf';
    filters?: {
      productId?: string;
      locationId?: string;
      categoryId?: string;
    };
  }): Promise<Blob> {
    // responseType: 'blob' must be handled by the HttpClient interceptor;
    // pass only 2 args to stay within the HttpClient.post signature
    return this.HttpClient.post<Blob>('/inventory/reports', params);
  }

  async getInventoryValuation(params?: {
    method?: 'FIFO' | 'LIFO' | 'AVERAGE';
    locationId?: string;
    categoryId?: string;
  }): Promise<{
    totalValue: number;
    totalCost: number;
    totalProfit: number;
    byCategory: Array<{
      categoryId: string;
      categoryName: string;
      value: number;
      cost: number;
      profit: number;
      itemCount: number;
    }>;
    byLocation: Array<{
      locationId: string;
      locationName: string;
      value: number;
      cost: number;
      profit: number;
      itemCount: number;
    }>;
  }> {
    return this.HttpClient.get<any>('/inventory/valuation', { params });
  }

  // ── Inventory Locations ──────────────────────────────────────────────────────

  async getInventoryLocations(): Promise<Array<{
    id: string;
    name: string;
    code: string;
    address?: string;
    isActive: boolean;
    itemCount: number;
    totalValue: number;
  }>> {
    return this.HttpClient.get<any[]>('/inventory/locations');
  }

  async getLocationInventory(locationId: string, params?: {
    page?: number;
    limit?: number;
    productId?: string;
  }): Promise<PaginatedResponse<Inventory[]>> {
    return this.HttpClient.get<PaginatedResponse<Inventory[]>>(`/inventory/locations/${locationId}`, { params });
  }

  async transferStock(fromLocationId: string, toLocationId: string, transfer: {
    inventoryId: string;
    quantity: number;
    reason?: string;
    notes?: string;
  }): Promise<{
    transferId: string;
    status: 'PENDING' | 'IN_TRANSIT' | 'COMPLETED' | 'CANCELLED';
    estimatedArrival?: string;
  }> {
    return this.HttpClient.post<any>('/inventory/transfer', {
      fromLocationId,
      toLocationId,
      ...transfer,
    });
  }

  async getStockTransfers(params?: {
    page?: number;
    limit?: number;
    status?: 'PENDING' | 'IN_TRANSIT' | 'COMPLETED' | 'CANCELLED';
    fromLocationId?: string;
    toLocationId?: string;
  }): Promise<PaginatedResponse<Array<{
    transferId: string;
    fromLocationId: string;
    fromLocationName: string;
    toLocationId: string;
    toLocationName: string;
    inventoryId: string;
    productName: string;
    quantity: number;
    status: 'PENDING' | 'IN_TRANSIT' | 'COMPLETED' | 'CANCELLED';
    reason?: string;
    notes?: string;
    createdAt: string;
    completedAt?: string;
    estimatedArrival?: string;
  }>>> {
    return this.HttpClient.get<PaginatedResponse<any[]>>('/inventory/transfers', { params });
  }

  // ── Inventory Forecasting ────────────────────────────────────────────────────

  async getInventoryForecast(productId: string, params?: {
    period?: 'WEEK' | 'MONTH' | 'QUARTER';
    horizon?: number;
    method?: 'MOVING_AVERAGE' | 'EXPONENTIAL_SMOOTHING' | 'LINEAR_REGRESSION';
  }): Promise<{
    productId: string;
    productName: string;
    method: string;
    forecast: Array<{
      period: string;
      demand: number;
      confidence: number;
      recommendedStock: number;
      reorderPoint: number;
    }>;
    accuracy: number;
    lastUpdated: string;
  }> {
    return this.HttpClient.get<any>(`/inventory/forecast/${productId}`, { params });
  }

  async getReorderRecommendations(params?: {
    page?: number;
    limit?: number;
    priority?: 'HIGH' | 'MEDIUM' | 'LOW';
    locationId?: string;
  }): Promise<PaginatedResponse<Array<{
    productId: string;
    productName: string;
    currentStock: number;
    recommendedOrder: number;
    urgency: 'HIGH' | 'MEDIUM' | 'LOW';
    daysUntilStockout: number;
    leadTime: number;
    supplierId?: string;
    lastReorderDate?: string;
  }>>> {
    return this.HttpClient.get<PaginatedResponse<any[]>>('/inventory/reorder-recommendations', { params });
  }

  // ── Inventory Import / Export ────────────────────────────────────────────────

  async exportInventory(params?: {
    format?: 'csv' | 'excel' | 'json';
    includeHistory?: boolean;
    includeAnalytics?: boolean;
    locationId?: string;
    categoryId?: string;
  }): Promise<Blob> {
    return this.HttpClient.get<Blob>('/inventory/export', {
      params,
      responseType: 'blob',
    });
  }

  async importInventory(file: File, options?: {
    overwrite?: boolean;
    createMissing?: boolean;
    validateProducts?: boolean;
    locationId?: string;
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

    // Content-Type set automatically when passing FormData
    return this.HttpClient.post<any>('/inventory/import', formData);
  }

  // ── Inventory Search ─────────────────────────────────────────────────────────

  async searchInventory(query: string, params?: {
    page?: number;
    limit?: number;
    locationId?: string;
    categoryId?: string;
    stockStatus?: 'IN_STOCK' | 'LOW_STOCK' | 'OUT_OF_STOCK';
  }): Promise<PaginatedResponse<Inventory[]>> {
    return this.HttpClient.get<PaginatedResponse<Inventory[]>>('/inventory/search', {
      params: { q: query, ...params },
    });
  }

  // ── Inventory Settings ───────────────────────────────────────────────────────

  async getInventorySettings(): Promise<{
    defaultLocationId: string;
    enableReservations: boolean;
    reservationExpiryHours: number;
    enableAutoReorder: boolean;
    enableStockAlerts: boolean;
    alertEmails: string[];
    valuationMethod: 'FIFO' | 'LIFO' | 'AVERAGE';
    lowStockThreshold: number;
    outOfStockThreshold: number;
  }> {
    return this.HttpClient.get<any>('/inventory/settings');
  }

  async updateInventorySettings(settings: {
    defaultLocationId?: string;
    enableReservations?: boolean;
    reservationExpiryHours?: number;
    enableAutoReorder?: boolean;
    enableStockAlerts?: boolean;
    alertEmails?: string[];
    valuationMethod?: 'FIFO' | 'LIFO' | 'AVERAGE';
    lowStockThreshold?: number;
    outOfStockThreshold?: number;
  }): Promise<any> {
    return this.HttpClient.put<any>('/inventory/settings', settings);
  }

  // ── Inventory Audit ──────────────────────────────────────────────────────────

  async startInventoryAudit(params: {
    locationId?: string;
    categoryIds?: string[];
    productIds?: string[];
    scheduledDate?: string;
    notes?: string;
  }): Promise<{
    auditId: string;
    status: 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
    scheduledDate: string;
    itemCount: number;
  }> {
    return this.HttpClient.post<any>('/inventory/audit', params);
  }

  async getInventoryAudits(params?: {
    page?: number;
    limit?: number;
    status?: 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
    locationId?: string;
  }): Promise<PaginatedResponse<Array<{
    auditId: string;
    status: string;
    locationId?: string;
    locationName?: string;
    scheduledDate: string;
    completedDate?: string;
    itemCount: number;
    discrepancies: number;
    notes?: string;
  }>>> {
    return this.HttpClient.get<PaginatedResponse<any[]>>('/inventory/audits', { params });
  }

  async getInventoryAudit(auditId: string): Promise<{
    auditId: string;
    status: string;
    locationId?: string;
    locationName?: string;
    scheduledDate: string;
    completedDate?: string;
    itemCount: number;
    discrepancies: number;
    notes?: string;
    items: Array<{
      productId: string;
      productName: string;
      expectedQuantity: number;
      actualQuantity: number;
      discrepancy: number;
      notes?: string;
    }>;
  }> {
    return this.HttpClient.get<any>(`/inventory/audit/${auditId}`);
  }
}