import { useMutation, useQueryClient } from "@tanstack/react-query";
import { exportService } from "@/services/exportService";
import type { ExportFormat, ExportResource, ExportParams } from "@/types/analytics.types";

export function useCreateExport() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ resource, params }: { resource: ExportResource; params: ExportParams }) =>
      exportService.exportResource(resource, params),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["exports"] });
    },
  });
}

export function useExportAnalytics() {
  return useMutation({
    mutationFn: ({ startDate, endDate, format }: { startDate: string; endDate: string; format: ExportFormat }) =>
      exportService.exportAnalytics({ startDate, endDate, format }),
  });
}

export function useDownloadExport() {
  return useMutation({
    mutationFn: ({ resource, params }: { resource: ExportResource; params: ExportParams }) =>
      exportService.downloadExport(resource, params),
  });
}