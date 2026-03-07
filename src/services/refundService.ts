
import { apiClient } from "@/lib/api-client";
import axios from "@/lib/axios";

import type { ApiResponse, PaginatedResponse } from "@/lib/api-client";

export type Refund = {
  id: string;
  orderId: string;
  customerId?: string;
  amount: number;
  reason?: string;
  status: string;
  createdAt: string;
  updatedAt: string;
};

export const refundService = {
  getAll: (params?: Record<string, unknown>) =>
    apiClient.refunds.getAll(params),

  getById: (id: string) => apiClient.refunds.getById(id),

  create: (payload: Partial<Refund>) =>
    apiClient.refunds.create(payload),

  update: (id: string, payload: Partial<Refund>) =>
    apiClient.refunds.update(id, payload),

  patch: (id: string, payload: Partial<Refund>) =>
    apiClient.refunds.update(id, payload),

  remove: (id: string) => apiClient.refunds.delete(id),

  getByOrder: (orderId: string): Promise<PaginatedResponse<Refund>> =>
    axios
      .get<PaginatedResponse<Refund>>(`/orders/refunds/by-order/${orderId}`)
      .then((r) => r.data),

  approve: (id: string): Promise<ApiResponse<Refund>> =>
    axios
      .post<ApiResponse<Refund>>(`/orders/refunds/${id}/approve`)
      .then((r) => r.data),

  reject: (id: string, reason: string): Promise<ApiResponse<Refund>> =>
    axios
      .post<ApiResponse<Refund>>(`/orders/refunds/${id}/reject`, { reason })
      .then((r) => r.data),
};