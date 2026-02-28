import { orderClient } from "@/lib/api-client";
import type { Refund } from "@/lib/api-client";
import { axiosInstance } from "@/lib/axios";
import type { ApiResponse, PaginatedResponse } from "@/lib/api-client";

export const refundService = {
  getAll: (params?: Record<string, unknown>) =>
    orderClient.refunds.getAll(params),

  getById: (id: string) => orderClient.refunds.getById(id),

  create: (payload: Partial<Refund>) =>
    orderClient.refunds.create(payload),

  update: (id: string, payload: Partial<Refund>) =>
    orderClient.refunds.update(id, payload),

  patch: (id: string, payload: Partial<Refund>) =>
    orderClient.refunds.patch(id, payload),

  remove: (id: string) => orderClient.refunds.remove(id),

  getByOrder: (orderId: string): Promise<PaginatedResponse<Refund>> =>
    axiosInstance
      .get<PaginatedResponse<Refund>>(`/orders/refunds/by-order/${orderId}`)
      .then((r) => r.data),

  approve: (id: string): Promise<ApiResponse<Refund>> =>
    axiosInstance
      .post<ApiResponse<Refund>>(`/orders/refunds/${id}/approve`)
      .then((r) => r.data),

  reject: (id: string, reason: string): Promise<ApiResponse<Refund>> =>
    axiosInstance
      .post<ApiResponse<Refund>>(`/orders/refunds/${id}/reject`, { reason })
      .then((r) => r.data),
};