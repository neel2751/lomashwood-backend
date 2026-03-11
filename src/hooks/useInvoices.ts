import { useQuery } from "@tanstack/react-query";

import { fetchWithAuth, buildQueryString } from "@/lib/fetch-client";

export function useInvoices(filters?: Record<string, unknown>) {
  return useQuery({
    queryKey: ["invoices", filters],
    queryFn: () => fetchWithAuth(`/api/invoices${buildQueryString(filters)}`),
  });
}

export function useInvoice(id: string) {
  return useQuery({
    queryKey: ["invoices", id],
    queryFn: () => fetchWithAuth(`/api/invoices/${id}`),
    enabled: !!id,
  });
}