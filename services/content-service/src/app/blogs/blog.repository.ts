import { prisma } from '../../infrastructure/db/prisma.client';
import {
  Blog,
  BlogListQuery,
  BlogRepository,
  CreateBlogPayload,
  PaginatedBlogResult,
  UpdateBlogPayload,
} from './blog.types';
import { BlogMapper } from './blog.mapper';
import { BLOG_DEFAULT_PAGE_SIZE } from './blog.constants';

const BLOG_WITH_RELATIONS = {
  category: true,
  tags: { include: { tag: true } },
};

export class BlogRepositoryImpl implements BlogRepository {
  async findAll(query: BlogListQuery): Promise<PaginatedBlogResult> {
    const {
      page = 1,
      limit = BLOG_DEFAULT_PAGE_SIZE,
      status,
      categoryId,
      tagId,
      isFeatured,
      search,
      sortBy = 'publishedAt',
      sortOrder = 'desc',
    } = query;

    const skip = (page - 1) * limit;

    const where: Record<string, any> = {
      deletedAt: null,
      ...(status !== undefined && { status }),
      ...(categoryId !== undefined && { categoryId }),
      ...(isFeatured !== undefined && { isFeatured }),
      ...(tagId !== undefined && {
        tags: { some: { tagId } },
      }),
      ...(search !== undefined && {
        OR: [
          { title: { contains: search, mode: 'insensitive' } },
          { excerpt: { contains: search, mode: 'insensitive' } },
        ],
      }),
    };

    const orderBy: Record<string, string> = {
      [sortBy]: sortOrder,
    };

    const [blogs, total] = await Promise.all([
      (prisma as any).blog.findMany({
        where,
        skip,
        take: limit,
        orderBy,
        include: BLOG_WITH_RELATIONS,
      }),
      (prisma as any).blog.count({ where }),
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
      data: BlogMapper.toSummaryDtoList(blogs),
      meta: {
        page,
        limit,
        total,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
    };
  }

  async findById(id: string): Promise<Blog | null> {
    return (prisma as any).blog.findFirst({
      where: { id, deletedAt: null },
      include: BLOG_WITH_RELATIONS,
    });
  }

  async findBySlug(slug: string): Promise<Blog | null> {
    return (prisma as any).blog.findFirst({
      where: { slug, deletedAt: null },
      include: BLOG_WITH_RELATIONS,
    });
  }

  async findFeatured(limit = 6): Promise<Blog[]> {
    return (prisma as any).blog.findMany({
      where: { isFeatured: true, status: 'PUBLISHED', deletedAt: null },
      take: limit,
      orderBy: { publishedAt: 'desc' },
      include: BLOG_WITH_RELATIONS,
    });
  }

  async create(payload: CreateBlogPayload): Promise<Blog> {
    const { tagIds = [], ...rest } = payload;

    return (prisma as any).blog.create({
      data: {
        ...rest,
        publishedAt: rest.status === 'PUBLISHED' ? new Date() : null,
        tags: {
          create: tagIds.map((tagId: string) => ({ tag: { connect: { id: tagId } } })),
        },
      },
      include: BLOG_WITH_RELATIONS,
    });
  }

  async update(id: string, payload: UpdateBlogPayload): Promise<Blog> {
    const { tagIds, ...rest } = payload;

    const current = await (prisma as any).blog.findUniqueOrThrow({ where: { id } });

    const publishedAt =
      rest.status === 'PUBLISHED' && current.status !== 'PUBLISHED'
        ? new Date()
        : rest.status !== undefined && rest.status !== 'PUBLISHED'
          ? null
          : undefined;

    return (prisma as any).blog.update({
      where: { id },
      data: {
        ...rest,
        ...(publishedAt !== undefined && { publishedAt }),
        ...(tagIds !== undefined && {
          tags: {
            deleteMany: {},
            create: tagIds.map((tagId: string) => ({ tag: { connect: { id: tagId } } })),
          },
        }),
      },
      include: BLOG_WITH_RELATIONS,
    });
  }

  async softDelete(id: string): Promise<void> {
    await (prisma as any).blog.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  async slugExists(slug: string, excludeId?: string): Promise<boolean> {
    const blog = await (prisma as any).blog.findFirst({
      where: {
        slug,
        deletedAt: null,
        ...(excludeId !== undefined && { id: { not: excludeId } }),
      },
      select: { id: true },
    });
    return blog !== null;
  }
}