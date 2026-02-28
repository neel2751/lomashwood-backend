import { productClient } from "@/lib/api-client";
import type { PricingRule } from "@/lib/api-client";
import { axiosInstance } from "@/lib/axios";
import type { ApiResponse, PaginatedResponse } from "@/lib/api-client";

export const pricingService = {
  getAll: (params?: Record<string, unknown>) =>
    productClient.pricing.getAll(params),

  getById: (id: string) => productClient.pricing.getById(id),

  create: (payload: Partial<PricingRule>) =>
    productClient.pricing.create(payload),

  update: (id: string, payload: Partial<PricingRule>) =>
    productClient.pricing.update(id, payload),

  patch: (id: string, payload: Partial<PricingRule>) =>
    productClient.pricing.patch(id, payload),

  remove: (id: string) => productClient.pricing.remove(id),

  getByProduct: (productId: string): Promise<PaginatedResponse<PricingRule>> =>
    axiosInstance
      .get<PaginatedResponse<PricingRule>>(
        `/products/pricing/by-product/${productId}`,
      )
      .then((r) => r.data),

  bulkUpdate: (
    rules: Array<{ id: string } & Partial<PricingRule>>,
  ): Promise<ApiResponse<PricingRule[]>> =>
    axiosInstance
      .patch<ApiResponse<PricingRule[]>>("/products/pricing/bulk", { rules })
      .then((r) => r.data),
};