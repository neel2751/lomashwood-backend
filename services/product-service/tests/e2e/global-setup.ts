import { PrismaClient } from '@prisma/client';
import { execSync } from 'child_process';
import path from 'path';
import dotenv from 'dotenv';
import { createApp } from '../../src/app';
import { Server } from 'http';

// Load test environment variables
dotenv.config({ path: path.resolve(__dirname, '../../.env.test') });

// Global test state
declare global {
  var __E2E_SERVER__: Server;
  var __E2E_PRISMA__: PrismaClient;
  var __E2E_APP_URL__: string;
  var __E2E_ADMIN_TOKEN__: string;
  var __E2E_USER_TOKEN__: string;
}

/**
 * Global setup for e2e tests
 * Runs once before all test suites
 */
export default async function globalSetup(): Promise<void> {
  console.log('🚀 Starting e2e test environment setup...');

  try {
    // 1. Validate environment variables
    validateEnvironment();

    // 2. Setup database
    await setupDatabase();

    // 3. Run migrations
    await runMigrations();

    // 4. Seed initial data
    await seedData();

    // 5. Start application server
    await startServer();

    // 6. Setup test authentication tokens
    await setupAuthTokens();

    // 7. Verify health
    await verifyHealth();

    console.log('✅ E2E test environment setup complete!');
    console.log(`📍 Server running at: ${global.__E2E_APP_URL__}`);
  } catch (error) {
    console.error('❌ E2E setup failed:', error);
    await cleanup();
    throw error;
  }
}

/**
 * Validate required environment variables
 */
