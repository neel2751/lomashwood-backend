import { useQuery } from "@tanstack/react-query";
import { analyticsService } from "@/services/analyticsService";
import type { AnalyticsFilters } from "@/types/analytics.types";

export function useAnalyticsOverview(filters?: AnalyticsFilters) {
  return useQuery({
    queryKey: ["analytics", "overview", filters],
    queryFn: () => analyticsService.getOverview(filters),
  });
}

export function useAnalyticsTracking(filters?: AnalyticsFilters) {
  return useQuery({
    queryKey: ["analytics", "tracking", filters],
    queryFn: () => analyticsService.getTracking(filters),
  });
}

export function useAnalyticsRevenue(filters?: AnalyticsFilters) {
  return useQuery({
    queryKey: ["analytics", "revenue", filters],
    queryFn: () => analyticsService.getRevenue(filters),
  });
}

export function useAnalyticsOrders(filters?: AnalyticsFilters) {
  return useQuery({
    queryKey: ["analytics", "orders", filters],
    queryFn: () => analyticsService.getOrders(filters),
  });
}

export function useAnalyticsAppointments(filters?: AnalyticsFilters) {
  return useQuery({
    queryKey: ["analytics", "appointments", filters],
    queryFn: () => analyticsService.getAppointments(filters),
  });
}

export function useAnalyticsCustomers(filters?: AnalyticsFilters) {
  return useQuery({
    queryKey: ["analytics", "customers", filters],
    queryFn: () => analyticsService.getCustomers(filters),
  });
}