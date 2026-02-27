import http from 'http';
import { Application } from 'express';
import { logger } from '../../config/logger';
import { env } from '../../config/env';
import { gracefulShutdown } from './graceful-shutdown';

export interface ServerConfig {
  port: number;
  host?: string;
  timeout?: number;
  keepAliveTimeout?: number;
  headersTimeout?: number;
}

export class HttpServer {
  private server: http.Server | null = null;
  private readonly app: Application;
  private readonly config: ServerConfig;
  private isShuttingDown = false;

  constructor(app: Application, config: ServerConfig) {
    this.app = app;
    this.config = {
      host: config.host || '0.0.0.0',
      timeout: config.timeout || 30000,
      keepAliveTimeout: config.keepAliveTimeout || 65000,
      headersTimeout: config.headersTimeout || 66000,
      ...config,
    };
  }

  start(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        this.server = http.createServer(this.app);

        this.configureServer();
        this.setupEventHandlers();

        this.server.listen(this.config.port, this.config.host!, () => {
          logger.info(
            `HTTP server started successfully on ${this.config.host}:${this.config.port} | env: ${env.NODE_ENV} | pid: ${process.pid}`
          );
          resolve();
        });

        this.server.on('error', (error: NodeJS.ErrnoException) => {
          if (error.code === 'EADDRINUSE') {
            logger.error(`Port ${this.config.port} is already in use`);
            reject(new Error(`Port ${this.config.port} is already in use`));
          } else {
            logger.error(`Server error: ${error.message}`);
            reject(error);
          }
        });
      } catch (error) {
        logger.error(`Failed to start HTTP server: ${error instanceof Error ? error.message : String(error)}`);
        reject(error);
      }
    });
  }

  async stop(): Promise<void> {
    if (!this.server) {
      logger.warn('Server is not running');
      return;
    }

    if (this.isShuttingDown) {
      logger.warn('Server is already shutting down');
      return;
    }

    this.isShuttingDown = true;

    logger.info('Stopping HTTP server...');

    return new Promise((resolve, reject) => {
      this.server!.close((error) => {
        if (error) {
          logger.error(`Error stopping HTTP server: ${error.message}`);
          reject(error);
        } else {
          logger.info('HTTP server stopped successfully');
          this.server = null;
          this.isShuttingDown = false;
          resolve();
        }
      });

      setTimeout(() => {
        logger.warn('Forcing server shutdown after timeout');
        this.forceShutdown();
        resolve();
      }, 10000);
    });
  }

  async restart(): Promise<void> {
    logger.info('Restarting HTTP server...');
    await this.stop();
    await this.start();
    logger.info('HTTP server restarted successfully');
  }

  private configureServer(): void {
    if (!this.server) return;

    this.server.timeout = this.config.timeout!;
    this.server.keepAliveTimeout = this.config.keepAliveTimeout!;
    this.server.headersTimeout = this.config.headersTimeout!;

    this.server.maxHeadersCount = 100;

    logger.info(
      `Server configured | timeout: ${this.config.timeout} | keepAliveTimeout: ${this.config.keepAliveTimeout} | headersTimeout: ${this.config.headersTimeout}`
    );
  }

  private setupEventHandlers(): void {
    if (!this.server) return;

    this.server.on('listening', () => {
      const address = this.server!.address();
      const addressStr =
        typeof address === 'string'
          ? address
          : address
          ? `${address.address}:${address.port}`
          : 'unknown';
      logger.info(`Server is listening on ${addressStr}`);
    });

    this.server.on('connection', (socket) => {
      socket.setKeepAlive(true, 60000);
      socket.setTimeout(this.config.timeout!);

      socket.on('timeout', () => {
        logger.warn(
          `Socket timeout | remoteAddress: ${socket.remoteAddress} | remotePort: ${socket.remotePort}`
        );
        socket.destroy();
      });

      socket.on('error', (error) => {
        logger.error(
          `Socket error: ${error.message} | remoteAddress: ${socket.remoteAddress}`
        );
      });
    });

    this.server.on('clientError', (error, socket) => {
      logger.error(
        `Client error: ${error.message} | remoteAddress: ${(socket as any).remoteAddress ?? 'unknown'}`
      );

      if (!socket.destroyed) {
        socket.end('HTTP/1.1 400 Bad Request\r\n\r\n');
      }
    });

    this.server.on('close', () => {
      logger.info('Server closed');
    });

    process.on('SIGTERM', () => {
      logger.info('SIGTERM signal received');
      this.handleShutdown('SIGTERM');
    });

    process.on('SIGINT', () => {
      logger.info('SIGINT signal received');
      this.handleShutdown('SIGINT');
    });

    process.on('uncaughtException', (error) => {
      logger.error(`Uncaught exception: ${error.message}`);
      this.handleShutdown('uncaughtException');
    });

    process.on('unhandledRejection', (reason, promise) => {
      logger.error(
        `Unhandled rejection: ${String(reason)} | promise: ${String(promise)}`
      );
      this.handleShutdown('unhandledRejection');
    });
  }

  private async handleShutdown(signal: string): Promise<void> {
    if (this.isShuttingDown) {
      return;
    }

    logger.info(`Shutdown initiated by ${signal}`);

    try {
      await gracefulShutdown(this.server);
      process.exit(0);
    } catch (error) {
      logger.error(`Error during graceful shutdown: ${error instanceof Error ? error.message : String(error)}`);
      process.exit(1);
    }
  }

  private forceShutdown(): void {
    if (!this.server) return;

    logger.warn('Forcing server shutdown');

    this.server.getConnections((error, count) => {
      if (error) {
        logger.error(`Error getting connection count: ${error.message}`);
      } else {
        logger.info(`Closing ${count} active connections`);
      }
    });

    this.server.closeAllConnections?.();
  }

  getServer(): http.Server | null {
    return this.server;
  }

  isRunning(): boolean {
    return this.server !== null && this.server.listening;
  }

  getAddress(): string | null {
    if (!this.server || !this.server.listening) {
      return null;
    }

    const address = this.server.address();
    if (!address) return null;

    if (typeof address === 'string') {
      return address;
    }

    return `${address.address}:${address.port}`;
  }

  getConnections(): Promise<number> {
    return new Promise((resolve, reject) => {
      if (!this.server) {
        resolve(0);
        return;
      }

      this.server.getConnections((error, count) => {
        if (error) {
          reject(error);
        } else {
          resolve(count);
        }
      });
    });
  }
}

export function createHttpServer(
  app: Application,
  config: ServerConfig
): HttpServer {
  return new HttpServer(app, config);
}