import crypto from 'crypto';


const redis = {
  get:    async (_key: string): Promise<string | null> => null,
  set:    async (_key: string, _value: string): Promise<void> => {},
  setex:  async (_key: string, _ttl: number, _value: string): Promise<void> => {},
  del:    async (..._keys: string[]): Promise<void> => {},
  incr:   async (_key: string): Promise<number> => 0,
  expire: async (_key: string, _ttl: number): Promise<void> => {},
  ttl:    async (_key: string): Promise<number> => -1,
  keys:   async (_pattern: string): Promise<string[]> => [],
};


const logger = {
  info:  (msg: string, ...args: unknown[]) => console.info(`[INFO] ${msg}`, ...args),
  error: (msg: string, ...args: unknown[]) => console.error(`[ERROR] ${msg}`, ...args),
};


class AppError extends Error {
  public statusCode: number;
  public code: string;

  constructor(message: string, statusCode: number, code: string) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    Object.setPrototypeOf(this, AppError.prototype);
  }
}


const OTP_PREFIX          = 'otp:';
const OTP_ATTEMPT_PREFIX  = 'otp:attempt:';
const OTP_LENGTH          = 6;
const OTP_TTL             = 10 * 60;
const MAX_OTP_ATTEMPTS    = 5;
const OTP_ATTEMPT_WINDOW  = 15 * 60;
const OTP_RESEND_COOLDOWN = 60;


export interface OTPResult {
  otp: string;
  expiresAt: Date;
}

export async function generateOTP(
  identifier: string,
  purpose: string = 'verification'
): Promise<OTPResult> {
  try {
    if (!identifier) {
      throw new AppError('Identifier is required', 400, 'IDENTIFIER_REQUIRED');
    }

    const cooldownKey = `${OTP_PREFIX}cooldown:${purpose}:${identifier}`;
    const cooldown = await redis.get(cooldownKey);

    if (cooldown) {
      const remainingSeconds = await redis.ttl(cooldownKey);
      throw new AppError(
        `Please wait ${remainingSeconds} seconds before requesting a new OTP`,
        429,
        'OTP_COOLDOWN_ACTIVE'
      );
    }

    const otp = crypto.randomInt(100000, 999999).toString();
    const key = `${OTP_PREFIX}${purpose}:${identifier}`;

    await redis.setex(key, OTP_TTL, otp);
    await redis.setex(cooldownKey, OTP_RESEND_COOLDOWN, '1');

    const expiresAt = new Date(Date.now() + OTP_TTL * 1000);

    logger.info(`OTP generated for ${purpose}:${identifier}`);

    return { otp, expiresAt };
  } catch (error) {
    if (error instanceof AppError) throw error;
    logger.error('Error generating OTP:', error);
    throw new AppError('Failed to generate OTP', 500, 'OTP_GENERATION_ERROR');
  }
}

export async function verifyOTP(
  identifier: string,
  otp: string,
  purpose: string = 'verification'
): Promise<boolean> {
  try {
    if (!identifier || !otp) {
      throw new AppError('Identifier and OTP are required', 400, 'INVALID_INPUT');
    }

    const attemptKey = `${OTP_ATTEMPT_PREFIX}${purpose}:${identifier}`;
    const attempts = await redis.get(attemptKey);
    const attemptCount = attempts ? parseInt(attempts, 10) : 0;

    if (attemptCount >= MAX_OTP_ATTEMPTS) {
      throw new AppError(
        'Maximum OTP verification attempts exceeded. Please request a new OTP',
        429,
        'MAX_OTP_ATTEMPTS_EXCEEDED'
      );
    }

    const key = `${OTP_PREFIX}${purpose}:${identifier}`;
    const storedOTP = await redis.get(key);

    if (!storedOTP) {
      throw new AppError('OTP expired or not found', 400, 'OTP_EXPIRED');
    }

    if (storedOTP !== otp) {
      await redis.incr(attemptKey);
      await redis.expire(attemptKey, OTP_ATTEMPT_WINDOW);

      const remainingAttempts = MAX_OTP_ATTEMPTS - attemptCount - 1;
      throw new AppError(
        `Invalid OTP. ${remainingAttempts} attempts remaining`,
        400,
        'INVALID_OTP'
      );
    }

    await redis.del(key);
    await redis.del(attemptKey);
    await redis.del(`${OTP_PREFIX}cooldown:${purpose}:${identifier}`);

    logger.info(`OTP verified successfully for ${purpose}:${identifier}`);

    return true;
  } catch (error) {
    if (error instanceof AppError) throw error;
    logger.error('Error verifying OTP:', error);
    throw new AppError('Failed to verify OTP', 500, 'OTP_VERIFICATION_ERROR');
  }
}

