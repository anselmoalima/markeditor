# Contributing to markmd

## Prerequisites

- **Node.js ≥ 18.18** (use `.nvmrc`: `nvm use`)
- **pnpm** via Corepack: `corepack enable && corepack prepare pnpm@latest --activate`

## Getting started

```bash
pnpm install
pnpm -r build
```

## Running tests

| Command                        | What it runs                                 |
| ------------------------------ | -------------------------------------------- |
| `pnpm -r test`                 | Vitest unit + integration                    |
| `pnpm -r typecheck`            | TypeScript strict check                      |
| `pnpm -r lint`                 | ESLint (max-warnings 0)                      |
| `pnpm --filter playground e2e` | Playwright e2e (requires browsers installed) |

## Playwright browser installation

Before running e2e tests for the first time:

```bash
pnpm exec playwright install --with-deps chromium
```

To install all browsers (Chromium, Firefox, WebKit):

```bash
pnpm exec playwright install --with-deps
```

Run this from the repository root. Only needs to be done once per machine (or after a major Playwright version upgrade).

## Running e2e tests

```bash
# Build playground first (required)
pnpm --filter playground build

# Then run the suite
pnpm --filter playground e2e
```

Or via Turborepo (handles build ordering automatically):

```bash
pnpm turbo run e2e --filter=playground
```

## Changesets

Every PR with a user-visible change needs a changeset:

```bash
pnpm changeset
```

Commit the generated `.changeset/*.md` file with your PR.
