/**
 * content-service/src/infrastructure/http/graceful-shutdown.ts
 *
 * Graceful shutdown handler for the Content Service.
 * Handles:
 *   - SIGTERM and SIGINT signals
 *   - Active connection draining
 *   - Resource cleanup (DB, cache, message broker)
 *   - Health check state management
 *   - Timeout enforcement
 */

import { Server as HTTPServer } from 'node:http';
import type { Socket as NetSocket } from 'net';
import { logger } from '../../config/logger';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
export interface ShutdownConfig {
  timeout: number; // Maximum time to wait for shutdown (ms)
  signals: NodeJS.Signals[];
  healthcheckGracePeriod: number; // Time to fail health checks before shutdown (ms)
}

export type CleanupHandler = () => Promise<void> | void;

// ---------------------------------------------------------------------------
// Graceful Shutdown Manager
// ---------------------------------------------------------------------------
export class GracefulShutdownManager {
  private server: HTTPServer | null = null;
  private cleanupHandlers: CleanupHandler[] = [];
  private isShuttingDown = false;
  private shutdownTimeout: NodeJS.Timeout | null = null;
  private activeConnections = new Set<NodeJS.Socket>();

  private readonly config: ShutdownConfig;

  constructor(config?: Partial<ShutdownConfig>) {
    this.config = {
      timeout: config?.timeout ?? 30_000, // 30 seconds
      signals: config?.signals ?? ['SIGTERM', 'SIGINT'],
      healthcheckGracePeriod: config?.healthcheckGracePeriod ?? 5_000, // 5 seconds
    };

    logger.info({
      context: 'GracefulShutdown',
      message: 'Graceful shutdown manager initialized',
      config: this.config,
    });
  }

  // -------------------------------------------------------------------------
  // Setup
  // -------------------------------------------------------------------------
  setup(server: HTTPServer, ...handlers: CleanupHandler[]): void {
    this.server = server;
    this.cleanupHandlers = handlers;

    // Track active connections
    this.setupConnectionTracking();

    // Register signal handlers
    this.registerSignalHandlers();

    logger.info({
      context: 'GracefulShutdown',
      message: 'Graceful shutdown handlers registered',
      signals: this.config.signals,
      cleanupHandlers: this.cleanupHandlers.length,
    });
  }

  // -------------------------------------------------------------------------
  // Connection Tracking
  // -------------------------------------------------------------------------
  private setupConnectionTracking(): void {
    if (!this.server) {
      return;
    }

    this.server.on('connection', (socket: NodeJS.Socket) => {
      this.activeConnections.add(socket);

      socket.on('close', () => {
        this.activeConnections.delete(socket);

        logger.debug({
          context: 'GracefulShutdown',
          message: 'Connection closed',
          activeConnections: this.activeConnections.size,
        });
      });
    });

    logger.debug({
      context: 'GracefulShutdown',
      message: 'Connection tracking enabled',
    });
  }

  // -------------------------------------------------------------------------
  // Signal Handlers
  // -------------------------------------------------------------------------
  private registerSignalHandlers(): void {
    for (const signal of this.config.signals) {
      process.on(signal, () => {
        logger.info({
          context: 'GracefulShutdown',
          signal,
          message: 'Shutdown signal received',
        });

        this.initiateShutdown(signal);
      });
    }
  }

  // -------------------------------------------------------------------------
  // Shutdown Process
  // -------------------------------------------------------------------------
  private async initiateShutdown(signal: string): Promise<void> {
    if (this.isShuttingDown) {
      logger.warn({
        context: 'GracefulShutdown',
        message: 'Shutdown already in progress',
      });
      return;
    }

    this.isShuttingDown = true;

    logger.info({
      context: 'GracefulShutdown',
      signal,
      message: 'Initiating graceful shutdown',
      activeConnections: this.activeConnections.size,
    });

    // Set shutdown timeout
    this.shutdownTimeout = setTimeout(() => {
      logger.error({
        context: 'GracefulShutdown',
        message: 'Shutdown timeout exceeded - forcing exit',
        timeout: this.config.timeout,
        activeConnections: this.activeConnections.size,
      });

      this.forceShutdown();
    }, this.config.timeout);

    try {
      // Phase 1: Fail health checks (allow load balancer to remove instance)
      await this.failHealthChecks();

      // Phase 2: Stop accepting new connections
      await this.stopAcceptingConnections();

      // Phase 3: Wait for active connections to complete
      await this.drainConnections();

      // Phase 4: Run cleanup handlers
      await this.runCleanupHandlers();

      // Phase 5: Close server
      await this.closeServer();

      logger.info({
        context: 'GracefulShutdown',
        message: 'Graceful shutdown completed successfully',
      });

      // Clear timeout and exit
      if (this.shutdownTimeout) {
        clearTimeout(this.shutdownTimeout);
      }

      process.exit(0);
    } catch (error) {
      logger.error({
        context: 'GracefulShutdown',
        error,
        message: 'Error during graceful shutdown',
      });

      this.forceShutdown();
    }
  }

