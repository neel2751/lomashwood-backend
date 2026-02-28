import { customerClient } from "@/lib/api-client";
import type { SupportTicket } from "@/lib/api-client";
import { axiosInstance } from "@/lib/axios";
import type { ApiResponse } from "@/lib/api-client";
import type { SupportStatus } from "@/lib/constants";

export const supportService = {
  getAll: (params?: Record<string, unknown>) =>
    customerClient.support.getAll(params),

  getById: (id: string) => customerClient.support.getById(id),

  create: (payload: Partial<SupportTicket>) =>
    customerClient.support.create(payload),

  update: (id: string, payload: Partial<SupportTicket>) =>
    customerClient.support.update(id, payload),

  patch: (id: string, payload: Partial<SupportTicket>) =>
    customerClient.support.patch(id, payload),

  remove: (id: string) => customerClient.support.remove(id),

  updateStatus: (
    id: string,
    status: SupportStatus,
  ): Promise<ApiResponse<SupportTicket>> =>
    axiosInstance
      .patch<ApiResponse<SupportTicket>>(
        `/customers/support/${id}/status`,
        { status },
      )
      .then((r) => r.data),

  assignTo: (
    id: string,
    agentId: string,
  ): Promise<ApiResponse<SupportTicket>> =>
    axiosInstance
      .patch<ApiResponse<SupportTicket>>(
        `/customers/support/${id}/assign`,
        { agentId },
      )
      .then((r) => r.data),

  getByCustomer: (customerId: string, params?: Record<string, unknown>) =>
    axiosInstance
      .get(`/customers/support/by-customer/${customerId}`, { params })
      .then((r) => r.data),

  getOpen: (params?: Record<string, unknown>) =>
    customerClient.support.getAll({ ...params, status: "open" }),
};