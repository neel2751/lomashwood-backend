import { axiosInstance } from "@/lib/axios"
import type { AxiosResponse } from "axios"

export interface AuditLog {
  id: string
  action: string
  entity: string
  entityId: string
  performedBy: string
  createdAt: string
}

export interface AuditLogResponse {
  data: AuditLog[]
  total: number
  page: number
  limit: number
}

export const auditService = {
  getLogs: async (params?: {
    page?: number
    limit?: number
    search?: string
  }): Promise<AuditLogResponse> => {
    const response: AxiosResponse<AuditLogResponse> =
      await axiosInstance.get("/settings/audit-logs", {
        params,
      })

    return response.data
  },
} as const