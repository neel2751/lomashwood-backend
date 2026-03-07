import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MulterModule } from '@nestjs/platform-express';
import { UploadController } from './upload.controller';
import { UploadService } from './upload.service';
import { S3Provider } from './providers/s3.provider';
import { CloudinaryProvider } from './providers/cloudinary.provider';

@Module({
  imports: [
    ConfigModule,
    MulterModule.register({
      limits: {
        fileSize: 10 * 1024 * 1024, // 10MB
      },
    }),
  ],
  controllers: [UploadController],
  providers: [UploadService, S3Provider, CloudinaryProvider],
  exports: [UploadService],
})
export class UploadModule {}
