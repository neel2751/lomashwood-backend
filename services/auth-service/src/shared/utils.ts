import crypto from 'crypto';
import { REGEX_PATTERNS, AUTH_CONSTANTS } from './constants';
import { ValidationResult, ErrorDetails } from './types';

export class Utils {
  static generateId(): string {
    return crypto.randomUUID();
  }

  static generateToken(length: number = 32): string {
    return crypto.randomBytes(length).toString('hex');
  }

  static generateOTP(length: number = 6): string {
    const digits = '0123456789';
    let otp = '';
    for (let i = 0; i < length; i++) {
      otp += digits[Math.floor(Math.random() * digits.length)];
    }
    return otp;
  }

  static hashString(value: string): string {
    return crypto.createHash('sha256').update(value).digest('hex');
  }

  static isValidEmail(email: string): boolean {
    return REGEX_PATTERNS.EMAIL.test(email);
  }

  static isValidPassword(password: string): boolean {
    if (password.length < AUTH_CONSTANTS.PASSWORD.MIN_LENGTH) return false;
    if (password.length > AUTH_CONSTANTS.PASSWORD.MAX_LENGTH) return false;

    if (AUTH_CONSTANTS.PASSWORD.REQUIRE_UPPERCASE && !/[A-Z]/.test(password)) return false;
    if (AUTH_CONSTANTS.PASSWORD.REQUIRE_LOWERCASE && !/[a-z]/.test(password)) return false;
    if (AUTH_CONSTANTS.PASSWORD.REQUIRE_NUMBER && !/\d/.test(password)) return false;
    if (AUTH_CONSTANTS.PASSWORD.REQUIRE_SPECIAL_CHAR && !/[@$!%*?&]/.test(password)) return false;

    return true;
  }

  static isValidPhone(phone: string): boolean {
    return REGEX_PATTERNS.PHONE_UK.test(phone);
  }

  static isValidPostcode(postcode: string): boolean {
    return REGEX_PATTERNS.POSTCODE_UK.test(postcode);
  }

  static normalizeEmail(email: string): string {
    return email.trim().toLowerCase();
  }

  static normalizePhone(phone: string): string {
    return phone.replace(/\s+/g, '').replace(/[^\d+]/g, '');
  }

  static sanitizeString(value: string): string {
    return value.trim().replace(/[<>]/g, '');
  }

  static truncate(text: string, maxLength: number): string {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  }

