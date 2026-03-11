import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { consultantService } from "@/services/consultantService";
import { fetchWithAuth } from "@/lib/fetch-client";

import type { CreateConsultantPayload } from "@/types/appointment.types";

export function useConsultants() {
  return useQuery({
    queryKey: ["consultants"],
    queryFn: () => fetchWithAuth('/api/consultants'),
  });
}

export function useConsultant(id: string) {
  return useQuery({
    queryKey: ["consultants", id],
    queryFn: () => fetchWithAuth(`/api/consultants/${id}`),
    enabled: !!id,
  });
}

export function useCreateConsultant() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateConsultantPayload) => consultantService.create(payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["consultants"] });
    },
  });
}

export function useUpdateConsultant() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: CreateConsultantPayload }) =>
      consultantService.update(id, payload),
    onSuccess: (_data: unknown, { id }: { id: string; payload: CreateConsultantPayload }) => {
      void queryClient.invalidateQueries({ queryKey: ["consultants"] });
      void queryClient.invalidateQueries({ queryKey: ["consultants", id] });
    },
  });
}

export function useDeleteConsultant() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => consultantService.remove(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["consultants"] });
    },
  });
}