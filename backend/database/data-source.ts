import { DataSource } from 'typeorm';
import { AuthSeed } from './seeds/auth.seed';
import { ProductsSeed } from './seeds/products.seed';
import { ShowroomsSeed } from './seeds/showrooms.seed';
import { BlogSeed } from './seeds/blog.seed';

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  username: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || 'password',
  database: process.env.DB_NAME || 'lomashwood_db',
  synchronize: process.env.NODE_ENV !== 'production',
  logging: process.env.NODE_ENV === 'development',
  entities: ['dist/**/*.entity{.ts,.js}'],
  migrations: ['dist/database/migrations/*{.ts,.js}'],
});

export const runSeeds = async (): Promise<void> => {
  try {
    await AppDataSource.initialize();
    
    const authSeed = new AuthSeed(AppDataSource);
    const productsSeed = new ProductsSeed(AppDataSource);
    const showroomsSeed = new ShowroomsSeed(AppDataSource);
    const blogSeed = new BlogSeed(AppDataSource);

    await authSeed.run();
    await productsSeed.run();
    await showroomsSeed.run();
    await blogSeed.run();

    console.log('All seeds completed successfully');
  } catch (error) {
    console.error('Error running seeds:', error);
  } finally {
    await AppDataSource.destroy();
  }
};
