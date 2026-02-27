import { MediaService } from '../../src/app/media-wall/media.service';
import { MediaRepository } from '../../src/app/media-wall/media.repository';
import {
  mockMediaHeroImage1,
  mockMediaWallVideo1,
  allMockMedia,
  mockUploadImageDto,
  mockUpdateMediaDto,
  buildMockMedia,
} from '../fixtures/media.fixture';
import { mockAdminUser, mockPaginationQuery } from '../fixtures/common.fixture';

import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';

const mockMediaRepository = {
  findAll: jest.fn(),
  findById: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  softDelete: jest.fn(),
  countAll: jest.fn(),
  findByFolder: jest.fn(),
};

const mockS3Client = {
  upload: jest.fn(),
  delete: jest.fn(),
  generatePresignedUrl: jest.fn(),
};

describe('MediaService', () => {
  let service: MediaService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new MediaService(
      mockMediaRepository as unknown as MediaRepository,
      mockS3Client as never,
    );
  });

  describe('findAll', () => {
    it('should return paginated media items', async () => {
      mockMediaRepository.findAll.mockResolvedValue(allMockMedia);
      mockMediaRepository.countAll.mockResolvedValue(allMockMedia.length);

      const result = await service.findAll(mockPaginationQuery);

      expect(result.data).toHaveLength(allMockMedia.length);
      expect(result.meta.total).toBe(allMockMedia.length);
    });

    it('should filter by type IMAGE', async () => {
      const images = allMockMedia.filter((m) => m.type === 'IMAGE');
      mockMediaRepository.findAll.mockResolvedValue(images);
      mockMediaRepository.countAll.mockResolvedValue(images.length);

      const result = await service.findAll({ ...mockPaginationQuery, type: 'IMAGE' });

      expect(result.data.every((m) => m.type === 'IMAGE')).toBe(true);
    });

    it('should filter by type VIDEO', async () => {
      const videos = allMockMedia.filter((m) => m.type === 'VIDEO');
      mockMediaRepository.findAll.mockResolvedValue(videos);
      mockMediaRepository.countAll.mockResolvedValue(videos.length);

      const result = await service.findAll({ ...mockPaginationQuery, type: 'VIDEO' });

      expect(result.data.every((m) => m.type === 'VIDEO')).toBe(true);
    });

    it('should filter by folder', async () => {
      const heroMedia = allMockMedia.filter((m) => m.folder === 'hero');
      mockMediaRepository.findAll.mockResolvedValue(heroMedia);
      mockMediaRepository.countAll.mockResolvedValue(heroMedia.length);

      await service.findAll({ ...mockPaginationQuery, folder: 'hero' });

      expect(mockMediaRepository.findAll).toHaveBeenCalledWith(
        expect.objectContaining({ folder: 'hero' }),
      );
    });
  });

  describe('findById', () => {
    it('should return media by id', async () => {
      mockMediaRepository.findById.mockResolvedValue(mockMediaHeroImage1);

      const result = await service.findById(mockMediaHeroImage1.id);

      expect(result).toEqual(mockMediaHeroImage1);
    });

    it('should throw NotFoundException when media not found', async () => {
      mockMediaRepository.findById.mockResolvedValue(null);

      await expect(service.findById('non-existent')).rejects.toThrow();
    });
  });

  describe('upload', () => {
    it('should upload file to S3 and create media record', async () => {
      const mockFile = {
        originalname: 'test-image.jpg',
        mimetype: 'image/jpeg',
        size: 500000,
        buffer: Buffer.from('fake-image-data'),
      };
      const uploadedUrl = 'https://cdn.lomashwood.com/images/test-image-123.jpg';
      const thumbnailUrl = 'https://cdn.lomashwood.com/thumbnails/test-image-123.jpg';
      const newMedia = buildMockMedia({ url: uploadedUrl, thumbnailUrl });

      mockS3Client.upload.mockResolvedValue({ url: uploadedUrl, thumbnailUrl });
      mockMediaRepository.create.mockResolvedValue(newMedia);

      const result = await service.upload(mockFile as never, mockUploadImageDto, mockAdminUser.id);

      expect(mockS3Client.upload).toHaveBeenCalledWith(mockFile, expect.any(Object));
      expect(mockMediaRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          originalName: 'test-image.jpg',
          mimeType: 'image/jpeg',
          size: 500000,
          createdById: mockAdminUser.id,
        }),
      );
      expect(result.url).toBe(uploadedUrl);
    });

    it('should throw if S3 upload fails', async () => {
      const mockFile = { originalname: 'fail.jpg', mimetype: 'image/jpeg', size: 100, buffer: Buffer.from('') };
      mockS3Client.upload.mockRejectedValue(new Error('S3 upload failed'));

      await expect(
        service.upload(mockFile as never, mockUploadImageDto, mockAdminUser.id),
      ).rejects.toThrow('S3 upload failed');
    });

    it('should reject files that exceed maximum size', async () => {
      const overSizeFile = { originalname: 'huge.jpg', mimetype: 'image/jpeg', size: 52428801, buffer: Buffer.from('') };

      await expect(
        service.upload(overSizeFile as never, mockUploadImageDto, mockAdminUser.id),
      ).rejects.toThrow();
    });

    it('should reject unsupported MIME types', async () => {
      const badFile = { originalname: 'script.exe', mimetype: 'application/exe', size: 1000, buffer: Buffer.from('') };

      await expect(
        service.upload(badFile as never, mockUploadImageDto, mockAdminUser.id),
      ).rejects.toThrow();
    });
  });

  describe('update', () => {
    it('should update metadata of a media item', async () => {
      const updated = { ...mockMediaHeroImage1, ...mockUpdateMediaDto };
      mockMediaRepository.findById.mockResolvedValue(mockMediaHeroImage1);
      mockMediaRepository.update.mockResolvedValue(updated);

      const result = await service.update(mockMediaHeroImage1.id, mockUpdateMediaDto, mockAdminUser.id);

      expect(mockMediaRepository.update).toHaveBeenCalledWith(
        mockMediaHeroImage1.id,
        expect.objectContaining({ updatedById: mockAdminUser.id }),
      );
      expect(result.altText).toBe(mockUpdateMediaDto.altText);
    });

    it('should throw NotFoundException if media not found', async () => {
      mockMediaRepository.findById.mockResolvedValue(null);

      await expect(
        service.update('non-existent', mockUpdateMediaDto, mockAdminUser.id),
      ).rejects.toThrow();
    });
  });

  describe('softDelete', () => {
    it('should soft delete media and remove file from S3', async () => {
      mockMediaRepository.findById.mockResolvedValue(mockMediaHeroImage1);
      mockS3Client.delete.mockResolvedValue(undefined);
      mockMediaRepository.softDelete.mockResolvedValue(undefined);

      await service.softDelete(mockMediaHeroImage1.id, mockAdminUser.id);

      expect(mockS3Client.delete).toHaveBeenCalledWith(mockMediaHeroImage1.filename);
      expect(mockMediaRepository.softDelete).toHaveBeenCalledWith(
        mockMediaHeroImage1.id,
        mockAdminUser.id,
      );
    });

    it('should throw NotFoundException if media not found', async () => {
      mockMediaRepository.findById.mockResolvedValue(null);

      await expect(service.softDelete('non-existent', mockAdminUser.id)).rejects.toThrow();
    });

    it('should still soft-delete the record if S3 deletion fails', async () => {
      mockMediaRepository.findById.mockResolvedValue(mockMediaHeroImage1);
      mockS3Client.delete.mockRejectedValue(new Error('S3 deletion failed'));
      mockMediaRepository.softDelete.mockResolvedValue(undefined);

      await service.softDelete(mockMediaHeroImage1.id, mockAdminUser.id);

      expect(mockMediaRepository.softDelete).toHaveBeenCalled();
    });
  });

  describe('generatePresignedUrl', () => {
    it('should return a presigned upload URL', async () => {
      const presignedUrl = 'https://s3.amazonaws.com/presigned?key=abc&signature=xyz';
      mockS3Client.generatePresignedUrl.mockResolvedValue(presignedUrl);

      const result = await service.generatePresignedUrl('test.jpg', 'image/jpeg');

      expect(mockS3Client.generatePresignedUrl).toHaveBeenCalledWith('test.jpg', 'image/jpeg');
      expect(result).toBe(presignedUrl);
    });
  });

  describe('findByFolder', () => {
    it('should return media items in a specific folder', async () => {
      const heroMedia = allMockMedia.filter((m) => m.folder === 'hero');
      mockMediaRepository.findByFolder.mockResolvedValue(heroMedia);

      const result = await service.findByFolder('hero');

      expect(mockMediaRepository.findByFolder).toHaveBeenCalledWith('hero');
      expect(result.every((m) => m.folder === 'hero')).toBe(true);
    });
  });

  describe('archive', () => {
    it('should set media status to ARCHIVED', async () => {
      const archived = { ...mockMediaWallVideo1, status: 'ARCHIVED' };
      mockMediaRepository.findById.mockResolvedValue(mockMediaWallVideo1);
      mockMediaRepository.update.mockResolvedValue(archived);

      const result = await service.archive(mockMediaWallVideo1.id, mockAdminUser.id);

      expect(mockMediaRepository.update).toHaveBeenCalledWith(
        mockMediaWallVideo1.id,
        expect.objectContaining({ status: 'ARCHIVED' }),
      );
      expect(result.status).toBe('ARCHIVED');
    });
  });
});