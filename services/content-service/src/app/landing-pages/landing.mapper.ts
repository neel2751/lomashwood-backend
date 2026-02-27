import { LandingPage } from './landing.types';

import { LandingPageDetailDto, LandingPageSummaryDto } from './landing.types';

export class LandingMapper {
  static toSummaryDto(page: LandingPage): LandingPageSummaryDto {
    return {
      id: page.id,
      slug: page.slug,
      title: page.title,
      headline: page.headline,
      subheadline: page.subheadline,
      coverImageUrl: page.coverImageUrl,
      status: page.status,
      publishedAt: page.publishedAt?.toISOString() ?? null,
      createdAt: page.createdAt.toISOString(),
      updatedAt: page.updatedAt.toISOString(),
    };
  }

  static toDetailDto(page: LandingPage): LandingPageDetailDto {
    return {
      ...LandingMapper.toSummaryDto(page),
      backgroundImageUrl: page.backgroundImageUrl,
      metaTitle: page.metaTitle,
      metaDescription: page.metaDescription,
      sections: page.sections,
    };
  }

  static toSummaryDtoList(pages: LandingPage[]): LandingPageSummaryDto[] {
    return pages.map(LandingMapper.toSummaryDto);
  }
}