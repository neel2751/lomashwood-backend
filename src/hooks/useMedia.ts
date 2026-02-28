import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { mediaService } from "@/services/mediaService";
import type { CreateMediaPayload, UpdateMediaPayload } from "@/types/content.types";

export function useMedia() {
  return useQuery({
    queryKey: ["media"],
    queryFn: () => mediaService.getAll(),
  });
}

export function useMediaItem(id: string) {
  return useQuery({
    queryKey: ["media", id],
    queryFn: () => mediaService.getById(id),
    enabled: !!id,
  });
}

export function useUploadMedia() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateMediaPayload) => mediaService.upload(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["media"] });
    },
  });
}

export function useUpdateMedia() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateMediaPayload }) =>
      mediaService.update(id, payload),
    onSuccess: (_data, { id }) => {
      queryClient.invalidateQueries({ queryKey: ["media"] });
      queryClient.invalidateQueries({ queryKey: ["media", id] });
    },
  });
}

export function useDeleteMedia() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => mediaService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["media"] });
    },
  });
}