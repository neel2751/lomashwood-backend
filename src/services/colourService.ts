import { buildQueryString, fetchWithAuth } from "@/lib/fetch-client";

type Colour = {
  id: string;
  name: string;
  hexCode?: string;
  isFeatured?: boolean;
  createdAt?: string;
  updatedAt?: string;
};

export const colourService = {
  getAll: (params?: Record<string, unknown>) =>
    fetchWithAuth(`/api/products/colours${buildQueryString(params)}`),

  getById: (id: string) => fetchWithAuth(`/api/products/colours/${id}`),

  create: (payload: Partial<Colour>) =>
    fetchWithAuth("/api/products/colours", {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  update: (id: string, payload: Partial<Colour>) =>
    fetchWithAuth(`/api/products/colours/${id}`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    }),

  remove: (id: string) =>
    fetchWithAuth(`/api/products/colours/${id}`, {
      method: "DELETE",
    }),
};
