import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConsultantsController } from './consultants.controller';
import { ConsultantsService } from './consultants.service';
import { Consultant } from './entities/consultant.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Consultant])],
  controllers: [ConsultantsController],
  providers: [ConsultantsService],
  exports: [ConsultantsService],
})
export class ConsultantsModule {}
