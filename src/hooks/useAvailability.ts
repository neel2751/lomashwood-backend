import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { availabilityService } from "@/services/availabilityService";
import type { UpdateAvailabilityPayload } from "@/types/appointment.types";

export function useAvailability(consultantId?: string) {
  return useQuery({
    queryKey: ["availability", consultantId],
    queryFn: () => availabilityService.getAll(consultantId),
  });
}

export function useAvailabilityItem(id: string) {
  return useQuery({
    queryKey: ["availability", id],
    queryFn: () => availabilityService.getById(id),
    enabled: !!id,
  });
}

export function useUpdateAvailability() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateAvailabilityPayload }) =>
      availabilityService.update(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["availability"] });
    },
  });
}