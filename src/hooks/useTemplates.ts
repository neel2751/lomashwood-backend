import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { templateService } from "@/services/templateService";
import type { CreateTemplatePayload, UpdateTemplatePayload } from "@/types/notification.types";

export function useTemplates() {
  return useQuery({
    queryKey: ["templates"],
    queryFn: () => templateService.getAll(),
  });
}

export function useTemplate(id: string) {
  return useQuery({
    queryKey: ["templates", id],
    queryFn: () => templateService.getById(id),
    enabled: !!id,
  });
}

export function useCreateTemplate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateTemplatePayload) => templateService.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["templates"] });
    },
  });
}

export function useUpdateTemplate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateTemplatePayload }) =>
      templateService.update(id, payload),
    onSuccess: (_data, { id }) => {
      queryClient.invalidateQueries({ queryKey: ["templates"] });
      queryClient.invalidateQueries({ queryKey: ["templates", id] });
    },
  });
}

export function useDeleteTemplate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => templateService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["templates"] });
    },
  });
}