import { analyticsClient } from "@/lib/api-client";
import { axiosInstance } from "@/lib/axios";

export type ExportFormat = "csv" | "xlsx" | "json";

export type ExportResource =
  | "orders"
  | "products"
  | "customers"
  | "appointments"
  | "payments"
  | "refunds"
  | "inventory"
  | "reviews"
  | "support"
  | "analytics";

export type ExportParams = {
  format: ExportFormat;
  startDate?: string;
  endDate?: string;
  filters?: Record<string, unknown>;
};

const RESOURCE_EXPORT_PATHS: Record<ExportResource, string> = {
  orders: "/orders/export",
  products: "/products/export",
  customers: "/customers/export",
  appointments: "/appointments/export",
  payments: "/orders/payments/export",
  refunds: "/orders/refunds/export",
  inventory: "/products/inventory/export",
  reviews: "/customers/reviews/export",
  support: "/customers/support/export",
  analytics: "/analytics/exports",
};

export const exportService = {
  exportAnalytics: (params: {
    startDate: string;
    endDate: string;
    format: ExportFormat;
  }): Promise<Blob> => analyticsClient.export(params),

  exportResource: (
    resource: ExportResource,
    params: ExportParams,
  ): Promise<Blob> => {
    const path = RESOURCE_EXPORT_PATHS[resource];
    return axiosInstance
      .get(path, { params, responseType: "blob" })
      .then((r) => r.data as Blob);
  },

  exportOrders: (params: ExportParams): Promise<Blob> =>
    axiosInstance
      .get("/orders/export", { params, responseType: "blob" })
      .then((r) => r.data as Blob),

  exportProducts: (params: ExportParams): Promise<Blob> =>
    axiosInstance
      .get("/products/export", { params, responseType: "blob" })
      .then((r) => r.data as Blob),

  exportCustomers: (params: ExportParams): Promise<Blob> =>
    axiosInstance
      .get("/customers/export", { params, responseType: "blob" })
      .then((r) => r.data as Blob),

  exportAppointments: (params: ExportParams): Promise<Blob> =>
    axiosInstance
      .get("/appointments/export", { params, responseType: "blob" })
      .then((r) => r.data as Blob),

  exportInventory: (params: ExportParams): Promise<Blob> =>
    axiosInstance
      .get("/products/inventory/export", { params, responseType: "blob" })
      .then((r) => r.data as Blob),

  triggerDownload: (blob: Blob, filename: string): void => {
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = filename;
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    URL.revokeObjectURL(url);
  },

  buildFilename: (resource: ExportResource, format: ExportFormat): string => {
    const timestamp = new Date().toISOString().slice(0, 10);
    return `lomashwood-${resource}-${timestamp}.${format}`;
  },

  downloadExport: async (
    resource: ExportResource,
    params: ExportParams,
  ): Promise<void> => {
    const blob = await exportService.exportResource(resource, params);
    const filename = exportService.buildFilename(resource, params.format);
    exportService.triggerDownload(blob, filename);
  },
};