  // -------------------------------------------------------------------------
  // Shutdown Phases
  // -------------------------------------------------------------------------
  private async failHealthChecks(): Promise<void> {
    logger.info({
      context: 'GracefulShutdown',
      message: 'Failing health checks',
      gracePeriod: this.config.healthcheckGracePeriod,
    });

    // Set flag that health checks can read
    (global as typeof global & { __healthChecksFailing?: boolean }).__healthChecksFailing = true;

    // Wait for grace period (allow load balancer to detect and remove)
    await this.sleep(this.config.healthcheckGracePeriod);

    logger.info({
      context: 'GracefulShutdown',
      message: 'Health check grace period completed',
    });
  }

  private async stopAcceptingConnections(): Promise<void> {
    if (!this.server) {
      return;
    }

    logger.info({
      context: 'GracefulShutdown',
      message: 'Stopping acceptance of new connections',
    });

    // Remove all listeners for 'request' and 'connection' events
    this.server.removeAllListeners('request');
    this.server.removeAllListeners('connection');

    logger.info({
      context: 'GracefulShutdown',
      message: 'No longer accepting new connections',
    });
  }

  private async drainConnections(): Promise<void> {
    logger.info({
      context: 'GracefulShutdown',
      message: 'Draining active connections',
      activeConnections: this.activeConnections.size,
    });

    // Wait for all active connections to close naturally
    const drainStart = Date.now();
    const maxDrainTime = this.config.timeout - this.config.healthcheckGracePeriod - 5000;

    while (this.activeConnections.size > 0) {
      const elapsed = Date.now() - drainStart;

      if (elapsed > maxDrainTime) {
        logger.warn({
          context: 'GracefulShutdown',
          message: 'Connection drain timeout - closing remaining connections',
          remainingConnections: this.activeConnections.size,
          elapsed,
        });

        // Force-close remaining connections
        for (const socket of this.activeConnections) {
          (socket as NetSocket).destroy();
        }

        break;
      }

      logger.debug({
        context: 'GracefulShutdown',
        message: 'Waiting for connections to drain',
        remainingConnections: this.activeConnections.size,
        elapsed,
      });

      await this.sleep(500);
    }

    logger.info({
      context: 'GracefulShutdown',
      message: 'All connections drained',
      drainDuration: Date.now() - drainStart,
    });
  }

  private async runCleanupHandlers(): Promise<void> {
    logger.info({
      context: 'GracefulShutdown',
      message: 'Running cleanup handlers',
      count: this.cleanupHandlers.length,
    });

    for (let i = 0; i < this.cleanupHandlers.length; i++) {
      const handler = this.cleanupHandlers[i];

      try {
        logger.debug({
          context: 'GracefulShutdown',
          message: `Running cleanup handler ${i + 1}/${this.cleanupHandlers.length}`,
        });

        await handler();

        logger.debug({
          context: 'GracefulShutdown',
          message: `Cleanup handler ${i + 1}/${this.cleanupHandlers.length} completed`,
        });
      } catch (error) {
        logger.error({
          context: 'GracefulShutdown',
          error,
          message: `Cleanup handler ${i + 1}/${this.cleanupHandlers.length} failed`,
        });
      }
    }

    logger.info({
      context: 'GracefulShutdown',
      message: 'All cleanup handlers executed',
    });
  }

  private async closeServer(): Promise<void> {
    if (!this.server) {
      return;
    }

    logger.info({
      context: 'GracefulShutdown',
      message: 'Closing server',
    });

    return new Promise((resolve, reject) => {
      this.server!.close((error) => {
        if (error) {
          logger.error({
            context: 'GracefulShutdown',
            error,
            message: 'Error closing server',
          });
          reject(error);
        } else {
          logger.info({
            context: 'GracefulShutdown',
            message: 'Server closed successfully',
          });
          resolve();
        }
      });
    });
  }

  // -------------------------------------------------------------------------
  // Force Shutdown
  // -------------------------------------------------------------------------
  private forceShutdown(): void {
    logger.error({
      context: 'GracefulShutdown',
      message: 'Forcing immediate shutdown',
      activeConnections: this.activeConnections.size,
    });

    // Destroy all remaining connections
    for (const socket of this.activeConnections) {
      try {
        (socket as NetSocket).destroy();
      } catch (error) {
        logger.error({
          context: 'GracefulShutdown',
          error,
          message: 'Error destroying socket',
        });
      }
    }

    // Force exit
    process.exit(1);
  }

  // -------------------------------------------------------------------------
  // Health Check Status
  // -------------------------------------------------------------------------
  isHealthy(): boolean {
    return !this.isShuttingDown;
  }

  getStatus(): {
    isShuttingDown: boolean;
    activeConnections: number;
  } {
    return {
      isShuttingDown: this.isShuttingDown,
      activeConnections: this.activeConnections.size,
    };
  }

  // -------------------------------------------------------------------------
  // Utils
  // -------------------------------------------------------------------------
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  // -------------------------------------------------------------------------
  // Manual Shutdown (for testing)
  // -------------------------------------------------------------------------
  async shutdown(signal = 'MANUAL'): Promise<void> {
    await this.initiateShutdown(signal);
  }
}

// ---------------------------------------------------------------------------
// Export singleton instance
// ---------------------------------------------------------------------------
export const gracefulShutdown = new GracefulShutdownManager();

// ---------------------------------------------------------------------------
// Global health check flag accessor
// ---------------------------------------------------------------------------
export const isHealthChecksFailing = (): boolean => {
  return (global as typeof global & { __healthChecksFailing?: boolean }).__healthChecksFailing ?? false;
};