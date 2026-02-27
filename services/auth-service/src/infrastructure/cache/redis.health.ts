import { redisClient } from './redis.client';

export interface RedisHealthStatus {
  status: 'healthy' | 'unhealthy' | 'degraded';
  connected: boolean;
  latency: number;
  memoryUsage?: {
    used: string;
    peak: string;
    fragmentation: string;
  };
  stats?: {
    totalConnectionsReceived: string;
    totalCommandsProcessed: string;
    instantaneousOpsPerSec: string;
    keyspaceHits: string;
    keyspaceMisses: string;
    hitRate: string;
  };
  error?: string;
  timestamp: string;
}

export class RedisHealthCheck {
  static async check(): Promise<RedisHealthStatus> {
    const timestamp = new Date().toISOString();

    try {
      const isReady = redisClient.isReady();

      if (!isReady) {
        return {
          status: 'unhealthy',
          connected: false,
          latency: -1,
          error: 'Redis client not ready',
          timestamp,
        };
      }

      const startTime = Date.now();
      const pingResult = await redisClient.ping();
      const latency = Date.now() - startTime;

      if (!pingResult) {
        return {
          status: 'unhealthy',
          connected: false,
          latency,
          error: 'Redis ping failed',
          timestamp,
        };
      }

      const memoryInfo = await this.getMemoryInfo();
      const statsInfo = await this.getStats();

      const status = this.determineStatus(latency, memoryInfo, statsInfo);

      return {
        status,
        connected: true,
        latency,
        memoryUsage: memoryInfo,
        stats: statsInfo,
        timestamp,
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        connected: false,
        latency: -1,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp,
      };
    }
  }

  private static async getMemoryInfo(): Promise<RedisHealthStatus['memoryUsage']> {
    try {
      const client = redisClient.getClient();
      const info = await client.info('memory');
      const lines = info.split('\r\n');

      // Fix 1: return 'N/A' as fallback so it's always a string
      const getValue = (key: string): string => {
        const line = lines.find((l) => l.startsWith(key));
        return line ? line.split(':')[1] ?? 'N/A' : 'N/A';
      };

      return {
        used: getValue('used_memory_human'),
        peak: getValue('used_memory_peak_human'),
        fragmentation: getValue('mem_fragmentation_ratio'),
      };
    } catch {
      return undefined;
    }
  }

  private static async getStats(): Promise<RedisHealthStatus['stats']> {
    try {
      const client = redisClient.getClient();
      const info = await client.info('stats');
      const lines = info.split('\r\n');

      // Fix 2: return '0' as fallback so it's always a string
      const getValue = (key: string): string => {
        const line = lines.find((l) => l.startsWith(key));
        return line ? line.split(':')[1] ?? '0' : '0';
      };

      const keyspaceHits = parseInt(getValue('keyspace_hits')) || 0;
      const keyspaceMisses = parseInt(getValue('keyspace_misses')) || 0;
      const total = keyspaceHits + keyspaceMisses;
      const hitRate = total > 0 ? ((keyspaceHits / total) * 100).toFixed(2) + '%' : '0%';

      return {
        totalConnectionsReceived: getValue('total_connections_received'),
        totalCommandsProcessed: getValue('total_commands_processed'),
        instantaneousOpsPerSec: getValue('instantaneous_ops_per_sec'),
        keyspaceHits: getValue('keyspace_hits'),
        keyspaceMisses: getValue('keyspace_misses'),
        hitRate,
      };
    } catch {
      return undefined;
    }
  }

  private static determineStatus(
    latency: number,
    memoryInfo?: RedisHealthStatus['memoryUsage'],
    statsInfo?: RedisHealthStatus['stats']
  ): 'healthy' | 'unhealthy' | 'degraded' {
    if (latency > 1000) {
      return 'degraded';
    }

    if (memoryInfo?.fragmentation) {
      const fragmentation = parseFloat(memoryInfo.fragmentation);
      if (fragmentation > 2.0) {
        return 'degraded';
      }
    }

    if (statsInfo?.hitRate) {
      const hitRate = parseFloat(statsInfo.hitRate.replace('%', ''));
      if (hitRate < 50 && hitRate > 0) {
        return 'degraded';
      }
    }

    return 'healthy';
  }

