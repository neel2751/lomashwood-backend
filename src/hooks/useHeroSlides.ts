import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { fetchWithAuth, buildQueryString } from "@/lib/fetch-client";

export interface HeroSlide {
  id: string;
  type: "image" | "video";
  src: string;
  title: string;
  subtitle?: string;
  description?: string;
  ctaText?: string;
  ctaLink?: string;
  secondaryCtaText?: string;
  secondaryCtaLink?: string;
  overlayOpacity: number;
  order: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface HeroSlideListResponse {
  data: HeroSlide[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export function useHeroSlides(params?: Record<string, unknown>) {
  return useQuery<HeroSlideListResponse>({
    queryKey: ["heroSlides", params],
    queryFn: () => fetchWithAuth(`/api/hero${buildQueryString(params)}`),
  });
}

export function useHeroSlide(id: string) {
  return useQuery<HeroSlide>({
    queryKey: ["heroSlides", id],
    queryFn: () => fetchWithAuth(`/api/hero/${id}`),
    enabled: !!id,
  });
}

export function useCreateHeroSlide() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: Omit<HeroSlide, "id" | "createdAt" | "updatedAt">) =>
      fetchWithAuth("/api/hero", {
        method: "POST",
        body: JSON.stringify(payload),
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["heroSlides"] });
    },
  });
}

export function useUpdateHeroSlide() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Partial<HeroSlide> }) =>
      fetchWithAuth(`/api/hero/${id}`, {
        method: "PATCH",
        body: JSON.stringify(payload),
      }),
    onSuccess: (_data, { id }) => {
      void queryClient.invalidateQueries({ queryKey: ["heroSlides"] });
      void queryClient.invalidateQueries({ queryKey: ["heroSlides", id] });
    },
  });
}

export function useDeleteHeroSlide() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) =>
      fetchWithAuth(`/api/hero/${id}`, {
        method: "DELETE",
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["heroSlides"] });
    },
  });
}

export function useReorderHeroSlides() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (slideIds: string[]) =>
      fetchWithAuth("/api/hero/reorder", {
        method: "POST",
        body: JSON.stringify({ slideIds }),
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["heroSlides"] });
    },
  });
}