export async function invalidateOTP(
  identifier: string,
  purpose: string = 'verification'
): Promise<void> {
  try {
    const key        = `${OTP_PREFIX}${purpose}:${identifier}`;
    const attemptKey = `${OTP_ATTEMPT_PREFIX}${purpose}:${identifier}`;
    const cooldownKey = `${OTP_PREFIX}cooldown:${purpose}:${identifier}`;

    await redis.del(key);
    await redis.del(attemptKey);
    await redis.del(cooldownKey);

    logger.info(`OTP invalidated for ${purpose}:${identifier}`);
  } catch (error) {
    logger.error('Error invalidating OTP:', error);
    throw new AppError('Failed to invalidate OTP', 500, 'OTP_INVALIDATION_ERROR');
  }
}

export async function getOTPRemainingTime(
  identifier: string,
  purpose: string = 'verification'
): Promise<number> {
  try {
    const key = `${OTP_PREFIX}${purpose}:${identifier}`;
    const ttl = await redis.ttl(key);
    return ttl > 0 ? ttl : 0;
  } catch (error) {
    logger.error('Error getting OTP remaining time:', error);
    return 0;
  }
}

export async function getOTPAttempts(
  identifier: string,
  purpose: string = 'verification'
): Promise<number> {
  try {
    const attemptKey = `${OTP_ATTEMPT_PREFIX}${purpose}:${identifier}`;
    const attempts = await redis.get(attemptKey);
    return attempts ? parseInt(attempts, 10) : 0;
  } catch (error) {
    logger.error('Error getting OTP attempts:', error);
    return 0;
  }
}

export async function canRequestOTP(
  identifier: string,
  purpose: string = 'verification'
): Promise<{ canRequest: boolean; waitTime: number }> {
  try {
    const cooldownKey = `${OTP_PREFIX}cooldown:${purpose}:${identifier}`;
    const cooldown = await redis.get(cooldownKey);

    if (cooldown) {
      const waitTime = await redis.ttl(cooldownKey);
      return { canRequest: false, waitTime: waitTime > 0 ? waitTime : 0 };
    }

    return { canRequest: true, waitTime: 0 };
  } catch (error) {
    logger.error('Error checking OTP request eligibility:', error);
    return { canRequest: false, waitTime: OTP_RESEND_COOLDOWN };
  }
}

export function generateNumericOTP(length: number = OTP_LENGTH): string {
  try {
    const min = Math.pow(10, length - 1);
    const max = Math.pow(10, length) - 1;
    return crypto.randomInt(min, max).toString();
  } catch (error) {
    logger.error('Error generating numeric OTP:', error);
    throw new AppError('Failed to generate OTP', 500, 'OTP_GENERATION_ERROR');
  }
}

export function generateAlphanumericOTP(length: number = 8): string {
  try {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let otp = '';
    for (let i = 0; i < length; i++) {
      otp += chars[crypto.randomInt(0, chars.length)];
    }
    return otp;
  } catch (error) {
    logger.error('Error generating alphanumeric OTP:', error);
    throw new AppError('Failed to generate OTP', 500, 'OTP_GENERATION_ERROR');
  }
}

export async function clearExpiredOTPs(): Promise<number> {
  try {
    const pattern = `${OTP_PREFIX}*`;
    const keys = await redis.keys(pattern);

    let clearedCount = 0;
    for (const key of keys) {
      const ttl = await redis.ttl(key);
      if (ttl === -1) {
        await redis.del(key);
        clearedCount++;
      }
    }

    logger.info(`Cleared ${clearedCount} expired OTPs`);
    return clearedCount;
  } catch (error) {
    logger.error('Error clearing expired OTPs:', error);
    return 0;
  }
}