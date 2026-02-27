import request from 'supertest';
import { PrismaClient } from '@prisma/client';
import app from '../../src/app';
import { hashPassword } from '../../src/infrastructure/auth/password';

const prisma = new PrismaClient();

describe('Auth Flow E2E Tests', () => {
  const baseUrl = '/api/v1/auth';
  
  const validUserData = {
    email: 'testuser@lomashwood.com',
    password: 'Test@123456',
    firstName: 'Test',
    lastName: 'User',
    phone: '+919876543210',
  };

  const adminUserData = {
    email: 'admin@lomashwood.com',
    password: 'Admin@123456',
    firstName: 'Admin',
    lastName: 'User',
    phone: '+919876543211',
  };

  beforeAll(async () => {
    await prisma.user.deleteMany({
      where: {
        email: {
          in: [validUserData.email, adminUserData.email],
        },
      },
    });
  });

  afterAll(async () => {
    await prisma.user.deleteMany({
      where: {
        email: {
          in: [validUserData.email, adminUserData.email],
        },
      },
    });
    await prisma.$disconnect();
  });

  describe('User Registration Flow', () => {
    it('should successfully register a new user', async () => {
      const response = await request(app)
        .post(`${baseUrl}/register`)
        .send(validUserData)
        .expect(201);

      expect(response.body).toMatchObject({
        success: true,
        message: expect.any(String),
        data: {
          user: {
            id: expect.any(String),
            email: validUserData.email,
            firstName: validUserData.firstName,
            lastName: validUserData.lastName,
            phone: validUserData.phone,
            role: 'CUSTOMER',
            isEmailVerified: false,
          },
        },
      });

      expect(response.body.data.user).not.toHaveProperty('password');
    });

    it('should fail to register with existing email', async () => {
      const response = await request(app)
        .post(`${baseUrl}/register`)
        .send(validUserData)
        .expect(409);

      expect(response.body).toMatchObject({
        success: false,
        error: {
          code: 'EMAIL_ALREADY_EXISTS',
          message: expect.stringContaining('already registered'),
        },
      });
    });

    it('should fail to register with invalid email format', async () => {
      const response = await request(app)
        .post(`${baseUrl}/register`)
        .send({
          ...validUserData,
          email: 'invalid-email',
        })
        .expect(400);

      expect(response.body).toMatchObject({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: expect.stringContaining('email'),
        },
      });
    });

    it('should fail to register with weak password', async () => {
      const response = await request(app)
        .post(`${baseUrl}/register`)
        .send({
          ...validUserData,
          email: 'newuser@lomashwood.com',
          password: 'weak',
        })
        .expect(400);

      expect(response.body).toMatchObject({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: expect.stringContaining('password'),
        },
      });
    });

    it('should fail to register with missing required fields', async () => {
      const response = await request(app)
        .post(`${baseUrl}/register`)
        .send({
          email: 'incomplete@lomashwood.com',
        })
        .expect(400);

      expect(response.body).toMatchObject({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
        },
      });
    });

    it('should fail to register with invalid phone number', async () => {
      const response = await request(app)
        .post(`${baseUrl}/register`)
        .send({
          ...validUserData,
          email: 'newuser2@lomashwood.com',
          phone: '123',
        })
        .expect(400);

      expect(response.body).toMatchObject({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: expect.stringContaining('phone'),
        },
      });
    });
  });

  describe('User Login Flow', () => {
    let authToken: string;
    let refreshToken: string;

    it('should successfully login with valid credentials', async () => {
      const response = await request(app)
        .post(`${baseUrl}/login`)
        .send({
          email: validUserData.email,
          password: validUserData.password,
        })
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        data: {
          user: {
            id: expect.any(String),
            email: validUserData.email,
            role: 'CUSTOMER',
          },
          accessToken: expect.any(String),
          refreshToken: expect.any(String),
        },
      });

      authToken = response.body.data.accessToken;
      refreshToken = response.body.data.refreshToken;

      const cookies = response.headers['set-cookie'];
      expect(cookies).toBeDefined();
      expect(cookies.some((cookie: string) => cookie.includes('accessToken'))).toBe(true);
    });

    it('should fail to login with incorrect password', async () => {
      const response = await request(app)
        .post(`${baseUrl}/login`)
        .send({
          email: validUserData.email,
          password: 'WrongPassword123',
        })
        .expect(401);

      expect(response.body).toMatchObject({
        success: false,
        error: {
          code: 'INVALID_CREDENTIALS',
          message: expect.stringContaining('Invalid'),
        },
      });
    });

    it('should fail to login with non-existent email', async () => {
      const response = await request(app)
        .post(`${baseUrl}/login`)
        .send({
          email: 'nonexistent@lomashwood.com',
          password: 'SomePassword123',
        })
        .expect(401);

      expect(response.body).toMatchObject({
        success: false,
        error: {
          code: 'INVALID_CREDENTIALS',
        },
      });
    });

    it('should fail to login with missing credentials', async () => {
      const response = await request(app)
        .post(`${baseUrl}/login`)
        .send({
          email: validUserData.email,
        })
        .expect(400);

      expect(response.body).toMatchObject({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
        },
      });
    });

    it('should successfully access protected route with valid token', async () => {
      const response = await request(app)
        .get(`${baseUrl}/me`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        data: {
          user: {
            id: expect.any(String),
            email: validUserData.email,
            firstName: validUserData.firstName,
            lastName: validUserData.lastName,
          },
        },
      });
    });

    it('should fail to access protected route without token', async () => {
      const response = await request(app)
        .get(`${baseUrl}/me`)
        .expect(401);

      expect(response.body).toMatchObject({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: expect.stringContaining('token'),
        },
      });
    });

    it('should fail to access protected route with invalid token', async () => {
      const response = await request(app)
        .get(`${baseUrl}/me`)
        .set('Authorization', 'Bearer invalid-token-12345')
        .expect(401);

      expect(response.body).toMatchObject({
        success: false,
        error: {
          code: 'INVALID_TOKEN',
        },
      });
    });

    it('should successfully refresh access token', async () => {
      const response = await request(app)
        .post(`${baseUrl}/refresh`)
        .send({
          refreshToken,
        })
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        data: {
          accessToken: expect.any(String),
          refreshToken: expect.any(String),
        },
      });

      authToken = response.body.data.accessToken;
    });

    it('should fail to refresh with invalid refresh token', async () => {
      const response = await request(app)
        .post(`${baseUrl}/refresh`)
        .send({
          refreshToken: 'invalid-refresh-token',
        })
        .expect(401);

      expect(response.body).toMatchObject({
        success: false,
        error: {
          code: 'INVALID_TOKEN',
        },
      });
    });

    it('should successfully logout', async () => {
      const response = await request(app)
        .post(`${baseUrl}/logout`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        message: expect.stringContaining('logout'),
      });

      const cookies = response.headers['set-cookie'];
      expect(cookies).toBeDefined();
      expect(cookies.some((cookie: string) => cookie.includes('Max-Age=0'))).toBe(true);
    });

    it('should fail to access protected route with logged out token', async () => {
      await request(app)
        .get(`${baseUrl}/me`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(401);
    });
  });

  describe('Password Reset Flow', () => {
    let resetToken: string;

    it('should successfully request password reset', async () => {
      const response = await request(app)
        .post(`${baseUrl}/forgot-password`)
        .send({
          email: validUserData.email,
        })
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        message: expect.stringContaining('email'),
      });

      const user = await prisma.user.findUnique({
        where: { email: validUserData.email },
        select: { resetToken: true, resetTokenExpiry: true },
      });

      expect(user?.resetToken).toBeDefined();
      expect(user?.resetTokenExpiry).toBeDefined();
      resetToken = user!.resetToken!;
    });

    it('should not reveal if email does not exist during password reset', async () => {
      const response = await request(app)
        .post(`${baseUrl}/forgot-password`)
        .send({
          email: 'nonexistent@lomashwood.com',
        })
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        message: expect.stringContaining('email'),
      });
    });

    it('should successfully reset password with valid token', async () => {
      const newPassword = 'NewPassword@123';

      const response = await request(app)
        .post(`${baseUrl}/reset-password`)
        .send({
          token: resetToken,
          password: newPassword,
        })
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        message: expect.stringContaining('reset'),
      });

      const loginResponse = await request(app)
        .post(`${baseUrl}/login`)
        .send({
          email: validUserData.email,
          password: newPassword,
        })
        .expect(200);

      expect(loginResponse.body.success).toBe(true);
    });

    it('should fail to reset password with invalid token', async () => {
      const response = await request(app)
        .post(`${baseUrl}/reset-password`)
        .send({
          token: 'invalid-token-12345',
          password: 'NewPassword@123',
        })
        .expect(400);

      expect(response.body).toMatchObject({
        success: false,
        error: {
          code: 'INVALID_TOKEN',
        },
      });
    });

    it('should fail to reset password with expired token', async () => {
      await prisma.user.update({
        where: { email: validUserData.email },
        data: {
          resetToken: 'expired-token',
          resetTokenExpiry: new Date(Date.now() - 3600000),
        },
      });

      const response = await request(app)
        .post(`${baseUrl}/reset-password`)
        .send({
          token: 'expired-token',
          password: 'NewPassword@123',
        })
        .expect(400);

      expect(response.body).toMatchObject({
        success: false,
        error: {
          code: 'TOKEN_EXPIRED',
        },
      });
    });
  });

  describe('Admin Role Authentication', () => {
    let adminToken: string;

    beforeAll(async () => {
      const hashedPassword = await hashPassword(adminUserData.password);

      await prisma.user.create({
        data: {
          ...adminUserData,
          password: hashedPassword,
          role: 'ADMIN',
          isEmailVerified: true,
        },
      });
    });

    it('should successfully login as admin', async () => {
      const response = await request(app)
        .post(`${baseUrl}/login`)
        .send({
          email: adminUserData.email,
          password: adminUserData.password,
        })
        .expect(200);

      expect(response.body.data.user.role).toBe('ADMIN');
      adminToken = response.body.data.accessToken;
    });

    it('should access admin-only routes with admin token', async () => {
      const response = await request(app)
        .get('/api/v1/products/admin/analytics')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    it('should fail to access admin routes with customer token', async () => {
      const customerLoginResponse = await request(app)
        .post(`${baseUrl}/login`)
        .send({
          email: validUserData.email,
          password: 'NewPassword@123',
        });

      const customerToken = customerLoginResponse.body.data.accessToken;

      const response = await request(app)
        .get('/api/v1/products/admin/analytics')
        .set('Authorization', `Bearer ${customerToken}`)
        .expect(403);

      expect(response.body).toMatchObject({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: expect.stringContaining('permission'),
        },
      });
    });
  });

  describe('Session Management', () => {
    let token1: string;
    let token2: string;

    it('should create multiple sessions for same user', async () => {
      const response1 = await request(app)
        .post(`${baseUrl}/login`)
        .send({
          email: validUserData.email,
          password: 'NewPassword@123',
        })
        .expect(200);

      token1 = response1.body.data.accessToken;

      const response2 = await request(app)
        .post(`${baseUrl}/login`)
        .send({
          email: validUserData.email,
          password: 'NewPassword@123',
        })
        .expect(200);

      token2 = response2.body.data.accessToken;

      expect(token1).not.toBe(token2);
    });

    it('should allow access with both session tokens', async () => {
      await request(app)
        .get(`${baseUrl}/me`)
        .set('Authorization', `Bearer ${token1}`)
        .expect(200);

      await request(app)
        .get(`${baseUrl}/me`)
        .set('Authorization', `Bearer ${token2}`)
        .expect(200);
    });

    it('should logout only specific session', async () => {
      await request(app)
        .post(`${baseUrl}/logout`)
        .set('Authorization', `Bearer ${token1}`)
        .expect(200);

      await request(app)
        .get(`${baseUrl}/me`)
        .set('Authorization', `Bearer ${token1}`)
        .expect(401);

      await request(app)
        .get(`${baseUrl}/me`)
        .set('Authorization', `Bearer ${token2}`)
        .expect(200);
    });

    it('should logout all sessions', async () => {
      const loginResponse = await request(app)
        .post(`${baseUrl}/login`)
        .send({
          email: validUserData.email,
          password: 'NewPassword@123',
        });

      const newToken = loginResponse.body.data.accessToken;

      await request(app)
        .post(`${baseUrl}/logout-all`)
        .set('Authorization', `Bearer ${newToken}`)
        .expect(200);

      await request(app)
        .get(`${baseUrl}/me`)
        .set('Authorization', `Bearer ${newToken}`)
        .expect(401);

      await request(app)
        .get(`${baseUrl}/me`)
        .set('Authorization', `Bearer ${token2}`)
        .expect(401);
    });
  });

  describe('Rate Limiting', () => {
    it('should rate limit login attempts', async () => {
      const attempts = 6;
      const promises = [];

      for (let i = 0; i < attempts; i++) {
        promises.push(
          request(app)
            .post(`${baseUrl}/login`)
            .send({
              email: 'attacker@example.com',
              password: 'WrongPassword123',
            })
        );
      }

      const responses = await Promise.all(promises);
      
      const rateLimitedResponses = responses.filter(res => res.status === 429);
      expect(rateLimitedResponses.length).toBeGreaterThan(0);
    });
  });
});