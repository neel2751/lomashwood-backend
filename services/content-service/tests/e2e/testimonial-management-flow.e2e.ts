import request from 'supertest';
import { Application } from 'express';
import { beforeAll, afterAll, describe, it, expect } from '@jest/globals';
import { createApp } from '../../src/app';
import { PrismaClient } from '@prisma/client';
import { generateAdminToken } from '../helpers/auth.helper.ts';

let app: Application;
let prisma: PrismaClient;
let adminToken: string;

beforeAll(async () => {
  app = await createApp();
  prisma = new PrismaClient({
    datasources: { db: { url: process.env.DATABASE_URL } },
  });
  adminToken = generateAdminToken({ id: 'admin-1', role: 'ADMIN' });
});

afterAll(async () => {
  await prisma.$disconnect();
});

describe('Testimonial Management Flow', () => {
  let testimonialId: string;
  let videoTestimonialId: string;

  it('creates a text testimonial in the CMS', async () => {
    const res = await request(app)
      .post('/v1/cms/testimonials')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        customerName: 'Sarah Thompson',
        location: 'London, UK',
        rating: 5,
        title: 'Absolutely love our new kitchen!',
        content: 'The team at Lomash Wood transformed our outdated kitchen into a stunning modern space. From the initial consultation to the final installation, every step was professional and stress-free.',
        type: 'TEXT',
        category: 'KITCHEN',
        isActive: true,
        isFeatured: true,
        displayPosition: 1,
      });

    expect(res.status).toBe(201);
    expect(res.body.data.customerName).toBe('Sarah Thompson');
    expect(res.body.data.rating).toBe(5);
    expect(res.body.data.isFeatured).toBe(true);
    testimonialId = res.body.data.id;
  });

  it('creates a video testimonial in the CMS', async () => {
    const res = await request(app)
      .post('/v1/cms/testimonials')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        customerName: 'James and Emma Wilson',
        location: 'Manchester, UK',
        rating: 5,
        title: 'Our bedroom transformation story',
        content: 'Watch how Lomash Wood transformed our master bedroom into a luxury retreat.',
        videoUrl: 'https://example.com/testimonial-video.mp4',
        thumbnailUrl: 'https://example.com/testimonial-thumb.jpg',
        type: 'VIDEO',
        category: 'BEDROOM',
        isActive: true,
        isFeatured: false,
        displayPosition: 2,
      });

    expect(res.status).toBe(201);
    expect(res.body.data.type).toBe('VIDEO');
    expect(res.body.data.videoUrl).toBeTruthy();
    videoTestimonialId = res.body.data.id;
  });

  it('creates a testimonial with before and after images', async () => {
    const res = await request(app)
      .post('/v1/cms/testimonials')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        customerName: 'Robert Clarke',
        location: 'Birmingham, UK',
        rating: 4,
        title: 'Great kitchen makeover result',
        content: 'Lomash Wood delivered exactly what we wanted. The quality of the units is exceptional.',
        type: 'IMAGE',
        category: 'KITCHEN',
        beforeImages: ['https://example.com/before1.jpg'],
        afterImages: ['https://example.com/after1.jpg', 'https://example.com/after2.jpg'],
        isActive: true,
        isFeatured: false,
        displayPosition: 3,
      });

    expect(res.status).toBe(201);
    expect(res.body.data.afterImages).toHaveLength(2);
  });

  it('retrieves all active testimonials publicly', async () => {
    const res = await request(app)
      .get('/v1/content/testimonials');

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
    res.body.data.forEach((t: any) => {
      expect(t.isActive).toBe(true);
    });
  });

  it('retrieves featured testimonials for homepage', async () => {
    const res = await request(app)
      .get('/v1/content/testimonials?featured=true');

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
    res.body.data.forEach((t: any) => {
      expect(t.isFeatured).toBe(true);
    });
  });

  it('filters testimonials by category', async () => {
    const res = await request(app)
      .get('/v1/content/testimonials?category=KITCHEN');

    expect(res.status).toBe(200);
    res.body.data.forEach((t: any) => {
      expect(t.category).toBe('KITCHEN');
    });
  });

  it('filters testimonials by type (VIDEO)', async () => {
    const res = await request(app)
      .get('/v1/content/testimonials?type=VIDEO');

    expect(res.status).toBe(200);
    res.body.data.forEach((t: any) => {
      expect(t.type).toBe('VIDEO');
    });
  });

  it('retrieves a single testimonial by id', async () => {
    const res = await request(app)
      .get(`/v1/content/testimonials/${testimonialId}`);

    expect(res.status).toBe(200);
    expect(res.body.data.id).toBe(testimonialId);
    expect(res.body.data.customerName).toBe('Sarah Thompson');
  });

  it('updates a testimonial content', async () => {
    const res = await request(app)
      .patch(`/v1/cms/testimonials/${testimonialId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        content: 'Updated: The team at Lomash Wood truly exceeded our expectations with our kitchen transformation.',
        isFeatured: true,
      });

    expect(res.status).toBe(200);
    expect(res.body.data.content).toContain('Updated:');
  });

  it('deactivates a testimonial', async () => {
    const res = await request(app)
      .patch(`/v1/cms/testimonials/${videoTestimonialId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ isActive: false });

    expect(res.status).toBe(200);
    expect(res.body.data.isActive).toBe(false);
  });

  it('deactivated testimonial does not appear publicly', async () => {
    const res = await request(app)
      .get('/v1/content/testimonials');

    expect(res.status).toBe(200);
    const ids = res.body.data.map((t: any) => t.id);
    expect(ids).not.toContain(videoTestimonialId);
  });

  it('reorders testimonials display positions', async () => {
    const testimonialsRes = await request(app)
      .get('/v1/cms/testimonials')
      .set('Authorization', `Bearer ${adminToken}`);

    const items = testimonialsRes.body.data.items;

    const reordered = items.map((t: any, index: number) => ({
      id: t.id,
      displayPosition: items.length - index,
    }));

    const res = await request(app)
      .patch('/v1/cms/testimonials/reorder')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ items: reordered });

    expect(res.status).toBe(200);
  });

  it('admin can list all testimonials including inactive ones', async () => {
    const res = await request(app)
      .get('/v1/cms/testimonials')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data.items)).toBe(true);
    const hasInactive = res.body.data.items.some((t: any) => !t.isActive);
    expect(hasInactive).toBe(true);
  });

  it('validates rating must be between 1 and 5', async () => {
    const res = await request(app)
      .post('/v1/cms/testimonials')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        customerName: 'Invalid Rater',
        rating: 6,
        content: 'Test content',
        type: 'TEXT',
        category: 'KITCHEN',
      });

    expect(res.status).toBe(422);
  });

  it('deletes a testimonial (soft delete)', async () => {
    const res = await request(app)
      .delete(`/v1/cms/testimonials/${testimonialId}`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);

    const deleted = await prisma.testimonial.findUnique({ where: { id: testimonialId } });
    expect(deleted?.deletedAt).toBeTruthy();
  });
});