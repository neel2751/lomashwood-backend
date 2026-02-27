/**
 * content-service/src/infrastructure/storage/s3.client.ts
 *
 * AWS S3 storage client for the Content Service.
 * Handles:
 *   - Blog post images and featured media
 *   - Media wall content (images/videos)
 *   - Page hero images and inline media
 *   - CMS uploads (logos, accreditations, banners)
 *   - Multipart uploads for large files
 *   - Presigned URLs for secure direct uploads
 */

import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  DeleteObjectsCommand,
  GetObjectCommand,
  HeadObjectCommand,
  CopyObjectCommand,
  ListObjectsV2Command,
  CreateMultipartUploadCommand,
  UploadPartCommand,
  CompleteMultipartUploadCommand,
  AbortMultipartUploadCommand,
  type PutObjectCommandInput,
  type DeleteObjectCommandInput,
  type GetObjectCommandInput,
  type HeadObjectCommandInput,
  type CopyObjectCommandInput,
  type CompletedPart,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { Upload } from '@aws-sdk/lib-storage';
import { Readable } from 'node:stream';
import { logger } from '../../config/logger';
import { envConfig } from '../../config/env';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
export interface UploadResult {
  key: string;
  url: string;
  bucket: string;
  etag?: string;
  versionId?: string;
  size?: number;
}

export interface UploadOptions {
  key?: string;
  bucket?: string;
  contentType?: string;
  metadata?: Record<string, string>;
  acl?: 'private' | 'public-read' | 'public-read-write';
  cacheControl?: string;
  serverSideEncryption?: 'AES256' | 'aws:kms';
  storageClass?: 'STANDARD' | 'INTELLIGENT_TIERING' | 'GLACIER';
}

export interface MultipartUploadPart {
  partNumber: number;
  etag: string;
}

export interface PresignedUrlOptions {
  expiresIn?: number; // seconds
  contentType?: string;
  metadata?: Record<string, string>;
}

// ---------------------------------------------------------------------------
// S3 Client Singleton
// ---------------------------------------------------------------------------
class S3StorageClient {
  private readonly client: S3Client;
  private readonly bucket: string;
  private readonly region: string;
  private readonly cdnDomain?: string;

  constructor() {
    this.bucket = envConfig.storage.s3Bucket;
    this.region = envConfig.storage.s3Region;
    this.cdnDomain = envConfig.storage.cdnDomain;

    this.client = new S3Client({
      region: this.region,
      credentials: {
        accessKeyId: envConfig.storage.s3AccessKeyId,
        secretAccessKey: envConfig.storage.s3SecretAccessKey,
      },
      maxAttempts: 3,
      requestHandler: {
        requestTimeout: 30_000,
        httpsAgent: { keepAlive: true, maxSockets: 50 },
      },
    });

    logger.info({
      context: 'S3StorageClient',
      bucket: this.bucket,
      region: this.region,
      cdnEnabled: !!this.cdnDomain,
    });
  }

  // -------------------------------------------------------------------------
  // Upload single file (buffer or stream)
  // -------------------------------------------------------------------------
  async upload(
    data: Buffer | Readable,
    options: UploadOptions = {},
  ): Promise<UploadResult> {
    const key = options.key ?? this.generateKey();
    const bucket = options.bucket ?? this.bucket;

    const params: PutObjectCommandInput = {
      Bucket: bucket,
      Key: key,
      Body: data,
      ContentType: options.contentType ?? 'application/octet-stream',
      Metadata: options.metadata,
      ACL: options.acl ?? 'private',
      CacheControl: options.cacheControl ?? 'public, max-age=31536000',
      ServerSideEncryption: options.serverSideEncryption ?? 'AES256',
      StorageClass: options.storageClass ?? 'STANDARD',
    };

    try {
      const command = new PutObjectCommand(params);
      const response = await this.client.send(command);

      logger.info({
        context: 'S3Upload',
        bucket,
        key,
        etag: response.ETag,
      });

      return {
        key,
        url: this.getPublicUrl(key, bucket),
        bucket,
        etag: response.ETag,
        versionId: response.VersionId,
      };
    } catch (error) {
      logger.error({
        context: 'S3Upload',
        error,
        bucket,
        key,
      });
      throw new Error(`S3 upload failed: ${(error as Error).message}`);
    }
  }

