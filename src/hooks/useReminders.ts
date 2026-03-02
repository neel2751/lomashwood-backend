import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { reminderService } from "@/services/reminderService";

export function useReminders(appointmentId?: string) {
  return useQuery({
    queryKey: ["reminders", appointmentId],
    queryFn: () => reminderService.getAll(appointmentId ? { appointmentId } : undefined),
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
    mutationFn: ({ id, payload }: { id: string; payload: Record<string, unknown> }) =>
      reminderService.update(id, payload),
    onSuccess: (_data: unknown, { id }: { id: string; payload: Record<string, unknown> }) => {
      queryClient.invalidateQueries({ queryKey: ["reminders"] });
      queryClient.invalidateQueries({ queryKey: ["reminders", id] });
    },
  });
}