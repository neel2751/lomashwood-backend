import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as AWS from 'aws-sdk';

@Injectable()
export class S3Provider {
  private s3: AWS.S3;

  constructor(private readonly configService: ConfigService) {
    this.s3 = new AWS.S3({
      accessKeyId: this.configService.get<string>('AWS_ACCESS_KEY_ID'),
      secretAccessKey: this.configService.get<string>('AWS_SECRET_ACCESS_KEY'),
      region: this.configService.get<string>('AWS_REGION'),
    });
  }

  async uploadFile(file: Express.Multer.File, options: { folder?: string; tags?: string[] }) {
    const { folder = 'uploads', tags = [] } = options;
    const key = `${folder}/${Date.now()}-${file.originalname}`;
    
    const params = {
      Bucket: this.configService.get<string>('AWS_S3_BUCKET'),
      Key: key,
      Body: file.buffer,
      ContentType: file.mimetype,
      Metadata: {
        originalName: file.originalname,
        size: file.size.toString(),
        tags: tags.join(','),
      },
    };

    const result = await this.s3.upload(params).promise();
    
    return {
      id: this.generateId(),
      filename: file.originalname,
      url: result.Location,
      key,
      size: file.size,
      contentType: file.mimetype,
      provider: 's3',
      folder,
      tags,
      uploadedAt: new Date(),
    };
  }

  async getPresignedUrl(filename: string, contentType: string) {
    const key = `uploads/${filename}`;
    
    const params = {
      Bucket: this.configService.get<string>('AWS_S3_BUCKET'),
      Key: key,
      Expires: 3600,
      ContentType: contentType,
    };

    const url = await this.s3.getSignedUrlPromise('putObject', params);
    
    return {
      url,
      key,
      expires: new Date(Date.now() + 3600 * 1000),
    };
  }

  async deleteFile(key: string) {
    const params = {
      Bucket: this.configService.get<string>('AWS_S3_BUCKET'),
      Key: key,
    };

    await this.s3.deleteObject(params).promise();
    
    return { success: true, key };
  }

  async getFileUrl(key: string) {
    const params = {
      Bucket: this.configService.get<string>('AWS_S3_BUCKET'),
      Key: key,
      Expires: 3600,
    };

    const url = await this.s3.getSignedUrlPromise('getObject', params);
    
    return { url, expires: new Date(Date.now() + 3600 * 1000) };
  }

  private generateId(): string {
    return Math.random().toString(36).substr(2, 9);
  }
}
