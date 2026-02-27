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

describe('FAQ Management Flow', () => {
  let faqCategoryId: string;
  let faqId: string;

  it('creates a FAQ category', async () => {
    const res = await request(app)
      .post('/v1/cms/faq-categories')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: 'Kitchen Design',
        slug: 'kitchen-design',
        position: 1,
        isActive: true,
      });

    expect(res.status).toBe(201);
    expect(res.body.data.name).toBe('Kitchen Design');
    faqCategoryId = res.body.data.id;
  });

  it('creates a FAQ entry within a category', async () => {
    const res = await request(app)
      .post('/v1/cms/faqs')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        question: 'How long does a kitchen installation take?',
        answer: '<p>A typical kitchen installation takes between 3 to 7 days depending on the size and complexity of the project. Our expert team will provide a precise timeline during your consultation.</p>',
        categoryId: faqCategoryId,
        position: 1,
        isActive: true,
      });

    expect(res.status).toBe(201);
    expect(res.body.data.question).toContain('How long');
    expect(res.body.data.categoryId).toBe(faqCategoryId);
    faqId = res.body.data.id;
  });

  it('creates multiple FAQs for the same category', async () => {
    const faqs = [
      {
        question: 'What kitchen styles do you offer?',
        answer: '<p>We offer a wide range of kitchen styles including modern, traditional, shaker, and contemporary designs.</p>',
        categoryId: faqCategoryId,
        position: 2,
        isActive: true,
      },
      {
        question: 'Do you offer finance options for kitchens?',
        answer: '<p>Yes, we offer flexible finance options to help spread the cost of your new kitchen. Visit our Finance page for more details.</p>',
        categoryId: faqCategoryId,
        position: 3,
        isActive: true,
      },
      {
        question: 'Can I book a free consultation?',
        answer: '<p>Absolutely! You can book a free consultation online, at one of our showrooms, or we can arrange a home visit at a time convenient for you.</p>',
        categoryId: faqCategoryId,
        position: 4,
        isActive: true,
      },
    ];

    for (const faq of faqs) {
      const res = await request(app)
        .post('/v1/cms/faqs')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(faq);

      expect(res.status).toBe(201);
    }
  });

  it('retrieves all FAQs publicly with categories', async () => {
    const res = await request(app)
      .get('/v1/content/faqs');

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBeGreaterThanOrEqual(1);
  });

  it('retrieves FAQs by category publicly', async () => {
    const res = await request(app)
      .get(`/v1/content/faqs?categoryId=${faqCategoryId}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
    res.body.data.forEach((faq: any) => {
      expect(faq.categoryId).toBe(faqCategoryId);
    });
  });

  it('updates a FAQ entry', async () => {
    const res = await request(app)
      .patch(`/v1/cms/faqs/${faqId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        answer: '<p>Updated: A typical kitchen installation takes between 3 to 10 days depending on the complexity and scope of your project.</p>',
      });

    expect(res.status).toBe(200);
    expect(res.body.data.answer).toContain('Updated:');
  });

  it('reorders FAQ entries within a category', async () => {
    const faqsRes = await request(app)
      .get(`/v1/cms/faqs?categoryId=${faqCategoryId}`)
      .set('Authorization', `Bearer ${adminToken}`);

    const faqIds = faqsRes.body.data.items.map((f: any) => ({ id: f.id, position: f.position }));

    const reordered = faqIds.map((f: any, index: number) => ({
      id: f.id,
      position: faqIds.length - index,
    }));

    const res = await request(app)
      .patch('/v1/cms/faqs/reorder')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ items: reordered });

    expect(res.status).toBe(200);
  });

  it('deactivates a FAQ entry', async () => {
    const res = await request(app)
      .patch(`/v1/cms/faqs/${faqId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ isActive: false });

    expect(res.status).toBe(200);
    expect(res.body.data.isActive).toBe(false);
  });

  it('inactive FAQ does not appear in public listing', async () => {
    const res = await request(app)
      .get('/v1/content/faqs');

    expect(res.status).toBe(200);
    const foundFaq = res.body.data.find((f: any) => f.id === faqId);
    expect(foundFaq).toBeUndefined();
  });

  it('searches FAQs by keyword', async () => {
    const res = await request(app)
      .get('/v1/content/faqs?search=installation');

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  it('creates a bedroom FAQ category', async () => {
    const res = await request(app)
      .post('/v1/cms/faq-categories')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: 'Bedroom Design',
        slug: 'bedroom-design',
        position: 2,
        isActive: true,
      });

    expect(res.status).toBe(201);
    expect(res.body.data.name).toBe('Bedroom Design');
  });

  it('lists all FAQ categories in CMS', async () => {
    const res = await request(app)
      .get('/v1/cms/faq-categories')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.items.length).toBeGreaterThanOrEqual(2);
  });

  it('validates required fields on FAQ creation', async () => {
    const res = await request(app)
      .post('/v1/cms/faqs')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        question: '',
        answer: '',
        categoryId: faqCategoryId,
      });

    expect(res.status).toBe(422);
  });

  it('deletes a FAQ entry', async () => {
    const res = await request(app)
      .delete(`/v1/cms/faqs/${faqId}`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
  });

  it('deletes a FAQ category and cascades to its items', async () => {
    const res = await request(app)
      .delete(`/v1/cms/faq-categories/${faqCategoryId}`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
  });
});