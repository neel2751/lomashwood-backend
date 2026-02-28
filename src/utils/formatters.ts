import { format, formatDistanceToNow, parseISO, isValid } from "date-fns";
import { DATE_FORMAT, DATETIME_FORMAT, TIME_FORMAT } from "@/lib/constants";

export function formatDate(value: string | Date | null | undefined): string {
  if (!value) return "—";
  const date = typeof value === "string" ? parseISO(value) : value;
  if (!isValid(date)) return "—";
  return format(date, DATE_FORMAT);
}

export function formatDateTime(value: string | Date | null | undefined): string {
  if (!value) return "—";
  const date = typeof value === "string" ? parseISO(value) : value;
  if (!isValid(date)) return "—";
  return format(date, DATETIME_FORMAT);
}

export function formatTime(value: string | Date | null | undefined): string {
  if (!value) return "—";
  const date = typeof value === "string" ? parseISO(value) : value;
  if (!isValid(date)) return "—";
  return format(date, TIME_FORMAT);
}

export function formatRelativeTime(value: string | Date | null | undefined): string {
  if (!value) return "—";
  const date = typeof value === "string" ? parseISO(value) : value;
  if (!isValid(date)) return "—";
  return formatDistanceToNow(date, { addSuffix: true });
}

export function formatCurrency(
  value: number | null | undefined,
  currency = "GBP",
  locale = "en-GB",
): string {
  if (value === null || value === undefined) return "—";
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

export function formatNumber(
  value: number | null | undefined,
  locale = "en-GB",
): string {
  if (value === null || value === undefined) return "—";
  return new Intl.NumberFormat(locale).format(value);
}

export function formatPercent(
  value: number | null | undefined,
  decimals = 1,
): string {
  if (value === null || value === undefined) return "—";
  return `${value.toFixed(decimals)}%`;
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  const index = Math.floor(Math.log(bytes) / Math.log(1024));
  const value = bytes / Math.pow(1024, index);
  return `${value.toFixed(1)} ${units[index]}`;
}

export function formatPhoneNumber(value: string | null | undefined): string {
  if (!value) return "—";
  const digits = value.replace(/\D/g, "");
  if (digits.length === 11 && digits.startsWith("0")) {
    return `${digits.slice(0, 5)} ${digits.slice(5, 8)} ${digits.slice(8)}`;
  }
  return value;
}

export function formatPostcode(value: string | null | undefined): string {
  if (!value) return "—";
  const clean = value.replace(/\s/g, "").toUpperCase();
  if (clean.length >= 5) {
    return `${clean.slice(0, -3)} ${clean.slice(-3)}`;
  }
  return value.toUpperCase();
}

export function formatOrderId(id: string): string {
  return `#${id.slice(0, 8).toUpperCase()}`;
}

export function formatAppointmentType(type: string): string {
  const map: Record<string, string> = {
    home: "Home Measurement",
    online: "Online Consultation",
    showroom: "Showroom Visit",
  };
  return map[type] ?? type;
}

export function formatProductCategory(category: string): string {
  const map: Record<string, string> = {
    kitchen: "Kitchen",
    bedroom: "Bedroom",
  };
  return map[category] ?? category;
}

export function formatBoolean(value: boolean | null | undefined): string {
  if (value === null || value === undefined) return "—";
  return value ? "Yes" : "No";
}

export function formatList(items: string[], max = 3): string {
  if (!items.length) return "—";
  if (items.length <= max) return items.join(", ");
  return `${items.slice(0, max).join(", ")} +${items.length - max} more`;
}

export function formatRating(value: number | null | undefined): string {
  if (value === null || value === undefined) return "—";
  return `${value.toFixed(1)} / 5`;
}

export function formatLoyaltyPoints(points: number): string {
  return `${formatNumber(points)} pts`;
}

export function formatNotificationChannel(channel: string): string {
  const map: Record<string, string> = {
    email: "Email",
    sms: "SMS",
    push: "Push",
  };
  return map[channel] ?? channel;
}

export function formatSlug(slug: string): string {
  return slug
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}