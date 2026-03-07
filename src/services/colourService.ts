import { apiClient } from "@/lib/api-client";

type Colour = {
  id: string;
  name: string;
  hex?: string;
  createdAt?: string;
  updatedAt?: string;
};

export const colourService = {
  getAll: (params?: Record<string, unknown>) =>
    apiClient.colors.getAll(params),

  getById: (id: string) =>
    apiClient.colors.getById(id),

  create: (payload: Partial<Colour>) =>
    apiClient.colors.create(payload),

  update: (id: string, payload: Partial<Colour>) =>
    apiClient.colors.update(id, payload),

  remove: (id: string) =>
    apiClient.colors.delete(id),
};