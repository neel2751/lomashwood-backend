import { redis } from './redis.client';
import { logger } from '../../../config/logger';

export interface RedisHealthStatus {
  status: 'healthy' | 'unhealthy' | 'degraded';
  connected: boolean;
  latencyMs: number | null;
  usedMemoryMb: number | null;
  connectedClients: number | null;
  uptimeSeconds: number | null;
  version: string | null;
  role: string | null;
  keyCount: number | null;
  error: string | null;
  checkedAt: Date;
}

export interface RedisMetrics {
  usedMemoryMb: number;
  usedMemoryPeakMb: number;
  connectedClients: number;
  blockedClients: number;
  uptimeSeconds: number;
  totalCommandsProcessed: number;
  totalConnectionsReceived: number;
  keyspaceHits: number;
  keyspaceMisses: number;
  hitRate: number;
  evictedKeys: number;
  expiredKeys: number;
  role: string;
  version: string;
}

export async function checkRedisHealth(): Promise<RedisHealthStatus> {
  const checkedAt = new Date();

  try {
    const start = Date.now();
    await redis.ping();
    const latencyMs = Date.now() - start;

    const info = await getRedisInfo();

    const usedMemoryMb = info
      ? parseFloat(info.used_memory_human?.replace('M', '') ?? '0')
      : null;

    return {
      status: latencyMs > 500 ? 'degraded' : 'healthy',
      connected: true,
      latencyMs,
      usedMemoryMb,
      connectedClients: info ? parseInt(info.connected_clients ?? '0', 10) : null,
      uptimeSeconds: info ? parseInt(info.uptime_in_seconds ?? '0', 10) : null,
      version: info?.redis_version ?? null,
      role: info?.role ?? null,
      keyCount: await getKeyCount(),
      error: null,
      checkedAt,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    logger.error({ message: 'Redis health check failed', error: message });

    return {
      status: 'unhealthy',
      connected: false,
      latencyMs: null,
      usedMemoryMb: null,
      connectedClients: null,
      uptimeSeconds: null,
      version: null,
      role: null,
      keyCount: null,
      error: message,
      checkedAt,
    };
  }
}

export async function getRedisMetrics(): Promise<RedisMetrics | null> {
  try {
    const info = await getRedisInfo();
    if (!info) return null;

    const hits = parseInt(info.keyspace_hits ?? '0', 10);
    const misses = parseInt(info.keyspace_misses ?? '0', 10);
    const total = hits + misses;

    return {
      usedMemoryMb: parseBytes(info.used_memory ?? '0') / (1024 * 1024),
      usedMemoryPeakMb: parseBytes(info.used_memory_peak ?? '0') / (1024 * 1024),
      connectedClients: parseInt(info.connected_clients ?? '0', 10),
      blockedClients: parseInt(info.blocked_clients ?? '0', 10),
      uptimeSeconds: parseInt(info.uptime_in_seconds ?? '0', 10),
      totalCommandsProcessed: parseInt(info.total_commands_processed ?? '0', 10),
      totalConnectionsReceived: parseInt(info.total_connections_received ?? '0', 10),
      keyspaceHits: hits,
      keyspaceMisses: misses,
      hitRate: total > 0 ? parseFloat(((hits / total) * 100).toFixed(2)) : 0,
      evictedKeys: parseInt(info.evicted_keys ?? '0', 10),
      expiredKeys: parseInt(info.expired_keys ?? '0', 10),
      role: info.role ?? 'unknown',
      version: info.redis_version ?? 'unknown',
    };
  } catch (error) {
    logger.error({ message: 'Failed to fetch Redis metrics', error });
    return null;
  }
}

export async function isRedisReachable(): Promise<boolean> {
  try {
    const response = await redis.ping();
    return response === 'PONG';
  } catch {
    return false;
  }
}

export async function getRedisLatency(): Promise<number | null> {
  try {
    const start = Date.now();
    await redis.ping();
    return Date.now() - start;
  } catch {
    return null;
  }
}

async function getRedisInfo(): Promise<Record<string, string> | null> {
  try {
    const raw = await redis.info();
    return parseRedisInfo(raw);
  } catch {
    return null;
  }
}

async function getKeyCount(): Promise<number | null> {
  try {
    const info = await redis.info('keyspace');
    const lines = info.split('\r\n');
    let total = 0;

    for (const line of lines) {
      const match = line.match(/keys=(\d+)/);
      if (match) {
        total += parseInt(match[1], 10);
      }
    }

    return total;
  } catch {
    return null;
  }
}

function parseRedisInfo(raw: string): Record<string, string> {
  const result: Record<string, string> = {};

  for (const line of raw.split('\r\n')) {
    if (!line || line.startsWith('#')) continue;
    const colonIndex = line.indexOf(':');
    if (colonIndex === -1) continue;
    const key = line.slice(0, colonIndex).trim();
    const value = line.slice(colonIndex + 1).trim();
    result[key] = value;
  }

  return result;
}

function parseBytes(value: string): number {
  const num = parseFloat(value);
  return isNaN(num) ? 0 : num;
}