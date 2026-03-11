import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { buildQueryString, fetchWithAuth } from "@/lib/fetch-client";

import type { ProductStyleOption } from "@/types/product.types";

export type ProductOptionPayload = {
  name: string;
  description?: string;
  image?: string;
  isActive?: boolean;
};

export function useProductStyles(filters?: Record<string, unknown>) {
  return useQuery({
    queryKey: ["product-styles", filters],
    queryFn: () => fetchWithAuth(`/api/product-styles${buildQueryString(filters || {})}`),
  });
}

export function useProductStyle(id: string) {
  return useQuery({
    queryKey: ["product-styles", id],
    queryFn: () => fetchWithAuth(`/api/product-styles/${id}`),
    enabled: !!id,
  });
}

export function useCreateProductStyle() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: ProductOptionPayload) =>
      fetchWithAuth("/api/product-styles", {
        method: "POST",
        body: JSON.stringify(payload),
      }) as Promise<ProductStyleOption>,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["product-styles"] });
    },
  });
}

export function useUpdateProductStyle() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: ProductOptionPayload }) =>
      fetchWithAuth(`/api/product-styles/${id}`, {
        method: "PATCH",
        body: JSON.stringify(payload),
      }) as Promise<ProductStyleOption>,
    onSuccess: (_data, { id }) => {
      void queryClient.invalidateQueries({ queryKey: ["product-styles"] });
      void queryClient.invalidateQueries({ queryKey: ["product-styles", id] });
    },
  });
}

export function useDeleteProductStyle() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) =>
      fetchWithAuth(`/api/product-styles/${id}`, {
        method: "DELETE",
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["product-styles"] });
    },
  });
}
