const nextJest = require("next/jest");

const createJestConfig = nextJest({
  dir: "./",
});

/** @type {import('jest').Config} */
const customConfig = {
  testEnvironment: "jest-environment-jsdom",

  setupFilesAfterFramework: ["<rootDir>/tests/jest.setup.ts"],

  coverageProvider: "v8",

  collectCoverageFrom: [
    "src/**/*.{ts,tsx}",
    "!src/**/*.d.ts",
    "!src/**/*.stories.{ts,tsx}",
    "!src/app/**",
    "!src/types/**",
    "!src/styles/**",
    "!src/config/**",
  ],

  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/src/$1",
    "^@lomash/api-client$": "<rootDir>/packages/api-client/src",
    "^@lomash/api-client/(.*)$": "<rootDir>/packages/api-client/src/$1",
    "^.+\\.svg$": "<rootDir>/tests/__mocks__/svgMock.tsx",
  },

  testMatch: [
    "<rootDir>/tests/unit/**/*.{spec,test}.{ts,tsx}",
    "<rootDir>/tests/integration/**/*.{spec,test}.{ts,tsx}",
    "<rootDir>/src/**/*.{spec,test}.{ts,tsx}",
  ],

  testPathIgnorePatterns: [
    "<rootDir>/node_modules/",
    "<rootDir>/.next/",
    "<rootDir>/tests/e2e/",
  ],

  transformIgnorePatterns: [
    "/node_modules/(?!(some-esm-package)/)",
  ],

  globals: {
    "ts-jest": {
      tsconfig: {
        jsx: "react-jsx",
      },
    },
  },

  coverageThreshold: {
    global: {
      branches: 60,
      functions: 60,
      lines: 60,
      statements: 60,
    },
  },

  reporters: [
    "default",
    process.env.CI && ["jest-junit", { outputDirectory: "test-results/junit" }],
  ].filter(Boolean),
};

module.exports = createJestConfig(customConfig);