import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CmsPagesController } from './cms-pages.controller';
import { CmsPagesService } from './cms-pages.service';
import { CmsPage } from './entities/cms-page.entity';

@Module({
  imports: [TypeOrmModule.forFeature([CmsPage])],
  controllers: [CmsPagesController],
  providers: [CmsPagesService],
  exports: [CmsPagesService],
})
export class CmsPagesModule {}
