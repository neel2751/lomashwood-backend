import { execSync } from 'child_process';
import { logger } from '../../config/logger';
import { env } from '../../config/env';

export type MigrationStatus = 'pending' | 'applied' | 'failed';

export interface MigrationResult {
  success: boolean;
  message: string;
  output?: string;
  error?: string;
}

export interface MigrationInfo {
  name: string;
  status: MigrationStatus;
  appliedAt?: Date;
}

const runCommand = (command: string): { stdout: string; stderr: string } => {
  try {
    const stdout = execSync(command, {
      encoding: 'utf-8',
      env: {
        ...process.env,
        DATABASE_URL: env.DATABASE_URL,
      },
    });
    return { stdout, stderr: '' };
  } catch (error: unknown) {
    const execError = error as { stdout?: string; stderr?: string; message?: string };
    return {
      stdout: execError.stdout ?? '',
      stderr: execError.stderr ?? execError.message ?? 'Unknown error',
    };
  }
};

export async function runMigrations(): Promise<MigrationResult> {
  logger.info({ message: 'Running database migrations' });

  const { stdout, stderr } = runCommand('npx prisma migrate deploy');

  if (stderr && !stderr.includes('warn')) {
    logger.error({
      message: 'Migration failed',
      error: stderr,
    });
    return {
      success: false,
      message: 'Database migration failed',
      error: stderr,
    };
  }

  logger.info({
    message: 'Database migrations completed',
    output: stdout,
  });

  return {
    success: true,
    message: 'Database migrations applied successfully',
    output: stdout,
  };
}

export async function getMigrationStatus(): Promise<MigrationResult> {
  logger.info({ message: 'Checking migration status' });

  const { stdout, stderr } = runCommand('npx prisma migrate status');

  if (stderr && !stderr.includes('warn')) {
    logger.error({
      message: 'Failed to get migration status',
      error: stderr,
    });
    return {
      success: false,
      message: 'Failed to retrieve migration status',
      error: stderr,
    };
  }

  return {
    success: true,
    message: 'Migration status retrieved',
    output: stdout,
  };
}

export async function resetDatabase(): Promise<MigrationResult> {
  if (env.NODE_ENV === 'production') {
    logger.error({ message: 'Database reset attempted in production environment' });
    return {
      success: false,
      message: 'Database reset is not allowed in production',
    };
  }

  logger.warn({ message: 'Resetting database', environment: env.NODE_ENV });

  const { stdout, stderr } = runCommand('npx prisma migrate reset --force');

  if (stderr && !stderr.includes('warn')) {
    logger.error({
      message: 'Database reset failed',
      error: stderr,
    });
    return {
      success: false,
      message: 'Database reset failed',
      error: stderr,
    };
  }

  logger.info({
    message: 'Database reset completed',
    output: stdout,
  });

  return {
    success: true,
    message: 'Database reset successfully',
    output: stdout,
  };
}

export async function generateMigration(name: string): Promise<MigrationResult> {
  if (env.NODE_ENV === 'production') {
    logger.error({ message: 'Migration generation attempted in production environment' });
    return {
      success: false,
      message: 'Migration generation is not allowed in production',
    };
  }

  if (!name || name.trim().length === 0) {
    return {
      success: false,
      message: 'Migration name is required',
    };
  }

  const safeName = name.trim().toLowerCase().replace(/\s+/g, '_');
  logger.info({ message: 'Generating migration', name: safeName });

  const { stdout, stderr } = runCommand(
    `npx prisma migrate dev --name ${safeName} --create-only`,
  );

  if (stderr && !stderr.includes('warn')) {
    logger.error({
      message: 'Migration generation failed',
      error: stderr,
    });
    return {
      success: false,
      message: 'Migration generation failed',
      error: stderr,
    };
  }

  logger.info({
    message: 'Migration generated',
    name: safeName,
    output: stdout,
  });

  return {
    success: true,
    message: `Migration '${safeName}' generated successfully`,
    output: stdout,
  };
}

export async function seedDatabase(): Promise<MigrationResult> {
  if (env.NODE_ENV === 'production') {
    logger.warn({ message: 'Database seed attempted in production environment' });
  }

  logger.info({ message: 'Seeding database', environment: env.NODE_ENV });

  const { stdout, stderr } = runCommand('npx prisma db seed');

  if (stderr && !stderr.includes('warn')) {
    logger.error({
      message: 'Database seed failed',
      error: stderr,
    });
    return {
      success: false,
      message: 'Database seed failed',
      error: stderr,
    };
  }

  logger.info({
    message: 'Database seeded successfully',
    output: stdout,
  });

  return {
    success: true,
    message: 'Database seeded successfully',
    output: stdout,
  };
}

export async function validateSchema(): Promise<MigrationResult> {
  logger.info({ message: 'Validating Prisma schema' });

  const { stdout, stderr } = runCommand('npx prisma validate');

  if (stderr && !stderr.includes('warn')) {
    logger.error({
      message: 'Schema validation failed',
      error: stderr,
    });
    return {
      success: false,
      message: 'Prisma schema validation failed',
      error: stderr,
    };
  }

  logger.info({ message: 'Prisma schema is valid' });

  return {
    success: true,
    message: 'Prisma schema is valid',
    output: stdout,
  };
}