import { apiClient } from "@/lib/api-client";
import type { ApiResponse, PaginatedResponse } from "@/lib/api-client";
import type { PricingRule } from "@/types/product.types";
import axios from "@/lib/axios";

export const pricingService = {
  getAll: (params?: Record<string, unknown>) =>
    apiClient.pricing.getAll(params),

  getById: (id: string) => apiClient.pricing.getById(id),

  create: (payload: Partial<PricingRule>) =>
    apiClient.pricing.create(payload),

  update: (id: string, payload: Partial<PricingRule>) =>
    apiClient.pricing.update(id, payload),

  patch: (id: string, payload: Partial<PricingRule>) =>
    axios.patch(`/products/pricing/${id}`, payload).then((r) => r.data),

  remove: (id: string) => apiClient.pricing.delete(id),

  getByProduct: (productId: string): Promise<PaginatedResponse<PricingRule>> =>
    axios
      .get<PaginatedResponse<PricingRule>>(
        `/products/pricing/by-product/${productId}`,
      )
      .then((r) => r.data),

  bulkUpdate: (
    rules: Array<{ id: string } & Partial<PricingRule>>,
  ): Promise<ApiResponse<PricingRule[]>> =>
    axios
      .patch<ApiResponse<PricingRule[]>>("/products/pricing/bulk", { rules })
      .then((r) => r.data),
};