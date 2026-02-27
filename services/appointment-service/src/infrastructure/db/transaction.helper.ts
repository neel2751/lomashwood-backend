import { PrismaClient, Prisma } from '@prisma/client';
import { logger } from '../../config/logger';

type TransactionClient = Prisma.TransactionClient;

type TransactionOptions = {
  maxWait?: number;
  timeout?: number;
  isolationLevel?: Prisma.TransactionIsolationLevel;
};

const DEFAULT_TRANSACTION_OPTIONS: TransactionOptions = {
  maxWait: 5000,
  timeout: 10000,
  isolationLevel: Prisma.TransactionIsolationLevel.ReadCommitted,
};

export async function withTransaction<T>(
  prisma: PrismaClient,
  fn: (tx: TransactionClient) => Promise<T>,
  options: TransactionOptions = DEFAULT_TRANSACTION_OPTIONS,
): Promise<T> {
  const start = performance.now();

  try {
    const result = await prisma.$transaction(fn, {
      maxWait: options.maxWait ?? DEFAULT_TRANSACTION_OPTIONS.maxWait,
      timeout: options.timeout ?? DEFAULT_TRANSACTION_OPTIONS.timeout,
      isolationLevel: options.isolationLevel ?? DEFAULT_TRANSACTION_OPTIONS.isolationLevel,
    });

    const duration = (performance.now() - start).toFixed(2);
    logger.debug({
      message: 'Transaction completed',
      duration: `${duration}ms`,
    });

    return result;
  } catch (error) {
    const duration = (performance.now() - start).toFixed(2);
    logger.error({
      message: 'Transaction failed',
      duration: `${duration}ms`,
      error: error instanceof Error ? error.message : String(error),
    });
    throw error;
  }
}

export async function withSerializableTransaction<T>(
  prisma: PrismaClient,
  fn: (tx: TransactionClient) => Promise<T>,
): Promise<T> {
  return withTransaction(prisma, fn, {
    maxWait: 5000,
    timeout: 15000,
    isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
  });
}

export async function withRepeatableReadTransaction<T>(
  prisma: PrismaClient,
  fn: (tx: TransactionClient) => Promise<T>,
): Promise<T> {
  return withTransaction(prisma, fn, {
    maxWait: 5000,
    timeout: 10000,
    isolationLevel: Prisma.TransactionIsolationLevel.RepeatableRead,
  });
}

export async function withRetryTransaction<T>(
  prisma: PrismaClient,
  fn: (tx: TransactionClient) => Promise<T>,
  maxRetries: number = 3,
  options: TransactionOptions = DEFAULT_TRANSACTION_OPTIONS,
): Promise<T> {
  let lastError: Error | unknown;
  let attempt = 0;

  while (attempt < maxRetries) {
    try {
      return await withTransaction(prisma, fn, options);
    } catch (error) {
      lastError = error;
      attempt++;

      const isRetryable =
        error instanceof Prisma.PrismaClientKnownRequestError &&
        ['P2034', 'P2028', 'P2002'].includes(error.code);

      if (!isRetryable || attempt >= maxRetries) {
        break;
      }

      const delay = Math.pow(2, attempt) * 100;
      logger.warn({
        message: 'Transaction failed, retrying',
        attempt,
        maxRetries,
        delay: `${delay}ms`,
        error: error instanceof Error ? error.message : String(error),
      });

      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  logger.error({
    message: 'Transaction failed after max retries',
    maxRetries,
    error: lastError instanceof Error ? lastError.message : String(lastError),
  });

  throw lastError;
}

export async function withBatchTransaction<T>(
  prisma: PrismaClient,
  items: T[],
  batchSize: number,
  fn: (tx: TransactionClient, batch: T[]) => Promise<void>,
  options: TransactionOptions = DEFAULT_TRANSACTION_OPTIONS,
): Promise<void> {
  const batches: T[][] = [];

  for (let i = 0; i < items.length; i += batchSize) {
    batches.push(items.slice(i, i + batchSize));
  }

  logger.info({
    message: 'Starting batch transaction',
    totalItems: items.length,
    batchSize,
    totalBatches: batches.length,
  });

  for (let i = 0; i < batches.length; i++) {
    const batch = batches[i];
    await withTransaction(
      prisma,
      (tx) => fn(tx, batch),
      options,
    );

    logger.debug({
      message: 'Batch processed',
      batchIndex: i + 1,
      totalBatches: batches.length,
      itemsProcessed: batch.length,
    });
  }

  logger.info({
    message: 'Batch transaction completed',
    totalItems: items.length,
    totalBatches: batches.length,
  });
}

export async function withIdempotentTransaction<T>(
  prisma: PrismaClient,
  idempotencyKey: string,
  fn: (tx: TransactionClient) => Promise<T>,
  options: TransactionOptions = DEFAULT_TRANSACTION_OPTIONS,
): Promise<T> {
  return withTransaction(
    prisma,
    async (tx) => {
      const existing = await tx.idempotencyKey.findUnique({
        where: { key: idempotencyKey },
      }).catch(() => null);

      if (existing) {
        logger.info({
          message: 'Idempotent transaction already processed',
          idempotencyKey,
        });
        return JSON.parse(existing.result) as T;
      }

      const result = await fn(tx);

      await tx.idempotencyKey.create({
        data: {
          key: idempotencyKey,
          result: JSON.stringify(result),
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        },
      }).catch(() => null);

      return result;
    },
    options,
  );
}