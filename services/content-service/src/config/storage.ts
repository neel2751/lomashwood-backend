import { env } from './env';
import { logger } from './logger';



export interface S3Config {
  region: string;
  accessKeyId: string;
  secretAccessKey: string;
  bucket: string;
  uploadPrefix: string;

  signedUrlExpirySeconds: number;

  maxUploadSizeBytes: number;
}

export interface CdnConfig {
  domain: string | null;
  distributionId: string | null;
  enabled: boolean;

  publicMaxAgeSeconds: number;

  privateMaxAgeSeconds: number;
}

export interface StorageConfig {
  s3: S3Config;
  cdn: CdnConfig;

  allowedMimeTypes: string[];
 
  imageMimeTypes: string[];

  videoMimeTypes: string[];
}



export const storageConfig: StorageConfig = {
  s3: {
    region: env.AWS_REGION,
    accessKeyId: env.AWS_ACCESS_KEY_ID,
    secretAccessKey: env.AWS_SECRET_ACCESS_KEY,
    bucket: env.AWS_S3_BUCKET,
    uploadPrefix: env.AWS_S3_UPLOAD_PREFIX,
    signedUrlExpirySeconds: 3_600,          
    maxUploadSizeBytes: 50 * 1024 * 1024,   
  },

  cdn: {
    domain: env.AWS_CLOUDFRONT_DOMAIN ?? null,
    distributionId: env.AWS_CLOUDFRONT_DISTRIBUTION_ID ?? null,
    enabled: !!env.AWS_CLOUDFRONT_DOMAIN,
    publicMaxAgeSeconds: 60 * 60 * 24 * 30, 
    privateMaxAgeSeconds: 60,               
  },

  allowedMimeTypes: [
    
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/webp',
    'image/gif',
    'image/svg+xml',
    
    'video/mp4',
    'video/webm',
    'video/ogg',
    'video/quicktime',
  ],

  imageMimeTypes: [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/webp',
    'image/gif',
    'image/svg+xml',
  ],

  videoMimeTypes: [
    'video/mp4',
    'video/webm',
    'video/ogg',
    'video/quicktime',
  ],
};


export function buildS3Key(
  entityType: 'blog' | 'page' | 'media-wall' | 'landing' | 'seo' | 'showroom',
  entityId: string,
  filename: string,
): string {
  const sanitisedFilename = filename.replace(/[^a-zA-Z0-9._-]/g, '_').toLowerCase();
  return `${storageConfig.s3.uploadPrefix}${entityType}/${entityId}/${sanitisedFilename}`;
}


export function resolvePublicUrl(s3Key: string): string {
  if (storageConfig.cdn.enabled && storageConfig.cdn.domain) {
    return `https://${storageConfig.cdn.domain}/${s3Key}`;
  }

  // Fallback to S3 public URL
  return `https://${storageConfig.s3.bucket}.s3.${storageConfig.s3.region}.amazonaws.com/${s3Key}`;
}



export function isAllowedMimeType(mimeType: string): boolean {
  return storageConfig.allowedMimeTypes.includes(mimeType);
}

export function isImageMimeType(mimeType: string): boolean {
  return storageConfig.imageMimeTypes.includes(mimeType);
}

export function isVideoMimeType(mimeType: string): boolean {
  return storageConfig.videoMimeTypes.includes(mimeType);
}


export async function validateStorageConnection(s3Client: {
  headBucket: (params: { Bucket: string }) => { promise: () => Promise<void> };
}): Promise<void> {
  try {
    await s3Client.headBucket({ Bucket: storageConfig.s3.bucket }).promise();
    logger.info(
      { bucket: storageConfig.s3.bucket },
      '[Storage] S3 bucket is accessible',
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    logger.fatal({ error: message, bucket: storageConfig.s3.bucket }, '[Storage] S3 bucket is not accessible');
    throw err;
  }
}