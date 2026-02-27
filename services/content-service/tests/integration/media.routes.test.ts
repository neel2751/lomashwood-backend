import request from 'supertest';
import { createApp } from '../../src/app';
import { prisma } from '../../src/infrastructure/db/prisma.client';
import { mockAdminToken, mockUserToken } from '../helpers/auth.helper';
import { jest, describe, it, expect, beforeEach } from '@jest/globals';

jest.mock('../../src/infrastructure/db/prisma.client', () => ({
  prisma: {
    media: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
    $disconnect: jest.fn(),
  },
}));

jest.mock('../../src/infrastructure/cache/redis.client', () => ({
  redis: { get: jest.fn(), set: jest.fn(), del: jest.fn(), quit: jest.fn() },
}));

jest.mock('../../src/infrastructure/storage/s3.client', () => ({
  s3Client: {
    upload: jest.fn(),
    delete: jest.fn(),
    getSignedUrl: jest.fn(),
  },
}));

const app = createApp();

const mockMedia = {
  id: 'media-1',
  filename: 'kitchen-hero.jpg',
  originalName: 'kitchen-hero.jpg',
  mimeType: 'image/jpeg',
  size: 204800,
  url: 'https://cdn.lomashwood.com/media/kitchen-hero.jpg',
  alt: 'Modern kitchen hero image',
  caption: 'A stunning modern kitchen by Lomash Wood',
  type: 'image',
  width: 1920,
  height: 1080,
  createdAt: new Date('2025-01-01').toISOString(),
  updatedAt: new Date('2025-01-01').toISOString(),
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type MockFn = ReturnType<typeof jest.fn<() => any>>;

function asMock(fn: unknown): MockFn {
  return fn as MockFn;
}

describe('Media Routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /v1/media', () => {
    it('should return 200 with paginated media list for admin', async () => {
      asMock(prisma.media.findMany).mockResolvedValue([mockMedia]);
      asMock(prisma.media.count).mockResolvedValue(1);

      const res = await request(app)
        .get('/v1/media')
        .set('Authorization', `Bearer ${mockAdminToken}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data[0]).toHaveProperty('url');
    });

    it('should return 401 without auth token', async () => {
      const res = await request(app).get('/v1/media');

      expect(res.status).toBe(401);
    });

    it('should support type filter query param', async () => {
      asMock(prisma.media.findMany).mockResolvedValue([mockMedia]);
      asMock(prisma.media.count).mockResolvedValue(1);

      const res = await request(app)
        .get('/v1/media?type=image')
        .set('Authorization', `Bearer ${mockAdminToken}`);

      expect(res.status).toBe(200);

      const calls = asMock(prisma.media.findMany).mock.calls;
      const arg = (calls[0] as unknown[])[0] as Record<string, unknown>;
      expect(arg.where).toHaveProperty('type', 'image');
    });

    it('should support search query param', async () => {
      asMock(prisma.media.findMany).mockResolvedValue([mockMedia]);
      asMock(prisma.media.count).mockResolvedValue(1);

      const res = await request(app)
        .get('/v1/media?search=kitchen')
        .set('Authorization', `Bearer ${mockAdminToken}`);

      expect(res.status).toBe(200);
    });

    it('should return 400 for invalid type filter', async () => {
      const res = await request(app)
        .get('/v1/media?type=invalid-type')
        .set('Authorization', `Bearer ${mockAdminToken}`);

      expect(res.status).toBe(400);
    });
  });

  describe('GET /v1/media/:id', () => {
    it('should return 200 with media item for admin', async () => {
      asMock(prisma.media.findUnique).mockResolvedValue(mockMedia);

      const res = await request(app)
        .get('/v1/media/media-1')
        .set('Authorization', `Bearer ${mockAdminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveProperty('filename', 'kitchen-hero.jpg');
    });

    it('should return 404 when media item not found', async () => {
      asMock(prisma.media.findUnique).mockResolvedValue(null);

      const res = await request(app)
        .get('/v1/media/nonexistent')
        .set('Authorization', `Bearer ${mockAdminToken}`);

      expect(res.status).toBe(404);
    });

    it('should return 401 without auth token', async () => {
      const res = await request(app).get('/v1/media/media-1');

      expect(res.status).toBe(401);
    });
  });

  describe('POST /v1/media/upload', () => {
    it('should return 201 when a valid image is uploaded', async () => {
      const { s3Client } = jest.requireMock(
        '../../src/infrastructure/storage/s3.client',
      ) as { s3Client: Record<string, unknown> };

      asMock(s3Client.upload).mockResolvedValue({
        url: 'https://cdn.lomashwood.com/media/new-image.jpg',
        key: 'media/new-image.jpg',
      });
      asMock(prisma.media.create).mockResolvedValue({
        ...mockMedia,
        id: 'media-new',
        filename: 'new-image.jpg',
      });

      const res = await request(app)
        .post('/v1/media/upload')
        .set('Authorization', `Bearer ${mockAdminToken}`)
        .attach('file', Buffer.from('fake-image-data'), {
          filename: 'test-image.jpg',
          contentType: 'image/jpeg',
        });

      expect(res.status).toBe(201);
      expect(res.body.data).toHaveProperty('url');
    });

    it('should return 401 without auth token', async () => {
      const res = await request(app)
        .post('/v1/media/upload')
        .attach('file', Buffer.from('data'), {
          filename: 'test.jpg',
          contentType: 'image/jpeg',
        });

      expect(res.status).toBe(401);
    });

    it('should return 403 for non-admin user', async () => {
      const res = await request(app)
        .post('/v1/media/upload')
        .set('Authorization', `Bearer ${mockUserToken}`)
        .attach('file', Buffer.from('data'), {
          filename: 'test.jpg',
          contentType: 'image/jpeg',
        });

      expect(res.status).toBe(403);
    });

    it('should return 400 when no file is attached', async () => {
      const res = await request(app)
        .post('/v1/media/upload')
        .set('Authorization', `Bearer ${mockAdminToken}`);

      expect(res.status).toBe(400);
    });

    it('should return 400 when file type is not allowed', async () => {
      const res = await request(app)
        .post('/v1/media/upload')
        .set('Authorization', `Bearer ${mockAdminToken}`)
        .attach('file', Buffer.from('<script>evil</script>'), {
          filename: 'malicious.exe',
          contentType: 'application/octet-stream',
        });

      expect(res.status).toBe(400);
    });

    it('should return 400 when file exceeds size limit', async () => {
      const largeBuffer = Buffer.alloc(11 * 1024 * 1024);

      const res = await request(app)
        .post('/v1/media/upload')
        .set('Authorization', `Bearer ${mockAdminToken}`)
        .attach('file', largeBuffer, {
          filename: 'huge-file.jpg',
          contentType: 'image/jpeg',
        });

      expect(res.status).toBe(400);
    });
  });

  describe('PATCH /v1/media/:id', () => {
    it('should return 200 and update media metadata', async () => {
      const updated = { ...mockMedia, alt: 'Updated alt text' };
      asMock(prisma.media.findUnique).mockResolvedValue(mockMedia);
      asMock(prisma.media.update).mockResolvedValue(updated);

      const res = await request(app)
        .patch('/v1/media/media-1')
        .set('Authorization', `Bearer ${mockAdminToken}`)
        .send({ alt: 'Updated alt text' });

      expect(res.status).toBe(200);
      expect(res.body.data.alt).toBe('Updated alt text');
    });

    it('should return 404 when media not found', async () => {
      asMock(prisma.media.findUnique).mockResolvedValue(null);

      const res = await request(app)
        .patch('/v1/media/nonexistent')
        .set('Authorization', `Bearer ${mockAdminToken}`)
        .send({ alt: 'x' });

      expect(res.status).toBe(404);
    });

    it('should return 401 without auth token', async () => {
      const res = await request(app).patch('/v1/media/media-1').send({ alt: 'x' });

      expect(res.status).toBe(401);
    });
  });

  describe('DELETE /v1/media/:id', () => {
    it('should return 204 on successful deletion including S3 cleanup', async () => {
      const { s3Client } = jest.requireMock(
        '../../src/infrastructure/storage/s3.client',
      ) as { s3Client: Record<string, unknown> };

      asMock(s3Client.delete).mockResolvedValue(undefined);
      asMock(prisma.media.findUnique).mockResolvedValue(mockMedia);
      asMock(prisma.media.delete).mockResolvedValue(mockMedia);

      const res = await request(app)
        .delete('/v1/media/media-1')
        .set('Authorization', `Bearer ${mockAdminToken}`);

      expect(res.status).toBe(204);
    });

    it('should return 404 when media not found', async () => {
      asMock(prisma.media.findUnique).mockResolvedValue(null);

      const res = await request(app)
        .delete('/v1/media/nonexistent')
        .set('Authorization', `Bearer ${mockAdminToken}`);

      expect(res.status).toBe(404);
    });

    it('should return 401 without auth token', async () => {
      const res = await request(app).delete('/v1/media/media-1');

      expect(res.status).toBe(401);
    });

    it('should return 403 for non-admin user', async () => {
      const res = await request(app)
        .delete('/v1/media/media-1')
        .set('Authorization', `Bearer ${mockUserToken}`);

      expect(res.status).toBe(403);
    });
  });
});