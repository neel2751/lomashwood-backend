import type { PaginationMeta } from './pagination';
import { BOOKING_WINDOW_DAYS, SLOT_DURATION_MINUTES } from './constants';
import {
  BookingWindowExceededError,
  InvalidDateRangeError,
  PastDateBookingError,
} from './errors';

export function generateId(): string {
  return crypto.randomUUID();
}

export function isValidUUID(value: string): boolean {
  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(value);
}

export function toISODateString(date: Date): string {
  return date.toISOString().split('T')[0];
}

export function toTimeString(date: Date): string {
  return date.toTimeString().slice(0, 5);
}

export function combineDateAndTime(date: Date, time: string): Date {
  const [hours, minutes] = time.split(':').map(Number);
  const combined = new Date(date);
  combined.setHours(hours, minutes, 0, 0);
  return combined;
}

export function addMinutes(date: Date, minutes: number): Date {
  return new Date(date.getTime() + minutes * 60 * 1000);
}

export function addHours(date: Date, hours: number): Date {
  return addMinutes(date, hours * 60);
}

export function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

export function startOfDay(date: Date): Date {
  const result = new Date(date);
  result.setHours(0, 0, 0, 0);
  return result;
}

export function endOfDay(date: Date): Date {
  const result = new Date(date);
  result.setHours(23, 59, 59, 999);
  return result;
}

export function isDateInPast(date: Date): boolean {
  return date.getTime() < Date.now();
}

export function daysBetween(from: Date, to: Date): number {
  const msPerDay = 1000 * 60 * 60 * 24;
  return Math.floor((to.getTime() - from.getTime()) / msPerDay);
}

export function validateBookingDate(date: Date): void {
  if (isDateInPast(date)) {
    throw new PastDateBookingError();
  }

  const daysAhead = daysBetween(new Date(), date);
  if (daysAhead > BOOKING_WINDOW_DAYS) {
    throw new BookingWindowExceededError(BOOKING_WINDOW_DAYS);
  }
}

export function validateDateRange(from: Date, to: Date): void {
  if (from.getTime() >= to.getTime()) {
    throw new InvalidDateRangeError();
  }
}

export function generateSlotEndTime(startTime: string): string {
  const [hours, minutes] = startTime.split(':').map(Number);
  const totalMinutes = hours * 60 + minutes + SLOT_DURATION_MINUTES;
  const endHours = Math.floor(totalMinutes / 60);
  const endMinutes = totalMinutes % 60;
  return `${String(endHours).padStart(2, '0')}:${String(endMinutes).padStart(2, '0')}`;
}

export function doesSlotOverlap(
  slotAStart: string,
  slotAEnd: string,
  slotBStart: string,
  slotBEnd: string,
): boolean {
  const toMinutes = (time: string): number => {
    const [h, m] = time.split(':').map(Number);
    return h * 60 + m;
  };

  const aStart = toMinutes(slotAStart);
  const aEnd = toMinutes(slotAEnd);
  const bStart = toMinutes(slotBStart);
  const bEnd = toMinutes(slotBEnd);

  return aStart < bEnd && aEnd > bStart;
}

export function formatAppointmentConfirmationDate(date: Date): string {
  return date.toLocaleDateString('en-GB', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

export function formatAppointmentTime(time: string): string {
  const [hours, minutes] = time.split(':').map(Number);
  const period = hours >= 12 ? 'PM' : 'AM';
  const displayHours = hours % 12 === 0 ? 12 : hours % 12;
  return `${displayHours}:${String(minutes).padStart(2, '0')} ${period}`;
}

export function sanitiseString(value: string): string {
  return value.trim().replace(/\s+/g, ' ');
}

export function maskEmail(email: string): string {
  const [local, domain] = email.split('@');
  const maskedLocal = local.slice(0, 2) + '*'.repeat(Math.max(0, local.length - 2));
  return `${maskedLocal}@${domain}`;
}

export function maskPhone(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  return digits.slice(0, 3) + '*'.repeat(Math.max(0, digits.length - 6)) + digits.slice(-3);
}

export function chunkArray<T>(array: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
}

export function omitNullish<T extends Record<string, unknown>>(
  obj: T,
): Partial<T> {
  return Object.fromEntries(
    Object.entries(obj).filter(([, v]) => v !== null && v !== undefined),
  ) as Partial<T>;
}

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export const successResponse = <T>(data: T, message?: string) => ({
  success: true,
  ...(message && { message }),
  data,
});

export const paginatedResponse = <T>(data: T[], meta: PaginationMeta) => ({
  success: true,
  data,
  meta,
});