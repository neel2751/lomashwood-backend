# @lomash-wood/eslint-config

Shared ESLint configuration for all Lomash Wood microservices. Enforces strict TypeScript, import ordering, security scanning, and consistent code style across every service in the monorepo.

---

## Table of Contents

- [What It Enforces](#what-it-enforces)
- [Installation](#installation)
- [Usage](#usage)
- [Available Configs](#available-configs)
- [Rule Groups](#rule-groups)
- [Overrides](#overrides)
- [Extending in a Service](#extending-in-a-service)
- [Ignoring Rules](#ignoring-rules)
- [Running the Linter](#running-the-linter)

---

## What It Enforces

| Category | Details |
|---|---|
| TypeScript strict | `no-explicit-any`, `no-unsafe-*`, `strict-boolean-expressions`, `switch-exhaustiveness-check` |
| Return types | Explicit function and module boundary return types required |
| Imports | Ordered groups, no cycles, no duplicates, no extraneous dependencies |
| Security | `eslint-plugin-security` for injection, regex, timing attacks, and buffer issues |
| Code quality | Max depth 4, max params 5, complexity 10, no nested ternaries |
| File naming | Kebab-case filenames enforced via `eslint-plugin-unicorn` |
| Prettier | Formatting enforced as an ESLint error via `eslint-plugin-prettier` |
| Tests | `eslint-plugin-jest` rules for all `*.test.ts`, `*.spec.ts`, `*.e2e.ts` files |

---

## Installation

This package is consumed internally within the monorepo. It is already listed as a dependency in the root `package.json`. No manual installation is required.

If adding a new service, add the following to its `package.json`:

```json
{
  "devDependencies": {
    "@lomash-wood/eslint-config": "workspace:*"
  }
}
```

Then run from the monorepo root:

```bash
pnpm install
```

---

## Usage

In each service's `.eslintrc.json`:

```json
{
  "root": true,
  "extends": ["@lomash-wood/eslint-config/recommended"],
  "parserOptions": {
    "project": "./tsconfig.json"
  }
}
```

This applies the base config plus all standard overrides for test files, Prisma files, job files, and config files.

---

## Available Configs

| Export | Path | Use case |
|---|---|---|
| `recommended` | `@lomash-wood/eslint-config` | Standard import — base + all overrides |
| `base` | `@lomash-wood/eslint-config/base` | Base rules only, no overrides |
| `testOverrides` | `@lomash-wood/eslint-config/test-overrides` | Jest rule set only |
| `prismaOverrides` | `@lomash-wood/eslint-config/prisma-overrides` | Prisma seed and migration files |
| `jobsOverrides` | `@lomash-wood/eslint-config/jobs-overrides` | Background job files |
| `configOverrides` | `@lomash-wood/eslint-config/config-overrides` | Config module files |

Import named exports in a custom `.eslintrc.js`:

```js
const { base, testOverrides } = require('@lomash-wood/eslint-config');

module.exports = {
  ...base,
  overrides: [testOverrides],
};
```

---

## Rule Groups

### TypeScript Strict

All `@typescript-eslint/recommended-requiring-type-checking` rules are enabled, with the following additions:

- `@typescript-eslint/strict-boolean-expressions` — prevents implicit boolean coercion; all conditions must be strictly boolean
- `@typescript-eslint/switch-exhaustiveness-check` — all union type cases must be handled in switch statements
- `@typescript-eslint/no-non-null-assertion` — the `!` non-null assertion operator is banned
- `@typescript-eslint/consistent-type-imports` — type imports must use `import type { ... }` syntax
- `@typescript-eslint/prefer-readonly` — class properties that are never reassigned must be declared `readonly`
- `@typescript-eslint/return-await` — async functions inside try/catch must use `return await`

### Import Ordering

Imports are automatically sorted into the following groups with a blank line between each:

```
1. Node.js built-ins        (path, fs, crypto)
2. External packages        (express, prisma, zod)
3. Internal monorepo paths  (@lomash-wood/*)
4. Parent/sibling imports   (../service, ./types)
5. Index imports            (./index)
6. Type-only imports        (import type {...})
```

Import order violations are treated as errors and are auto-fixable via `eslint --fix`.

### Security

The following security rules are enforced as errors:

- `detect-non-literal-regexp` — dynamic RegExp construction
- `detect-unsafe-regex` — ReDoS-vulnerable patterns
- `detect-eval-with-expression` — dynamic `eval()` usage
- `detect-child-process` — unsafe `child_process` usage
- `detect-possible-timing-attacks` — string comparisons against secrets must use `crypto.timingSafeEqual`
- `detect-pseudoRandomBytes` — `Math.random()` must not be used for security-sensitive values
- `detect-buffer-noassert` — unsafe `Buffer` allocation

`security/detect-object-injection` is disabled — it produces too many false positives on legitimate bracket notation.

### Code Quality

| Rule | Limit | Rationale |
|---|---|---|
| `max-depth` | 4 | Prevents deeply nested conditionals |
| `max-params` | 5 | Functions with 6+ params should use an options object |
| `max-lines-per-function` | 80 | Encourages single-responsibility functions |
| `complexity` | 10 | Cyclomatic complexity cap per function |
| `no-nested-ternary` | error | Unreadable beyond one level |
| `no-param-reassign` | error | Prevents accidental mutation of function arguments |

### File Naming

All `.ts` files must use **kebab-case** filenames:

```
auth.service.ts       ✓
authService.ts        ✗
AuthService.ts        ✗
auth_service.ts       ✗
```

---

## Overrides

### Test Files (`*.test.ts`, `*.spec.ts`, `*.e2e.ts`)

The following rules are relaxed in test files because test code legitimately uses patterns that would be flagged in production code:

- `@typescript-eslint/no-explicit-any` — off (mocks often need `any`)
- `@typescript-eslint/no-non-null-assertion` — off (test assertions are safe contexts)
- `@typescript-eslint/no-unsafe-*` — off (supertest responses are untyped)
- `max-lines-per-function` — off (test suites are naturally long)
- `complexity` — off (test flows may branch for many cases)

Jest-specific rules that are enabled:

- `jest/no-focused-tests` — error (`.only` must never be committed)
- `jest/no-disabled-tests` — warn (`xtest` / `.skip` must be intentional)
- `jest/consistent-test-it` — enforces `it()` over `test()`
- `jest/prefer-hooks-on-top` — `beforeAll` / `beforeEach` must appear at the top of describes
- `jest/no-standalone-expect` — `expect()` must be inside a test

### Prisma Files

`no-console` is disabled in `prisma/seed.ts` and migration files because seed scripts conventionally log progress to stdout.

### Job Files

`no-console` is disabled and `max-lines-per-function` is raised to 120 for files under `**/jobs/**` since cron job handlers are often longer than regular service functions.

### Config Files

`max-lines-per-function` is disabled for `**/config/**` files since configuration builders are legitimately verbose.

---

## Extending in a Service

To add service-specific rules on top of the shared config:

```json
{
  "root": true,
  "extends": ["@lomash-wood/eslint-config/recommended"],
  "parserOptions": {
    "project": "./tsconfig.json"
  },
  "rules": {
    "max-lines-per-function": ["warn", { "max": 100 }]
  },
  "overrides": [
    {
      "files": ["**/webhooks/**/*.ts"],
      "rules": {
        "complexity": ["error", 15]
      }
    }
  ]
}
```

---

## Ignoring Rules

Inline disable comments must include a description explaining the reason. The `@typescript-eslint/ban-ts-comment` rule enforces this for `ts-expect-error` with a minimum description length of 10 characters:

```ts
// eslint-disable-next-line @typescript-eslint/no-explicit-any -- Stripe webhook body must remain as Buffer
const rawBody = req.body as any;
```

`ts-ignore` and `ts-nocheck` are banned entirely.

---

## Running the Linter

From within any service directory:

```bash
pnpm lint
```

Auto-fix fixable violations:

```bash
pnpm lint:fix
```

From the monorepo root (all services):

```bash
pnpm lint --filter="./services/*"
```

Lint with zero tolerance (used in CI):

```bash
pnpm lint --max-warnings=0
```