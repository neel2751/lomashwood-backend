
import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { commonFixture } from '../fixtures/common.fixture';



describe('Product Service - Auth Validation', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Token Validation', () => {
    it('should validate a valid JWT token', () => {
     
      const tokenPayload = {
        userId: commonFixture.generateId(),
        email: commonFixture.generateEmail(),
        role: 'USER',
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 3600,
      };

      const isValid = validateTokenPayload(tokenPayload);
      
      expect(isValid).toBe(true);
    });

    it('should reject an expired token', () => {
      const tokenPayload = {
        userId: commonFixture.generateId(),
        email: commonFixture.generateEmail(),
        role: 'USER',
        iat: Math.floor(Date.now() / 1000) - 7200,
        exp: Math.floor(Date.now() / 1000) - 3600,
      };

      const isValid = validateTokenPayload(tokenPayload);
      
      expect(isValid).toBe(false);
    });

    it('should reject a token with missing userId', () => {
      const tokenPayload = {
        email: commonFixture.generateEmail(),
        role: 'USER',
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 3600,
      };

      const isValid = validateTokenPayload(tokenPayload);
      
      expect(isValid).toBe(false);
    });

    it('should reject a token with missing email', () => {
      const tokenPayload = {
        userId: commonFixture.generateId(),
        role: 'USER',
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 3600,
      };

      const isValid = validateTokenPayload(tokenPayload);
      
      expect(isValid).toBe(false);
    });

    it('should reject a token with invalid role', () => {
      const tokenPayload = {
        userId: commonFixture.generateId(),
        email: commonFixture.generateEmail(),
        role: 'INVALID_ROLE',
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 3600,
      };

      const isValid = validateTokenPayload(tokenPayload);
      
      expect(isValid).toBe(false);
    });
  });

  describe('Role Authorization', () => {
    it('should authorize ADMIN role for admin endpoints', () => {
      const user = {
        id: commonFixture.generateId(),
        email: commonFixture.generateEmail(),
        role: 'ADMIN',
      };

      const hasAccess = checkRoleAccess(user, ['ADMIN']);
      
      expect(hasAccess).toBe(true);
    });

    it('should authorize USER role for user endpoints', () => {
      const user = {
        id: commonFixture.generateId(),
        email: commonFixture.generateEmail(),
        role: 'USER',
      };

      const hasAccess = checkRoleAccess(user, ['USER', 'ADMIN']);
      
      expect(hasAccess).toBe(true);
    });

    it('should reject USER role for admin-only endpoints', () => {
      const user = {
        id: commonFixture.generateId(),
        email: commonFixture.generateEmail(),
        role: 'USER',
      };

      const hasAccess = checkRoleAccess(user, ['ADMIN']);
      
      expect(hasAccess).toBe(false);
    });

    it('should authorize SUPER_ADMIN for all endpoints', () => {
      const user = {
        id: commonFixture.generateId(),
        email: commonFixture.generateEmail(),
        role: 'SUPER_ADMIN',
      };

      const hasAccess = checkRoleAccess(user, ['ADMIN']);
      
      expect(hasAccess).toBe(true);
    });

    it('should handle multiple allowed roles', () => {
      const user = {
        id: commonFixture.generateId(),
        email: commonFixture.generateEmail(),
        role: 'MANAGER',
      };

      const hasAccess = checkRoleAccess(user, ['ADMIN', 'MANAGER', 'SUPERVISOR']);
      
      expect(hasAccess).toBe(true);
    });
  });

  describe('Permission Checks', () => {
    it('should allow viewing products for public users', () => {
      const hasPermission = checkPermission(null, 'product:read');
      
      expect(hasPermission).toBe(true);
    });

    it('should allow creating products for admin users', () => {
      const user = {
        id: commonFixture.generateId(),
        email: commonFixture.generateEmail(),
        role: 'ADMIN',
      };

      const hasPermission = checkPermission(user, 'product:create');
      
      expect(hasPermission).toBe(true);
    });

    it('should deny creating products for regular users', () => {
      const user = {
        id: commonFixture.generateId(),
        email: commonFixture.generateEmail(),
        role: 'USER',
      };

      const hasPermission = checkPermission(user, 'product:create');
      
      expect(hasPermission).toBe(false);
    });

    it('should allow updating products for admin users', () => {
      const user = {
        id: commonFixture.generateId(),
        email: commonFixture.generateEmail(),
        role: 'ADMIN',
      };

      const hasPermission = checkPermission(user, 'product:update');
      
      expect(hasPermission).toBe(true);
    });

    it('should allow deleting products for admin users', () => {
      const user = {
        id: commonFixture.generateId(),
        email: commonFixture.generateEmail(),
        role: 'ADMIN',
      };

      const hasPermission = checkPermission(user, 'product:delete');
      
      expect(hasPermission).toBe(true);
    });

    it('should deny deleting products for manager users', () => {
      const user = {
        id: commonFixture.generateId(),
        email: commonFixture.generateEmail(),
        role: 'MANAGER',
      };

      const hasPermission = checkPermission(user, 'product:delete');
      
      expect(hasPermission).toBe(false);
    });
  });

  describe('Session Validation', () => {
    it('should validate active session', () => {
      const session = {
        id: commonFixture.generateId(),
        userId: commonFixture.generateId(),
        expiresAt: commonFixture.generateFutureDate(),
        isActive: true,
      };

      const isValid = validateSession(session);
      
      expect(isValid).toBe(true);
    });

    it('should reject expired session', () => {
      const session = {
        id: commonFixture.generateId(),
        userId: commonFixture.generateId(),
        expiresAt: commonFixture.generatePastDate(),
        isActive: true,
      };

      const isValid = validateSession(session);
      
      expect(isValid).toBe(false);
    });

    it('should reject inactive session', () => {
      const session = {
        id: commonFixture.generateId(),
        userId: commonFixture.generateId(),
        expiresAt: commonFixture.generateFutureDate(),
        isActive: false,
      };

      const isValid = validateSession(session);
      
      expect(isValid).toBe(false);
    });

    it('should reject session with missing userId', () => {
      const session = {
        id: commonFixture.generateId(),
        expiresAt: commonFixture.generateFutureDate(),
        isActive: true,
      };

      const isValid = validateSession(session as any);
      
      expect(isValid).toBe(false);
    });
  });

  describe('API Key Validation', () => {
    it('should validate correct API key format', () => {
      const apiKey = 'lw_live_' + commonFixture.generateId();
      
      const isValid = validateApiKeyFormat(apiKey);
      
      expect(isValid).toBe(true);
    });

    it('should reject invalid API key format', () => {
      const apiKey = 'invalid_key_format';
      
      const isValid = validateApiKeyFormat(apiKey);
      
      expect(isValid).toBe(false);
    });

    it('should validate test API key format', () => {
      const apiKey = 'lw_test_' + commonFixture.generateId();
      
      const isValid = validateApiKeyFormat(apiKey);
      
      expect(isValid).toBe(true);
    });

    it('should reject empty API key', () => {
      const apiKey = '';
      
      const isValid = validateApiKeyFormat(apiKey);
      
      expect(isValid).toBe(false);
    });
  });

  describe('Authentication Headers', () => {
    it('should extract valid Bearer token from header', () => {
      const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9';
      const header = `Bearer ${token}`;
      
      const extracted = extractTokenFromHeader(header);
      
      expect(extracted).toBe(token);
    });

    it('should return null for missing Authorization header', () => {
      const extracted = extractTokenFromHeader(undefined);
      
      expect(extracted).toBeNull();
    });

    it('should return null for invalid header format', () => {
      const header = 'InvalidFormat token123';
      
      const extracted = extractTokenFromHeader(header);
      
      expect(extracted).toBeNull();
    });

    it('should return null for Bearer without token', () => {
      const header = 'Bearer ';
      
      const extracted = extractTokenFromHeader(header);
      
      expect(extracted).toBeNull();
    });
  });

  describe('User Context', () => {
    it('should create user context from valid token', () => {
      const tokenPayload = {
        userId: commonFixture.generateId(),
        email: commonFixture.generateEmail(),
        role: 'ADMIN',
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 3600,
      };

      const context = createUserContext(tokenPayload);
      
      expect(context).toHaveProperty('userId', tokenPayload.userId);
      expect(context).toHaveProperty('email', tokenPayload.email);
      expect(context).toHaveProperty('role', tokenPayload.role);
    });

    it('should return null context for invalid token', () => {
      const tokenPayload = {
        email: commonFixture.generateEmail(),
        role: 'USER',
      };

      const context = createUserContext(tokenPayload as any);
      
      expect(context).toBeNull();
    });

    it('should include permissions in user context', () => {
      const tokenPayload = {
        userId: commonFixture.generateId(),
        email: commonFixture.generateEmail(),
        role: 'ADMIN',
        permissions: ['product:read', 'product:create', 'product:update'],
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 3600,
      };

      const context = createUserContext(tokenPayload);
      
      expect(context).toHaveProperty('permissions');
      expect(context?.permissions).toContain('product:read');
    });
  });

  describe('Rate Limiting Validation', () => {
    it('should allow requests within rate limit', () => {
      const requestCount = 5;
      const limit = 10;
      
      const isAllowed = checkRateLimit(requestCount, limit);
      
      expect(isAllowed).toBe(true);
    });

    it('should deny requests exceeding rate limit', () => {
      const requestCount = 15;
      const limit = 10;
      
      const isAllowed = checkRateLimit(requestCount, limit);
      
      expect(isAllowed).toBe(false);
    });

    it('should allow requests at exact rate limit', () => {
      const requestCount = 10;
      const limit = 10;
      
      const isAllowed = checkRateLimit(requestCount, limit);
      
      expect(isAllowed).toBe(true);
    });
  });
});



