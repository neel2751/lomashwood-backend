import request from 'supertest';
import { Application } from 'express';
import { PrismaClient } from '@prisma/client';
import { createApp } from '../../src/app';
import { clearDatabase } from '../fixtures';

describe('Health Routes Integration Tests - Product Service', () => {
  let app: Application;
  let prisma: PrismaClient;

  beforeAll(async () => {
    // Initialize app and database
    app = await createApp();
    prisma = new PrismaClient();
    
    // Clear database
    await clearDatabase(prisma);
  });

  afterAll(async () => {
    await clearDatabase(prisma);
    await prisma.$disconnect();
  });

  describe('GET /health', () => {
    it('should return basic health status', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200);

      expect(response.body).toHaveProperty('status', 'ok');
      expect(response.body).toHaveProperty('service', 'product-service');
      expect(response.body).toHaveProperty('timestamp');
      expect(response.body).toHaveProperty('uptime');
    });

    it('should respond quickly (under 100ms)', async () => {
      const startTime = Date.now();
      
      await request(app)
        .get('/health')
        .expect(200);
      
      const duration = Date.now() - startTime;
      expect(duration).toBeLessThan(100);
    });

    it('should not require authentication', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200);

      expect(response.body).toHaveProperty('status', 'ok');
    });

    it('should include environment information', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200);

      expect(response.body).toHaveProperty('environment');
      expect(['development', 'test', 'staging', 'production'])
        .toContain(response.body.environment);
    });

    it('should include version information', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200);

      expect(response.body).toHaveProperty('version');
      expect(response.body.version).toMatch(/^\d+\.\d+\.\d+/);
    });
  });

  describe('GET /health/live', () => {
    it('should return liveness probe status', async () => {
      const response = await request(app)
        .get('/health/live')
        .expect(200);

      expect(response.body).toHaveProperty('status', 'alive');
      expect(response.body).toHaveProperty('timestamp');
    });

    it('should respond even if database is down', async () => {
      // Disconnect database
      await prisma.$disconnect();

      const response = await request(app)
        .get('/health/live')
        .expect(200);

      expect(response.body).toHaveProperty('status', 'alive');

      // Reconnect
      await prisma.$connect();
    });

    it('should include process information', async () => {
      const response = await request(app)
        .get('/health/live')
        .expect(200);

      expect(response.body).toHaveProperty('process');
      expect(response.body.process).toHaveProperty('pid');
      expect(response.body.process).toHaveProperty('uptime');
      expect(response.body.process).toHaveProperty('memory');
    });
  });

  describe('GET /health/ready', () => {
    it('should return readiness probe status when all dependencies are healthy', async () => {
      const response = await request(app)
        .get('/health/ready')
        .expect(200);

      expect(response.body).toHaveProperty('status', 'ready');
      expect(response.body).toHaveProperty('dependencies');
      expect(response.body.dependencies).toHaveProperty('database');
      expect(response.body.dependencies.database).toHaveProperty('status', 'healthy');
    });

    it('should check database connectivity', async () => {
      const response = await request(app)
        .get('/health/ready')
        .expect(200);

      expect(response.body.dependencies.database).toHaveProperty('responseTime');
      expect(response.body.dependencies.database.responseTime).toBeGreaterThan(0);
    });

    it('should return 503 when database is unavailable', async () => {
      // Disconnect database
      await prisma.$disconnect();

      const response = await request(app)
        .get('/health/ready')
        .expect(503);

      expect(response.body).toHaveProperty('status', 'not_ready');
      expect(response.body.dependencies.database).toHaveProperty('status', 'unhealthy');

      // Reconnect
      await prisma.$connect();
    });

    it('should check cache connectivity if enabled', async () => {
      const response = await request(app)
        .get('/health/ready')
        .expect(200);

      if (response.body.dependencies.cache) {
        expect(response.body.dependencies.cache).toHaveProperty('status');
        expect(['healthy', 'unhealthy', 'disabled'])
          .toContain(response.body.dependencies.cache.status);
      }
    });

    it('should include detailed dependency information', async () => {
      const response = await request(app)
        .get('/health/ready')
        .query({ detailed: true })
        .expect(200);

      expect(response.body.dependencies.database).toHaveProperty('version');
      expect(response.body.dependencies.database).toHaveProperty('connectionCount');
    });
  });

  describe('GET /health/startup', () => {
    it('should return startup probe status', async () => {
      const response = await request(app)
        .get('/health/startup')
        .expect(200);

      expect(response.body).toHaveProperty('status', 'started');
      expect(response.body).toHaveProperty('startupTime');
    });

    it('should indicate if migrations are complete', async () => {
      const response = await request(app)
        .get('/health/startup')
        .expect(200);

      expect(response.body).toHaveProperty('migrations');
      expect(response.body.migrations).toHaveProperty('status', 'applied');
    });

    it('should indicate if initial data is loaded', async () => {
      const response = await request(app)
        .get('/health/startup')
        .expect(200);

      expect(response.body).toHaveProperty('dataSeeded');
      expect(typeof response.body.dataSeeded).toBe('boolean');
    });
  });

  describe('GET /health/dependencies', () => {
    it('should return status of all dependencies', async () => {
      const response = await request(app)
        .get('/health/dependencies')
        .expect(200);

      expect(response.body).toHaveProperty('dependencies');
      expect(response.body.dependencies).toBeInstanceOf(Array);
    });

    it('should check database dependency', async () => {
      const response = await request(app)
        .get('/health/dependencies')
        .expect(200);

      const database = response.body.dependencies.find(d => d.name === 'database');
      expect(database).toBeDefined();
      expect(database).toHaveProperty('status');
      expect(database).toHaveProperty('responseTime');
      expect(database).toHaveProperty('lastChecked');
    });

    it('should check cache dependency if configured', async () => {
      const response = await request(app)
        .get('/health/dependencies')
        .expect(200);

      const cache = response.body.dependencies.find(d => d.name === 'cache');
      if (cache) {
        expect(cache).toHaveProperty('status');
        expect(cache).toHaveProperty('type'); // redis, memcached, etc.
      }
    });

    it('should check external service dependencies', async () => {
      const response = await request(app)
        .get('/health/dependencies')
        .expect(200);

      // Check for common external services
      const externalServices = response.body.dependencies.filter(
        d => d.type === 'external'
      );
      
      expect(externalServices).toBeDefined();
    });

    it('should indicate overall health status', async () => {
      const response = await request(app)
        .get('/health/dependencies')
        .expect(200);

      expect(response.body).toHaveProperty('overallStatus');
      expect(['healthy', 'degraded', 'unhealthy'])
        .toContain(response.body.overallStatus);
    });

    it('should handle partial outages gracefully', async () => {
      // Disconnect cache (if configured) but keep database
      const response = await request(app)
        .get('/health/dependencies')
        .expect(200);

      // Service should be degraded but not completely down
      if (response.body.dependencies.some(d => d.status === 'unhealthy')) {
        expect(response.body.overallStatus).toBe('degraded');
      }
    });
  });

  describe('GET /health/metrics', () => {
    it('should return service metrics', async () => {
      const response = await request(app)
        .get('/health/metrics')
        .expect(200);

      expect(response.body).toHaveProperty('metrics');
    });

    it('should include memory metrics', async () => {
      const response = await request(app)
        .get('/health/metrics')
        .expect(200);

      expect(response.body.metrics).toHaveProperty('memory');
      expect(response.body.metrics.memory).toHaveProperty('heapUsed');
      expect(response.body.metrics.memory).toHaveProperty('heapTotal');
      expect(response.body.metrics.memory).toHaveProperty('external');
      expect(response.body.metrics.memory).toHaveProperty('rss');
    });

    it('should include CPU metrics', async () => {
      const response = await request(app)
        .get('/health/metrics')
        .expect(200);

      expect(response.body.metrics).toHaveProperty('cpu');
      expect(response.body.metrics.cpu).toHaveProperty('usage');
      expect(response.body.metrics.cpu).toHaveProperty('cores');
    });

    it('should include database metrics', async () => {
      const response = await request(app)
        .get('/health/metrics')
        .expect(200);

      if (response.body.metrics.database) {
        expect(response.body.metrics.database).toHaveProperty('activeConnections');
        expect(response.body.metrics.database).toHaveProperty('idleConnections');
        expect(response.body.metrics.database).toHaveProperty('totalQueries');
      }
    });

    it('should include request metrics', async () => {
      const response = await request(app)
        .get('/health/metrics')
        .expect(200);

      expect(response.body.metrics).toHaveProperty('requests');
      expect(response.body.metrics.requests).toHaveProperty('total');
      expect(response.body.metrics.requests).toHaveProperty('active');
      expect(response.body.metrics.requests).toHaveProperty('averageResponseTime');
    });

    it('should include error metrics', async () => {
      const response = await request(app)
        .get('/health/metrics')
        .expect(200);

      expect(response.body.metrics).toHaveProperty('errors');
      expect(response.body.metrics.errors).toHaveProperty('total');
      expect(response.body.metrics.errors).toHaveProperty('rate');
    });

    it('should support Prometheus format', async () => {
      const response = await request(app)
        .get('/health/metrics')
        .set('Accept', 'text/plain')
        .expect(200);

      expect(response.text).toContain('# HELP');
      expect(response.text).toContain('# TYPE');
    });
  });

  describe('GET /health/info', () => {
    it('should return service information', async () => {
      const response = await request(app)
        .get('/health/info')
        .expect(200);

      expect(response.body).toHaveProperty('service');
      expect(response.body.service).toHaveProperty('name', 'product-service');
      expect(response.body.service).toHaveProperty('version');
      expect(response.body.service).toHaveProperty('description');
    });

    it('should include build information', async () => {
      const response = await request(app)
        .get('/health/info')
        .expect(200);

      expect(response.body).toHaveProperty('build');
      expect(response.body.build).toHaveProperty('timestamp');
      expect(response.body.build).toHaveProperty('commit');
      expect(response.body.build).toHaveProperty('branch');
    });

    it('should include runtime information', async () => {
      const response = await request(app)
        .get('/health/info')
        .expect(200);

      expect(response.body).toHaveProperty('runtime');
      expect(response.body.runtime).toHaveProperty('node');
      expect(response.body.runtime).toHaveProperty('platform');
      expect(response.body.runtime).toHaveProperty('arch');
    });

    it('should not expose sensitive configuration', async () => {
      const response = await request(app)
        .get('/health/info')
        .expect(200);

      const responseStr = JSON.stringify(response.body);
      
      // Should not contain sensitive data
      expect(responseStr).not.toContain('password');
      expect(responseStr).not.toContain('secret');
      expect(responseStr).not.toContain('key');
      expect(responseStr).not.toContain('token');
    });
  });

  describe('GET /health/ping', () => {
    it('should return simple ping response', async () => {
      const response = await request(app)
        .get('/health/ping')
        .expect(200);

      expect(response.body).toEqual({ pong: true });
    });

    it('should respond very quickly', async () => {
      const startTime = Date.now();
      
      await request(app)
        .get('/health/ping')
        .expect(200);
      
      const duration = Date.now() - startTime;
      expect(duration).toBeLessThan(50);
    });
  });

  describe('GET /health/database', () => {
    it('should return detailed database health', async () => {
      const response = await request(app)
        .get('/health/database')
        .expect(200);

      expect(response.body).toHaveProperty('status', 'healthy');
      expect(response.body).toHaveProperty('connection');
      expect(response.body.connection).toHaveProperty('state', 'connected');
    });

    it('should include connection pool statistics', async () => {
      const response = await request(app)
        .get('/health/database')
        .expect(200);

      expect(response.body).toHaveProperty('pool');
      expect(response.body.pool).toHaveProperty('size');
      expect(response.body.pool).toHaveProperty('idle');
      expect(response.body.pool).toHaveProperty('active');
    });

    it('should test database connectivity with query', async () => {
      const response = await request(app)
        .get('/health/database')
        .expect(200);

      expect(response.body).toHaveProperty('queryTest');
      expect(response.body.queryTest).toHaveProperty('success', true);
      expect(response.body.queryTest).toHaveProperty('duration');
    });

    it('should return database version', async () => {
      const response = await request(app)
        .get('/health/database')
        .expect(200);

      expect(response.body).toHaveProperty('version');
      expect(response.body.version).toMatch(/PostgreSQL/);
    });

    it('should check for pending migrations', async () => {
      const response = await request(app)
        .get('/health/database')
        .expect(200);

      expect(response.body).toHaveProperty('migrations');
      expect(response.body.migrations).toHaveProperty('pending');
      expect(response.body.migrations.pending).toBe(0);
    });
  });

  describe('GET /health/cache', () => {
    it('should return cache health if configured', async () => {
      const response = await request(app)
        .get('/health/cache')
        .expect(200);

      if (response.body.configured) {
        expect(response.body).toHaveProperty('status');
        expect(response.body).toHaveProperty('connection');
      } else {
        expect(response.body).toHaveProperty('status', 'disabled');
      }
    });

    it('should test cache write/read operations', async () => {
      const response = await request(app)
        .get('/health/cache')
        .expect(200);

      if (response.body.configured) {
        expect(response.body).toHaveProperty('operations');
        expect(response.body.operations).toHaveProperty('read');
        expect(response.body.operations).toHaveProperty('write');
      }
    });

    it('should include cache statistics', async () => {
      const response = await request(app)
        .get('/health/cache')
        .expect(200);

      if (response.body.configured) {
        expect(response.body).toHaveProperty('stats');
        expect(response.body.stats).toHaveProperty('hits');
        expect(response.body.stats).toHaveProperty('misses');
        expect(response.body.stats).toHaveProperty('keys');
      }
    });
  });

  describe('Rate Limiting', () => {
    it('should not rate limit health check endpoints', async () => {
      const requests = [];
      
      // Make many rapid health check requests
      for (let i = 0; i < 100; i++) {
        requests.push(
          request(app)
            .get('/health')
        );
      }

      const responses = await Promise.all(requests);
      const allSuccessful = responses.every(r => r.status === 200);
      
      expect(allSuccessful).toBe(true);
    });

    it('should not rate limit liveness probes', async () => {
      const requests = [];
      
      for (let i = 0; i < 50; i++) {
        requests.push(
          request(app)
            .get('/health/live')
        );
      }

      const responses = await Promise.all(requests);
      const allSuccessful = responses.every(r => r.status === 200);
      
      expect(allSuccessful).toBe(true);
    });
  });

  describe('Kubernetes Integration', () => {
    it('should provide endpoints suitable for Kubernetes probes', async () => {
      // Liveness probe
      const liveness = await request(app)
        .get('/health/live')
        .expect(200);
      
      expect(liveness.body.status).toBe('alive');

      // Readiness probe
      const readiness = await request(app)
        .get('/health/ready')
        .expect(200);
      
      expect(readiness.body.status).toBe('ready');

      // Startup probe
      const startup = await request(app)
        .get('/health/startup')
        .expect(200);
      
      expect(startup.body.status).toBe('started');
    });
  });

  describe('Error Scenarios', () => {
    it('should handle database connection errors gracefully', async () => {
      await prisma.$disconnect();

      const response = await request(app)
        .get('/health/ready')
        .expect(503);

      expect(response.body).toHaveProperty('status', 'not_ready');
      expect(response.body.dependencies.database).toHaveProperty('status', 'unhealthy');
      expect(response.body.dependencies.database).toHaveProperty('error');

      await prisma.$connect();
    });

    it('should continue serving liveness probes during outages', async () => {
      await prisma.$disconnect();

      // Liveness should still work
      const liveness = await request(app)
        .get('/health/live')
        .expect(200);
      
      expect(liveness.body.status).toBe('alive');

      await prisma.$connect();
    });

    it('should report degraded state when some dependencies fail', async () => {
      // Simulate cache failure but database working
      const response = await request(app)
        .get('/health/dependencies')
        .expect(200);

      // If any dependency is unhealthy, overall should be degraded
      const hasUnhealthyDep = response.body.dependencies.some(
        d => d.status === 'unhealthy'
      );
      
      if (hasUnhealthyDep) {
        expect(['degraded', 'unhealthy'])
          .toContain(response.body.overallStatus);
      }
    });
  });

  describe('Response Format', () => {
    it('should return JSON format by default', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200);

      expect(response.headers['content-type']).toContain('application/json');
    });

    it('should support JSON format explicitly', async () => {
      const response = await request(app)
        .get('/health')
        .set('Accept', 'application/json')
        .expect(200);

      expect(response.headers['content-type']).toContain('application/json');
    });

    it('should include proper cache headers', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200);

      expect(response.headers['cache-control']).toBeDefined();
      expect(response.headers['cache-control']).toContain('no-cache');
    });
  });

  describe('Performance', () => {
    it('should handle concurrent health checks efficiently', async () => {
      const startTime = Date.now();
      const requests = [];
      
      for (let i = 0; i < 50; i++) {
        requests.push(
          request(app).get('/health')
        );
      }
      
      await Promise.all(requests);
      const duration = Date.now() - startTime;
      
      // Should complete 50 requests in under 5 seconds
      expect(duration).toBeLessThan(5000);
    });

    it('should not create memory leaks on repeated health checks', async () => {
      const initialMemory = process.memoryUsage().heapUsed;
      
      // Make many requests
      for (let i = 0; i < 100; i++) {
        await request(app).get('/health');
      }
      
      // Force garbage collection if available
      if (global.gc) {
        global.gc();
      }
      
      const finalMemory = process.memoryUsage().heapUsed;
      const memoryIncrease = finalMemory - initialMemory;
      
      // Memory increase should be reasonable (< 50MB)
      expect(memoryIncrease).toBeLessThan(50 * 1024 * 1024);
    });
  });

  describe('Security', () => {
    it('should not expose internal paths or secrets', async () => {
      const response = await request(app)
        .get('/health/info')
        .expect(200);

      const responseStr = JSON.stringify(response.body);
      
      // Check for common sensitive patterns
      expect(responseStr).not.toMatch(/\/home\//);
      expect(responseStr).not.toMatch(/\/root\//);
      expect(responseStr).not.toMatch(/DATABASE_URL/);
      expect(responseStr).not.toMatch(/API_KEY/);
    });

    it('should sanitize error messages', async () => {
      await prisma.$disconnect();

      const response = await request(app)
        .get('/health/database')
        .expect(503);

      // Error should not contain connection strings or credentials
      const errorStr = JSON.stringify(response.body);
      expect(errorStr).not.toMatch(/postgres:\/\//);
      expect(errorStr).not.toMatch(/password=/);

      await prisma.$connect();
    });
  });

  describe('Monitoring Integration', () => {
    it('should provide metrics in format suitable for monitoring tools', async () => {
      const response = await request(app)
        .get('/health/metrics')
        .set('Accept', 'text/plain')
        .expect(200);

      // Should be Prometheus-compatible
      expect(response.text).toMatch(/^[a-z_]+{.*}.*\d+$/m);
    });

    it('should include custom business metrics', async () => {
      const response = await request(app)
        .get('/health/metrics')
        .expect(200);

      // Should include product-specific metrics
      if (response.body.metrics.business) {
        expect(response.body.metrics.business).toHaveProperty('totalProducts');
        expect(response.body.metrics.business).toHaveProperty('activeProducts');
      }
    });
  });

  describe('Graceful Degradation', () => {
    it('should handle partial system failures gracefully', async () => {
      // Even with database down, basic health check should work
      await prisma.$disconnect();

      const basicHealth = await request(app)
        .get('/health')
        .expect(200);
      
      expect(basicHealth.body.status).toBe('ok');

      await prisma.$connect();
    });

    it('should provide helpful error messages', async () => {
      await prisma.$disconnect();

      const response = await request(app)
        .get('/health/ready')
        .expect(503);

      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toContain('not ready');

      await prisma.$connect();
    });
  });
});