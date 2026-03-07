export interface ApiResponse<T = any> {
    success: boolean;
    data?: T;
    message?: string;
    errors?: Array<{
        field: string;
        message: string;
    }>;
}
export interface PaginationParams {
    page?: number;
    limit?: number;
}
export interface SortParams {
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
}
export interface PaginatedResponse<T> {
    data: T[];
    pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
        hasNext: boolean;
        hasPrev: boolean;
    };
}
export interface FilterParams {
    search?: string;
    dateFrom?: string;
    dateTo?: string;
    status?: string;
    [key: string]: any;
}
export interface BaseEntity {
    id: string;
    createdAt: string;
    updatedAt: string;
}
export interface SoftDeleteEntity extends BaseEntity {
    deletedAt?: string;
    isActive: boolean;
}
export interface Timestamps {
    createdAt: string;
    updatedAt: string;
}
export interface ApiError {
    code: string;
    message: string;
    details?: any;
    timestamp: string;
    path: string;
}
export interface ValidationError {
    field: string;
    message: string;
    code?: string;
}
export interface FileUpload {
    fieldname: string;
    originalname: string;
    encoding: string;
    mimetype: string;
    size: number;
    destination: string;
    filename: string;
    path: string;
}
export interface UploadResponse {
    url: string;
    filename: string;
    size: number;
    mimetype: string;
}
export interface SearchRequest {
    query: string;
    filters?: Record<string, any>;
    sort?: SortParams;
    pagination?: PaginationParams;
}
export interface SearchResult<T> {
    items: T[];
    total: number;
    facets?: Record<string, Array<{
        value: string;
        count: number;
    }>>;
}
export interface ExportRequest {
    format: 'csv' | 'excel' | 'pdf';
    filters?: Record<string, any>;
    fields?: string[];
}
export interface ExportResponse {
    downloadUrl: string;
    filename: string;
    size: number;
    expiresAt: string;
}
export interface DashboardStats {
    total: number;
    growth: number;
    period: string;
}
export interface ChartData {
    labels: string[];
    datasets: Array<{
        label: string;
        data: number[];
        backgroundColor?: string;
        borderColor?: string;
    }>;
}
export interface NotificationChannel {
    type: 'email' | 'sms' | 'push' | 'in_app';
    enabled: boolean;
    settings?: Record<string, any>;
}
export interface NotificationTemplate {
    id: string;
    name: string;
    type: NotificationChannel['type'];
    subject?: string;
    content: string;
    variables: string[];
}
export interface AppConfig {
    name: string;
    version: string;
    environment: 'development' | 'staging' | 'production';
    features: Record<string, boolean>;
    limits: {
        uploadSize: number;
        apiRateLimit: number;
    };
}
export interface HealthCheck {
    status: 'healthy' | 'unhealthy' | 'degraded';
    timestamp: string;
    services: Record<string, {
        status: 'healthy' | 'unhealthy' | 'degraded';
        responseTime: number;
        error?: string;
    }>;
    uptime: number;
    version: string;
}
//# sourceMappingURL=api.types.d.ts.map