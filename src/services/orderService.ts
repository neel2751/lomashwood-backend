import { orderClient } from "@/lib/api-client";
import type { Order } from "@/lib/api-client";
import { axiosInstance } from "@/lib/axios";
import type { ApiResponse } from "@/lib/api-client";
import type { OrderStatus } from "@/lib/constants";

export const orderService = {
  getAll: (params?: Record<string, unknown>) =>
    orderClient.orders.getAll(params),

  getById: (id: string) => orderClient.orders.getById(id),

  create: (payload: Partial<Order>) =>
    orderClient.orders.create(payload),

  update: (id: string, payload: Partial<Order>) =>
    orderClient.orders.update(id, payload),

  patch: (id: string, payload: Partial<Order>) =>
    orderClient.orders.patch(id, payload),

  remove: (id: string) => orderClient.orders.remove(id),

  updateStatus: (
    id: string,
    status: OrderStatus,
  ): Promise<ApiResponse<Order>> =>
    axiosInstance
      .patch<ApiResponse<Order>>(`/orders/${id}/status`, { status })
      .then((r) => r.data),

  getByCustomer: (
    customerId: string,
    params?: Record<string, unknown>,
  ) =>
    axiosInstance
      .get(`/orders/by-customer/${customerId}`, { params })
      .then((r) => r.data),
};