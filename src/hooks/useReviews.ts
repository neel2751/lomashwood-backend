import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { reviewService } from "@/services/reviewService";
import type { CreateReviewPayload } from "@/types/customer.types";

export function useReviews(filters?: Record<string, unknown>) {
  return useQuery({
    queryKey: ["reviews", filters],
    queryFn: () => reviewService.getAll(filters),
  });
}

export function useReview(id: string) {
  return useQuery({
    queryKey: ["reviews", id],
    queryFn: () => reviewService.getById(id),
    enabled: !!id,
  });
}

export function useUpdateReview() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: CreateReviewPayload }) =>
      reviewService.update(id, payload),
onSuccess: (_data: unknown, { id }: { id: string; payload: CreateReviewPayload }) => {      queryClient.invalidateQueries({ queryKey: ["reviews"] });
      queryClient.invalidateQueries({ queryKey: ["reviews", id] });
    },
  });
}

export function useDeleteReview() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => reviewService.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reviews"] });
    },
  });
}