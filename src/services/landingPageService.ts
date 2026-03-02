import { apiClient } from "@/lib/api-client";
import type { ApiResponse } from "@/lib/api-client";
import axios from "@/lib/axios";

type LandingPage = {
  id: string;
  title: string;
  slug: string;
  sections?: unknown[];
  status?: string;
  createdAt?: string;
  updatedAt?: string;
};

export const landingPageService = {
  getAll: (params?: Record<string, unknown>) =>
    apiClient.landingPages.getAll(params),

  getById: (id: string) =>
    apiClient.landingPages.getById(id),

  getBySlug: (slug: string): Promise<ApiResponse<LandingPage>> =>
    axios
      .get<ApiResponse<LandingPage>>(`/landing-pages/slug/${slug}`)
      .then((r) => r.data),

  create: (payload: Partial<LandingPage>) =>
    apiClient.landingPages.create(payload),

  update: (id: string, payload: Partial<LandingPage>) =>
    apiClient.landingPages.update(id, payload),

  remove: (id: string) =>
    apiClient.landingPages.delete(id),

  publish: (id: string): Promise<ApiResponse<LandingPage>> =>
    axios
      .patch<ApiResponse<LandingPage>>(`/landing-pages/${id}/publish`)
      .then((r) => r.data),

  unpublish: (id: string): Promise<ApiResponse<LandingPage>> =>
    axios
      .patch<ApiResponse<LandingPage>>(`/landing-pages/${id}/unpublish`)
      .then((r) => r.data),

  duplicate: (id: string): Promise<ApiResponse<LandingPage>> =>
    axios
      .post<ApiResponse<LandingPage>>(`/landing-pages/${id}/duplicate`)
      .then((r) => r.data),

  updateSections: (id: string, sections: unknown[]): Promise<ApiResponse<LandingPage>> =>
    axios
      .patch<ApiResponse<LandingPage>>(`/landing-pages/${id}/sections`, { sections })
      .then((r) => r.data),
};