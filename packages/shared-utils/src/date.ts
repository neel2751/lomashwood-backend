export type DateInput = Date | string | number;

export type TimeUnit = 'milliseconds' | 'seconds' | 'minutes' | 'hours' | 'days' | 'weeks' | 'months' | 'years';

export interface DateRange {
  readonly from: Date;
  readonly to: Date;
}

export interface TimeSlotRange {
  readonly date: string;
  readonly startTime: string;
  readonly endTime: string;
}

const MS_PER_SECOND = 1000;
const MS_PER_MINUTE = 60 * MS_PER_SECOND;
const MS_PER_HOUR = 60 * MS_PER_MINUTE;
const MS_PER_DAY = 24 * MS_PER_HOUR;
const MS_PER_WEEK = 7 * MS_PER_DAY;

export function toDate(input: DateInput): Date {
  if (input instanceof Date) {
    return new Date(input.getTime());
  }
  return new Date(input);
}

export function isValidDate(input: unknown): input is Date {
  if (!(input instanceof Date)) {
    return false;
  }
  return !Number.isNaN(input.getTime());
}

export function nowUtc(): Date {
  return new Date();
}

export function toIso(date: DateInput): string {
  return toDate(date).toISOString();
}

export function toDateString(date: DateInput): string {
  return toDate(date).toISOString().split('T')[0]!;
}

export function addTime(date: DateInput, amount: number, unit: TimeUnit): Date {
  const d = toDate(date);
  switch (unit) {
    case 'milliseconds':
      return new Date(d.getTime() + amount);
    case 'seconds':
      return new Date(d.getTime() + amount * MS_PER_SECOND);
    case 'minutes':
      return new Date(d.getTime() + amount * MS_PER_MINUTE);
    case 'hours':
      return new Date(d.getTime() + amount * MS_PER_HOUR);
    case 'days':
      return new Date(d.getTime() + amount * MS_PER_DAY);
    case 'weeks':
      return new Date(d.getTime() + amount * MS_PER_WEEK);
    case 'months': {
      const result = new Date(d.getTime());
      result.setMonth(result.getMonth() + amount);
      return result;
    }
    case 'years': {
      const result = new Date(d.getTime());
      result.setFullYear(result.getFullYear() + amount);
      return result;
    }
  }
}

export function subtractTime(date: DateInput, amount: number, unit: TimeUnit): Date {
  return addTime(date, -amount, unit);
}

export function diffInMs(from: DateInput, to: DateInput): number {
  return toDate(to).getTime() - toDate(from).getTime();
}

export function diffInSeconds(from: DateInput, to: DateInput): number {
  return Math.floor(diffInMs(from, to) / MS_PER_SECOND);
}

export function diffInMinutes(from: DateInput, to: DateInput): number {
  return Math.floor(diffInMs(from, to) / MS_PER_MINUTE);
}

export function diffInHours(from: DateInput, to: DateInput): number {
  return Math.floor(diffInMs(from, to) / MS_PER_HOUR);
}

export function diffInDays(from: DateInput, to: DateInput): number {
  return Math.floor(diffInMs(from, to) / MS_PER_DAY);
}

export function isBefore(date: DateInput, reference: DateInput): boolean {
  return toDate(date).getTime() < toDate(reference).getTime();
}

export function isAfter(date: DateInput, reference: DateInput): boolean {
  return toDate(date).getTime() > toDate(reference).getTime();
}

export function isSameDay(a: DateInput, b: DateInput): boolean {
  return toDateString(a) === toDateString(b);
}

export function isToday(date: DateInput): boolean {
  return isSameDay(date, new Date());
}

export function isPast(date: DateInput): boolean {
  return isBefore(date, new Date());
}

export function isFuture(date: DateInput): boolean {
  return isAfter(date, new Date());
}

export function isWithinRange(date: DateInput, range: DateRange): boolean {
  const d = toDate(date).getTime();
  return d >= range.from.getTime() && d <= range.to.getTime();
}

export function isExpired(expiresAt: DateInput): boolean {
  return isPast(expiresAt);
}

export function startOfDay(date: DateInput): Date {
  const d = toDate(date);
  d.setUTCHours(0, 0, 0, 0);
  return d;
}

export function endOfDay(date: DateInput): Date {
  const d = toDate(date);
  d.setUTCHours(23, 59, 59, 999);
  return d;
}

export function startOfWeek(date: DateInput): Date {
  const d = toDate(date);
  const day = d.getUTCDay();
  const diff = d.getUTCDate() - day + (day === 0 ? -6 : 1);
  d.setUTCDate(diff);
  d.setUTCHours(0, 0, 0, 0);
  return d;
}

