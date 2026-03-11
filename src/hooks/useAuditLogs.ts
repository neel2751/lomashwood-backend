import { useQuery } from "@tanstack/react-query";

import { fetchWithAuth, buildQueryString } from "@/lib/fetch-client";

export const useAuditLogs = (params?: {
  page?: number;
  limit?: number;
  search?: string;
}) => {
  return useQuery({
    queryKey: ["audit-logs", params],
    queryFn: () => fetchWithAuth(`/api/audit-logs${buildQueryString(params || {})}`),
  });
};