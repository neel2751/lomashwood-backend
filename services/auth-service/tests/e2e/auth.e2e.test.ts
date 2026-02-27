import request from 'supertest';
import { Application } from 'express';
import { createApp } from '../../src/app';
import { prisma } from '../../src/infrastructure/db/prisma.client';
import * as bcrypt from 'bcrypt';

const db = prisma as unknown as Record<string, any>;

async function createTestUser(data: {
  email: string;
  firstName: string;
  lastName: string;
  password?: string;
  isActive?: boolean;
  emailVerified?: boolean;
  phone?: string;
}) {
  const hashedPassword = await bcrypt.hash(data.password ?? 'SecurePass123!', 10);
  return db['user'].create({
    data: {
      email: data.email,
      password: hashedPassword,
      firstName: data.firstName,
      lastName: data.lastName,
      phone: data.phone ?? '+1234567890',
      isActive: data.isActive ?? true,
      emailVerified: data.emailVerified ?? true,
    },
  });
}

async function getLatestResetToken(
  userId: string,
): Promise<{ id: string; token: string; expiresAt: Date } | null> {

  return db['passwordResetToken'].findFirst({
    where: { userId, isUsed: false },
    orderBy: { createdAt: 'desc' },
    select: { id: true, token: true, expiresAt: true },
  });
}

