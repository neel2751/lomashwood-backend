import { useQuery } from "@tanstack/react-query";

import { invoiceService } from "@/services/invoiceService";

export function useInvoices(filters?: Record<string, unknown>) {
  return useQuery({
    queryKey: ["invoices", filters],
    queryFn: () => invoiceService.getAll(filters),
  });
}

export function useInvoice(id: string) {
  return useQuery({
    queryKey: ["invoices", id],
    queryFn: () => invoiceService.getById(id),
    enabled: !!id,
  });
}