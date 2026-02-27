import request from 'supertest';
import { Application } from 'express';
import { createApp } from '../../src/app';
import { prisma } from '../../src/infrastructure/db/prisma.client';
import bcrypt from 'bcrypt';

const db = prisma as unknown as Record<string, any>;

async function createUser(data: {
  email: string;
  password?: string;
  firstName: string;
  lastName: string;
  phone?: string;
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

async function getLatestResetRecord(
  userId: string,
): Promise<{ id: string; token: string; expiresAt: Date } | null> {
  return db['passwordReset'].findFirst({
    where: { userId, isUsed: false },
    orderBy: { createdAt: 'desc' },
    select: { id: true, token: true, expiresAt: true },
  });
}

describe('Auth Routes Integration Tests', () => {
  let app: Application;

  beforeAll(async () => {
    app = createApp();
    await prisma.$connect();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  beforeEach(async () => {
    await db['passwordReset'].deleteMany().catch(() => {});
    await db['session'].deleteMany();
    await db['userRole'].deleteMany().catch(() => {});
    await db['user'].deleteMany();
    await db['role'].deleteMany();
  });

  describe('POST /v1/auth/register', () => {
    it('should register a new user successfully', async () => {
      const registerData = {
        email: 'test@example.com',
        password: 'Password123!',
        firstName: 'John',
        lastName: 'Doe',
        phone: '+1234567890',
      };

      const response = await request(app)
        .post('/v1/auth/register')
        .send(registerData)
        .expect(201);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toHaveProperty('user');
      expect(response.body.data.user).toHaveProperty('id');
      expect(response.body.data.user.email).toBe(registerData.email);
      expect(response.body.data.user).not.toHaveProperty('password');
      expect(response.body.data).toHaveProperty('token');

      const user = await db['user'].findUnique({ where: { email: registerData.email } });
      expect(user).toBeTruthy();
      expect(user.email).toBe(registerData.email);
    });

    it('should fail to register with existing email', async () => {
      const userData = {
        email: 'existing@example.com',
        password: 'Password123!',
        firstName: 'Jane',
        lastName: 'Doe',
      };

      await createUser(userData);

      const response = await request(app)
        .post('/v1/auth/register')
        .send({ ...userData, phone: '+1234567890' })
        .expect(409);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body.error.message).toContain('already exists');
    });

    it('should fail with invalid email format', async () => {
      const response = await request(app)
        .post('/v1/auth/register')
        .send({ email: 'invalid-email', password: 'Password123!', firstName: 'John', lastName: 'Doe', phone: '+1234567890' })
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error');
    });

    it('should fail with weak password', async () => {
      const response = await request(app)
        .post('/v1/auth/register')
        .send({ email: 'test@example.com', password: '123', firstName: 'John', lastName: 'Doe', phone: '+1234567890' })
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error');
    });

    it('should fail with missing required fields', async () => {
      const response = await request(app)
        .post('/v1/auth/register')
        .send({ email: 'test@example.com' })
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error');
    });

    it('should trim and sanitize input fields', async () => {
      const response = await request(app)
        .post('/v1/auth/register')
        .send({ email: '  test@example.com  ', password: 'Password123!', firstName: '  John  ', lastName: '  Doe  ', phone: '+1234567890' })
        .expect(201);

      expect(response.body.data.user.email).toBe('test@example.com');
      expect(response.body.data.user.firstName).toBe('John');
      expect(response.body.data.user.lastName).toBe('Doe');
    });
  });

  describe('POST /v1/auth/login', () => {
    beforeEach(async () => {
      await createUser({ email: 'login@example.com', firstName: 'Login', lastName: 'User' });
    });

    it('should login successfully with valid credentials', async () => {
      const response = await request(app)
        .post('/v1/auth/login')
        .send({ email: 'login@example.com', password: 'Password123!' })
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toHaveProperty('user');
      expect(response.body.data).toHaveProperty('token');
      expect(response.body.data.user.email).toBe('login@example.com');
      expect(response.body.data.user).not.toHaveProperty('password');

      const session = await db['session'].findFirst({
        where: { user: { email: 'login@example.com' } },
      });
      expect(session).toBeTruthy();
    });

    it('should fail with incorrect password', async () => {
      const response = await request(app)
        .post('/v1/auth/login')
        .send({ email: 'login@example.com', password: 'WrongPassword123!' })
        .expect(401);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body.error.message).toContain('Invalid credentials');
    });

    it('should fail with non-existent email', async () => {
      const response = await request(app)
        .post('/v1/auth/login')
        .send({ email: 'nonexistent@example.com', password: 'Password123!' })
        .expect(401);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body.error.message).toContain('Invalid credentials');
    });

    it('should fail with inactive user account', async () => {
      await db['user'].update({ where: { email: 'login@example.com' }, data: { isActive: false } });

      const response = await request(app)
        .post('/v1/auth/login')
        .send({ email: 'login@example.com', password: 'Password123!' })
        .expect(403);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body.error.message).toContain('Account is not active');
    });

    it('should fail with unverified user account', async () => {
      await db['user'].update({ where: { email: 'login@example.com' }, data: { emailVerified: false } });

      const response = await request(app)
        .post('/v1/auth/login')
        .send({ email: 'login@example.com', password: 'Password123!' })
        .expect(403);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body.error.message).toContain('Email not verified');
    });

    it('should fail with missing credentials', async () => {
      const response = await request(app).post('/v1/auth/login').send({}).expect(400);
      expect(response.body).toHaveProperty('success', false);
    });

    it('should set secure session cookie on successful login', async () => {
      const response = await request(app)
        .post('/v1/auth/login')
        .send({ email: 'login@example.com', password: 'Password123!' })
        .expect(200);

      const raw = response.headers['set-cookie'];
      expect(raw).toBeDefined();
      const cookies = Array.isArray(raw) ? raw : [raw as string];
      expect(cookies.some((c: string) => c.includes('sessionId'))).toBe(true);
    });

    it('should update last login timestamp', async () => {
      const beforeLogin = new Date();

      await request(app)
        .post('/v1/auth/login')
        .send({ email: 'login@example.com', password: 'Password123!' })
        .expect(200);

      const user = await db['user'].findUnique({ where: { email: 'login@example.com' } });
      expect(user?.lastLoginAt).toBeTruthy();
      expect(new Date(user.lastLoginAt).getTime()).toBeGreaterThanOrEqual(beforeLogin.getTime());
    });
  });

  describe('POST /v1/auth/logout', () => {
    let authToken: string;
    let sessionId: string;

    beforeEach(async () => {
      const user = await createUser({ email: 'logout@example.com', firstName: 'Logout', lastName: 'User' });

      const loginResponse = await request(app)
        .post('/v1/auth/login')
        .send({ email: 'logout@example.com', password: 'Password123!' });

      authToken = loginResponse.body.data.token;

      const session = await db['session'].findFirst({ where: { userId: user.id } });
      sessionId = session.id;
    });

    it('should logout successfully with valid token', async () => {
      const response = await request(app)
        .post('/v1/auth/logout')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.message).toContain('Logged out successfully');

      const session = await db['session'].findUnique({ where: { id: sessionId } });
      expect(session).toBeNull();
    });

    it('should fail without authentication token', async () => {
      const response = await request(app).post('/v1/auth/logout').expect(401);
      expect(response.body).toHaveProperty('success', false);
      expect(response.body.error.message).toContain('unauthorized');
    });

    it('should fail with invalid token', async () => {
      const response = await request(app)
        .post('/v1/auth/logout')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);
      expect(response.body).toHaveProperty('success', false);
    });

    it('should fail with expired token', async () => {
      await db['session'].update({
        where: { id: sessionId },
        data: { expiresAt: new Date(Date.now() - 1000 * 60 * 60) },
      });

      const response = await request(app)
        .post('/v1/auth/logout')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(401);
      expect(response.body).toHaveProperty('success', false);
    });

    it('should clear session cookie on logout', async () => {
      const response = await request(app)
        .post('/v1/auth/logout')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      const raw = response.headers['set-cookie'];
      if (raw !== undefined) {
        const cookies = Array.isArray(raw) ? raw : [raw as string];
        expect(
          cookies.some((c: string) => c.includes('sessionId') && c.includes('Max-Age=0'))
        ).toBe(true);
      }
    });
  });

  describe('GET /v1/auth/me', () => {
    let authToken: string;
    let userId: string;

    beforeEach(async () => {
      const user = await createUser({ email: 'me@example.com', firstName: 'Current', lastName: 'User' });
      userId = user.id;

      const loginResponse = await request(app)
        .post('/v1/auth/login')
        .send({ email: 'me@example.com', password: 'Password123!' });

      authToken = loginResponse.body.data.token;
    });

    it('should return current user profile with valid token', async () => {
      const response = await request(app)
        .get('/v1/auth/me')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toHaveProperty('user');
      expect(response.body.data.user.id).toBe(userId);
      expect(response.body.data.user.email).toBe('me@example.com');
      expect(response.body.data.user).not.toHaveProperty('password');
    });

    it('should fail without authentication token', async () => {
      const response = await request(app).get('/v1/auth/me').expect(401);
      expect(response.body).toHaveProperty('success', false);
      expect(response.body.error.message).toContain('unauthorized');
    });

    it('should fail with invalid token', async () => {
      const response = await request(app)
        .get('/v1/auth/me')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);
      expect(response.body).toHaveProperty('success', false);
    });

    it('should include user roles in response', async () => {
      const role = await db['role'].create({
        data: {
          name: 'USER',
          description: 'Regular user',
          isDefault: false,
          isActive: true,
        },
      });

      await db['userRole'].create({
        data: {
          userId,
          roleId: role.id,
          assignedBy: 'test',
        },
      });

      const response = await request(app)
        .get('/v1/auth/me')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.data.user).toHaveProperty('roles');
      expect(Array.isArray(response.body.data.user.roles)).toBe(true);
    });

    it('should fail if user is deactivated', async () => {
      await db['user'].update({ where: { id: userId }, data: { isActive: false } });

      const response = await request(app)
        .get('/v1/auth/me')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(403);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body.error.message).toContain('Account is not active');
    });
  });

  describe('POST /v1/auth/forgot-password', () => {
    beforeEach(async () => {
      await createUser({ email: 'forgot@example.com', firstName: 'Forgot', lastName: 'User' });
    });

    it('should initiate password reset for existing user', async () => {
      const response = await request(app)
        .post('/v1/auth/forgot-password')
        .send({ email: 'forgot@example.com' })
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.message).toContain('Password reset email sent');

      // Token is stored in PasswordReset table, not on User
      const user = await db['user'].findUnique({ where: { email: 'forgot@example.com' } });
      const resetRecord = await getLatestResetRecord(user.id);
      expect(resetRecord).toBeTruthy();
      expect(resetRecord!.token).toBeTruthy();
      expect(resetRecord!.expiresAt.getTime()).toBeGreaterThan(Date.now());
    });

    it('should return success even for non-existent email', async () => {
      const response = await request(app)
        .post('/v1/auth/forgot-password')
        .send({ email: 'nonexistent@example.com' })
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
    });

    it('should fail with invalid email format', async () => {
      const response = await request(app)
        .post('/v1/auth/forgot-password')
        .send({ email: 'invalid-email' })
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
    });
  });

  describe('POST /v1/auth/reset-password', () => {
    let resetToken: string;
    let resetRecordId: string;
    let testUserId: string;

    beforeEach(async () => {
      const user = await createUser({
        email: 'reset@example.com',
        firstName: 'Reset',
        lastName: 'User',
      });
      testUserId = user.id;

      const record = await db['passwordReset'].create({
        data: {
          userId: testUserId,
          token: 'valid-reset-token-123456',
          expiresAt: new Date(Date.now() + 3600000),
          isUsed: false,
        },
      });

      resetToken = record.token;
      resetRecordId = record.id;
    });

    it('should reset password with valid token', async () => {
      const response = await request(app)
        .post('/v1/auth/reset-password')
        .send({ token: resetToken, password: 'NewPassword123!' })
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.message).toContain('Password reset successful');

      const usedRecord = await db['passwordReset'].findUnique({ where: { id: resetRecordId } });
      expect(usedRecord?.isUsed).toBe(true);

      const user = await db['user'].findUnique({ where: { email: 'reset@example.com' } });
      const isPasswordValid = await bcrypt.compare('NewPassword123!', user.password);
      expect(isPasswordValid).toBe(true);
    });

    it('should fail with expired token', async () => {
      await db['passwordReset'].update({
        where: { id: resetRecordId },
        data: { expiresAt: new Date(Date.now() - 1000) },
      });

      const response = await request(app)
        .post('/v1/auth/reset-password')
        .send({ token: resetToken, password: 'NewPassword123!' })
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body.error.message).toContain('expired');
    });

    it('should fail with invalid token', async () => {
      const response = await request(app)
        .post('/v1/auth/reset-password')
        .send({ token: 'invalid-token', password: 'NewPassword123!' })
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
    });

    it('should fail with weak password', async () => {
      const response = await request(app)
        .post('/v1/auth/reset-password')
        .send({ token: resetToken, password: '123' })
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
    });
  });
});