import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { S3Provider } from './providers/s3.provider';
import { CloudinaryProvider } from './providers/cloudinary.provider';
import { UploadFileDto } from './dto/upload-file.dto';

@Injectable()
export class UploadService {
  constructor(
    private readonly configService: ConfigService,
    private readonly s3Provider: S3Provider,
    private readonly cloudinaryProvider: CloudinaryProvider,
  ) {}

  async uploadFile(file: Express.Multer.File, uploadDto: UploadFileDto) {
    const { provider = 's3', folder, tags } = uploadDto;

    switch (provider) {
      case 's3':
        return this.s3Provider.uploadFile(file, { folder, tags });
      case 'cloudinary':
        return this.cloudinaryProvider.uploadFile(file, { folder, tags });
      default:
        throw new Error(`Unsupported provider: ${provider}`);
    }
  }

  async uploadFiles(files: Express.Multer.File[], uploadDto: UploadFileDto) {
    const results = [];

    for (const file of files) {
      try {
        const result = await this.uploadFile(file, uploadDto);
        results.push({ success: true, file: result });
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        results.push({ success: false, error: message, filename: file.originalname });
      }
    }

    return {
      results,
      total: files.length,
      successful: results.filter(r => r.success).length,
      failed: results.filter(r => !r.success).length,
    };
  }

  async getPresignedUrl(filename: string, contentType: string) {
    const provider = this.configService.get<string>('UPLOAD_PROVIDER') || 's3';

    switch (provider) {
      case 's3':
        return this.s3Provider.getPresignedUrl(filename, contentType);
      case 'cloudinary':
        return this.cloudinaryProvider.getPresignedUrl(filename, contentType);
      default:
        throw new Error(`Unsupported provider: ${provider}`);
    }
  }

  async getFiles(query: any) {
    const { page = 1, limit = 20, provider, folder } = query;

    return {
      files: [
        {
          id: 'file_1',
          filename: 'example.jpg',
          url: 'https://example.com/file.jpg',
          size: 1024000,
          contentType: 'image/jpeg',
          provider: 's3',
          folder: 'uploads',
          uploadedAt: new Date(),
        },
      ],
      total: 1,
      page: parseInt(page),
      limit: parseInt(limit),
    };
  }

  async getFile(id: string) {
    return {
      id,
      filename: 'example.jpg',
      url: 'https://example.com/file.jpg',
      size: 1024000,
      contentType: 'image/jpeg',
      provider: 's3',
      folder: 'uploads',
      uploadedAt: new Date(),
      metadata: {},
    };
  }

  async deleteFile(id: string) {
    return {
      success: true,
      id,
      deletedAt: new Date(),
    };
  }

  async transformFile(id: string, transformDto: any) {
    const { format, quality, resize } = transformDto;

    return {
      id,
      originalUrl: 'https://example.com/file.jpg',
      transformedUrl: 'https://example.com/file_transformed.jpg',
      transform: { format, quality, resize },
      transformedAt: new Date(),
    };
  }

  async getStats() {
    return {
      totalFiles: 1000,
      totalSize: 1024000000,
      storageUsed: 512000000,
      storageLimit: 2048000000,
      providers: {
        s3: { files: 600, size: 600000000 },
        cloudinary: { files: 400, size: 400000000 },
      },
      fileTypes: {
        image: 400,
        document: 300,
        video: 200,
        other: 100,
      },
    };
  }
}