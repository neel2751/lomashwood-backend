import { execSync } from 'child_process';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.TEST_DATABASE_URL,
    },
  },
});

export default async function globalSetup(): Promise<void> {
  process.env.NODE_ENV = 'test';
  process.env.DATABASE_URL = process.env.TEST_DATABASE_URL ?? 'postgresql://postgres:postgres@localhost:5433/lomash_content_test';
  process.env.REDIS_URL = process.env.TEST_REDIS_URL ?? 'redis://localhost:6380';
  process.env.JWT_SECRET = 'test-jwt-secret-content-service';
  process.env.PORT = '4004';

  execSync('npx prisma migrate deploy', {
    env: {
      ...process.env,
      DATABASE_URL: process.env.DATABASE_URL,
    },
    stdio: 'pipe',
  });

  await seedTestData();
  await prisma.$disconnect();
}

async function seedTestData(): Promise<void> {
  await prisma.blog.createMany({
    data: [
      {
        id: 'seed-blog-1',
        title: 'Kitchen Design Trends 2025',
        slug: 'kitchen-design-trends-2025',
        content: '<p>Content about kitchen trends</p>',
        excerpt: 'Discover the latest kitchen design trends',
        status: 'PUBLISHED',
        authorId: 'seed-author-1',
        publishedAt: new Date(),
      },
      {
        id: 'seed-blog-2',
        title: 'Bedroom Makeover Ideas',
        slug: 'bedroom-makeover-ideas',
        content: '<p>Content about bedroom makeovers</p>',
        excerpt: 'Transform your bedroom with these ideas',
        status: 'DRAFT',
        authorId: 'seed-author-1',
        publishedAt: null,
      },
    ],
    skipDuplicates: true,
  });

  await prisma.page.createMany({
    data: [
      {
        id: 'seed-page-1',
        title: 'About Us',
        slug: 'about-us',
        content: '<p>About Lomash Wood</p>',
        status: 'PUBLISHED',
        publishedAt: new Date(),
      },
      {
        id: 'seed-page-2',
        title: 'Why Choose Us',
        slug: 'why-choose-us',
        content: '<p>Why choose Lomash Wood</p>',
        status: 'PUBLISHED',
        publishedAt: new Date(),
      },
      {
        id: 'seed-page-3',
        title: 'Our Process',
        slug: 'our-process',
        content: '<p>Our four-step process</p>',
        status: 'PUBLISHED',
        publishedAt: new Date(),
      },
    ],
    skipDuplicates: true,
  });

  await prisma.mediaWall.createMany({
    data: [
      {
        id: 'seed-media-1',
        title: 'Living Room Media Wall',
        description: 'Beautiful fireplace media wall installation',
        backgroundImage: 'https://example.com/bg.jpg',
        isActive: true,
      },
    ],
    skipDuplicates: true,
  });

  await prisma.seoMeta.createMany({
    data: [
      {
        id: 'seed-seo-1',
        entityId: 'seed-blog-1',
        entityType: 'BLOG',
        metaTitle: 'Kitchen Design Trends 2025 | Lomash Wood',
        metaDescription: 'Discover the latest kitchen design trends for 2025',
        canonicalUrl: 'https://lomashwood.co.uk/blog/kitchen-design-trends-2025',
      },
    ],
    skipDuplicates: true,
  });
}