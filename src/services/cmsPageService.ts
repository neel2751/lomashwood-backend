import { contentClient } from "@/lib/api-client";
import type { CmsPage } from "@/lib/api-client";
import { axiosInstance } from "@/lib/axios";
import type { ApiResponse } from "@/lib/api-client";
import type { ManagedPageSlug } from "@/lib/constants";

export const cmsPageService = {
  getAll: (params?: Record<string, unknown>) =>
    contentClient.cmsPages.getAll(params),

  getById: (id: string) => contentClient.cmsPages.getById(id),

  getBySlug: (slug: ManagedPageSlug | string): Promise<ApiResponse<CmsPage>> =>
    axiosInstance
      .get<ApiResponse<CmsPage>>(`/content/cms/slug/${slug}`)
      .then((r) => r.data),

  create: (payload: Partial<CmsPage>) =>
    contentClient.cmsPages.create(payload),

  update: (id: string, payload: Partial<CmsPage>) =>
    contentClient.cmsPages.update(id, payload),

  patch: (id: string, payload: Partial<CmsPage>) =>
    contentClient.cmsPages.patch(id, payload),

  remove: (id: string) => contentClient.cmsPages.remove(id),

  upsertBySlug: (
    slug: ManagedPageSlug | string,
    payload: Partial<CmsPage>,
  ): Promise<ApiResponse<CmsPage>> =>
    axiosInstance
      .put<ApiResponse<CmsPage>>(`/content/cms/slug/${slug}`, payload)
      .then((r) => r.data),

  getManagedPages: (): Promise<ApiResponse<CmsPage[]>> =>
    axiosInstance
      .get<ApiResponse<CmsPage[]>>("/content/cms/managed")
      .then((r) => r.data),
};