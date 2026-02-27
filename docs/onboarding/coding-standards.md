# Coding Standards

---

## Overview

These standards apply to all TypeScript code across the Lomash Wood backend — api-gateway, all microservices, and shared packages. Consistency and readability are prioritised over cleverness. All rules are enforced by ESLint and TypeScript strict mode in CI.

---

## TypeScript

### Strict Mode

All services use TypeScript strict mode. The `packages/tsconfig/base.json` extends from:

```json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true,
    "noUncheckedIndexedAccess": true,
    "exactOptionalPropertyTypes": true
  }
}
```

Never disable strict checks with `// @ts-ignore` or `// @ts-expect-error` without a documented reason in a comment on the same line.

### No `any`

`any` is banned. Use `unknown` for values whose types are not known at compile time, and narrow with type guards:

```typescript
// Bad
function processEvent(event: any): void { }

// Good
function processEvent(event: unknown): void {
  if (!isValidEvent(event)) throw new AppError('INVALID_EVENT');
  // event is now narrowed
}
```

### Explicit Return Types

All exported functions and class methods must have explicit return types:

```typescript
// Bad
export async function findProductById(id: string) {
  return prisma.product.findUnique({ where: { id } });
}

// Good
export async function findProductById(id: string): Promise<Product | null> {
  return prisma.product.findUnique({ where: { id } });
}
```

### Type Imports

Always use `import type` for type-only imports to keep runtime bundle clean:

```typescript
import type { Request, Response } from 'express';
import type { Product } from '@prisma/client';
```

### Enums

Prefer string enums or `as const` objects over numeric enums:

```typescript
// Preferred — const objects are tree-shakeable and produce readable values
export const AppointmentType = {
  HOME_MEASUREMENT: 'HOME_MEASUREMENT',
  ONLINE: 'ONLINE',
  SHOWROOM: 'SHOWROOM',
} as const;

export type AppointmentType = typeof AppointmentType[keyof typeof AppointmentType];

// Also acceptable — string enum
export enum OrderStatus {
  PENDING = 'PENDING',
  CONFIRMED = 'CONFIRMED',
  COMPLETED = 'COMPLETED',
}
```

---

## File and Module Structure

### File Naming

| Pattern | Convention | Example |
|---|---|---|
| Source files | `kebab-case.ts` | `product.service.ts` |
| Test files | `kebab-case.test.ts` | `product.service.test.ts` |
| Type files | `kebab-case.types.ts` | `product.types.ts` |
| Schema files | `kebab-case.schemas.ts` | `product.schemas.ts` |

### Module Exports

Each module must have a barrel `index.ts` that explicitly re-exports public surface:

```typescript
// src/app/products/index.ts
export { ProductController } from './product.controller';
export { ProductService } from './product.service';
export type { CreateProductDto, UpdateProductDto } from './product.types';
```

Never import directly from deep paths outside a module's directory. Only import from the module's `index.ts`.

---

## Naming Conventions

| Element | Convention | Example |
|---|---|---|
| Variables | camelCase | `productId`, `isActive` |
| Functions | camelCase | `findProductById`, `createOrder` |
| Classes | PascalCase | `ProductService`, `OrderRepository` |
| Interfaces | PascalCase | `IProductRepository` |
| Types | PascalCase | `CreateProductDto`, `PaginatedResult` |
| Constants | SCREAMING_SNAKE_CASE | `MAX_PAGE_SIZE`, `DEFAULT_LIMIT` |
| Enums | PascalCase (name), SCREAMING_SNAKE_CASE (values) | `OrderStatus.CONFIRMED` |
| Private class members | camelCase with no prefix | `this.prisma`, `this.logger` |

Do not use Hungarian notation, `_` prefixes for private members, or abbreviations that are not universally understood (`req`, `res`, `err`, `db` are acceptable; `prm`, `prd`, `svc` are not).

---

## Architecture Patterns

### Controller Layer

Controllers handle HTTP only: extract request data, call the service, and return the response. No business logic, no database access, no external calls.

```typescript
export class ProductController {
  constructor(private readonly productService: ProductService) {}

  async getById(req: Request, res: Response): Promise<void> {
    const product = await this.productService.findById(req.params.id);
    res.status(200).json({ data: product });
  }
}
```

### Service Layer

Services contain all business logic. They orchestrate calls to repositories, external clients, and the event bus. No direct `req`/`res` references.

```typescript
export class ProductService {
  constructor(
    private readonly productRepository: ProductRepository,
    private readonly eventProducer: EventProducer,
    private readonly logger: Logger,
  ) {}

  async findById(id: string): Promise<ProductDto> {
    const product = await this.productRepository.findById(id);
    if (!product) throw new NotFoundError('PRODUCT_NOT_FOUND', `Product ${id} not found`);
    return ProductMapper.toDto(product);
  }
}
```

