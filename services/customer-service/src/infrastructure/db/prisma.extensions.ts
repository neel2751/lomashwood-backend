import { Prisma } from '@prisma/client';

export const softDeleteExtension = Prisma.defineExtension({
  name: 'softDelete',
  model: {
    customer: {
      async softDelete(id: string) {
        const context = Prisma.getExtensionContext(this);
        return (context as any).update({
          where: { id },
          data: { deletedAt: new Date(), isActive: false },
        });
      },
      async findManyActive<T>(args?: Prisma.CustomerFindManyArgs): Promise<T[]> {
        const context = Prisma.getExtensionContext(this);
        return (context as any).findMany({
          ...args,
          where: { ...args?.where, deletedAt: null },
        });
      },
    },
    customerAddress: {
      async softDelete(id: string) {
        const context = Prisma.getExtensionContext(this);
        return (context as any).update({
          where: { id },
          data: { deletedAt: new Date() },
        });
      },
    },
    wishlist: {
      async softDelete(id: string) {
        const context = Prisma.getExtensionContext(this);
        return (context as any).update({
          where: { id },
          data: { deletedAt: new Date() },
        });
      },
    },
    review: {
      async softDelete(id: string) {
        const context = Prisma.getExtensionContext(this);
        return (context as any).update({
          where: { id },
          data: { deletedAt: new Date() },
        });
      },
    },
    supportTicket: {
      async softDelete(id: string) {
        const context = Prisma.getExtensionContext(this);
        return (context as any).update({
          where: { id },
          data: { deletedAt: new Date() },
        });
      },
    },
  },
  query: {
    customer: {
      async findMany({ args, query }) {
        if (args.where && 'deletedAt' in args.where) {
          return query(args);
        }
        args.where = { ...args.where, deletedAt: null };
        return query(args);
      },
      async findFirst({ args, query }) {
        if (args.where && 'deletedAt' in args.where) {
          return query(args);
        }
        args.where = { ...args.where, deletedAt: null };
        return query(args);
      },
      async findUnique({ args, query }) {
        return query(args);
      },
      async count({ args, query }) {
        if (args.where && 'deletedAt' in args.where) {
          return query(args);
        }
        args.where = { ...args.where, deletedAt: null };
        return query(args);
      },
    },
    customerAddress: {
      async findMany({ args, query }) {
        if (args.where && 'deletedAt' in args.where) {
          return query(args);
        }
        args.where = { ...args.where, deletedAt: null };
        return query(args);
      },
      async findFirst({ args, query }) {
        if (args.where && 'deletedAt' in args.where) {
          return query(args);
        }
        args.where = { ...args.where, deletedAt: null };
        return query(args);
      },
    },
    wishlist: {
      async findMany({ args, query }) {
        if (args.where && 'deletedAt' in args.where) {
          return query(args);
        }
        args.where = { ...args.where, deletedAt: null };
        return query(args);
      },
      async findFirst({ args, query }) {
        if (args.where && 'deletedAt' in args.where) {
          return query(args);
        }
        args.where = { ...args.where, deletedAt: null };
        return query(args);
      },
    },
    review: {
      async findMany({ args, query }) {
        if (args.where && 'deletedAt' in args.where) {
          return query(args);
        }
        args.where = { ...args.where, deletedAt: null };
        return query(args);
      },
      async findFirst({ args, query }) {
        if (args.where && 'deletedAt' in args.where) {
          return query(args);
        }
        args.where = { ...args.where, deletedAt: null };
        return query(args);
      },
    },
    supportTicket: {
      async findMany({ args, query }) {
        if (args.where && 'deletedAt' in args.where) {
          return query(args);
        }
        args.where = { ...args.where, deletedAt: null };
        return query(args);
      },
      async findFirst({ args, query }) {
        if (args.where && 'deletedAt' in args.where) {
          return query(args);
        }
        args.where = { ...args.where, deletedAt: null };
        return query(args);
      },
    },
  },
});

export const auditExtension = Prisma.defineExtension({
  name: 'audit',
  query: {
    $allModels: {
      async create({ args, query }) {
        return query(args);
      },
      async update({ args, query }) {
        return query(args);
      },
    },
  },
});

export type ExtendedPrismaClient = ReturnType<typeof createExtendedClient>;

export function createExtendedClient(client: any) {
  return client
    .$extends(softDeleteExtension)
    .$extends(auditExtension);
}