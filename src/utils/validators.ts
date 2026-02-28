import { isValidHex } from "@/lib/utils";
import { ACCEPTED_IMAGE_TYPES, ACCEPTED_VIDEO_TYPES, MAX_FILE_SIZE_BYTES } from "@/lib/constants";

export function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

export function isValidPhone(value: string): boolean {
  return /^[+\d\s().-]{7,20}$/.test(value.trim());
}

export function isValidUKPostcode(value: string): boolean {
  return /^[A-Z]{1,2}\d[A-Z\d]?\s?\d[A-Z]{2}$/i.test(value.trim());
}

export function isValidUrl(value: string): boolean {
  try {
    new URL(value);
    return true;
  } catch {
    return false;
  }
}

export { isValidHex };

export function isValidSlug(value: string): boolean {
  return /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value);
}

export function isValidISODate(value: string): boolean {
  const date = new Date(value);
  return !isNaN(date.getTime()) && value.includes("T");
}

export function isValidDateString(value: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(value) && !isNaN(new Date(value).getTime());
}

export function isValidTimeString(value: string): boolean {
  return /^\d{2}:\d{2}$/.test(value);
}

export function isValidPrice(value: number): boolean {
  return typeof value === "number" && value > 0 && isFinite(value);
}

export function isNonNegativeInt(value: number): boolean {
  return Number.isInteger(value) && value >= 0;
}

export function isWithinMaxLength(value: string, max: number): boolean {
  return value.length <= max;
}

export function isWithinMinLength(value: string, min: number): boolean {
  return value.trim().length >= min;
}

export function isNonEmpty(value: string | null | undefined): boolean {
  return typeof value === "string" && value.trim().length > 0;
}

export function isValidImageFile(file: File): { valid: boolean; error?: string } {
  if (file.size > MAX_FILE_SIZE_BYTES) {
    return {
      valid: false,
      error: `File "${file.name}" exceeds the maximum size of ${MAX_FILE_SIZE_BYTES / 1024 / 1024} MB.`,
    };
  }
  if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
    return {
      valid: false,
      error: `File "${file.name}" is not a supported image type.`,
    };
  }
  return { valid: true };
}

export function isValidVideoFile(file: File): { valid: boolean; error?: string } {
  if (file.size > MAX_FILE_SIZE_BYTES) {
    return {
      valid: false,
      error: `File "${file.name}" exceeds the maximum size of ${MAX_FILE_SIZE_BYTES / 1024 / 1024} MB.`,
    };
  }
  if (!ACCEPTED_VIDEO_TYPES.includes(file.type)) {
    return {
      valid: false,
      error: `File "${file.name}" is not a supported video type.`,
    };
  }
  return { valid: true };
}

export function isValidMediaFile(file: File): { valid: boolean; error?: string } {
  const imageResult = isValidImageFile(file);
  if (imageResult.valid) return imageResult;
  return isValidVideoFile(file);
}

export function validateRequired(
  fields: Record<string, unknown>,
  required: string[],
): Record<string, string> {
  const errors: Record<string, string> = {};
  for (const key of required) {
    const value = fields[key];
    if (
      value === null ||
      value === undefined ||
      (typeof value === "string" && value.trim() === "")
    ) {
      errors[key] = "This field is required.";
    }
  }
  return errors;
}

export function hasErrors(errors: Record<string, string | undefined>): boolean {
  return Object.values(errors).some(Boolean);
}

export function isValidAppointmentSlot(
  slot: string,
  existingSlots: string[],
): boolean {
  if (!isValidISODate(slot)) return false;
  const slotDate = new Date(slot);
  if (slotDate < new Date()) return false;
  return !existingSlots.includes(slot);
}

export function isValidHexCode(value: string): boolean {
  return isValidHex(value);
}

export function isValidRange(
  value: number,
  min: number,
  max: number,
): boolean {
  return value >= min && value <= max;
}