### Repository Layer

Repositories encapsulate all Prisma database access. No business logic. Return domain models, not Prisma types directly.

```typescript
export class ProductRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findById(id: string): Promise<Product | null> {
    return this.prisma.product.findUnique({
      where: { id, deletedAt: null },
      include: { colours: true, images: true, sizes: true },
    });
  }
}
```

### Dependency Injection

Services and repositories are composed at bootstrap time in `bootstrap.ts`. Constructor injection is used throughout — no service locators or global singletons (except the Prisma client singleton).

```typescript
// bootstrap.ts
const prisma = createPrismaClient();
const productRepository = new ProductRepository(prisma);
const eventProducer = new EventProducer(redisClient);
const productService = new ProductService(productRepository, eventProducer, logger);
const productController = new ProductController(productService);
```

---

## Error Handling

### Custom Error Classes

All thrown errors must be instances of the application error classes defined in `shared/errors.ts`:

```typescript
export class AppError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly statusCode: number = 500,
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export class NotFoundError extends AppError {
  constructor(code: string, message: string) {
    super(code, message, 404);
  }
}

export class ValidationError extends AppError {
  constructor(code: string, message: string) {
    super(code, message, 422);
  }
}

export class ConflictError extends AppError {
  constructor(code: string, message: string) {
    super(code, message, 409);
  }
}
```

Never `throw new Error('something went wrong')`. Always use a typed error class with a machine-readable `code`.

### Async Error Propagation

Wrap async route handlers to ensure errors propagate to the global error middleware:

```typescript
// utils/async-handler.ts
export const asyncHandler = (fn: AsyncRequestHandler) =>
  (req: Request, res: Response, next: NextFunction): void => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
```

---

## Validation

All external input is validated with Zod before reaching the service layer. Define schemas in `*.schemas.ts` files and use the `validation.middleware.ts` in routes:

```typescript
// product.schemas.ts
export const createProductSchema = z.object({
  body: z.object({
    title: z.string().min(2).max(200),
    description: z.string().min(10),
    category: z.enum(['KITCHEN', 'BEDROOM']),
    price: z.number().positive(),
  }),
});

// product.routes.ts
router.post(
  '/',
  authenticate,
  requireRole('ADMIN'),
  validate(createProductSchema),
  asyncHandler(productController.create.bind(productController)),
);
```

Never access `req.body` properties without prior Zod validation.

---

## Logging

Use the Pino logger injected via dependency injection. Never use `console.log` in production code.

```typescript
// Good
this.logger.info({ productId: id, userId: req.user.id }, 'Product fetched');
this.logger.error({ error, productId: id }, 'Failed to update product');

// Bad
console.log('Product fetched:', id);
console.error(error);
```

Log at the appropriate level:

| Level | When |
|---|---|
| `error` | Unrecoverable errors, exceptions caught by global handler |
| `warn` | Recoverable issues, deprecated usage, unexpected-but-handled states |
| `info` | Significant business events (booking created, payment succeeded) |
| `debug` | Detailed diagnostic info for development (DB queries, cache hits/misses) |

Never log sensitive data: passwords, tokens, full credit card numbers, or personal data beyond `userId`.

---

## Code Formatting

Prettier handles all formatting. Configuration is in `.prettierrc` at the root. Key settings:

```json
{
  "semi": true,
  "singleQuote": true,
  "trailingComma": "all",
  "printWidth": 100,
  "tabWidth": 2,
  "arrowParens": "always"
}
```

Format is applied automatically on commit via Husky. To format manually:

```bash
pnpm format
```

---

## Comments and Documentation

- Write self-documenting code. If a comment is needed to explain *what* the code does, consider refactoring.
- Comments should explain *why*, not *what*.
- JSDoc comments are required on all exported functions, classes, and types in shared packages.
- Never leave TODO or FIXME comments in merged code. Open a GitHub issue instead.
- No commented-out code in merged PRs.

```typescript
// Bad — explains what, not why
// Increment the counter
counter++;

// Good — explains why
// Stripe requires amounts in pence (smallest currency unit)
const amountInPence = Math.round(priceGbp * 100);
```

---

## General Rules

- Maximum function length: 40 lines. Extract helper functions if longer.
- Maximum file length: 300 lines. Split into multiple files if longer.
- No magic numbers or strings. Extract to named constants in `*.constants.ts`.
- Prefer `const` over `let`. Never use `var`.
- Prefer early returns over deeply nested conditionals.
- Prefer `async/await` over raw Promise chains.
- Never use `Promise.all` with side effects where order matters — use sequential `await` instead.