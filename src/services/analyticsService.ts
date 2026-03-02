import { analyticsClient } from "@/lib/api-client";
import type { ApiResponse } from "@/lib/api-client";

export const analyticsService = {
  getOverview: (params?: Record<string, unknown>) =>
    analyticsClient.getOverview(params),

  getTracking: (params?: Record<string, unknown>) =>
    analyticsClient.getTracking(params),

  getRevenueStats: (params: {
    startDate: string;
    endDate: string;
    groupBy?: "day" | "week" | "month";
  }): Promise<ApiResponse<{ date: string; revenue: number; orders: number }[]>> =>
    analyticsClient.getRevenue(params),

  getOrderStats: (params: {
    startDate: string;
    endDate: string;
    groupBy?: "day" | "week" | "month";
  }): Promise<ApiResponse<{ date: string; count: number; status: string }[]>> =>
    analyticsClient.getOrders(params),

  getAppointmentStats: (params: {
    startDate: string;
    endDate: string;
  }): Promise<ApiResponse<{
    total: number;
    byType: Record<string, number>;
    byStatus: Record<string, number>;
  }>> =>
    analyticsClient.getAppointments(params),

  getCustomerStats: (params: {
    startDate: string;
    endDate: string;
  }): Promise<ApiResponse<{
    newCustomers: number;
    returningCustomers: number;
    topCustomers: { id: string; name: string; totalSpend: number }[];
  }>> =>
    analyticsClient.getCustomers(params),
};