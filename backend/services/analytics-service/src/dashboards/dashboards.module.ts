import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { DashboardsController } from './dashboards.controller';
import { DashboardsService } from './dashboards.service';
import { AnalyticsDashboard } from './entities/analytics-dashboard.entity';
import { DashboardWidget } from './entities/dashboard-widget.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([AnalyticsDashboard, DashboardWidget]),
    ConfigModule,
  ],
  controllers: [DashboardsController],
  providers: [DashboardsService],
  exports: [DashboardsService],
})
export class DashboardsModule {}
