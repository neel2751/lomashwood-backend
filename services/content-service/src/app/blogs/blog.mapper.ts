import { BlogDetailDto, BlogSummaryDto, BlogCategoryDto } from './blog.types';

interface PrismaBlog {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  coverImage: string | null;
  status: string;
  publishedAt: Date | null;
  isFeatured: boolean;
  content: string;
  authorId: string;
  createdAt: Date;
  updatedAt: Date;
}

interface PrismaBlogCategory {
  id: string;
  name: string;
  slug: string;
  description: string | null;
}

interface PrismaBlogTag {
  id: string;
  name: string;
  slug: string;
}

type PrismaBlogWithRelations = PrismaBlog & {
  category?: PrismaBlogCategory | null;
  tags?: Array<{ tag: PrismaBlogTag }>;
};

type PrismaBlogCategoryWithCount = PrismaBlogCategory & {
  _count?: { blogs: number };
};

export class BlogMapper {
  static toSummaryDto(blog: PrismaBlogWithRelations): BlogSummaryDto {
    return {
      id: blog.id,
      title: blog.title,
      slug: blog.slug,
      excerpt: blog.excerpt,
      coverImage: blog.coverImage,
      status: blog.status,
      publishedAt: blog.publishedAt?.toISOString() ?? null,
      isFeatured: blog.isFeatured,
      category: blog.category
        ? {
            id: blog.category.id,
            name: blog.category.name,
            slug: blog.category.slug,
          }
        : null,
      tags: (blog.tags ?? []).map(({ tag }: { tag: PrismaBlogTag }) => ({
        id: tag.id,
        name: tag.name,
        slug: tag.slug,
      })),
      createdAt: blog.createdAt.toISOString(),
      updatedAt: blog.updatedAt.toISOString(),
    };
  }

  static toDetailDto(blog: PrismaBlogWithRelations): BlogDetailDto {
    return {
      ...BlogMapper.toSummaryDto(blog),
      content: blog.content,
      authorId: blog.authorId,
    };
  }

  static toCategoryDto(category: PrismaBlogCategoryWithCount): BlogCategoryDto {
    return {
      id: category.id,
      name: category.name,
      slug: category.slug,
      description: category.description,
      postCount: category._count?.blogs ?? 0,
    };
  }

  static toSummaryDtoList(blogs: PrismaBlogWithRelations[]): BlogSummaryDto[] {
    return blogs.map(BlogMapper.toSummaryDto);
  }
}