import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { seoService } from "@/services/seoService";

import type { UpsertSeoPayload } from "@/types/content.types";

export function useSeo() {
  return useQuery({
    queryKey: ["seo"],
    queryFn: () => seoService.getAll(),
  });
}

export function useSeoItem(id: string) {
  return useQuery({
    queryKey: ["seo", id],
    queryFn: () => seoService.getById(id),
    enabled: !!id,
  });
}

export function useUpdateSeo() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpsertSeoPayload }) =>
      seoService.update(id, payload),
    onSuccess: (_data: unknown, { id }: { id: string; payload: UpsertSeoPayload }) => {
      void queryClient.invalidateQueries({ queryKey: ["seo"] });
      void queryClient.invalidateQueries({ queryKey: ["seo", id] });
    },
  });
}