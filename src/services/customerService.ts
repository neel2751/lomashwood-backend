import { axiosInstance } from "@/lib/axios";

import type { CustomerFilterParams } from "@/types/customer.types";

export const customerService = {
  getAll: async (params?: CustomerFilterParams) => {
    const response = await axiosInstance.get("/customers", { params });
    return response.data;
  },

  getById: async (id: string) => {
    const response = await axiosInstance.get(`/customers/${id}`);
    return response.data;
  },

  update: async (id: string, payload: Record<string, unknown>) => {
    const response = await axiosInstance.put(`/customers/${id}`, payload);
    return response.data;
  },

  remove: async (id: string) => {
    const response = await axiosInstance.delete(`/customers/${id}`);
    return response.data;
  },
} as const;