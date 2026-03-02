import { apiClient } from "@/lib/api-client";
import type { Review } from "@/lib/api-client";
import axios from "@/lib/axios";
import type { ApiResponse } from "@/lib/api-client";
import type { ReviewStatus } from "@/lib/constants";

export const reviewService = {
  getAll: (params?: Record<string, unknown>) =>
    apiClient.reviews.getAll(params),

  getById: (id: string) => apiClient.reviews.getById(id),

  create: (payload: Partial<Review>) =>
    apiClient.reviews.create(payload),

  update: (id: string, payload: Partial<Review>) =>
    apiClient.reviews.update(id, payload),

  patch: (id: string, payload: Partial<Review>) =>
    axios.patch(`/customers/reviews/${id}`, payload).then((r) => r.data),

  remove: (id: string) => apiClient.reviews.delete(id),

  updateStatus: (
    id: string,
    status: ReviewStatus,
  ): Promise<ApiResponse<Review>> =>
    axios
      .patch<ApiResponse<Review>>(`/customers/reviews/${id}/status`, { status })
      .then((r) => r.data),

  getPending: (params?: Record<string, unknown>) =>
    apiClient.reviews.getAll({ ...params, status: "pending" }),

  getByCustomer: (customerId: string, params?: Record<string, unknown>) =>
    axios
      .get(`/customers/reviews/by-customer/${customerId}`, { params })
      .then((r) => r.data),
};