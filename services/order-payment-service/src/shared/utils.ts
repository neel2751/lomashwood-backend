import { randomBytes, createHash } from 'crypto';
import { ORDER_CONSTANTS, INVOICE_CONSTANTS } from './constants';

export function generateOrderNumber(): string {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = randomBytes(3).toString('hex').toUpperCase();
  const raw = `${ORDER_CONSTANTS.ORDER_NUMBER_PREFIX}${timestamp}${random}`;
  return raw.slice(0, ORDER_CONSTANTS.ORDER_NUMBER_LENGTH + ORDER_CONSTANTS.ORDER_NUMBER_PREFIX.length);
}

export function generateInvoiceNumber(): string {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = randomBytes(2).toString('hex').toUpperCase();
  const raw = `${INVOICE_CONSTANTS.INVOICE_NUMBER_PREFIX}${timestamp}${random}`;
  return raw.slice(0, INVOICE_CONSTANTS.INVOICE_NUMBER_LENGTH + INVOICE_CONSTANTS.INVOICE_NUMBER_PREFIX.length);
}

export function generateIdempotencyKey(input: string): string {
  return createHash('sha256').update(input).digest('hex');
}

export function generateEventId(): string {
  return randomBytes(16).toString('hex');
}

export function toPence(amount: number): number {
  return Math.round(amount * 100);
}

export function fromPence(pence: number): number {
  return pence / 100;
}

export function formatCurrency(amount: number, currency: string): string {
  return new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: currency.toUpperCase(),
  }).format(amount);
}

export function calculateVat(amount: number, vatRate: number): number {
  return roundToTwoDecimals(amount * vatRate);
}

export function calculateSubtotalFromItems(
  items: Array<{ unitPrice: number; quantity: number }>,
): number {
  return roundToTwoDecimals(
    items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0),
  );
}

export function roundToTwoDecimals(value: number): number {
  return Math.round(value * 100) / 100;
}

export function isValidPostcode(postcode: string): boolean {
  const postcodeRegex = /^[A-Z]{1,2}\d[A-Z\d]?\s?\d[A-Z]{2}$/i;
  return postcodeRegex.test(postcode.trim());
}

export function sanitisePostcode(postcode: string): string {
  return postcode.trim().toUpperCase().replace(/\s+/g, ' ');
}

export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export function maskCardNumber(last4: string): string {
  return `**** **** **** ${last4}`;
}

export function maskEmail(email: string): string {
  const [local, domain] = email.split('@');
  if (!local || !domain) return email;
  const visible = local.slice(0, 2);
  const masked = '*'.repeat(Math.max(0, local.length - 2));
  return `${visible}${masked}@${domain}`;
}

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function calculateBackoffDelay(
  attempt: number,
  baseDelayMs: number,
  maxDelayMs: number,
  multiplier = 2,
): number {
  const delay = baseDelayMs * Math.pow(multiplier, attempt - 1);
  const jitter = Math.random() * 0.2 * delay;
  return Math.min(delay + jitter, maxDelayMs);
}

export async function withRetry<T>(
  fn: () => Promise<T>,
  maxAttempts: number,
  baseDelayMs: number,
  maxDelayMs: number,
): Promise<T> {
  let lastError: unknown;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err;
      if (attempt < maxAttempts) {
        const delay = calculateBackoffDelay(attempt, baseDelayMs, maxDelayMs);
        await sleep(delay);
      }
    }
  }

  throw lastError;
}

export function omitNullish<T extends Record<string, unknown>>(
  obj: T,
): Partial<T> {
  return Object.fromEntries(
    Object.entries(obj).filter(([, v]) => v !== null && v !== undefined),
  ) as Partial<T>;
}

export function chunkArray<T>(array: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
}

export function isoNow(): string {
  return new Date().toISOString();
}

export function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

export function addMinutes(date: Date, minutes: number): Date {
  return new Date(date.getTime() + minutes * 60 * 1000);
}

export function isExpired(date: Date): boolean {
  return date.getTime() < Date.now();
}

export function pickFields<T extends object, K extends keyof T>(
  obj: T,
  keys: K[],
): Pick<T, K> {
  return keys.reduce((acc, key) => {
    acc[key] = obj[key];
    return acc;
  }, {} as Pick<T, K>);
}

export function safeJsonParse<T>(json: string, fallback: T): T {
  try {
    return JSON.parse(json) as T;
  } catch {
    return fallback;
  }
}