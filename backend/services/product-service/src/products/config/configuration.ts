import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
    }),
  ],
  providers: [ConfigService],
  exports: [ConfigService],
})
export class ConfigurationModule {}

export class ConfigurationService {
  constructor(private configService: ConfigService) {}

  get(key: string, defaultValue?: any): any {
    return this.configService.get(key, defaultValue);
  }

  getPort(): number {
    return this.configService.get<number>('PORT', 3002);
  }

  getNodeEnv(): string {
    return this.configService.get<string>('NODE_ENV', 'development');
  }

  getDatabaseConfig() {
    return {
      host: this.configService.get<string>('DB_HOST', 'localhost'),
      port: this.configService.get<number>('DB_PORT', 5432),
      username: this.configService.get<string>('DB_USERNAME', 'postgres'),
      password: this.configService.get<string>('DB_PASSWORD', 'password'),
      database: this.configService.get<string>('DB_DATABASE', 'lomashwood_products'),
    };
  }

  getRedisConfig() {
    return {
      host: this.configService.get<string>('REDIS_HOST', 'localhost'),
      port: this.configService.get<number>('REDIS_PORT', 6379),
      password: this.configService.get<string>('REDIS_PASSWORD'),
    };
  }

  isDevelopment(): boolean {
    return this.getNodeEnv() === 'development';
  }

  isProduction(): boolean {
    return this.getNodeEnv() === 'production';
  }

  isTest(): boolean {
    return this.getNodeEnv() === 'test';
  }
}
