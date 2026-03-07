
import { apiClient } from "@/lib/api-client";
import axios from "@/lib/axios";

import type { ApiResponse, PaginatedResponse } from "@/lib/api-client";

type BlogPost = {
  id: string;
  title: string;
  slug: string;
  content: string;
  status?: string;
  authorId?: string;
  createdAt?: string;
  updatedAt?: string;
};

export const blogService = {
  getAll: (params?: Record<string, unknown>) =>
    apiClient.blogs.getAll(params),

  getById: (id: string) =>
    apiClient.blogs.getById(id),

  getBySlug: (slug: string): Promise<ApiResponse<BlogPost>> =>
    axios
      .get<ApiResponse<BlogPost>>(`/blogs/slug/${slug}`)
      .then((r) => r.data),

  create: (payload: Partial<BlogPost>) =>
    apiClient.blogs.create(payload),

  update: (id: string, payload: Partial<BlogPost>) =>
    apiClient.blogs.update(id, payload),

  remove: (id: string) =>
    apiClient.blogs.delete(id),

  publish: (id: string): Promise<ApiResponse<BlogPost>> =>
    axios
      .patch<ApiResponse<BlogPost>>(`/blogs/${id}/publish`)
      .then((r) => r.data),

  unpublish: (id: string): Promise<ApiResponse<BlogPost>> =>
    axios
      .patch<ApiResponse<BlogPost>>(`/blogs/${id}/unpublish`)
      .then((r) => r.data),

  getDrafts: (params?: Record<string, unknown>): Promise<PaginatedResponse<BlogPost>> =>
    axios
      .get<PaginatedResponse<BlogPost>>("/blogs/drafts", { params })
      .then((r) => r.data),

  duplicate: (id: string): Promise<ApiResponse<BlogPost>> =>
    axios
      .post<ApiResponse<BlogPost>>(`/blogs/${id}/duplicate`)
      .then((r) => r.data),
};