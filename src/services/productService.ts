import { apiClient } from "@/lib/api-client";

export type Product = {
  id: string;
  name: string;
  description?: string;
  price: number;
  categoryId?: string;
  colorId?: string;
  sizeId?: string;
  images?: string[];
  isActive?: boolean;
  createdAt: string;
  updatedAt: string;
};

export const productService = {
  getAll: (params?: Record<string, unknown>) =>
    apiClient.products.getAll(params),

  getById: (id: string) => apiClient.products.getById(id),

  create: (payload: Partial<Product>) =>
    apiClient.products.create(payload),

  update: (id: string, payload: Partial<Product>) =>
    apiClient.products.update(id, payload),

  patch: (id: string, payload: Partial<Product>) =>
    apiClient.products.update(id, payload),

  remove: (id: string) => apiClient.products.delete(id),

  uploadImages: (_productId: string, files: File[]) => {
    const formData = new FormData();
    files.forEach((file) => formData.append("files", file));
    return apiClient.media.upload(formData);
  },
};