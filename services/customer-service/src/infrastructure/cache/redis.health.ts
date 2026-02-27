import { redis } from './redis.client';
import { logger } from '../../config/logger';

export type RedisHealthStatus = {
  status: 'healthy' | 'unhealthy';
  latencyMs: number;
  connectedClients?: number;
  usedMemory?: string;
  uptime?: number;
  error?: string;
};

export async function checkRedisHealth(): Promise<RedisHealthStatus> {
  const start = Date.now();

  try {
    await redis.ping();
    const latencyMs = Date.now() - start;

    const info = await redis.info('all');
    const parsed = parseRedisInfo(info);

    return {
      status: 'healthy',
      latencyMs,
      connectedClients: parsed.connected_clients
        ? parseInt(parsed.connected_clients, 10)
        : undefined,
      usedMemory: parsed.used_memory_human,
      uptime: parsed.uptime_in_seconds
        ? parseInt(parsed.uptime_in_seconds, 10)
        : undefined,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    logger.error({ error: message }, 'Redis health check failed');

    return {
      status: 'unhealthy',
      latencyMs: Date.now() - start,
      error: message,
    };
  }
}

export async function isRedisHealthy(): Promise<boolean> {
  try {
    const pong = await redis.ping();
    return pong === 'PONG';
  } catch {
    return false;
  }
}

export async function getRedisInfo(): Promise<Record<string, string>> {
  try {
    const info = await redis.info('all');
    return parseRedisInfo(info);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    logger.error({ error: message }, 'Failed to get Redis info');
    return {};
  }
}

export async function getRedisMemoryUsage(): Promise<{
  usedMemory: string;
  maxMemory: string;
  fragmentationRatio: string;
} | null> {
  try {
    const info = await redis.info('memory');
    const parsed = parseRedisInfo(info);
    return {
      usedMemory: parsed.used_memory_human ?? '0B',
      maxMemory: parsed.maxmemory_human ?? '0B',
      fragmentationRatio: parsed.mem_fragmentation_ratio ?? '0',
    };
  } catch {
    return null;
  }
}

export async function getRedisStats(): Promise<{
  totalCommandsProcessed: number;
  instantaneousOpsPerSec: number;
  totalConnectionsReceived: number;
  keyspaceHits: number;
  keyspaceMisses: number;
  hitRate: string;
} | null> {
  try {
    const info = await redis.info('stats');
    const parsed = parseRedisInfo(info);

    const hits = parseInt(parsed.keyspace_hits ?? '0', 10);
    const misses = parseInt(parsed.keyspace_misses ?? '0', 10);
    const total = hits + misses;
    const hitRate = total > 0 ? ((hits / total) * 100).toFixed(2) + '%' : 'N/A';

    return {
      totalCommandsProcessed: parseInt(parsed.total_commands_processed ?? '0', 10),
      instantaneousOpsPerSec: parseInt(parsed.instantaneous_ops_per_sec ?? '0', 10),
      totalConnectionsReceived: parseInt(parsed.total_connections_received ?? '0', 10),
      keyspaceHits: hits,
      keyspaceMisses: misses,
      hitRate,
    };
  } catch {
    return null;
  }
}

function parseRedisInfo(raw: string): Record<string, string> {
  const result: Record<string, string> = {};
  const lines = raw.split('\r\n');

  for (const line of lines) {
    if (!line || line.startsWith('#')) continue;
    const colonIndex = line.indexOf(':');
    if (colonIndex === -1) continue;
    const key = line.substring(0, colonIndex).trim();
    const value = line.substring(colonIndex + 1).trim();
    result[key] = value;
  }

  return result;
}