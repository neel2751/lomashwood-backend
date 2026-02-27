import { prisma } from './prisma.client';

type IsolationLevel = 'ReadUncommitted' | 'ReadCommitted' | 'RepeatableRead' | 'Serializable';

type StringKeyOf<T> = Extract<keyof T, string>;

type PrismaModelKey = {
  [K in StringKeyOf<typeof prisma>]: (typeof prisma)[K] extends { findMany: Function } ? K : never;
}[StringKeyOf<typeof prisma>];

type PrismaTransactionClient = Parameters<
  Parameters<(typeof prisma)['$transaction']>[0]
>[0];

type TransactionOptions = {
  maxWait?: number;
  timeout?: number;
  isolationLevel?: IsolationLevel;
};

export class TransactionHelper {
  static async executeInTransaction<T>(
    callback: (tx: PrismaTransactionClient) => Promise<T>,
    options?: TransactionOptions
  ): Promise<T> {
    return prisma.$transaction(
      callback as (tx: PrismaTransactionClient) => Promise<T>,
      {
        maxWait: options?.maxWait ?? 5000,
        timeout: options?.timeout ?? 10000,
        isolationLevel: options?.isolationLevel as any,
      }
    ) as Promise<T>;
  }

  static async executeWithRetry<T>(
    callback: (tx: PrismaTransactionClient) => Promise<T>,
    retries: number = 3,
    delay: number = 1000
  ): Promise<T> {
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        return await this.executeInTransaction(callback);
      } catch (error) {
        lastError = error as Error;
        console.error(`Transaction attempt ${attempt} failed:`, error);

        if (attempt < retries) {
          await new Promise((resolve) => setTimeout(resolve, delay * attempt));
        }
      }
    }

    throw new Error(
      `Transaction failed after ${retries} attempts. Last error: ${lastError?.message}`
    );
  }

  static async batch<T>(
    operations: Array<Promise<T>>,
    batchSize: number = 10
  ): Promise<T[]> {
    const results: T[] = [];

    for (let i = 0; i < operations.length; i += batchSize) {
      const batch = operations.slice(i, i + batchSize);
      const batchResults = await Promise.all(batch);
      results.push(...batchResults);
    }

    return results;
  }

  static async bulkCreate(
    model: PrismaModelKey,
    data: Record<string, unknown>[],
    batchSize: number = 100
  ): Promise<void> {
    for (let i = 0; i < data.length; i += batchSize) {
      const batch = data.slice(i, i + batchSize);
      await (prisma[model] as any).createMany({
        data: batch,
        skipDuplicates: true,
      });
    }
  }

  static async bulkUpdate(
    model: PrismaModelKey,
    updates: Array<{ where: Record<string, unknown>; data: Record<string, unknown> }>,
    useTx: boolean = true
  ): Promise<void> {
    if (useTx) {
      await this.executeInTransaction(async (tx) => {
        for (const update of updates) {
          await (tx[model] as any).update(update);
        }
      });
    } else {
      for (const update of updates) {
        await (prisma[model] as any).update(update);
      }
    }
  }

  static async bulkDelete(
    model: PrismaModelKey,
    whereConditions: Record<string, unknown>[],
    useTx: boolean = true
  ): Promise<void> {
    if (useTx) {
      await this.executeInTransaction(async (tx) => {
        for (const where of whereConditions) {
          await (tx[model] as any).delete({ where });
        }
      });
    } else {
      for (const where of whereConditions) {
        await (prisma[model] as any).delete({ where });
      }
    }
  }

  static async upsert<T>(
    model: PrismaModelKey,
    where: Record<string, unknown>,
    create: Record<string, unknown>,
    update: Record<string, unknown>
  ): Promise<T> {
    return (prisma[model] as any).upsert({
      where,
      create,
      update,
    });
  }

  static async bulkUpsert(
    model: PrismaModelKey,
    operations: Array<{
      where: Record<string, unknown>;
      create: Record<string, unknown>;
      update: Record<string, unknown>;
    }>,
    useTx: boolean = true
  ): Promise<void> {
    if (useTx) {
      await this.executeInTransaction(async (tx) => {
        for (const op of operations) {
          await (tx[model] as any).upsert(op);
        }
      });
    } else {
      for (const op of operations) {
        await (prisma[model] as any).upsert(op);
      }
    }
  }

  static async executeInteractiveTransaction<T>(
    callback: (tx: PrismaTransactionClient) => Promise<T>,
    options?: TransactionOptions
  ): Promise<T> {
    return prisma.$transaction(
      callback as (tx: PrismaTransactionClient) => Promise<T>,
      {
        maxWait: options?.maxWait ?? 5000,
        timeout: options?.timeout ?? 30000,
        isolationLevel: options?.isolationLevel as any,
      }
    ) as Promise<T>;
  }

  static async executeSequentialTransaction(
    operations: Array<(tx: PrismaTransactionClient) => Promise<unknown>>
  ): Promise<unknown[]> {
    return this.executeInTransaction(async (tx) => {
      const results: unknown[] = [];
      for (const operation of operations) {
        const result = await operation(tx);
        results.push(result);
      }
      return results;
    });
  }

  static async safeExecute<T>(
    callback: () => Promise<T>,
    fallback?: T
  ): Promise<T | null> {
    try {
      return await callback();
    } catch (error) {
      console.error('Safe execute failed:', error);
      return fallback !== undefined ? fallback : null;
    }
  }

  static async withLock<T>(
    lockKey: string,
    callback: (tx: PrismaTransactionClient) => Promise<T>
  ): Promise<T> {
    return this.executeInTransaction(async (tx) => {
      await (tx as any).$executeRawUnsafe(
        `SELECT pg_advisory_xact_lock(hashtext('${lockKey}'))`
      );
      return callback(tx);
    });
  }

  static async parallel<T>(
    operations: Array<() => Promise<T>>
  ): Promise<T[]> {
    return Promise.all(operations.map((op) => op()));
  }

  static async sequential<T>(
    operations: Array<() => Promise<T>>
  ): Promise<T[]> {
    const results: T[] = [];
    for (const operation of operations) {
      results.push(await operation());
    }
    return results;
  }

  static async chunked<T, R>(
    items: T[],
    chunkSize: number,
    processor: (chunk: T[]) => Promise<R>
  ): Promise<R[]> {
    const results: R[] = [];
    for (let i = 0; i < items.length; i += chunkSize) {
      const chunk = items.slice(i, i + chunkSize);
      const result = await processor(chunk);
      results.push(result);
    }
    return results;
  }
}

export const executeInTransaction = TransactionHelper.executeInTransaction.bind(TransactionHelper);
export const executeWithRetry = TransactionHelper.executeWithRetry.bind(TransactionHelper);
export const bulkCreate = TransactionHelper.bulkCreate.bind(TransactionHelper);
export const bulkUpdate = TransactionHelper.bulkUpdate.bind(TransactionHelper);
export const bulkDelete = TransactionHelper.bulkDelete.bind(TransactionHelper);
export const bulkUpsert = TransactionHelper.bulkUpsert.bind(TransactionHelper);
export const withLock = TransactionHelper.withLock.bind(TransactionHelper);