import {
  describe,
  it,
  expect,
  beforeEach,
  jest,
} from '@jest/globals';

type MockFn = jest.MockedFunction<(...args: any[]) => Promise<any>>;

interface HttpClient {
  get: MockFn;
  post: MockFn;
  put: MockFn;
  delete: MockFn;
}

interface AuthService {
  login: (credentials: { email: string; password: string }) => Promise<any>;
  register: (userData: {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    phone?: string;
  }) => Promise<any>;
  logout: () => Promise<any>;
  refreshToken: (token: string) => Promise<any>;
  getProfile: () => Promise<any>;
  updateProfile: (data: {
    firstName?: string;
    lastName?: string;
    phone?: string;
  }) => Promise<any>;
}

const createMockHttpClient = (): HttpClient => ({
  get: jest.fn<(...args: any[]) => Promise<any>>(),
  post: jest.fn<(...args: any[]) => Promise<any>>(),
  put: jest.fn<(...args: any[]) => Promise<any>>(),
  delete: jest.fn<(...args: any[]) => Promise<any>>(),
});

const createAuthService = (client: HttpClient): AuthService => ({
  login: (credentials) => client.post('/auth/login', credentials),
  register: (userData) => client.post('/auth/register', userData),
  logout: () => client.post('/auth/logout'),
  refreshToken: (token) => client.post('/auth/refresh', { refreshToken: token }),
  getProfile: () => client.get('/auth/profile'),
  updateProfile: (data) => client.put('/auth/profile', data),
});

describe('AuthService', () => {
  let apiClient: HttpClient;
  let authService: AuthService;

  beforeEach(() => {
    apiClient = createMockHttpClient();
    authService = createAuthService(apiClient);
  });

  describe('login', () => {
    it('should send login request', async () => {
      const credentials = {
        email: 'test@example.com',
        password: 'password123',
      };

      apiClient.post.mockResolvedValue({
        success: true,
        data: {
          user: {
            id: '1',
            email: 'test@example.com',
            firstName: 'Test',
            lastName: 'User',
          },
          accessToken: 'mock-access-token',
          refreshToken: 'mock-refresh-token',
        },
      });

      const result = await authService.login(credentials);

      expect(apiClient.post).toHaveBeenCalledWith('/auth/login', credentials);
      expect(result.success).toBe(true);
      expect(result.data?.accessToken).toBe('mock-access-token');
    });
  });

  describe('register', () => {
    it('should send registration request', async () => {
      const userData = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@example.com',
        password: 'password123',
        phone: '+1234567890',
      };

      apiClient.post.mockResolvedValue({
        success: true,
        data: {
          user: {
            id: '1',
            email: 'john.doe@example.com',
            firstName: 'John',
            lastName: 'Doe',
          },
          accessToken: 'mock-access-token',
          refreshToken: 'mock-refresh-token',
        },
      });

      const result = await authService.register(userData);

      expect(apiClient.post).toHaveBeenCalledWith('/auth/register', userData);
      expect(result.success).toBe(true);
      expect(result.data?.user.email).toBe(userData.email);
    });
  });

  describe('logout', () => {
    it('should send logout request', async () => {
      apiClient.post.mockResolvedValue({
        success: true,
        message: 'Logged out successfully',
      });

      const result = await authService.logout();

      expect(apiClient.post).toHaveBeenCalledWith('/auth/logout');
      expect(result.success).toBe(true);
    });
  });

  describe('refreshToken', () => {
    it('should send refresh token request', async () => {
      const refreshToken = 'mock-refresh-token';

      apiClient.post.mockResolvedValue({
        success: true,
        data: {
          accessToken: 'new-access-token',
          refreshToken: 'new-refresh-token',
        },
      });

      const result = await authService.refreshToken(refreshToken);

      expect(apiClient.post).toHaveBeenCalledWith('/auth/refresh', {
        refreshToken,
      });
      expect(result.success).toBe(true);
      expect(result.data?.accessToken).toBe('new-access-token');
    });
  });

  describe('getProfile', () => {
    it('should get user profile', async () => {
      apiClient.get.mockResolvedValue({
        success: true,
        data: {
          id: '1',
          email: 'test@example.com',
          firstName: 'Test',
          lastName: 'User',
          phone: '+1234567890',
        },
      });

      const result = await authService.getProfile();

      expect(apiClient.get).toHaveBeenCalledWith('/auth/profile');
      expect(result.success).toBe(true);
      expect(result.data?.email).toBe('test@example.com');
    });
  });

  describe('updateProfile', () => {
    it('should update user profile', async () => {
      const updateData = {
        firstName: 'Updated',
        lastName: 'Name',
        phone: '+9876543210',
      };

      apiClient.put.mockResolvedValue({
        success: true,
        data: {
          id: '1',
          email: 'test@example.com',
          firstName: 'Updated',
          lastName: 'Name',
          phone: '+9876543210',
        },
      });

      const result = await authService.updateProfile(updateData);

      expect(apiClient.put).toHaveBeenCalledWith('/auth/profile', updateData);
      expect(result.success).toBe(true);
      expect(result.data?.firstName).toBe('Updated');
    });
  });
});