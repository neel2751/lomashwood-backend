

import { describe, it, expect, beforeEach } from '@jest/globals';
import { z } from 'zod';
import { commonFixture } from '../fixtures/common.fixture';

describe('Product Service - Auth Validator', () => {
  let authSchemas: any;

  beforeEach(() => {
    authSchemas = {
      loginSchema: z.object({
        email: z.string().email('Invalid email format'),
        password: z.string().min(8, 'Password must be at least 8 characters'),
      }),

      registerSchema: z.object({
        email: z.string().email('Invalid email format'),
        password: z.string().min(8, 'Password must be at least 8 characters'),
        name: z.string().min(2, 'Name must be at least 2 characters'),
        role: z.enum(['USER', 'ADMIN', 'MANAGER']).optional().default('USER'),
      }),

      tokenSchema: z.object({
        token: z.string().min(1, 'Token is required'),
      }),

      sessionSchema: z.object({
        userId: z.string().uuid('Invalid user ID format'),
        expiresAt: z.date().refine((date) => date > new Date(), {
          message: 'Expiry date must be in the future',
        }),
        metadata: z.object({
          ipAddress: z.string().ip().optional(),
          userAgent: z.string().optional(),
        }).optional(),
      }),

      apiKeySchema: z.object({
        key: z.string().regex(/^lw_(live|test)_[a-f0-9-]{36}$/, 'Invalid API key format'),
        name: z.string().min(1, 'API key name is required'),
        expiresAt: z.date().optional(),
      }),

      passwordResetSchema: z.object({
        email: z.string().email('Invalid email format'),
      }),

      passwordUpdateSchema: z.object({
        token: z.string().min(1, 'Reset token is required'),
        newPassword: z.string()
          .min(8, 'Password must be at least 8 characters')
          .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
          .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
          .regex(/[0-9]/, 'Password must contain at least one number')
          .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character'),
      }),

      changePasswordSchema: z.object({
        currentPassword: z.string().min(1, 'Current password is required'),
        newPassword: z.string()
          .min(8, 'Password must be at least 8 characters')
          .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
          .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
          .regex(/[0-9]/, 'Password must contain at least one number')
          .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character'),
      }),

      refreshTokenSchema: z.object({
        refreshToken: z.string().min(1, 'Refresh token is required'),
      }),

      roleUpdateSchema: z.object({
        userId: z.string().uuid('Invalid user ID format'),
        role: z.enum(['USER', 'ADMIN', 'MANAGER', 'SUPER_ADMIN']),
      }),

      permissionSchema: z.object({
        userId: z.string().uuid('Invalid user ID format'),
        permissions: z.array(z.string()).min(1, 'At least one permission is required'),
      }),
    };
  });

  describe('loginSchema', () => {
    it('should validate valid login credentials', () => {
      const data = {
        email: commonFixture.generateEmail(),
        password: 'Password123!',
      };

      const result = authSchemas.loginSchema.safeParse(data);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.email).toBe(data.email);
        expect(result.data.password).toBe(data.password);
      }
    });

    it('should reject invalid email format', () => {
      const data = {
        email: 'invalid-email',
        password: 'Password123!',
      };

      const result = authSchemas.loginSchema.safeParse(data);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Invalid email format');
      }
    });

    it('should reject short password', () => {
      const data = {
        email: commonFixture.generateEmail(),
        password: 'short',
      };

      const result = authSchemas.loginSchema.safeParse(data);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Password must be at least 8 characters');
      }
    });

    it('should reject missing email', () => {
      const data = {
        password: 'Password123!',
      };

      const result = authSchemas.loginSchema.safeParse(data);

      expect(result.success).toBe(false);
    });

    it('should reject missing password', () => {
      const data = {
        email: commonFixture.generateEmail(),
      };

      const result = authSchemas.loginSchema.safeParse(data);

      expect(result.success).toBe(false);
    });

    it('should reject empty email', () => {
      const data = {
        email: '',
        password: 'Password123!',
      };

      const result = authSchemas.loginSchema.safeParse(data);

      expect(result.success).toBe(false);
    });

    it('should reject empty password', () => {
      const data = {
        email: commonFixture.generateEmail(),
        password: '',
      };

      const result = authSchemas.loginSchema.safeParse(data);

      expect(result.success).toBe(false);
    });
  });

  describe('registerSchema', () => {
    it('should validate valid registration data', () => {
      const data = {
        email: commonFixture.generateEmail(),
        password: 'Password123!',
        name: 'John Doe',
        role: 'USER' as const,
      };

      const result = authSchemas.registerSchema.safeParse(data);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.email).toBe(data.email);
        expect(result.data.name).toBe(data.name);
        expect(result.data.role).toBe(data.role);
      }
    });

    it('should use default role when not provided', () => {
      const data = {
        email: commonFixture.generateEmail(),
        password: 'Password123!',
        name: 'John Doe',
      };

      const result = authSchemas.registerSchema.safeParse(data);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.role).toBe('USER');
      }
    });

    it('should reject invalid role', () => {
      const data = {
        email: commonFixture.generateEmail(),
        password: 'Password123!',
        name: 'John Doe',
        role: 'INVALID_ROLE',
      };

      const result = authSchemas.registerSchema.safeParse(data);

      expect(result.success).toBe(false);
    });

    it('should reject short name', () => {
      const data = {
        email: commonFixture.generateEmail(),
        password: 'Password123!',
        name: 'A',
      };

      const result = authSchemas.registerSchema.safeParse(data);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Name must be at least 2 characters');
      }
    });

    it('should validate ADMIN role', () => {
      const data = {
        email: commonFixture.generateEmail(),
        password: 'Password123!',
        name: 'Admin User',
        role: 'ADMIN' as const,
      };

      const result = authSchemas.registerSchema.safeParse(data);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.role).toBe('ADMIN');
      }
    });

    it('should validate MANAGER role', () => {
      const data = {
        email: commonFixture.generateEmail(),
        password: 'Password123!',
        name: 'Manager User',
        role: 'MANAGER' as const,
      };

      const result = authSchemas.registerSchema.safeParse(data);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.role).toBe('MANAGER');
      }
    });
  });

  describe('tokenSchema', () => {
    it('should validate valid token', () => {
      const data = {
        token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0',
      };

      const result = authSchemas.tokenSchema.safeParse(data);

      expect(result.success).toBe(true);
    });

    it('should reject empty token', () => {
      const data = {
        token: '',
      };

      const result = authSchemas.tokenSchema.safeParse(data);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Token is required');
      }
    });

    it('should reject missing token', () => {
      const data = {};

      const result = authSchemas.tokenSchema.safeParse(data);

      expect(result.success).toBe(false);
    });
  });

  describe('sessionSchema', () => {
    it('should validate valid session data', () => {
      const data = {
        userId: commonFixture.generateId(),
        expiresAt: commonFixture.generateFutureDate(),
        metadata: {
          ipAddress: '192.168.1.1',
          userAgent: 'Mozilla/5.0',
        },
      };

      const result = authSchemas.sessionSchema.safeParse(data);

      expect(result.success).toBe(true);
    });

    it('should reject invalid userId format', () => {
      const data = {
        userId: 'invalid-uuid',
        expiresAt: commonFixture.generateFutureDate(),
      };

      const result = authSchemas.sessionSchema.safeParse(data);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Invalid user ID format');
      }
    });

    it('should reject past expiry date', () => {
      const data = {
        userId: commonFixture.generateId(),
        expiresAt: commonFixture.generatePastDate(),
      };

      const result = authSchemas.sessionSchema.safeParse(data);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Expiry date must be in the future');
      }
    });

    it('should accept session without metadata', () => {
      const data = {
        userId: commonFixture.generateId(),
        expiresAt: commonFixture.generateFutureDate(),
      };

      const result = authSchemas.sessionSchema.safeParse(data);

      expect(result.success).toBe(true);
    });

    it('should validate IPv4 address in metadata', () => {
      const data = {
        userId: commonFixture.generateId(),
        expiresAt: commonFixture.generateFutureDate(),
        metadata: {
          ipAddress: '192.168.1.1',
        },
      };

      const result = authSchemas.sessionSchema.safeParse(data);

      expect(result.success).toBe(true);
    });

    it('should validate IPv6 address in metadata', () => {
      const data = {
        userId: commonFixture.generateId(),
        expiresAt: commonFixture.generateFutureDate(),
        metadata: {
          ipAddress: '2001:0db8:85a3:0000:0000:8a2e:0370:7334',
        },
      };

      const result = authSchemas.sessionSchema.safeParse(data);

      expect(result.success).toBe(true);
    });
  });

  describe('apiKeySchema', () => {
    it('should validate live API key format', () => {
      const data = {
        key: 'lw_live_' + commonFixture.generateId(),
        name: 'Production API Key',
      };

      const result = authSchemas.apiKeySchema.safeParse(data);

      expect(result.success).toBe(true);
    });

    it('should validate test API key format', () => {
      const data = {
        key: 'lw_test_' + commonFixture.generateId(),
        name: 'Test API Key',
      };

      const result = authSchemas.apiKeySchema.safeParse(data);

      expect(result.success).toBe(true);
    });

    it('should reject invalid API key format', () => {
      const data = {
        key: 'invalid-api-key-format',
        name: 'Invalid Key',
      };

      const result = authSchemas.apiKeySchema.safeParse(data);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Invalid API key format');
      }
    });

    it('should reject empty API key name', () => {
      const data = {
        key: 'lw_live_' + commonFixture.generateId(),
        name: '',
      };

      const result = authSchemas.apiKeySchema.safeParse(data);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('API key name is required');
      }
    });

    it('should accept API key with expiry date', () => {
      const data = {
        key: 'lw_live_' + commonFixture.generateId(),
        name: 'Expiring Key',
        expiresAt: commonFixture.generateFutureDate(),
      };

      const result = authSchemas.apiKeySchema.safeParse(data);

      expect(result.success).toBe(true);
    });
  });

  describe('passwordResetSchema', () => {
    it('should validate valid password reset request', () => {
      const data = {
        email: commonFixture.generateEmail(),
      };

      const result = authSchemas.passwordResetSchema.safeParse(data);

      expect(result.success).toBe(true);
    });

    it('should reject invalid email', () => {
      const data = {
        email: 'not-an-email',
      };

      const result = authSchemas.passwordResetSchema.safeParse(data);

      expect(result.success).toBe(false);
    });

    it('should reject missing email', () => {
      const data = {};

      const result = authSchemas.passwordResetSchema.safeParse(data);

      expect(result.success).toBe(false);
    });
  });

  describe('passwordUpdateSchema', () => {
    it('should validate strong password', () => {
      const data = {
        token: 'reset-token-123',
        newPassword: 'StrongP@ssw0rd!',
      };

      const result = authSchemas.passwordUpdateSchema.safeParse(data);

      expect(result.success).toBe(true);
    });

    it('should reject password without uppercase letter', () => {
      const data = {
        token: 'reset-token-123',
        newPassword: 'weakpassword1!',
      };

      const result = authSchemas.passwordUpdateSchema.safeParse(data);

      expect(result.success).toBe(false);
      if (!result.success) {
        const messages = result.error.issues.map(i => i.message);
        expect(messages).toContain('Password must contain at least one uppercase letter');
      }
    });

    it('should reject password without lowercase letter', () => {
      const data = {
        token: 'reset-token-123',
        newPassword: 'WEAKPASSWORD1!',
      };

      const result = authSchemas.passwordUpdateSchema.safeParse(data);

      expect(result.success).toBe(false);
      if (!result.success) {
        const messages = result.error.issues.map(i => i.message);
        expect(messages).toContain('Password must contain at least one lowercase letter');
      }
    });

    it('should reject password without number', () => {
      const data = {
        token: 'reset-token-123',
        newPassword: 'WeakPassword!',
      };

      const result = authSchemas.passwordUpdateSchema.safeParse(data);

      expect(result.success).toBe(false);
      if (!result.success) {
        const messages = result.error.issues.map(i => i.message);
        expect(messages).toContain('Password must contain at least one number');
      }
    });

    it('should reject password without special character', () => {
      const data = {
        token: 'reset-token-123',
        newPassword: 'WeakPassword1',
      };

      const result = authSchemas.passwordUpdateSchema.safeParse(data);

      expect(result.success).toBe(false);
      if (!result.success) {
        const messages = result.error.issues.map(i => i.message);
        expect(messages).toContain('Password must contain at least one special character');
      }
    });

    it('should reject short password', () => {
      const data = {
        token: 'reset-token-123',
        newPassword: 'Short1!',
      };

      const result = authSchemas.passwordUpdateSchema.safeParse(data);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Password must be at least 8 characters');
      }
    });

    it('should reject missing token', () => {
      const data = {
        newPassword: 'StrongP@ssw0rd!',
      };

      const result = authSchemas.passwordUpdateSchema.safeParse(data);

      expect(result.success).toBe(false);
    });
  });

  describe('changePasswordSchema', () => {
    it('should validate password change request', () => {
      const data = {
        currentPassword: 'OldP@ssw0rd!',
        newPassword: 'NewP@ssw0rd!',
      };

      const result = authSchemas.changePasswordSchema.safeParse(data);

      expect(result.success).toBe(true);
    });

    it('should reject missing current password', () => {
      const data = {
        newPassword: 'NewP@ssw0rd!',
      };

      const result = authSchemas.changePasswordSchema.safeParse(data);

      expect(result.success).toBe(false);
    });

    it('should reject weak new password', () => {
      const data = {
        currentPassword: 'OldP@ssw0rd!',
        newPassword: 'weak',
      };

      const result = authSchemas.changePasswordSchema.safeParse(data);

      expect(result.success).toBe(false);
    });

    it('should reject empty current password', () => {
      const data = {
        currentPassword: '',
        newPassword: 'NewP@ssw0rd!',
      };

      const result = authSchemas.changePasswordSchema.safeParse(data);

      expect(result.success).toBe(false);
    });
  });

  describe('refreshTokenSchema', () => {
    it('should validate refresh token', () => {
      const data = {
        refreshToken: 'valid-refresh-token-' + commonFixture.generateId(),
      };

      const result = authSchemas.refreshTokenSchema.safeParse(data);

      expect(result.success).toBe(true);
    });

    it('should reject empty refresh token', () => {
      const data = {
        refreshToken: '',
      };

      const result = authSchemas.refreshTokenSchema.safeParse(data);

      expect(result.success).toBe(false);
    });

    it('should reject missing refresh token', () => {
      const data = {};

      const result = authSchemas.refreshTokenSchema.safeParse(data);

      expect(result.success).toBe(false);
    });
  });

  describe('roleUpdateSchema', () => {
    it('should validate role update', () => {
      const data = {
        userId: commonFixture.generateId(),
        role: 'ADMIN' as const,
      };

      const result = authSchemas.roleUpdateSchema.safeParse(data);

      expect(result.success).toBe(true);
    });

    it('should accept SUPER_ADMIN role', () => {
      const data = {
        userId: commonFixture.generateId(),
        role: 'SUPER_ADMIN' as const,
      };

      const result = authSchemas.roleUpdateSchema.safeParse(data);

      expect(result.success).toBe(true);
    });

    it('should reject invalid role', () => {
      const data = {
        userId: commonFixture.generateId(),
        role: 'INVALID_ROLE',
      };

      const result = authSchemas.roleUpdateSchema.safeParse(data);

      expect(result.success).toBe(false);
    });

    it('should reject invalid userId', () => {
      const data = {
        userId: 'not-a-uuid',
        role: 'ADMIN' as const,
      };

      const result = authSchemas.roleUpdateSchema.safeParse(data);

      expect(result.success).toBe(false);
    });
  });

  describe('permissionSchema', () => {
    it('should validate permission assignment', () => {
      const data = {
        userId: commonFixture.generateId(),
        permissions: ['product:read', 'product:create', 'product:update'],
      };

      const result = authSchemas.permissionSchema.safeParse(data);

      expect(result.success).toBe(true);
    });

    it('should reject empty permissions array', () => {
      const data = {
        userId: commonFixture.generateId(),
        permissions: [],
      };

      const result = authSchemas.permissionSchema.safeParse(data);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('At least one permission is required');
      }
    });

    it('should accept single permission', () => {
      const data = {
        userId: commonFixture.generateId(),
        permissions: ['product:read'],
      };

      const result = authSchemas.permissionSchema.safeParse(data);

      expect(result.success).toBe(true);
    });

    it('should reject invalid userId', () => {
      const data = {
        userId: 'invalid-id',
        permissions: ['product:read'],
      };

      const result = authSchemas.permissionSchema.safeParse(data);

      expect(result.success).toBe(false);
    });

    it('should reject missing permissions', () => {
      const data = {
        userId: commonFixture.generateId(),
      };

      const result = authSchemas.permissionSchema.safeParse(data);

      expect(result.success).toBe(false);
    });
  });
});