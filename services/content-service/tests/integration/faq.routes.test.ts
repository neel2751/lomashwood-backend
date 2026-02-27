import request from 'supertest';
import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import { createApp } from '../../src/app';
import { mockAdminToken, mockUserToken } from '../helpers/auth.helper';

jest.mock('../../src/infrastructure/db/prisma.client', () => ({
  prisma: {
    faq: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
    $transaction: jest.fn(),
    $disconnect: jest.fn(),
  },
}));

jest.mock('../../src/infrastructure/cache/redis.client', () => ({
  redis: { get: jest.fn(), set: jest.fn(), del: jest.fn(), quit: jest.fn() },
}));

import { prisma } from '../../src/infrastructure/db/prisma.client';

interface JestMock {
  mockResolvedValue: (val: unknown) => void;
  mockRejectedValue: (val: unknown) => void;
  mockReturnValue: (val: unknown) => void;
  mock: { calls: unknown[][] };
}

const asMock = (fn: unknown): JestMock => fn as JestMock;

const faqFindMany = asMock(prisma.faq.findMany);
const faqFindUnique = asMock(prisma.faq.findUnique);
const faqCreate = asMock(prisma.faq.create);
const faqUpdate = asMock(prisma.faq.update);
const faqDelete = asMock(prisma.faq.delete);
const dbTransaction = asMock(prisma.$transaction);

const app = createApp();

const mockFaq = {
  id: 'faq-1',
  question: 'How long does installation take?',
  answer: 'Typically between 3-5 working days depending on the project complexity.',
  category: 'installation',
  sortOrder: 1,
  isActive: true,
  createdAt: new Date('2025-01-01').toISOString(),
  updatedAt: new Date('2025-01-01').toISOString(),
};

