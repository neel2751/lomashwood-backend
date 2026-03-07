import { createProxyMiddleware } from 'http-proxy-middleware';
import { Request, Response, NextFunction } from 'express';

export class WorkingProxyMiddleware {
  private static instances: Map<string, any> = new Map();

  static getProxy(serviceUrl: string) {
    if (!this.instances.has(serviceUrl)) {
      const proxy = createProxyMiddleware({
        target: serviceUrl,
        changeOrigin: true,
        pathRewrite: (path, req) => {
          // Remove the service prefix when forwarding to the service
          const servicePrefix = path.split('/')[1];
          if (servicePrefix && path.startsWith(`/${servicePrefix}`)) {
            return path.replace(`/${servicePrefix}`, '');
          }
          return path;
        },
        onError: (err, req, res) => {
          console.error(`Proxy error for ${serviceUrl}:`, err);
          res.status(503).json({
            success: false,
            message: `Service is temporarily unavailable`,
            error: 'SERVICE_UNAVAILABLE',
          });
        },
        onProxyReq: (proxyReq, req, res) => {
          // Add correlation ID for tracing
          const correlationId = req.headers['x-correlation-id'] || `corr-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
          proxyReq.setHeader('X-Correlation-ID', correlationId);
        },
        timeout: 30000,
        secure: false,
      });
      
      this.instances.set(serviceUrl, proxy);
    }
    
    return this.instances.get(serviceUrl);
  }

  static createProxyMiddleware(serviceUrl: string) {
    const proxy = this.getProxy(serviceUrl);
    
    return (req: Request, res: Response, next: NextFunction): void => {
      // Log the request
      console.log(`[${new Date().toISOString()}] ${req.method} ${req.path} -> ${serviceUrl}`);
      
      proxy(req, res, next);
    };
  }
}
