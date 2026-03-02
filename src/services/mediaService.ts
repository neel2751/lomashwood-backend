import { apiClient } from "@/lib/api-client";
import type { ApiResponse } from "@/lib/api-client";
import axios from "@/lib/axios";

type MediaWallItem = {
  id: string;
  url: string;
  type?: string;
  active?: boolean;
  order?: number;
  createdAt?: string;
  updatedAt?: string;
};

export const mediaService = {
  getAll: (params?: Record<string, unknown>) =>
    apiClient.media.getAll(params),

  getById: (id: string) =>
    apiClient.media.getById(id),

  create: (payload: Partial<MediaWallItem>) =>
    apiClient.media.create(payload),

  update: (id: string, payload: Partial<MediaWallItem>) =>
    apiClient.media.update(id, payload),

  remove: (id: string) =>
    apiClient.media.delete(id),

  upload: (payload: unknown) =>
    apiClient.media.upload(payload),

  reorder: (orderedIds: string[]): Promise<ApiResponse<void>> =>
    axios
      .patch<ApiResponse<void>>("/media/reorder", { orderedIds })
      .then((r) => r.data),

  setActive: (id: string, active: boolean): Promise<ApiResponse<MediaWallItem>> =>
    axios
      .patch<ApiResponse<MediaWallItem>>(`/media/${id}/active`, { active })
      .then((r) => r.data),
};