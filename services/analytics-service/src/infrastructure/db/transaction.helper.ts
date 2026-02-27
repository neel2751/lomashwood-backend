import type { PrismaClient } from '@prisma/client';

import { getPrismaClient } from './prisma.client';
import { logger } from '../../config/logger';

type TransactionClient = Parameters<Parameters<PrismaClient['$transaction']>[0]>[0];

export async function withTransaction<T>(
  fn: (tx: TransactionClient) => Promise<T>,
  options?: {
    maxWait?: number;
    timeout?: number;
  },
): Promise<T> {
  const prisma = getPrismaClient();

  const start = Date.now();

  try {
    const result = await prisma.$transaction(fn, {
      maxWait: options?.maxWait ?? 5000,
      timeout: options?.timeout ?? 15000,
    });

    logger.debug({ duration: Date.now() - start }, 'Transaction completed');

    return result;
  } catch (error) {
    logger.error({ error, duration: Date.now() - start }, 'Transaction failed');
    throw error;
  }
}

export async function withIdempotentTransaction<T>(
  idempotencyKey: string,
  fn: (tx: TransactionClient) => Promise<T>,
): Promise<T> {
  return withTransaction(async (tx) => {
    const result = await fn(tx);

    logger.debug({ idempotencyKey }, 'Idempotent transaction executed');

    return result;
  });
}