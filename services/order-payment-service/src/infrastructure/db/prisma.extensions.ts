import { Prisma, PrismaClient } from '@prisma/client';
import { prisma } from './prisma.client';
import { logger } from '../../config/logger';

const softDeleteExtension = Prisma.defineExtension({
  name: 'softDelete',
  model: {
    $allModels: {
      async softDelete<T>(
        this: T,
        args: { where: Prisma.Args<T, 'update'>['where']; deletedBy?: string },
      ): Promise<Prisma.Result<T, { data: object; where: object }, 'update'>> {
        const context = Prisma.getExtensionContext(this);

        return (context as any).update({
          where: args.where,
          data: {
            deletedAt: new Date(),
            updatedAt: new Date(),
            ...(args.deletedBy ? { deletedBy: args.deletedBy } : {}),
          },
        });
      },

      async softDeleteMany<T>(
        this: T,
        args: { where: Prisma.Args<T, 'updateMany'>['where']; deletedBy?: string },
      ): Promise<Prisma.Result<T, { data: object; where: object }, 'updateMany'>> {
        const context = Prisma.getExtensionContext(this);

        return (context as any).updateMany({
          where: args.where,
          data: {
            deletedAt: new Date(),
            updatedAt: new Date(),
            ...(args.deletedBy ? { deletedBy: args.deletedBy } : {}),
          },
        });
      },

      async restore<T>(
        this: T,
        args: { where: Prisma.Args<T, 'update'>['where'] },
      ): Promise<Prisma.Result<T, { data: object; where: object }, 'update'>> {
        const context = Prisma.getExtensionContext(this);

        return (context as any).update({
          where: args.where,
          data: {
            deletedAt: null,
            updatedAt: new Date(),
          },
        });
      },
    },
  },
});

const auditExtension = Prisma.defineExtension({
  name: 'audit',
  query: {
    $allModels: {
      async create({ args, query }) {
        args.data = {
          ...args.data,
          createdAt: args.data.createdAt ?? new Date(),
          updatedAt: new Date(),
        };
        return query(args);
      },

      async update({ args, query }) {
        args.data = {
          ...args.data,
          updatedAt: new Date(),
        };
        return query(args);
      },

      async updateMany({ args, query }) {
        args.data = {
          ...args.data,
          updatedAt: new Date(),
        };
        return query(args);
      },

      async upsert({ args, query }) {
        const now = new Date();
        args.create = {
          ...args.create,
          createdAt: (args.create as any).createdAt ?? now,
          updatedAt: now,
        };
        args.update = {
          ...args.update,
          updatedAt: now,
        };
        return query(args);
      },
    },
  },
});

const softDeleteFilterExtension = Prisma.defineExtension({
  name: 'softDeleteFilter',
  query: {
    $allModels: {
      async findFirst({ args, query }) {
        args.where = { ...args.where, deletedAt: null };
        return query(args);
      },

      async findFirstOrThrow({ args, query }) {
        args.where = { ...args.where, deletedAt: null };
        return query(args);
      },

      async findMany({ args, query }) {
        args.where = { ...args.where, deletedAt: null };
        return query(args);
      },

      async findUnique({ args, query }) {
        return query(args);
      },

      async findUniqueOrThrow({ args, query }) {
        return query(args);
      },

      async count({ args, query }) {
        args.where = { ...args.where, deletedAt: null };
        return query(args);
      },

      async aggregate({ args, query }) {
        args.where = { ...args.where, deletedAt: null };
        return query(args);
      },

      async groupBy({ args, query }) {
        args.where = { ...args.where, deletedAt: null };
        return query(args);
      },
    },
  },
});

const loggingExtension = Prisma.defineExtension({
  name: 'logging',
  query: {
    $allModels: {
      async $allOperations({ operation, model, args, query }) {
        const start = Date.now();

        try {
          const result = await query(args);
          const duration = Date.now() - start;

          logger.debug('Prisma operation completed', {
            model,
            operation,
            duration: `${duration}ms`,
          });

          return result;
        } catch (error) {
          const duration = Date.now() - start;

          logger.error('Prisma operation failed', {
            model,
            operation,
            duration: `${duration}ms`,
            error: error instanceof Error ? error.message : String(error),
          });

          throw error;
        }
      },
    },
  },
});

const paginationExtension = Prisma.defineExtension({
  name: 'pagination',
  model: {
    $allModels: {
      async paginate<T>(
        this: T,
        args: Prisma.Args<T, 'findMany'> & { page?: number; limit?: number },
      ): Promise<{
        data: Prisma.Result<T, Prisma.Args<T, 'findMany'>, 'findMany'>;
        meta: {
          total: number;
          page: number;
          limit: number;
          totalPages: number;
          hasNextPage: boolean;
          hasPreviousPage: boolean;
        };
      }> {
        const context = Prisma.getExtensionContext(this);
        const page = Math.max(1, args.page ?? 1);
        const limit = Math.min(100, Math.max(1, args.limit ?? 20));

        const { page: _p, limit: _l, ...findManyArgs } = args;

        const [total, data] = await Promise.all([
          (context as any).count({ where: findManyArgs.where }),
          (context as any).findMany({
            ...findManyArgs,
            skip: (page - 1) * limit,
            take: limit,
          }),
        ]);

        const totalPages = Math.ceil(total / limit);

        return {
          data,
          meta: {
            total,
            page,
            limit,
            totalPages,
            hasNextPage: page < totalPages,
            hasPreviousPage: page > 1,
          },
        };
      },
    },
  },
});

export const extendedPrisma = prisma
  .$extends(auditExtension)
  .$extends(softDeleteExtension)
  .$extends(softDeleteFilterExtension)
  .$extends(loggingExtension)
  .$extends(paginationExtension);

export type ExtendedPrismaClient = typeof extendedPrisma;