# Lomash Wood API Client Generator

Generates typed API clients, React Query hooks, and normalised OpenAPI specs from any OpenAPI 3.x specification file. Used to keep the frontend SDK in sync with the backend API contract.

## Setup

```bash
pnpm install
```

## Commands

```bash
pnpm generate   # Generate a client from a spec
pnpm validate   # Validate a spec file
pnpm parse      # Parse and dump the internal IR as JSON
```

---

## Generating Clients

```bash
ts-node src/generate.ts --input <spec> --output <file> --format <type>
```

### Formats

| Format | Output | Description |
|--------|--------|-------------|
| `typescript` | `.ts` | Typed fetch-based client with Zod schemas |
| `axios` | `.ts` | Axios service classes with interceptors |
| `react-query` | `.ts` | TanStack Query v5 hooks (queries + mutations) |
| `openapi` | `.yaml` | Normalised OpenAPI 3.1 YAML spec |

### Options

| Flag | Default | Description |
|------|---------|-------------|
| `-i, --input <file>` | required | Path to OpenAPI spec (.yaml or .json) |
| `-o, --output <file>` | required | Output file path (extension auto-added) |
| `-f, --format <type>` | `typescript` | Output format |
| `--base-url <url>` | from spec | Override the API base URL |
| `--skip-validation` | `false` | Skip spec validation before generating |
| `--no-prettier` | `false` | Skip prettier formatting |

### Examples

```bash
# TypeScript fetch client
ts-node src/generate.ts \
  --input ../../openapi.yaml \
  --output ./generated/client \
  --format typescript

# Axios service classes
ts-node src/generate.ts \
  --input ../../openapi.yaml \
  --output ./generated/axios-client \
  --format axios

# React Query hooks
ts-node src/generate.ts \
  --input ../../openapi.yaml \
  --output ./generated/hooks \
  --format react-query

# Normalised OpenAPI YAML
ts-node src/generate.ts \
  --input ../../openapi.yaml \
  --output ./generated/openapi-normalised \
  --format openapi

# Override base URL for staging
ts-node src/generate.ts \
  --input ../../openapi.yaml \
  --output ./generated/staging-client \
  --format axios \
  --base-url https://api.staging.lomashwood.co.uk
```

---

## Validating Specs

```bash
ts-node src/validate.ts <spec-file> [--json] [--strict]
```

### What It Checks

**Hard errors** (fail the build):
- Missing `openapi` version field or non-3.x version
- Missing `info.title` or `info.version`
- Paths without any operations
- Operations without `responses`
- Broken `$ref` references pointing to non-existent components
- Array schemas missing `items`
- Path template parameters without matching parameter definitions

**Warnings** (informational, do not fail by default):
- Missing `info.description`
- No servers defined
- Operations missing `operationId`, `summary`, or `tags`
- No 2xx response defined
- No 4xx validation error response
- POST/PUT/PATCH without `requestBody`
- Parameters missing `schema`
- Protected routes (orders, appointments, analytics) with no `security` requirement
- Required Lomash Wood routes absent from the spec
- Unexpected `Content-Type` values

### Options

| Flag | Description |
|------|-------------|
| `--json` | Output result as JSON |
| `--strict` | Exit with code 1 if any warnings are found |

### Examples

```bash
# Basic validation
ts-node src/validate.ts ../../openapi.yaml

# CI-safe strict mode
ts-node src/validate.ts ../../openapi.yaml --strict

# Machine-readable output
ts-node src/validate.ts ../../openapi.yaml --json > validation.json
```

---

## Parsing the IR

Dumps the internal parsed representation as JSON for inspection or custom scripting:

```bash
ts-node src/parser.ts ../../openapi.yaml | jq '.operations[] | .operationId'
```

---

## Templates

Templates live in `src/templates/` and are Handlebars `.hbs` files.

### Available Helpers