function validateTokenPayload(payload: any): boolean {
  if (!payload.userId || !payload.email) return false;
  if (!['USER', 'ADMIN', 'SUPER_ADMIN', 'MANAGER'].includes(payload.role)) return false;
  if (payload.exp < Math.floor(Date.now() / 1000)) return false;
  return true;
}

function checkRoleAccess(user: any, allowedRoles: string[]): boolean {
  if (user.role === 'SUPER_ADMIN') return true;
  return allowedRoles.includes(user.role);
}

function checkPermission(user: any | null, permission: string): boolean {
  
  if (permission === 'product:read' && !user) return true;
  
 
  if (user?.role === 'ADMIN') {
    return ['product:create', 'product:update', 'product:delete', 'product:read'].includes(permission);
  }
  

  if (user?.role === 'MANAGER') {
    return ['product:create', 'product:update', 'product:read'].includes(permission);
  }
  
  return false;
}

function validateSession(session: any): boolean {
  if (!session.userId || !session.id) return false;
  if (!session.isActive) return false;
  if (new Date(session.expiresAt) < new Date()) return false;
  return true;
}

function validateApiKeyFormat(apiKey: string): boolean {
  if (!apiKey) return false;
  const pattern = /^lw_(live|test)_[a-f0-9-]{36}$/;
  return pattern.test(apiKey);
}

function extractTokenFromHeader(header: string | undefined): string | null {
  if (!header) return null;
  const parts = header.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') return null;
  if (!parts[1]) return null;
  return parts[1];
}

function createUserContext(payload: any): any {
  if (!validateTokenPayload(payload)) return null;
  
  return {
    userId: payload.userId,
    email: payload.email,
    role: payload.role,
    permissions: payload.permissions || [],
  };
}

function checkRateLimit(requestCount: number, limit: number): boolean {
  return requestCount <= limit;
}