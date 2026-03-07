import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse as SwaggerApiResponse } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/common/decorators/roles.decorator';
import { CurrentUser } from '../auth/common/decorators/current-user.decorator';
import { TemplatesService } from './templates.service';
import { CreateTemplateDto } from './dto/create-template.dto';
import { UpdateTemplateDto } from './dto/update-template.dto';
import { ApiResponse } from '../../../../packages/api-client/src/types/api.types';

@ApiTags('templates')
@Controller('templates')
@UseGuards(JwtAuthGuard)
export class TemplatesController {
  constructor(private readonly templatesService: TemplatesService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new notification template' })
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'STAFF')
  @SwaggerApiResponse({ status: 201, description: 'Template created successfully' })
  async createTemplate(@Body() createTemplateDto: CreateTemplateDto): Promise<ApiResponse<any>> {
    const result = await this.templatesService.createTemplate(createTemplateDto);
    return {
      success: true,
      data: result,
    };
  }

  @Get()
  @ApiOperation({ summary: 'Get all notification templates' })
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'STAFF')
  @SwaggerApiResponse({ status: 200, description: 'Templates retrieved successfully' })
  async getTemplates(@Query() query: any): Promise<ApiResponse<any>> {
    const result = await this.templatesService.getTemplates(query);
    return {
      success: true,
      data: result,
    };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get template by ID' })
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'STAFF')
  @SwaggerApiResponse({ status: 200, description: 'Template retrieved successfully' })
  async getTemplateById(@Param('id') id: string): Promise<ApiResponse<any>> {
    const result = await this.templatesService.getTemplateById(id);
    return {
      success: true,
      data: result,
    };
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update template' })
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'STAFF')
  @SwaggerApiResponse({ status: 200, description: 'Template updated successfully' })
  async updateTemplate(@Param('id') id: string, @Body() updateTemplateDto: UpdateTemplateDto): Promise<ApiResponse<any>> {
    const result = await this.templatesService.updateTemplate(id, updateTemplateDto);
    return {
      success: true,
      data: result,
    };
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete template' })
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'STAFF')
  @SwaggerApiResponse({ status: 200, description: 'Template deleted successfully' })
  async deleteTemplate(@Param('id') id: string): Promise<ApiResponse<any>> {
    const result = await this.templatesService.deleteTemplate(id);
    return {
      success: true,
      data: result,
    };
  }

  @Get(':id/preview')
  @ApiOperation({ summary: 'Preview template with sample data' })
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'STAFF')
  @SwaggerApiResponse({ status: 200, description: 'Template preview generated successfully' })
  async previewTemplate(@Param('id') id: string, @Body() data?: any): Promise<ApiResponse<any>> {
    const result = await this.templatesService.previewTemplate(id, data);
    return {
      success: true,
      data: result,
    };
  }

  @Post(':id/send-test')
  @ApiOperation({ summary: 'Send test notification using template' })
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'STAFF')
  @SwaggerApiResponse({ status: 200, description: 'Test notification sent successfully' })
  async sendTestNotification(@Param('id') id: string, @Body() testDto: { recipient: string; data?: any; type?: string }): Promise<ApiResponse<any>> {
    const result = await this.templatesService.sendTestNotification(id, testDto.recipient, testDto.data, testDto.type);
    return {
      success: true,
      data: result,
    };
  }

  @Get('categories')
  @ApiOperation({ summary: 'Get template categories' })
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'STAFF')
  @SwaggerApiResponse({ status: 200, description: 'Template categories retrieved successfully' })
  async getTemplateCategories(): Promise<ApiResponse<any>> {
    const result = await this.templatesService.getTemplateCategories();
    return {
      success: true,
      data: result,
    };
  }

  @Get('types')
  @ApiOperation({ summary: 'Get template types' })
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'STAFF')
  @SwaggerApiResponse({ status: 200, description: 'Template types retrieved successfully' })
  async getTemplateTypes(): Promise<ApiResponse<any>> {
    const result = await this.templatesService.getTemplateTypes();
    return {
      success: true,
      data: result,
    };
  }

  @Get('variables')
  @ApiOperation({ summary: 'Get available template variables' })
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'STAFF')
  @SwaggerApiResponse({ status: 200, description: 'Template variables retrieved successfully' })
  async getTemplateVariables(): Promise<ApiResponse<any>> {
    const result = await this.templatesService.getTemplateVariables();
    return {
      success: true,
      data: result,
    };
  }

  @Post(':id/clone')
  @ApiOperation({ summary: 'Clone template' })
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'STAFF')
  @SwaggerApiResponse({ status: 201, description: 'Template cloned successfully' })
  async cloneTemplate(@Param('id') id: string, @Body() cloneDto: { name: string; description?: string }): Promise<ApiResponse<any>> {
    const result = await this.templatesService.cloneTemplate(id, cloneDto.name, cloneDto.description);
    return {
      success: true,
      data: result,
    };
  }

  @Post(':id/duplicate')
  @ApiOperation({ summary: 'Duplicate template' })
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'STAFF')
  @SwaggerApiResponse({ status: 201, description: 'Template duplicated successfully' })
  async duplicateTemplate(@Param('id') id: string): Promise<ApiResponse<any>> {
    const result = await this.templatesService.duplicateTemplate(id);
    return {
      success: true,
      data: result,
    };
  }

  @Post(':id/export')
  @ApiOperation({ summary: 'Export template' })
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'STAFF')
  @SwaggerApiResponse({ status: 200, description: 'Template exported successfully' })
  async exportTemplate(@Param('id') id: string, @Body() exportDto: { format?: string }): Promise<ApiResponse<any>> {
    const result = await this.templatesService.exportTemplate(id, exportDto.format);
    return {
      success: true,
      data: result,
    };
  }

  @Post('import')
  @ApiOperation({ summary: 'Import template' })
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'STAFF')
  @SwaggerApiResponse({ status: 201, description: 'Template imported successfully' })
  async importTemplate(@Body() importDto: { template: any; format?: string }): Promise<ApiResponse<any>> {
    const result = await this.templatesService.importTemplate(importDto.template, importDto.format);
    return {
      success: true,
      data: result,
    };
  }

  @Post('bulk-import')
  @ApiOperation({ summary: 'Bulk import templates' })
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'STAFF')
  @SwaggerApiResponse({ status: 201, description: 'Templates imported successfully' })
  async bulkImportTemplates(@Body() bulkImportDto: { templates: any[]; format?: string }): Promise<ApiResponse<any>> {
    const result = await this.templatesService.bulkImportTemplates(bulkImportDto.templates, bulkImportDto.format);
    return {
      success: true,
      data: result,
    };
  }

  @Post('bulk-export')
  @ApiOperation({ summary: 'Bulk export templates' })
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'STAFF')
  @SwaggerApiResponse({ status: 200, description: 'Templates exported successfully' })
  async bulkExportTemplates(@Body() bulkExportDto: { templateIds: string[]; format?: string }): Promise<ApiResponse<any>> {
    const result = await this.templatesService.bulkExportTemplates(bulkExportDto.templateIds, bulkExportDto.format);
    return {
      success: true,
      data: result,
    };
  }

  @Post(':id/validate')
  @ApiOperation({ summary: 'Validate template' })
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'STAFF')
  @SwaggerApiResponse({ status: 200, description: 'Template validated successfully' })
  async validateTemplate(@Param('id') id: string): Promise<ApiResponse<any>> {
    const result = await this.templatesService.validateTemplate(id);
    return {
      success: true,
      data: result,
    };
  }

  @Post(':id/compile')
  @ApiOperation({ summary: 'Compile template' })
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'STAFF')
  @SwaggerApiResponse({ status: 200, description: 'Template compiled successfully' })
  async compileTemplate(@Param('id') id: string, @Body() data?: any): Promise<ApiResponse<any>> {
    const result = await this.templatesService.compileTemplate(id, data);
    return {
      success: true,
      data: result,
    };
  }

  @Get(':id/versions')
  @ApiOperation({ summary: 'Get template versions' })
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'STAFF')
  @SwaggerApiResponse({ status: 200, description: 'Template versions retrieved successfully' })
  async getTemplateVersions(@Param('id') id: string): Promise<ApiResponse<any>> {
    const result = await this.templatesService.getTemplateVersions(id);
    return {
      success: true,
      data: result,
    };
  }

  @Post(':id/versions')
  @ApiOperation({ summary: 'Create template version' })
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'STAFF')
  @SwaggerApiResponse({ status: 201, description: 'Template version created successfully' })
  async createTemplateVersion(@Param('id') id: string, @Body() versionDto: { version: string; changes?: string }): Promise<ApiResponse<any>> {
    const result = await this.templatesService.createTemplateVersion(id, versionDto.version, versionDto.changes);
    return {
      success: true,
      data: result,
    };
  }

  @Put(':id/versions/:version')
  @ApiOperation({ summary: 'Update template version' })
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'STAFF')
  @SwaggerApiResponse({ status: 200, description: 'Template version updated successfully' })
  async updateTemplateVersion(@Param('id') id: string, @Param('version') version: string, @Body() updateDto: any): Promise<ApiResponse<any>> {
    const result = await this.templatesService.updateTemplateVersion(id, version, updateDto);
    return {
      success: true,
      data: result,
    };
  }

  @Delete(':id/versions/:version')
  @ApiOperation({ summary: 'Delete template version' })
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'STAFF')
  @SwaggerApiResponse({ status: 200, description: 'Template version deleted successfully' })
  async deleteTemplateVersion(@Param('id') id: string, @Param('version') version: string): Promise<ApiResponse<any>> {
    const result = await this.templatesService.deleteTemplateVersion(id, version);
    return {
      success: true,
      data: result,
    };
  }

  @Post(':id/versions/:version/restore')
  @ApiOperation({ summary: 'Restore template version' })
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'STAFF')
  @SwaggerApiResponse({ status: 200, description: 'Template version restored successfully' })
  async restoreTemplateVersion(@Param('id') id: string, @Param('version') version: string): Promise<ApiResponse<any>> {
    const result = await this.templatesService.restoreTemplateVersion(id, version);
    return {
      success: true,
      data: result,
    };
  }

  @Get(':id/analytics')
  @ApiOperation({ summary: 'Get template analytics' })
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'STAFF')
  @SwaggerApiResponse({ status: 200, description: 'Template analytics retrieved successfully' })
  async getTemplateAnalytics(@Param('id') id: string, @Query() query: any): Promise<ApiResponse<any>> {
    const result = await this.templatesService.getTemplateAnalytics(id, query);
    return {
      success: true,
      data: result,
    };
  }

  @Get(':id/stats')
  @ApiOperation({ summary: 'Get template statistics' })
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'STAFF')
  @SwaggerApiResponse({ status: 200, description: 'Template statistics retrieved successfully' })
  async getTemplateStats(@Param('id') id: string, @Query() query: any): Promise<ApiResponse<any>> {
    const result = await this.templatesService.getTemplateStats(id, query);
    return {
      success: true,
      data: result,
    };
  }

  @Get(':id/usage')
  @ApiOperation({ summary: 'Get template usage history' })
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'STAFF')
  @SwaggerApiResponse({ status: 200, description: 'Template usage history retrieved successfully' })
  async getTemplateUsage(@Param('id') id: string, @Query() query: any): Promise<ApiResponse<any>> {
    const result = await this.templatesService.getTemplateUsage(id, query);
    return {
      success: true,
      data: result,
    };
  }

  @Get(':id/performance')
  @ApiOperation({ summary: 'Get template performance metrics' })
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'STAFF')
  @SwaggerApiResponse({ status: 200, description: 'Template performance metrics retrieved successfully' })
  async getTemplatePerformance(@Param('id') id: string, @Query() query: any): Promise<ApiResponse<any>> {
    const result = await this.templatesService.getTemplatePerformance(id, query);
    return {
      success: true,
      data: result,
    };
  }

  @Post(':id/favorite')
  @ApiOperation({ summary: 'Mark template as favorite' })
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'STAFF')
  @SwaggerApiResponse({ status: 200, description: 'Template marked as favorite successfully' })
  async markTemplateAsFavorite(@Param('id') id: string): Promise<ApiResponse<any>> {
    const result = await this.templatesService.markTemplateAsFavorite(id);
    return {
      success: true,
      data: result,
    };
  }

  @Delete(':id/favorite')
  @ApiOperation({ summary: 'Unmark template as favorite' })
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'STAFF')
  @SwaggerApiResponse({ status: 200, description: 'Template unmarked as favorite successfully' })
  async unmarkTemplateAsFavorite(@Param('id') id: string): Promise<ApiResponse<any>> {
    const result = await this.templatesService.unmarkTemplateAsFavorite(id);
    return {
      success: true,
      data: result,
    };
  }

  @Get('favorites')
  @ApiOperation({ summary: 'Get favorite templates' })
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'STAFF')
  @SwaggerApiResponse({ status: 200, description: 'Favorite templates retrieved successfully' })
  async getFavoriteTemplates(@Query() query: any): Promise<ApiResponse<any>> {
    const result = await this.templatesService.getFavoriteTemplates(query);
    return {
      success: true,
      data: result,
    };
  }

  @Post(':id/archive')
  @ApiOperation({ summary: 'Archive template' })
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'STAFF')
  @SwaggerApiResponse({ status: 200, description: 'Template archived successfully' })
  async archiveTemplate(@Param('id') id: string): Promise<ApiResponse<any>> {
    const result = await this.templatesService.archiveTemplate(id);
    return {
      success: true,
      data: result,
    };
  }

  @Post(':id/unarchive')
  @ApiOperation({ summary: 'Unarchive template' })
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'STAFF')
  @SwaggerApiResponse({ status: 200, description: 'Template unarchived successfully' })
  async unarchiveTemplate(@Param('id') id: string): Promise<ApiResponse<any>> {
    const result = await this.templatesService.unarchiveTemplate(id);
    return {
      success: true,
      data: result,
    };
  }

  @Get('archived')
  @ApiOperation({ summary: 'Get archived templates' })
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'STAFF')
  @SwaggerApiResponse({ status: 200, description: 'Archived templates retrieved successfully' })
  async getArchivedTemplates(@Query() query: any): Promise<ApiResponse<any>> {
    const result = await this.templatesService.getArchivedTemplates(query);
    return {
      success: true,
      data: result,
    };
  }

  @Post(':id/publish')
  @ApiOperation({ summary: 'Publish template' })
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'STAFF')
  @SwaggerApiResponse({ status: 200, description: 'Template published successfully' })
  async publishTemplate(@Param('id') id: string): Promise<ApiResponse<any>> {
    const result = await this.templatesService.publishTemplate(id);
    return {
      success: true,
      data: result,
    };
  }

  @Post(':id/unpublish')
  @ApiOperation({ summary: 'Unpublish template' })
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'STAFF')
  @SwaggerApiResponse({ status: 200, description: 'Template unpublished successfully' })
  async unpublishTemplate(@Param('id') id: string): Promise<ApiResponse<any>> {
    const result = await this.templatesService.unpublishTemplate(id);
    return {
      success: true,
      data: result,
    };
  }

  @Get('published')
  @ApiOperation({ summary: 'Get published templates' })
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'STAFF')
  @SwaggerApiResponse({ status: 200, description: 'Published templates retrieved successfully' })
  async getPublishedTemplates(@Query() query: any): Promise<ApiResponse<any>> {
    const result = await this.templatesService.getPublishedTemplates(query);
    return {
      success: true,
      data: result,
    };
  }

  @Post(':id/approve')
  @ApiOperation({ summary: 'Approve template' })
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'STAFF')
  @SwaggerApiResponse({ status: 200, description: 'Template approved successfully' })
  async approveTemplate(@Param('id') id: string, @Body() approvalDto: { approvedBy: string; notes?: string }): Promise<ApiResponse<any>> {
    const result = await this.templatesService.approveTemplate(id, approvalDto.approvedBy, approvalDto.notes);
    return {
      success: true,
      data: result,
    };
  }

  @Post(':id/reject')
  @ApiOperation({ summary: 'Reject template' })
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'STAFF')
  @SwaggerApiResponse({ status: 200, description: 'Template rejected successfully' })
  async rejectTemplate(@Param('id') id: string, @Body() rejectionDto: { rejectedBy: string; reason: string }): Promise<ApiResponse<any>> {
    const result = await this.templatesService.rejectTemplate(id, rejectionDto.rejectedBy, rejectionDto.reason);
    return {
      success: true,
      data: result,
    };
  }

  @Get('pending-approval')
  @ApiOperation({ summary: 'Get templates pending approval' })
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'STAFF')
  @SwaggerApiResponse({ status: 200, description: 'Templates pending approval retrieved successfully' })
  async getTemplatesPendingApproval(@Query() query: any): Promise<ApiResponse<any>> {
    const result = await this.templatesService.getTemplatesPendingApproval(query);
    return {
      success: true,
      data: result,
    };
  }

  @Post(':id/share')
  @ApiOperation({ summary: 'Share template' })
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'STAFF')
  @SwaggerApiResponse({ status: 200, description: 'Template shared successfully' })
  async shareTemplate(@Param('id') id: string, @Body() shareDto: { users: string[]; permissions?: string[] }): Promise<ApiResponse<any>> {
    const result = await this.templatesService.shareTemplate(id, shareDto.users, shareDto.permissions);
    return {
      success: true,
      data: result,
    };
  }

  @Delete(':id/share/:userId')
  @ApiOperation({ summary: 'Unshare template' })
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'STAFF')
  @SwaggerApiResponse({ status: 200, description: 'Template unshared successfully' })
  async unshareTemplate(@Param('id') id: string, @Param('userId') userId: string): Promise<ApiResponse<any>> {
    const result = await this.templatesService.unshareTemplate(id, userId);
    return {
      success: true,
      data: result,
    };
  }

  @Get(':id/shared')
  @ApiOperation({ summary: 'Get shared template users' })
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'STAFF')
  @SwaggerApiResponse({ status: 200, description: 'Shared template users retrieved successfully' })
  async getSharedTemplateUsers(@Param('id') id: string): Promise<ApiResponse<any>> {
    const result = await this.templatesService.getSharedTemplateUsers(id);
    return {
      success: true,
      data: result,
    };
  }

  @Get('shared-with-me')
  @ApiOperation({ summary: 'Get templates shared with current user' })
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'STAFF')
  @SwaggerApiResponse({ status: 200, description: 'Templates shared with current user retrieved successfully' })
  async getTemplatesSharedWithMe(@Query() query: any): Promise<ApiResponse<any>> {
    const result = await this.templatesService.getTemplatesSharedWithMe(query);
    return {
      success: true,
      data: result,
    };
  }

  @Post(':id/lock')
  @ApiOperation({ summary: 'Lock template for editing' })
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'STAFF')
  @SwaggerApiResponse({ status: 200, description: 'Template locked successfully' })
  async lockTemplate(@Param('id') id: string, @Body() lockDto: { lockedBy: string; reason?: string }): Promise<ApiResponse<any>> {
    const result = await this.templatesService.lockTemplate(id, lockDto.lockedBy, lockDto.reason);
    return {
      success: true,
      data: result,
    };
  }

  @Post(':id/unlock')
  @ApiOperation({ summary: 'Unlock template' })
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'STAFF')
  @SwaggerApiResponse({ status: 200, description: 'Template unlocked successfully' })
  async unlockTemplate(@Param('id') id: string, @Body() unlockDto: { unlockedBy: string }): Promise<ApiResponse<any>> {
    const result = await this.templatesService.unlockTemplate(id, unlockDto.unlockedBy);
    return {
      success: true,
      data: result,
    };
  }

  @Get(':id/lock-status')
  @ApiOperation({ summary: 'Get template lock status' })
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'STAFF')
  @SwaggerApiResponse({ status: 200, description: 'Template lock status retrieved successfully' })
  async getTemplateLockStatus(@Param('id') id: string): Promise<ApiResponse<any>> {
    const result = await this.templatesService.getTemplateLockStatus(id);
    return {
      success: true,
      data: result,
    };
  }

  @Get('locked')
  @ApiOperation({ summary: 'Get locked templates' })
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'STAFF')
  @SwaggerApiResponse({ status: 200, description: 'Locked templates retrieved successfully' })
  async getLockedTemplates(@Query() query: any): Promise<ApiResponse<any>> {
    const result = await this.templatesService.getLockedTemplates(query);
    return {
      success: true,
      data: result,
    };
  }

  @Post(':id/tag')
  @ApiOperation({ summary: 'Add tag to template' })
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'STAFF')
  @SwaggerApiResponse({ status: 200, description: 'Tag added to template successfully' })
  async addTagToTemplate(@Param('id') id: string, @Body() tagDto: { tag: string }): Promise<ApiResponse<any>> {
    const result = await this.templatesService.addTagToTemplate(id, tagDto.tag);
    return {
      success: true,
      data: result,
    };
  }

  @Delete(':id/tag/:tag')
  @ApiOperation({ summary: 'Remove tag from template' })
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'STAFF')
  @SwaggerApiResponse({ status: 200, description: 'Tag removed from template successfully' })
  async removeTagFromTemplate(@Param('id') id: string, @Param('tag') tag: string): Promise<ApiResponse<any>> {
    const result = await this.templatesService.removeTagFromTemplate(id, tag);
    return {
      success: true,
      data: result,
    };
  }

  @Get('tags')
  @ApiOperation({ summary: 'Get all template tags' })
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'STAFF')
  @SwaggerApiResponse({ status: 200, description: 'Template tags retrieved successfully' })
  async getTemplateTags(): Promise<ApiResponse<any>> {
    const result = await this.templatesService.getTemplateTags();
    return {
      success: true,
      data: result,
    };
  }

  @Get('tag/:tag')
  @ApiOperation({ summary: 'Get templates by tag' })
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'STAFF')
  @SwaggerApiResponse({ status: 200, description: 'Templates by tag retrieved successfully' })
  async getTemplatesByTag(@Param('tag') tag: string, @Query() query: any): Promise<ApiResponse<any>> {
    const result = await this.templatesService.getTemplatesByTag(tag, query);
    return {
      success: true,
      data: result,
    };
  }

  @Post(':id/comment')
  @ApiOperation({ summary: 'Add comment to template' })
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'STAFF')
  @SwaggerApiResponse({ status: 201, description: 'Comment added to template successfully' })
  async addCommentToTemplate(@Param('id') id: string, @Body() commentDto: { comment: string; userId: string }): Promise<ApiResponse<any>> {
    const result = await this.templatesService.addCommentToTemplate(id, commentDto.comment, commentDto.userId);
    return {
      success: true,
      data: result,
    };
  }

  @Get(':id/comments')
  @ApiOperation({ summary: 'Get template comments' })
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'STAFF')
  @SwaggerApiResponse({ status: 200, description: 'Template comments retrieved successfully' })
  async getTemplateComments(@Param('id') id: string): Promise<ApiResponse<any>> {
    const result = await this.templatesService.getTemplateComments(id);
    return {
      success: true,
      data: result,
    };
  }

  @Delete(':id/comment/:commentId')
  @ApiOperation({ summary: 'Delete template comment' })
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'STAFF')
  @SwaggerApiResponse({ status: 200, description: 'Template comment deleted successfully' })
  async deleteTemplateComment(@Param('id') id: string, @Param('commentId') commentId: string): Promise<ApiResponse<any>> {
    const result = await this.templatesService.deleteTemplateComment(id, commentId);
    return {
      success: true,
      data: result,
    };
  }

  @Post('search')
  @ApiOperation({ summary: 'Search templates' })
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'STAFF')
  @SwaggerApiResponse({ status: 200, description: 'Templates searched successfully' })
  async searchTemplates(@Body() searchDto: { query: string; filters?: any }): Promise<ApiResponse<any>> {
    const result = await this.templatesService.searchTemplates(searchDto.query, searchDto.filters);
    return {
      success: true,
      data: result,
    };
  }

  @Get('recent')
  @ApiOperation({ summary: 'Get recently used templates' })
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'STAFF')
  @SwaggerApiResponse({ status: 200, description: 'Recently used templates retrieved successfully' })
  async getRecentlyUsedTemplates(@Query() query: any): Promise<ApiResponse<any>> {
    const result = await this.templatesService.getRecentlyUsedTemplates(query);
    return {
      success: true,
      data: result,
    };
  }

  @Get('popular')
  @ApiOperation({ summary: 'Get popular templates' })
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'STAFF')
  @SwaggerApiResponse({ status: 200, description: 'Popular templates retrieved successfully' })
  async getPopularTemplates(@Query() query: any): Promise<ApiResponse<any>> {
    const result = await this.templatesService.getPopularTemplates(query);
    return {
      success: true,
      data: result,
    };
  }

  @Get('trending')
  @ApiOperation({ summary: 'Get trending templates' })
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'STAFF')
  @SwaggerApiResponse({ status: 200, description: 'Trending templates retrieved successfully' })
  async getTrendingTemplates(@Query() query: any): Promise<ApiResponse<any>> {
    const result = await this.templatesService.getTrendingTemplates(query);
    return {
      success: true,
      data: result,
    };
  }

  @Get('recommended')
  @ApiOperation({ summary: 'Get recommended templates' })
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'STAFF')
  @SwaggerApiResponse({ status: 200, description: 'Recommended templates retrieved successfully' })
  async getRecommendedTemplates(@Query() query: any): Promise<ApiResponse<any>> {
    const result = await this.templatesService.getRecommendedTemplates(query);
    return {
      success: true,
      data: result,
    };
  }

  @Get('suggestions')
  @ApiOperation({ summary: 'Get template suggestions' })
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'STAFF')
  @SwaggerApiResponse({ status: 200, description: 'Template suggestions retrieved successfully' })
  async getTemplateSuggestions(@Query() query: any): Promise<ApiResponse<any>> {
    const result = await this.templatesService.getTemplateSuggestions(query);
    return {
      success: true,
      data: result,
    };
  }

  @Post('bulk-operations')
  @ApiOperation({ summary: 'Perform bulk operations on templates' })
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'STAFF')
  @SwaggerApiResponse({ status: 200, description: 'Bulk operations completed successfully' })
  async bulkOperations(@Body() bulkDto: { operation: string; templateIds: string[]; data?: any }): Promise<ApiResponse<any>> {
    const result = await this.templatesService.bulkOperations(bulkDto.operation, bulkDto.templateIds, bulkDto.data);
    return {
      success: true,
      data: result,
    };
  }

  @Get('statistics')
  @ApiOperation({ summary: 'Get overall template statistics' })
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'STAFF')
  @SwaggerApiResponse({ status: 200, description: 'Template statistics retrieved successfully' })
  async getTemplateStatistics(@Query() query: any): Promise<ApiResponse<any>> {
    const result = await this.templatesService.getTemplateStatistics(query);
    return {
      success: true,
      data: result,
    };
  }

  @Get('health')
  @ApiOperation({ summary: 'Get templates service health status' })
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'STAFF')
  @SwaggerApiResponse({ status: 200, description: 'Templates service health status retrieved successfully' })
  async getTemplatesServiceHealth(): Promise<ApiResponse<any>> {
    const result = await this.templatesService.getTemplatesServiceHealth();
    return {
      success: true,
      data: result,
    };
  }
}
