import { CmsPageDetailDto, CmsPageSummaryDto, PageStatus } from './page.types';

interface PrismaPage {
  id: string;
  slug: string;
  title: string | null;
  content: string;
  status: PageStatus;
  isSystem: boolean;
  publishedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export class PageMapper {
  static toSummaryDto(page: PrismaPage): CmsPageSummaryDto {
    return {
      id: page.id,
      slug: page.slug,
      title: page.title ?? '',
      status: page.status,
      isSystem: page.isSystem,
      publishedAt: page.publishedAt?.toISOString() ?? null,
      createdAt: page.createdAt.toISOString(),
      updatedAt: page.updatedAt.toISOString(),
    };
  }

  static toDetailDto(page: PrismaPage): CmsPageDetailDto {
    return {
      ...PageMapper.toSummaryDto(page),
      content: page.content,
    };
  }

  static toSummaryDtoList(pages: PrismaPage[]): CmsPageSummaryDto[] {
    return pages.map(PageMapper.toSummaryDto);
  }
}