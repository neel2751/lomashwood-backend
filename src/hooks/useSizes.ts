import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { sizeService } from "@/services/sizeService";
import type { CreateSizePayload } from "@/types/product.types";

export function useSizes(productId?: string) {
  return useQuery({
    queryKey: ["sizes", productId],
    queryFn: () => sizeService.getAll(productId ? { productId } : undefined),
  });
}

export function useSize(id: string) {
  return useQuery({
    queryKey: ["sizes", id],
    queryFn: () => sizeService.getById(id),
    enabled: !!id,
  });
}

export function useCreateSize() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateSizePayload) => sizeService.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sizes"] });
    },
  });
}

export function useUpdateSize() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: CreateSizePayload }) =>
      sizeService.update(id, payload),
    onSuccess: (_data: unknown, { id }: { id: string; payload: CreateSizePayload }) => {
      queryClient.invalidateQueries({ queryKey: ["sizes"] });
      queryClient.invalidateQueries({ queryKey: ["sizes", id] });
    },
  });
}

export function useDeleteSize() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => sizeService.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sizes"] });
    },
  });
}