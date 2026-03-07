import { AuthService } from '../../services/auth.service';
import { HttpClient } from '../../utils/http';

// Mock HttpClient
jest.mock('../../utils/http');

describe('AuthService', () => {
  let authService: AuthService;
  let mockHttpClient: jest.Mocked<HttpClient>;

  beforeEach(() => {
    mockHttpClient = {} as unknown as jest.Mocked<HttpClient>;
    mockHttpClient.get = jest.fn();
    mockHttpClient.post = jest.fn();
    mockHttpClient.put = jest.fn();
    mockHttpClient.delete = jest.fn();
    authService = new AuthService(mockHttpClient);
  });

  describe('login', () => {
    it('should login successfully', async () => {
      const loginData = {
        email: 'test@example.com',
        password: 'password123'
      };

      const expectedResponse = {
        user: {
          id: 'user-123',
          email: 'test@example.com',
          firstName: 'John',
          lastName: 'Doe',
        },
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
      };

      mockHttpClient.post.mockResolvedValue(expectedResponse);

      const result = await authService.login(loginData);

      expect(mockHttpClient.post).toHaveBeenCalledWith('/auth/login', loginData);
      expect(result).toEqual(expectedResponse);
    });

    it('should handle login error', async () => {
      const loginData = {
        email: 'test@example.com',
        password: 'wrong-password'
      };

      const errorResponse = {
        response: {
          status: 401,
          data: { message: 'Invalid credentials' }
        }
      };

      mockHttpClient.post.mockRejectedValue(errorResponse);

      await expect(authService.login(loginData)).rejects.toThrow();
    });
  });

  describe('register', () => {
    it('should register successfully', async () => {
      const registerData = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        password: 'Password123!',
        phone: '+447123456789'
      };

      const expectedResponse = {
        user: {
          id: 'user-123',
          email: 'john@example.com',
          firstName: 'John',
          lastName: 'Doe',
        },
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
      };

      mockHttpClient.post.mockResolvedValue(expectedResponse);

      const result = await authService.register(registerData);

      expect(mockHttpClient.post).toHaveBeenCalledWith('/auth/register', registerData);
      expect(result).toEqual(expectedResponse);
    });
  });

  describe('logout', () => {
    it('should logout successfully', async () => {
      const expectedResponse = { message: 'Logout successful' };

      mockHttpClient.post.mockResolvedValue(expectedResponse);

      const result = await authService.logout();

      expect(mockHttpClient.post).toHaveBeenCalledWith('/auth/logout');
      expect(result).toEqual(expectedResponse);
    });
  });

  describe('refreshToken', () => {
    it('should refresh token successfully', async () => {
      const refreshData = {
        refreshToken: 'refresh-token'
      };

      const expectedResponse = {
        accessToken: 'new-access-token',
        refreshToken: 'new-refresh-token',
      };

      mockHttpClient.post.mockResolvedValue(expectedResponse);

      const result = await authService.refreshToken(refreshData);

      expect(mockHttpClient.post).toHaveBeenCalledWith('/auth/refresh', refreshData);
      expect(result).toEqual(expectedResponse);
    });
  });

  describe('getProfile', () => {
    it('should get user profile', async () => {
      const expectedResponse = {
        id: 'user-123',
        email: 'test@example.com',
        firstName: 'John',
        lastName: 'Doe',
        phone: '+447123456789',
        createdAt: '2024-01-01T00:00:00Z',
      };

      mockHttpClient.get.mockResolvedValue(expectedResponse);

      const result = await authService.getProfile();

      expect(mockHttpClient.get).toHaveBeenCalledWith('/auth/profile');
      expect(result).toEqual(expectedResponse);
    });
  });

  describe('updateProfile', () => {
    it('should update profile successfully', async () => {
      const updateData = {
        firstName: 'John Updated',
        phone: '+447987654321'
      };

      const expectedResponse = {
        id: 'user-123',
        email: 'test@example.com',
        firstName: 'John Updated',
        lastName: 'Doe',
        phone: '+447987654321',
      };

      mockHttpClient.put.mockResolvedValue(expectedResponse);

      const result = await authService.updateProfile(updateData);

      expect(mockHttpClient.put).toHaveBeenCalledWith('/auth/profile', updateData);
      expect(result).toEqual(expectedResponse);
    });
  });

  describe('changePassword', () => {
    it('should change password successfully', async () => {
      const passwordData = {
        currentPassword: 'oldPassword123',
        newPassword: 'newPassword123!'
      };

      const expectedResponse = { message: 'Password changed successfully' };

      mockHttpClient.post.mockResolvedValue(expectedResponse);

      const result = await authService.changePassword(passwordData);

      expect(mockHttpClient.post).toHaveBeenCalledWith('/auth/change-password', passwordData);
      expect(result).toEqual(expectedResponse);
    });
  });

  describe('forgotPassword', () => {
    it('should send forgot password email', async () => {
      const forgotData = {
        email: 'test@example.com'
      };

      const expectedResponse = { message: 'Password reset email sent' };

      mockHttpClient.post.mockResolvedValue(expectedResponse);

      const result = await authService.forgotPassword(forgotData);

      expect(mockHttpClient.post).toHaveBeenCalledWith('/auth/forgot-password', forgotData);
      expect(result).toEqual(expectedResponse);
    });
  });

  describe('resetPassword', () => {
    it('should reset password successfully', async () => {
      const resetData = {
        token: 'reset-token',
        newPassword: 'newPassword123!'
      };

      const expectedResponse = { message: 'Password reset successfully' };

      mockHttpClient.post.mockResolvedValue(expectedResponse);

      const result = await authService.resetPassword(resetData);

      expect(mockHttpClient.post).toHaveBeenCalledWith('/auth/reset-password', resetData);
      expect(result).toEqual(expectedResponse);
    });
  });

  describe('verifyEmail', () => {
    it('should verify email successfully', async () => {
      const verifyData = {
        token: 'verification-token'
      };

      const expectedResponse = { message: 'Email verified successfully' };

      mockHttpClient.post.mockResolvedValue(expectedResponse);

      const result = await authService.verifyEmail('verification-token');
      expect(mockHttpClient.post).toHaveBeenCalledWith('/auth/verify-email', { token: 'verification-token' });
    });
  });

  describe('resendVerification', () => {
    it('should resend verification email', async () => {
      const resendData = {
        email: 'test@example.com'
      };

      const expectedResponse = { message: 'Verification email sent' };

      mockHttpClient.post.mockResolvedValue(expectedResponse);

      const result = await authService.resendVerification(resendData);

      expect(mockHttpClient.post).toHaveBeenCalledWith('/auth/resend-verification', resendData);
      expect(result).toEqual(expectedResponse);
    });
  });

  describe('validateToken', () => {
    it('should validate token successfully', async () => {
      const tokenData = {
        token: 'access-token'
      };

      const expectedResponse = {
        valid: true,
        user: {
          id: 'user-123',
          email: 'test@example.com',
        }
      };

      mockHttpClient.post.mockResolvedValue(expectedResponse);

      const result = await authService.validateToken(tokenData);

      expect(mockHttpClient.post).toHaveBeenCalledWith('/auth/validate-token', tokenData);
      expect(result).toEqual(expectedResponse);
    });
  });

  describe('error handling', () => {
    it('should handle network errors', async () => {
      mockHttpClient.get.mockRejectedValue(new Error('Network Error'));

      await expect(authService.getProfile()).rejects.toThrow('Network Error');
    });

    it('should handle API errors', async () => {
      const errorResponse = {
        response: {
          status: 401,
          data: {
            success: false,
            message: 'Unauthorized',
            error: 'UNAUTHORIZED'
          }
        }
      };

      mockHttpClient.get.mockRejectedValue(errorResponse);

      await expect(authService.getProfile()).rejects.toThrow();
    });
  });
});