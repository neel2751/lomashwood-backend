import http from 'http';
import { Application } from 'express';
import { logger } from '../../config/logger';
import { env } from '../../config/env';

export class HttpServer {
  private server: http.Server | null = null;

  constructor(private readonly app: Application) {}

  start(): http.Server {
    const port = env.PORT;
    const host = env.HOST ?? '0.0.0.0';

    this.server = http.createServer(this.app);

    this.server.keepAliveTimeout = 65000;
    this.server.headersTimeout = 66000;
    this.server.timeout = 30000;
    this.server.maxHeadersCount = 100;

    this.server.on('error', (error: NodeJS.ErrnoException) => {
      if (error.code === 'EADDRINUSE') {
        logger.error({ port }, 'Port already in use');
        process.exit(1);
      }
      logger.error({ error: error.message }, 'HTTP server error');
    });

    this.server.on('clientError', (err, socket) => {
      logger.warn({ error: (err as Error).message }, 'Client error');
      if (!socket.destroyed) {
        socket.end('HTTP/1.1 400 Bad Request\r\n\r\n');
      }
    });

    this.server.listen(port, host, () => {
      logger.info(
        {
          port,
          host,
          nodeEnv: env.NODE_ENV,
          pid: process.pid,
        },
        `customer-service HTTP server listening`,
      );
    });

    return this.server;
  }

  getServer(): http.Server | null {
    return this.server;
  }

  async close(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.server) {
        resolve();
        return;
      }

      this.server.close((err) => {
        if (err) {
          logger.error({ error: err.message }, 'Error closing HTTP server');
          reject(err);
          return;
        }
        logger.info('HTTP server closed');
        resolve();
      });
    });
  }
}