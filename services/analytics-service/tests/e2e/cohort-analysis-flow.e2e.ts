
/// <reference types="jest" />
import request from 'supertest';
import { PrismaClient } from '@prisma/client';
import app from '../../src/app';

const prisma = new PrismaClient();

describe('[E2E] Cohort Analysis Flow', () => {
  const BASE = '/api/v1/analytics/cohorts';
  let cohortId: string;

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('should create a cohort and retrieve retention data', async () => {
    const createRes = await request(app)
      .post(BASE)
      .set('Authorization', `Bearer ${process.env.E2E_ADMIN_TOKEN}`)
      .send({
        name: 'E2E Feb 2026 Signups',
        description: 'Users who registered in February 2026',
        criteria: {
          event: 'user_registered',
          from: '2026-02-01T00:00:00.000Z',
          to: '2026-02-28T23:59:59.999Z',
        },
        granularity: 'WEEKLY',
      })
      .expect(201);

    expect(createRes.body.data.name).toBe('E2E Feb 2026 Signups');
    cohortId = createRes.body.data.id;

    const retentionRes = await request(app)
      .get(`${BASE}/${cohortId}/retention`)
      .set('Authorization', `Bearer ${process.env.E2E_ADMIN_TOKEN}`)
      .expect(200);

    expect(retentionRes.body.data).toHaveProperty('cohortSize');
    expect(retentionRes.body.data).toHaveProperty('retentionTable');
    expect(Array.isArray(retentionRes.body.data.retentionTable)).toBe(true);
  });

  it('should list all cohorts and find the created one', async () => {
    const res = await request(app)
      .get(BASE)
      .set('Authorization', `Bearer ${process.env.E2E_ADMIN_TOKEN}`)
      .query({ page: 1, limit: 20 })
      .expect(200);

    const found = res.body.data.items.find((c: { id: string }) => c.id === cohortId);
    expect(found).not.toBeUndefined();
  });

  it('should return 400 for cohort with invalid granularity', async () => {
    const res = await request(app)
      .post(BASE)
      .set('Authorization', `Bearer ${process.env.E2E_ADMIN_TOKEN}`)
      .send({
        name: 'Bad Granularity Cohort',
        criteria: { event: 'user_registered', from: '2026-01-01', to: '2026-01-31' },
        granularity: 'MINUTELY',
      })
      .expect(400);

    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('should delete the cohort and confirm removal', async () => {
    await request(app)
      .delete(`${BASE}/${cohortId}`)
      .set('Authorization', `Bearer ${process.env.E2E_ADMIN_TOKEN}`)
      .expect(200);

    await request(app)
      .get(`${BASE}/${cohortId}`)
      .set('Authorization', `Bearer ${process.env.E2E_ADMIN_TOKEN}`)
      .expect(404);
  });
});