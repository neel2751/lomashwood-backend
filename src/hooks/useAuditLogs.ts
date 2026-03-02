import { useQuery } from "@tanstack/react-query"
import { auditService } from "@/services/auditService"

export const useAuditLogs = (params?: {
  page?: number
  limit?: number
  search?: string
}) => {
  return useQuery({
    queryKey: ["audit-logs", params],
    queryFn: () => auditService.getLogs(params),
  })
}