import {
  createHash,
  createHmac,
  randomBytes,
  randomUUID,
  timingSafeEqual,
  scrypt,
  type BinaryLike,
} from 'node:crypto';
import { promisify } from 'node:util';

const scryptAsync = promisify(scrypt);

const SALT_BYTES = 32;
const SCRYPT_KEY_LENGTH = 64;
const OTP_DEFAULT_LENGTH = 6;
const TOKEN_DEFAULT_BYTES = 32;

export function generateUuid(): string {
  return randomUUID();
}

export function generateSecureToken(bytes: number = TOKEN_DEFAULT_BYTES): string {
  return randomBytes(bytes).toString('hex');
}

export function generateSlug(input: string): string {
  return input
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .trim();
}

export function generateUniqueSlug(base: string, suffix?: string | undefined): string {
  const slug = generateSlug(base);
  if (suffix !== undefined) {
    return `${slug}-${suffix}`;
  }
  return `${slug}-${randomBytes(4).toString('hex')}`;
}

export function generateOtp(length: number = OTP_DEFAULT_LENGTH): string {
  const max = Math.pow(10, length);
  const buffer = randomBytes(4);
  const value = buffer.readUInt32BE(0) % max;
  return value.toString().padStart(length, '0');
}

export function generateAlphanumericToken(length: number = 12): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  const bytes = randomBytes(length);
  for (let i = 0; i < length; i++) {
    result += chars[bytes[i]! % chars.length];
  }
  return result;
}

export function generateReferenceNumber(prefix: string): string {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = randomBytes(3).toString('hex').toUpperCase();
  return `${prefix}-${timestamp}-${random}`;
}

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(SALT_BYTES).toString('hex');
  const derivedKey = await scryptAsync(
    password,
    salt,
    SCRYPT_KEY_LENGTH,
  ) as Buffer;
  return `${salt}:${derivedKey.toString('hex')}`;
}

export async function verifyPassword(
  password: string,
  stored: string,
): Promise<boolean> {
  const [salt, hash] = stored.split(':');
  if (salt === undefined || hash === undefined) {
    return false;
  }
  const derivedKey = await scryptAsync(
    password,
    salt,
    SCRYPT_KEY_LENGTH,
  ) as Buffer;
  const hashBuffer = Buffer.from(hash, 'hex');
  if (derivedKey.length !== hashBuffer.length) {
    return false;
  }
  return timingSafeEqual(derivedKey, hashBuffer);
}

export function hashSha256(data: BinaryLike): string {
  return createHash('sha256').update(data).digest('hex');
}

export function hashSha512(data: BinaryLike): string {
  return createHash('sha512').update(data).digest('hex');
}

export function createHmacSha256(data: string, secret: string): string {
  return createHmac('sha256', secret).update(data).digest('hex');
}

export function verifyHmacSha256(
  data: string,
  secret: string,
  signature: string,
): boolean {
  const expected = createHmacSha256(data, secret);
  const expectedBuffer = Buffer.from(expected, 'hex');
  const signatureBuffer = Buffer.from(signature, 'hex');
  if (expectedBuffer.length !== signatureBuffer.length) {
    return false;
  }
  return timingSafeEqual(expectedBuffer, signatureBuffer);
}

export function safeCompare(a: string, b: string): boolean {
  const aBuffer = Buffer.from(a);
  const bBuffer = Buffer.from(b);
  if (aBuffer.length !== bBuffer.length) {
    return false;
  }
  return timingSafeEqual(aBuffer, bBuffer);
}

export function encodeBase64(data: string | Buffer): string {
  const buffer = typeof data === 'string' ? Buffer.from(data, 'utf8') : data;
  return buffer.toString('base64');
}

export function decodeBase64(data: string): string {
  return Buffer.from(data, 'base64').toString('utf8');
}

export function encodeBase64Url(data: string | Buffer): string {
  return encodeBase64(data)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

export function decodeBase64Url(data: string): string {
  const padded = data.replace(/-/g, '+').replace(/_/g, '/');
  const padding = (4 - (padded.length % 4)) % 4;
  return decodeBase64(padded + '='.repeat(padding));
}

export function maskEmail(email: string): string {
  const [local, domain] = email.split('@');
  if (local === undefined || domain === undefined) {
    return email;
  }
  const visibleChars = Math.min(2, local.length);
  const masked = local.slice(0, visibleChars) + '*'.repeat(Math.max(0, local.length - visibleChars));
  return `${masked}@${domain}`;
}

export function maskPhone(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  if (digits.length < 4) {
    return '*'.repeat(phone.length);
  }
  return '*'.repeat(digits.length - 4) + digits.slice(-4);
}

export function truncateSha(sha: string, length: number = 8): string {
  return sha.slice(0, length);
}