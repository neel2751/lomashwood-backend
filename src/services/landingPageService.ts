import { contentClient } from "@/lib/api-client";
import type { LandingPage } from "@/lib/api-client";
import { axiosInstance } from "@/lib/axios";
import type { ApiResponse } from "@/lib/api-client";

export const landingPageService = {
  getAll: (params?: Record<string, unknown>) =>
    contentClient.landingPages.getAll(params),

  getById: (id: string) => contentClient.landingPages.getById(id),

  getBySlug: (slug: string): Promise<ApiResponse<LandingPage>> =>
    axiosInstance
      .get<ApiResponse<LandingPage>>(`/content/landing-pages/slug/${slug}`)
      .then((r) => r.data),

  create: (payload: Partial<LandingPage>) =>
    contentClient.landingPages.create(payload),

  update: (id: string, payload: Partial<LandingPage>) =>
    contentClient.landingPages.update(id, payload),

  patch: (id: string, payload: Partial<LandingPage>) =>
    contentClient.landingPages.patch(id, payload),

  remove: (id: string) => contentClient.landingPages.remove(id),

  publish: (id: string): Promise<ApiResponse<LandingPage>> =>
    axiosInstance
      .patch<ApiResponse<LandingPage>>(`/content/landing-pages/${id}/publish`)
      .then((r) => r.data),

  unpublish: (id: string): Promise<ApiResponse<LandingPage>> =>
    axiosInstance
      .patch<ApiResponse<LandingPage>>(`/content/landing-pages/${id}/unpublish`)
      .then((r) => r.data),

  duplicate: (id: string): Promise<ApiResponse<LandingPage>> =>
    axiosInstance
      .post<ApiResponse<LandingPage>>(`/content/landing-pages/${id}/duplicate`)
      .then((r) => r.data),

  updateSections: (
    id: string,
    sections: unknown[],
  ): Promise<ApiResponse<LandingPage>> =>
    axiosInstance
      .patch<ApiResponse<LandingPage>>(
        `/content/landing-pages/${id}/sections`,
        { sections },
      )
      .then((r) => r.data),
};