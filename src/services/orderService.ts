import { apiClient } from "@/lib/api-client";
import type { ApiResponse } from "@/lib/api-client";
import axios from "@/lib/axios";
import type { OrderStatus } from "@/lib/constants";

type Order = {
  id: string;
  customerId: string;
  status: string;
  total: number;
  items?: unknown[];
  createdAt?: string;
  updatedAt?: string;
};

export const orderService = {
  getAll: (params?: Record<string, unknown>) =>
    apiClient.orders.getAll(params),

  getById: (id: string) =>
    apiClient.orders.getById(id),

  create: (payload: Partial<Order>) =>
    apiClient.orders.create(payload),

  update: (id: string, payload: Partial<Order>) =>
    apiClient.orders.update(id, payload),

  remove: (id: string) =>
    apiClient.orders.delete(id),

  updateStatus: (id: string, status: OrderStatus): Promise<ApiResponse<Order>> =>
    axios
      .patch<ApiResponse<Order>>(`/orders/${id}/status`, { status })
      .then((r) => r.data),

  getByCustomer: (customerId: string, params?: Record<string, unknown>) =>
    axios
      .get(`/orders/by-customer/${customerId}`, { params })
      .then((r) => r.data),
};