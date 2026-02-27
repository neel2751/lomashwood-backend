import { exec } from 'child_process';
import { promisify } from 'util';
import { prisma } from './prisma.client';
import { config } from '../../config';

const execAsync = promisify(exec);

export class MigrationManager {
  static async runMigrations(): Promise<void> {
    try {
      console.log('Running database migrations...');
      const { stdout, stderr } = await execAsync('npx prisma migrate deploy');
      
      if (stderr) {
        console.error('Migration stderr:', stderr);
      }
      
      console.log('Migration output:', stdout);
      console.log('Migrations completed successfully');
    } catch (error) {
      console.error('Migration failed:', error);
      throw error;
    }
  }

  static async generateMigration(name: string): Promise<void> {
    try {
      console.log(`Generating migration: ${name}`);
      const { stdout, stderr } = await execAsync(`npx prisma migrate dev --name ${name}`);
      
      if (stderr) {
        console.error('Migration generation stderr:', stderr);
      }
      
      console.log('Migration generation output:', stdout);
      console.log(`Migration ${name} generated successfully`);
    } catch (error) {
      console.error('Migration generation failed:', error);
      throw error;
    }
  }

  static async resetDatabase(): Promise<void> {
    if (String(config.env) === 'production') {
      throw new Error('Cannot reset database in production environment');
    }

    try {
      console.log('Resetting database...');
      const { stdout, stderr } = await execAsync('npx prisma migrate reset --force');
      
      if (stderr) {
        console.error('Database reset stderr:', stderr);
      }
      
      console.log('Database reset output:', stdout);
      console.log('Database reset completed successfully');
    } catch (error) {
      console.error('Database reset failed:', error);
      throw error;
    }
  }

  static async getMigrationStatus(): Promise<any> {
    try {
      const { stdout } = await execAsync('npx prisma migrate status');
      return stdout;
    } catch (error) {
      console.error('Failed to get migration status:', error);
      throw error;
    }
  }

  static async seed(): Promise<void> {
    try {
      console.log('Seeding database...');
      const { stdout, stderr } = await execAsync('npx prisma db seed');
      
      if (stderr) {
        console.error('Seeding stderr:', stderr);
      }
      
      console.log('Seeding output:', stdout);
      console.log('Database seeded successfully');
    } catch (error) {
      console.error('Seeding failed:', error);
      throw error;
    }
  }

  static async checkConnection(): Promise<boolean> {
    try {
      await prisma.$queryRaw`SELECT 1`;
      console.log('Database connection successful');
      return true;
    } catch (error) {
      console.error('Database connection failed:', error);
      return false;
    }
  }

  static async disconnect(): Promise<void> {
    try {
      await prisma.$disconnect();
      console.log('Database disconnected successfully');
    } catch (error) {
      console.error('Failed to disconnect from database:', error);
      throw error;
    }
  }

  static async getTableInfo(tableName: string): Promise<any> {
    try {
      const result = await prisma.$queryRawUnsafe(`
        SELECT 
          column_name,
          data_type,
          is_nullable,
          column_default
        FROM 
          information_schema.columns
        WHERE 
          table_name = '${tableName}'
        ORDER BY 
          ordinal_position;
      `);
      
      return result;
    } catch (error) {
      console.error(`Failed to get table info for ${tableName}:`, error);
      throw error;
    }
  }

  static async executeRawSQL(sql: string): Promise<any> {
    if (String(config.env) === 'production') {
      throw new Error('Cannot execute raw SQL in production environment without proper review');
    }

    try {
      const result = await prisma.$executeRawUnsafe(sql);
      return result;
    } catch (error) {
      console.error('Failed to execute raw SQL:', error);
      throw error;
    }
  }

  static async backupDatabase(): Promise<void> {
    if (!config.database.url) {
      throw new Error('Database URL not configured');
    }

    try {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const backupFile = `backup-${timestamp}.sql`;
      
      console.log(`Creating database backup: ${backupFile}`);
      
      const { stdout, stderr } = await execAsync(
        `pg_dump ${config.database.url} > ${backupFile}`
      );
      
      if (stderr) {
        console.error('Backup stderr:', stderr);
      }
      
      console.log('Backup output:', stdout);
      console.log(`Database backup created: ${backupFile}`);
    } catch (error) {
      console.error('Database backup failed:', error);
      throw error;
    }
  }

  static async vacuum(): Promise<void> {
    try {
      console.log('Running VACUUM on database...');
      await prisma.$executeRawUnsafe('VACUUM ANALYZE');
      console.log('VACUUM completed successfully');
    } catch (error) {
      console.error('VACUUM failed:', error);
      throw error;
    }
  }

  static async getStats(): Promise<any> {
    try {
      const stats = await prisma.$queryRaw`
        SELECT 
          schemaname,
          tablename,
          pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size,
          pg_total_relation_size(schemaname||'.'||tablename) AS size_bytes
        FROM pg_tables
        WHERE schemaname = 'public'
        ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
      `;
      
      return stats;
    } catch (error) {
      console.error('Failed to get database stats:', error);
      throw error;
    }
  }
}

export const runMigrations = MigrationManager.runMigrations.bind(MigrationManager);
export const checkConnection = MigrationManager.checkConnection.bind(MigrationManager);
export const disconnect = MigrationManager.disconnect.bind(MigrationManager);
export const seed = MigrationManager.seed.bind(MigrationManager);