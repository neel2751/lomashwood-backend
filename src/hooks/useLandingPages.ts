import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { landingPageService } from "@/services/landingPageService";
import { fetchWithAuth } from "@/lib/fetch-client";

import type { CreateLandingPagePayload } from "@/types/content.types";

export function useLandingPages() {
  return useQuery({
    queryKey: ["landing-pages"],
    queryFn: () => fetchWithAuth('/api/landing-pages'),
  });
}

export function useLandingPage(id: string) {
  return useQuery({
    queryKey: ["landing-pages", id],
    queryFn: () => fetchWithAuth(`/api/landing-pages/${id}`),
    enabled: !!id,
  });
}

export function useCreateLandingPage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateLandingPagePayload) => landingPageService.create(payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["landing-pages"] });
    },
  });
}

export function useUpdateLandingPage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: CreateLandingPagePayload }) =>
      landingPageService.update(id, payload),
    onSuccess: (_data, { id }) => {
      void queryClient.invalidateQueries({ queryKey: ["landing-pages"] });
      void queryClient.invalidateQueries({ queryKey: ["landing-pages", id] });
    },
  });
}

export function useDeleteLandingPage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => landingPageService.remove(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["landing-pages"] });
    },
  });
}