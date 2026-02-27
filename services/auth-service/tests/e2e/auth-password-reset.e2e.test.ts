import request from 'supertest';
import { Application } from 'express';
import { createApp } from '../../src/app';
import { prisma } from '../../src/infrastructure/db/prisma.client';
import * as bcrypt from 'bcrypt';

// ─── Helper: get the latest unused password reset token for a user ─────────────
// Your schema stores reset tokens in a separate PasswordReset table,
// NOT as fields on the User model (resetPasswordToken / resetPasswordExpires
// do not exist on User). All token lookups use this helper.
// Adjust the model accessor name below if your Prisma model is named differently
// (e.g. prismaAny.passwordResetToken, prismaAny.passwordResetRequest, etc.)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const prismaAny = prisma as any;

async function getLatestResetToken(userId: string): Promise<{ id: string; token: string; expiresAt: Date } | null> {
  return await prismaAny.passwordReset.findFirst({
    where: { userId, isUsed: false },
    orderBy: { createdAt: 'desc' },
  });
}

// ─── Helper: create a standard test user ──────────────────────────────────────
async function createTestUser(overrides: {
  email: string;
  firstName: string;
  lastName: string;
  isVerified?: boolean;
  isActive?: boolean;
  password?: string;
}) {
  const hashedPassword = await bcrypt.hash(overrides.password ?? 'OldPassword123!', 10);
  return prismaAny.user.create({
    data: {
      email: overrides.email,
      password: hashedPassword,
      firstName: overrides.firstName,
      lastName: overrides.lastName,
      phone: '+1234567890',
      isActive: overrides.isActive ?? true,
      emailVerified: overrides.isVerified ?? true,  // ← schema field is emailVerified, not isVerified
    },
  });
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('Password Reset E2E Tests', () => {
  let app: Application;

  beforeAll(async () => {
    app = createApp();
    await prisma.$connect();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  beforeEach(async () => {
    await prismaAny.passwordReset.deleteMany();
    await prismaAny.session.deleteMany();
    await prismaAny.user.deleteMany();
  });

  // ── Standard Password Reset Flow ────────────────────────────────────────────
  describe('Standard Password Reset Flow', () => {
    beforeEach(async () => {
      await createTestUser({ email: 'reset@example.com', firstName: 'Reset', lastName: 'User' });
    });

    it('should complete full password reset flow successfully', async () => {
      const loginBeforeReset = await request(app)
        .post('/v1/auth/login')
        .send({ email: 'reset@example.com', password: 'OldPassword123!' })
        .expect(200);

      expect(loginBeforeReset.body.success).toBe(true);

      const forgotPasswordResponse = await request(app)
        .post('/v1/auth/forgot-password')
        .send({ email: 'reset@example.com' })
        .expect(200);

      expect(forgotPasswordResponse.body.success).toBe(true);
      expect(forgotPasswordResponse.body.message).toContain('Password reset email sent');

      const user = await prismaAny.user.findUnique({ where: { email: 'reset@example.com' } });
      const resetRecord = await getLatestResetToken(user.id);

      expect(resetRecord).toBeTruthy();
      expect(resetRecord!.expiresAt.getTime()).toBeGreaterThan(Date.now());

      const resetToken = resetRecord!.token;

      const resetPasswordResponse = await request(app)
        .post('/v1/auth/reset-password')
        .send({ token: resetToken, password: 'NewPassword123!' })
        .expect(200);

      expect(resetPasswordResponse.body.success).toBe(true);
      expect(resetPasswordResponse.body.message).toContain('Password reset successful');

      // Token should be marked as used after reset
      const usedRecord = await prismaAny.passwordReset.findFirst({
        where: { userId: user.id, token: resetToken },
      });
      expect(usedRecord?.isUsed).toBe(true);

      const updatedUser = await prismaAny.user.findUnique({ where: { email: 'reset@example.com' } });
      const isNewPasswordValid = await bcrypt.compare('NewPassword123!', updatedUser.password);
      expect(isNewPasswordValid).toBe(true);

      await request(app)
        .post('/v1/auth/login')
        .send({ email: 'reset@example.com', password: 'OldPassword123!' })
        .expect(401);

      const loginWithNewPassword = await request(app)
        .post('/v1/auth/login')
        .send({ email: 'reset@example.com', password: 'NewPassword123!' })
        .expect(200);

      expect(loginWithNewPassword.body.success).toBe(true);
      expect(loginWithNewPassword.body.data.token).toBeDefined();
    });

    it('should generate unique reset tokens for multiple requests', async () => {
      const user = await prismaAny.user.findUnique({ where: { email: 'reset@example.com' } });

      await request(app)
        .post('/v1/auth/forgot-password')
        .send({ email: 'reset@example.com' })
        .expect(200);

      const record1 = await getLatestResetToken(user.id);
      const token1 = record1!.token;

      await new Promise((resolve) => setTimeout(resolve, 100));

      await request(app)
        .post('/v1/auth/forgot-password')
        .send({ email: 'reset@example.com' })
        .expect(200);

      const record2 = await getLatestResetToken(user.id);
      const token2 = record2!.token;

      expect(token1).not.toBe(token2);

      // Old token should be invalidated (marked used) by the second request
      await request(app)
        .post('/v1/auth/reset-password')
        .send({ token: token1, password: 'NewPassword123!' })
        .expect(400);

      await request(app)
        .post('/v1/auth/reset-password')
        .send({ token: token2, password: 'NewPassword123!' })
        .expect(200);
    });

    it('should invalidate all active sessions after password reset', async () => {
      const session1 = await request(app)
        .post('/v1/auth/login')
        .send({ email: 'reset@example.com', password: 'OldPassword123!' })
        .expect(200);
      const token1 = session1.body.data.token;

      const session2 = await request(app)
        .post('/v1/auth/login')
        .send({ email: 'reset@example.com', password: 'OldPassword123!' })
        .expect(200);
      const token2 = session2.body.data.token;

      await request(app).get('/v1/auth/me').set('Authorization', `Bearer ${token1}`).expect(200);
      await request(app).get('/v1/auth/me').set('Authorization', `Bearer ${token2}`).expect(200);

      const user = await prismaAny.user.findUnique({
        where: { email: 'reset@example.com' },
        include: { sessions: true },
      });
      expect(user.sessions.length).toBe(2);

      await request(app)
        .post('/v1/auth/forgot-password')
        .send({ email: 'reset@example.com' })
        .expect(200);

      const resetRecord = await getLatestResetToken(user.id);
      const resetToken = resetRecord!.token;

      await request(app)
        .post('/v1/auth/reset-password')
        .send({ token: resetToken, password: 'NewPassword123!' })
        .expect(200);

      await request(app).get('/v1/auth/me').set('Authorization', `Bearer ${token1}`).expect(401);
      await request(app).get('/v1/auth/me').set('Authorization', `Bearer ${token2}`).expect(401);

      const finalUser = await prismaAny.user.findUnique({
        where: { email: 'reset@example.com' },
        include: { sessions: true },
      });
      expect(finalUser.sessions.length).toBe(0);
    });
  });

  // ── Token Expiration and Validation ─────────────────────────────────────────
  describe('Token Expiration and Validation', () => {
    beforeEach(async () => {
      await createTestUser({ email: 'expiry@example.com', firstName: 'Expiry', lastName: 'User' });
    });

    it('should reject expired reset token', async () => {
      const user = await prismaAny.user.findUnique({ where: { email: 'expiry@example.com' } });

      await request(app)
        .post('/v1/auth/forgot-password')
        .send({ email: 'expiry@example.com' })
        .expect(200);

      const resetRecord = await getLatestResetToken(user.id);
      const resetToken = resetRecord!.token;

      // Force-expire the token directly in the PasswordReset table
      await prismaAny.passwordReset.update({
        where: { id: resetRecord!.id },
        data: { expiresAt: new Date(Date.now() - 1000) },
      });

      const resetResponse = await request(app)
        .post('/v1/auth/reset-password')
        .send({ token: resetToken, password: 'NewPassword123!' })
        .expect(400);

      expect(resetResponse.body.success).toBe(false);
      expect(resetResponse.body.error.message).toContain('expired');

      await request(app)
        .post('/v1/auth/login')
        .send({ email: 'expiry@example.com', password: 'NewPassword123!' })
        .expect(401);

      await request(app)
        .post('/v1/auth/login')
        .send({ email: 'expiry@example.com', password: 'OldPassword123!' })
        .expect(200);
    });

    it('should reject invalid reset token format', async () => {
      const invalidTokens = ['', 'invalid-token', '12345', 'a'.repeat(100), 'null', 'undefined'];
      for (const token of invalidTokens) {
        await request(app)
          .post('/v1/auth/reset-password')
          .send({ token, password: 'NewPassword123!' })
          .expect(400);
      }
    });

    it('should reject non-existent reset token', async () => {
      const resetResponse = await request(app)
        .post('/v1/auth/reset-password')
        .send({ token: 'non-existent-token-123456789', password: 'NewPassword123!' })
        .expect(400);

      expect(resetResponse.body.success).toBe(false);
      expect(resetResponse.body.error.message).toContain('Invalid or expired');
    });

    it('should prevent reusing reset token after successful password change', async () => {
      const user = await prismaAny.user.findUnique({ where: { email: 'expiry@example.com' } });

      await request(app)
        .post('/v1/auth/forgot-password')
        .send({ email: 'expiry@example.com' })
        .expect(200);

      const resetRecord = await getLatestResetToken(user.id);
      const resetToken = resetRecord!.token;

      await request(app)
        .post('/v1/auth/reset-password')
        .send({ token: resetToken, password: 'FirstNewPassword123!' })
        .expect(200);

      await request(app)
        .post('/v1/auth/reset-password')
        .send({ token: resetToken, password: 'SecondNewPassword123!' })
        .expect(400);

      await request(app)
        .post('/v1/auth/login')
        .send({ email: 'expiry@example.com', password: 'FirstNewPassword123!' })
        .expect(200);

      await request(app)
        .post('/v1/auth/login')
        .send({ email: 'expiry@example.com', password: 'SecondNewPassword123!' })
        .expect(401);
    });

    it('should set appropriate expiration time for reset tokens', async () => {
      const user = await prismaAny.user.findUnique({ where: { email: 'expiry@example.com' } });

      await request(app)
        .post('/v1/auth/forgot-password')
        .send({ email: 'expiry@example.com' })
        .expect(200);

      const resetRecord = await getLatestResetToken(user.id);
      const expiresAt = resetRecord!.expiresAt;
      const now = new Date();
      const oneHour = 60 * 60 * 1000;
      const timeDiff = expiresAt.getTime() - now.getTime();

      expect(timeDiff).toBeGreaterThan(0);
      expect(timeDiff).toBeLessThanOrEqual(oneHour);
    });
  });

  // ── Password Validation During Reset ────────────────────────────────────────
  describe('Password Validation During Reset', () => {
    beforeEach(async () => {
      await createTestUser({ email: 'validation@example.com', firstName: 'Validation', lastName: 'User' });

      await request(app)
        .post('/v1/auth/forgot-password')
        .send({ email: 'validation@example.com' })
        .expect(200);
    });

    it('should reject weak passwords during reset', async () => {
      const user = await prismaAny.user.findUnique({ where: { email: 'validation@example.com' } });
      const resetRecord = await getLatestResetToken(user.id);
      const resetToken = resetRecord!.token;

      const weakPasswords = ['123', 'password', 'abc123', '12345678', 'Password', 'password123'];
      for (const weakPassword of weakPasswords) {
        await request(app)
          .post('/v1/auth/reset-password')
          .send({ token: resetToken, password: weakPassword })
          .expect(400);
      }

      await request(app)
        .post('/v1/auth/login')
        .send({ email: 'validation@example.com', password: 'OldPassword123!' })
        .expect(200);
    });

    it('should enforce password complexity requirements', async () => {
      const user = await prismaAny.user.findUnique({ where: { email: 'validation@example.com' } });
      const resetRecord = await getLatestResetToken(user.id);
      const resetToken = resetRecord!.token;

      await request(app)
        .post('/v1/auth/reset-password')
        .send({ token: resetToken, password: 'nouppercase123!' })
        .expect(400);

      await request(app)
        .post('/v1/auth/reset-password')
        .send({ token: resetToken, password: 'NOLOWERCASE123!' })
        .expect(400);

      await request(app)
        .post('/v1/auth/reset-password')
        .send({ token: resetToken, password: 'NoNumbers!' })
        .expect(400);

      await request(app)
        .post('/v1/auth/reset-password')
        .send({ token: resetToken, password: 'NoSpecialChar123' })
        .expect(400);

      await request(app)
        .post('/v1/auth/reset-password')
        .send({ token: resetToken, password: 'ValidPassword123!' })
        .expect(200);
    });

    it('should prevent setting password same as old password', async () => {
      const user = await prismaAny.user.findUnique({ where: { email: 'validation@example.com' } });
      const resetRecord = await getLatestResetToken(user.id);
      const resetToken = resetRecord!.token;

      const response = await request(app)
        .post('/v1/auth/reset-password')
        .send({ token: resetToken, password: 'OldPassword123!' })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toContain('same as');
    });

    it('should validate password length requirements', async () => {
      const user = await prismaAny.user.findUnique({ where: { email: 'validation@example.com' } });
      const resetRecord = await getLatestResetToken(user.id);
      const resetToken = resetRecord!.token;

      await request(app)
        .post('/v1/auth/reset-password')
        .send({ token: resetToken, password: 'Short1!' })
        .expect(400);

      await request(app)
        .post('/v1/auth/reset-password')
        .send({ token: resetToken, password: 'a'.repeat(129) + 'A1!' })
        .expect(400);

      await request(app)
        .post('/v1/auth/reset-password')
        .send({ token: resetToken, password: 'ValidLength123!' })
        .expect(200);
    });
  });

  // ── Security and Edge Cases ──────────────────────────────────────────────────
  describe('Security and Edge Cases', () => {
    beforeEach(async () => {
      await createTestUser({
        email: 'security@example.com',
        firstName: 'Security',
        lastName: 'User',
        password: 'Password123!',
      });
    });

    it('should not reveal if email exists during forgot password request', async () => {
      const existingEmailResponse = await request(app)
        .post('/v1/auth/forgot-password')
        .send({ email: 'security@example.com' })
        .expect(200);

      const nonExistentEmailResponse = await request(app)
        .post('/v1/auth/forgot-password')
        .send({ email: 'nonexistent@example.com' })
        .expect(200);

      expect(existingEmailResponse.body.message).toBe(nonExistentEmailResponse.body.message);
      expect(existingEmailResponse.body.success).toBe(true);
      expect(nonExistentEmailResponse.body.success).toBe(true);
    });

    it('should handle concurrent password reset requests gracefully', async () => {
      const requests = Array(5)
        .fill(null)
        .map(() =>
          request(app).post('/v1/auth/forgot-password').send({ email: 'security@example.com' })
        );

      const responses = await Promise.all(requests);
      responses.forEach((response) => {
        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
      });

      const user = await prismaAny.user.findUnique({ where: { email: 'security@example.com' } });
      const resetRecord = await getLatestResetToken(user.id);
      expect(resetRecord).toBeTruthy();
    });

    it('should prevent password reset for inactive accounts', async () => {
      await prismaAny.user.update({
        where: { email: 'security@example.com' },
        data: { isActive: false },
      });

      const response = await request(app)
        .post('/v1/auth/forgot-password')
        .send({ email: 'security@example.com' })
        .expect(200);

      expect(response.body.success).toBe(true);

      const user = await prismaAny.user.findUnique({ where: { email: 'security@example.com' } });
      const resetRecord = await getLatestResetToken(user.id);
      expect(resetRecord).toBeNull();
    });

    it('should handle password reset for unverified accounts', async () => {
      await createTestUser({
        email: 'unverified@example.com',
        firstName: 'Unverified',
        lastName: 'User',
        isVerified: false,
        password: 'Password123!',
      });

      await request(app)
        .post('/v1/auth/forgot-password')
        .send({ email: 'unverified@example.com' })
        .expect(200);

      const user = await prismaAny.user.findUnique({ where: { email: 'unverified@example.com' } });
      const resetRecord = await getLatestResetToken(user.id);
      expect(resetRecord).toBeTruthy();

      const resetToken = resetRecord!.token;

      await request(app)
        .post('/v1/auth/reset-password')
        .send({ token: resetToken, password: 'NewPassword123!' })
        .expect(200);

      await request(app)
        .post('/v1/auth/login')
        .send({ email: 'unverified@example.com', password: 'NewPassword123!' })
        .expect(403);
    });

    it('should sanitize and validate email input', async () => {
      const invalidEmails = [
        'invalid-email',
        '@example.com',
        'test@',
        'test @example.com',
        'test@example',
      ];

      for (const email of invalidEmails) {
        await request(app).post('/v1/auth/forgot-password').send({ email }).expect(400);
      }

      const validEmailResponse = await request(app)
        .post('/v1/auth/forgot-password')
        .send({ email: '  security@example.com  ' })
        .expect(200);

      expect(validEmailResponse.body.success).toBe(true);
    });

    it('should handle case-insensitive email lookup', async () => {
      const [r1, r2, r3] = await Promise.all([
        request(app).post('/v1/auth/forgot-password').send({ email: 'SECURITY@EXAMPLE.COM' }),
        request(app).post('/v1/auth/forgot-password').send({ email: 'Security@Example.com' }),
        request(app).post('/v1/auth/forgot-password').send({ email: 'security@example.com' }),
      ]);

      expect(r1.status).toBe(200);
      expect(r2.status).toBe(200);
      expect(r3.status).toBe(200);
      expect(r1.body.success).toBe(true);
      expect(r2.body.success).toBe(true);
      expect(r3.body.success).toBe(true);
    });
  });

  // ── Multiple Password Reset Scenarios ───────────────────────────────────────
  describe('Multiple Password Reset Scenarios', () => {
    beforeEach(async () => {
      await createTestUser({
        email: 'multiple@example.com',
        firstName: 'Multiple',
        lastName: 'Reset',
        password: 'InitialPassword123!',
      });
    });

    it('should handle multiple sequential password resets', async () => {
      for (let i = 1; i <= 3; i++) {
        await request(app)
          .post('/v1/auth/forgot-password')
          .send({ email: 'multiple@example.com' })
          .expect(200);

        const user = await prismaAny.user.findUnique({ where: { email: 'multiple@example.com' } });
        const resetRecord = await getLatestResetToken(user.id);
        const resetToken = resetRecord!.token;

        await request(app)
          .post('/v1/auth/reset-password')
          .send({ token: resetToken, password: `NewPassword${i}123!` })
          .expect(200);

        await request(app)
          .post('/v1/auth/login')
          .send({ email: 'multiple@example.com', password: `NewPassword${i}123!` })
          .expect(200);
      }
    });

    it('should track password reset history', async () => {
      await request(app)
        .post('/v1/auth/forgot-password')
        .send({ email: 'multiple@example.com' })
        .expect(200);

      const userBefore = await prismaAny.user.findUnique({ where: { email: 'multiple@example.com' } });
      const updatedAtBefore = userBefore.updatedAt;
      const resetRecord = await getLatestResetToken(userBefore.id);
      const resetToken = resetRecord!.token;

      await new Promise((resolve) => setTimeout(resolve, 100));

      await request(app)
        .post('/v1/auth/reset-password')
        .send({ token: resetToken, password: 'ChangedPassword123!' })
        .expect(200);

      const userAfter = await prismaAny.user.findUnique({ where: { email: 'multiple@example.com' } });
      expect(userAfter.updatedAt.getTime()).toBeGreaterThan(updatedAtBefore.getTime());
    });

    it('should allow immediate login after password reset', async () => {
      await request(app)
        .post('/v1/auth/forgot-password')
        .send({ email: 'multiple@example.com' })
        .expect(200);

      const user = await prismaAny.user.findUnique({ where: { email: 'multiple@example.com' } });
      const resetRecord = await getLatestResetToken(user.id);
      const resetToken = resetRecord!.token;

      await request(app)
        .post('/v1/auth/reset-password')
        .send({ token: resetToken, password: 'ImmediateLogin123!' })
        .expect(200);

      const loginResponse = await request(app)
        .post('/v1/auth/login')
        .send({ email: 'multiple@example.com', password: 'ImmediateLogin123!' })
        .expect(200);

      expect(loginResponse.body.success).toBe(true);
      expect(loginResponse.body.data.token).toBeDefined();

      await request(app)
        .get('/v1/auth/me')
        .set('Authorization', `Bearer ${loginResponse.body.data.token}`)
        .expect(200);
    });
  });
});