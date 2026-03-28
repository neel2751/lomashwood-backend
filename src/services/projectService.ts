import { apiClient } from "@/lib/api-client";

import type { CreateProjectPayload, UpdateProjectPayload } from "@/types/product.types";

export const projectService = {
  getAll: (params?: Record<string, unknown>) => apiClient.projects.getAll(params),
  getById: (id: string) => apiClient.projects.getById(id),
  create: (payload: CreateProjectPayload) => apiClient.projects.create(payload),
  update: (id: string, payload: UpdateProjectPayload) => apiClient.projects.update(id, payload),
  remove: (id: string) => apiClient.projects.delete(id),
};
