# Contributing to bob-editor

Thank you for your interest in contributing!

## Development Setup

```bash
# Install dependencies
pnpm install

# Start library dev watch
pnpm --filter bob-editor dev

# Start playground
pnpm --filter playground dev
```

## Testing

```bash
# Run all tests
pnpm test

# Run tests for the library only
pnpm --filter bob-editor test

# Type tests
pnpm --filter bob-editor test:types

# E2E tests
pnpm --filter playground e2e
```

## Pull Requests

- Every change to `packages/bob-editor/src/**` requires a changeset: run `pnpm changeset` and follow the prompts.
- All tests must pass before a PR can be merged.
- Coverage must stay at ≥80% lines / ≥75% branches.
- Bundle size gates are enforced via `size-limit`.

## Code Style

- TypeScript `strict: true` — no `any`, no type assertions without justification.
- No comments unless the _why_ is non-obvious.
- CSS via `--mde-*` CSS variables only — no Tailwind, no CSS-in-JS inside the library.

## Versioning

This project uses [Changesets](https://github.com/changesets/changesets) for versioning and release.
