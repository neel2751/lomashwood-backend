import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { config } from '../../config';

const pool = new Pool({
  connectionString: process.env['DATABASE_URL'],
});

const adapter = new PrismaPg(pool);

const prismaClientSingleton = () => {
  const client = new PrismaClient({
    adapter,
    log:
      String(config.env) === 'development'
        ? [
            { emit: 'event', level: 'query' },
            { emit: 'event', level: 'error' },
            { emit: 'event', level: 'info' },
            { emit: 'event', level: 'warn' },
          ]
        : [{ emit: 'event', level: 'error' }],
    errorFormat: 'minimal',
  });

  if (String(config.env) === 'development') {
    (client as any).$on('query', (e: { query: string; duration: number; params: string }) => {
      console.log('Query: ' + e.query);
      console.log('Duration: ' + e.duration + 'ms');
    });

    (client as any).$on('error', (e: { message: string; target: string }) => {
      console.error('Prisma Error:', e);
    });
  }

  return client.$extends({
    query: {
      $allModels: {
        async findMany({ args, query }: { args: any; query: (args: any) => Promise<any> }) {
          if (args.where) {
            if (args.where.deletedAt === undefined) {
              args.where.deletedAt = null;
            }
          } else {
            args.where = { deletedAt: null };
          }
          return query(args);
        },

        async findFirst({ args, query }: { args: any; query: (args: any) => Promise<any> }) {
          args.where = { ...args.where, deletedAt: null };
          return query(args);
        },

        async findUnique({ args, query }: { args: any; query: (args: any) => Promise<any> }) {
          args.where = { ...args.where, deletedAt: null };
          return query(args);
        },

        async delete({ args, query }: { args: any; query: (args: any) => Promise<any> }) {
          return query({ ...args, data: { deletedAt: new Date() } });
        },

        async deleteMany({ args, query }: { args: any; query: (args: any) => Promise<any> }) {
          const data = args.data ? { ...args.data, deletedAt: new Date() } : { deletedAt: new Date() };
          return query({ ...args, data });
        },

        async create({ args, query }: { args: any; query: (args: any) => Promise<any> }) {
          args.data = { ...args.data, createdAt: new Date(), updatedAt: new Date() };
          return query(args);
        },

        async update({ args, query }: { args: any; query: (args: any) => Promise<any> }) {
          args.data = { ...args.data, updatedAt: new Date() };
          return query(args);
        },

        async updateMany({ args, query }: { args: any; query: (args: any) => Promise<any> }) {
          args.data = { ...args.data, updatedAt: new Date() };
          return query(args);
        },
      },
    },
  });
};

type PrismaClientSingleton = ReturnType<typeof prismaClientSingleton>;

declare global {
  var prismaGlobal: PrismaClientSingleton | undefined;
}

const prisma = globalThis.prismaGlobal ?? prismaClientSingleton();

if (String(config.env) !== 'production') {
  globalThis.prismaGlobal = prisma;
}

export { prisma };
export default prisma;