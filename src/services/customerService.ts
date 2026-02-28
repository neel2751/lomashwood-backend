import { customerClient } from "@/lib/api-client";
import type { Customer } from "@/lib/api-client";
import { axiosInstance } from "@/lib/axios";
import type { ApiResponse } from "@/lib/api-client";

export const customerService = {
  getAll: (params?: Record<string, unknown>) =>
    customerClient.customers.getAll(params),

  getById: (id: string) => customerClient.customers.getById(id),

  create: (payload: Partial<Customer>) =>
    customerClient.customers.create(payload),

  update: (id: string, payload: Partial<Customer>) =>
    customerClient.customers.update(id, payload),

  patch: (id: string, payload: Partial<Customer>) =>
    customerClient.customers.patch(id, payload),

  remove: (id: string) => customerClient.customers.remove(id),

  getTimeline: (id: string) =>
    axiosInstance
      .get(`/customers/${id}/timeline`)
      .then((r) => r.data),

  exportCsv: (): Promise<Blob> =>
    axiosInstance
      .get("/customers/export", { responseType: "blob" })
      .then((r) => r.data as Blob),
};