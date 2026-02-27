import http from 'http';
import { Application } from 'express';
import { env } from '../../config/env';
import { logger } from '../../config/logger';
import { gracefulShutdown } from './graceful-shutdown';

const KEEP_ALIVE_TIMEOUT_MS  = 65_000;
const HEADERS_TIMEOUT_MS     = 66_000;
const REQUEST_TIMEOUT_MS     = 30_000;

export type ServerInstance = {
  server:   http.Server;
  start:    () => Promise<void>;
  stop:     () => Promise<void>;
  getPort:  () => number;
};

export function createServer(app: Application): ServerInstance {
  const server = http.createServer(app);

  server.keepAliveTimeout = KEEP_ALIVE_TIMEOUT_MS;
  server.headersTimeout   = HEADERS_TIMEOUT_MS;
  server.requestTimeout   = REQUEST_TIMEOUT_MS;

  server.on('error', (error: NodeJS.ErrnoException) => {
    if (error.code === 'EADDRINUSE') {
      logger.error('Port already in use', { port: env.PORT });
      process.exit(1);
    }

    if (error.code === 'EACCES') {
      logger.error('Insufficient permissions to bind port', { port: env.PORT });
      process.exit(1);
    }

    logger.error('HTTP server error', { error: error.message, code: error.code });
  });

  server.on('clientError', (error: NodeJS.ErrnoException, socket) => {
    if (error.code === 'ECONNRESET' || !socket.writable) {
      socket.destroy();
      return;
    }

    logger.warn('HTTP client error', { error: error.message, code: error.code });

    socket.end('HTTP/1.1 400 Bad Request\r\n\r\n');
  });

  server.on('connection', (socket) => {
    socket.on('error', (error) => {
      logger.debug('Socket error', { error: error.message });
    });
  });

  const start = (): Promise<void> =>
    new Promise((resolve, reject) => {
      server.listen(env.PORT, env.HOST, () => {
        const address = server.address();
        const port    = typeof address === 'object' && address !== null
          ? address.port
          : env.PORT;

        logger.info('HTTP server started', {
          port,
          host:        env.HOST,
          environment: env.NODE_ENV,
          pid:         process.pid,
        });

        gracefulShutdown.register(server);

        resolve();
      });

      server.once('error', reject);
    });

  const stop = (): Promise<void> =>
    new Promise((resolve, reject) => {
      server.close((error) => {
        if (error) {
          logger.error('Error closing HTTP server', { error: error.message });
          reject(error);
          return;
        }

        logger.info('HTTP server closed');
        resolve();
      });
    });

  const getPort = (): number => {
    const address = server.address();
    if (typeof address === 'object' && address !== null) {
      return address.port;
    }
    return env.PORT;
  };

  return { server, start, stop, getPort };
}