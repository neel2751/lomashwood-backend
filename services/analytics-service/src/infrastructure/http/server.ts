import http from 'http';
import type { Application } from 'express';

import { logger } from '../../config/logger';
import { env } from '../../config/env';

export function createServer(app: Application): http.Server {
  const server = http.createServer(app);

  server.keepAliveTimeout = 65000;
  server.headersTimeout = 66000;

  server.on('error', (error: NodeJS.ErrnoException) => {
    if (error.code === 'EADDRINUSE') {
      logger.error({ port: env.PORT }, `Port ${env.PORT} is already in use`);
      process.exit(1);
    }
    logger.error({ error }, 'HTTP server error');
  });

  server.on('listening', () => {
    const addr = server.address();
    const bind = typeof addr === 'string' ? `pipe ${addr}` : `port ${addr?.port}`;
    logger.info({ bind, env: env.NODE_ENV }, `Analytics service listening on ${bind}`);
  });

  return server;
}