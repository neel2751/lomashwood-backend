import crypto from 'crypto';
import { redisClient as redis } from '../cache/redis.client';
import { logger } from '../../config/logger';
import { BaseError as AppError } from '../../shared/errors';

const BLACKLIST_PREFIX = 'blacklist:token:';
const VERIFICATION_TOKEN_LENGTH = 32;
const RESET_TOKEN_LENGTH = 32;
const DEFAULT_TOKEN_TTL = 7 * 24 * 60 * 60;

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  return String(error);
}

export async function addToBlacklist(token: string, ttl: number = DEFAULT_TOKEN_TTL): Promise<void> {
  try {
    if (!token) throw new AppError('Token is required', 400, true, 'TOKEN_REQUIRED');
    const key = `${BLACKLIST_PREFIX}${token}`;
    await redis.set(key, '1', ttl);
    logger.info(`Token added to blacklist with TTL: ${ttl}s`);
  } catch (error) {
    logger.error('Error adding token to blacklist:', getErrorMessage(error));
    throw error;
  }
}

export async function isBlacklisted(token: string): Promise<boolean> {
  try {
    if (!token) return false;
    const key = `${BLACKLIST_PREFIX}${token}`;
    const result = await redis.get(key);
    return result !== null;
  } catch (error) {
    logger.error('Error checking token blacklist:', getErrorMessage(error));
    return false;
  }
}

export async function removeFromBlacklist(token: string): Promise<void> {
  try {
    if (!token) throw new AppError('Token is required', 400, true, 'TOKEN_REQUIRED');
    const key = `${BLACKLIST_PREFIX}${token}`;
    await redis.del(key);
    logger.info('Token removed from blacklist');
  } catch (error) {
    logger.error('Error removing token from blacklist:', getErrorMessage(error));
    throw error;
  }
}

export function generateEmailVerificationToken(): string {
  try {
    return crypto.randomBytes(VERIFICATION_TOKEN_LENGTH).toString('hex');
  } catch (error) {
    logger.error('Error generating email verification token:', getErrorMessage(error));
    throw new AppError('Failed to generate verification token', 500, true, 'TOKEN_GENERATION_ERROR');
  }
}

export function generatePasswordResetToken(): string {
  try {
    return crypto.randomBytes(RESET_TOKEN_LENGTH).toString('hex');
  } catch (error) {
    logger.error('Error generating password reset token:', getErrorMessage(error));
    throw new AppError('Failed to generate reset token', 500, true, 'TOKEN_GENERATION_ERROR');
  }
}

export function generateSecureToken(length: number = 32): string {
  try {
    return crypto.randomBytes(length).toString('hex');
  } catch (error) {
    logger.error('Error generating secure token:', getErrorMessage(error));
    throw new AppError('Failed to generate secure token', 500, true, 'TOKEN_GENERATION_ERROR');
  }
}

export async function clearExpiredBlacklistedTokens(): Promise<number> {
  try {
    const pattern = `${BLACKLIST_PREFIX}*`;
    const keys = await redis.keys(pattern);
    let clearedCount = 0;
    for (const key of keys) {
      const ttl = await redis.ttl(key);
      if (ttl === -1) {
        await redis.del(key);
        clearedCount++;
      }
    }
    logger.info(`Cleared ${clearedCount} expired blacklisted tokens`);
    return clearedCount;
  } catch (error) {
    logger.error('Error clearing expired blacklisted tokens:', getErrorMessage(error));
    return 0;
  }
}

export async function getBlacklistedTokenCount(): Promise<number> {
  try {
    const pattern = `${BLACKLIST_PREFIX}*`;
    const keys = await redis.keys(pattern);
    return keys.length;
  } catch (error) {
    logger.error('Error getting blacklisted token count:', getErrorMessage(error));
    return 0;
  }
}

export function hashToken(token: string): string {
  try {
    return crypto.createHash('sha256').update(token).digest('hex');
  } catch (error) {
    logger.error('Error hashing token:', getErrorMessage(error));
    throw new AppError('Failed to hash token', 500, true, 'TOKEN_HASH_ERROR');
  }
}

export function generateApiKey(prefix: string = 'lw'): string {
  try {
    const randomPart = crypto.randomBytes(24).toString('hex');
    return `${prefix}_${randomPart}`;
  } catch (error) {
    logger.error('Error generating API key:', getErrorMessage(error));
    throw new AppError('Failed to generate API key', 500, true, 'API_KEY_GENERATION_ERROR');
  }
}

export async function blacklistUserTokens(userId: string, ttl: number = DEFAULT_TOKEN_TTL): Promise<void> {
  try {
    const key = `${BLACKLIST_PREFIX}user:${userId}`;
    await redis.set(key, '1', ttl);
    logger.info(`All tokens for user ${userId} blacklisted`);
  } catch (error) {
    logger.error('Error blacklisting user tokens:', getErrorMessage(error));
    throw error;
  }
}

export async function isUserTokensBlacklisted(userId: string): Promise<boolean> {
  try {
    const key = `${BLACKLIST_PREFIX}user:${userId}`;
    const result = await redis.get(key);
    return result !== null;
  } catch (error) {
    logger.error('Error checking user tokens blacklist:', getErrorMessage(error));
    return false;
  }
}