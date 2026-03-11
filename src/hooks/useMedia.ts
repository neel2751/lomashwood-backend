import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { mediaService } from "@/services/mediaService";
import { fetchWithAuth } from "@/lib/fetch-client";

export function useMedia() {
  return useQuery({
    queryKey: ["media"],
    queryFn: () => fetchWithAuth('/api/media'),
  });
}

export function useMediaItem(id: string) {
  return useQuery({
    queryKey: ["media", id],
    queryFn: () => fetchWithAuth(`/api/media/${id}`),
    enabled: !!id,
  });
}

export function useUploadMedia() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ files }: { files: File[]; meta?: Record<string, string> }) =>
      mediaService.upload(files),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["media"] });
    },
  });
}

export function useUpdateMedia() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Record<string, string> }) =>
      mediaService.update(id, payload),
    onSuccess: (_data, { id }) => {
      void queryClient.invalidateQueries({ queryKey: ["media"] });
      void queryClient.invalidateQueries({ queryKey: ["media", id] });
    },
  });
}

export function useDeleteMedia() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => mediaService.remove(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["media"] });
    },
  });
}