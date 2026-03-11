import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { reminderService } from "@/services/reminderService";
import { fetchWithAuth, buildQueryString } from "@/lib/fetch-client";

export function useReminders(appointmentId?: string) {
  return useQuery({
    queryKey: ["reminders", appointmentId],
    queryFn: () => fetchWithAuth(`/api/reminders${buildQueryString(appointmentId ? { appointmentId } : {})}`),
  });
}

export function useReminder(id: string) {
  return useQuery({
    queryKey: ["reminders", id],
    queryFn: () => fetchWithAuth(`/api/reminders/${id}`),
    enabled: !!id,
  });
}

export function useUpdateReminder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Record<string, unknown> }) =>
      reminderService.update(id, payload),
    onSuccess: (_data: unknown, { id }: { id: string; payload: Record<string, unknown> }) => {
      void queryClient.invalidateQueries({ queryKey: ["reminders"] });
      void queryClient.invalidateQueries({ queryKey: ["reminders", id] });
    },
  });
}