import { apiClient } from "@/lib/api-client";
import type {
  CreatePackagePayload,
  CreateProductPayload,
  UpdatePackagePayload,
  UpdateProductPayload,
} from "@/types/product.types";

export const productService = {
  getAll: (params?: Record<string, unknown>) =>
    apiClient.products.getAll(params),

  getById: (id: string) => apiClient.products.getById(id),

  create: (payload: CreateProductPayload) =>
    apiClient.products.create(payload),

  update: (id: string, payload: UpdateProductPayload) =>
    apiClient.products.update(id, payload),

  patch: (id: string, payload: UpdateProductPayload) =>
    apiClient.products.update(id, payload),

  remove: (id: string) => apiClient.products.delete(id),

  uploadImages: (_productId: string, files: File[]) => {
    const formData = new FormData();
    files.forEach((file) => formData.append("files", file));
    return apiClient.media.upload(formData);
  },
};

export const packageService = {
  getAll: (params?: Record<string, unknown>) => apiClient.packages.getAll(params),
  getById: (id: string) => apiClient.packages.getById(id),
  create: (payload: CreatePackagePayload) => apiClient.packages.create(payload),
  update: (id: string, payload: UpdatePackagePayload) => apiClient.packages.update(id, payload),
  remove: (id: string) => apiClient.packages.delete(id),
};