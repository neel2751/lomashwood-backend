import { useQuery } from "@tanstack/react-query";

import { paymentService } from "@/services/paymentService";
import { fetchWithAuth, buildQueryString } from "@/lib/fetch-client";

export function usePayments(filters?: Record<string, unknown>) {
  return useQuery({
    queryKey: ["payments", filters],
    queryFn: () => fetchWithAuth(`/api/payments${buildQueryString(filters)}`),
  });
}

export function usePayment(id: string) {
  return useQuery({
    queryKey: ["payments", id],
    queryFn: () => paymentService.getById(id),
    enabled: !!id,
  });
}