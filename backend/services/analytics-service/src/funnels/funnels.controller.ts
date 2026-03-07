import { Controller, Get, Post, Put, Delete, Body, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { FunnelsService } from './funnels.service';
import { CreateFunnelDto } from './dto/create-funnel.dto';
import { UpdateFunnelDto } from './dto/update-funnel.dto';

@ApiTags('funnels')
@Controller('funnels')
export class FunnelsController {
  constructor(private readonly funnelsService: FunnelsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new funnel' })
  async createFunnel(@Body() createFunnelDto: CreateFunnelDto) {
    return this.funnelsService.createFunnel(createFunnelDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all funnels' })
  async getFunnels(@Query() query: any) {
    return this.funnelsService.getFunnels(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get funnel by ID' })
  async getFunnel(@Param('id') id: string) {
    return this.funnelsService.getFunnel(id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update funnel' })
  async updateFunnel(@Param('id') id: string, @Body() updateFunnelDto: UpdateFunnelDto) {
    return this.funnelsService.updateFunnel(id, updateFunnelDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete funnel' })
  async deleteFunnel(@Param('id') id: string) {
    return this.funnelsService.deleteFunnel(id);
  }

  @Get(':id/analytics')
  @ApiOperation({ summary: 'Get funnel analytics' })
  async getFunnelAnalytics(@Param('id') id: string, @Query() query: any) {
    return this.funnelsService.getFunnelAnalytics(id, query);
  }

  @Post(':id/steps')
  @ApiOperation({ summary: 'Add step to funnel' })
  async addFunnelStep(@Param('id') id: string, @Body() stepDto: any) {
    return this.funnelsService.addFunnelStep(id, stepDto);
  }

  @Put(':id/steps/:stepId')
  @ApiOperation({ summary: 'Update funnel step' })
  async updateFunnelStep(@Param('id') id: string, @Param('stepId') stepId: string, @Body() stepDto: any) {
    return this.funnelsService.updateFunnelStep(id, stepId, stepDto);
  }

  @Delete(':id/steps/:stepId')
  @ApiOperation({ summary: 'Remove funnel step' })
  async removeFunnelStep(@Param('id') id: string, @Param('stepId') stepId: string) {
    return this.funnelsService.removeFunnelStep(id, stepId);
  }
}
