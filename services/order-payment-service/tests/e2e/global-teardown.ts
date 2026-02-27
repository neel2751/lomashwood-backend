import * as fs from 'fs';
import * as path from 'path';

export default async function globalTeardown(): Promise<void> {
  console.log('\n🧹 [E2E] Running global teardown...');

  // ── 1. Disconnect Prisma ─────────────────────────────────────────────────
  if (global.__PRISMA__) {
    try {
      await global.__PRISMA__.$disconnect();
      console.log('✅ [E2E] Prisma disconnected');
    } catch (err) {
      console.error('⚠️  [E2E] Failed to disconnect Prisma:', err);
    }
  }

  // ── 2. Stop PostgreSQL container ─────────────────────────────────────────
  if (global.__PG_CONTAINER__) {
    try {
      await global.__PG_CONTAINER__.stop({ timeout: 10_000 });
      console.log('✅ [E2E] PostgreSQL container stopped');
    } catch (err) {
      console.error('⚠️  [E2E] Failed to stop PostgreSQL container:', err);
    }
  }

  // ── 3. Stop Redis container ───────────────────────────────────────────────
  if (global.__REDIS_CONTAINER__) {
    try {
      await global.__REDIS_CONTAINER__.stop({ timeout: 10_000 });
      console.log('✅ [E2E] Redis container stopped');
    } catch (err) {
      console.error('⚠️  [E2E] Failed to stop Redis container:', err);
    }
  }

  // ── 4. Remove e2e state file ──────────────────────────────────────────────
  const stateFilePath = path.join(__dirname, '.e2e-state.json');
  if (fs.existsSync(stateFilePath)) {
    try {
      fs.unlinkSync(stateFilePath);
      console.log('✅ [E2E] State file removed');
    } catch (err) {
      console.error('⚠️  [E2E] Failed to remove state file:', err);
    }
  }

  // ── 5. Restore env vars ───────────────────────────────────────────────────
  delete process.env.DATABASE_URL;
  delete process.env.REDIS_URL;
  delete process.env.JWT_SECRET;
  delete process.env.STRIPE_SECRET_KEY;
  delete process.env.STRIPE_WEBHOOK_SECRET;

  console.log('✅ [E2E] Global teardown complete\n');
}