import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default async function globalTeardown(): Promise<void> {
  await cleanDatabase();
  await prisma.$disconnect();
}

async function cleanDatabase(): Promise<void> {
  const tables = [
    'SeoMeta',
    'MediaWallImage',
    'MediaWall',
    'LandingPageSection',
    'LandingPage',
    'BlogTag',
    'BlogCategory',
    'Blog',
    'PageSection',
    'Page',
  ];

  for (const table of tables) {
    await (prisma as any)[table.charAt(0).toLowerCase() + table.slice(1)]
      .deleteMany({})
      .catch(() => {});
  }
}