function validateEnvironment(): void {
  console.log('🔍 Validating environment variables...');

  const required = [
    'NODE_ENV',
    'DATABASE_URL',
    'JWT_SECRET',
    'PORT'
  ];

  const missing = required.filter(key => !process.env[key]);

  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.join(', ')}\n` +
      'Please create .env.test file with required variables.'
    );
  }

  // Ensure we're in test environment
  if (process.env.NODE_ENV !== 'test') {
    throw new Error(
      `NODE_ENV must be 'test' for e2e tests. Current: ${process.env.NODE_ENV}`
    );
  }

  // Ensure test database URL doesn't point to production
  if (process.env.DATABASE_URL?.includes('production')) {
    throw new Error(
      '⚠️  DANGER: DATABASE_URL appears to point to production database!\n' +
      'E2E tests will drop and recreate the database. Use a test database.'
    );
  }

  console.log('✓ Environment variables validated');
}

/**
 * Setup test database
 */
async function setupDatabase(): Promise<void> {
  console.log('🗄️  Setting up test database...');

  try {
    // Initialize Prisma Client
    const prisma = new PrismaClient({
      datasources: {
        db: {
          url: process.env.DATABASE_URL
        }
      }
    });

    global.__E2E_PRISMA__ = prisma;

    // Connect to database
    await prisma.$connect();
    console.log('✓ Connected to test database');

    // Clean existing data
    console.log('🧹 Cleaning existing test data...');
    await cleanDatabase(prisma);
    console.log('✓ Database cleaned');

  } catch (error) {
    console.error('Database setup failed:', error);
    throw error;
  }
}

/**
 * Clean all data from database
 */
async function cleanDatabase(prisma: PrismaClient): Promise<void> {
  // Get all table names
  const tables = await prisma.$queryRaw<Array<{ tablename: string }>>`
    SELECT tablename FROM pg_tables
    WHERE schemaname = 'public'
    AND tablename != '_prisma_migrations';
  `;

  // Disable foreign key checks
  await prisma.$executeRawUnsafe('SET session_replication_role = replica;');

  // Truncate all tables
  for (const { tablename } of tables) {
    try {
      await prisma.$executeRawUnsafe(`TRUNCATE TABLE "${tablename}" CASCADE;`);
    } catch (error) {
      console.warn(`Warning: Could not truncate table ${tablename}:`, error.message);
    }
  }

  // Re-enable foreign key checks
  await prisma.$executeRawUnsafe('SET session_replication_role = DEFAULT;');
}

/**
 * Run database migrations
 */
async function runMigrations(): Promise<void> {
  console.log('🔄 Running database migrations...');

  try {
    // Run migrations using Prisma CLI
    execSync('npx prisma migrate deploy', {
      cwd: path.resolve(__dirname, '../../'),
      stdio: 'pipe',
      env: {
        ...process.env,
        DATABASE_URL: process.env.DATABASE_URL
      }
    });

    console.log('✓ Migrations applied successfully');
  } catch (error) {
    console.error('Migration failed:', error);
    throw new Error('Failed to run database migrations');
  }
}

/**
 * Seed initial test data
 */
async function seedData(): Promise<void> {
  console.log('🌱 Seeding test data...');

  const prisma = global.__E2E_PRISMA__;

  try {
    // Create test categories
    const kitchenCategory = await prisma.category.create({
      data: {
        name: 'Kitchen',
        slug: 'kitchen',
        description: 'Kitchen furniture and designs',
        image: 'https://example.com/kitchen.jpg'
      }
    });

    const bedroomCategory = await prisma.category.create({
      data: {
        name: 'Bedroom',
        slug: 'bedroom',
        description: 'Bedroom furniture and designs',
        image: 'https://example.com/bedroom.jpg'
      }
    });

    // Create test colours
    const whiteColour = await prisma.colour.create({
      data: {
        name: 'White',
        hexCode: '#FFFFFF'
      }
    });

    const greyColour = await prisma.colour.create({
      data: {
        name: 'Grey',
        hexCode: '#808080'
      }
    });

    const blackColour = await prisma.colour.create({
      data: {
        name: 'Black',
        hexCode: '#000000'
      }
    });

    // Create test products
    await prisma.product.createMany({
      data: [
        {
          title: 'Luna White Kitchen',
          description: 'Modern white kitchen with premium finishes',
          categoryId: kitchenCategory.id,
          price: 5999.99,
          stock: 10,
          sku: 'KITCHEN-LUNA-WHITE-001',
          status: 'ACTIVE'
        },
        {
          title: 'Premium Oak Kitchen',
          description: 'Luxury kitchen with oak wood finishes',
          categoryId: kitchenCategory.id,
          price: 8999.99,
          stock: 5,
          sku: 'KITCHEN-OAK-001',
          status: 'ACTIVE'
        },
        {
          title: 'Modern Grey Bedroom',
          description: 'Contemporary bedroom set in grey',
          categoryId: bedroomCategory.id,
          price: 3999.99,
          stock: 15,
          sku: 'BEDROOM-GREY-001',
          status: 'ACTIVE'
        }
      ]
    });

    // Create admin user
    const adminUser = await prisma.user.create({
      data: {
        email: 'admin@e2etest.com',
        password: '$2b$10$X3HFZxHvEhZ6/VLZqIFO4OJzqJxLLVH0o6cYXmYxO7i8HXPx4kJ9W', // hashed: Admin123!@#
        name: 'E2E Admin User',
        role: 'ADMIN'
      }
    });

    // Create regular user
    const regularUser = await prisma.user.create({
      data: {
        email: 'user@e2etest.com',
        password: '$2b$10$X3HFZxHvEhZ6/VLZqIFO4OJzqJxLLVH0o6cYXmYxO7i8HXPx4kJ9W', // hashed: User123!@#
        name: 'E2E Test User',
        role: 'CUSTOMER'
      }
    });

    console.log('✓ Test data seeded successfully');
    console.log(`  - Categories: 2`);
    console.log(`  - Colours: 3`);
    console.log(`  - Products: 3`);
    console.log(`  - Users: 2 (1 admin, 1 customer)`);
  } catch (error) {
    console.error('Data seeding failed:', error);
    throw error;
  }
}

/**
 * Start application server
 */
async function startServer(): Promise<void> {
  console.log('🌐 Starting application server...');

  try {
    const app = await createApp();
    const port = parseInt(process.env.PORT || '3001', 10);

    // Start server
    const server = await new Promise<Server>((resolve, reject) => {
      const srv = app.listen(port, () => {
        console.log(`✓ Server started on port ${port}`);
        resolve(srv);
      });

      srv.on('error', (error) => {
        if (error.code === 'EADDRINUSE') {
          console.error(`Port ${port} is already in use`);
        }
        reject(error);
      });

      // Set timeout for server startup
      setTimeout(() => {
        reject(new Error('Server startup timeout'));
      }, 30000);
    });

    global.__E2E_SERVER__ = server;
    global.__E2E_APP_URL__ = `http://localhost:${port}`;

    // Wait for server to be ready
    await waitForServer(global.__E2E_APP_URL__);

  } catch (error) {
    console.error('Server startup failed:', error);
    throw error;
  }
}