| Helper | Description |
|--------|-------------|
| `upperFirst` | Capitalise first letter |
| `lowerFirst` | Lowercase first letter |
| `camelCase` | Convert to camelCase |
| `pascalCase` | Convert to PascalCase |
| `constantCase` | Convert to CONSTANT_CASE |
| `schemaToTs` | Convert ParsedSchema to TypeScript type string |
| `schemaToZod` | Convert ParsedSchema to Zod validator string |
| `eq`, `ne`, `and`, `or`, `not` | Logical operators |
| `includes` | Array inclusion check |
| `join` | Array join |
| `isLast` | True if index is last in array |
| `hasPathParams` | True if operation has path params |
| `hasQueryParams` | True if operation has query params |
| `pathParams` | Filter parameters to path params only |
| `queryParams` | Filter parameters to query params only |
| `successResponse` | Get the 200/201 response from an operation |
| `pathToUrl` | Convert `{param}` to `${param}` for template literals |
| `operationsByTag` | Filter operations by tag name |
| `tagToPascal` | Convert tag name to PascalCase identifier |
| `isRequired` | Check if a property is in the required array |
| `isMutation` | True if operation is POST/PUT/PATCH/DELETE |
| `isQuery` | True if operation is GET |
| `reactQueryKey` | Build a React Query key string for an operation |
| `json` | Serialize value to JSON string |

### Adding a New Template

Create `src/templates/my-format.hbs` then pass `--format my-format` to the generator. The full `ParsedSpec` context is available in every template:

```
spec            — full ParsedSpec object
title           — API title string
version         — API version string
description     — API description string
baseUrl         — resolved base URL
operations      — ParsedOperation[]
models          — ParsedModel[]
tags            — string[]
operationsByTag — Record<tag, ParsedOperation[]>
generatedAt     — ISO timestamp string
hasAuth         — boolean
totalOperations — number
totalModels     — number
```

---

## Generated Output Examples

### TypeScript Client (`typescript`)

```typescript
import LomashApi, { setAuthToken } from "./generated/client";

setAuthToken(localStorage.getItem("token"));

const products = await LomashApi.Product.getProducts({ page: 1, limit: 24 });
const product  = await LomashApi.Product.getProductsId({ id: "abc123" });
```

### Axios Client (`axios`)

```typescript
import lomashApi from "./generated/axios-client";

lomashApi.setAuthToken(token);

const products = await lomashApi.product.getProducts({ page: 1, limit: 24 });
```

### React Query Hooks (`react-query`)

```tsx
import { useProductApi, setAuthToken } from "./generated/hooks";

function ProductList() {
  const api = useProductApi();

  const { data, isLoading } = api.useGetProducts({ page: 1, limit: 24 });

  const createMutation = api.useCreateProduct({
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["product"] }),
  });

  return <div>{data?.items.map(p => <div key={p.id}>{p.title}</div>)}</div>;
}
```

---

## CI Integration

```yaml
- name: Validate OpenAPI spec
  run: ts-node tools/api-client-generator/src/validate.ts openapi.yaml --strict

- name: Generate TypeScript client
  run: |
    ts-node tools/api-client-generator/src/generate.ts \
      --input openapi.yaml \
      --output packages/api-client/src/generated \
      --format typescript

- name: Generate React Query hooks
  run: |
    ts-node tools/api-client-generator/src/generate.ts \
      --input openapi.yaml \
      --output packages/api-client/src/hooks \
      --format react-query
```

## Required Lomash Wood Routes

The validator checks for the presence of these routes as part of the API contract:

```
POST   /v1/auth/register
POST   /v1/auth/login
POST   /v1/auth/logout
GET    /v1/auth/me
GET    /v1/products
GET    /v1/products/{id}
POST   /v1/products
PATCH  /v1/products/{id}
DELETE /v1/products/{id}
GET    /v1/categories
GET    /v1/appointments/availability
POST   /v1/appointments
GET    /v1/appointments/{id}
GET    /v1/showrooms
GET    /v1/showrooms/{id}
GET    /v1/blog
GET    /v1/blog/{slug}
POST   /v1/brochures
POST   /v1/business
POST   /v1/contact
POST   /v1/newsletter
POST   /v1/payments/create-intent
POST   /v1/webhooks/stripe
POST   /v1/uploads
```