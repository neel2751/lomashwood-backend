# @lomash-wood/shared-utils

Shared utility functions for all Lomash Wood microservices. Six focused modules covering structured logging, cryptography, date/time handling, pagination, retry/circuit breaking, and environment variable parsing — all strictly typed with zero runtime type assertions.

---

## Table of Contents

- [Modules](#modules)
- [Installation](#installation)
- [logger](#logger)
- [crypto](#crypto)
- [date](#date)
- [pagination](#pagination)
- [retry](#retry)
- [env](#env)
- [Build](#build)

---

## Modules

| Module | File | Purpose |
|---|---|---|
| `logger` | `logger.ts` | Pino-based structured logger factory with redaction and child loggers |
| `crypto` | `crypto.ts` | Secure token generation, password hashing, HMAC, Base64, masking |
| `date` | `date.ts` | Date arithmetic, formatting, time slot utilities, period ranges |
| `pagination` | `pagination.ts` | Offset and cursor pagination builders for Prisma and API responses |
| `retry` | `retry.ts` | Exponential backoff retry, circuit breaker, timeout, deadline |
| `env` | `env.ts` | Typed environment variable parsing with validation and assertion |

---

## Installation

```json
{
  "dependencies": {
    "@lomash-wood/shared-utils": "workspace:*"
  }
}
```

```bash
pnpm install
```

---

## logger

Pino-based structured logger. All services create a root logger from `createLogger()` at bootstrap, then derive child loggers per-request for trace-level context propagation.

### Creating a logger

```ts
import { createLogger } from '@lomash-wood/shared-utils/logger';

const logger = createLogger({
  level: 'info',
  service: 'auth-service',
  version: '1.0.0',
  environment: 'production',
  pretty: false,
});
```

In development, set `pretty: true` for colourised human-readable output via `pino-pretty`.

### Child loggers

```ts
import { createChildLogger, createRequestLogger } from '@lomash-wood/shared-utils/logger';

const requestLogger = createRequestLogger(logger, {
  requestId: 'req-abc123',
  userId: 'user-xyz',
});
```

Every log line emitted by `requestLogger` automatically includes `requestId` and `userId` bindings — no manual attachment required.

### Structured log helpers

```ts
import { logRequest, logError, logEvent, logDatabaseQuery } from '@lomash-wood/shared-utils/logger';

logRequest(logger, {
  requestId: 'req-abc123',
  method: 'POST',
  url: '/v1/auth/login',
  statusCode: 200,
  durationMs: 45,
  ip: '1.2.3.4',
});

logError(logger, {
  err: new Error('Something failed'),
  requestId: 'req-abc123',
  userId: 'user-xyz',
  context: { orderId: 'ord-123' },
});

logDatabaseQuery(logger, { durationMs: 1200, rows: 1 });
```

`logDatabaseQuery` automatically escalates to `warn` level when `durationMs > 1000`.

### Automatic redaction

The following fields are automatically censored to `[REDACTED]` in all log output regardless of nesting depth:

`password`, `newPassword`, `currentPassword`, `token`, `refreshToken`, `accessToken`, `secret`, `apiKey`, `authorization`, `cookie`, `req.headers.authorization`, `req.headers.cookie`

---

## crypto

All cryptographic operations use Node.js built-in `node:crypto`. No third-party crypto dependencies.

### Token and ID generation

```ts
import {
  generateUuid,
  generateSecureToken,
  generateOtp,
  generateAlphanumericToken,
  generateReferenceNumber,
  generateSlug,
  generateUniqueSlug,
} from '@lomash-wood/shared-utils/crypto';

generateUuid();
generateSecureToken(32);
generateOtp(6);
generateAlphanumericToken(12);
generateReferenceNumber('BK');
generateSlug('Discover Your Dream Kitchen');
generateUniqueSlug('Kitchen Design Trends', Date.now().toString(36));
```

`generateReferenceNumber('BK')` → `BK-LM3K2A-4F9E2C` — used for booking and order reference numbers.

`generateOtp(6)` → `083421` — cryptographically secure, not `Math.random()`.

### Password hashing

Uses `scrypt` with N=16384, r=8, p=1 and a 32-byte random salt. Stored format: `<salt_hex>:<derived_key_hex>`.

```ts
import { hashPassword, verifyPassword } from '@lomash-wood/shared-utils/crypto';

const hash = await hashPassword('user-password-123');
const valid = await verifyPassword('user-password-123', hash);
```

`verifyPassword` uses `timingSafeEqual` to prevent timing attacks.

### HMAC and hashing

```ts
import {
  hashSha256,
  hashSha512,
  createHmacSha256,
  verifyHmacSha256,
  safeCompare,
} from '@lomash-wood/shared-utils/crypto';

const sig = createHmacSha256(rawBody, stripeWebhookSecret);
const valid = verifyHmacSha256(rawBody, stripeWebhookSecret, incomingSignature);
```

`verifyHmacSha256` and `safeCompare` both use `timingSafeEqual` — safe for use in Stripe webhook verification and API key comparison.

### Encoding and masking

```ts
import {
  encodeBase64, decodeBase64,
  encodeBase64Url, decodeBase64Url,
  maskEmail, maskPhone,
} from '@lomash-wood/shared-utils/crypto';

encodeBase64Url('hello world');
maskEmail('john.doe@example.com');
maskPhone('+447911123456');
```

`maskEmail('john.doe@example.com')` → `jo*******@example.com`
`maskPhone('+447911123456')` → `********3456`

---

## date

All date operations work with `DateInput = Date | string | number`. UTC-first — all range/period functions operate in UTC to avoid timezone-dependent results in a server environment.

### Arithmetic

```ts
import { addTime, subtractTime, diffInDays, diffInMinutes } from '@lomash-wood/shared-utils/date';

addTime(new Date(), 24, 'hours');
subtractTime(new Date(), 30, 'days');
diffInDays('2026-01-01', '2026-03-01');
diffInMinutes(startTime, new Date());
```

### Comparison

```ts
import { isPast, isFuture, isExpired, isWithinRange } from '@lomash-wood/shared-utils/date';

isExpired(token.expiresAt);
isFuture(appointment.date);
isWithinRange(new Date(), { from: sale.validFrom, to: sale.validTo });
```

### Period ranges for analytics

```ts
import { dateRangeForPeriod } from '@lomash-wood/shared-utils/date';

const range = dateRangeForPeriod('last30days');
const monthRange = dateRangeForPeriod('month');
const todayRange = dateRangeForPeriod('today');
```

Returns `{ from: Date, to: Date }` covering the full day boundary (00:00:00 → 23:59:59.999 UTC).

### Time slot utilities

```ts
import {
  timeStringToMinutes,
  minutesToTimeString,
  isTimeSlotAvailable,
} from '@lomash-wood/shared-utils/date';

timeStringToMinutes('14:30');
minutesToTimeString(870);

isTimeSlotAvailable('10:00', '11:00', bookedSlots, '2026-03-15');
```

Used by the appointment-service availability engine to check slot conflicts without ORM queries.

### Formatting

```ts
import { formatDuration, formatRelative } from '@lomash-wood/shared-utils/date';

formatDuration(3721000);
formatRelative(new Date(Date.now() - 3600000));
```

`formatDuration(3721000)` → `1h 2m`
`formatRelative(...)` → `1 hour ago`

### Expiry helpers

```ts
import { getExpiryDate, secondsUntil } from '@lomash-wood/shared-utils/date';

const expiresAt = getExpiryDate(15 * 60 * 1000);
const ttl = secondsUntil(expiresAt);
```

`secondsUntil` is used to set Redis TTL values from an absolute expiry date.

---

## pagination

### Offset pagination (standard)

Used by all list endpoints: products, blogs, orders, bookings.

```ts
import {
  parsePaginationParams,
  buildPaginatedResult,
  toPrismaOffsetArgs,
} from '@lomash-wood/shared-utils/pagination';

const params = parsePaginationParams(req.query['page'], req.query['limit']);
const { skip, take } = toPrismaOffsetArgs(params);

const [items, total] = await Promise.all([
  prisma.product.findMany({ skip, take }),
  prisma.product.count(),
]);

const result = buildPaginatedResult(items, params, total);
```

`parsePaginationParams` clamps limit to 1–100 and page to ≥ 1 regardless of what the client sends.

### Cursor pagination (infinite scroll)

Used for the product filter page infinite scroll (SRS FR2.5).

```ts
import {
  toPrismaCursorArgs,
  buildCursorPaginatedResult,
} from '@lomash-wood/shared-utils/pagination';

const { cursor, skip, take } = toPrismaCursorArgs({ cursor: req.query['cursor'], limit: 20 });

const items = await prisma.product.findMany({ cursor, skip, take, orderBy: { id: 'asc' } });

const result = buildCursorPaginatedResult(items, 20);
```

`buildCursorPaginatedResult` fetches `limit + 1` items internally and uses the extra item to determine `hasNextPage` without a separate count query.

### Response shape

Both builders return:

```ts
{
  items: Product[],
  pagination: {
    page: 1,
    limit: 20,
    total: 156,
    totalPages: 8,
    hasNextPage: true,
    hasPrevPage: false,
  }
}
```

---

## retry

### Exponential backoff retry

```ts
import { withRetry } from '@lomash-wood/shared-utils/retry';

const { value, attempts } = await withRetry(
  () => stripeClient.createPaymentIntent(params),
  {
    maxAttempts: 3,
    initialDelayMs: 200,
    maxDelayMs: 2000,
    backoffMultiplier: 2,
    jitter: true,
    shouldRetry: (error, attempt) => isRetryableHttpStatus(error.statusCode) && attempt < 3,
    onRetry: (error, attempt, delayMs) => {
      logger.warn({ err: error, attempt, delayMs }, 'Retrying Stripe request');
    },
  },
);
```

Jitter applies random variation of ±50% to the calculated delay to prevent thundering herd.

### Circuit breaker

```ts
import { CircuitBreaker } from '@lomash-wood/shared-utils/retry';

const breaker = new CircuitBreaker('stripe-api', {
  failureThreshold: 5,
  successThreshold: 2,
  timeoutMs: 30000,
  onOpen: () => logger.error('Stripe circuit breaker OPEN'),
  onClose: () => logger.info('Stripe circuit breaker CLOSED'),
});

const result = await breaker.execute(() => stripeClient.charge(params));
```

State machine: `CLOSED` → `OPEN` (after 5 failures) → `HALF_OPEN` (after 30s timeout) → `CLOSED` (after 2 successes) or back to `OPEN`.

### Timeout and deadline

```ts
import { withTimeout, withDeadline } from '@lomash-wood/shared-utils/retry';

const result = await withTimeout(() => fetchData(), 5000, 'Data fetch timed out');

const deadlineAt = new Date(Date.now() + 10000);
const result2 = await withDeadline(() => processOrder(), deadlineAt);
```

---

## env

Type-safe environment variable access with validation at service startup.

### Basic access

```ts
import {
  getEnv,
  getEnvOrDefault,
  getEnvOptional,
  getEnvInt,
  getEnvBool,
  getEnvEnum,
  getEnvArray,
  getEnvUrl,
} from '@lomash-wood/shared-utils/env';

const dbUrl = getEnv('DATABASE_URL');
const port = getEnvInt('PORT', 3000);
const debug = getEnvBool('DEBUG', false);
const logLevel = getEnvEnum('LOG_LEVEL', ['debug', 'info', 'warn', 'error'], 'info');
const origins = getEnvArray('ALLOWED_ORIGINS');
const s3Url = getEnvUrl('S3_ENDPOINT');
```

### Startup validation

The recommended pattern for every service's `config/env.ts`:

```ts
import {
  assertRequiredEnvVars,
  getEnv,
  getEnvInt,
  getEnvBool,
  getNodeEnv,
} from '@lomash-wood/shared-utils/env';

const REQUIRED = [
  'DATABASE_URL',
  'REDIS_URL',
  'JWT_SECRET',
  'STRIPE_SECRET_KEY',
  'STRIPE_WEBHOOK_SECRET',
] as const;

assertRequiredEnvVars(REQUIRED);

export const config = {
  nodeEnv: getNodeEnv(),
  port: getEnvInt('PORT', 3000),
  databaseUrl: getEnv('DATABASE_URL'),
  redisUrl: getEnv('REDIS_URL'),
  jwtSecret: getEnv('JWT_SECRET'),
  stripe: {
    secretKey: getEnv('STRIPE_SECRET_KEY'),
    webhookSecret: getEnv('STRIPE_WEBHOOK_SECRET'),
  },
} as const;
```

If any required variable is missing at startup, `assertRequiredEnvVars` throws `EnvValidationError` with a clear message listing every missing variable — the service crashes immediately rather than failing later at runtime.

### Environment helpers

```ts
import { isDevelopment, isProduction, isTest } from '@lomash-wood/shared-utils/env';

if (isDevelopment()) {
  logger.level = 'debug';
}
```

---

## Build

```bash
pnpm build
```

```bash
pnpm typecheck
```

```bash
pnpm clean && pnpm build
```