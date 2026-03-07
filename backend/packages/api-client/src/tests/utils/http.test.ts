import { HttpClient } from '../../utils/http';
import { handleApiError, ApiError } from '../../utils/error';

jest.mock('axios');
import axios from 'axios';
const mockedAxios = axios as jest.Mocked<typeof axios>;

// Mock axios.create
const mockCreate = jest.fn();
mockedAxios.create = mockCreate;

// Mock the created instance
const mockInstance = {
  interceptors: {
    request: {
      use: jest.fn(),
    },
    response: {
      use: jest.fn(),
    },
  },
  get: jest.fn(),
  post: jest.fn(),
  put: jest.fn(),
  delete: jest.fn(),
  patch: jest.fn(),
  request: jest.fn(),
  getUri: jest.fn(),
};

mockCreate.mockReturnValue(mockInstance as any);

describe('HttpClient', () => {
  let httpClient: HttpClient;

  beforeEach(() => {
    jest.clearAllMocks();
    httpClient = new HttpClient('https://api.example.com');
  });

  describe('constructor', () => {
    it('should create instance with default config', () => {
      const client = new HttpClient('https://api.example.com');
      expect(client).toBeInstanceOf(HttpClient);
      expect(mockCreate).toHaveBeenCalledWith({
        baseURL: 'https://api.example.com',
        timeout: 10000,
        headers: {
          'Content-Type': 'application/json',
        },
      });
    });

    it('should merge default config with provided config', () => {
      const client = new HttpClient('https://api.example.com', {
        timeout: 5000,
        headers: { 'X-Custom': 'value' },
      });
      expect(client).toBeInstanceOf(HttpClient);
      expect(mockCreate).toHaveBeenCalledWith({
        baseURL: 'https://api.example.com',
        timeout: 5000,
        headers: {
          'Content-Type': 'application/json',
          'X-Custom': 'value',
        },
      });
    });
  });

  describe('get method', () => {
    it('should make GET request', async () => {
      const mockResponse = {
        data: { success: true, message: 'Success' },
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {},
      };

      mockInstance.get.mockResolvedValue(mockResponse);

      const result = await httpClient.get('/test');

      expect(mockInstance.get).toHaveBeenCalledWith('/test', expect.any(Object));
      expect(result).toEqual(mockResponse.data);
    });

    it('should handle errors', async () => {
      const mockError = {
        response: {
          status: 404,
          data: { success: false, message: 'Not Found' },
        },
      };

      mockInstance.get.mockRejectedValue(mockError);

      await expect(httpClient.get('/not-found')).rejects.toThrow();
    });
  });

  describe('post method', () => {
    it('should make POST request', async () => {
      const mockResponse = {
        data: { success: true, message: 'Created' },
        status: 201,
        statusText: 'Created',
        headers: {},
        config: {},
      };

      mockInstance.post.mockResolvedValue(mockResponse);

      const postData = { name: 'Test' };
      const result = await httpClient.post('/test', postData);

      expect(mockInstance.post).toHaveBeenCalledWith('/test', postData, expect.any(Object));
      expect(result).toEqual(mockResponse.data);
    });
  });

  describe('put method', () => {
    it('should make PUT request', async () => {
      const mockResponse = {
        data: { success: true, message: 'Updated' },
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {},
      };

      mockInstance.put.mockResolvedValue(mockResponse);

      const putData = { name: 'Updated' };
      const result = await httpClient.put('/test/1', putData);

      expect(mockInstance.put).toHaveBeenCalledWith('/test/1', putData, expect.any(Object));
      expect(result).toEqual(mockResponse.data);
    });
  });

  describe('delete method', () => {
    it('should make DELETE request', async () => {
      const mockResponse = {
        data: { success: true, message: 'Deleted' },
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {},
      };

      mockInstance.delete.mockResolvedValue(mockResponse);

      const result = await httpClient.delete('/test/1');

      expect(mockInstance.delete).toHaveBeenCalledWith('/test/1', expect.any(Object));
      expect(result).toEqual(mockResponse.data);
    });
  });

  describe('interceptors', () => {
    it('should apply request interceptor', async () => {
      const client = new HttpClient('https://api.example.com');

      const mockResponse = {
        data: { success: true },
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {},
      };

      mockInstance.get.mockResolvedValue(mockResponse);

      await client.get('/test');

      expect(mockInstance.get).toHaveBeenCalledWith('/test', expect.any(Object));
    });

    it('should apply response interceptor', async () => {
      const client = new HttpClient('https://api.example.com');

      const mockResponse = {
        data: { success: true },
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {},
      };

      mockInstance.get.mockResolvedValue(mockResponse);

      const result = await client.get('/test');

      expect(result).toEqual({ success: true });
    });
  });
});

describe('Error Handling', () => {
  describe('handleApiError', () => {
    it('should handle API error correctly', () => {
      const error = {
        response: {
          status: 404,
          data: { success: false, message: 'Not Found', error: 'NOT_FOUND' },
        },
      };

      const apiError = handleApiError(error);

      expect(apiError).toBeInstanceOf(ApiError);
      expect(apiError.statusCode).toBe(404);
      expect(apiError.message).toBe('Not Found');
      expect(apiError.code).toBe('NOT_FOUND_ERROR');
    });

    it('should handle network error', () => {
      const error = {
        message: 'Network Error',
        code: 'NETWORK_ERROR',
      };

      const apiError = handleApiError(error);

      expect(apiError).toBeInstanceOf(ApiError);
      expect(apiError.message).toBe('Network error - no response received');
      expect(apiError.statusCode).toBe(0);
    });

    it('should handle unknown error', () => {
      const error = 'Unknown error';

      const apiError = handleApiError(error);

      expect(apiError).toBeInstanceOf(ApiError);
      expect(apiError.message).toBe('Unknown error occurred');
      expect(apiError.statusCode).toBe(500);
    });
  });

  describe('ApiError class', () => {
    it('should create ApiError instance', () => {
      const error = new ApiError('Test error', 400, 'TEST_ERROR');

      expect(error).toBeInstanceOf(ApiError);
      expect(error.message).toBe('Test error');
      expect(error.statusCode).toBe(400);
      expect(error.code).toBe('TEST_ERROR');
    });

    it('should serialize to JSON', () => {
      const error = new ApiError('Test error', 400, 'TEST_ERROR');
      const json = JSON.stringify(error);
      const parsed = JSON.parse(json);

      expect(parsed.message).toBe('Test error');
      expect(parsed.statusCode).toBe(400);
      expect(parsed.code).toBe('TEST_ERROR');
    });
  });
});