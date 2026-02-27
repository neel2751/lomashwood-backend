import { MediaWall as PrismaMediaWall } from '@prisma/client';

import { MediaWallDto } from './media.types';

export class MediaMapper {
  static toDto(media: PrismaMediaWall): MediaWallDto {
    return {
      id: media.id,
      title: media.title,
      description: media.description,
      mediaType: media.mediaType,
      mediaUrl: media.mediaUrl,
      backgroundImage: media.backgroundImage,
      ctaText: media.ctaText,
      ctaUrl: media.ctaUrl,
      sortOrder: media.sortOrder,
      isActive: media.isActive,
      createdAt: media.createdAt.toISOString(),
      updatedAt: media.updatedAt.toISOString(),
    };
  }

  static toDtoList(mediaList: PrismaMediaWall[]): MediaWallDto[] {
    return mediaList.map(MediaMapper.toDto);
  }
}