describe('FAQ Routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /v1/faqs', () => {
    it('should return 200 with active FAQs for public requests', async () => {
      faqFindMany.mockResolvedValue([mockFaq]);

      const res = await request(app).get('/v1/faqs');

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data[0]).toHaveProperty('question');
    });

    it('should return only active FAQs for unauthenticated requests', async () => {
      faqFindMany.mockResolvedValue([mockFaq]);

      await request(app).get('/v1/faqs');

      const call = faqFindMany.mock.calls[0][0] as Record<string, unknown>;
      expect(call.where).toHaveProperty('isActive', true);
    });

    it('should support category filter query param', async () => {
      faqFindMany.mockResolvedValue([mockFaq]);

      const res = await request(app).get('/v1/faqs?category=installation');

      expect(res.status).toBe(200);
      const call = faqFindMany.mock.calls[0][0] as Record<string, unknown>;
      expect(call.where).toHaveProperty('category', 'installation');
    });

    it('should return FAQs ordered by sortOrder', async () => {
      faqFindMany.mockResolvedValue([mockFaq]);

      await request(app).get('/v1/faqs');

      const call = faqFindMany.mock.calls[0][0] as Record<string, unknown>;
      expect(call.orderBy).toMatchObject({ sortOrder: 'asc' });
    });

    it('should return empty array when no active FAQs exist', async () => {
      faqFindMany.mockResolvedValue([]);

      const res = await request(app).get('/v1/faqs');

      expect(res.body.data).toHaveLength(0);
    });
  });

  describe('GET /v1/faqs/categories', () => {
    it('should return 200 with distinct FAQ categories', async () => {
      faqFindMany.mockResolvedValue([
        { category: 'installation' },
        { category: 'finance' },
        { category: 'delivery' },
      ]);

      const res = await request(app).get('/v1/faqs/categories');

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data).toContain('installation');
    });
  });

  describe('GET /v1/faqs/search', () => {
    it('should return 200 with matching FAQs', async () => {
      faqFindMany.mockResolvedValue([mockFaq]);

      const res = await request(app).get('/v1/faqs/search?q=installation');

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.data)).toBe(true);
    });

    it('should return 400 when search term is empty', async () => {
      const res = await request(app).get('/v1/faqs/search?q=');

      expect(res.status).toBe(400);
    });

    it('should return 400 when search term query param is missing', async () => {
      const res = await request(app).get('/v1/faqs/search');

      expect(res.status).toBe(400);
    });

    it('should return empty array when no FAQs match search term', async () => {
      faqFindMany.mockResolvedValue([]);

      const res = await request(app).get('/v1/faqs/search?q=xyznotfound');

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveLength(0);
    });
  });

  describe('GET /v1/faqs/:id', () => {
    it('should return 200 with FAQ by id', async () => {
      faqFindUnique.mockResolvedValue(mockFaq);

      const res = await request(app).get('/v1/faqs/faq-1');

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveProperty('question');
    });

    it('should return 404 when FAQ not found', async () => {
      faqFindUnique.mockResolvedValue(null);

      const res = await request(app).get('/v1/faqs/nonexistent');

      expect(res.status).toBe(404);
    });
  });

  describe('POST /v1/faqs', () => {
    const createPayload = {
      question: 'Do you offer finance options?',
      answer: 'Yes, we offer flexible finance plans with 0% APR available.',
      category: 'finance',
      sortOrder: 2,
      isActive: true,
    };

    it('should return 201 with created FAQ using admin token', async () => {
      faqCreate.mockResolvedValue({ ...mockFaq, ...createPayload, id: 'faq-new' });

      const res = await request(app)
        .post('/v1/faqs')
        .set('Authorization', `Bearer ${mockAdminToken}`)
        .send(createPayload);

      expect(res.status).toBe(201);
      expect(res.body.data).toHaveProperty('question', 'Do you offer finance options?');
    });

    it('should return 401 without auth token', async () => {
      const res = await request(app).post('/v1/faqs').send(createPayload);

      expect(res.status).toBe(401);
    });

    it('should return 403 for non-admin user', async () => {
      const res = await request(app)
        .post('/v1/faqs')
        .set('Authorization', `Bearer ${mockUserToken}`)
        .send(createPayload);

      expect(res.status).toBe(403);
    });

    it('should return 400 when question is empty', async () => {
      const res = await request(app)
        .post('/v1/faqs')
        .set('Authorization', `Bearer ${mockAdminToken}`)
        .send({ ...createPayload, question: '' });

      expect(res.status).toBe(400);
    });

    it('should return 400 when answer is empty', async () => {
      const res = await request(app)
        .post('/v1/faqs')
        .set('Authorization', `Bearer ${mockAdminToken}`)
        .send({ ...createPayload, answer: '' });

      expect(res.status).toBe(400);
    });
  });

  describe('PATCH /v1/faqs/:id', () => {
    it('should return 200 and update the FAQ', async () => {
      faqFindUnique.mockResolvedValue(mockFaq);
      faqUpdate.mockResolvedValue({ ...mockFaq, answer: 'Updated answer with more detail.' });

      const res = await request(app)
        .patch('/v1/faqs/faq-1')
        .set('Authorization', `Bearer ${mockAdminToken}`)
        .send({ answer: 'Updated answer with more detail.' });

      expect(res.status).toBe(200);
      expect(res.body.data.answer).toBe('Updated answer with more detail.');
    });

    it('should return 404 when FAQ not found', async () => {
      faqFindUnique.mockResolvedValue(null);

      const res = await request(app)
        .patch('/v1/faqs/nonexistent')
        .set('Authorization', `Bearer ${mockAdminToken}`)
        .send({ answer: 'x' });

      expect(res.status).toBe(404);
    });

    it('should return 401 without auth token', async () => {
      const res = await request(app).patch('/v1/faqs/faq-1').send({ answer: 'x' });

      expect(res.status).toBe(401);
    });
  });

  describe('PATCH /v1/faqs/:id/toggle', () => {
    it('should return 200 and toggle FAQ active state', async () => {
      faqFindUnique.mockResolvedValue(mockFaq);
      faqUpdate.mockResolvedValue({ ...mockFaq, isActive: false });

      const res = await request(app)
        .patch('/v1/faqs/faq-1/toggle')
        .set('Authorization', `Bearer ${mockAdminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.isActive).toBe(false);
    });

    it('should return 404 when FAQ not found', async () => {
      faqFindUnique.mockResolvedValue(null);

      const res = await request(app)
        .patch('/v1/faqs/nonexistent/toggle')
        .set('Authorization', `Bearer ${mockAdminToken}`);

      expect(res.status).toBe(404);
    });
  });

  describe('POST /v1/faqs/reorder', () => {
    it('should return 200 after reordering FAQs', async () => {
      dbTransaction.mockResolvedValue([]);

      const res = await request(app)
        .post('/v1/faqs/reorder')
        .set('Authorization', `Bearer ${mockAdminToken}`)
        .send({ items: [{ id: 'faq-1', sortOrder: 2 }, { id: 'faq-2', sortOrder: 1 }] });

      expect(res.status).toBe(200);
    });

    it('should return 400 for empty items array', async () => {
      const res = await request(app)
        .post('/v1/faqs/reorder')
        .set('Authorization', `Bearer ${mockAdminToken}`)
        .send({ items: [] });

      expect(res.status).toBe(400);
    });

    it('should return 401 without auth token', async () => {
      const res = await request(app)
        .post('/v1/faqs/reorder')
        .send({ items: [{ id: 'faq-1', sortOrder: 1 }] });

      expect(res.status).toBe(401);
    });
  });

  describe('DELETE /v1/faqs/:id', () => {
    it('should return 204 on successful deletion', async () => {
      faqFindUnique.mockResolvedValue(mockFaq);
      faqDelete.mockResolvedValue(mockFaq);

      const res = await request(app)
        .delete('/v1/faqs/faq-1')
        .set('Authorization', `Bearer ${mockAdminToken}`);

      expect(res.status).toBe(204);
    });

    it('should return 404 when FAQ not found', async () => {
      faqFindUnique.mockResolvedValue(null);

      const res = await request(app)
        .delete('/v1/faqs/nonexistent')
        .set('Authorization', `Bearer ${mockAdminToken}`);

      expect(res.status).toBe(404);
    });

    it('should return 401 without auth token', async () => {
      const res = await request(app).delete('/v1/faqs/faq-1');

      expect(res.status).toBe(401);
    });

    it('should return 403 for non-admin user', async () => {
      const res = await request(app)
        .delete('/v1/faqs/faq-1')
        .set('Authorization', `Bearer ${mockUserToken}`);

      expect(res.status).toBe(403);
    });
  });
});