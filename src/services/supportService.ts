import { apiClient } from "@/lib/api-client";
import axios from "@/lib/axios";

import type { ApiResponse, SupportTicket } from "@/lib/api-client";
import type { SupportStatus } from "@/lib/constants";


export const supportService = {
  getAll: (params?: Record<string, unknown>) =>
    apiClient.support.getAll(params),

  getById: (id: string) => apiClient.support.getById(id),

  create: (payload: Partial<SupportTicket>) =>
    apiClient.support.create(payload),

  update: (id: string, payload: Partial<SupportTicket>) =>
    apiClient.support.update(id, payload),

  patch: (id: string, payload: Partial<SupportTicket>) =>
    axios.patch(`/customers/support/${id}`, payload).then((r) => r.data),

  remove: (id: string) => apiClient.support.delete(id),

  updateStatus: (
    id: string,
    status: SupportStatus,
  ): Promise<ApiResponse<SupportTicket>> =>
    axios
      .patch<ApiResponse<SupportTicket>>(
        `/customers/support/${id}/status`,
        { status },
      )
      .then((r) => r.data),

  assignTo: (
    id: string,
    agentId: string,
  ): Promise<ApiResponse<SupportTicket>> =>
    axios
      .patch<ApiResponse<SupportTicket>>(
        `/customers/support/${id}/assign`,
        { agentId },
      )
      .then((r) => r.data),

  getByCustomer: (customerId: string, params?: Record<string, unknown>) =>
    axios
      .get(`/customers/support/by-customer/${customerId}`, { params })
      .then((r) => r.data),

  getOpen: (params?: Record<string, unknown>) =>
    apiClient.support.getAll({ ...params, status: "open" }),
};