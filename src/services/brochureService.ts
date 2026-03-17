import { apiClient } from "@/lib/api-client";

import type {
  BrochureFilterParams,
  CreateBrochurePayload,
  UpdateBrochurePayload,
} from "@/types/content.types";

export const brochureService = {
  getAll: (params?: BrochureFilterParams) => apiClient.brochures.getAll(params),
  getById: (id: string) => apiClient.brochures.getById(id),
  create: (payload: CreateBrochurePayload) => apiClient.brochures.create(payload),
  update: (id: string, payload: UpdateBrochurePayload) => apiClient.brochures.update(id, payload),
  remove: (id: string) => apiClient.brochures.delete(id),
};
