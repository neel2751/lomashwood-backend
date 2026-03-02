import { axiosInstance } from "@/lib/axios"
import type { AxiosResponse } from "axios"

export interface Settings {
  id: string
  key: string
  value: unknown
  description?: string
  createdAt: string
  updatedAt: string
}

export interface SettingsResponse {
  data: Settings[]
  total: number
}

export const settingsService = {
  getSettings: async (): Promise<SettingsResponse> => {
    const response: AxiosResponse<SettingsResponse> =
      await axiosInstance.get("/settings")

    return response.data
  },

  getSetting: async (key: string): Promise<Settings> => {
    const response: AxiosResponse<Settings> =
      await axiosInstance.get(`/settings/${key}`)

    return response.data
  },

  updateSettings: async (payload: Partial<Settings>): Promise<Settings> => {
    const response: AxiosResponse<Settings> =
      await axiosInstance.put("/settings", payload)

    return response.data
  },

  updateSetting: async (
    key: string,
    value: unknown
  ): Promise<Settings> => {
    const response: AxiosResponse<Settings> =
      await axiosInstance.put(`/settings/${key}`, { value })

    return response.data
  },
} as const

export type { Settings, SettingsResponse }
