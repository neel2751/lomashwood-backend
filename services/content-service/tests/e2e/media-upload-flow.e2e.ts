import request from 'supertest';
import { Application } from 'express';
import { beforeAll, afterAll, describe, it, expect } from '@jest/globals';
import path from 'path';
import fs from 'fs';
import { createApp } from '../../src/app';
import { PrismaClient } from '@prisma/client';
import { generateAdminToken } from '../helpers/auth.helper.ts';

let app: Application;
let prisma: PrismaClient;
let adminToken: string;

beforeAll(async () => {
  app = await createApp();
  prisma = new PrismaClient();
  adminToken = generateAdminToken({ id: 'admin-1', role: 'ADMIN' });

  const fixturesDir = path.join(__dirname, '../fixtures/files');
  if (!fs.existsSync(fixturesDir)) {
    fs.mkdirSync(fixturesDir, { recursive: true });
  }

  const testImagePath = path.join(fixturesDir, 'test-image.jpg');
  if (!fs.existsSync(testImagePath)) {
    fs.writeFileSync(testImagePath, Buffer.alloc(1024, 'A'));
  }

  const testVideoPath = path.join(fixturesDir, 'test-video.mp4');
  if (!fs.existsSync(testVideoPath)) {
    fs.writeFileSync(testVideoPath, Buffer.alloc(2048, 'B'));
  }
});

afterAll(async () => {
  await prisma.$disconnect();
});

describe('Media Upload Flow', () => {
  let uploadedMediaId: string;
  let uploadedMediaUrl: string;

  it('uploads an image file to the media wall', async () => {
    const testImagePath = path.join(__dirname, '../fixtures/files/test-image.jpg');

    const res = await request(app)
      .post('/v1/media/upload')
      .set('Authorization', `Bearer ${adminToken}`)
      .attach('file', testImagePath)
      .field('title', 'Kitchen Design Photo')
      .field('type', 'IMAGE')
      .field('altText', 'A beautiful kitchen design by Lomash Wood')
      .field('folder', 'media-wall');

    expect(res.status).toBe(201);
    expect(res.body.data.type).toBe('IMAGE');
    expect(res.body.data.url).toBeTruthy();
    expect(res.body.data.title).toBe('Kitchen Design Photo');
    uploadedMediaId = res.body.data.id;
    uploadedMediaUrl = res.body.data.url;
  });

  it('retrieves uploaded media by id', async () => {
    const res = await request(app)
      .get(`/v1/media/${uploadedMediaId}`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.id).toBe(uploadedMediaId);
    expect(res.body.data.url).toBe(uploadedMediaUrl);
  });

  it('uploads a video file to the media wall', async () => {
    const testVideoPath = path.join(__dirname, '../fixtures/files/test-video.mp4');

    const res = await request(app)
      .post('/v1/media/upload')
      .set('Authorization', `Bearer ${adminToken}`)
      .attach('file', testVideoPath)
      .field('title', 'Bedroom Transformation Video')
      .field('type', 'VIDEO')
      .field('altText', 'Bedroom makeover timelapse')
      .field('folder', 'media-wall');

    expect(res.status).toBe(201);
    expect(res.body.data.type).toBe('VIDEO');
    expect(res.body.data.url).toBeTruthy();
  });

  it('lists all media with pagination and type filter', async () => {
    const res = await request(app)
      .get('/v1/media?type=IMAGE&page=1&limit=10')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data.items)).toBe(true);
    expect(res.body.data.pagination).toBeDefined();
    res.body.data.items.forEach((media: any) => {
      expect(media.type).toBe('IMAGE');
    });
  });

  it('adds uploaded media to the media wall section', async () => {
    const mediaWall = await prisma.mediaWall.findFirst({
      where: { id: 'seed-media-1' },
    });

    const mediaWallId = mediaWall?.id ?? 'seed-media-1';

    const res = await request(app)
      .post(`/v1/cms/media-wall/${mediaWallId}/items`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        mediaId: uploadedMediaId,
        position: 1,
        caption: 'Beautiful kitchen design',
      });

    expect(res.status).toBe(201);
    expect(res.body.data.mediaId).toBe(uploadedMediaId);
  });

  it('reorders media wall items', async () => {
    const mediaWall = await prisma.mediaWall.findFirst({
      where: { id: 'seed-media-1' },
    });
    const mediaWallId = mediaWall?.id ?? 'seed-media-1';

    const res = await request(app)
      .patch(`/v1/cms/media-wall/${mediaWallId}/reorder`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        items: [{ id: uploadedMediaId, position: 2 }],
      });

    expect(res.status).toBe(200);
  });

  it('updates media metadata', async () => {
    const res = await request(app)
      .patch(`/v1/media/${uploadedMediaId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        title: 'Updated Kitchen Design Photo',
        altText: 'Updated alt text for kitchen design',
      });

    expect(res.status).toBe(200);
    expect(res.body.data.title).toBe('Updated Kitchen Design Photo');
  });

  it('rejects upload of disallowed file types', async () => {
    const fixturesDir = path.join(__dirname, '../fixtures/files');
    const maliciousFilePath = path.join(fixturesDir, 'malicious.exe');
    fs.writeFileSync(maliciousFilePath, Buffer.alloc(512, 'C'));

    const res = await request(app)
      .post('/v1/media/upload')
      .set('Authorization', `Bearer ${adminToken}`)
      .attach('file', maliciousFilePath)
      .field('title', 'Malicious File')
      .field('type', 'IMAGE');

    expect(res.status).toBe(422);

    fs.unlinkSync(maliciousFilePath);
  });

  it('enforces file size limit on upload', async () => {
    const fixturesDir = path.join(__dirname, '../fixtures/files');
    const largeFilePath = path.join(fixturesDir, 'large-file.jpg');
    fs.writeFileSync(largeFilePath, Buffer.alloc(11 * 1024 * 1024, 'D'));

    const res = await request(app)
      .post('/v1/media/upload')
      .set('Authorization', `Bearer ${adminToken}`)
      .attach('file', largeFilePath)
      .field('title', 'Large File')
      .field('type', 'IMAGE');

    expect(res.status).toBe(413);

    fs.unlinkSync(largeFilePath);
  });

  it('searches media by title keyword', async () => {
    const res = await request(app)
      .get('/v1/media?search=Kitchen')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data.items)).toBe(true);
  });

  it('deletes media item', async () => {
    const res = await request(app)
      .delete(`/v1/media/${uploadedMediaId}`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);

    const deleted = await prisma.media.findUnique({ where: { id: uploadedMediaId } });
    expect(deleted?.deletedAt).toBeTruthy();
  });

  it('rejects upload from unauthenticated users', async () => {
    const testImagePath = path.join(__dirname, '../fixtures/files/test-image.jpg');

    const res = await request(app)
      .post('/v1/media/upload')
      .attach('file', testImagePath)
      .field('title', 'Unauthorized Upload')
      .field('type', 'IMAGE');

    expect(res.status).toBe(401);
  });
});