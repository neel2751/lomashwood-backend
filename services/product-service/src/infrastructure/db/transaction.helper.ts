import { Prisma } from '@prisma/client';
import { prisma } from './prisma.client';
import { logger } from '../../../config/logger';

export type TransactionClient = Prisma.TransactionClient;

export interface TransactionOptions {
  maxWait?: number;
  timeout?: number;
  isolationLevel?: Prisma.TransactionIsolationLevel;
}

export interface RetryOptions {
  maxRetries?: number;
  retryDelay?: number;
  retryOnCodes?: string[];
}

const DEFAULT_TRANSACTION_OPTIONS: Required<TransactionOptions> = {
  maxWait: 5000,
  timeout: 10000,
  isolationLevel: Prisma.TransactionIsolationLevel.ReadCommitted,
};

const DEFAULT_RETRY_OPTIONS: Required<RetryOptions> = {
  maxRetries: 3,
  retryDelay: 100,
  retryOnCodes: ['P2034'],
};

export async function runInTransaction<T>(
  fn: (tx: TransactionClient) => Promise<T>,
  options: TransactionOptions = {},
): Promise<T> {
  const opts = { ...DEFAULT_TRANSACTION_OPTIONS, ...options };

  return prisma.$transaction(fn, {
    maxWait: opts.maxWait,
    timeout: opts.timeout,
    isolationLevel: opts.isolationLevel,
  });
}

export async function runInTransactionWithRetry<T>(
  fn: (tx: TransactionClient) => Promise<T>,
  transactionOptions: TransactionOptions = {},
  retryOptions: RetryOptions = {},
): Promise<T> {
  const txOpts = { ...DEFAULT_TRANSACTION_OPTIONS, ...transactionOptions };
  const retryOpts = { ...DEFAULT_RETRY_OPTIONS, ...retryOptions };

  let attempt = 0;

  while (attempt <= retryOpts.maxRetries) {
    try {
      return await prisma.$transaction(fn, {
        maxWait: txOpts.maxWait,
        timeout: txOpts.timeout,
        isolationLevel: txOpts.isolationLevel,
      });
    } catch (error) {
      const isRetryable =
        error instanceof Prisma.PrismaClientKnownRequestError &&
        retryOpts.retryOnCodes.includes(error.code);

      if (!isRetryable || attempt === retryOpts.maxRetries) {
        logger.error({
          message: 'Transaction failed after retries',
          attempt,
          error,
        });
        throw error;
      }

      attempt++;
      const delay = retryOpts.retryDelay * Math.pow(2, attempt - 1);

      logger.warn({
        message: 'Transaction retrying',
        attempt,
        delay,
        errorCode:
          error instanceof Prisma.PrismaClientKnownRequestError
            ? error.code
            : 'unknown',
      });

      await sleep(delay);
    }
  }

  throw new Error('Transaction exceeded maximum retry attempts');
}

export async function runSerialTransactions<T>(
  fns: Array<(tx: TransactionClient) => Promise<T>>,
  options: TransactionOptions = {},
): Promise<T[]> {
  const results: T[] = [];

  for (const fn of fns) {
    const result = await runInTransaction(fn, options);
    results.push(result);
  }

  return results;
}

export async function runBatchInTransaction<T, R>(
  items: T[],
  fn: (tx: TransactionClient, item: T, index: number) => Promise<R>,
  options: TransactionOptions = {},
): Promise<R[]> {
  return runInTransaction(async (tx) => {
    const results: R[] = [];

    for (let i = 0; i < items.length; i++) {
      const result = await fn(tx, items[i], i);
      results.push(result);
    }

    return results;
  }, options);
}

export async function runChunkedTransaction<T, R>(
  items: T[],
  fn: (tx: TransactionClient, chunk: T[]) => Promise<R[]>,
  chunkSize: number = 100,
  options: TransactionOptions = {},
): Promise<R[]> {
  const chunks = chunkArray(items, chunkSize);
  const results: R[] = [];

  for (const chunk of chunks) {
    const chunkResults = await runInTransaction(
      (tx) => fn(tx, chunk),
      options,
    );
    results.push(...chunkResults);
  }

  return results;
}

export async function runReadCommitted<T>(
  fn: (tx: TransactionClient) => Promise<T>,
): Promise<T> {
  return runInTransaction(fn, {
    isolationLevel: Prisma.TransactionIsolationLevel.ReadCommitted,
  });
}

export async function runRepeatableRead<T>(
  fn: (tx: TransactionClient) => Promise<T>,
): Promise<T> {
  return runInTransaction(fn, {
    isolationLevel: Prisma.TransactionIsolationLevel.RepeatableRead,
  });
}

export async function runSerializable<T>(
  fn: (tx: TransactionClient) => Promise<T>,
): Promise<T> {
  return runInTransaction(fn, {
    isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
  });
}

export function isTransactionError(
  error: unknown,
): error is Prisma.PrismaClientKnownRequestError {
  return error instanceof Prisma.PrismaClientKnownRequestError;
}

export function isDeadlockError(error: unknown): boolean {
  return (
    isTransactionError(error) &&
    (error.code === 'P2034' ||
      (error.message?.toLowerCase().includes('deadlock') ?? false))
  );
}

export function isWriteConflictError(error: unknown): boolean {
  return isTransactionError(error) && error.code === 'P2034';
}

export function isTransactionTimeoutError(error: unknown): boolean {
  return (
    isTransactionError(error) &&
    (error.message?.toLowerCase().includes('timed out') ?? false)
  );
}

function chunkArray<T>(array: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}