import { customerClient } from "@/lib/api-client";
import type { Review } from "@/lib/api-client";
import { axiosInstance } from "@/lib/axios";
import type { ApiResponse } from "@/lib/api-client";
import type { ReviewStatus } from "@/lib/constants";

export const reviewService = {
  getAll: (params?: Record<string, unknown>) =>
    customerClient.reviews.getAll(params),

  getById: (id: string) => customerClient.reviews.getById(id),

  create: (payload: Partial<Review>) =>
    customerClient.reviews.create(payload),

  update: (id: string, payload: Partial<Review>) =>
    customerClient.reviews.update(id, payload),

  patch: (id: string, payload: Partial<Review>) =>
    customerClient.reviews.patch(id, payload),

  remove: (id: string) => customerClient.reviews.remove(id),

  updateStatus: (
    id: string,
    status: ReviewStatus,
  ): Promise<ApiResponse<Review>> =>
    axiosInstance
      .patch<ApiResponse<Review>>(`/customers/reviews/${id}/status`, { status })
      .then((r) => r.data),

  getPending: (params?: Record<string, unknown>) =>
    customerClient.reviews.getAll({ ...params, status: "pending" }),

  getByCustomer: (customerId: string, params?: Record<string, unknown>) =>
    axiosInstance
      .get(`/customers/reviews/by-customer/${customerId}`, { params })
      .then((r) => r.data),
};