import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { buildQueryString } from "@/lib/fetch-client";
import { productService } from "@/services/productService";

import type { CreateProductPayload, UpdateProductPayload } from "@/types/product.types";

// Temporary direct fetch for debugging
async function fetchProductsDirect(filters?: Record<string, unknown>) {
  const url = `/api/products${buildQueryString(filters || {})}`;
  console.log("🔍 Fetching products from:", url);

  const response = await fetch(url, {
    credentials: "include", // Include cookies
    headers: {
      "Content-Type": "application/json",
    },
  });

  console.log("📡 Response status:", response.status);

  if (!response.ok) {
    const error = await response.text();
    console.error("❌ Fetch error:", error);
    throw new Error(`Failed to fetch products: ${response.status}`);
  }

  const data = await response.json();
  console.log("✅ Products data:", data);
  return data;
}

export function useProducts(filters?: Record<string, unknown>) {
  return useQuery({
    queryKey: ["products", filters],
    queryFn: () => fetchProductsDirect(filters),
  });
}

export function useProduct(id: string) {
  return useQuery({
    queryKey: ["products", id],
    queryFn: () => productService.getById(id),
    enabled: !!id,
  });
}

export function useCreateProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateProductPayload) => productService.create(payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["products"] });
    },
  });
}

export function useUpdateProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateProductPayload }) =>
      productService.update(id, payload),
    onSuccess: (_data: unknown, { id }: { id: string; payload: Record<string, unknown> }) => {
      void queryClient.invalidateQueries({ queryKey: ["products"] });
      void queryClient.invalidateQueries({ queryKey: ["products", id] });
    },
  });
}

export function useDeleteProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => productService.remove(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["products"] });
    },
  });
}
