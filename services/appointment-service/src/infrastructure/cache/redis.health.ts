import { redisClient } from './redis.client';
import { logger } from '../../config/logger';

export interface RedisHealthStatus {
  status: 'healthy' | 'unhealthy' | 'degraded';
  connected: boolean;
  latencyMs?: number;
  memoryUsageMb?: number;
  connectedClients?: number;
  uptimeSeconds?: number;
  version?: string;
  error?: string;
}

export async function checkRedisHealth(): Promise<RedisHealthStatus> {
  try {
    const start = performance.now();
    await redisClient.ping();
    const latencyMs = parseFloat((performance.now() - start).toFixed(2));

    const info = await redisClient.info();
    const stats = parseRedisInfo(info);

    const memoryUsageMb = stats.used_memory
      ? parseFloat((parseInt(stats.used_memory) / 1024 / 1024).toFixed(2))
      : undefined;

    const connectedClients = stats.connected_clients
      ? parseInt(stats.connected_clients)
      : undefined;

    const uptimeSeconds = stats.uptime_in_seconds
      ? parseInt(stats.uptime_in_seconds)
      : undefined;

    const version = stats.redis_version;

    const status = latencyMs > 100 ? 'degraded' : 'healthy';

    logger.debug({
      message: 'Redis health check passed',
      status,
      latencyMs,
      memoryUsageMb,
      connectedClients,
    });

    return {
      status,
      connected: true,
      latencyMs,
      memoryUsageMb,
      connectedClients,
      uptimeSeconds,
      version,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);

    logger.error({
      message: 'Redis health check failed',
      error: message,
    });

    return {
      status: 'unhealthy',
      connected: false,
      error: message,
    };
  }
}

export async function checkRedisConnectivity(): Promise<boolean> {
  try {
    const response = await redisClient.ping();
    return response === 'PONG';
  } catch {
    return false;
  }
}

export async function getRedisMemoryUsage(): Promise<{
  usedMb: number;
  peakMb: number;
  maxMb: number | null;
}> {
  const info = await redisClient.info('memory');
  const stats = parseRedisInfo(info);

  return {
    usedMb: parseFloat(
      (parseInt(stats.used_memory ?? '0') / 1024 / 1024).toFixed(2),
    ),
    peakMb: parseFloat(
      (parseInt(stats.used_memory_peak ?? '0') / 1024 / 1024).toFixed(2),
    ),
    maxMb: stats.maxmemory && stats.maxmemory !== '0'
      ? parseFloat((parseInt(stats.maxmemory) / 1024 / 1024).toFixed(2))
      : null,
  };
}

export async function getRedisKeyCount(pattern: string = '*'): Promise<number> {
  const keys = await redisClient.keys(pattern);
  return keys.length;
}

export async function getRedisStats(): Promise<{
  totalCommandsProcessed: number;
  instantaneousOpsPerSec: number;
  totalNetInputBytes: number;
  totalNetOutputBytes: number;
  rejectedConnections: number;
  expiredKeys: number;
  evictedKeys: number;
  keyspaceHits: number;
  keyspaceMisses: number;
  hitRate: number;
}> {
  const info = await redisClient.info('stats');
  const stats = parseRedisInfo(info);

  const hits = parseInt(stats.keyspace_hits ?? '0');
  const misses = parseInt(stats.keyspace_misses ?? '0');
  const total = hits + misses;
  const hitRate = total > 0 ? parseFloat(((hits / total) * 100).toFixed(2)) : 0;

  return {
    totalCommandsProcessed: parseInt(stats.total_commands_processed ?? '0'),
    instantaneousOpsPerSec: parseInt(stats.instantaneous_ops_per_sec ?? '0'),
    totalNetInputBytes: parseInt(stats.total_net_input_bytes ?? '0'),
    totalNetOutputBytes: parseInt(stats.total_net_output_bytes ?? '0'),
    rejectedConnections: parseInt(stats.rejected_connections ?? '0'),
    expiredKeys: parseInt(stats.expired_keys ?? '0'),
    evictedKeys: parseInt(stats.evicted_keys ?? '0'),
    keyspaceHits: hits,
    keyspaceMisses: misses,
    hitRate,
  };
}

export async function checkRedisReplication(): Promise<{
  role: string;
  connectedSlaves: number;
  masterLinkStatus?: string;
}> {
  const info = await redisClient.info('replication');
  const stats = parseRedisInfo(info);

  return {
    role: stats.role ?? 'unknown',
    connectedSlaves: parseInt(stats.connected_slaves ?? '0'),
    masterLinkStatus: stats.master_link_status,
  };
}

function parseRedisInfo(info: string): Record<string, string> {
  const result: Record<string, string> = {};

  info.split('\r\n').forEach((line) => {
    if (line.startsWith('#') || !line.includes(':')) return;
    const [key, value] = line.split(':');
    if (key && value !== undefined) {
      result[key.trim()] = value.trim();
    }
  });

  return result;
}