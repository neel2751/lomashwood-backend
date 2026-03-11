import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { availabilityService } from "@/services/availabilityService";

import type { SetAvailabilityPayload, SetWeeklyAvailabilityPatternPayload } from "@/types/appointment.types";

export function useAvailability(consultantId?: string) {
  return useQuery({
    queryKey: ["availability", consultantId],
    queryFn: () =>
      availabilityService.getAll(
        consultantId ? { consultantId, includeBlocked: true } : { includeBlocked: true }
      ),
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
    mutationFn: (payload: SetAvailabilityPayload) => availabilityService.create(payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["availability"] });
      void queryClient.invalidateQueries({ queryKey: ["availability-slots"] });
    },
  });
}

export function useDeleteAvailability() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => availabilityService.remove(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["availability"] });
      void queryClient.invalidateQueries({ queryKey: ["availability-slots"] });
    },
  });
}

export function useAvailableSlots(date?: string, consultantId?: string) {
  return useQuery({
    queryKey: ["availability-slots", date, consultantId],
    queryFn: () => availabilityService.getSlots({ date: date || "", consultantId }),
    enabled: !!date,
  });
}

export function useWeeklyAvailabilityPattern(consultantId?: string) {
  return useQuery({
    queryKey: ["availability-weekly", consultantId],
    queryFn: () => availabilityService.getWeeklyPattern(consultantId ? { consultantId } : undefined),
  });
}

export function useUpdateWeeklyAvailabilityPattern() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: SetWeeklyAvailabilityPatternPayload) =>
      availabilityService.saveWeeklyPattern(payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["availability-weekly"] });
      void queryClient.invalidateQueries({ queryKey: ["availability-slots"] });
    },
  });
}