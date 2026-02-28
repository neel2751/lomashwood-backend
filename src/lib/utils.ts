
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";


export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}


export function capitalise(str: string): string {
  if (!str) return "";
  return str.charAt(0).toUpperCase() + str.slice(1);
}


export function toTitleCase(str: string): string {
  return str
    .replace(/[-_]/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

export function truncate(str: string, maxLength: number): string {
  if (str.length <= maxLength) return str;
  return `${str.slice(0, maxLength - 1)}…`;
}


export function slugify(str: string): string {
  return str
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_]+/g, "-")
    .replace(/^-+|-+$/g, "");
}


export function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

export function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function groupBy<T extends Record<string, unknown>>(
  array: T[],
  key: keyof T,
): Record<string, T[]> {
  return array.reduce<Record<string, T[]>>((acc, item) => {
    const group = String(item[key]);
    if (!acc[group]) acc[group] = [];
    acc[group].push(item);
    return acc;
  }, {});
}

export function unique<T>(array: T[]): T[] {
  return Array.from(new Set(array));
}


export function chunk<T>(array: T[], size: number): T[][] {
  const result: T[][] = [];
  for (let i = 0; i < array.length; i += size) {
    result.push(array.slice(i, i + size));
  }
  return result;
}

export function deepMerge<T extends Record<string, unknown>>(
  target: T,
  source: Partial<T>,
): T {
  const output = { ...target };
  for (const key in source) {
    const targetVal = target[key];
    const sourceVal = source[key];
    if (isPlainObject(targetVal) && isPlainObject(sourceVal)) {
      output[key] = deepMerge(
        targetVal as Record<string, unknown>,
        sourceVal as Record<string, unknown>,
      ) as T[typeof key];
    } else {
      output[key] = sourceVal as T[typeof key];
    }
  }
  return output;
}

function isPlainObject(val: unknown): val is Record<string, unknown> {
  return typeof val === "object" && val !== null && !Array.isArray(val);
}


export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}


export async function withRetry<T>(
  fn: () => Promise<T>,
  maxAttempts = 3,
  baseDelayMs = 200,
): Promise<T> {
  let lastError: unknown;
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err;
      if (attempt < maxAttempts - 1) {
        await sleep(baseDelayMs * Math.pow(2, attempt));
      }
    }
  }
  throw lastError;
}


export function toSearchParams(
  params: Record<string, string | number | boolean | null | undefined>,
): string {
  const sp = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== null && value !== undefined && value !== "") {
      sp.set(key, String(value));
    }
  }
  const str = sp.toString();
  return str ? `?${str}` : "";
}


export function fromSearchParams(search: string): Record<string, string> {
  const sp = new URLSearchParams(search);
  const result: Record<string, string> = {};
  sp.forEach((value, key) => {
    result[key] = value;
  });
  return result;
}


export function getContrastColor(hex: string): "black" | "white" {
  const sanitised = hex.replace("#", "");
  const r = parseInt(sanitised.substring(0, 2), 16);
  const g = parseInt(sanitised.substring(2, 4), 16);
  const b = parseInt(sanitised.substring(4, 6), 16);
  
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.5 ? "black" : "white";
}


export function isValidHex(value: string): boolean {
  return /^#([A-Fa-f0-9]{3}|[A-Fa-f0-9]{6})$/.test(value);
}

export function generateUuid(): string {
  return crypto.randomUUID();
}

export const isBrowser = typeof window !== "undefined";


export function assertNever(value: never): never {
  throw new Error(`Unexpected value: ${JSON.stringify(value)}`);
}