import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient, Prisma } from '@prisma/client';
import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env['DATABASE_URL'],
});

const adapter = new PrismaPg(pool);

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function createPrismaClient(): PrismaClient {
  const client = new PrismaClient({
    adapter,
    log: [
      { emit: 'event', level: 'query' },
      { emit: 'event', level: 'info' },
      { emit: 'event', level: 'warn' },
      { emit: 'event', level: 'error' },
    ],
    errorFormat: 'minimal',
  });

  client.$on('query' as never, (e: Prisma.QueryEvent) => {
    console.debug({
      message: 'Prisma query',
      query: e.query,
      params: e.params,
      duration: `${e.duration}ms`,
      target: e['target'],
    });
  });

  client.$on('info' as never, (e: Prisma.LogEvent) => {
    console.info({
      message: 'Prisma info',
      target: e['target'],
      timestamp: e.timestamp,
    });
  });

  client.$on('warn' as never, (e: Prisma.LogEvent) => {
    console.warn({
      message: 'Prisma warning',
      target: e['target'],
      timestamp: e.timestamp,
    });
  });

  client.$on('error' as never, (e: Prisma.LogEvent) => {
    console.error({
      message: 'Prisma error',
      target: e['target'],
      timestamp: e.timestamp,
    });
  });

  return client;
}

export const prisma: PrismaClient =
  globalForPrisma.prisma ?? createPrismaClient();

if (process.env['NODE_ENV'] !== 'production') {
  globalForPrisma.prisma = prisma;
}

export async function connectDatabase(): Promise<void> {
  try {
    await prisma.$connect();
    console.info('Database connected successfully');
  } catch (error) {
    console.error('Database connection failed', error);
    throw error;
  }
}

export async function disconnectDatabase(): Promise<void> {
  try {
    await prisma.$disconnect();
    console.info('Database disconnected successfully');
  } catch (error) {
    console.error('Database disconnection failed', error);
    throw error;
  }
}

export async function checkDatabaseHealth(): Promise<boolean> {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return true;
  } catch {
    return false;
  }
}

export async function withTransaction<T>(
  fn: (tx: Prisma.TransactionClient) => Promise<T>,
  options?: {
    maxWait?: number;
    timeout?: number;
    isolationLevel?: Prisma.TransactionIsolationLevel;
  },
): Promise<T> {
  return prisma.$transaction(fn, {
    maxWait: options?.maxWait ?? 5000,
    timeout: options?.timeout ?? 10000,
    isolationLevel: options?.isolationLevel ?? Prisma.TransactionIsolationLevel.ReadCommitted,
  });
}

export function isPrismaError(error: unknown): error is Prisma.PrismaClientKnownRequestError {
  return error instanceof Prisma.PrismaClientKnownRequestError;
}

export function isPrismaValidationError(
  error: unknown,
): error is Prisma.PrismaClientValidationError {
  return error instanceof Prisma.PrismaClientValidationError;
}

export function isUniqueConstraintError(error: unknown): boolean {
  return isPrismaError(error) && error.code === 'P2002';
}

export function isRecordNotFoundError(error: unknown): boolean {
  return isPrismaError(error) && error.code === 'P2025';
}

export function isForeignKeyConstraintError(error: unknown): boolean {
  return isPrismaError(error) && error.code === 'P2003';
}

export function getUniqueConstraintFields(
  error: Prisma.PrismaClientKnownRequestError,
): string[] {
  const target = error.meta?.['target'];
  if (Array.isArray(target)) return target as string[];
  if (typeof target === 'string') return [target];
  return [];
}

export { Prisma };
export default prisma;