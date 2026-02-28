import { contentClient } from "@/lib/api-client";
import type { BlogPost } from "@/lib/api-client";
import { axiosInstance } from "@/lib/axios";
import type { ApiResponse, PaginatedResponse } from "@/lib/api-client";

export const blogService = {
  getAll: (params?: Record<string, unknown>) =>
    contentClient.blogs.getAll(params),

  getById: (id: string) => contentClient.blogs.getById(id),

  getBySlug: (slug: string): Promise<ApiResponse<BlogPost>> =>
    axiosInstance
      .get<ApiResponse<BlogPost>>(`/content/blogs/slug/${slug}`)
      .then((r) => r.data),

  create: (payload: Partial<BlogPost>) =>
    contentClient.blogs.create(payload),

  update: (id: string, payload: Partial<BlogPost>) =>
    contentClient.blogs.update(id, payload),

  patch: (id: string, payload: Partial<BlogPost>) =>
    contentClient.blogs.patch(id, payload),

  remove: (id: string) => contentClient.blogs.remove(id),

  publish: (id: string): Promise<ApiResponse<BlogPost>> =>
    axiosInstance
      .patch<ApiResponse<BlogPost>>(`/content/blogs/${id}/publish`)
      .then((r) => r.data),

  unpublish: (id: string): Promise<ApiResponse<BlogPost>> =>
    axiosInstance
      .patch<ApiResponse<BlogPost>>(`/content/blogs/${id}/unpublish`)
      .then((r) => r.data),

  getDrafts: (params?: Record<string, unknown>): Promise<PaginatedResponse<BlogPost>> =>
    axiosInstance
      .get<PaginatedResponse<BlogPost>>("/content/blogs/drafts", { params })
      .then((r) => r.data),

  duplicate: (id: string): Promise<ApiResponse<BlogPost>> =>
    axiosInstance
      .post<ApiResponse<BlogPost>>(`/content/blogs/${id}/duplicate`)
      .then((r) => r.data),
};