import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { exportService } from "@/services/exportService";
import type { ExportPayload } from "@/types/analytics.types";

export function useExports() {
  return useQuery({
    queryKey: ["exports"],
    queryFn: () => exportService.getAll(),
  });
}

export function useCreateExport() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: ExportPayload) => exportService.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["exports"] });
    },
  });
}