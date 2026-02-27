

import { Prisma } from '@prisma/client';
import { prisma } from './prisma.client';
import { logger } from '../../config/logger';

const softDeleteModels: ReadonlySet<string> = new Set([
  'Blog',
  'Page',
  'Media',
  'SeoMeta',
  'LandingPage',
]);

const softDeleteExtension = Prisma.defineExtension({
  name: 'softDelete',
  query: {
    $allModels: {
      async findMany({ model, args, query }: {
        model: string;
        args: Prisma.Args<typeof prisma, 'findMany'>;
        query: (args: Prisma.Args<typeof prisma, 'findMany'>) => Promise<unknown>;
      }) {
        if (softDeleteModels.has(model)) {
          args.where = { ...args.where, deletedAt: null };
        }
        return query(args);
      },

      async findFirst({ model, args, query }: {
        model: string;
        args: Prisma.Args<typeof prisma, 'findFirst'>;
        query: (args: Prisma.Args<typeof prisma, 'findFirst'>) => Promise<unknown>;
      }) {
        if (softDeleteModels.has(model)) {
          args.where = { ...args.where, deletedAt: null };
        }
        return query(args);
      },

      async findUnique({ model, args, query }: {
        model: string;
        args: Prisma.Args<typeof prisma, 'findUnique'>;
        query: (args: Prisma.Args<typeof prisma, 'findUnique'>) => Promise<unknown>;
      }) {
        if (softDeleteModels.has(model)) {
          // Promote to findFirst so we can inject deletedAt filter
          const { where } = args as Record<string, unknown>;
          return prisma.$queryRaw`
            SELECT * FROM "${Prisma.raw(model)}"
            WHERE id = ${(where as Record<string, unknown>)['id']}
              AND "deletedAt" IS NULL
            LIMIT 1
          `.catch(() => query(args));
        }
        return query(args);
      },
    },
  },
});

const auditStampExtension = Prisma.defineExtension({
  name: 'auditStamp',
  query: {
    $allModels: {
      async update({ args, query }: {
        args: Record<string, unknown>;
        query: (args: Record<string, unknown>) => Promise<unknown>;
      }) {
        const data = (args['data'] as Record<string, unknown>) ?? {};
        data['updatedAt'] = new Date();
        args['data'] = data;
        return query(args);
      },

      async upsert({ args, query }: {
        args: Record<string, unknown>;
        query: (args: Record<string, unknown>) => Promise<unknown>;
      }) {
        const update = (args['update'] as Record<string, unknown>) ?? {};
        update['updatedAt'] = new Date();
        args['update'] = update;
        return query(args);
      },
    },
  },
});

export interface PaginateArgs {
  page?: number;
  limit?: number;
}

export interface PaginatedResult<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
}

export const extendedPrismaClient = prisma
  .$extends(softDeleteExtension)
  .$extends(auditStampExtension);

export type ExtendedPrismaClient = typeof extendedPrismaClient;
export async function paginate<T>(
  countFn: () => Promise<number>,
  findFn: (skip: number, take: number) => Promise<T[]>,
  { page = 1, limit = 20 }: PaginateArgs,
): Promise<PaginatedResult<T>> {
  const safePage = Math.max(1, page);
  const safeLimit = Math.min(Math.max(1, limit), 100);
  const skip = (safePage - 1) * safeLimit;

  const [total, data] = await Promise.all([countFn(), findFn(skip, safeLimit)]);

  const totalPages = Math.ceil(total / safeLimit);

  logger.debug({
    context: 'paginate',
    page: safePage,
    limit: safeLimit,
    total,
    totalPages,
  });

  return {
    data,
    meta: {
      total,
      page: safePage,
      limit: safeLimit,
      totalPages,
      hasNextPage: safePage < totalPages,
      hasPreviousPage: safePage > 1,
    },
  };
}