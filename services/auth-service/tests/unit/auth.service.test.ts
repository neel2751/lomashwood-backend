import { AuthService } from '../../src/app/auth/auth.service';
import { AuthRepository } from '../../src/app/auth/auth.repository';
import { SessionRepository } from '../../src/app/sessions/session.repository';

jest.mock('../../src/infrastructure/auth/password', () => ({
  hashPassword:          jest.fn(),
  comparePassword:       jest.fn(),
  isPasswordStrong:      jest.fn(),
  generateRandomPassword: jest.fn(),
}));

jest.mock('../../src/config/logger', () => ({
  logger: {
    info:  jest.fn(),
    warn:  jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
  },
}));

import {
  hashPassword,
  comparePassword,
} from '../../src/infrastructure/auth/password';

import { Factories } from '../../src/tests-helpers/factories';

const mockedHashPassword    = hashPassword    as jest.MockedFunction<typeof hashPassword>;
const mockedComparePassword = comparePassword as jest.MockedFunction<typeof comparePassword>;

const makeDbUser = (overrides: Record<string, unknown> = {}) => ({
  id:              'user-123',
  email:           'user@example.com',
  password:        'hashed_password',
  firstName:       'Test',
  lastName:        'User',
  phone:           null,
  isEmailVerified: true,
  isActive:        true,
  roles:           [],
  lastLoginAt:     null,
  createdAt:       new Date(),
  updatedAt:       new Date(),
  ...overrides,
});

