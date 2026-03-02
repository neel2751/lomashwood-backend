import { apiClient } from "@/lib/api-client";
import type { ApiResponse } from "@/lib/api-client";
import axios from "@/lib/axios";

type InventoryItem = {
  id: string;
  productId: string;
  quantity: number;
  sku?: string;
  createdAt?: string;
  updatedAt?: string;
};

export const inventoryService = {
  getAll: (params?: Record<string, unknown>) =>
    apiClient.inventory.getAll(params),

  getById: (id: string) =>
    apiClient.inventory.getById(id),

  create: (payload: Partial<InventoryItem>) =>
    apiClient.inventory.create(payload),

  update: (id: string, payload: Partial<InventoryItem>) =>
    apiClient.inventory.update(id, payload),

  remove: (id: string) =>
    apiClient.inventory.delete(id),

  adjustStock: (
    id: string,
    adjustment: { quantity: number; reason: string },
  ): Promise<ApiResponse<InventoryItem>> =>
    axios
      .post<ApiResponse<InventoryItem>>(`/inventory/${id}/adjust`, adjustment)
      .then((r) => r.data),

  getByProduct: (productId: string): Promise<ApiResponse<InventoryItem>> =>
    axios
      .get<ApiResponse<InventoryItem>>(`/inventory/by-product/${productId}`)
      .then((r) => r.data),
};