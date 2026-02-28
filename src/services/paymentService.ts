import { orderClient } from "@/lib/api-client";
import type { Payment } from "@/lib/api-client";
import { axiosInstance } from "@/lib/axios";
import type { ApiResponse, PaginatedResponse } from "@/lib/api-client";

export const paymentService = {
  getAll: (params?: Record<string, unknown>) =>
    orderClient.payments.getAll(params),

  getById: (id: string) => orderClient.payments.getById(id),

  create: (payload: Partial<Payment>) =>
    orderClient.payments.create(payload),

  update: (id: string, payload: Partial<Payment>) =>
    orderClient.payments.update(id, payload),

  patch: (id: string, payload: Partial<Payment>) =>
    orderClient.payments.patch(id, payload),

  remove: (id: string) => orderClient.payments.remove(id),

  getByOrder: (orderId: string): Promise<PaginatedResponse<Payment>> =>
    axiosInstance
      .get<PaginatedResponse<Payment>>(`/orders/payments/by-order/${orderId}`)
      .then((r) => r.data),

  capture: (id: string): Promise<ApiResponse<Payment>> =>
    axiosInstance
      .post<ApiResponse<Payment>>(`/orders/payments/${id}/capture`)
      .then((r) => r.data),

  void: (id: string): Promise<ApiResponse<Payment>> =>
    axiosInstance
      .post<ApiResponse<Payment>>(`/orders/payments/${id}/void`)
      .then((r) => r.data),
};