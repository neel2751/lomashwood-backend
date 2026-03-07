import { Controller, Get, Post, Body, Param, Query, Res, Delete } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { Response } from 'express';
import { ExportsService } from './exports.service';
import { ExportReportDto } from './dto/export-report.dto';

@ApiTags('exports')
@Controller('exports')
export class ExportsController {
  constructor(private readonly exportsService: ExportsService) {}

  @Post('report')
  @ApiOperation({ summary: 'Export analytics report' })
  async exportReport(@Body() exportReportDto: ExportReportDto, @Res() res: Response) {
    const result = await this.exportsService.exportReport(exportReportDto);
    
    res.setHeader('Content-Type', result.contentType);
    res.setHeader('Content-Disposition', `attachment; filename="${result.filename}"`);
    res.send(result.data);
  }

  @Get('formats')
  @ApiOperation({ summary: 'Get available export formats' })
  async getExportFormats() {
    return this.exportsService.getExportFormats();
  }

  @Get('templates')
  @ApiOperation({ summary: 'Get export templates' })
  async getExportTemplates(@Query() query: any) {
    return this.exportsService.getExportTemplates(query);
  }

  @Post('template')
  @ApiOperation({ summary: 'Create export template' })
  async createExportTemplate(@Body() templateDto: any) {
    return this.exportsService.createExportTemplate(templateDto);
  }

  @Get('history')
  @ApiOperation({ summary: 'Get export history' })
  async getExportHistory(@Query() query: any) {
    return this.exportsService.getExportHistory(query);
  }

  @Get('download/:id')
  @ApiOperation({ summary: 'Download exported file' })
  async downloadExport(@Param('id') id: string, @Res() res: Response) {
    const result = await this.exportsService.downloadExport(id);
    
    res.setHeader('Content-Type', result.contentType);
    res.setHeader('Content-Disposition', `attachment; filename="${result.filename}"`);
    res.send(result.data);
  }

  @Post('schedule')
  @ApiOperation({ summary: 'Schedule recurring export' })
  async scheduleExport(@Body() scheduleDto: any) {
    return this.exportsService.scheduleExport(scheduleDto);
  }

  @Get('schedule')
  @ApiOperation({ summary: 'Get scheduled exports' })
  async getScheduledExports(@Query() query: any) {
    return this.exportsService.getScheduledExports(query);
  }

  @Delete('schedule/:id')
  @ApiOperation({ summary: 'Cancel scheduled export' })
  async cancelScheduledExport(@Param('id') id: string) {
    return this.exportsService.cancelScheduledExport(id);
  }
}
