import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { reminderService } from "@/services/reminderService";
import type { UpdateReminderPayload } from "@/types/appointment.types";

export function useReminders(appointmentId?: string) {
  return useQuery({
    queryKey: ["reminders", appointmentId],
    queryFn: () => reminderService.getAll(appointmentId),
  });
}

export function useReminder(id: string) {
  return useQuery({
    queryKey: ["reminders", id],
    queryFn: () => reminderService.getById(id),
    enabled: !!id,
  });
}

export function useUpdateReminder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateReminderPayload }) =>
      reminderService.update(id, payload),
    onSuccess: (_data, { id }) => {
      queryClient.invalidateQueries({ queryKey: ["reminders"] });
      queryClient.invalidateQueries({ queryKey: ["reminders", id] });
    },
  });
}