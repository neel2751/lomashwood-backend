import { productClient } from "@/lib/api-client";
import type { Category } from "@/lib/api-client";

export const categoryService = {
  getAll: (params?: Record<string, unknown>) =>
    productClient.categories.getAll(params),

  getById: (id: string) => productClient.categories.getById(id),

  create: (payload: Partial<Category>) =>
    productClient.categories.create(payload),

  update: (id: string, payload: Partial<Category>) =>
    productClient.categories.update(id, payload),

  patch: (id: string, payload: Partial<Category>) =>
    productClient.categories.patch(id, payload),

  remove: (id: string) => productClient.categories.remove(id),
};