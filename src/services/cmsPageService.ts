import { apiClient } from "@/lib/api-client";
import type { ApiResponse } from "@/lib/api-client";
import axios from "@/lib/axios";
import type { ManagedPageSlug } from "@/lib/constants";

type CmsPage = {
  id: string;
  title: string;
  slug: string;
  content?: string;
  status?: string;
  createdAt?: string;
  updatedAt?: string;
};

export const cmsPageService = {
  getAll: (params?: Record<string, unknown>) =>
    apiClient.cmsPages.getAll(params),

  getById: (id: string) =>
    apiClient.cmsPages.getById(id),

  getBySlug: (slug: ManagedPageSlug | string): Promise<ApiResponse<CmsPage>> =>
    axios
      .get<ApiResponse<CmsPage>>(`/cms-pages/slug/${slug}`)
      .then((r) => r.data),

  create: (payload: Partial<CmsPage>) =>
    apiClient.cmsPages.create(payload),

  update: (id: string, payload: Partial<CmsPage>) =>
    apiClient.cmsPages.update(id, payload),

  remove: (id: string) =>
    apiClient.cmsPages.delete(id),

  upsertBySlug: (slug: ManagedPageSlug | string, payload: Partial<CmsPage>): Promise<ApiResponse<CmsPage>> =>
    axios
      .put<ApiResponse<CmsPage>>(`/cms-pages/slug/${slug}`, payload)
      .then((r) => r.data),

  getManagedPages: (): Promise<ApiResponse<CmsPage[]>> =>
    axios
      .get<ApiResponse<CmsPage[]>>("/cms-pages/managed")
      .then((r) => r.data),
};