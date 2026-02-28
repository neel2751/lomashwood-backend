import { useQuery } from "@tanstack/react-query";
import { invoiceService } from "@/services/invoiceService";
import type { InvoiceFilters } from "@/types/order.types";

export function useInvoices(filters?: InvoiceFilters) {
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