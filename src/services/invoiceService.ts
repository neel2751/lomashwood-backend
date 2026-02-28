import { orderClient } from "@/lib/api-client";
import type { Invoice } from "@/lib/api-client";
import { axiosInstance } from "@/lib/axios";
import type { PaginatedResponse } from "@/lib/api-client";

export const invoiceService = {
  getAll: (params?: Record<string, unknown>) =>
    orderClient.invoices.getAll(params),

  getById: (id: string) => orderClient.invoices.getById(id),

  create: (payload: Partial<Invoice>) =>
    orderClient.invoices.create(payload),

  update: (id: string, payload: Partial<Invoice>) =>
    orderClient.invoices.update(id, payload),

  patch: (id: string, payload: Partial<Invoice>) =>
    orderClient.invoices.patch(id, payload),

  remove: (id: string) => orderClient.invoices.remove(id),

  getByOrder: (orderId: string): Promise<PaginatedResponse<Invoice>> =>
    axiosInstance
      .get<PaginatedResponse<Invoice>>(`/orders/invoices/by-order/${orderId}`)
      .then((r) => r.data),

  download: (id: string): Promise<Blob> =>
    axiosInstance
      .get(`/orders/invoices/${id}/download`, { responseType: "blob" })
      .then((r) => r.data as Blob),

  resend: (id: string): Promise<void> =>
    axiosInstance
      .post(`/orders/invoices/${id}/resend`)
      .then(() => undefined),
};