import { apiClient } from "@/lib/api-client";
import type { SeoMeta } from "@/lib/api-client";
import axios from "@/lib/axios";
import type { ApiResponse } from "@/lib/api-client";

export const seoService = {
  getAll: (params?: Record<string, unknown>) =>
    apiClient.seo.getAll(params),

  getById: (id: string) => apiClient.seo.getById(id),

  getBySlug: (pageSlug: string): Promise<ApiResponse<SeoMeta>> =>
    axios
      .get<ApiResponse<SeoMeta>>(`/content/seo/slug/${pageSlug}`)
      .then((r) => r.data),

  create: (payload: Partial<SeoMeta>) =>
    apiClient.seo.create(payload),

  update: (id: string, payload: Partial<SeoMeta>) =>
    apiClient.seo.update(id, payload),

  patch: (id: string, payload: Partial<SeoMeta>) =>
    axios.patch(`/content/seo/${id}`, payload).then((r) => r.data),

  remove: (id: string) => apiClient.seo.delete(id),

  upsertBySlug: (
    pageSlug: string,
    payload: Partial<SeoMeta>,
  ): Promise<ApiResponse<SeoMeta>> =>
    axios
      .put<ApiResponse<SeoMeta>>(`/content/seo/slug/${pageSlug}`, payload)
      .then((r) => r.data),

  bulkUpdate: (
    entries: Array<{ pageSlug: string } & Partial<SeoMeta>>,
  ): Promise<ApiResponse<SeoMeta[]>> =>
    axios
      .patch<ApiResponse<SeoMeta[]>>("/content/seo/bulk", { entries })
      .then((r) => r.data),
};