  // -------------------------------------------------------------------------
  // Multipart upload for large files (> 100MB recommended)
  // -------------------------------------------------------------------------
  async uploadLarge(
    data: Buffer | Readable,
    options: UploadOptions = {},
  ): Promise<UploadResult> {
    const key = options.key ?? this.generateKey();
    const bucket = options.bucket ?? this.bucket;

    try {
      const upload = new Upload({
        client: this.client,
        params: {
          Bucket: bucket,
          Key: key,
          Body: data,
          ContentType: options.contentType ?? 'application/octet-stream',
          Metadata: options.metadata,
          ACL: options.acl ?? 'private',
          CacheControl: options.cacheControl ?? 'public, max-age=31536000',
          ServerSideEncryption: options.serverSideEncryption ?? 'AES256',
          StorageClass: options.storageClass ?? 'STANDARD',
        },
        queueSize: 4,
        partSize: 10 * 1024 * 1024, // 10MB parts
        leavePartsOnError: false,
      });

      upload.on('httpUploadProgress', (progress) => {
        logger.debug({
          context: 'S3MultipartUpload',
          key,
          loaded: progress.loaded,
          total: progress.total,
        });
      });

      const response = await upload.done();

      logger.info({
        context: 'S3MultipartUpload',
        bucket,
        key,
        etag: response.ETag,
      });

      return {
        key,
        url: this.getPublicUrl(key, bucket),
        bucket,
        etag: response.ETag,
        versionId: response.VersionId,
      };
    } catch (error) {
      logger.error({
        context: 'S3MultipartUpload',
        error,
        bucket,
        key,
      });
      throw new Error(`S3 multipart upload failed: ${(error as Error).message}`);
    }
  }

  // -------------------------------------------------------------------------
  // Generate presigned URL for client-side uploads
  // -------------------------------------------------------------------------
  async getPresignedUploadUrl(
    key: string,
    options: PresignedUrlOptions = {},
  ): Promise<string> {
    const { expiresIn = 3600, contentType, metadata } = options;

    const command = new PutObjectCommand({
      Bucket: this.bucket,
      Key: key,
      ContentType: contentType,
      Metadata: metadata,
      ServerSideEncryption: 'AES256',
    });

    try {
      const url = await getSignedUrl(this.client, command, { expiresIn });

      logger.debug({
        context: 'PresignedUploadUrl',
        key,
        expiresIn,
      });

      return url;
    } catch (error) {
      logger.error({
        context: 'PresignedUploadUrl',
        error,
        key,
      });
      throw new Error(`Failed to generate presigned URL: ${(error as Error).message}`);
    }
  }

  // -------------------------------------------------------------------------
  // Generate presigned URL for downloads (private objects)
  // -------------------------------------------------------------------------
  async getPresignedDownloadUrl(
    key: string,
    expiresIn = 3600,
  ): Promise<string> {
    const command = new GetObjectCommand({
      Bucket: this.bucket,
      Key: key,
    });

    try {
      const url = await getSignedUrl(this.client, command, { expiresIn });

      logger.debug({
        context: 'PresignedDownloadUrl',
        key,
        expiresIn,
      });

      return url;
    } catch (error) {
      logger.error({
        context: 'PresignedDownloadUrl',
        error,
        key,
      });
      throw new Error(`Failed to generate download URL: ${(error as Error).message}`);
    }
  }

  // -------------------------------------------------------------------------
  // Delete single object
  // -------------------------------------------------------------------------
  async delete(key: string, bucket?: string): Promise<void> {
    const targetBucket = bucket ?? this.bucket;

    const params: DeleteObjectCommandInput = {
      Bucket: targetBucket,
      Key: key,
    };

    try {
      await this.client.send(new DeleteObjectCommand(params));

      logger.info({
        context: 'S3Delete',
        bucket: targetBucket,
        key,
      });
    } catch (error) {
      logger.error({
        context: 'S3Delete',
        error,
        bucket: targetBucket,
        key,
      });
      throw new Error(`S3 delete failed: ${(error as Error).message}`);
    }
  }

