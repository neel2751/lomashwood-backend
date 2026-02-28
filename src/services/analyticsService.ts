import { analyticsClient } from "@/lib/api-client";
import type { TrackingEvent, AnalyticsOverview } from "@/lib/api-client";
import { axiosInstance } from "@/lib/axios";
import type { ApiResponse, PaginatedResponse } from "@/lib/api-client";

export const analyticsService = {
  getOverview: (params?: Record<string, unknown>) =>
    analyticsClient.overview(params),

  getTracking: (params?: Record<string, unknown>) =>
    analyticsClient.tracking.getAll(params),

  getTrackingById: (id: string) => analyticsClient.tracking.getById(id),

  createTrackingEvent: (payload: Partial<TrackingEvent>) =>
    analyticsClient.tracking.create(payload),

  getRevenueStats: (params: {
    startDate: string;
    endDate: string;
    groupBy?: "day" | "week" | "month";
  }): Promise<ApiResponse<{ date: string; revenue: number; orders: number }[]>> =>
    axiosInstance
      .get("/analytics/revenue", { params })
      .then((r) => r.data),

  getOrderStats: (params: {
    startDate: string;
    endDate: string;
    groupBy?: "day" | "week" | "month";
  }): Promise<ApiResponse<{ date: string; count: number; status: string }[]>> =>
    axiosInstance
      .get("/analytics/orders", { params })
      .then((r) => r.data),

  getAppointmentStats: (params: {
    startDate: string;
    endDate: string;
  }): Promise<
    ApiResponse<{
      total: number;
      byType: Record<string, number>;
      byStatus: Record<string, number>;
    }>
  > =>
    axiosInstance
      .get("/analytics/appointments", { params })
      .then((r) => r.data),

  getCustomerStats: (params: {
    startDate: string;
    endDate: string;
  }): Promise<
    ApiResponse<{
      newCustomers: number;
      returningCustomers: number;
      topCustomers: { id: string; name: string; totalSpend: number }[];
    }>
  > =>
    axiosInstance
      .get("/analytics/customers", { params })
      .then((r) => r.data),

  getTopProducts: (params: {
    startDate: string;
    endDate: string;
    limit?: number;
  }): Promise<
    ApiResponse<{ productId: string; title: string; views: number; conversions: number }[]>
  > =>
    axiosInstance
      .get("/analytics/top-products", { params })
      .then((r) => r.data),

  getCohorts: (params: {
    startDate: string;
    endDate: string;
    period: "week" | "month";
  }): Promise<ApiResponse<Record<string, number>[]>> =>
    axiosInstance
      .get("/analytics/cohorts", { params })
      .then((r) => r.data),
};