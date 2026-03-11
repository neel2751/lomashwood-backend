import { PrismaPg } from "@prisma/adapter-pg";

import { PrismaClient as PrismaClientClass } from "@generated/prisma/client";

type PrismaClient = InstanceType<typeof PrismaClientClass>;

const connectionString =
  process.env.DATABASE_URL ?? "postgresql://postgres:postgres@localhost:5432/postgres";

const adapter = new PrismaPg({ connectionString });

declare global {
  var prisma: PrismaClient | undefined;
}

const prisma = globalThis.prisma ?? new PrismaClientClass({ adapter });

if (process.env.NODE_ENV !== "production") {
  globalThis.prisma = prisma;
}

export default prisma;
