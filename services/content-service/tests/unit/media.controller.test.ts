import { Request, Response, NextFunction } from 'express';
import { MediaController } from '../../src/app/media/media.controller';
import { MediaService } from '../../src/app/media/media.service';
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

const mockMediaService = {
  findAll: jest.fn(),
  findById: jest.fn(),
  upload: jest.fn(),
  update: jest.fn(),
  softDelete: jest.fn(),
  generatePresignedUrl: jest.fn(),
  findByFolder: jest.fn(),
  archive: jest.fn(),
};

const mockRes = () => {
  const res = {} as Response;
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

const mockNext: NextFunction = jest.fn();

describe('MediaController', () => {
  let controller: MediaController;

  beforeEach(() => {
    jest.clearAllMocks();
    controller = new MediaController(mockMediaService as unknown as MediaService);
  });

  describe('findAll', () => {
    it('should return 200 with paginated media list', async () => {
      const req = { query: mockPaginationQuery } as unknown as Request;
      const res = mockRes();
      const paginated = { data: allMockMedia, meta: { total: allMockMedia.length, page: 1, perPage: 10 } };
      mockMediaService.findAll.mockResolvedValue(paginated);

      await controller.findAll(req, res, mockNext);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ data: allMockMedia }));
    });

    it('should pass type filter to service', async () => {
      const req = { query: { ...mockPaginationQuery, type: 'IMAGE' } } as unknown as Request;
      const res = mockRes();
      mockMediaService.findAll.mockResolvedValue({ data: [], meta: { total: 0 } });

      await controller.findAll(req, res, mockNext);

      expect(mockMediaService.findAll).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'IMAGE' }),
      );
    });

    it('should pass folder filter to service', async () => {
      const req = { query: { ...mockPaginationQuery, folder: 'hero' } } as unknown as Request;
      const res = mockRes();
      mockMediaService.findAll.mockResolvedValue({ data: [], meta: { total: 0 } });

      await controller.findAll(req, res, mockNext);

      expect(mockMediaService.findAll).toHaveBeenCalledWith(
        expect.objectContaining({ folder: 'hero' }),
      );
    });

    it('should forward errors to next', async () => {
      const req = { query: {} } as unknown as Request;
      const res = mockRes();
      mockMediaService.findAll.mockRejectedValue(new Error('DB error'));

      await controller.findAll(req, res, mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.any(Error));
    });
  });

  describe('findById', () => {
    it('should return 200 with the media item', async () => {
      const req = { params: { id: mockMediaHeroImage1.id } } as unknown as Request;
      const res = mockRes();
      mockMediaService.findById.mockResolvedValue(mockMediaHeroImage1);

      await controller.findById(req, res, mockNext);

      expect(mockMediaService.findById).toHaveBeenCalledWith(mockMediaHeroImage1.id);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ data: mockMediaHeroImage1 }));
    });

    it('should forward NotFoundException to next', async () => {
      const req = { params: { id: 'not-found' } } as unknown as Request;
      const res = mockRes();
      mockMediaService.findById.mockRejectedValue(new Error('Not Found'));

      await controller.findById(req, res, mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.any(Error));
    });
  });

  describe('upload', () => {
    it('should return 201 with the uploaded media record', async () => {
      const mockFile = { originalname: 'test.jpg', mimetype: 'image/jpeg', size: 500000 };
      const req = {
        file: mockFile,
        body: mockUploadImageDto,
        user: mockAdminUser,
      } as unknown as Request;
      const res = mockRes();
      const uploadedMedia = buildMockMedia();
      mockMediaService.upload.mockResolvedValue(uploadedMedia);

      await controller.upload(req, res, mockNext);

      expect(mockMediaService.upload).toHaveBeenCalledWith(mockFile, mockUploadImageDto, mockAdminUser.id);
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ data: uploadedMedia }));
    });

    it('should return 400 when no file is provided', async () => {
      const req = { file: undefined, body: mockUploadImageDto, user: mockAdminUser } as unknown as Request;
      const res = mockRes();

      await controller.upload(req, res, mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.any(Error));
      expect(mockMediaService.upload).not.toHaveBeenCalled();
    });

    it('should forward S3 upload errors to next', async () => {
      const mockFile = { originalname: 'test.jpg', mimetype: 'image/jpeg', size: 500000 };
      const req = { file: mockFile, body: mockUploadImageDto, user: mockAdminUser } as unknown as Request;
      const res = mockRes();
      mockMediaService.upload.mockRejectedValue(new Error('S3 upload failed'));

      await controller.upload(req, res, mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.any(Error));
    });
  });

  describe('update', () => {
    it('should return 200 with the updated media item', async () => {
      const req = {
        params: { id: mockMediaHeroImage1.id },
        body: mockUpdateMediaDto,
        user: mockAdminUser,
      } as unknown as Request;
      const res = mockRes();
      const updated = { ...mockMediaHeroImage1, ...mockUpdateMediaDto };
      mockMediaService.update.mockResolvedValue(updated);

      await controller.update(req, res, mockNext);

      expect(mockMediaService.update).toHaveBeenCalledWith(
        mockMediaHeroImage1.id,
        mockUpdateMediaDto,
        mockAdminUser.id,
      );
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it('should forward NotFoundException to next', async () => {
      const req = {
        params: { id: 'non-existent' },
        body: mockUpdateMediaDto,
        user: mockAdminUser,
      } as unknown as Request;
      const res = mockRes();
      mockMediaService.update.mockRejectedValue(new Error('Not Found'));

      await controller.update(req, res, mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.any(Error));
    });
  });

  describe('softDelete', () => {
    it('should return 204 on successful deletion', async () => {
      const req = { params: { id: mockMediaHeroImage1.id }, user: mockAdminUser } as unknown as Request;
      const res = mockRes();
      mockMediaService.softDelete.mockResolvedValue(undefined);

      await controller.softDelete(req, res, mockNext);

      expect(mockMediaService.softDelete).toHaveBeenCalledWith(mockMediaHeroImage1.id, mockAdminUser.id);
      expect(res.status).toHaveBeenCalledWith(204);
    });

    it('should forward error to next when deletion fails', async () => {
      const req = { params: { id: 'non-existent' }, user: mockAdminUser } as unknown as Request;
      const res = mockRes();
      mockMediaService.softDelete.mockRejectedValue(new Error('Not Found'));

      await controller.softDelete(req, res, mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.any(Error));
    });
  });

  describe('generatePresignedUrl', () => {
    it('should return 200 with a presigned URL', async () => {
      const req = {
        query: { filename: 'test.jpg', mimeType: 'image/jpeg' },
        user: mockAdminUser,
      } as unknown as Request;
      const res = mockRes();
      const presignedUrl = 'https://s3.amazonaws.com/presigned?key=abc';
      mockMediaService.generatePresignedUrl.mockResolvedValue(presignedUrl);

      await controller.generatePresignedUrl(req, res, mockNext);

      expect(mockMediaService.generatePresignedUrl).toHaveBeenCalledWith('test.jpg', 'image/jpeg');
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ data: { url: presignedUrl } }));
    });

    it('should return 400 if filename or mimeType is missing', async () => {
      const req = { query: {}, user: mockAdminUser } as unknown as Request;
      const res = mockRes();

      await controller.generatePresignedUrl(req, res, mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.any(Error));
    });
  });

  describe('archive', () => {
    it('should return 200 with the archived media', async () => {
      const req = { params: { id: mockMediaWallVideo1.id }, user: mockAdminUser } as unknown as Request;
      const res = mockRes();
      const archived = { ...mockMediaWallVideo1, status: 'ARCHIVED' };
      mockMediaService.archive.mockResolvedValue(archived);

      await controller.archive(req, res, mockNext);

      expect(mockMediaService.archive).toHaveBeenCalledWith(mockMediaWallVideo1.id, mockAdminUser.id);
      expect(res.status).toHaveBeenCalledWith(200);
    });
  });

  describe('findByFolder', () => {
    it('should return 200 with media in the specified folder', async () => {
      const req = { params: { folder: 'hero' } } as unknown as Request;
      const res = mockRes();
      const heroMedia = allMockMedia.filter((m) => m.folder === 'hero');
      mockMediaService.findByFolder.mockResolvedValue(heroMedia);

      await controller.findByFolder(req, res, mockNext);

      expect(mockMediaService.findByFolder).toHaveBeenCalledWith('hero');
      expect(res.status).toHaveBeenCalledWith(200);
    });
  });
});