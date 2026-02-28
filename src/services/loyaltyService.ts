import { customerClient } from "@/lib/api-client";
import type { LoyaltyAccount } from "@/lib/api-client";
import { axiosInstance } from "@/lib/axios";
import type { ApiResponse } from "@/lib/api-client";

export const loyaltyService = {
  getAll: (params?: Record<string, unknown>) =>
    customerClient.loyalty.getAll(params),

  getById: (id: string) => customerClient.loyalty.getById(id),

  create: (payload: Partial<LoyaltyAccount>) =>
    customerClient.loyalty.create(payload),

  update: (id: string, payload: Partial<LoyaltyAccount>) =>
    customerClient.loyalty.update(id, payload),

  patch: (id: string, payload: Partial<LoyaltyAccount>) =>
    customerClient.loyalty.patch(id, payload),

  remove: (id: string) => customerClient.loyalty.remove(id),

  getByCustomer: (customerId: string): Promise<ApiResponse<LoyaltyAccount>> =>
    axiosInstance
      .get<ApiResponse<LoyaltyAccount>>(
        `/customers/loyalty/by-customer/${customerId}`,
      )
      .then((r) => r.data),

  adjustPoints: (
    id: string,
    adjustment: { points: number; reason: string },
  ): Promise<ApiResponse<LoyaltyAccount>> =>
    axiosInstance
      .post<ApiResponse<LoyaltyAccount>>(
        `/customers/loyalty/${id}/adjust`,
        adjustment,
      )
      .then((r) => r.data),

  upgradeTier: (
    id: string,
    tier: string,
  ): Promise<ApiResponse<LoyaltyAccount>> =>
    axiosInstance
      .patch<ApiResponse<LoyaltyAccount>>(`/customers/loyalty/${id}/tier`, {
        tier,
      })
      .then((r) => r.data),
};