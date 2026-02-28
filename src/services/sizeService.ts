import { productClient } from "@/lib/api-client";
import type { Size } from "@/lib/api-client";

export const sizeService = {
  getAll: (params?: Record<string, unknown>) =>
    productClient.sizes.getAll(params),

  getById: (id: string) => productClient.sizes.getById(id),

  create: (payload: Partial<Size>) =>
    productClient.sizes.create(payload),

  update: (id: string, payload: Partial<Size>) =>
    productClient.sizes.update(id, payload),

  patch: (id: string, payload: Partial<Size>) =>
    productClient.sizes.patch(id, payload),

  remove: (id: string) => productClient.sizes.remove(id),
};