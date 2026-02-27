import { Prisma } from '@prisma/client';
import { logger } from '../../config/logger';

export const loggingExtension = Prisma.defineExtension((client) => {
  return client.$extends({
    query: {
      $allModels: {
        async $allOperations({ operation, model, args, query }) {
          const start = performance.now();
          const result = await query(args);
          const end = performance.now();
          const duration = (end - start).toFixed(2);

          logger.debug({
            message: 'Prisma operation',
            model,
            operation,
            duration: `${duration}ms`,
          });

          return result;
        },
      },
    },
  });
});

export const softDeleteExtension = Prisma.defineExtension((client) => {
  return client.$extends({
    model: {
      $allModels: {
        async softDelete<T>(
          this: T,
          where: Prisma.Args<T, 'update'>['where'],
        ): Promise<Prisma.Result<T, { data: object }, 'update'>> {
          const context = Prisma.getExtensionContext(this);
          return (context as unknown as { update: Function }).update({
            where,
            data: { deletedAt: new Date() },
          });
        },

        async findManyActive<T>(
          this: T,
          args?: Prisma.Args<T, 'findMany'>,
        ): Promise<Prisma.Result<T, object, 'findMany'>> {
          const context = Prisma.getExtensionContext(this);
          return (context as unknown as { findMany: Function }).findMany({
            ...args,
            where: {
              ...((args as { where?: object })?.where ?? {}),
              deletedAt: null,
            },
          });
        },

        async findFirstActive<T>(
          this: T,
          args?: Prisma.Args<T, 'findFirst'>,
        ): Promise<Prisma.Result<T, object, 'findFirst'>> {
          const context = Prisma.getExtensionContext(this);
          return (context as unknown as { findFirst: Function }).findFirst({
            ...args,
            where: {
              ...((args as { where?: object })?.where ?? {}),
              deletedAt: null,
            },
          });
        },
      },
    },
  });
});

export const timestampExtension = Prisma.defineExtension((client) => {
  return client.$extends({
    query: {
      $allModels: {
        async create({ args, query }) {
          const data = args.data as Record<string, unknown>;
          if (!data.createdAt) {
            data.createdAt = new Date();
          }
          if (!data.updatedAt) {
            data.updatedAt = new Date();
          }
          return query(args);
        },

        async update({ args, query }) {
          const data = args.data as Record<string, unknown>;
          data.updatedAt = new Date();
          return query(args);
        },

        async updateMany({ args, query }) {
          const data = args.data as Record<string, unknown>;
          data.updatedAt = new Date();
          return query(args);
        },
      },
    },
  });
});

export const paginationExtension = Prisma.defineExtension((client) => {
  return client.$extends({
    model: {
      $allModels: {
        async paginate<T>(
          this: T,
          args: Prisma.Args<T, 'findMany'> & {
            page?: number;
            limit?: number;
          },
        ): Promise<{
          data: Prisma.Result<T, object, 'findMany'>;
          meta: {
            total: number;
            page: number;
            limit: number;
            totalPages: number;
          };
        }> {
          const context = Prisma.getExtensionContext(this);
          const page = args.page ?? 1;
          const limit = args.limit ?? 10;
          const skip = (page - 1) * limit;

          const { page: _page, limit: _limit, ...queryArgs } = args;

          const [data, total] = await Promise.all([
            (context as unknown as { findMany: Function }).findMany({
              ...queryArgs,
              skip,
              take: limit,
            }),
            (context as unknown as { count: Function }).count({
              where: (queryArgs as { where?: object }).where,
            }),
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
      },
    },
  });
});

export const auditExtension = Prisma.defineExtension((client) => {
  return client.$extends({
    query: {
      $allModels: {
        async create({ model, args, query }) {
          const result = await query(args);
          logger.info({
            message: 'Record created',
            model,
            id: (result as Record<string, unknown>).id,
          });
          return result;
        },

        async update({ model, args, query }) {
          const result = await query(args);
          logger.info({
            message: 'Record updated',
            model,
            where: args.where,
          });
          return result;
        },

        async delete({ model, args, query }) {
          const result = await query(args);
          logger.info({
            message: 'Record deleted',
            model,
            where: args.where,
          });
          return result;
        },
      },
    },
  });
});