/**
 * Wait for server to be ready
 */
async function waitForServer(url: string, maxAttempts = 30): Promise<void> {
  console.log('⏳ Waiting for server to be ready...');

  for (let i = 0; i < maxAttempts; i++) {
    try {
      const fetch = (await import('node-fetch')).default;
      const response = await fetch(`${url}/health/ping`, {
        method: 'GET'
      });

      if (response.ok) {
        console.log('✓ Server is ready');
        return;
      }
    } catch (error) {
      // Server not ready yet, wait and retry
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }

  throw new Error('Server failed to become ready within timeout period');
}

/**
 * Setup authentication tokens for tests
 */
async function setupAuthTokens(): Promise<void> {
  console.log('🔐 Setting up authentication tokens...');

  try {
    const fetch = (await import('node-fetch')).default;
    const baseUrl = global.__E2E_APP_URL__;

    // Login as admin
    const adminResponse = await fetch(`${baseUrl}/api/v1/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: 'admin@e2etest.com',
        password: 'Admin123!@#'
      })
    });

    if (!adminResponse.ok) {
      throw new Error('Failed to authenticate admin user');
    }

    const adminData = await adminResponse.json();
    global.__E2E_ADMIN_TOKEN__ = adminData.data.token;

    // Login as regular user
    const userResponse = await fetch(`${baseUrl}/api/v1/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: 'user@e2etest.com',
        password: 'User123!@#'
      })
    });

    if (!userResponse.ok) {
      throw new Error('Failed to authenticate regular user');
    }

    const userData = await userResponse.json();
    global.__E2E_USER_TOKEN__ = userData.data.token;

    console.log('✓ Authentication tokens generated');
  } catch (error) {
    console.error('Token setup failed:', error);
    throw error;
  }
}

/**
 * Verify system health before running tests
 */
async function verifyHealth(): Promise<void> {
  console.log('🏥 Verifying system health...');

  try {
    const fetch = (await import('node-fetch')).default;
    const baseUrl = global.__E2E_APP_URL__;

    // Check basic health
    const healthResponse = await fetch(`${baseUrl}/health`);
    if (!healthResponse.ok) {
      throw new Error('Health check failed');
    }

    // Check readiness
    const readyResponse = await fetch(`${baseUrl}/health/ready`);
    if (!readyResponse.ok) {
      throw new Error('Readiness check failed');
    }

    // Check database
    const dbResponse = await fetch(`${baseUrl}/health/database`);
    if (!dbResponse.ok) {
      throw new Error('Database health check failed');
    }

    console.log('✓ All health checks passed');
  } catch (error) {
    console.error('Health verification failed:', error);
    throw error;
  }
}

/**
 * Cleanup resources on failure
 */
async function cleanup(): Promise<void> {
  console.log('🧹 Cleaning up resources...');

  try {
    if (global.__E2E_SERVER__) {
      await new Promise<void>((resolve) => {
        global.__E2E_SERVER__.close(() => {
          console.log('✓ Server stopped');
          resolve();
        });
      });
    }

    if (global.__E2E_PRISMA__) {
      await global.__E2E_PRISMA__.$disconnect();
      console.log('✓ Database disconnected');
    }
  } catch (error) {
    console.error('Cleanup error:', error);
  }
}

/**
 * Handle process termination
 */
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, cleaning up...');
  await cleanup();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('SIGINT received, cleaning up...');
  await cleanup();
  process.exit(0);
});

process.on('uncaughtException', async (error) => {
  console.error('Uncaught exception:', error);
  await cleanup();
  process.exit(1);
});

process.on('unhandledRejection', async (reason, promise) => {
  console.error('Unhandled rejection at:', promise, 'reason:', reason);
  await cleanup();
  process.exit(1);
});