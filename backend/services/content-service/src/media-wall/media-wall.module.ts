import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MediaWallController } from './media-wall.controller';
import { MediaWallService } from './media-wall.service';
import { MediaItem } from './entities/media-item.entity';

@Module({
  imports: [TypeOrmModule.forFeature([MediaItem])],
  controllers: [MediaWallController],
  providers: [MediaWallService],
  exports: [MediaWallService],
})
export class MediaWallModule {}
