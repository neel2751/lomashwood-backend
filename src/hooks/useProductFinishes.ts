import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { buildQueryString, fetchWithAuth } from "@/lib/fetch-client";

import type { ProductFinishOption } from "@/types/product.types";

export type ProductOptionPayload = {
  name: string;
  description?: string;
  image?: string;
  isActive?: boolean;
};

export function useProductFinishes(filters?: Record<string, unknown>) {
  return useQuery({
    queryKey: ["product-finishes", filters],
    queryFn: () => fetchWithAuth(`/api/product-finishes${buildQueryString(filters || {})}`),
  });
}

export function useProductFinish(id: string) {
  return useQuery({
    queryKey: ["product-finishes", id],
    queryFn: () => fetchWithAuth(`/api/product-finishes/${id}`),
    enabled: !!id,
  });
}

export function useCreateProductFinish() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: ProductOptionPayload) =>
      fetchWithAuth("/api/product-finishes", {
        method: "POST",
        body: JSON.stringify(payload),
      }) as Promise<ProductFinishOption>,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["product-finishes"] });
    },
  });
}

export function useUpdateProductFinish() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: ProductOptionPayload }) =>
      fetchWithAuth(`/api/product-finishes/${id}`, {
        method: "PATCH",
        body: JSON.stringify(payload),
      }) as Promise<ProductFinishOption>,
    onSuccess: (_data, { id }) => {
      void queryClient.invalidateQueries({ queryKey: ["product-finishes"] });
      void queryClient.invalidateQueries({ queryKey: ["product-finishes", id] });
    },
  });
}

export function useDeleteProductFinish() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) =>
      fetchWithAuth(`/api/product-finishes/${id}`, {
        method: "DELETE",
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["product-finishes"] });
    },
  });
}
