import http from 'http';
import { Express } from 'express';
import { Logger } from 'winston';
import { gracefulShutdown } from './graceful-shutdown';

export interface ServerConfig {
  port: number;
  host?: string;
  keepAliveTimeoutMs?: number;
  headersTimeoutMs?: number;
}

export async function createServer(
  app: Express,
  config: ServerConfig,
  logger: Logger,
  onShutdown?: () => Promise<void>,
): Promise<http.Server> {
  const server = http.createServer(app);

  server.keepAliveTimeout = config.keepAliveTimeoutMs ?? 65_000;
  server.headersTimeout = config.headersTimeoutMs ?? 66_000;

  await new Promise<void>((resolve, reject) => {
    server.listen(config.port, config.host ?? '0.0.0.0', () => {
      logger.info('Notification service HTTP server started', {
        port: config.port,
        host: config.host ?? '0.0.0.0',
        pid: process.pid,
      });
      resolve();
    });

    server.once('error', (err) => {
      logger.error('HTTP server failed to start', { error: err.message });
      reject(err);
    });
  });

  gracefulShutdown(server, logger, onShutdown);

  return server;
}