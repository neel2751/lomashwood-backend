import { useQuery } from "@tanstack/react-query";
import { analyticsService } from "@/services/analyticsService";
import type { DateRangeParams, GroupByPeriod, AnalyticsFilterParams } from "@/types/analytics.types";

type StatsFilterParams = DateRangeParams & { groupBy?: GroupByPeriod };

const DEFAULT_FILTERS: StatsFilterParams = {
  startDate: new Date(new Date().setDate(new Date().getDate() - 30))
    .toISOString()
    .split("T")[0] as string,
  endDate: new Date().toISOString().split("T")[0] as string,
  groupBy: "day",
};

export function useAnalyticsOverview(filters?: AnalyticsFilterParams) {
  return useQuery({
    queryKey: ["analytics", "overview", filters],
    queryFn: () => analyticsService.getOverview(filters),
  });
}

export function useAnalyticsTracking(filters?: AnalyticsFilterParams) {
  return useQuery({
    queryKey: ["analytics", "tracking", filters],
    queryFn: () => analyticsService.getTracking(filters),
  });
}

export function useAnalyticsRevenue(filters?: Partial<StatsFilterParams>) {
  const resolvedFilters: StatsFilterParams = { ...DEFAULT_FILTERS, ...filters };
  return useQuery({
    queryKey: ["analytics", "revenue", resolvedFilters],
    queryFn: () => analyticsService.getRevenueStats(resolvedFilters),
  });
}

export function useAnalyticsOrders(filters?: Partial<StatsFilterParams>) {
  const resolvedFilters: StatsFilterParams = { ...DEFAULT_FILTERS, ...filters };
  return useQuery({
    queryKey: ["analytics", "orders", resolvedFilters],
    queryFn: () => analyticsService.getOrderStats(resolvedFilters),
  });
}

export function useAnalyticsAppointments(filters?: Partial<DateRangeParams>) {
  const resolvedFilters: DateRangeParams = { ...DEFAULT_FILTERS, ...filters };
  return useQuery({
    queryKey: ["analytics", "appointments", resolvedFilters],
    queryFn: () => analyticsService.getAppointmentStats(resolvedFilters),
  });
}

export function useAnalyticsCustomers(filters?: Partial<DateRangeParams>) {
  const resolvedFilters: DateRangeParams = { ...DEFAULT_FILTERS, ...filters };
  return useQuery({
    queryKey: ["analytics", "customers", resolvedFilters],
    queryFn: () => analyticsService.getCustomerStats(resolvedFilters),
  });
}