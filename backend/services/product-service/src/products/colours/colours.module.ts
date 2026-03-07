import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ColoursController } from './colours.controller';
import { ColoursService } from './colours.service';
import { Colour } from './entities/colour.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Colour])],
  controllers: [ColoursController],
  providers: [ColoursService],
  exports: [ColoursService],
})
export class ColoursModule {}
