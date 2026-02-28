import { productClient } from "@/lib/api-client";
import type { Product } from "@/lib/api-client";

export const productService = {
  getAll: (params?: Record<string, unknown>) =>
    productClient.products.getAll(params),

  getById: (id: string) => productClient.products.getById(id),

  create: (payload: Partial<Product>) =>
    productClient.products.create(payload),

  update: (id: string, payload: Partial<Product>) =>
    productClient.products.update(id, payload),

  patch: (id: string, payload: Partial<Product>) =>
    productClient.products.patch(id, payload),

  remove: (id: string) => productClient.products.remove(id),

  uploadImages: (productId: string, files: File[]) =>
    productClient.uploadImages(productId, files),
};