export function endOfWeek(date: DateInput): Date {
  const start = startOfWeek(date);
  return addTime(endOfDay(start), 6, 'days');
}

export function startOfMonth(date: DateInput): Date {
  const d = toDate(date);
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1, 0, 0, 0, 0));
}

export function endOfMonth(date: DateInput): Date {
  const d = toDate(date);
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 0, 23, 59, 59, 999));
}

export function startOfYear(date: DateInput): Date {
  const d = toDate(date);
  return new Date(Date.UTC(d.getUTCFullYear(), 0, 1, 0, 0, 0, 0));
}

export function endOfYear(date: DateInput): Date {
  const d = toDate(date);
  return new Date(Date.UTC(d.getUTCFullYear(), 11, 31, 23, 59, 59, 999));
}

export function dateRangeForPeriod(
  period: 'today' | 'week' | 'month' | 'year' | 'last7days' | 'last30days' | 'last90days',
  reference: DateInput = new Date(),
): DateRange {
  const ref = toDate(reference);
  switch (period) {
    case 'today':
      return { from: startOfDay(ref), to: endOfDay(ref) };
    case 'week':
      return { from: startOfWeek(ref), to: endOfWeek(ref) };
    case 'month':
      return { from: startOfMonth(ref), to: endOfMonth(ref) };
    case 'year':
      return { from: startOfYear(ref), to: endOfYear(ref) };
    case 'last7days':
      return { from: startOfDay(subtractTime(ref, 6, 'days')), to: endOfDay(ref) };
    case 'last30days':
      return { from: startOfDay(subtractTime(ref, 29, 'days')), to: endOfDay(ref) };
    case 'last90days':
      return { from: startOfDay(subtractTime(ref, 89, 'days')), to: endOfDay(ref) };
  }
}

export function formatDuration(ms: number): string {
  if (ms < MS_PER_SECOND) {
    return `${ms}ms`;
  }
  if (ms < MS_PER_MINUTE) {
    return `${(ms / MS_PER_SECOND).toFixed(1)}s`;
  }
  if (ms < MS_PER_HOUR) {
    return `${Math.floor(ms / MS_PER_MINUTE)}m ${Math.floor((ms % MS_PER_MINUTE) / MS_PER_SECOND)}s`;
  }
  return `${Math.floor(ms / MS_PER_HOUR)}h ${Math.floor((ms % MS_PER_HOUR) / MS_PER_MINUTE)}m`;
}

export function formatRelative(date: DateInput, from: DateInput = new Date()): string {
  const ms = diffInMs(date, from);
  const abs = Math.abs(ms);
  const past = ms > 0;
  const suffix = past ? 'ago' : 'from now';

  if (abs < MS_PER_MINUTE) {
    return 'just now';
  }
  if (abs < MS_PER_HOUR) {
    const mins = Math.floor(abs / MS_PER_MINUTE);
    return `${mins} minute${mins !== 1 ? 's' : ''} ${suffix}`;
  }
  if (abs < MS_PER_DAY) {
    const hours = Math.floor(abs / MS_PER_HOUR);
    return `${hours} hour${hours !== 1 ? 's' : ''} ${suffix}`;
  }
  const days = Math.floor(abs / MS_PER_DAY);
  return `${days} day${days !== 1 ? 's' : ''} ${suffix}`;
}

export function parseTimeString(time: string): { hours: number; minutes: number } {
  const [hoursStr, minutesStr] = time.split(':');
  const hours = parseInt(hoursStr ?? '0', 10);
  const minutes = parseInt(minutesStr ?? '0', 10);
  return { hours, minutes };
}

export function timeStringToMinutes(time: string): number {
  const { hours, minutes } = parseTimeString(time);
  return hours * 60 + minutes;
}

export function minutesToTimeString(totalMinutes: number): string {
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
}

export function isTimeSlotAvailable(
  slotStart: string,
  slotEnd: string,
  bookedSlots: readonly TimeSlotRange[],
  date: string,
): boolean {
  const slotStartMins = timeStringToMinutes(slotStart);
  const slotEndMins = timeStringToMinutes(slotEnd);

  return !bookedSlots.some((booked) => {
    if (booked.date !== date) {
      return false;
    }
    const bookedStart = timeStringToMinutes(booked.startTime);
    const bookedEnd = timeStringToMinutes(booked.endTime);
    return slotStartMins < bookedEnd && slotEndMins > bookedStart;
  });
}

export function getExpiryDate(durationMs: number): Date {
  return new Date(Date.now() + durationMs);
}

export function secondsUntil(date: DateInput): number {
  return Math.max(0, diffInSeconds(new Date(), date));
}