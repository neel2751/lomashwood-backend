import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { dashboardService } from "@/services/dashboardService";

import type { CreateDashboardPayload } from "@/types/analytics.types";

export function useDashboards() {
  return useQuery({
    queryKey: ["dashboards"],
    queryFn: () => dashboardService.getAll(),
  });
}

export function useDashboard(id: string) {
  return useQuery({
    queryKey: ["dashboards", id],
    queryFn: () => dashboardService.getById(id),
    enabled: !!id,
  });
}

export function useCreateDashboard() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateDashboardPayload) => dashboardService.create(payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["dashboards"] });
    },
  });
}

export function useUpdateDashboard() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: CreateDashboardPayload }) =>
      dashboardService.update(id, payload),
    onSuccess: (_data, { id }) => {
      void queryClient.invalidateQueries({ queryKey: ["dashboards"] });
      void queryClient.invalidateQueries({ queryKey: ["dashboards", id] });
    },
  });
}

export function useDeleteDashboard() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => dashboardService.remove(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["dashboards"] });
    },
  });
}