  static async getDetailedInfo(): Promise<Record<string, any>> {
    try {
      const client = redisClient.getClient();
      const serverInfo = await client.info('server');
      const clientsInfo = await client.info('clients');
      const memoryInfo = await client.info('memory');
      const statsInfo = await client.info('stats');
      const replicationInfo = await client.info('replication');
      const cpuInfo = await client.info('cpu');

      return {
        server: this.parseInfo(serverInfo),
        clients: this.parseInfo(clientsInfo),
        memory: this.parseInfo(memoryInfo),
        stats: this.parseInfo(statsInfo),
        replication: this.parseInfo(replicationInfo),
        cpu: this.parseInfo(cpuInfo),
      };
    } catch (error) {
      throw new Error(`Failed to get detailed info: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private static parseInfo(info: string): Record<string, string> {
    const result: Record<string, string> = {};
    const lines = info.split('\r\n');

    for (const line of lines) {
      if (line && !line.startsWith('#') && line.includes(':')) {
        const [key, value] = line.split(':');
        // Fix 3: guard against undefined key/value
        if (key !== undefined && value !== undefined) {
          result[key] = value;
        }
      }
    }

    return result;
  }

  static async getKeyspaceInfo(): Promise<Record<string, any>> {
    try {
      const client = redisClient.getClient();
      const info = await client.info('keyspace');
      return this.parseInfo(info);
    } catch (error) {
      throw new Error(`Failed to get keyspace info: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  static async getClientList(): Promise<any[]> {
    try {
      const client = redisClient.getClient();
      // Fix 4: cast clientList to string since ioredis returns unknown
      const clientList = await client.client('LIST') as string;
      return clientList.split('\n').filter(Boolean).map((line: string) => {
        const fields = line.split(' ');
        const clientInfo: Record<string, string> = {};

        for (const field of fields) {
          const [key, value] = field.split('=');
          if (key && value) {
            clientInfo[key] = value;
          }
        }

        return clientInfo;
      });
    } catch (error) {
      throw new Error(`Failed to get client list: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  static async getSlowLog(count: number = 10): Promise<any[]> {
    try {
      const client = redisClient.getClient();
      const slowLog = await client.slowlog('GET', count);
      return slowLog as any[];
    } catch (error) {
      throw new Error(`Failed to get slow log: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  static async getConfig(pattern: string = '*'): Promise<Record<string, string>> {
    try {
      const client = redisClient.getClient();
      // Fix 5: cast config to string[] since ioredis returns unknown
      const config = await client.config('GET', pattern) as string[];
      const result: Record<string, string> = {};

      for (let i = 0; i < config.length; i += 2) {
        const key = config[i];
        const value = config[i + 1];
        // Fix 6: guard against undefined key/value
        if (key !== undefined && value !== undefined) {
          result[key] = value;
        }
      }

      return result;
    } catch (error) {
      throw new Error(`Failed to get config: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  static async testConnection(): Promise<boolean> {
    try {
      const client = redisClient.getClient();
      const testKey = '__redis_health_check__';
      const testValue = Date.now().toString();

      await client.set(testKey, testValue, 'EX', 10);
      const value = await client.get(testKey);
      await client.del(testKey);

      return value === testValue;
    } catch (error) {
      console.error('Redis connection test failed:', error);
      return false;
    }
  }

  static async measureLatency(iterations: number = 10): Promise<{
    min: number;
    max: number;
    avg: number;
    p50: number;
    p95: number;
    p99: number;
  }> {
    const latencies: number[] = [];

    for (let i = 0; i < iterations; i++) {
      const start = Date.now();
      await redisClient.ping();
      const latency = Date.now() - start;
      latencies.push(latency);
    }

    latencies.sort((a, b) => a - b);

    // Fix 7: use fallback 0 so these are always numbers, never undefined
    const min = latencies[0] ?? 0;
    const max = latencies[latencies.length - 1] ?? 0;
    const avg = latencies.reduce((sum, l) => sum + l, 0) / latencies.length;
    const p50 = latencies[Math.floor(latencies.length * 0.5)] ?? 0;
    const p95 = latencies[Math.floor(latencies.length * 0.95)] ?? 0;
    const p99 = latencies[Math.floor(latencies.length * 0.99)] ?? 0;

    return { min, max, avg, p50, p95, p99 };
  }
}

export const checkRedisHealth = RedisHealthCheck.check.bind(RedisHealthCheck);
export const getDetailedInfo = RedisHealthCheck.getDetailedInfo.bind(RedisHealthCheck);
export const testConnection = RedisHealthCheck.testConnection.bind(RedisHealthCheck);
export const measureLatency = RedisHealthCheck.measureLatency.bind(RedisHealthCheck);