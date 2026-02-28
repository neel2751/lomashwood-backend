import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { consultantService } from "@/services/consultantService";
import type { CreateConsultantPayload, UpdateConsultantPayload } from "@/types/appointment.types";

export function useConsultants() {
  return useQuery({
    queryKey: ["consultants"],
    queryFn: () => consultantService.getAll(),
  });
}

export function useConsultant(id: string) {
  return useQuery({
    queryKey: ["consultants", id],
    queryFn: () => consultantService.getById(id),
    enabled: !!id,
  });
}

export function useCreateConsultant() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateConsultantPayload) => consultantService.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["consultants"] });
    },
  });
}

export function useUpdateConsultant() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateConsultantPayload }) =>
      consultantService.update(id, payload),
    onSuccess: (_data, { id }) => {
      queryClient.invalidateQueries({ queryKey: ["consultants"] });
      queryClient.invalidateQueries({ queryKey: ["consultants", id] });
    },
  });
}

export function useDeleteConsultant() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => consultantService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["consultants"] });
    },
  });
}