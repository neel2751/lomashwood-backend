# Contributing Guide

Guidelines for contributing to the Lomash Wood Admin Panel. Please read this before opening a pull request.

## Branching Strategy

We follow a simplified **GitFlow** model:

```
main          ← production-ready code, deployed on release tag
  └── develop ← integration branch, auto-deployed to staging
        ├── feature/LW-123-product-image-upload
        ├── fix/LW-456-order-status-badge
        └── chore/LW-789-update-dependencies
```

| Branch prefix | Purpose |
|---|---|
| `feature/` | New features or enhancements |
| `fix/` | Bug fixes |
| `chore/` | Dependency updates, config changes, refactors with no behaviour change |
| `docs/` | Documentation only |
| `hotfix/` | Critical production fixes branched directly from `main` |

**Always branch from `develop`** unless it is a hotfix, in which case branch from `main` and open PRs against both `main` and `develop`.

## Branch Naming

```
<prefix>/LW-<ticket-number>-<short-description-in-kebab-case>

# Examples
feature/LW-101-appointment-calendar-view
fix/LW-202-refund-form-validation
chore/LW-303-upgrade-tanstack-query-v5
```

## Commit Conventions

We use **Conventional Commits**:

```
<type>(<scope>): <short summary>

[optional body]

[optional footer: BREAKING CHANGE or issue ref]
```

### Types

| Type | When to use |
|---|---|
| `feat` | A new feature |
| `fix` | A bug fix |
| `chore` | Build process, dependency, or config change |
| `docs` | Documentation only |
| `style` | Formatting, missing semicolons — no logic change |
| `refactor` | Code restructure with no behaviour change |
| `test` | Adding or updating tests |
| `perf` | Performance improvements |
| `ci` | CI/CD pipeline changes |

### Scope (optional but encouraged)

Use the domain area as scope:

```
feat(products): add colour swatch picker to product form
fix(orders): correct refund amount calculation
chore(deps): upgrade next to 14.2.5
test(appointments): add unit tests for slot conflict logic
```

### Examples

```bash
git commit -m "feat(appointments): add consultant availability calendar"
git commit -m "fix(auth): redirect to login on 401 from API gateway"
git commit -m "chore: update pnpm-lock.yaml after dependency audit"
git commit -m "docs: add API route reference to API.md"
```

## Pull Request Process

### Before Opening a PR

Run the full local quality check:

```bash
pnpm type-check   # must pass with 0 errors
pnpm lint         # must pass with 0 errors
pnpm test         # must pass with no failures
pnpm build        # must complete successfully
```

### PR Title

Follow the same Conventional Commits format:

```
feat(products): add bulk delete to product table
fix(orders): prevent duplicate refund submission
```

### PR Description

Use the PR template (`.github/PULL_REQUEST_TEMPLATE.md`). Fill in:

- **What** — what does this PR change?
- **Why** — what problem does it solve or what ticket does it address?
- **How** — any non-obvious implementation decisions
- **Testing** — what was tested manually and what automated tests were added
- **Screenshots** — for any UI changes, include before/after screenshots

### Review Requirements

- Minimum **1 approval** from a team member before merging
- All CI checks must be green
- No unresolved review comments
- Branch must be up to date with `develop` before merging

### Merging

Use **Squash and Merge** for feature and fix branches to keep `develop` history clean.

Use **Merge Commit** for `develop → main` to preserve the full integration history.

## Code Standards

### TypeScript

- `strict: true` is enforced — no `any`, no `@ts-ignore` without a comment explaining why
- Use `type` imports: `import type { Product } from "@/types/product.types"`
- Prefer explicit return types on exported functions and hooks
- All Zod schemas live in `src/schemas/` — reuse them in both form validation and API route validation

### Components

- One component per file
- Use named exports, not default exports, for all components except Next.js `page.tsx` and `layout.tsx` files
- Co-locate component-specific types inside the same file; shared types go in `src/types/`
- Use Shadcn UI primitives from `src/components/ui/` as the base — do not install competing UI libraries

### Data Fetching

- All server state lives in React Query hooks in `src/hooks/`
- Never fetch directly in components — always use a hook
- Mutations must invalidate the relevant query keys on success
- Use optimistic updates for simple status toggles (order status, publish/unpublish)

### Forms

- All forms use React Hook Form + Zod via `@hookform/resolvers/zod`
- Schema goes in `src/schemas/` with the filename matching the domain (e.g. `product.schema.ts`)
- Never use uncontrolled inputs outside of React Hook Form

### Styling

- Use Tailwind utility classes directly — avoid writing custom CSS unless absolutely necessary
- Use the `cn()` helper from `@/lib/utils` to merge conditional classes
- All colour/spacing tokens come from `tailwind.config.ts` — do not hardcode hex values or pixel values

### File Naming

| Type | Convention | Example |
|---|---|---|
| Components | PascalCase | `ProductForm.tsx` |
| Hooks | camelCase with `use` prefix | `useProducts.ts` |
| Services | camelCase with `Service` suffix | `productService.ts` |
| Schemas | kebab-case with `.schema.ts` | `product.schema.ts` |
| Types | kebab-case with `.types.ts` | `product.types.ts` |
| Utils | kebab-case | `table-helpers.ts` |
| Pages | lowercase (`page.tsx`) | `page.tsx` |

## Testing

### Unit Tests

Write unit tests for:
- Utility functions in `src/utils/`
- Zod schema validation edge cases in `src/schemas/`
- Custom hooks in `src/hooks/` (mock React Query and API calls with MSW)
- Pure UI components with complex conditional rendering

Place tests in `tests/unit/` mirroring the `src/` structure.

```bash
pnpm test            
pnpm test:watch        during development
pnpm test:coverage   coverage report
```

### E2E Tests

Write Playwright e2e tests for complete user flows:
- Login and session persistence
- CRUD flows for products, orders, appointments
- Form validation and error states
- Role-based access (admin vs. staff)

Place tests in `tests/e2e/` with one spec file per domain.

```bash
pnpm e2e          
pnpm e2e:ui      Playwright UI — great for writing new tests
```

## Submodule Changes

The `packages/api-client` directory is a git submodule and is managed separately. Do not commit changes to files inside `packages/api-client` from this repository.

To pull the latest API client:

```bash
git submodule update --remote --merge
pnpm install
```

If the API client has breaking changes, open a PR in this repository that updates the submodule pointer and adapts any affected service files.

## Questions

Raise questions in the team Slack channel or open a GitHub Discussion if you are unsure about an approach before investing time in an implementation.