import { redisClient } from './redis.client';
import { logger } from '../../config/logger';

export type RedisHealthStatus = 'healthy' | 'degraded' | 'unhealthy';

export type RedisHealthDetail = {
  status: RedisHealthStatus;
  latencyMs: number | null;
  connectedClients: number | null;
  usedMemoryHuman: string | null;
  uptimeSeconds: number | null;
  redisVersion: string | null;
  role: string | null;
  checkedAt: string;
  error?: string;
};

type RedisInfoSection = Record<string, string>;

const LATENCY_DEGRADED_THRESHOLD_MS = 100;
const LATENCY_UNHEALTHY_THRESHOLD_MS = 500;

function parseRedisInfo(raw: string): RedisInfoSection {
  const result: RedisInfoSection = {};

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

function resolveStatus(latencyMs: number | null, error?: string): RedisHealthStatus {
  if (error || latencyMs === null) return 'unhealthy';
  if (latencyMs >= LATENCY_UNHEALTHY_THRESHOLD_MS) return 'unhealthy';
  if (latencyMs >= LATENCY_DEGRADED_THRESHOLD_MS) return 'degraded';
  return 'healthy';
}

export async function checkRedisHealth(): Promise<RedisHealthDetail> {
  const checkedAt = new Date().toISOString();

  try {
    const start = Date.now();
    await redisClient.ping();
    const latencyMs = Date.now() - start;

    const rawInfo = await redisClient.info();
    const info = parseRedisInfo(rawInfo);

    const connectedClients = info['connected_clients']
      ? parseInt(info['connected_clients'], 10)
      : null;

    const uptimeSeconds = info['uptime_in_seconds']
      ? parseInt(info['uptime_in_seconds'], 10)
      : null;

    const status = resolveStatus(latencyMs);

    if (status !== 'healthy') {
      logger.warn('Redis health degraded', { latencyMs, status });
    }

    return {
      status,
      latencyMs,
      connectedClients,
      usedMemoryHuman: info['used_memory_human'] ?? null,
      uptimeSeconds,
      redisVersion: info['redis_version'] ?? null,
      role: info['role'] ?? null,
      checkedAt,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);

    logger.error('Redis health check failed', { error: message });

    return {
      status: 'unhealthy',
      latencyMs: null,
      connectedClients: null,
      usedMemoryHuman: null,
      uptimeSeconds: null,
      redisVersion: null,
      role: null,
      checkedAt,
      error: message,
    };
  }
}

export async function isRedisReady(): Promise<boolean> {
  const detail = await checkRedisHealth();
  return detail.status !== 'unhealthy';
}