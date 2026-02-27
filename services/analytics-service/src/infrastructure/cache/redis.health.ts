import { getRedisClient } from './redis.client';
import { logger } from '../../config/logger';

export interface RedisHealthStatus {
  status: 'healthy' | 'unhealthy';
  latencyMs: number;
  info?: Record<string, string>;
  error?: string;
}

export async function checkRedisHealth(): Promise<RedisHealthStatus> {
  const start = Date.now();

  try {
    const redis = getRedisClient();
    const pong = await redis.ping();

    if (pong !== 'PONG') {
      return {
        status: 'unhealthy',
        latencyMs: Date.now() - start,
        error: `Unexpected ping response: ${pong}`,
      };
    }

    const latencyMs = Date.now() - start;

    const rawInfo = await redis.info('server');
    const info = parseRedisInfo(rawInfo);

    return {
      status: 'healthy',
      latencyMs,
      info: {
        version: info['redis_version'] ?? 'unknown',
        mode: info['redis_mode'] ?? 'unknown',
        uptimeSeconds: info['uptime_in_seconds'] ?? 'unknown',
        connectedClients: info['connected_clients'] ?? 'unknown',
      },
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown Redis error';
    logger.error({ error }, 'Redis health check failed');

    return {
      status: 'unhealthy',
      latencyMs: Date.now() - start,
      error: message,
    };
  }
}

function parseRedisInfo(raw: string): Record<string, string> {
  return raw
    .split('\r\n')
    .filter((line) => line.includes(':'))
    .reduce<Record<string, string>>((acc, line) => {
      const [key, value] = line.split(':');
      if (key && value !== undefined) {
        acc[key.trim()] = value.trim();
      }
      return acc;
    }, {});
}