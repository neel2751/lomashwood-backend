import { contentClient } from "@/lib/api-client";
import type { SeoMeta } from "@/lib/api-client";
import { axiosInstance } from "@/lib/axios";
import type { ApiResponse } from "@/lib/api-client";

export const seoService = {
  getAll: (params?: Record<string, unknown>) =>
    contentClient.seo.getAll(params),

  getById: (id: string) => contentClient.seo.getById(id),

  getBySlug: (pageSlug: string): Promise<ApiResponse<SeoMeta>> =>
    axiosInstance
      .get<ApiResponse<SeoMeta>>(`/content/seo/slug/${pageSlug}`)
      .then((r) => r.data),

  create: (payload: Partial<SeoMeta>) =>
    contentClient.seo.create(payload),

  update: (id: string, payload: Partial<SeoMeta>) =>
    contentClient.seo.update(id, payload),

  patch: (id: string, payload: Partial<SeoMeta>) =>
    contentClient.seo.patch(id, payload),

  remove: (id: string) => contentClient.seo.remove(id),

  upsertBySlug: (
    pageSlug: string,
    payload: Partial<SeoMeta>,
  ): Promise<ApiResponse<SeoMeta>> =>
    axiosInstance
      .put<ApiResponse<SeoMeta>>(`/content/seo/slug/${pageSlug}`, payload)
      .then((r) => r.data),

  bulkUpdate: (
    entries: Array<{ pageSlug: string } & Partial<SeoMeta>>,
  ): Promise<ApiResponse<SeoMeta[]>> =>
    axiosInstance
      .patch<ApiResponse<SeoMeta[]>>("/content/seo/bulk", { entries })
      .then((r) => r.data),
};