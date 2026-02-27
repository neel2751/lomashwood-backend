import type { Config } from '@jest/types';

const config: Config.InitialOptions = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testMatch: [
    '**/*.test.ts',
    '**/*.spec.ts',
    '**/*.e2e.ts',
  ],
  globals: {
    'ts-jest': {
      tsconfig: './tsconfig.test.json',
    },
  },
  moduleNameMapper: {
    '^@/(.*)$':               '<rootDir>/src/$1',
    '^@app/(.*)$':            '<rootDir>/src/app/$1',
    '^@config/(.*)$':         '<rootDir>/src/config/$1',
    '^@infrastructure/(.*)$': '<rootDir>/src/infrastructure/$1',
    '^@interfaces/(.*)$':     '<rootDir>/src/interfaces/$1',
    '^@shared/(.*)$':         '<rootDir>/src/shared/$1',
    '^@jobs/(.*)$':           '<rootDir>/src/jobs/$1',
    '^@events/(.*)$':         '<rootDir>/src/events/$1',
    '^@tests-helpers/(.*)$':  '<rootDir>/src/tests-helpers/$1',
  },
  clearMocks: true,
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
    '!src/**/*.test.ts',
    '!src/**/*.spec.ts',
  ],
};

export default config;