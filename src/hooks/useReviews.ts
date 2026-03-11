import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { reviewService } from "@/services/reviewService";
import { fetchWithAuth, buildQueryString } from "@/lib/fetch-client";

import type { CreateReviewPayload } from "@/types/customer.types";

export function useReviews(filters?: Record<string, unknown>) {
  return useQuery({
    queryKey: ["reviews", filters],
    queryFn: () => fetchWithAuth(`/api/reviews${buildQueryString(filters || {})}`),
  });
}

export function useReview(id: string) {
  return useQuery({
    queryKey: ["reviews", id],
    queryFn: () => fetchWithAuth(`/api/reviews/${id}`),
    enabled: !!id,
  });
}

export function useUpdateReview() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: CreateReviewPayload }) =>
      reviewService.update(id, payload),
    onSuccess: (_data: unknown, { id }: { id: string; payload: CreateReviewPayload }) => {
      void queryClient.invalidateQueries({ queryKey: ["reviews"] });
      void queryClient.invalidateQueries({ queryKey: ["reviews", id] });
    },
  });
}

export function useDeleteReview() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => reviewService.remove(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["reviews"] });
    },
  });
}