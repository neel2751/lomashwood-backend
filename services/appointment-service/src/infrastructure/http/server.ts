import http from 'http';
import { Application } from 'express';
import { logger } from '../../config/logger';
import { env } from '../../config/env';

export function createServer(app: Application): http.Server {
  const server = http.createServer(app);

  server.setTimeout(env.SERVER_TIMEOUT ?? 30000);

  server.keepAliveTimeout = env.KEEP_ALIVE_TIMEOUT ?? 65000;

  server.headersTimeout = (env.KEEP_ALIVE_TIMEOUT ?? 65000) + 1000;

  server.maxConnections = env.MAX_CONNECTIONS ?? 1000;

  server.on('connection', (socket) => {
    socket.setTimeout(env.SOCKET_TIMEOUT ?? 30000);

    socket.on('timeout', () => {
      logger.warn({
        message: 'Socket timeout',
        remoteAddress: socket.remoteAddress,
        remotePort: socket.remotePort,
      });
      socket.destroy();
    });

    socket.on('error', (error) => {
      logger.error({
        message: 'Socket error',
        remoteAddress: socket.remoteAddress,
        error: error.message,
      });
    });
  });

  server.on('request', (req, res) => {
    const start = performance.now();

    res.on('finish', () => {
      const duration = (performance.now() - start).toFixed(2);
      logger.debug({
        message: 'Request completed',
        method: req.method,
        url: req.url,
        statusCode: res.statusCode,
        duration: `${duration}ms`,
      });
    });
  });

  server.on('error', (error: NodeJS.ErrnoException) => {
    if (error.code === 'EADDRINUSE') {
      logger.error({
        message: 'Port already in use',
        port: env.PORT,
        error: error.message,
      });
      process.exit(1);
    }

    if (error.code === 'EACCES') {
      logger.error({
        message: 'Insufficient permissions to bind to port',
        port: env.PORT,
        error: error.message,
      });
      process.exit(1);
    }

    logger.error({
      message: 'Server error',
      error: error.message,
      code: error.code,
    });
  });

  server.on('close', () => {
    logger.info({ message: 'HTTP server closed' });
  });

  server.on('clientError', (error: NodeJS.ErrnoException, socket) => {
    if (error.code === 'ECONNRESET' || !socket.writable) {
      return;
    }

    logger.warn({
      message: 'Client error',
      error: error.message,
      code: error.code,
    });

    socket.end('HTTP/1.1 400 Bad Request\r\n\r\n');
  });

  return server;
}

export function getServerAddress(server: http.Server): string {
  const address = server.address();
  if (!address) return 'unknown';
  if (typeof address === 'string') return address;
  return `${address.address}:${address.port}`;
}

export async function closeServer(server: http.Server, timeout: number = 30000): Promise<void> {
  return new Promise((resolve, reject) => {
    const forceExit = setTimeout(() => {
      reject(new Error(`Server close timeout after ${timeout}ms`));
    }, timeout);

    server.close((error) => {
      clearTimeout(forceExit);
      if (error) {
        reject(error);
      } else {
        resolve();
      }
    });
  });
}