import request from 'supertest';
import { Application } from 'express';
import { createApp } from '../../src/app';
import { prisma } from '../../src/infrastructure/db/prisma.client';
import * as bcrypt from 'bcrypt';

const db = prisma as unknown as Record<string, any>;

async function createUser(data: {
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  password?: string;
  isActive?: boolean;
  emailVerified?: boolean;
}) {
  const hashed = await bcrypt.hash(data.password ?? 'Password123!', 10);
  return db['user'].create({
    data: {
      email: data.email,
      password: hashed,
      firstName: data.firstName,
      lastName: data.lastName,
      phone: data.phone ?? '+1234567890',
      isActive: data.isActive ?? true,
      emailVerified: data.emailVerified ?? true,
    },
  });
}

describe('Session Routes Integration Tests', () => {
  let app: Application;

  beforeAll(async () => {
    app = createApp();
    await prisma.$connect();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  beforeEach(async () => {
    await db['userRole'].deleteMany().catch(() => {});
    await db['session'].deleteMany();
    await db['user'].deleteMany();
    await db['role'].deleteMany();
  });

  describe('GET /v1/sessions', () => {
    let authToken: string;
    let userId: string;

    beforeEach(async () => {
      const user = await createUser({ email: 'session@example.com', firstName: 'Session', lastName: 'User' });
      userId = user.id;

      const loginResponse = await request(app)
        .post('/v1/auth/login')
        .send({ email: 'session@example.com', password: 'Password123!' });
      authToken = loginResponse.body.data.token;
    });

    it('should get all active sessions for authenticated user', async () => {
      await request(app)
        .post('/v1/auth/login')
        .send({ email: 'session@example.com', password: 'Password123!' });

      const response = await request(app)
        .get('/v1/sessions')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(Array.isArray(response.body.data.sessions)).toBe(true);
      expect(response.body.data.sessions.length).toBeGreaterThanOrEqual(2);
    });

    it('should return sessions with required fields', async () => {
      const response = await request(app)
        .get('/v1/sessions')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      const session = response.body.data.sessions[0];
      expect(session).toHaveProperty('id');
      expect(session).toHaveProperty('userId');
      expect(session).toHaveProperty('ipAddress');
      expect(session).toHaveProperty('userAgent');
      expect(session).toHaveProperty('createdAt');
      expect(session).toHaveProperty('expiresAt');
      expect(session).not.toHaveProperty('token');
    });

    it('should fail without authentication', async () => {
      const response = await request(app).get('/v1/sessions').expect(401);
      expect(response.body).toHaveProperty('success', false);
      expect(response.body.error.message).toContain('unauthorized');
    });

    it('should fail with invalid token', async () => {
      const response = await request(app)
        .get('/v1/sessions')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);
      expect(response.body).toHaveProperty('success', false);
    });

    it('should return empty array when no sessions exist', async () => {
      await db['session'].deleteMany({ where: { userId } });

      const newLoginResponse = await request(app)
        .post('/v1/auth/login')
        .send({ email: 'session@example.com', password: 'Password123!' });
      const newToken = newLoginResponse.body.data.token;

      await db['session'].deleteMany({ where: { userId } });

      const response = await request(app)
        .get('/v1/sessions')
        .set('Authorization', `Bearer ${newToken}`)
        .expect(200);

      expect(response.body.data.sessions).toEqual([]);
    });

    it('should mark current session in response', async () => {
      const response = await request(app)
        .get('/v1/sessions')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      const currentSession = response.body.data.sessions.find((s: any) => s.isCurrent === true);
      expect(currentSession).toBeTruthy();
    });

    it('should paginate sessions correctly', async () => {
      for (let i = 0; i < 5; i++) {
        await request(app)
          .post('/v1/auth/login')
          .send({ email: 'session@example.com', password: 'Password123!' });
      }

      const response = await request(app)
        .get('/v1/sessions?page=1&limit=3')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.data).toHaveProperty('pagination');
      expect(response.body.data.pagination.page).toBe(1);
      expect(response.body.data.pagination.limit).toBe(3);
      expect(response.body.data.sessions.length).toBeLessThanOrEqual(3);
    });
  });

  describe('GET /v1/sessions/:id', () => {
    let authToken: string;
    let userId: string;
    let sessionId: string;

    beforeEach(async () => {
      const user = await createUser({ email: 'detail@example.com', firstName: 'Detail', lastName: 'User' });
      userId = user.id;

      const loginResponse = await request(app)
        .post('/v1/auth/login')
        .send({ email: 'detail@example.com', password: 'Password123!' });
      authToken = loginResponse.body.data.token;

      const session = await db['session'].findFirst({ where: { userId } });
      sessionId = session.id;
    });

    it('should get session details by id', async () => {
      const response = await request(app)
        .get(`/v1/sessions/${sessionId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data.session.id).toBe(sessionId);
      expect(response.body.data.session.userId).toBe(userId);
    });

    it('should fail to get session of another user', async () => {
      await createUser({ email: 'other@example.com', firstName: 'Other', lastName: 'User', phone: '+1234567891' });

      const otherLoginResponse = await request(app)
        .post('/v1/auth/login')
        .send({ email: 'other@example.com', password: 'Password123!' });
      const otherToken = otherLoginResponse.body.data.token;

      const response = await request(app)
        .get(`/v1/sessions/${sessionId}`)
        .set('Authorization', `Bearer ${otherToken}`)
        .expect(403);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body.error.message).toContain('access');
    });

    it('should fail with non-existent session id', async () => {
      const response = await request(app)
        .get('/v1/sessions/non-existent-id')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body.error.message).toContain('not found');
    });

    it('should fail without authentication', async () => {
      const response = await request(app).get(`/v1/sessions/${sessionId}`).expect(401);
      expect(response.body).toHaveProperty('success', false);
    });
  });

  describe('DELETE /v1/sessions/:id', () => {
    let authToken: string;
    let userId: string;
    let sessionId: string;
    let otherSessionId: string;

    beforeEach(async () => {
      const user = await createUser({ email: 'delete@example.com', firstName: 'Delete', lastName: 'User' });
      userId = user.id;

      const loginResponse1 = await request(app)
        .post('/v1/auth/login')
        .send({ email: 'delete@example.com', password: 'Password123!' });
      authToken = loginResponse1.body.data.token;

      await request(app)
        .post('/v1/auth/login')
        .send({ email: 'delete@example.com', password: 'Password123!' });

      const sessions = await db['session'].findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
      });

      sessionId      = sessions[0].id;
      otherSessionId = sessions[1].id;
    });

    it('should revoke a specific session', async () => {
      const response = await request(app)
        .delete(`/v1/sessions/${otherSessionId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.message).toContain('revoked');

      const deletedSession = await db['session'].findUnique({ where: { id: otherSessionId } });
      expect(deletedSession).toBeNull();
    });

    it('should fail to revoke current session', async () => {
      const response = await request(app)
        .delete(`/v1/sessions/${sessionId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body.error.message).toContain('current session');

      const currentSession = await db['session'].findUnique({ where: { id: sessionId } });
      expect(currentSession).toBeTruthy();
    });

    it('should fail to revoke session of another user', async () => {
      const otherUser = await createUser({
        email: 'other-delete@example.com',
        firstName: 'Other',
        lastName: 'Delete',
        phone: '+1234567891',
      });

      const otherSession = await db['session'].create({
        data: {
          userId: otherUser.id,
          token: 'other-session-token',
          ipAddress: '192.168.1.1',
          userAgent: 'Test Agent',
          expiresAt: new Date(Date.now() + 86400000),
        },
      });

      const response = await request(app)
        .delete(`/v1/sessions/${otherSession.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(403);

      expect(response.body).toHaveProperty('success', false);
    });

    it('should fail with non-existent session id', async () => {
      const response = await request(app)
        .delete('/v1/sessions/non-existent-id')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);

      expect(response.body).toHaveProperty('success', false);
    });

    it('should fail without authentication', async () => {
      const response = await request(app)
        .delete(`/v1/sessions/${otherSessionId}`)
        .expect(401);
      expect(response.body).toHaveProperty('success', false);
    });
  });

  describe('DELETE /v1/sessions', () => {
    let authToken: string;
    let userId: string;

    beforeEach(async () => {
      const user = await createUser({ email: 'revoke@example.com', firstName: 'Revoke', lastName: 'User' });
      userId = user.id;

      const loginResponse = await request(app)
        .post('/v1/auth/login')
        .send({ email: 'revoke@example.com', password: 'Password123!' });
      authToken = loginResponse.body.data.token;

      for (let i = 0; i < 3; i++) {
        await request(app)
          .post('/v1/auth/login')
          .send({ email: 'revoke@example.com', password: 'Password123!' });
      }
    });

    it('should revoke all sessions except current', async () => {
      const sessionsBeforeCount = await db['session'].count({ where: { userId } });
      expect(sessionsBeforeCount).toBeGreaterThan(1);

      const response = await request(app)
        .delete('/v1/sessions')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.message).toContain('All other sessions revoked');

      const sessionsAfterCount = await db['session'].count({ where: { userId } });
      expect(sessionsAfterCount).toBe(1);
    });

    it('should keep current session active', async () => {
      await request(app)
        .delete('/v1/sessions')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      const meResponse = await request(app)
        .get('/v1/auth/me')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(meResponse.body).toHaveProperty('success', true);
    });

    it('should fail without authentication', async () => {
      const response = await request(app).delete('/v1/sessions').expect(401);
      expect(response.body).toHaveProperty('success', false);
    });

    it('should handle user with only one session', async () => {
      await db['session'].deleteMany({ where: { userId } });

      const newLoginResponse = await request(app)
        .post('/v1/auth/login')
        .send({ email: 'revoke@example.com', password: 'Password123!' });
      const newToken = newLoginResponse.body.data.token;

      const response = await request(app)
        .delete('/v1/sessions')
        .set('Authorization', `Bearer ${newToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);

      const remainingSessions = await db['session'].count({ where: { userId } });
      expect(remainingSessions).toBe(1);
    });
  });

  describe('POST /v1/sessions/refresh', () => {
    let authToken: string;
    let userId: string;

    beforeEach(async () => {
      const user = await createUser({ email: 'refresh@example.com', firstName: 'Refresh', lastName: 'User' });
      userId = user.id;

      const loginResponse = await request(app)
        .post('/v1/auth/login')
        .send({ email: 'refresh@example.com', password: 'Password123!' });
      authToken = loginResponse.body.data.token;
    });

    it('should refresh session token successfully', async () => {
      const response = await request(app)
        .post('/v1/sessions/refresh')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toHaveProperty('token');
      expect(response.body.data.token).not.toBe(authToken);
    });

    it('should extend session expiry time', async () => {
      const sessionBefore = await db['session'].findFirst({ where: { userId } });
      const expiryBefore: Date = sessionBefore.expiresAt;

      await new Promise((resolve) => setTimeout(resolve, 100));

      await request(app)
        .post('/v1/sessions/refresh')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      const sessionAfter = await db['session'].findFirst({ where: { userId } });
      expect(sessionAfter.expiresAt.getTime()).toBeGreaterThan(expiryBefore.getTime());
    });

    it('should fail without authentication', async () => {
      const response = await request(app).post('/v1/sessions/refresh').expect(401);
      expect(response.body).toHaveProperty('success', false);
    });

    it('should fail with invalid token', async () => {
      const response = await request(app)
        .post('/v1/sessions/refresh')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);
      expect(response.body).toHaveProperty('success', false);
    });

    it('should fail if session is expired', async () => {
      const session = await db['session'].findFirst({ where: { userId } });

      await db['session'].update({
        where: { id: session.id },
        data: { expiresAt: new Date(Date.now() - 1000) },
      });

      const response = await request(app)
        .post('/v1/sessions/refresh')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(401);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body.error.message).toContain('expired');
    });

    it('should update last activity timestamp', async () => {
      const sessionBefore = await db['session'].findFirst({ where: { userId } });
      const lastActiveBefore: Date | null = sessionBefore.lastActiveAt ?? null;

      await new Promise((resolve) => setTimeout(resolve, 100));

      await request(app)
        .post('/v1/sessions/refresh')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      const sessionAfter = await db['session'].findFirst({ where: { userId } });
      const lastActiveAfter: Date | null = sessionAfter.lastActiveAt ?? null;

      if (lastActiveBefore && lastActiveAfter) {
        expect(lastActiveAfter.getTime()).toBeGreaterThan(lastActiveBefore.getTime());
      }
    });
  });

  describe('GET /v1/sessions/active', () => {
    let authToken: string;
    let userId: string;

    beforeEach(async () => {
      const user = await createUser({ email: 'active@example.com', firstName: 'Active', lastName: 'User' });
      userId = user.id;

      const loginResponse = await request(app)
        .post('/v1/auth/login')
        .send({ email: 'active@example.com', password: 'Password123!' });
      authToken = loginResponse.body.data.token;
    });

    it('should return count of active sessions', async () => {
      for (let i = 0; i < 3; i++) {
        await request(app)
          .post('/v1/auth/login')
          .send({ email: 'active@example.com', password: 'Password123!' });
      }

      const response = await request(app)
        .get('/v1/sessions/active')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toHaveProperty('count');
      expect(response.body.data.count).toBeGreaterThanOrEqual(4);
    });

    it('should not count expired sessions', async () => {
      await db['session'].create({
        data: {
          userId,
          token: 'expired-token',
          ipAddress: '192.168.1.1',
          userAgent: 'Test Agent',
          expiresAt: new Date(Date.now() - 1000),
        },
      });

      const response = await request(app)
        .get('/v1/sessions/active')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      const totalSessions = await db['session'].count({ where: { userId } });
      expect(response.body.data.count).toBeLessThan(totalSessions);
    });

    it('should fail without authentication', async () => {
      const response = await request(app).get('/v1/sessions/active').expect(401);
      expect(response.body).toHaveProperty('success', false);
    });
  });
});