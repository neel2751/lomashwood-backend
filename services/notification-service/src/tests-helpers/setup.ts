import { jest, beforeEach, afterAll } from '@jest/globals';

jest.mock('../config/env', () => ({
  env: {
    NODE_ENV: 'test',
    PORT: 4005,
    HOST: '0.0.0.0',
    DATABASE_URL: 'postgresql://test:test@localhost:5432/notification_test',
    REDIS_URL: 'redis://localhost:6379',
    KAFKA_BROKERS: ['localhost:9092'],
    KAFKA_CLIENT_ID: 'notification-service-test',
    KAFKA_GROUP_ID: 'notification-service-test-group',
    ACTIVE_EMAIL_PROVIDER: 'nodemailer',
    ACTIVE_SMS_PROVIDER: 'twilio',
    ACTIVE_PUSH_PROVIDER: 'firebase',
    CORS_ORIGINS: 'http://localhost:3000',
    RATE_LIMIT_WINDOW_MS: 60_000,
    RATE_LIMIT_MAX: 1000,
    JWT_SECRET: 'test-jwt-secret-minimum-32-characters-long',
    SERVICE_TOKEN_SECRET: 'test-service-secret-minimum-32-chars',
    LOG_LEVEL: 'error',
  },
}));

jest.mock('../config/logger', () => ({
  logger: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
    http: jest.fn(),
  },
}));

beforeEach(() => {
  jest.clearAllMocks();
});

afterAll(async () => {
  await new Promise<void>((resolve) => setTimeout(resolve, 100));
});