  static sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  static retry<T>(
    fn: () => Promise<T>,
    options: {
      maxAttempts?: number;
      delay?: number;
      backoff?: number;
    } = {}
  ): Promise<T> {
    const { maxAttempts = 3, delay = 1000, backoff = 2 } = options;

    return new Promise(async (resolve, reject) => {
      let lastError: Error;

      for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        try {
          const result = await fn();
          return resolve(result);
        } catch (error) {
          lastError = error as Error;

          if (attempt < maxAttempts) {
            const waitTime = delay * Math.pow(backoff, attempt - 1);
            await this.sleep(waitTime);
          }
        }
      }

      reject(lastError!);
    });
  }

  static parseUserAgent(userAgent?: string): {
    browser?: string;
    os?: string;
    deviceType?: 'mobile' | 'tablet' | 'desktop';
  } {
    if (!userAgent) return {};

    const result: {
      browser?: string;
      os?: string;
      deviceType?: 'mobile' | 'tablet' | 'desktop';
    } = {};

    if (userAgent.includes('Chrome')) result.browser = 'Chrome';
    else if (userAgent.includes('Firefox')) result.browser = 'Firefox';
    else if (userAgent.includes('Safari')) result.browser = 'Safari';
    else if (userAgent.includes('Edge')) result.browser = 'Edge';

    if (userAgent.includes('Windows')) result.os = 'Windows';
    else if (userAgent.includes('Mac')) result.os = 'macOS';
    else if (userAgent.includes('Linux')) result.os = 'Linux';
    else if (userAgent.includes('Android')) result.os = 'Android';
    else if (userAgent.includes('iOS')) result.os = 'iOS';

    if (userAgent.includes('Mobile')) result.deviceType = 'mobile';
    else if (userAgent.includes('Tablet')) result.deviceType = 'tablet';
    else result.deviceType = 'desktop';

    return result;
  }

  static extractIpAddress(req: Record<string, any>): string | undefined {
    const forwarded = req['headers']?.['x-forwarded-for'];
    if (forwarded) {
      const ips = (forwarded as string).split(',');
      return ips[0]?.trim();
    }
    return req['ip'] as string | undefined ?? req['connection']?.remoteAddress;
  }

  static maskEmail(email: string): string {
    // ─── FIX 1: guard against split returning fewer than 2 parts ───
    const atIndex = email.indexOf('@');
    if (atIndex === -1) return email;

    const localPart = email.substring(0, atIndex);
    const domain = email.substring(atIndex + 1);

    if (localPart.length <= 2) return email;

    const visibleChars = Math.max(2, Math.floor(localPart.length / 3));
    const masked =
      localPart.substring(0, visibleChars) + '*'.repeat(localPart.length - visibleChars);

    return `${masked}@${domain}`;
  }

  static maskPhone(phone: string): string {
    if (phone.length <= 4) return phone;
    return '*'.repeat(phone.length - 4) + phone.slice(-4);
  }

  static generateDeviceFingerprint(userAgent?: string, ipAddress?: string): string {
    const data = `${userAgent || 'unknown'}-${ipAddress || 'unknown'}`;
    return this.hashString(data);
  }

  static isExpired(expiryDate: Date): boolean {
    return new Date() > new Date(expiryDate);
  }

  static addMinutes(date: Date, minutes: number): Date {
    return new Date(date.getTime() + minutes * 60000);
  }

  static addHours(date: Date, hours: number): Date {
    return new Date(date.getTime() + hours * 3600000);
  }

  static addDays(date: Date, days: number): Date {
    return new Date(date.getTime() + days * 86400000);
  }

  static formatDate(date: Date, format: string = 'YYYY-MM-DD'): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');

    return format
      .replace('YYYY', String(year))
      .replace('MM', month)
      .replace('DD', day)
      .replace('HH', hours)
      .replace('mm', minutes)
      .replace('ss', seconds);
  }

  static omit<T extends object, K extends keyof T>(obj: T, keys: K[]): Omit<T, K> {
    const result = { ...obj };
    keys.forEach(key => delete result[key]);
    return result;
  }

  static pick<T extends object, K extends keyof T>(obj: T, keys: K[]): Pick<T, K> {
    const result = {} as Pick<T, K>;
    keys.forEach(key => {
      if (key in obj) {
        result[key] = obj[key];
      }
    });
    return result;
  }

  static isEmpty(value: unknown): boolean {
    if (value == null) return true;
    if (typeof value === 'string') return value.trim().length === 0;
    if (Array.isArray(value)) return value.length === 0;
    if (typeof value === 'object') return Object.keys(value).length === 0;
    return false;
  }

  static isObject(value: unknown): value is object {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
  }

  static deepClone<T>(obj: T): T {
    if (obj === null || typeof obj !== 'object') return obj;
    if (obj instanceof Date) return new Date(obj.getTime()) as unknown as T;
    if (obj instanceof Array) return obj.map(item => this.deepClone(item)) as unknown as T;

    const clonedObj = {} as T;
    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        clonedObj[key] = this.deepClone(obj[key]);
      }
    }
    return clonedObj;
  }

  static validateRequired(value: unknown, fieldName: string): ErrorDetails | null {
    if (this.isEmpty(value)) {
      return {
        code: 'REQUIRED_FIELD',
        message: `${fieldName} is required`,
        field: fieldName,
      };
    }
    return null;
  }

  static validateEmail(email: string, fieldName: string = 'email'): ErrorDetails | null {
    if (!this.isValidEmail(email)) {
      return {
        code: 'INVALID_EMAIL',
        message: 'Invalid email format',
        field: fieldName,
        value: email,
      };
    }
    return null;
  }

  static validatePassword(password: string, fieldName: string = 'password'): ErrorDetails | null {
    if (!this.isValidPassword(password)) {
      return {
        code: 'WEAK_PASSWORD',
        message: `Password must be at least ${AUTH_CONSTANTS.PASSWORD.MIN_LENGTH} characters and contain uppercase, lowercase, number, and special character`,
        field: fieldName,
      };
    }
    return null;
  }

  static validateLength(
    value: string,
    min: number,
    max: number,
    fieldName: string
  ): ErrorDetails | null {
    if (value.length < min || value.length > max) {
      return {
        code: 'INVALID_LENGTH',
        message: `${fieldName} must be between ${min} and ${max} characters`,
        field: fieldName,
        constraint: `${min}-${max}`,
      };
    }
    return null;
  }

  static buildValidationResult(errors: (ErrorDetails | null)[]): ValidationResult {
    const validErrors = errors.filter((e): e is ErrorDetails => e !== null);
    return {
      valid: validErrors.length === 0,
      errors: validErrors.length > 0 ? validErrors : undefined,
    };
  }

  static parseBoolean(value: unknown): boolean {
    if (typeof value === 'boolean') return value;
    if (typeof value === 'string') {
      return value.toLowerCase() === 'true' || value === '1';
    }
    if (typeof value === 'number') return value !== 0;
    return false;
  }

  static safeJsonParse<T>(json: string, defaultValue: T): T {
    try {
      return JSON.parse(json) as T;
    } catch {
      return defaultValue;
    }
  }

  static removeUndefined<T extends object>(obj: T): T {
    const result = {} as T;
    for (const key in obj) {
      if (obj[key] !== undefined) {
        result[key] = obj[key];
      }
    }
    return result;
  }

  static comparePasswords(password1: string, password2: string): boolean {
    return password1 === password2;
  }

  // ─── FIX 2: return T (not T | undefined) by throwing on empty array ───
  static randomElement<T>(array: T[]): T {
    if (array.length === 0) throw new Error('Cannot get random element of empty array');
    return array[Math.floor(Math.random() * array.length)] as T;
  }

  static shuffle<T>(array: T[]): T[] {
    const result = [...array];
    for (let i = result.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [result[i], result[j]] = [result[j], result[i]] as [T, T];
    }
    return result;
  }

  static chunk<T>(array: T[], size: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size));
    }
    return chunks;
  }

  static unique<T>(array: T[]): T[] {
    return Array.from(new Set(array));
  }

  static groupBy<T>(array: T[], key: keyof T): Record<string, T[]> {
    return array.reduce(
      (acc, item) => {
        const groupKey = String(item[key]);
        if (!acc[groupKey]) {
          acc[groupKey] = [];
        }
        acc[groupKey]!.push(item);
        return acc;
      },
      {} as Record<string, T[]>
    );
  }
}

export default Utils;