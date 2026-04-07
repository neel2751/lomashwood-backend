import { buildQueryString, fetchWithAuth } from "@/lib/fetch-client";

import type { CreateProjectPayload, UpdateProjectPayload } from "@/types/product.types";

export const projectService = {
  getAll: (params?: Record<string, unknown>) =>
    fetchWithAuth(`/api/projects${buildQueryString(params)}`),
  getById: (id: string) => fetchWithAuth(`/api/projects/${id}`),
  create: (payload: CreateProjectPayload) =>
    fetchWithAuth("/api/projects", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  update: (id: string, payload: UpdateProjectPayload) =>
    fetchWithAuth(`/api/projects/${id}`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    }),
  remove: (id: string) =>
    fetchWithAuth(`/api/projects/${id}`, {
      method: "DELETE",
    }),
};
