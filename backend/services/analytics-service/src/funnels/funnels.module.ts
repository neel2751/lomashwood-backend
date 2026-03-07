import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { FunnelsController } from './funnels.controller';
import { FunnelsService } from './funnels.service';
import { Funnel } from './entities/funnel.entity';
import { FunnelStep } from './entities/funnel-step.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Funnel, FunnelStep]),
    ConfigModule,
  ],
  controllers: [FunnelsController],
  providers: [FunnelsService],
  exports: [FunnelsService],
})
export class FunnelsModule {}
