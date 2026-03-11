import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { appointmentService } from "@/services/appointmentService";
import { fetchWithAuth, buildQueryString } from "@/lib/fetch-client";

import type { AppointmentFilterParams, CreateAppointmentPayload, UpdateAppointmentPayload } from "@/types/appointment.types";

export function useAppointments(filters?: AppointmentFilterParams) {
  return useQuery({
    queryKey: ["appointments", filters],
    queryFn: () => fetchWithAuth(`/api/appointments${buildQueryString(filters || {})}`),
  });
}

export function useAppointment(id: string) {
  return useQuery({
    queryKey: ["appointments", id],
    queryFn: () => fetchWithAuth(`/api/appointments/${id}`),
    enabled: !!id,
  });
}

export function useCreateAppointment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateAppointmentPayload) => appointmentService.create(payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["appointments"] });
    },
  });
}

export function useUpdateAppointment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateAppointmentPayload }) =>
      appointmentService.update(id, payload),
    onSuccess: (_data: unknown, { id }: { id: string; payload: Record<string, unknown> }) => {
      void queryClient.invalidateQueries({ queryKey: ["appointments"] });
      void queryClient.invalidateQueries({ queryKey: ["appointments", id] });
    },
  });
}

export function useDeleteAppointment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => appointmentService.remove(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["appointments"] });
    },
  });
}

export function useSendAppointmentEmail() {
  return useMutation({
    mutationFn: ({ id, type }: { id: string; type: "confirmation" | "reminder" | "missed" }) =>
      appointmentService.sendEmail(id, type),
  });
}