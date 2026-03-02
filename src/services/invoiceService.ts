import { apiClient } from "@/lib/api-client";
import type { PaginatedResponse } from "@/lib/api-client";
import axios from "@/lib/axios";

type Invoice = {
  id: string;
  orderId: string;
  amount: number;
  status?: string;
  createdAt?: string;
  updatedAt?: string;
};

export const invoiceService = {
  getAll: (params?: Record<string, unknown>) =>
    apiClient.invoices.getAll(params),

  getById: (id: string) =>
    apiClient.invoices.getById(id),

  create: (payload: Partial<Invoice>) =>
    apiClient.invoices.create(payload),

  update: (id: string, payload: Partial<Invoice>) =>
    apiClient.invoices.update(id, payload),

  remove: (id: string) =>
    apiClient.invoices.delete(id),

  getByOrder: (orderId: string): Promise<PaginatedResponse<Invoice>> =>
    axios
      .get<PaginatedResponse<Invoice>>(`/invoices/by-order/${orderId}`)
      .then((r) => r.data),

  download: (id: string): Promise<Blob> =>
    axios
      .get(`/invoices/${id}/download`, { responseType: "blob" })
      .then((r) => r.data as Blob),

  resend: (id: string): Promise<void> =>
    axios
      .post(`/invoices/${id}/resend`)
      .then(() => undefined),
};