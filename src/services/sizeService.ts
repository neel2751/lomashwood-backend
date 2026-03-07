import { apiClient } from "@/lib/api-client";

import type { Size } from "@/lib/api-client";

export const sizeService = {
  getAll: (params?: Record<string, unknown>) =>
    apiClient.sizes.getAll(params),

  getById: (id: string) => apiClient.sizes.getById(id),

  create: (payload: Partial<Size>) =>
    apiClient.sizes.create(payload),

  update: (id: string, payload: Partial<Size>) =>
    apiClient.sizes.update(id, payload),

  patch: (id: string, payload: Partial<Size>) =>
    apiClient.sizes.update(id, payload),

  remove: (id: string) => apiClient.sizes.delete(id),
};