describe('Auth E2E Tests', () => {
  let app: Application;

  beforeAll(async () => {
    app = createApp();
    await prisma.$connect();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  beforeEach(async () => {
    await db['passwordResetToken'].deleteMany().catch(() => {});
    await db['session'].deleteMany();
    await db['user'].deleteMany();
    await db['role'].deleteMany();
  });

  describe('Complete User Registration Flow', () => {
    it('should complete full registration and login flow', async () => {
      const userData = {
        email: 'newuser@example.com',
        password: 'SecurePass123!',
        firstName: 'John',
        lastName: 'Doe',
        phone: '+1234567890',
      };

      const registerResponse = await request(app)
        .post('/v1/auth/register')
        .send(userData)
        .expect(201);

      expect(registerResponse.body.success).toBe(true);
      expect(registerResponse.body.data.user.email).toBe(userData.email);
      expect(registerResponse.body.data.token).toBeDefined();

      const token: string = registerResponse.body.data.token;

      const meResponse = await request(app)
        .get('/v1/auth/me')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(meResponse.body.data.user.email).toBe(userData.email);

      const user = await db['user'].findUnique({
        where: { email: userData.email },
        include: { sessions: true },
      });

      expect(user).toBeTruthy();
      expect(user.sessions.length).toBeGreaterThan(0);
    });

    it('should prevent duplicate registration and allow login with existing account', async () => {
      const userData = {
        email: 'existing@example.com',
        password: 'SecurePass123!',
        firstName: 'Jane',
        lastName: 'Doe',
        phone: '+1234567890',
      };

      await request(app).post('/v1/auth/register').send(userData).expect(201);
      await request(app).post('/v1/auth/register').send(userData).expect(409);

      const loginResponse = await request(app)
        .post('/v1/auth/login')
        .send({ email: userData.email, password: userData.password })
        .expect(200);

      expect(loginResponse.body.success).toBe(true);
      expect(loginResponse.body.data.token).toBeDefined();
    });

    it('should validate all registration fields and provide clear errors', async () => {
      const invalidEmailResponse = await request(app)
        .post('/v1/auth/register')
        .send({ email: 'invalid-email', password: 'SecurePass123!', firstName: 'John', lastName: 'Doe', phone: '+1234567890' })
        .expect(400);
      expect(invalidEmailResponse.body.success).toBe(false);

      const weakPasswordResponse = await request(app)
        .post('/v1/auth/register')
        .send({ email: 'valid@example.com', password: '123', firstName: 'John', lastName: 'Doe', phone: '+1234567890' })
        .expect(400);
      expect(weakPasswordResponse.body.success).toBe(false);

      const missingFieldsResponse = await request(app)
        .post('/v1/auth/register')
        .send({ email: 'valid@example.com' })
        .expect(400);
      expect(missingFieldsResponse.body.success).toBe(false);
    });
  });

  describe('Complete Login and Session Management Flow', () => {
    beforeEach(async () => {
      await createTestUser({ email: 'loginuser@example.com', firstName: 'Login', lastName: 'User' });
    });

    it('should login, access protected routes, and logout successfully', async () => {
      const loginResponse = await request(app)
        .post('/v1/auth/login')
        .send({ email: 'loginuser@example.com', password: 'SecurePass123!' })
        .expect(200);

      expect(loginResponse.body.success).toBe(true);
      const token: string = loginResponse.body.data.token;

      const meResponse = await request(app)
        .get('/v1/auth/me')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);
      expect(meResponse.body.data.user.email).toBe('loginuser@example.com');

      const sessionsResponse = await request(app)
        .get('/v1/sessions')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);
      expect(sessionsResponse.body.data.sessions.length).toBeGreaterThan(0);

      await request(app).post('/v1/auth/logout').set('Authorization', `Bearer ${token}`).expect(200);
      await request(app).get('/v1/auth/me').set('Authorization', `Bearer ${token}`).expect(401);
    });

    it('should handle multiple concurrent sessions', async () => {
      const session1Response = await request(app)
        .post('/v1/auth/login')
        .send({ email: 'loginuser@example.com', password: 'SecurePass123!' })
        .expect(200);
      const token1: string = session1Response.body.data.token;

      const session2Response = await request(app)
        .post('/v1/auth/login')
        .send({ email: 'loginuser@example.com', password: 'SecurePass123!' })
        .expect(200);
      const token2: string = session2Response.body.data.token;

      const sessions1 = await request(app)
        .get('/v1/sessions')
        .set('Authorization', `Bearer ${token1}`)
        .expect(200);
      expect(sessions1.body.data.sessions.length).toBe(2);

      const sessions2 = await request(app)
        .get('/v1/sessions')
        .set('Authorization', `Bearer ${token2}`)
        .expect(200);
      expect(sessions2.body.data.sessions.length).toBe(2);

      await request(app).post('/v1/auth/logout').set('Authorization', `Bearer ${token1}`).expect(200);
      await request(app).get('/v1/auth/me').set('Authorization', `Bearer ${token1}`).expect(401);
      await request(app).get('/v1/auth/me').set('Authorization', `Bearer ${token2}`).expect(200);
    });

    it('should revoke all other sessions except current', async () => {
      const session1 = await request(app)
        .post('/v1/auth/login')
        .send({ email: 'loginuser@example.com', password: 'SecurePass123!' });
      const token1: string = session1.body.data.token;

      const session2 = await request(app)
        .post('/v1/auth/login')
        .send({ email: 'loginuser@example.com', password: 'SecurePass123!' });
      const token2: string = session2.body.data.token;

      const session3 = await request(app)
        .post('/v1/auth/login')
        .send({ email: 'loginuser@example.com', password: 'SecurePass123!' });
      const token3: string = session3.body.data.token;

      await request(app).delete('/v1/sessions').set('Authorization', `Bearer ${token2}`).expect(200);
      await request(app).get('/v1/auth/me').set('Authorization', `Bearer ${token1}`).expect(401);
      await request(app).get('/v1/auth/me').set('Authorization', `Bearer ${token2}`).expect(200);
      await request(app).get('/v1/auth/me').set('Authorization', `Bearer ${token3}`).expect(401);
    });

    it('should refresh session token and extend expiry', async () => {
      const loginResponse = await request(app)
        .post('/v1/auth/login')
        .send({ email: 'loginuser@example.com', password: 'SecurePass123!' })
        .expect(200);

      const originalToken: string = loginResponse.body.data.token;

      const user = await db['user'].findUnique({ where: { email: 'loginuser@example.com' } });
      expect(user).toBeTruthy();

      const sessionBefore = await db['session'].findFirst({ where: { userId: user.id } });

      await new Promise((resolve) => setTimeout(resolve, 100));

      const refreshResponse = await request(app)
        .post('/v1/sessions/refresh')
        .set('Authorization', `Bearer ${originalToken}`)
        .expect(200);

      const newToken: string = refreshResponse.body.data.token;
      expect(newToken).toBeDefined();

      const sessionAfter = await db['session'].findFirst({ where: { userId: user.id } });
      expect(sessionAfter.expiresAt.getTime()).toBeGreaterThan(sessionBefore.expiresAt.getTime());

      await request(app).get('/v1/auth/me').set('Authorization', `Bearer ${newToken}`).expect(200);
    });
  });

  describe('Complete Password Reset Flow', () => {
    beforeEach(async () => {
      await createTestUser({
        email: 'reset@example.com',
        firstName: 'Reset',
        lastName: 'User',
        password: 'OldPassword123!',
      });
    });

    it('should complete full password reset flow', async () => {
      await request(app)
        .post('/v1/auth/login')
        .send({ email: 'reset@example.com', password: 'OldPassword123!' })
        .expect(200);

      const forgotResponse = await request(app)
        .post('/v1/auth/forgot-password')
        .send({ email: 'reset@example.com' })
        .expect(200);
      expect(forgotResponse.body.success).toBe(true);

      const user = await db['user'].findUnique({ where: { email: 'reset@example.com' } });
      expect(user).toBeTruthy();

      const resetRecord = await getLatestResetToken(user.id);
      expect(resetRecord).toBeTruthy();
      expect(resetRecord!.token).toBeTruthy();
      expect(resetRecord!.expiresAt).toBeTruthy();

      const resetToken: string = resetRecord!.token;

      const resetResponse = await request(app)
        .post('/v1/auth/reset-password')
        .send({ token: resetToken, password: 'NewPassword123!' })
        .expect(200);
      expect(resetResponse.body.success).toBe(true);

      await request(app)
        .post('/v1/auth/login')
        .send({ email: 'reset@example.com', password: 'OldPassword123!' })
        .expect(401);

      const newLoginResponse = await request(app)
        .post('/v1/auth/login')
        .send({ email: 'reset@example.com', password: 'NewPassword123!' })
        .expect(200);
      expect(newLoginResponse.body.success).toBe(true);
      expect(newLoginResponse.body.data.token).toBeDefined();

      const usedRecord = await db['passwordResetToken'].findFirst({ where: { token: resetToken } });
      expect(usedRecord.isUsed).toBe(true);
    });

    it('should prevent using expired reset token', async () => {
      await request(app)
        .post('/v1/auth/forgot-password')
        .send({ email: 'reset@example.com' })
        .expect(200);

      const user = await db['user'].findUnique({ where: { email: 'reset@example.com' } });
      expect(user).toBeTruthy();

      const resetRecord = await getLatestResetToken(user.id);
      expect(resetRecord).toBeTruthy();
      const resetToken: string = resetRecord!.token;

      await db['passwordResetToken'].update({
        where: { id: resetRecord!.id },
        data: { expiresAt: new Date(Date.now() - 1000) },
      });

      await request(app)
        .post('/v1/auth/reset-password')
        .send({ token: resetToken, password: 'NewPassword123!' })
        .expect(400);

      await request(app)
        .post('/v1/auth/login')
        .send({ email: 'reset@example.com', password: 'NewPassword123!' })
        .expect(401);

      await request(app)
        .post('/v1/auth/login')
        .send({ email: 'reset@example.com', password: 'OldPassword123!' })
        .expect(200);
    });

    it('should prevent reusing reset token after password change', async () => {
      await request(app)
        .post('/v1/auth/forgot-password')
        .send({ email: 'reset@example.com' })
        .expect(200);

      const user = await db['user'].findUnique({ where: { email: 'reset@example.com' } });
      expect(user).toBeTruthy();

      const resetRecord = await getLatestResetToken(user.id);
      expect(resetRecord).toBeTruthy();
      const resetToken: string = resetRecord!.token;

      await request(app)
        .post('/v1/auth/reset-password')
        .send({ token: resetToken, password: 'NewPassword123!' })
        .expect(200);

      await request(app)
        .post('/v1/auth/reset-password')
        .send({ token: resetToken, password: 'AnotherPassword123!' })
        .expect(400);

      await request(app)
        .post('/v1/auth/login')
        .send({ email: 'reset@example.com', password: 'NewPassword123!' })
        .expect(200);
    });
  });

  describe('Account Security and Access Control Flow', () => {
    beforeEach(async () => {
      await createTestUser({ email: 'security@example.com', firstName: 'Security', lastName: 'User' });
    });

    it('should prevent login for inactive accounts', async () => {
      const loginResponse1 = await request(app)
        .post('/v1/auth/login')
        .send({ email: 'security@example.com', password: 'SecurePass123!' })
        .expect(200);
      expect(loginResponse1.body.success).toBe(true);

      await db['user'].update({ where: { email: 'security@example.com' }, data: { isActive: false } });

      await request(app)
        .post('/v1/auth/login')
        .send({ email: 'security@example.com', password: 'SecurePass123!' })
        .expect(403);
    });

    it('should prevent login for unverified accounts', async () => {
      await createTestUser({
        email: 'unverified@example.com',
        firstName: 'Unverified',
        lastName: 'User',
        phone: '+1234567891',
        emailVerified: false,
      });

      await request(app)
        .post('/v1/auth/login')
        .send({ email: 'unverified@example.com', password: 'SecurePass123!' })
        .expect(403);
    });

    it('should invalidate existing sessions when account is deactivated', async () => {
      const loginResponse = await request(app)
        .post('/v1/auth/login')
        .send({ email: 'security@example.com', password: 'SecurePass123!' })
        .expect(200);
      const token: string = loginResponse.body.data.token;

      await request(app).get('/v1/auth/me').set('Authorization', `Bearer ${token}`).expect(200);

      await db['user'].update({ where: { email: 'security@example.com' }, data: { isActive: false } });

      await request(app).get('/v1/auth/me').set('Authorization', `Bearer ${token}`).expect(403);
    });

    it('should handle login attempts with wrong credentials gracefully', async () => {
      for (let i = 0; i < 5; i++) {
        await request(app)
          .post('/v1/auth/login')
          .send({ email: 'security@example.com', password: 'WrongPassword123!' })
          .expect(401);
      }

      await request(app)
        .post('/v1/auth/login')
        .send({ email: 'security@example.com', password: 'SecurePass123!' })
        .expect(200);
    });
  });

  describe('Cross-Session and Multi-Device Flow', () => {
    beforeEach(async () => {
      await createTestUser({ email: 'multidevice@example.com', firstName: 'Multi', lastName: 'Device' });
    });

    it('should manage sessions from multiple devices independently', async () => {
      const desktopLogin = await request(app)
        .post('/v1/auth/login')
        .set('User-Agent', 'Desktop Browser')
        .send({ email: 'multidevice@example.com', password: 'SecurePass123!' })
        .expect(200);
      const desktopToken: string = desktopLogin.body.data.token;

      const mobileLogin = await request(app)
        .post('/v1/auth/login')
        .set('User-Agent', 'Mobile App')
        .send({ email: 'multidevice@example.com', password: 'SecurePass123!' })
        .expect(200);
      const mobileToken: string = mobileLogin.body.data.token;

      const tabletLogin = await request(app)
        .post('/v1/auth/login')
        .set('User-Agent', 'Tablet Browser')
        .send({ email: 'multidevice@example.com', password: 'SecurePass123!' })
        .expect(200);
      const tabletToken: string = tabletLogin.body.data.token;

      const sessionsResponse = await request(app)
        .get('/v1/sessions')
        .set('Authorization', `Bearer ${desktopToken}`)
        .expect(200);
      expect(sessionsResponse.body.data.sessions.length).toBe(3);

      const user = await db['user'].findUnique({
        where: { email: 'multidevice@example.com' },
        include: { sessions: true },
      });
      expect(user).toBeTruthy();

      const mobileSession = (user.sessions as Array<{ id: string; userAgent?: string | null }>)
        .find((s) => s.userAgent?.includes('Mobile App'));
      expect(mobileSession).toBeTruthy();

      await request(app)
        .delete(`/v1/sessions/${mobileSession!.id}`)
        .set('Authorization', `Bearer ${desktopToken}`)
        .expect(200);

      await request(app).get('/v1/auth/me').set('Authorization', `Bearer ${mobileToken}`).expect(401);
      await request(app).get('/v1/auth/me').set('Authorization', `Bearer ${desktopToken}`).expect(200);
      await request(app).get('/v1/auth/me').set('Authorization', `Bearer ${tabletToken}`).expect(200);
    });

    it('should track session activity and metadata', async () => {
      const loginResponse = await request(app)
        .post('/v1/auth/login')
        .set('User-Agent', 'Chrome/91.0')
        .set('X-Forwarded-For', '192.168.1.100')
        .send({ email: 'multidevice@example.com', password: 'SecurePass123!' })
        .expect(200);
      const token: string = loginResponse.body.data.token;

      const sessionsResponse = await request(app)
        .get('/v1/sessions')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      const currentSession = sessionsResponse.body.data.sessions[0];
      expect(currentSession.userAgent).toBeDefined();
      expect(currentSession.ipAddress).toBeDefined();
      expect(currentSession.createdAt).toBeDefined();
    });
  });

  describe('Complete User Journey Flow', () => {
    it('should handle complete user lifecycle from registration to account deletion', async () => {
      const userData = {
        email: 'lifecycle@example.com',
        password: 'SecurePass123!',
        firstName: 'Life',
        lastName: 'Cycle',
        phone: '+1234567890',
      };

      const registerResponse = await request(app)
        .post('/v1/auth/register')
        .send(userData)
        .expect(201);
      const token: string = registerResponse.body.data.token;

      await request(app).get('/v1/auth/me').set('Authorization', `Bearer ${token}`).expect(200);

      await request(app)
        .post('/v1/auth/login')
        .send({ email: userData.email, password: userData.password })
        .expect(200);

      await request(app)
        .post('/v1/auth/login')
        .send({ email: userData.email, password: userData.password })
        .expect(200);

      const sessionsResponse = await request(app)
        .get('/v1/sessions')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);
      expect(sessionsResponse.body.data.sessions.length).toBeGreaterThan(1);

      await request(app)
        .post('/v1/auth/forgot-password')
        .send({ email: userData.email })
        .expect(200);

      const user = await db['user'].findUnique({ where: { email: userData.email } });
      expect(user).toBeTruthy();

      const resetRecord = await getLatestResetToken(user.id);
      expect(resetRecord).toBeTruthy();
      const resetToken: string = resetRecord!.token;

      await request(app)
        .post('/v1/auth/reset-password')
        .send({ token: resetToken, password: 'NewSecurePass123!' })
        .expect(200);

      await request(app).post('/v1/auth/logout').set('Authorization', `Bearer ${token}`).expect(200);
      await request(app).get('/v1/auth/me').set('Authorization', `Bearer ${token}`).expect(401);
    });
  });
});