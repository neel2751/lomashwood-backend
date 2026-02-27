import { PrismaClient } from '@prisma/client';
import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs/promises';
import path from 'path';

const execAsync = promisify(exec);

const prisma = new PrismaClient();

interface GlobalTeardownContext {
  testDatabaseUrl?: string;
  testServerId?: string;
  cleanupTasks: Array<() => Promise<void>>;
}

declare global {
  var __E2E_CONTEXT__: GlobalTeardownContext;
}


export default async function globalTeardown(): Promise<void> {
  console.log('🧹 Starting E2E test teardown for product-service...');

  const context = global.__E2E_CONTEXT__ || {
    cleanupTasks: [],
  };

  try {
    await cleanupTestDatabase();
    await stopTestServer(context.testServerId);
    await cleanupTemporaryFiles();
    await executeCustomCleanupTasks(context.cleanupTasks);
    await disconnectPrisma();

    console.log('✅ E2E test teardown completed successfully');
  } catch (error) {
    console.error('❌ Error during E2E test teardown:', error);
    throw error;
  }
}


async function cleanupTestDatabase(): Promise<void> {
  console.log('🗑️  Cleaning up test database...');

  try {
    const tables = [
      'ProductImage',
      'ProductColour',
      'ProductSize',
      'InventoryLog',
      'Inventory',
      'PriceHistory',
      'Product',
      'Size',
      'Colour',
      'Category',
    ];

    await prisma.$transaction(
      tables.map((table) =>
        prisma.$executeRawUnsafe(`TRUNCATE TABLE "${table}" CASCADE`)
      )
    );

    console.log('✅ Test database cleaned successfully');
  } catch (error) {
    console.error('❌ Failed to clean test database:', error);
    throw error;
  }
}


async function stopTestServer(serverId?: string): Promise<void> {
  if (!serverId) {
    console.log('ℹ️  No test server to stop');
    return;
  }

  console.log('🛑 Stopping test server...');

  try {
    process.kill(parseInt(serverId), 'SIGTERM');

    await new Promise((resolve) => setTimeout(resolve, 2000));

    console.log('✅ Test server stopped successfully');
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== 'ESRCH') {
      console.error('❌ Failed to stop test server:', error);
    } else {
      console.log('ℹ️  Test server already stopped');
    }
  }
}


async function cleanupTemporaryFiles(): Promise<void> {
  console.log('🗑️  Cleaning up temporary files...');

  try {
    const tempDirs = [
      path.join(process.cwd(), 'temp'),
      path.join(process.cwd(), 'uploads', 'test'),
      path.join(process.cwd(), 'logs', 'test'),
    ];

    for (const dir of tempDirs) {
      try {
        await fs.rm(dir, { recursive: true, force: true });
        console.log(`✅ Removed temporary directory: ${dir}`);
      } catch (error) {
        if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
          console.warn(`⚠️  Could not remove directory ${dir}:`, error);
        }
      }
    }

    const tempFiles = [
      path.join(process.cwd(), 'test-*.log'),
      path.join(process.cwd(), 'coverage', '.nyc_output'),
    ];

    for (const filePattern of tempFiles) {
      try {
        await execAsync(`rm -f ${filePattern}`);
      } catch (error) {
        console.warn(`⚠️  Could not remove files matching ${filePattern}`);
      }
    }

    console.log('✅ Temporary files cleaned successfully');
  } catch (error) {
    console.error('❌ Failed to clean temporary files:', error);
  }
}


async function executeCustomCleanupTasks(
  tasks: Array<() => Promise<void>>
): Promise<void> {
  if (tasks.length === 0) {
    return;
  }

  console.log(`🧹 Executing ${tasks.length} custom cleanup task(s)...`);

  for (const [index, task] of tasks.entries()) {
    try {
      await task();
      console.log(`✅ Custom cleanup task ${index + 1} completed`);
    } catch (error) {
      console.error(`❌ Custom cleanup task ${index + 1} failed:`, error);
    }
  }
}

async function disconnectPrisma(): Promise<void> {
  console.log('🔌 Disconnecting Prisma client...');

  try {
    await prisma.$disconnect();
    console.log('✅ Prisma client disconnected successfully');
  } catch (error) {
    console.error('❌ Failed to disconnect Prisma client:', error);
    throw error;
  }
}


async function resetSequences(): Promise<void> {
  console.log('🔄 Resetting database sequences...');

  try {
    const sequences = [
      'Product_id_seq',
      'Category_id_seq',
      'Colour_id_seq',
      'Size_id_seq',
      'Inventory_id_seq',
    ];

    for (const sequence of sequences) {
      await prisma.$executeRawUnsafe(
        `ALTER SEQUENCE "${sequence}" RESTART WITH 1`
      );
    }

    console.log('✅ Database sequences reset successfully');
  } catch (error) {
    console.warn('⚠️  Could not reset sequences:', error);
  }
}

async function clearRedisCache(): Promise<void> {
  console.log('🗑️  Clearing Redis cache...');

  try {
    const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
    const { default: Redis } = await import('ioredis');
    const redis = new Redis(redisUrl);

    await redis.flushdb();
    await redis.quit();

    console.log('✅ Redis cache cleared successfully');
  } catch (error) {
    console.warn('⚠️  Could not clear Redis cache:', error);
  }
}


async function generateTestSummary(): Promise<void> {
  console.log('📊 Generating test summary...');

  try {
    const summary = {
      timestamp: new Date().toISOString(),
      testType: 'e2e',
      service: 'product-service',
      environment: process.env.NODE_ENV || 'test',
      databaseCleaned: true,
      cacheCleared: true,
    };

    const summaryPath = path.join(
      process.cwd(),
      'test-results',
      'teardown-summary.json'
    );

    await fs.mkdir(path.dirname(summaryPath), { recursive: true });
    await fs.writeFile(summaryPath, JSON.stringify(summary, null, 2));

    console.log(`✅ Test summary generated: ${summaryPath}`);
  } catch (error) {
    console.warn('⚠️  Could not generate test summary:', error);
  }
}


function cleanupEventListeners(): void {
  console.log('🧹 Cleaning up event listeners...');

  process.removeAllListeners('SIGINT');
  process.removeAllListeners('SIGTERM');
  process.removeAllListeners('uncaughtException');
  process.removeAllListeners('unhandledRejection');

  console.log('✅ Event listeners cleaned');
}

export function registerCleanupTask(task: () => Promise<void>): void {
  if (!global.__E2E_CONTEXT__) {
    global.__E2E_CONTEXT__ = { cleanupTasks: [] };
  }
  global.__E2E_CONTEXT__.cleanupTasks.push(task);
}