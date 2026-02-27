import { describe, it, expect, beforeAll, afterAll, beforeEach, afterEach } from '@jest/globals';
import request from 'supertest';
import { Express } from 'express';
import { PrismaClient } from '@prisma/client';
import { createApp } from '../../src/app';
import { generateToken, hashPassword } from '../../src/infrastructure/auth/jwt';
import { redisClient } from '../../src/infrastructure/cache/redis.client';

describe('Auth Routes Integration Tests', () => {
  let app: Express;
  let prisma: PrismaClient;
  let testUserId: string;
  let testUserEmail: string;
  let testUserPassword: string;
  let adminToken: string;
  let userToken: string;

  beforeAll(async () => {
    // Initialize app and database
    app = await createApp();
    prisma = new PrismaClient();
    
    // Connect to test database
    await prisma.$connect();
    
    // Clean up existing test data
    await prisma.user.deleteMany({
      where: {
        email: {
          contains: 'test-auth-',
        },
      },
    });

    // Create test users
    testUserEmail = 'test-auth-user@lomashwood.com';
    testUserPassword = 'Test123!@#';
    const hashedPassword = await hashPassword(testUserPassword);

    const testUser = await prisma.user.create({
      data: {
        email: testUserEmail,
        password: hashedPassword,
        name: 'Test Auth User',
        role: 'USER',
        isActive: true,
        emailVerified: true,
      },
    });

    testUserId = testUser.id;

    const adminUser = await prisma.user.create({
      data: {
        email: 'test-auth-admin@lomashwood.com',
        password: hashedPassword,
        name: 'Test Admin User',
        role: 'ADMIN',
        isActive: true,
        emailVerified: true,
      },
    });

    // Generate tokens
    userToken = generateToken({ userId: testUserId, role: 'USER' });
    adminToken = generateToken({ userId: adminUser.id, role: 'ADMIN' });
  });

  afterAll(async () => {
    // Clean up test data
    await prisma.user.deleteMany({
      where: {
        email: {
          contains: 'test-auth-',
        },
      },
    });

    // Disconnect from database
    await prisma.$disconnect();
    
    // Close Redis connection
    await redisClient.disconnect();
  });

  beforeEach(async () => {
    // Clear cache before each test
    await redisClient.flushAll();
  });

  describe('POST /v1/auth/register', () => {
    it('should register a new user successfully', async () => {
      const newUser = {
        email: 'test-auth-newuser@lomashwood.com',
        password: 'NewUser123!@#',
        name: 'New Test User',
        phone: '07700900123',
      };

      const response = await request(app)
        .post('/v1/auth/register')
        .send(newUser)
        .expect(201);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveProperty('user');
      expect(response.body.data).toHaveProperty('token');
      expect(response.body.data.user.email).toBe(newUser.email);
      expect(response.body.data.user.name).toBe(newUser.name);
      expect(response.body.data.user).not.toHaveProperty('password');
    });

    it('should return 400 for invalid email format', async () => {
      const invalidUser = {
        email: 'invalid-email',
        password: 'Test123!@#',
        name: 'Test User',
      };

      const response = await request(app)
        .post('/v1/auth/register')
        .send(invalidUser)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toHaveProperty('message');
      expect(response.body.error.message).toContain('email');
    });

    it('should return 400 for weak password', async () => {
      const weakPassword = {
        email: 'test-auth-weak@lomashwood.com',
        password: '123',
        name: 'Test User',
      };

      const response = await request(app)
        .post('/v1/auth/register')
        .send(weakPassword)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toContain('password');
    });

    it('should return 409 for duplicate email', async () => {
      const duplicateUser = {
        email: testUserEmail,
        password: 'Test123!@#',
        name: 'Duplicate User',
      };

      const response = await request(app)
        .post('/v1/auth/register')
        .send(duplicateUser)
        .expect(409);

      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toContain('already exists');
    });

    it('should validate UK phone number format', async () => {
      const invalidPhone = {
        email: 'test-auth-phone@lomashwood.com',
        password: 'Test123!@#',
        name: 'Test User',
        phone: '123',
      };

      const response = await request(app)
        .post('/v1/auth/register')
        .send(invalidPhone)
        .expect(400);

      expect(response.body.error.message).toContain('phone');
    });

    it('should accept valid UK phone number', async () => {
      const validPhone = {
        email: 'test-auth-validphone@lomashwood.com',
        password: 'Test123!@#',
        name: 'Test User',
        phone: '+447700900123',
      };

      const response = await request(app)
        .post('/v1/auth/register')
        .send(validPhone)
        .expect(201);

      expect(response.body.data.user.phone).toBe(validPhone.phone);
    });

    it('should hash password before storing', async () => {
      const newUser = {
        email: 'test-auth-hashed@lomashwood.com',
        password: 'SecurePass123!@#',
        name: 'Hashed User',
      };

      await request(app)
        .post('/v1/auth/register')
        .send(newUser)
        .expect(201);

      const dbUser = await prisma.user.findUnique({
        where: { email: newUser.email },
      });

      expect(dbUser?.password).not.toBe(newUser.password);
      expect(dbUser?.password).toHaveLength(60); // bcrypt hash length
    });
  });

  describe('POST /v1/auth/login', () => {
    it('should login successfully with valid credentials', async () => {
      const credentials = {
        email: testUserEmail,
        password: testUserPassword,
      };

      const response = await request(app)
        .post('/v1/auth/login')
        .send(credentials)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('user');
      expect(response.body.data).toHaveProperty('token');
      expect(response.body.data.user.email).toBe(testUserEmail);
      expect(response.body.data.user).not.toHaveProperty('password');
    });

    it('should return 401 for invalid email', async () => {
      const credentials = {
        email: 'nonexistent@lomashwood.com',
        password: 'Test123!@#',
      };

      const response = await request(app)
        .post('/v1/auth/login')
        .send(credentials)
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toContain('Invalid credentials');
    });

    it('should return 401 for invalid password', async () => {
      const credentials = {
        email: testUserEmail,
        password: 'WrongPassword123!@#',
      };

      const response = await request(app)
        .post('/v1/auth/login')
        .send(credentials)
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toContain('Invalid credentials');
    });

    it('should return 401 for inactive user', async () => {
      const inactiveUser = await prisma.user.create({
        data: {
          email: 'test-auth-inactive@lomashwood.com',
          password: await hashPassword('Test123!@#'),
          name: 'Inactive User',
          role: 'USER',
          isActive: false,
        },
      });

      const credentials = {
        email: inactiveUser.email,
        password: 'Test123!@#',
      };

      const response = await request(app)
        .post('/v1/auth/login')
        .send(credentials)
        .expect(401);

      expect(response.body.error.message).toContain('inactive');
    });

    it('should create session on successful login', async () => {
      const credentials = {
        email: testUserEmail,
        password: testUserPassword,
      };

      const response = await request(app)
        .post('/v1/auth/login')
        .send(credentials)
        .expect(200);

      const sessions = await prisma.session.findMany({
        where: { userId: testUserId },
      });

      expect(sessions.length).toBeGreaterThan(0);
    });

    it('should track last login timestamp', async () => {
      const credentials = {
        email: testUserEmail,
        password: testUserPassword,
      };

      const beforeLogin = new Date();

      await request(app)
        .post('/v1/auth/login')
        .send(credentials)
        .expect(200);

      const user = await prisma.user.findUnique({
        where: { email: testUserEmail },
      });

      expect(user?.lastLoginAt).toBeDefined();
      expect(user?.lastLoginAt!.getTime()).toBeGreaterThanOrEqual(beforeLogin.getTime());
    });
  });

  describe('POST /v1/auth/logout', () => {
    it('should logout successfully with valid token', async () => {
      const response = await request(app)
        .post('/v1/auth/logout')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('Logged out successfully');
    });

    it('should return 401 without token', async () => {
      await request(app)
        .post('/v1/auth/logout')
        .expect(401);
    });

    it('should invalidate session on logout', async () => {
      // Login to create session
      const loginResponse = await request(app)
        .post('/v1/auth/login')
        .send({
          email: testUserEmail,
          password: testUserPassword,
        })
        .expect(200);

      const token = loginResponse.body.data.token;

      // Logout
      await request(app)
        .post('/v1/auth/logout')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      // Try to use the same token
      await request(app)
        .get('/v1/auth/me')
        .set('Authorization', `Bearer ${token}`)
        .expect(401);
    });

    it('should blacklist token on logout', async () => {
      const response = await request(app)
        .post('/v1/auth/logout')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      // Check if token is blacklisted in Redis
      const isBlacklisted = await redisClient.get(`blacklist:${userToken}`);
      expect(isBlacklisted).toBeTruthy();
    });
  });

  describe('GET /v1/auth/me', () => {
    it('should return current user with valid token', async () => {
      const response = await request(app)
        .get('/v1/auth/me')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('user');
      expect(response.body.data.user.email).toBe(testUserEmail);
      expect(response.body.data.user).not.toHaveProperty('password');
    });

    it('should return 401 without token', async () => {
      await request(app)
        .get('/v1/auth/me')
        .expect(401);
    });

    it('should return 401 with invalid token', async () => {
      await request(app)
        .get('/v1/auth/me')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);
    });

    it('should return 401 with expired token', async () => {
      const expiredToken = generateToken(
        { userId: testUserId, role: 'USER' },
        '0s' // Expired immediately
      );

      await request(app)
        .get('/v1/auth/me')
        .set('Authorization', `Bearer ${expiredToken}`)
        .expect(401);
    });

    it('should include user role in response', async () => {
      const response = await request(app)
        .get('/v1/auth/me')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(response.body.data.user.role).toBe('USER');
    });
  });

  describe('POST /v1/auth/refresh-token', () => {
    it('should refresh token successfully', async () => {
      const response = await request(app)
        .post('/v1/auth/refresh-token')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('token');
      expect(response.body.data.token).not.toBe(userToken);
    });

    it('should return 401 without token', async () => {
      await request(app)
        .post('/v1/auth/refresh-token')
        .expect(401);
    });

    it('should invalidate old token after refresh', async () => {
      const response = await request(app)
        .post('/v1/auth/refresh-token')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      const newToken = response.body.data.token;

      // Old token should be blacklisted
      await request(app)
        .get('/v1/auth/me')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(401);

      // New token should work
      await request(app)
        .get('/v1/auth/me')
        .set('Authorization', `Bearer ${newToken}`)
        .expect(200);
    });
  });

  describe('POST /v1/auth/forgot-password', () => {
    it('should send password reset email for valid email', async () => {
      const response = await request(app)
        .post('/v1/auth/forgot-password')
        .send({ email: testUserEmail })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('reset email sent');
    });

    it('should return 200 even for non-existent email (security)', async () => {
      const response = await request(app)
        .post('/v1/auth/forgot-password')
        .send({ email: 'nonexistent@lomashwood.com' })
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    it('should create password reset token', async () => {
      await request(app)
        .post('/v1/auth/forgot-password')
        .send({ email: testUserEmail })
        .expect(200);

      const user = await prisma.user.findUnique({
        where: { email: testUserEmail },
      });

      expect(user?.passwordResetToken).toBeDefined();
      expect(user?.passwordResetExpiry).toBeDefined();
    });

    it('should validate email format', async () => {
      const response = await request(app)
        .post('/v1/auth/forgot-password')
        .send({ email: 'invalid-email' })
        .expect(400);

      expect(response.body.error.message).toContain('email');
    });
  });

  describe('POST /v1/auth/reset-password', () => {
    it('should reset password with valid token', async () => {
      // Request password reset
      await request(app)
        .post('/v1/auth/forgot-password')
        .send({ email: testUserEmail })
        .expect(200);

      const user = await prisma.user.findUnique({
        where: { email: testUserEmail },
      });

      const resetToken = user?.passwordResetToken;
      const newPassword = 'NewPassword123!@#';

      const response = await request(app)
        .post('/v1/auth/reset-password')
        .send({
          token: resetToken,
          password: newPassword,
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('reset successfully');

      // Verify can login with new password
      await request(app)
        .post('/v1/auth/login')
        .send({
          email: testUserEmail,
          password: newPassword,
        })
        .expect(200);
    });

    it('should return 400 for invalid reset token', async () => {
      const response = await request(app)
        .post('/v1/auth/reset-password')
        .send({
          token: 'invalid-token',
          password: 'NewPassword123!@#',
        })
        .expect(400);

      expect(response.body.error.message).toContain('Invalid or expired');
    });

    it('should return 400 for expired reset token', async () => {
      // Create user with expired reset token
      const expiredUser = await prisma.user.create({
        data: {
          email: 'test-auth-expired@lomashwood.com',
          password: await hashPassword('Test123!@#'),
          name: 'Expired Token User',
          role: 'USER',
          passwordResetToken: 'expired-token',
          passwordResetExpiry: new Date(Date.now() - 3600000), // 1 hour ago
        },
      });

      const response = await request(app)
        .post('/v1/auth/reset-password')
        .send({
          token: 'expired-token',
          password: 'NewPassword123!@#',
        })
        .expect(400);

      expect(response.body.error.message).toContain('expired');
    });

    it('should validate new password strength', async () => {
      await request(app)
        .post('/v1/auth/forgot-password')
        .send({ email: testUserEmail })
        .expect(200);

      const user = await prisma.user.findUnique({
        where: { email: testUserEmail },
      });

      const response = await request(app)
        .post('/v1/auth/reset-password')
        .send({
          token: user?.passwordResetToken,
          password: 'weak',
        })
        .expect(400);

      expect(response.body.error.message).toContain('password');
    });

    it('should clear reset token after successful reset', async () => {
      await request(app)
        .post('/v1/auth/forgot-password')
        .send({ email: testUserEmail })
        .expect(200);

      const user = await prisma.user.findUnique({
        where: { email: testUserEmail },
      });

      await request(app)
        .post('/v1/auth/reset-password')
        .send({
          token: user?.passwordResetToken,
          password: 'NewPassword123!@#',
        })
        .expect(200);

      const updatedUser = await prisma.user.findUnique({
        where: { email: testUserEmail },
      });

      expect(updatedUser?.passwordResetToken).toBeNull();
      expect(updatedUser?.passwordResetExpiry).toBeNull();
    });
  });

  describe('POST /v1/auth/change-password', () => {
    it('should change password with valid current password', async () => {
      const newPassword = 'UpdatedPassword123!@#';

      const response = await request(app)
        .post('/v1/auth/change-password')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          currentPassword: testUserPassword,
          newPassword,
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('changed successfully');

      // Verify can login with new password
      await request(app)
        .post('/v1/auth/login')
        .send({
          email: testUserEmail,
          password: newPassword,
        })
        .expect(200);

      // Reset to original password for other tests
      await prisma.user.update({
        where: { email: testUserEmail },
        data: { password: await hashPassword(testUserPassword) },
      });
    });

    it('should return 401 without authentication', async () => {
      await request(app)
        .post('/v1/auth/change-password')
        .send({
          currentPassword: 'Test123!@#',
          newPassword: 'NewPassword123!@#',
        })
        .expect(401);
    });

    it('should return 400 for incorrect current password', async () => {
      const response = await request(app)
        .post('/v1/auth/change-password')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          currentPassword: 'WrongPassword123!@#',
          newPassword: 'NewPassword123!@#',
        })
        .expect(400);

      expect(response.body.error.message).toContain('Current password is incorrect');
    });

    it('should validate new password strength', async () => {
      const response = await request(app)
        .post('/v1/auth/change-password')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          currentPassword: testUserPassword,
          newPassword: 'weak',
        })
        .expect(400);

      expect(response.body.error.message).toContain('password');
    });

    it('should not allow same password as new password', async () => {
      const response = await request(app)
        .post('/v1/auth/change-password')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          currentPassword: testUserPassword,
          newPassword: testUserPassword,
        })
        .expect(400);

      expect(response.body.error.message).toContain('same as current');
    });
  });

  describe('POST /v1/auth/verify-email', () => {
    it('should verify email with valid token', async () => {
      const unverifiedUser = await prisma.user.create({
        data: {
          email: 'test-auth-unverified@lomashwood.com',
          password: await hashPassword('Test123!@#'),
          name: 'Unverified User',
          role: 'USER',
          emailVerified: false,
          emailVerificationToken: 'verification-token',
        },
      });

      const response = await request(app)
        .post('/v1/auth/verify-email')
        .send({ token: 'verification-token' })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('verified');

      const verifiedUser = await prisma.user.findUnique({
        where: { id: unverifiedUser.id },
      });

      expect(verifiedUser?.emailVerified).toBe(true);
      expect(verifiedUser?.emailVerificationToken).toBeNull();
    });

    it('should return 400 for invalid verification token', async () => {
      const response = await request(app)
        .post('/v1/auth/verify-email')
        .send({ token: 'invalid-token' })
        .expect(400);

      expect(response.body.error.message).toContain('Invalid verification');
    });
  });

  describe('Authorization - Role-based Access', () => {
    it('should allow admin to access admin routes', async () => {
      const response = await request(app)
        .get('/v1/admin/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    it('should deny regular user access to admin routes', async () => {
      const response = await request(app)
        .get('/v1/admin/users')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(403);

      expect(response.body.error.message).toContain('Forbidden');
    });

    it('should allow authenticated users to access protected routes', async () => {
      const response = await request(app)
        .get('/v1/products')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
    });
  });

  describe('Security Headers', () => {
    it('should include security headers in response', async () => {
      const response = await request(app)
        .post('/v1/auth/login')
        .send({
          email: testUserEmail,
          password: testUserPassword,
        })
        .expect(200);

      expect(response.headers).toHaveProperty('x-content-type-options', 'nosniff');
      expect(response.headers).toHaveProperty('x-frame-options', 'DENY');
    });

    it('should not expose sensitive information in errors', async () => {
      const response = await request(app)
        .post('/v1/auth/login')
        .send({
          email: 'nonexistent@lomashwood.com',
          password: 'Test123!@#',
        })
        .expect(401);

      // Should not reveal if email exists or not
      expect(response.body.error.message).not.toContain('User not found');
      expect(response.body.error.message).toBe('Invalid credentials');
    });
  });

  describe('Rate Limiting', () => {
    it('should rate limit login attempts', async () => {
      const credentials = {
        email: 'test-auth-ratelimit@lomashwood.com',
        password: 'WrongPassword123!@#',
      };

      // Make multiple failed login attempts
      for (let i = 0; i < 5; i++) {
        await request(app)
          .post('/v1/auth/login')
          .send(credentials);
      }

      // Next attempt should be rate limited
      const response = await request(app)
        .post('/v1/auth/login')
        .send(credentials)
        .expect(429);

      expect(response.body.error.message).toContain('Too many');
    });
  });
});