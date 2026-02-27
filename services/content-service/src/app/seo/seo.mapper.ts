import { SeoMetaDto, SeoMetaEmbedDto } from './seo.types';

export class SeoMapper {
  static toDto(meta: any): SeoMetaDto {
    return {
      id: meta.id,
      pagePath: meta.pagePath,
      title: meta.title,
      description: meta.description,
      keywords: Array.isArray(meta.keywords) ? meta.keywords : [],
      ogTitle: meta.ogTitle,
      ogDescription: meta.ogDescription,
      ogImageUrl: meta.ogImageUrl,
      twitterTitle: meta.twitterTitle,
      twitterDescription: meta.twitterDescription,
      twitterImageUrl: meta.twitterImageUrl,
      canonicalUrl: meta.canonicalUrl,
      indexStatus: meta.indexStatus,
      structuredData: meta.structuredData,
      createdAt: meta.createdAt.toISOString(),
      updatedAt: meta.updatedAt.toISOString(),
    };
  }

  static toEmbedDto(meta: any | null): SeoMetaEmbedDto {
    return {
      title: meta?.title ?? null,
      description: meta?.description ?? null,
      ogTitle: meta?.ogTitle ?? null,
      ogDescription: meta?.ogDescription ?? null,
      ogImageUrl: meta?.ogImageUrl ?? null,
      canonicalUrl: meta?.canonicalUrl ?? null,
      twitterTitle: meta?.twitterTitle ?? null,
      twitterDescription: meta?.twitterDescription ?? null,
      twitterImageUrl: meta?.twitterImageUrl ?? null,
    };
  }

  static toDtoList(metas: any[]): SeoMetaDto[] {
    return metas.map((m) => SeoMapper.toDto(m));
  }
}