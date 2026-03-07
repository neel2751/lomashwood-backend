
import { apiClient } from "@/lib/api-client";
import axios from "@/lib/axios";

import type { ApiResponse } from "@/lib/api-client";

type LoyaltyAccount = {
  id: string;
  customerId: string;
  points: number;
  tier?: string;
  createdAt?: string;
  updatedAt?: string;
};

export const loyaltyService = {
  getAll: (params?: Record<string, unknown>) =>
    apiClient.loyalty.getAll(params),

  getById: (id: string) =>
    apiClient.loyalty.getById(id),

  create: (payload: Partial<LoyaltyAccount>) =>
    apiClient.loyalty.create(payload),

  update: (id: string, payload: Partial<LoyaltyAccount>) =>
    apiClient.loyalty.update(id, payload),

  remove: (id: string) =>
    apiClient.loyalty.delete(id),

  getByCustomer: (customerId: string): Promise<ApiResponse<LoyaltyAccount>> =>
    axios
      .get<ApiResponse<LoyaltyAccount>>(`/loyalty/by-customer/${customerId}`)
      .then((r) => r.data),

  adjustPoints: (
    id: string,
    adjustment: { points: number; reason: string },
  ): Promise<ApiResponse<LoyaltyAccount>> =>
    apiClient.loyalty.adjust(id, adjustment),

  upgradeTier: (id: string, tier: string): Promise<ApiResponse<LoyaltyAccount>> =>
    axios
      .patch<ApiResponse<LoyaltyAccount>>(`/loyalty/${id}/tier`, { tier })
      .then((r) => r.data),
};