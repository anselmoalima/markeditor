---
status: completed
title: ci.yml matrix Node 18/20/22 × React 18/19
type: infra
complexity: high
dependencies:
  - task_03
  - task_05
  - task_06
  - task_08
  - task_09
---

# Task 10: ci.yml matrix Node 18/20/22 × React 18/19

## Overview

Author the main GitHub Actions workflow `.github/workflows/ci.yml` that runs on every PR and push to `main`. It must execute the full quality gate (lint, typecheck, unit + type tests with coverage, size-limit, publint, attw, Playwright smoke) across the Node 18/20/22 × React 18/19 matrix, upload coverage to Codecov, and cache pnpm-store, Turbo, and Playwright browsers.

<critical>
- ALWAYS READ the PRD and TechSpec before starting
- REFERENCE TECHSPEC for implementation details — do not duplicate here
- FOCUS ON "WHAT" — describe what needs to be accomplished, not how
- MINIMIZE CODE — show code only to illustrate current structure or problem areas
- TESTS REQUIRED — every task MUST include tests in deliverables
</critical>

<requirements>
- Workflow MUST trigger on `push` to `main` and `pull_request`.
- Matrix MUST cover `node-version: [18, 20, 22]` × `react-version: [18, 19]` (6 cells), with one cell designated as the "primary" job that uploads coverage.
- Workflow MUST enable Corepack and use the pnpm version pinned in `packageManager`.
- Steps MUST run, in order: `pnpm install --frozen-lockfile`, override React version per matrix, `pnpm lint --max-warnings 0`, `pnpm -r typecheck`, `pnpm -r test --coverage`, `pnpm -r build`, `pnpm size`, `pnpm publint`, `pnpm attw`, `pnpm --filter playground build`, `pnpm exec playwright install --with-deps chromium`, `pnpm --filter playground e2e`.
- Caches MUST be configured for pnpm store, `.turbo`, and Playwright browsers.
- `codecov/codecov-action@v4` MUST upload coverage from the primary matrix cell using OIDC where supported, falling back to `CODECOV_TOKEN` secret.
- Workflow MUST fail fast on any non-zero step.
- Workflow MUST publish a Markdown PR comment summarizing job results (built-in checks suffice; explicit summary optional).
</requirements>

## Subtasks

- [x] 10.1 Author `.github/workflows/ci.yml` with the matrix and ordered steps.
- [x] 10.2 Add cache config for pnpm-store, `.turbo`, Playwright browsers.
- [x] 10.3 Add React-version override step using `pnpm update react@X react-dom@X -r` before tests.
- [x] 10.4 Wire Codecov action on the primary matrix cell only.
- [ ] 10.5 Enable branch protection (documented in `CONTRIBUTING.md` stub — task_13) requiring this workflow.

## Implementation Details

Reference TechSpec sections "Data Flow", "Build Order step 13", and ADRs 001/003/005. Primary cell convention: `node-version == 20 && react-version == 19` uploads coverage; other cells only run tests. Avoid duplicating steps via reusable workflows in Phase 0 — keep one file readable; reuse can come later.

### Relevant Files

- `.github/workflows/ci.yml` — main CI workflow.

### Dependent Files

- All previous tasks' artifacts (lint config, vitest config, tsup output, playwright spec, changeset config) are exercised here.
- Branch protection rules (configured in GitHub UI, documented in task_13).

### Related ADRs

- [ADR-001: Monorepo with pnpm workspaces + Turborepo](adrs/adr-001.md) — pnpm Corepack + Turbo cache.
- [ADR-003: Test stack — Vitest (jsdom) + Playwright + axe-core + MSW](adrs/adr-003.md) — test + a11y gates.
- [ADR-005: Quality gates — ESLint flat + Prettier + Husky + size-limit + Codecov](adrs/adr-005.md) — full gate chain.

## Deliverables

- `.github/workflows/ci.yml` committed and green on the current tree.
- All 6 matrix cells pass on the first run after merge.
- Unit tests asserting workflow shape (parseable YAML, required steps present) **(REQUIRED)**.
- Integration tests verifying the workflow runs locally via `act` or `nektos/act` on at least the primary cell **(REQUIRED, with fallback to a documented manual run if `act` is impractical)**.

## Tests

- Unit tests:
  - [x] `.github/workflows/ci.yml` parses as valid YAML.
  - [x] Workflow declares `strategy.matrix.node-version: [18, 20, 22]` and `react-version: [18, 19]`.
  - [x] Workflow contains steps invoking `pnpm install --frozen-lockfile`, `pnpm lint`, `pnpm -r test`, `pnpm size`, `pnpm publint`, `pnpm attw`, and `pnpm --filter playground e2e` in correct order.
  - [x] Workflow contains `codecov/codecov-action@v4` step gated by an `if` matching only the primary matrix cell.
- Integration tests:
  - [ ] First post-merge run on `main` reports all 6 matrix cells green.
  - [ ] A PR introducing an ESLint violation causes `pnpm lint` step to fail.
  - [ ] A PR introducing a bundle bloat above `size-limit` causes `pnpm size` step to fail.
  - [ ] Coverage upload appears in Codecov dashboard within 5 minutes of the primary cell completing.
- Test coverage target: >=80% (workflow lint coverage via `actionlint`)
- All tests must pass

## Success Criteria

- All tests passing
- Workflow green across all 6 matrix cells.
- `actionlint .github/workflows/ci.yml` reports zero issues.
- Codecov badge in README (task_13) resolves to a valid coverage report.
