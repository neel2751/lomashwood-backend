import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ShowroomsController } from './showrooms.controller';
import { ShowroomsService } from './showrooms.service';
import { Showroom } from './entities/showroom.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Showroom])],
  controllers: [ShowroomsController],
  providers: [ShowroomsService],
  exports: [ShowroomsService],
})
export class ShowroomsModule {}
