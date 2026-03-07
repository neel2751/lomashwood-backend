import { Controller, Get, Post, Put, Delete, Body, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { DashboardsService } from './dashboards.service';
import { CreateDashboardDto } from './dto/create-dashboard.dto';
import { UpdateDashboardDto } from './dto/update-dashboard.dto';

@ApiTags('dashboards')
@Controller('dashboards')
export class DashboardsController {
  constructor(private readonly dashboardsService: DashboardsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new dashboard' })
  async createDashboard(@Body() createDashboardDto: CreateDashboardDto) {
    return this.dashboardsService.createDashboard(createDashboardDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all dashboards' })
  async getDashboards(@Query() query: any) {
    return this.dashboardsService.getDashboards(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get dashboard by ID' })
  async getDashboard(@Param('id') id: string) {
    return this.dashboardsService.getDashboard(id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update dashboard' })
  async updateDashboard(@Param('id') id: string, @Body() updateDashboardDto: UpdateDashboardDto) {
    return this.dashboardsService.updateDashboard(id, updateDashboardDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete dashboard' })
  async deleteDashboard(@Param('id') id: string) {
    return this.dashboardsService.deleteDashboard(id);
  }

  @Post(':id/widgets')
  @ApiOperation({ summary: 'Add widget to dashboard' })
  async addWidget(@Param('id') id: string, @Body() widgetDto: any) {
    return this.dashboardsService.addWidget(id, widgetDto);
  }

  @Put(':id/widgets/:widgetId')
  @ApiOperation({ summary: 'Update dashboard widget' })
  async updateWidget(@Param('id') id: string, @Param('widgetId') widgetId: string, @Body() widgetDto: any) {
    return this.dashboardsService.updateWidget(id, widgetId, widgetDto);
  }

  @Delete(':id/widgets/:widgetId')
  @ApiOperation({ summary: 'Remove widget from dashboard' })
  async removeWidget(@Param('id') id: string, @Param('widgetId') widgetId: string) {
    return this.dashboardsService.removeWidget(id, widgetId);
  }

  @Get(':id/data')
  @ApiOperation({ summary: 'Get dashboard data' })
  async getDashboardData(@Param('id') id: string, @Query() query: any) {
    return this.dashboardsService.getDashboardData(id, query);
  }

  @Post(':id/clone')
  @ApiOperation({ summary: 'Clone dashboard' })
  async cloneDashboard(@Param('id') id: string, @Body() cloneDto: { name: string }) {
    return this.dashboardsService.cloneDashboard(id, cloneDto.name);
  }

  @Post(':id/share')
  @ApiOperation({ summary: 'Share dashboard' })
  async shareDashboard(@Param('id') id: string, @Body() shareDto: { users: string[]; permissions: string[] }) {
    return this.dashboardsService.shareDashboard(id, shareDto.users, shareDto.permissions);
  }
}
