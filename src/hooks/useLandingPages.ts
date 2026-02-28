import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { landingPageService } from "@/services/landingPageService";
import type { CreateLandingPagePayload, UpdateLandingPagePayload } from "@/types/content.types";

export function useLandingPages() {
  return useQuery({
    queryKey: ["landing-pages"],
    queryFn: () => landingPageService.getAll(),
  });
}

export function useLandingPage(id: string) {
  return useQuery({
    queryKey: ["landing-pages", id],
    queryFn: () => landingPageService.getById(id),
    enabled: !!id,
  });
}

export function useCreateLandingPage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateLandingPagePayload) => landingPageService.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["landing-pages"] });
    },
  });
}

export function useUpdateLandingPage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateLandingPagePayload }) =>
      landingPageService.update(id, payload),
    onSuccess: (_data, { id }) => {
      queryClient.invalidateQueries({ queryKey: ["landing-pages"] });
      queryClient.invalidateQueries({ queryKey: ["landing-pages", id] });
    },
  });
}

export function useDeleteLandingPage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => landingPageService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["landing-pages"] });
    },
  });
}