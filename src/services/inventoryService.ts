import { productClient } from "@/lib/api-client";
import type { InventoryItem } from "@/lib/api-client";
import { axiosInstance } from "@/lib/axios";
import type { ApiResponse } from "@/lib/api-client";

export const inventoryService = {
  getAll: (params?: Record<string, unknown>) =>
    productClient.inventory.getAll(params),

  getById: (id: string) => productClient.inventory.getById(id),

  create: (payload: Partial<InventoryItem>) =>
    productClient.inventory.create(payload),

  update: (id: string, payload: Partial<InventoryItem>) =>
    productClient.inventory.update(id, payload),

  patch: (id: string, payload: Partial<InventoryItem>) =>
    productClient.inventory.patch(id, payload),

  remove: (id: string) => productClient.inventory.remove(id),

  adjustStock: (
    id: string,
    adjustment: { quantity: number; reason: string },
  ): Promise<ApiResponse<InventoryItem>> =>
    axiosInstance
      .post<ApiResponse<InventoryItem>>(
        `/products/inventory/${id}/adjust`,
        adjustment,
      )
      .then((r) => r.data),

  getByProduct: (productId: string): Promise<ApiResponse<InventoryItem>> =>
    axiosInstance
      .get<ApiResponse<InventoryItem>>(
        `/products/inventory/by-product/${productId}`,
      )
      .then((r) => r.data),
};