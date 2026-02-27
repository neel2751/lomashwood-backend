
import { Prisma } from '@prisma/client';
import { prismaClient, PrismaTransactionClient } from './prisma.client';
import { logger } from '../../config/logger';

export type TransactionCallback<T> = (
  tx: PrismaTransactionClient,
) => Promise<T>;

export interface TransactionOptions {
  maxWait?: number;   
  timeout?: number;  
  isolationLevel?: Prisma.TransactionIsolationLevel;
}

export const withTransaction = async <T>(
  callback: TransactionCallback<T>,
  options: TransactionOptions = {},
): Promise<T> => {
  const {
    maxWait = 5_000,
    timeout = 10_000,
    isolationLevel = Prisma.TransactionIsolationLevel.ReadCommitted,
  } = options;

  return prismaClient.$transaction(
    async (tx) => callback(tx as PrismaTransactionClient),
    { maxWait, timeout, isolationLevel },
  );
};

const RETRYABLE_CODES: ReadonlySet<string> = new Set(['P2034']);
const DEFAULT_MAX_RETRIES = 3;
const RETRY_DELAY_MS = 100;

const sleep = (ms: number): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, ms));

export const withRetryTransaction = async <T>(
  callback: TransactionCallback<T>,
  options: TransactionOptions & { maxRetries?: number } = {},
): Promise<T> => {
  const maxRetries = options.maxRetries ?? DEFAULT_MAX_RETRIES;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await withTransaction(callback, options);
    } catch (error) {
      const prismaError = error as Prisma.PrismaClientKnownRequestError;

      if (
        RETRYABLE_CODES.has(prismaError.code ?? '') &&
        attempt < maxRetries
      ) {
        const delay = RETRY_DELAY_MS * attempt;

        logger.warn({
          context: 'withRetryTransaction',
          attempt,
          maxRetries,
          delayMs: delay,
          code: prismaError.code,
          message: 'Transaction conflict — retrying…',
        });

        await sleep(delay);
        continue;
      }

      logger.error({
        context: 'withRetryTransaction',
        attempt,
        error,
        message: 'Transaction failed after exhausting retries',
      });

      throw error;
    }
  }

  throw new Error('withRetryTransaction: unexpected exit from retry loop');
};

export const batchTransaction = async <T>(
  callbacks: Array<TransactionCallback<T>>,
  options: TransactionOptions = {},
): Promise<T[]> => {
  return withTransaction(
    async (tx) => Promise.all(callbacks.map((cb) => cb(tx))),
    options,
  );
};

export const isTransactionError = (
  error: unknown,
): error is Prisma.PrismaClientKnownRequestError => {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    RETRYABLE_CODES.has(error.code)
  );
};

export const transactionHelper = withTransaction;

export const isDuplicateError = (
  error: unknown,
): error is Prisma.PrismaClientKnownRequestError => {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === 'P2002'
  );
};

export const isNotFoundError = (
  error: unknown,
): error is Prisma.PrismaClientKnownRequestError => {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === 'P2025'
  );
};