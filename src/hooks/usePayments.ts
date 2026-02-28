import { useQuery } from "@tanstack/react-query";
import { paymentService } from "@/services/paymentService";
import type { PaymentFilters } from "@/types/order.types";

export function usePayments(filters?: PaymentFilters) {
  return useQuery({
    queryKey: ["payments", filters],
    queryFn: () => paymentService.getAll(filters),
  });
}

export function usePayment(id: string) {
  return useQuery({
    queryKey: ["payments", id],
    queryFn: () => paymentService.getById(id),
    enabled: !!id,
  });
}