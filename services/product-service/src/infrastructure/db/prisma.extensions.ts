import { Prisma } from '@prisma/client';
import prisma from './prisma.client';

export const softDeleteExtension = Prisma.defineExtension({
  name: 'softDelete',
  model: {
    $allModels: {
      async softDelete<T>(
        this: T,
        where: Prisma.Args<T, 'update'>['where'],
      ): Promise<Prisma.Result<T, { data: { deletedAt: Date } }, 'update'>> {
        const context = Prisma.getExtensionContext(this);
        return (context as any).update({
          where,
          data: { deletedAt: new Date() },
        });
      },

      async softDeleteMany<T>(
        this: T,
        where: Prisma.Args<T, 'updateMany'>['where'],
      ): Promise<Prisma.Result<T, { data: { deletedAt: Date } }, 'updateMany'>> {
        const context = Prisma.getExtensionContext(this);
        return (context as any).updateMany({
          where,
          data: { deletedAt: new Date() },
        });
      },

      async findManyActive<T>(
        this: T,
        args?: Omit<Prisma.Args<T, 'findMany'>, 'where'> & {
          where?: Prisma.Args<T, 'findMany'>['where'];
        },
      ): Promise<Prisma.Result<T, Prisma.Args<T, 'findMany'>, 'findMany'>> {
        const context = Prisma.getExtensionContext(this);
        return (context as any).findMany({
          ...args,
          where: {
            ...(args?.where ?? {}),
            deletedAt: null,
          },
        });
      },

      async findFirstActive<T>(
        this: T,
        args?: Omit<Prisma.Args<T, 'findFirst'>, 'where'> & {
          where?: Prisma.Args<T, 'findFirst'>['where'];
        },
      ): Promise<Prisma.Result<T, Prisma.Args<T, 'findFirst'>, 'findFirst'>> {
        const context = Prisma.getExtensionContext(this);
        return (context as any).findFirst({
          ...args,
          where: {
            ...(args?.where ?? {}),
            deletedAt: null,
          },
        });
      },

      async restore<T>(
        this: T,
        where: Prisma.Args<T, 'update'>['where'],
      ): Promise<Prisma.Result<T, { data: { deletedAt: null } }, 'update'>> {
        const context = Prisma.getExtensionContext(this);
        return (context as any).update({
          where,
          data: { deletedAt: null },
        });
      },
    },
  },
});

export const auditExtension = Prisma.defineExtension({
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
        args.create = {
          ...args.create,
          createdAt: (args.create as any).createdAt ?? new Date(),
          updatedAt: new Date(),
        };
        args.update = {
          ...args.update,
          updatedAt: new Date(),
        };
        return query(args);
      },
    },
  },
});

export const paginationExtension = Prisma.defineExtension({
  name: 'pagination',
  model: {
    $allModels: {
      async paginate<T>(
        this: T,
        args: Prisma.Args<T, 'findMany'> & {
          page?: number;
          limit?: number;
        },
      ): Promise<{
        data: Prisma.Result<T, Prisma.Args<T, 'findMany'>, 'findMany'>;
        total: number;
        page: number;
        limit: number;
        totalPages: number;
      }> {
        const context = Prisma.getExtensionContext(this);
        const page = Math.max(1, args.page ?? 1);
        const limit = Math.min(100, Math.max(1, args.limit ?? 20));
        const skip = (page - 1) * limit;

        const { page: _page, limit: _limit, ...findArgs } = args;

        const [data, total] = await Promise.all([
          (context as any).findMany({ ...findArgs, skip, take: limit }),
          (context as any).count({ where: (findArgs as any).where }),
        ]);

        return {
          data,
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        };
      },
    },
  },
});

export const extendedPrismaClient = prisma
  .$extends(softDeleteExtension)
  .$extends(auditExtension)
  .$extends(paginationExtension);

export type ExtendedPrismaClient = typeof extendedPrismaClient;

export default extendedPrismaClient;