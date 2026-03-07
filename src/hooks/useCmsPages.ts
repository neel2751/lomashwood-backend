import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { cmsPageService } from "@/services/cmsPageService";

import type { CreateCmsPagePayload } from "@/types/content.types";

export function useCmsPages() {
  return useQuery({
    queryKey: ["cms-pages"],
    queryFn: () => cmsPageService.getAll(),
  });
}

export function useCmsPage(id: string) {
  return useQuery({
    queryKey: ["cms-pages", id],
    queryFn: () => cmsPageService.getById(id),
    enabled: !!id,
  });
}

export function useCreateCmsPage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateCmsPagePayload) => cmsPageService.create(payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["cms-pages"] });
    },
  });
}

export function useUpdateCmsPage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: CreateCmsPagePayload }) =>
      cmsPageService.update(id, payload),
    onSuccess: (_data, { id }) => {
      void queryClient.invalidateQueries({ queryKey: ["cms-pages"] });
      void queryClient.invalidateQueries({ queryKey: ["cms-pages", id] });
    },
  });
}

export function useDeleteCmsPage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => cmsPageService.remove(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["cms-pages"] });
    },
  });
}