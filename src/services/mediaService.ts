import { contentClient } from "@/lib/api-client";
import type { MediaWallItem } from "@/lib/api-client";
import { axiosInstance } from "@/lib/axios";
import type { ApiResponse } from "@/lib/api-client";

export const mediaService = {
  getAll: (params?: Record<string, unknown>) =>
    contentClient.mediaWall.getAll(params),

  getById: (id: string) => contentClient.mediaWall.getById(id),

  create: (payload: Partial<MediaWallItem>) =>
    contentClient.mediaWall.create(payload),

  update: (id: string, payload: Partial<MediaWallItem>) =>
    contentClient.mediaWall.update(id, payload),

  patch: (id: string, payload: Partial<MediaWallItem>) =>
    contentClient.mediaWall.patch(id, payload),

  remove: (id: string) => contentClient.mediaWall.remove(id),

  upload: (files: File[], meta?: Record<string, string>) =>
    contentClient.uploadMedia(files, meta),

  reorder: (orderedIds: string[]): Promise<ApiResponse<void>> =>
    axiosInstance
      .patch<ApiResponse<void>>("/content/media-wall/reorder", { orderedIds })
      .then((r) => r.data),

  setActive: (id: string, active: boolean): Promise<ApiResponse<MediaWallItem>> =>
    axiosInstance
      .patch<ApiResponse<MediaWallItem>>(`/content/media-wall/${id}/active`, { active })
      .then((r) => r.data),
};