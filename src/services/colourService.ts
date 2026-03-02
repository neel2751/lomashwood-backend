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
    apiClient.colours.getAll(params),

  getById: (id: string) =>
    apiClient.colours.getById(id),

  create: (payload: Partial<Colour>) =>
    apiClient.colours.create(payload),

  update: (id: string, payload: Partial<Colour>) =>
    apiClient.colours.update(id, payload),

  remove: (id: string) =>
    apiClient.colours.delete(id),
};