describe('AuthService', () => {
  let authService: AuthService;
  let authRepository: jest.Mocked<AuthRepository>;
  let sessionRepository: jest.Mocked<SessionRepository>;

  beforeEach(() => {
    authRepository = {
      findByEmail:                  jest.fn(),
      findById:                     jest.fn(),
      create:                       jest.fn(),
      update:                       jest.fn(),
      updatePassword:               jest.fn(),
      updateLastLogin:              jest.fn(),
      createEmailVerification:      jest.fn(),
      findEmailVerificationByToken: jest.fn(),
      markEmailAsVerified:          jest.fn(),
      markEmailVerificationAsUsed:  jest.fn(),
      createPasswordReset:          jest.fn(),
      findPasswordResetByToken:     jest.fn(),
      markPasswordResetAsUsed:      jest.fn(),
    } as any;

    sessionRepository = {
      create:             jest.fn(),
      findByRefreshToken: jest.fn(),
      delete:             jest.fn(),
      deleteAllByUserId:  jest.fn(),
      update:             jest.fn(),
    } as any;

    authService = new AuthService(authRepository, sessionRepository);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('register', () => {
    it('should register a new user successfully', async () => {
      const input = {
        email:     'newuser@example.com',
        password:  'Test@1234',
        firstName: 'New',
        lastName:  'User',
        phone:     '+1234567890',
      };

      const createdUser = makeDbUser({
        id:    'new-user-id',
        email: input.email,
        firstName: input.firstName,
        lastName:  input.lastName,
        isEmailVerified: false,
      });

      authRepository.findByEmail.mockResolvedValue(null);
      mockedHashPassword.mockResolvedValue('hashed_password');
      authRepository.create.mockResolvedValue(createdUser as any);
      authRepository.createEmailVerification.mockResolvedValue(undefined as any);

      const result = await authService.register(input);

      expect(authRepository.findByEmail).toHaveBeenCalledWith(input.email);
      expect(mockedHashPassword).toHaveBeenCalledWith(input.password);
      expect(authRepository.create).toHaveBeenCalled();
      expect(authRepository.createEmailVerification).toHaveBeenCalled();
      expect(result.user.email).toBe(input.email);
      expect(result.message).toBeDefined();

      expect((result.user as any).password).toBeUndefined();
    });

    it('should throw if user already exists', async () => {
      const input = {
        email: 'existing@example.com', password: 'Test@1234',
        firstName: 'Existing', lastName: 'User',
      };

      authRepository.findByEmail.mockResolvedValue(makeDbUser({ email: input.email }) as any);

      await expect(authService.register(input)).rejects.toThrow();
      expect(authRepository.create).not.toHaveBeenCalled();
    });

    it('should propagate hashPassword errors', async () => {
      const input = {
        email: 'new@example.com', password: 'Test@1234',
        firstName: 'New', lastName: 'User',
      };

      authRepository.findByEmail.mockResolvedValue(null);
      mockedHashPassword.mockRejectedValue(new Error('Hashing failed'));

      await expect(authService.register(input)).rejects.toThrow('Hashing failed');
      expect(authRepository.create).not.toHaveBeenCalled();
    });
  });

  describe('login', () => {
    it('should login successfully and return tokens + user profile', async () => {
      const input = { email: 'user@example.com', password: 'Test@1234' };
      const user  = makeDbUser();

      authRepository.findByEmail.mockResolvedValue(user as any);
      mockedComparePassword.mockResolvedValue(true);
      sessionRepository.create.mockResolvedValue(undefined as any);
      authRepository.updateLastLogin.mockResolvedValue(undefined as any);

      const result = await authService.login(input);

      expect(authRepository.findByEmail).toHaveBeenCalledWith(input.email);
      expect(mockedComparePassword).toHaveBeenCalledWith(input.password, user.password);
      expect(sessionRepository.create).toHaveBeenCalled();
      expect(authRepository.updateLastLogin).toHaveBeenCalledWith(user.id);
      expect(result.user.email).toBe(user.email);
      expect(result.accessToken).toBeDefined();
      expect(result.refreshToken).toBeDefined();
      expect(result.expiresIn).toBe(3600);
    });

    it('should throw if user not found', async () => {
      authRepository.findByEmail.mockResolvedValue(null);

      await expect(
        authService.login({ email: 'ghost@example.com', password: 'Test@1234' })
      ).rejects.toThrow();
    });

    it('should throw if account is inactive', async () => {
      authRepository.findByEmail.mockResolvedValue(makeDbUser({ isActive: false }) as any);

      await expect(
        authService.login({ email: 'user@example.com', password: 'Test@1234' })
      ).rejects.toThrow();
    });

    it('should throw if password is incorrect', async () => {
      authRepository.findByEmail.mockResolvedValue(makeDbUser() as any);
      mockedComparePassword.mockResolvedValue(false);

      await expect(
        authService.login({ email: 'user@example.com', password: 'wrong' })
      ).rejects.toThrow();

      expect(sessionRepository.create).not.toHaveBeenCalled();
    });

    it('should warn but still login when email is not verified', async () => {
      const user = makeDbUser({ isEmailVerified: false });

      authRepository.findByEmail.mockResolvedValue(user as any);
      mockedComparePassword.mockResolvedValue(true);
      sessionRepository.create.mockResolvedValue(undefined as any);
      authRepository.updateLastLogin.mockResolvedValue(undefined as any);

      const result = await authService.login({ email: user.email, password: 'Test@1234' });

      expect(result.user.email).toBe(user.email);
      expect(result.accessToken).toBeDefined();
    });
  });

  describe('logout', () => {
    it('should blacklist the token without throwing', async () => {
      const token = 'some-valid-access-token';

      (sessionRepository as any).deleteByToken = jest.fn().mockResolvedValue(undefined);

      await expect(authService.logout(token)).resolves.not.toThrow();
    });
  });

  describe('refreshToken', () => {
    it('should throw if internal token verification fails', async () => {

      await expect(authService.refreshToken('not.a.real.token')).rejects.toThrow();
    })

    it('should throw if session is not found', async () => {
      sessionRepository.findByRefreshToken.mockResolvedValue(null);

      await expect(authService.refreshToken('invalid.token.sig')).rejects.toThrow();
    });

    it('should throw if session is expired', async () => {
      const expired = Factories.Session.createExpired();
      sessionRepository.findByRefreshToken.mockResolvedValue(expired as any);

      await expect(authService.refreshToken('invalid.token.sig')).rejects.toThrow();
    });
  });

  describe('changePassword', () => {
    it('should change password successfully', async () => {
      const userId          = 'user-id';
      const currentPassword = 'Current@1234';
      const newPassword     = 'NewPassword@1234';
      const user            = makeDbUser({ id: userId, password: 'hashed_current' });

      authRepository.findById.mockResolvedValue(user as any);
      mockedComparePassword.mockResolvedValue(true);
      mockedHashPassword.mockResolvedValue('hashed_new');
      authRepository.updatePassword.mockResolvedValue(undefined as any);

      await authService.changePassword(userId, currentPassword, newPassword);

      expect(authRepository.findById).toHaveBeenCalledWith(userId);
      expect(mockedComparePassword).toHaveBeenCalledWith(currentPassword, user.password);
      expect(mockedHashPassword).toHaveBeenCalledWith(newPassword);
      expect(authRepository.updatePassword).toHaveBeenCalledWith(userId, 'hashed_new');
    });

    it('should throw if user not found', async () => {
      authRepository.findById.mockResolvedValue(null);

      await expect(
        authService.changePassword('bad-id', 'Current@1234', 'New@1234')
      ).rejects.toThrow();

      expect(authRepository.updatePassword).not.toHaveBeenCalled();
    });

    it('should throw if current password is incorrect', async () => {
      const user = makeDbUser({ id: 'user-id' });

      authRepository.findById.mockResolvedValue(user as any);
      mockedComparePassword.mockResolvedValue(false);

      await expect(
        authService.changePassword('user-id', 'Wrong@1234', 'New@1234')
      ).rejects.toThrow();

      expect(authRepository.updatePassword).not.toHaveBeenCalled();
    });
  });

  describe('forgotPassword', () => {
    it('should create reset token for existing user without throwing', async () => {
      const email = 'user@example.com';
      const user  = makeDbUser({ email });

      authRepository.findByEmail.mockResolvedValue(user as any);
      authRepository.createPasswordReset.mockResolvedValue(undefined as any);

      await expect(authService.forgotPassword(email)).resolves.not.toThrow();

      expect(authRepository.findByEmail).toHaveBeenCalledWith(email);
      expect(authRepository.createPasswordReset).toHaveBeenCalled();
    });

    it('should silently return without throwing for non-existent email', async () => {
      authRepository.findByEmail.mockResolvedValue(null);

      await expect(
        authService.forgotPassword('ghost@example.com')
      ).resolves.not.toThrow();

      expect(authRepository.createPasswordReset).not.toHaveBeenCalled();
    });
  });

  describe('getUserProfile', () => {
    it('should return a mapped user profile', async () => {
      const userId = 'user-id';
      const user   = makeDbUser({ id: userId });

      authRepository.findById.mockResolvedValue(user as any);

      const result = await authService.getUserProfile(userId);

      expect(authRepository.findById).toHaveBeenCalledWith(userId);
      expect(result.id).toBe(userId);
      expect(result.email).toBe(user.email);
      expect((result as any).password).toBeUndefined();
    });

    it('should throw if user not found', async () => {
      authRepository.findById.mockResolvedValue(null);

      await expect(authService.getUserProfile('bad-id')).rejects.toThrow();
    });
  });
});