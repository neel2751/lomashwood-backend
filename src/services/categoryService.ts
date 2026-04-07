import { buildQueryString, fetchWithAuth } from "@/lib/fetch-client";

type Category = {
  id: string;
  name: string;
  slug?: string;
  parentId?: string;
  createdAt?: string;
  updatedAt?: string;
};

export const categoryService = {
  getAll: (params?: Record<string, unknown>) =>
    fetchWithAuth(`/api/products/categories${buildQueryString(params)}`),

  getById: (id: string) => fetchWithAuth(`/api/products/categories/${id}`),

  create: (payload: Partial<Category>) =>
    fetchWithAuth("/api/products/categories", {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  update: (id: string, payload: Partial<Category>) =>
    fetchWithAuth(`/api/products/categories/${id}`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    }),

  remove: (id: string) =>
    fetchWithAuth(`/api/products/categories/${id}`, {
      method: "DELETE",
    }),
};
