import { Prisma, PrismaClient } from '@prisma/client';
import { prisma } from './prisma.client';
import { logger } from '../../config/logger';

export type TransactionClient = Prisma.TransactionClient;

export type TransactionOptions = {
  maxWait?: number;
  timeout?: number;
  isolationLevel?: Prisma.TransactionIsolationLevel;
};

const DEFAULT_OPTIONS: Required<TransactionOptions> = {
  maxWait: 5000,
  timeout: 15000,
  isolationLevel: Prisma.TransactionIsolationLevel.ReadCommitted,
};

export class TransactionHelper {
  constructor(private readonly client: PrismaClient = prisma) {}

  async run<T>(
    fn: (tx: TransactionClient) => Promise<T>,
    options: TransactionOptions = {},
  ): Promise<T> {
    const resolved: Required<TransactionOptions> = {
      ...DEFAULT_OPTIONS,
      ...options,
    };

    const start = Date.now();

    try {
      const result = await this.client.$transaction(fn, {
        maxWait: resolved.maxWait,
        timeout: resolved.timeout,
        isolationLevel: resolved.isolationLevel,
      });

      logger.debug('Transaction completed', {
        duration: `${Date.now() - start}ms`,
        isolationLevel: resolved.isolationLevel,
      });

      return result;
    } catch (error) {
      logger.error('Transaction failed and rolled back', {
        duration: `${Date.now() - start}ms`,
        error: error instanceof Error ? error.message : String(error),
      });

      throw error;
    }
  }

  async runSerializable<T>(
    fn: (tx: TransactionClient) => Promise<T>,
    options: Omit<TransactionOptions, 'isolationLevel'> = {},
  ): Promise<T> {
    return this.run(fn, {
      ...options,
      isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
    });
  }

  async runRepeatableRead<T>(
    fn: (tx: TransactionClient) => Promise<T>,
    options: Omit<TransactionOptions, 'isolationLevel'> = {},
  ): Promise<T> {
    return this.run(fn, {
      ...options,
      isolationLevel: Prisma.TransactionIsolationLevel.RepeatableRead,
    });
  }

  async runWithRetry<T>(
    fn: (tx: TransactionClient) => Promise<T>,
    options: TransactionOptions & { retries?: number; retryDelayMs?: number } = {},
  ): Promise<T> {
    const { retries = 3, retryDelayMs = 100, ...txOptions } = options;

    let lastError: unknown;

    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        return await this.run(fn, txOptions);
      } catch (error) {
        lastError = error;

        const isRetryable = this.isRetryableError(error);

        if (!isRetryable || attempt === retries) {
          throw error;
        }

        const delay = retryDelayMs * Math.pow(2, attempt - 1);

        logger.warn('Transaction failed, retrying', {
          attempt,
          maxRetries: retries,
          retryAfterMs: delay,
          error: error instanceof Error ? error.message : String(error),
        });

        await this.sleep(delay);
      }
    }

    throw lastError;
  }

  async runBatch<T>(
    operations: Array<(tx: TransactionClient) => Promise<T>>,
    options: TransactionOptions = {},
  ): Promise<T[]> {
    return this.run(
      async (tx) => Promise.all(operations.map((op) => op(tx))),
      options,
    );
  }

  async runRaw<T>(
    sql: Prisma.Sql,
    tx?: TransactionClient,
  ): Promise<T[]> {
    const client = tx ?? this.client;
    return client.$queryRaw<T[]>(sql);
  }

  async executeRaw(
    sql: Prisma.Sql,
    tx?: TransactionClient,
  ): Promise<number> {
    const client = tx ?? this.client;
    return client.$executeRaw(sql);
  }

  private isRetryableError(error: unknown): boolean {
    if (!(error instanceof Prisma.PrismaClientKnownRequestError)) {
      return false;
    }

    const retryableCodes = [
      'P2034',
      'P2024',
    ];

    return retryableCodes.includes(error.code);
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

export const transactionHelper = new TransactionHelper(prisma);