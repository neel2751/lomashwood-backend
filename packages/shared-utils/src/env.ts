export class EnvValidationError extends Error {
  public override readonly name = 'EnvValidationError';
  public readonly missingVars: readonly string[];
  public readonly invalidVars: readonly string[];

  public constructor(missingVars: readonly string[], invalidVars: readonly string[]) {
    const parts: string[] = [];
    if (missingVars.length > 0) {
      parts.push(`Missing required env vars: ${missingVars.join(', ')}`);
    }
    if (invalidVars.length > 0) {
      parts.push(`Invalid env vars: ${invalidVars.join(', ')}`);
    }
    super(parts.join('. '));
    this.missingVars = missingVars;
    this.invalidVars = invalidVars;
  }
}

export type NodeEnv = 'development' | 'production' | 'test' | 'staging';

export function getEnv(key: string): string {
  const value = process.env[key];
  if (value === undefined || value === '') {
    throw new EnvValidationError([key], []);
  }
  return value;
}

export function getEnvOrDefault(key: string, defaultValue: string): string {
  const value = process.env[key];
  if (value === undefined || value === '') {
    return defaultValue;
  }
  return value;
}

export function getEnvOptional(key: string): string | undefined {
  const value = process.env[key];
  if (value === undefined || value === '') {
    return undefined;
  }
  return value;
}

export function getEnvInt(key: string, defaultValue?: number | undefined): number {
  const raw = process.env[key];
  if (raw === undefined || raw === '') {
    if (defaultValue !== undefined) {
      return defaultValue;
    }
    throw new EnvValidationError([key], []);
  }
  const parsed = parseInt(raw, 10);
  if (Number.isNaN(parsed)) {
    throw new EnvValidationError([], [`${key} must be an integer, got: ${raw}`]);
  }
  return parsed;
}

export function getEnvFloat(key: string, defaultValue?: number | undefined): number {
  const raw = process.env[key];
  if (raw === undefined || raw === '') {
    if (defaultValue !== undefined) {
      return defaultValue;
    }
    throw new EnvValidationError([key], []);
  }
  const parsed = parseFloat(raw);
  if (Number.isNaN(parsed)) {
    throw new EnvValidationError([], [`${key} must be a number, got: ${raw}`]);
  }
  return parsed;
}

export function getEnvBool(key: string, defaultValue?: boolean | undefined): boolean {
  const raw = process.env[key];
  if (raw === undefined || raw === '') {
    if (defaultValue !== undefined) {
      return defaultValue;
    }
    throw new EnvValidationError([key], []);
  }
  const lower = raw.toLowerCase();
  if (lower === 'true' || lower === '1' || lower === 'yes') {
    return true;
  }
  if (lower === 'false' || lower === '0' || lower === 'no') {
    return false;
  }
  throw new EnvValidationError([], [`${key} must be a boolean (true/false/1/0), got: ${raw}`]);
}

export function getEnvEnum<T extends string>(
  key: string,
  allowed: readonly T[],
  defaultValue?: T | undefined,
): T {
  const raw = process.env[key];
  if (raw === undefined || raw === '') {
    if (defaultValue !== undefined) {
      return defaultValue;
    }
    throw new EnvValidationError([key], []);
  }
  if (!(allowed as readonly string[]).includes(raw)) {
    throw new EnvValidationError(
      [],
      [`${key} must be one of [${allowed.join(', ')}], got: ${raw}`],
    );
  }
  return raw as T;
}

export function getEnvArray(key: string, separator: string = ','): string[] {
  const raw = process.env[key];
  if (raw === undefined || raw === '') {
    return [];
  }
  return raw.split(separator).map((s) => s.trim()).filter((s) => s.length > 0);
}

export function getEnvUrl(key: string, defaultValue?: string | undefined): string {
  const value = process.env[key];
  if (value === undefined || value === '') {
    if (defaultValue !== undefined) {
      return defaultValue;
    }
    throw new EnvValidationError([key], []);
  }
  try {
    new URL(value);
  } catch {
    throw new EnvValidationError([], [`${key} must be a valid URL, got: ${value}`]);
  }
  return value;
}

export function getNodeEnv(): NodeEnv {
  return getEnvEnum('NODE_ENV', ['development', 'production', 'test', 'staging'], 'development');
}

export function isDevelopment(): boolean {
  return getNodeEnv() === 'development';
}

export function isProduction(): boolean {
  return getNodeEnv() === 'production';
}

export function isTest(): boolean {
  return getNodeEnv() === 'test';
}

export function isStaging(): boolean {
  return getNodeEnv() === 'staging';
}

export interface EnvValidationResult {
  readonly valid: boolean;
  readonly missing: readonly string[];
  readonly invalid: readonly string[];
}

export function validateRequiredEnvVars(keys: readonly string[]): EnvValidationResult {
  const missing: string[] = [];
  const invalid: string[] = [];

  for (const key of keys) {
    const value = process.env[key];
    if (value === undefined || value === '') {
      missing.push(key);
    }
  }

  return {
    valid: missing.length === 0 && invalid.length === 0,
    missing,
    invalid,
  };
}

export function assertRequiredEnvVars(keys: readonly string[]): void {
  const result = validateRequiredEnvVars(keys);
  if (!result.valid) {
    throw new EnvValidationError(result.missing, result.invalid);
  }
}