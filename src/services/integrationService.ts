import { axiosInstance } from "@/lib/axios"
import type { AxiosResponse } from "axios"

export interface Integration {
  id: string
  name: string
  type: string
  enabled: boolean
  config: Record<string, unknown>
  createdAt: string
  updatedAt: string
}

export interface IntegrationResponse {
  data: Integration[]
  total: number
}

export const integrationService = {
  getAll: async (): Promise<IntegrationResponse> => {
    const response: AxiosResponse<IntegrationResponse> =
      await axiosInstance.get("/integrations")

    return response.data
  },

  getById: async (id: string): Promise<Integration> => {
    const response: AxiosResponse<Integration> =
      await axiosInstance.get(`/integrations/${id}`)

    return response.data
  },

  update: async (
    id: string,
    payload: Partial<Integration>
  ): Promise<Integration> => {
    const response: AxiosResponse<Integration> =
      await axiosInstance.put(`/integrations/${id}`, payload)

    return response.data
  },

  remove: async (id: string): Promise<void> => {
    await axiosInstance.delete(`/integrations/${id}`)
  },
} as const