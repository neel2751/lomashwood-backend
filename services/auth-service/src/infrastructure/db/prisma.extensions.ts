import { Prisma } from '@prisma/client';
import { prisma } from './prisma.client';

export const extendedPrisma = prisma.$extends({
  model: {
    $allModels: {
      async findManyWithPagination<T>(
        this: T,
        args: {
          where?: Record<string, unknown>;
          orderBy?: Record<string, unknown>;
          page?: number;
          limit?: number;
          include?: Record<string, unknown>;
          select?: Record<string, unknown>;
        }
      ): Promise<{
        data: unknown[];
        meta: { total: number; page: number; limit: number; totalPages: number };
      }> {
        const context = Prisma.getExtensionContext(this);
        const page = args.page || 1;
        const limit = args.limit || 10;
        const skip = (page - 1) * limit;

        const [data, total] = await Promise.all([
          (context as any).findMany({
            where: args.where,
            orderBy: args.orderBy,
            skip,
            take: limit,
            include: args.include,
            select: args.select,
          }),
          (context as any).count({ where: args.where }),
        ]);

        return {
          data,
          meta: {
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
          },
        };
      },

      async softDelete<T>(this: T, args: { where: Record<string, unknown> }): Promise<unknown> {
        const context = Prisma.getExtensionContext(this);
        return (context as any).update({
          where: args.where,
          data: { deletedAt: new Date() },
        });
      },

      async restore<T>(this: T, args: { where: Record<string, unknown> }): Promise<unknown> {
        const context = Prisma.getExtensionContext(this);
        return (context as any).update({
          where: args.where,
          data: { deletedAt: null },
        });
      },

      async findActive<T>(
        this: T,
        args?: {
          where?: Record<string, unknown>;
          include?: Record<string, unknown>;
          select?: Record<string, unknown>;
          orderBy?: Record<string, unknown>;
        }
      ): Promise<unknown[]> {
        const context = Prisma.getExtensionContext(this);
        return (context as any).findMany({
          where: {
            ...args?.where,
            deletedAt: null,
          },
          include: args?.include,
          select: args?.select,
          orderBy: args?.orderBy,
        });
      },

      async findDeleted<T>(
        this: T,
        args?: {
          where?: Record<string, unknown>;
          include?: Record<string, unknown>;
          select?: Record<string, unknown>;
        }
      ): Promise<unknown[]> {
        const context = Prisma.getExtensionContext(this);
        return (context as any).findMany({
          where: {
            ...args?.where,
            deletedAt: { not: null },
          },
          include: args?.include,
          select: args?.select,
        });
      },
    },
  },

  query: {
    $allModels: {
      async findUnique({
        args,
        query,
      }: {
        args: Record<string, any>;
        query: (args: Record<string, any>) => Promise<unknown>;
      }): Promise<unknown> {
        args['where'] = {
          ...args['where'],
          deletedAt: null,
        };
        const result = await query(args);
        return attachVirtualFields(result);
      },

      async findFirst({
        args,
        query,
      }: {
        args: Record<string, any>;
        query: (args: Record<string, any>) => Promise<unknown>;
      }): Promise<unknown> {
        args['where'] = {
          ...args['where'],
          deletedAt: null,
        };
        const result = await query(args);
        return attachVirtualFields(result);
      },

      async findMany({
        args,
        query,
      }: {
        args: Record<string, any>;
        query: (args: Record<string, any>) => Promise<unknown>;
      }): Promise<unknown> {
        if (!args['where']) {
          args['where'] = {};
        }
        if (args['where']['deletedAt'] === undefined) {
          args['where']['deletedAt'] = null;
        }
        const results = await query(args);
        if (Array.isArray(results)) {
          return results.map(attachVirtualFields);
        }
        return results;
      },

      async update({
        args,
        query,
      }: {
        args: Record<string, any>;
        query: (args: Record<string, any>) => Promise<unknown>;
      }): Promise<unknown> {
        args['data'] = {
          ...args['data'],
          updatedAt: new Date(),
        };
        return query(args);
      },

      async updateMany({
        args,
        query,
      }: {
        args: Record<string, any>;
        query: (args: Record<string, any>) => Promise<unknown>;
      }): Promise<unknown> {
        args['data'] = {
          ...args['data'],
          updatedAt: new Date(),
        };
        return query(args);
      },

      async create({
        args,
        query,
      }: {
        args: Record<string, any>;
        query: (args: Record<string, any>) => Promise<unknown>;
      }): Promise<unknown> {
        args['data'] = {
          ...args['data'],
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        return query(args);
      },

      async createMany({
        args,
        query,
      }: {
        args: Record<string, any>;
        query: (args: Record<string, any>) => Promise<unknown>;
      }): Promise<unknown> {
        if (Array.isArray(args['data'])) {
          args['data'] = (args['data'] as Record<string, unknown>[]).map((item) => ({
            ...item,
            createdAt: new Date(),
            updatedAt: new Date(),
          }));
        }
        return query(args);
      },

      async delete({
        args,
        query: _query,
      }: {
        args: Record<string, any>;
        query: (args: Record<string, any>) => Promise<unknown>;
      }): Promise<unknown> {
        return (prisma as any).update({
          where: args['where'],
          data: { deletedAt: new Date() },
        });
      },

      async deleteMany({
        args,
        query: _query,
      }: {
        args: Record<string, any>;
        query: (args: Record<string, any>) => Promise<unknown>;
      }): Promise<unknown> {
        return (prisma as any).updateMany({
          where: args['where'],
          data: { deletedAt: new Date() },
        });
      },
    },
  },
});

function attachVirtualFields<T>(record: T): T {
  if (record === null || record === undefined || typeof record !== 'object') {
    return record;
  }
  const obj = record as Record<string, unknown>;
  if ('deletedAt' in obj) {
    obj['isActive'] = obj['deletedAt'] === null;
    obj['isDeleted'] = obj['deletedAt'] !== null;
  }
  return record;
}

export type ExtendedPrismaClient = typeof extendedPrisma;