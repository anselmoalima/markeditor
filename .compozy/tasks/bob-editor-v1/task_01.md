---
status: completed
title: Monorepo scaffold — pnpm workspaces, Turborepo, CI/CD, Changesets
type: chore
complexity: high
dependencies: []
---

# Task 1: Monorepo scaffold — pnpm workspaces, Turborepo, CI/CD, Changesets

## Overview

Establish the complete monorepo infrastructure that all subsequent tasks depend on. This covers workspace orchestration (pnpm + Turborepo), TypeScript baseline, linting/formatting, the three GitHub Actions workflows (CI, release, bundle size), and Changesets for versioned publishing. Without this foundation no package can be built, tested, or published.

<critical>
- ALWAYS READ the PRD and TechSpec before starting
- REFERENCE TECHSPEC for implementation details — do not duplicate here
- FOCUS ON "WHAT" — describe what needs to be accomplished, not how
- MINIMIZE CODE — show code only to illustrate current structure or problem areas
- TESTS REQUIRED — every task MUST include tests in deliverables
</critical>

<requirements>
- MUST create `pnpm-workspace.yaml` with `packages: ['packages/*', 'apps/*']`
- MUST create `turbo.json` with pipeline tasks: `build`, `test`, `test:types`, `lint`, `typecheck`, `size`, `e2e`, each with correct `dependsOn` and `outputs` per TechSpec Build Order
- MUST create `tsconfig.base.json` with `strict: true`, `noUncheckedIndexedAccess: true`, `exactOptionalPropertyTypes: true`
- MUST create root `package.json` with pnpm scripts that delegate to Turbo (`pnpm -r build`, `pnpm -r test`, etc.)
- MUST add ESLint + Prettier configs at root; enforce `--max-warnings 0` in lint script
- MUST create `.github/workflows/ci.yml` with matrix Node 18/20/22 × React 18/19; steps: install → build → typecheck → test → lint
- MUST create `.github/workflows/release.yml` using Changesets action + `npm publish --provenance --access public` via OIDC (no long-lived NPM_TOKEN)
- MUST create `.github/workflows/size.yml` running `size-limit` and posting diff comment on PRs
- MUST initialize `.changeset/config.json` with `access: public`, `baseBranch: main`, changelog formatter, and playground excluded from versioning
- MUST add `LICENSE` (MIT), `.nvmrc` (18), `.editorconfig`, `.prettierignore`, `CONTRIBUTING.md` placeholder, root `README.md` placeholder
- SHOULD add `.husky/` pre-commit hook that runs `pnpm lint-staged` — do not install husky if it adds meaningful bundle weight to the published package
- MUST NOT place any library source code in this task — only infrastructure
</requirements>

## Subtasks

- [x] 1.1 Create `pnpm-workspace.yaml`, root `package.json`, `.nvmrc`, `.editorconfig`
- [x] 1.2 Create `turbo.json` with full task graph matching TechSpec Build Order
- [x] 1.3 Create `tsconfig.base.json` with strict TypeScript settings from TechSpec §2
- [x] 1.4 Add ESLint (`eslint.config.js`) and Prettier (`.prettierrc`, `.prettierignore`) root configs
- [x] 1.5 Create `.github/workflows/ci.yml` with Node × React matrix
- [x] 1.6 Create `.github/workflows/release.yml` with Changesets + OIDC provenance
- [x] 1.7 Create `.github/workflows/size.yml` for bundle size gate
- [x] 1.8 Initialize `.changeset/config.json` and add LICENSE, CONTRIBUTING.md, README.md placeholders
- [x] 1.9 Write infrastructure smoke tests (see Tests section)

## Implementation Details

See TechSpec 'Development Sequencing' → 'Build Order' step 1 and ADR-001 'Implementation Notes' for exact file contents and Turbo task graph semantics.

Key constraints:

- `turbo.json` task `build` must declare `dependsOn: ["^build"]` so Turbo respects cross-workspace build order.
- CI matrix uses `pnpm install --frozen-lockfile` to prevent drift.
- OIDC provenance requires `id-token: write` permission in the release workflow job and `npm publish --provenance`.
- Changesets config must list `apps/playground` in `ignore` so a playground-only change does not trigger a package version bump.

### Relevant Files

- `pnpm-workspace.yaml` — workspace glob pattern
- `turbo.json` — pipeline task graph
- `tsconfig.base.json` — TypeScript base shared by all packages
- `package.json` (root) — orchestration scripts
- `eslint.config.js` — root ESLint config
- `.prettierrc` — root Prettier config
- `.github/workflows/ci.yml` — CI pipeline
- `.github/workflows/release.yml` — publish pipeline
- `.github/workflows/size.yml` — bundle size gate
- `.changeset/config.json` — versioning config
- `LICENSE`, `CONTRIBUTING.md`, `README.md` — repo-level docs

### Dependent Files

- `packages/bob-editor/package.json` (task_02) — inherits from workspace and Turbo graph
- `apps/playground/package.json` (task_02) — workspace consumer

### Related ADRs

- [ADR-001: pnpm + Turborepo monorepo with tsup dual ESM/CJS build](adrs/adr-001.md) — Defines the monorepo topology, build tool choice, and Changesets/OIDC publish strategy
- [ADR-009: TDD pyramid with vitest bench regression gate and Changesets-backed provenance release](adrs/adr-009.md) — Defines CI matrix, coverage gates, and release pipeline requirements

## Deliverables

- `pnpm-workspace.yaml` with correct workspace globs
- `turbo.json` with complete task graph
- `tsconfig.base.json` with strict settings
- Root `package.json` with all orchestration scripts
- ESLint + Prettier root configs
- Three GitHub Actions workflows (ci, release, size)
- `.changeset/config.json`
- LICENSE, CONTRIBUTING.md, README.md, .nvmrc, .editorconfig
- Infrastructure smoke tests with 80%+ coverage **(REQUIRED)**

## Tests

- Unit tests:
  - [ ] `turbo.json` schema validation: `turbo.json` is valid JSON and contains `build`, `test`, `typecheck`, `lint`, `size` pipelines
  - [ ] `tsconfig.base.json` has `strict: true`, `noUncheckedIndexedAccess: true`, `exactOptionalPropertyTypes: true`
  - [ ] `.changeset/config.json` has `access: "public"` and `ignore` contains `"playground"`
  - [ ] `pnpm-workspace.yaml` lists `packages/*` and `apps/*`
  - [ ] Root `package.json` has `pnpm -r build`, `pnpm -r test`, `pnpm -r typecheck`, `pnpm -r lint` scripts
- Integration tests:
  - [ ] `pnpm install --frozen-lockfile` exits 0 from repo root (smoke test for workspace resolution)
  - [ ] `turbo run build --dry-run` exits 0 and outputs expected task list (no real build, just graph validation)
- Test coverage target: >=80%
- All tests must pass

## Success Criteria

- All tests passing
- Test coverage >=80%
- `pnpm install` succeeds from repo root
- `turbo run build --dry-run` resolves the dependency graph without errors
- All three GitHub Actions workflows are valid YAML (run `actionlint` or validate locally)
- `changeset status` exits 0
- No library source code exists yet — only infrastructure
