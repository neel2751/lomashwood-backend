import { apiClient } from "@/lib/api-client";

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
    apiClient.categories.getAll(params),

  getById: (id: string) =>
    apiClient.categories.getById(id),

  create: (payload: Partial<Category>) =>
    apiClient.categories.create(payload),

  update: (id: string, payload: Partial<Category>) =>
    apiClient.categories.update(id, payload),

  remove: (id: string) =>
    apiClient.categories.delete(id),
};