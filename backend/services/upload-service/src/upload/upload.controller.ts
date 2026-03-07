import { Controller, Post, UseInterceptors, UploadedFile, Body, Query, Get, Delete, Param } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiConsumes } from '@nestjs/swagger';
import { UploadService } from './upload.service';
import { UploadFileDto } from './dto/upload-file.dto';

@ApiTags('upload')
@Controller('upload')
export class UploadController {
  constructor(private readonly uploadService: UploadService) {}

  @Post('file')
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Upload a file' })
  async uploadFile(@UploadedFile() file: Express.Multer.File, @Body() uploadDto: UploadFileDto) {
    return this.uploadService.uploadFile(file, uploadDto);
  }

  @Post('files')
  @UseInterceptors(FileInterceptor('files'))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Upload multiple files' })
  async uploadFiles(@UploadedFile() files: Express.Multer.File[], @Body() uploadDto: UploadFileDto) {
    return this.uploadService.uploadFiles(files, uploadDto);
  }

  @Get('presigned-url')
  @ApiOperation({ summary: 'Generate presigned URL for direct upload' })
  async getPresignedUrl(@Query() query: { filename: string; contentType: string }) {
    return this.uploadService.getPresignedUrl(query.filename, query.contentType);
  }

  @Get('files')
  @ApiOperation({ summary: 'Get uploaded files list' })
  async getFiles(@Query() query: any) {
    return this.uploadService.getFiles(query);
  }

  @Get('files/:id')
  @ApiOperation({ summary: 'Get file info' })
  async getFile(@Param('id') id: string) {
    return this.uploadService.getFile(id);
  }

  @Delete('files/:id')
  @ApiOperation({ summary: 'Delete file' })
  async deleteFile(@Param('id') id: string) {
    return this.uploadService.deleteFile(id);
  }

  @Post('files/:id/transform')
  @ApiOperation({ summary: 'Transform uploaded file' })
  async transformFile(@Param('id') id: string, @Body() transformDto: any) {
    return this.uploadService.transformFile(id, transformDto);
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get upload statistics' })
  async getStats() {
    return this.uploadService.getStats();
  }
}