  // -------------------------------------------------------------------------
  // Delete multiple objects (batch delete)
  // -------------------------------------------------------------------------
  async deleteMany(keys: string[], bucket?: string): Promise<void> {
    if (keys.length === 0) return;

    const targetBucket = bucket ?? this.bucket;

    try {
      await this.client.send(
        new DeleteObjectsCommand({
          Bucket: targetBucket,
          Delete: {
            Objects: keys.map((key) => ({ Key: key })),
            Quiet: true,
          },
        }),
      );

      logger.info({
        context: 'S3DeleteMany',
        bucket: targetBucket,
        count: keys.length,
      });
    } catch (error) {
      logger.error({
        context: 'S3DeleteMany',
        error,
        bucket: targetBucket,
        count: keys.length,
      });
      throw new Error(`S3 batch delete failed: ${(error as Error).message}`);
    }
  }

  // -------------------------------------------------------------------------
  // Check if object exists
  // -------------------------------------------------------------------------
  async exists(key: string, bucket?: string): Promise<boolean> {
    const targetBucket = bucket ?? this.bucket;

    try {
      await this.client.send(
        new HeadObjectCommand({
          Bucket: targetBucket,
          Key: key,
        }),
      );
      return true;
    } catch (error) {
      if ((error as { name: string }).name === 'NotFound') {
        return false;
      }
      throw error;
    }
  }

  // -------------------------------------------------------------------------
  // Copy object within same bucket or across buckets
  // -------------------------------------------------------------------------
  async copy(
    sourceKey: string,
    destinationKey: string,
    options: { sourceBucket?: string; destBucket?: string } = {},
  ): Promise<UploadResult> {
    const sourceBucket = options.sourceBucket ?? this.bucket;
    const destBucket = options.destBucket ?? this.bucket;

    const params: CopyObjectCommandInput = {
      Bucket: destBucket,
      CopySource: `${sourceBucket}/${sourceKey}`,
      Key: destinationKey,
      ServerSideEncryption: 'AES256',
    };

    try {
      const response = await this.client.send(new CopyObjectCommand(params));

      logger.info({
        context: 'S3Copy',
        sourceKey,
        destinationKey,
        sourceBucket,
        destBucket,
      });

      return {
        key: destinationKey,
        url: this.getPublicUrl(destinationKey, destBucket),
        bucket: destBucket,
        etag: response.CopyObjectResult?.ETag,
      };
    } catch (error) {
      logger.error({
        context: 'S3Copy',
        error,
        sourceKey,
        destinationKey,
      });
      throw new Error(`S3 copy failed: ${(error as Error).message}`);
    }
  }

  // -------------------------------------------------------------------------
  // List objects by prefix (for cleanup jobs, media library pagination)
  // -------------------------------------------------------------------------
  async listObjects(
    prefix: string,
    maxKeys = 1000,
    bucket?: string,
  ): Promise<string[]> {
    const targetBucket = bucket ?? this.bucket;

    try {
      const response = await this.client.send(
        new ListObjectsV2Command({
          Bucket: targetBucket,
          Prefix: prefix,
          MaxKeys: maxKeys,
        }),
      );

      const keys = response.Contents?.map((obj) => obj.Key).filter(
        (k): k is string => !!k,
      ) ?? [];

      logger.debug({
        context: 'S3ListObjects',
        bucket: targetBucket,
        prefix,
        count: keys.length,
      });

      return keys;
    } catch (error) {
      logger.error({
        context: 'S3ListObjects',
        error,
        bucket: targetBucket,
        prefix,
      });
      throw new Error(`S3 list objects failed: ${(error as Error).message}`);
    }
  }

  // -------------------------------------------------------------------------
  // Helpers
  // -------------------------------------------------------------------------
  private generateKey(): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 15);
    return `uploads/${timestamp}-${random}`;
  }

  private getPublicUrl(key: string, bucket?: string): string {
    if (this.cdnDomain) {
      return `${this.cdnDomain}/${key}`;
    }

    const targetBucket = bucket ?? this.bucket;
    return `https://${targetBucket}.s3.${this.region}.amazonaws.com/${key}`;
  }

  // -------------------------------------------------------------------------
  // Health check
  // -------------------------------------------------------------------------
  async healthCheck(): Promise<boolean> {
    try {
      await this.client.send(
        new HeadObjectCommand({
          Bucket: this.bucket,
          Key: '.health-check',
        }),
      );
      return true;
    } catch (error) {
      if ((error as { name: string }).name === 'NotFound') {
        return true; // Bucket accessible, object missing is OK
      }
      logger.error({ context: 'S3HealthCheck', error });
      return false;
    }
  }
}

// ---------------------------------------------------------------------------
// Export singleton instance
// ---------------------------------------------------------------------------
export const s3Client = new S3StorageClient();