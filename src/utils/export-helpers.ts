import type { ExportFormat, ExportResource } from "@/services/exportService";

export function getMimeType(format: ExportFormat): string {
  const map: Record<ExportFormat, string> = {
    csv: "text/csv",
    xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    json: "application/json",
  };
  return map[format];
}

export function buildExportFilename(
  resource: ExportResource,
  format: ExportFormat,
  dateRange?: { startDate: string; endDate: string },
): string {
  const base = `lomashwood-${resource}`;
  if (dateRange) {
    return `${base}-${dateRange.startDate}-to-${dateRange.endDate}.${format}`;
  }
  const timestamp = new Date().toISOString().slice(0, 10);
  return `${base}-${timestamp}.${format}`;
}

export function triggerBlobDownload(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
}

export function arrayToCsv<T extends Record<string, unknown>>(
  rows: T[],
  columns?: (keyof T)[],
): string {
  if (!rows.length) return "";
  const keys = columns ?? (Object.keys(rows[0]) as (keyof T)[]);
  const header = keys.map((k) => escapeCsvCell(String(k))).join(",");
  const body = rows
    .map((row) =>
      keys.map((key) => escapeCsvCell(String(row[key] ?? ""))).join(","),
    )
    .join("\n");
  return `${header}\n${body}`;
}

export function escapeCsvCell(value: string): string {
  if (value.includes(",") || value.includes('"') || value.includes("\n")) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

export function downloadCsv<T extends Record<string, unknown>>(
  rows: T[],
  filename: string,
  columns?: (keyof T)[],
): void {
  const csv = arrayToCsv(rows, columns);
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  triggerBlobDownload(blob, filename);
}

export function downloadJson<T>(data: T, filename: string): void {
  const json = JSON.stringify(data, null, 2);
  const blob = new Blob([json], { type: "application/json" });
  triggerBlobDownload(blob, filename);
}

export function getExportFormatLabel(format: ExportFormat): string {
  const map: Record<ExportFormat, string> = {
    csv: "CSV",
    xlsx: "Excel (XLSX)",
    json: "JSON",
  };
  return map[format];
}

export function getExportResourceLabel(resource: ExportResource): string {
  const map: Record<ExportResource, string> = {
    orders: "Orders",
    products: "Products",
    customers: "Customers",
    appointments: "Appointments",
    payments: "Payments",
    refunds: "Refunds",
    inventory: "Inventory",
    reviews: "Reviews",
    support: "Support Tickets",
    analytics: "Analytics",
  };
  return map[resource];
}

export function validateDateRange(
  startDate: string,
  endDate: string,
): { valid: boolean; error?: string } {
  if (!startDate || !endDate) {
    return { valid: false, error: "Both start and end dates are required." };
  }
  const start = new Date(startDate);
  const end = new Date(endDate);
  if (isNaN(start.getTime()) || isNaN(end.getTime())) {
    return { valid: false, error: "Invalid date format." };
  }
  if (start > end) {
    return { valid: false, error: "Start date must be before end date." };
  }
  const diffDays = (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24);
  if (diffDays > 366) {
    return { valid: false, error: "Date range cannot exceed 366 days." };
  }
  return { valid: true };
}

export function getDefaultDateRange(): { startDate: string; endDate: string } {
  const end = new Date();
  const start = new Date();
  start.setDate(start.getDate() - 30);
  return {
    startDate: start.toISOString().slice(0, 10),
    endDate: end.toISOString().slice(0, 10),
  };
}

export function flattenObjectForExport<T extends Record<string, unknown>>(
  obj: T,
  prefix = "",
): Record<string, string | number | boolean> {
  const result: Record<string, string | number | boolean> = {};
  for (const [key, value] of Object.entries(obj)) {
    const fullKey = prefix ? `${prefix}.${key}` : key;
    if (
      typeof value === "object" &&
      value !== null &&
      !Array.isArray(value)
    ) {
      Object.assign(
        result,
        flattenObjectForExport(value as Record<string, unknown>, fullKey),
      );
    } else if (Array.isArray(value)) {
      result[fullKey] = value.join("; ");
    } else {
      result[fullKey] = value as string | number | boolean;
    }
  }
  return result;
}