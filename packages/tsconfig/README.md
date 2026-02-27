# @lomash-wood/tsconfig

Shared TypeScript compiler configuration for all Lomash Wood microservices. Provides strict, production-grade `tsconfig` presets that are extended by every service and package in the monorepo.

---

## Table of Contents

- [Available Configs](#available-configs)
- [Installation](#installation)
- [Usage](#usage)
- [Compiler Options Reference](#compiler-options-reference)
- [Strict Mode Flags](#strict-mode-flags)
- [Additional Checks](#additional-checks)
- [Per-Config Overrides](#per-config-overrides)
- [Service tsconfig.json Pattern](#service-tsconfigjson-pattern)
- [Path Aliases](#path-aliases)
- [Build Output](#build-output)
- [Incremental Builds](#incremental-builds)

---

## Available Configs

| File | Extends | Purpose |
|---|---|---|
| `base.json` | — | Root config with all strict flags; extended by all others |
| `service.json` | `base.json` | Source compilation for Express microservices |
| `test.json` | `base.json` | Relaxed config for Jest test files and helpers |
| `prisma.json` | `base.json` | Prisma seed and migration TypeScript files |

---

## Installation

This package is consumed internally within the monorepo via workspace linking. It is already referenced in the root `pnpm-workspace.yaml`. To add it to a new service:

```json
{
  "devDependencies": {
    "@lomash-wood/tsconfig": "workspace:*"
  }
}
```

Then from the monorepo root:

```bash
pnpm install
```

---

## Usage

### Minimal service `tsconfig.json`

Every service ships two `tsconfig` files:

**`tsconfig.json`** — used by editors and type-checking tools:

```json
{
  "extends": "@lomash-wood/tsconfig/service.json",
  "compilerOptions": {
    "outDir": "./dist",
    "rootDir": "./src"
  },
  "include": ["src/**/*.ts"],
  "exclude": ["node_modules", "dist", "tests"]
}
```

**`tsconfig.build.json`** — used by the production build pipeline (`tsc -p tsconfig.build.json`), identical to `tsconfig.json` but explicitly excludes all test files:

```json
{
  "extends": "./tsconfig.json",
  "exclude": [
    "node_modules",
    "dist",
    "tests",
    "**/*.test.ts",
    "**/*.spec.ts",
    "**/*.e2e.ts",
    "jest.config.ts"
  ]
}
```

### Test `tsconfig.test.json`

Referenced by `jest.config.ts` via `ts-jest` `tsconfig` option:

```json
{
  "extends": "@lomash-wood/tsconfig/test.json",
  "compilerOptions": {
    "rootDir": "."
  },
  "include": [
    "src/**/*.ts",
    "tests/**/*.ts",
    "tests-helpers/**/*.ts",
    "jest.config.ts"
  ]
}
```

### Prisma `tsconfig.prisma.json`

Used to type-check and run seed files via `ts-node`:

```json
{
  "extends": "@lomash-wood/tsconfig/prisma.json",
  "include": ["prisma/**/*.ts"]
}
```

---

## Compiler Options Reference

### Language and Module

| Option | Value | Reason |
|---|---|---|
| `target` | `ES2022` | Native support for async/await, optional chaining, nullish coalescing, class fields |
| `lib` | `["ES2022"]` | Matches Node 20 runtime capabilities without DOM types |
| `module` | `NodeNext` | Enables native ESM with `.js` extension resolution in imports |
| `moduleResolution` | `NodeNext` | Correct resolution algorithm for Node 20 ESM and CJS interop |
| `esModuleInterop` | `true` | Allows `import express from 'express'` for CommonJS modules |
| `allowSyntheticDefaultImports` | `true` | Required for `esModuleInterop` with type checking |

### Output

| Option | Value | Reason |
|---|---|---|
| `outDir` | `./dist` | Compiled output separated from source |
| `rootDir` | `./src` | Prevents accidental inclusion of root-level files in output |
| `declaration` | `true` | Emits `.d.ts` files for packages consumed by other services |
| `declarationMap` | `true` | Enables go-to-definition to navigate to TypeScript source rather than `.d.ts` |
| `sourceMap` | `true` | Required for meaningful stack traces in production and debugging |
| `removeComments` | `false` | Preserves JSDoc comments in declaration files |
| `importHelpers` | `true` | Uses `tslib` helpers to reduce bundle size by avoiding per-file duplication |

### Interop

| Option | Value | Reason |
|---|---|---|
| `resolveJsonModule` | `true` | Allows typed imports of `.json` files (e.g. `package.json` version) |
| `isolatedModules` | `true` | Ensures every file can be safely transpiled in isolation; required for `ts-jest` and `esbuild` |
| `skipLibCheck` | `true` | Skips type checking of `.d.ts` files in `node_modules` to speed up compilation |

### Diagnostics

| Option | Value | Reason |
|---|---|---|
| `forceConsistentCasingInFileNames` | `true` | Prevents case-sensitivity bugs between macOS (case-insensitive) and Linux (case-sensitive) |
| `incremental` | `true` | Caches prior compilation state in `.tsbuildinfo` for faster rebuilds |

---

## Strict Mode Flags

All flags are set explicitly rather than relying solely on `"strict": true` to make each guarantee visible and auditable.

| Flag | Purpose |
|---|---|
| `strict` | Umbrella flag enabling the group below |
| `strictNullChecks` | `null` and `undefined` are not assignable to other types without explicit union |
| `strictFunctionTypes` | Function parameter types are checked contravariantly |
| `strictBindCallApply` | `bind`, `call`, and `apply` are fully typed |
| `strictPropertyInitialization` | Class properties must be assigned in the constructor or declared with `!` |
| `noImplicitAny` | Variables without a type annotation default to an error, not `any` |
| `noImplicitThis` | `this` inside functions without a typed context is an error |
| `alwaysStrict` | Emits `"use strict"` in all output files |
| `useUnknownInCatchVariables` | Caught errors in `catch (e)` are typed as `unknown` rather than `any` |

---

## Additional Checks

These flags go beyond the standard `strict` umbrella and catch additional categories of bugs.

| Flag | What It Catches |
|---|---|
| `noImplicitReturns` | Functions that sometimes return a value must always return one |
| `noImplicitOverride` | Class methods that override a parent method must use the `override` keyword |
| `noFallthroughCasesInSwitch` | Switch cases without `break` or `return` are an error |
| `noUnusedLocals` | Declared local variables that are never read are an error |
| `noUnusedParameters` | Function parameters that are never referenced are an error (prefix with `_` to suppress) |
| `noUncheckedIndexedAccess` | Array index access and record key access return `T \| undefined` rather than just `T` |
| `noPropertyAccessFromIndexSignature` | Properties on index-signature types must use bracket notation, not dot notation |
| `exactOptionalPropertyTypes` | Optional properties typed `{ x?: string }` do not accept `undefined` as an explicit value |
| `allowUnreachableCode` | `false` — dead code after `return` / `throw` is an error |
| `allowUnusedLabels` | `false` — unused loop labels are an error |

---

## Per-Config Overrides

### `test.json` Relaxations

The following flags are disabled for test files because test code legitimately triggers them in controlled ways:

| Flag | Changed To | Reason |
|---|---|---|
| `noUnusedLocals` | `false` | Test helper variables may be declared for readability without being directly referenced |
| `noUnusedParameters` | `false` | Mocked function signatures must match the original even when parameters are unused |
| `noUncheckedIndexedAccess` | `false` | `res.body.data[0]` access patterns in Supertest responses would require constant non-null assertions |
| `exactOptionalPropertyTypes` | `false` | Test fixtures use partial objects with explicit `undefined` values frequently |
| `incremental` | `false` | Test compilations are run fresh to avoid stale cache false positives |

### `prisma.json` Relaxations

| Flag | Changed To | Reason |
|---|---|---|
| `noUnusedLocals` | `false` | Seed scripts often import models that are only used conditionally |
| `noUnusedParameters` | `false` | Prisma client callbacks do not always use all parameters |
| `noUncheckedIndexedAccess` | `false` | Prisma query results in seed files are asserted to exist |
| `exactOptionalPropertyTypes` | `false` | Prisma `create` input types use optional fields extensively |
| `incremental` | `false` | Seed files are short-lived scripts, not incremental compilation targets |

---

## Service tsconfig.json Pattern

The recommended pattern for every microservice in the monorepo:

```
services/auth-service/
├── tsconfig.json          ← editor + type-check (extends service.json)
├── tsconfig.build.json    ← production build (excludes tests)
├── tsconfig.test.json     ← Jest + ts-jest (extends test.json)
└── tsconfig.prisma.json   ← Prisma seed/migrations (extends prisma.json)
```

### `jest.config.ts` integration

```ts
import type { Config } from 'jest';

const config: Config = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  globals: {
    'ts-jest': {
      tsconfig: './tsconfig.test.json',
    },
  },
  testMatch: [
    '**/tests/unit/**/*.test.ts',
    '**/tests/integration/**/*.test.ts',
    '**/tests/e2e/**/*.e2e.ts',
  ],
};

export default config;
```

### `package.json` scripts

```json
{
  "scripts": {
    "build":       "tsc -p tsconfig.build.json",
    "typecheck":   "tsc -p tsconfig.json --noEmit",
    "test":        "jest --config jest.config.ts",
    "test:types":  "tsc -p tsconfig.test.json --noEmit"
  }
}
```

---

## Path Aliases

`base.json` declares a single alias:

| Alias | Resolves To |
|---|---|
| `@/*` | `./src/*` |

Usage in any service:

```ts
import { PrismaService } from '@/infrastructure/db/prisma.client';
import { AppError } from '@/shared/errors';
import type { AuthUser } from '@/app/auth/auth.types';
```

Services can extend the alias list in their own `tsconfig.json`:

```json
{
  "extends": "@lomash-wood/tsconfig/service.json",
  "compilerOptions": {
    "paths": {
      "@/*": ["./src/*"],
      "@shared/*": ["./src/shared/*"],
      "@config/*": ["./src/config/*"]
    }
  }
}
```

---

## Build Output

The compiled output structure mirrors the source layout:

```
src/
├── app/auth/auth.service.ts       →   dist/app/auth/auth.service.js
│                                       dist/app/auth/auth.service.d.ts
│                                       dist/app/auth/auth.service.d.ts.map
├── main.ts                        →   dist/main.js
│                                       dist/main.d.ts
```

Source maps reference back to the original `.ts` files, which enables accurate stack traces from the `dist/` output when running in production containers.

---

## Incremental Builds

`base.json` enables `incremental: true` with `tsBuildInfoFile: "./.tsbuildinfo"`. The `.tsbuildinfo` file is written to the service root and must be added to `.gitignore`:

```gitignore
.tsbuildinfo
dist/
```

In CI, the `.tsbuildinfo` file should be cached between runs using the pipeline cache key derived from `package.json` hash and `tsconfig` hash to maximise build speed.

`test.json` and `prisma.json` disable incremental compilation because those compile steps are short-lived and a stale cache can cause false type-check passes in CI.