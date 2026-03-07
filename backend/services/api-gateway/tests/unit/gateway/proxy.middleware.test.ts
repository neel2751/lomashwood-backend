import { Request, Response } from 'express';
import { proxyMiddleware } from '../../src/gateway/proxy.middleware';

describe('Proxy Middleware', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let nextFunction: jest.Mock;

  beforeEach(() => {
    mockRequest = {
      originalUrl: '/api/products',
      method: 'GET',
      headers: {},
    };
    mockResponse = {
      json: jest.fn(),
      status: jest.fn().mockReturnThis(),
    };
    nextFunction = jest.fn();
  });

  it('should proxy requests to the correct service', async () => {
    const middleware = proxyMiddleware({
      target: 'http://localhost:3002',
      changeOrigin: true,
      pathRewrite: {
        '^/api/products': '/products',
      },
    });

    await middleware(mockRequest as Request, mockResponse as Response, nextFunction);

    expect(nextFunction).toHaveBeenCalled();
  });

  it('should add correlation ID to requests', async () => {
    const middleware = proxyMiddleware({
      target: 'http://localhost:3002',
      changeOrigin: true,
    });

    await middleware(mockRequest as Request, mockResponse as Response, nextFunction);

    expect(mockRequest.headers['x-correlation-id']).toBeDefined();
  });
});
