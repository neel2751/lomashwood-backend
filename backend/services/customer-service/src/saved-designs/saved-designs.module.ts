import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SavedDesignsController } from './saved-designs.controller';
import { SavedDesignsService } from './saved-designs.service';
import { SavedDesign } from './entities/saved-design.entity';

@Module({
  imports: [TypeOrmModule.forFeature([SavedDesign])],
  controllers: [SavedDesignsController],
  providers: [SavedDesignsService],
  exports: [SavedDesignsService],
})
export class SavedDesignsModule {}
