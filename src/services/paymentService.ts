import { apiClient } from "@/lib/api-client";
import type { ApiResponse, PaginatedResponse } from "@/lib/api-client";
import axios from "@/lib/axios";

export type Payment = {
  id: string;
  orderId: string;
  amount: number;
  currency: string;
  status: string;
  method?: string;
  createdAt: string;
  updatedAt: string;
};

export const paymentService = {
  getAll: (params?: Record<string, unknown>) =>
    apiClient.payments.getAll(params),

  getById: (id: string) => apiClient.payments.getById(id),

  create: (payload: Partial<Payment>) =>
    apiClient.payments.create(payload),

  update: (id: string, payload: Partial<Payment>) =>
    apiClient.payments.update(id, payload),

  patch: (id: string, payload: Partial<Payment>) =>
    apiClient.payments.update(id, payload),

  remove: (id: string) => apiClient.payments.delete(id),

  getByOrder: (orderId: string): Promise<PaginatedResponse<Payment>> =>
    axios
      .get<PaginatedResponse<Payment>>(`/orders/payments/by-order/${orderId}`)
      .then((r) => r.data),

  capture: (id: string): Promise<ApiResponse<Payment>> =>
    axios
      .post<ApiResponse<Payment>>(`/orders/payments/${id}/capture`)
      .then((r) => r.data),

  void: (id: string): Promise<ApiResponse<Payment>> =>
    axios
      .post<ApiResponse<Payment>>(`/orders/payments/${id}/void`)
      .then((r) => r.data),
};