import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { v2 as cloudinary } from 'cloudinary';

@Injectable()
export class CloudinaryProvider {
  constructor(private readonly configService: ConfigService) {
    cloudinary.config({
      cloud_name: this.configService.get<string>('CLOUDINARY_CLOUD_NAME'),
      api_key: this.configService.get<string>('CLOUDINARY_API_KEY'),
      api_secret: this.configService.get<string>('CLOUDINARY_API_SECRET'),
    });
  }

  async uploadFile(file: Express.Multer.File, options: { folder?: string; tags?: string[] }) {
    const { folder = 'uploads', tags = [] } = options;
    
    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder,
          tags: tags.join(','),
          resource_type: this.getResourceType(file.mimetype),
        },
        (error, result) => {
          if (error) return reject(error);
          
          resolve({
            id: this.generateId(),
            filename: file.originalname,
            url: result.secure_url,
            publicId: result.public_id,
            size: file.size,
            contentType: file.mimetype,
            provider: 'cloudinary',
            folder,
            tags,
            uploadedAt: new Date(),
          });
        }
      );

      uploadStream.end(file.buffer);
    });
  }

  async getPresignedUrl(filename: string, contentType: string) {
    const timestamp = Math.round(Date.now() / 1000);
    const signature = cloudinary.utils.api_sign_request(
      { timestamp, public_id: filename },
      cloudinary.config().api_secret
    );

    const url = cloudinary.url(filename, {
      signature,
      timestamp,
      api_key: cloudinary.config().api_key,
    });

    return {
      url,
      publicId: filename,
      expires: new Date(Date.now() + 3600 * 1000),
    };
  }

  async deleteFile(publicId: string) {
    return new Promise((resolve, reject) => {
      cloudinary.uploader.destroy(publicId, (error, result) => {
        if (error) return reject(error);
        resolve({ success: true, publicId, result });
      });
    });
  }

  async transformFile(publicId: string, transformOptions: any) {
    const { format, quality, resize } = transformOptions;
    
    let transformation = {};
    
    if (resize) {
      transformation = { ...transformation, ...resize };
    }
    
    if (quality) {
      transformation = { ...transformation, quality };
    }
    
    if (format) {
      transformation = { ...transformation, format };
    }

    const transformedUrl = cloudinary.url(publicId, {
      transformation,
    });

    return {
      publicId,
      originalUrl: cloudinary.url(publicId),
      transformedUrl,
      transform: transformOptions,
      transformedAt: new Date(),
    };
  }

  private getResourceType(mimeType: string): string {
    if (mimeType.startsWith('image/')) return 'image';
    if (mimeType.startsWith('video/')) return 'video';
    if (mimeType.startsWith('audio/')) return 'auto';
    return 'auto';
  }

  private generateId(): string {
    return Math.random().toString(36).substr(2, 9);
  }
}
