import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { appointmentService } from "@/services/appointmentService";
import type { AppointmentFilters, CreateAppointmentPayload, UpdateAppointmentPayload } from "@/types/appointment.types";

export function useAppointments(filters?: AppointmentFilters) {
  return useQuery({
    queryKey: ["appointments", filters],
    queryFn: () => appointmentService.getAll(filters),
  });
}

export function useAppointment(id: string) {
  return useQuery({
    queryKey: ["appointments", id],
    queryFn: () => appointmentService.getById(id),
    enabled: !!id,
  });
}

export function useCreateAppointment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateAppointmentPayload) => appointmentService.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["appointments"] });
    },
  });
}

export function useUpdateAppointment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateAppointmentPayload }) =>
      appointmentService.update(id, payload),
    onSuccess: (_data, { id }) => {
      queryClient.invalidateQueries({ queryKey: ["appointments"] });
      queryClient.invalidateQueries({ queryKey: ["appointments", id] });
    },
  });
}

export function useDeleteAppointment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => appointmentService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["appointments"] });
    },
  });
}