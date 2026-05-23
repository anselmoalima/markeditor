---
status: completed
title: tsconfig.base + Turborepo pipeline
type: infra
complexity: low
dependencies:
  - task_01
---

# Task 02: tsconfig.base + Turborepo pipeline

## Overview

Add the shared strict TypeScript base (`tsconfig.base.json`) and the Turborepo pipeline (`turbo.json`) that every later workspace extends and every CI job invokes. This is the foundation that makes per-workspace builds reproducible and cacheable.

<critical>
- ALWAYS READ the PRD and TechSpec before starting
- REFERENCE TECHSPEC for implementation details — do not duplicate here
- FOCUS ON "WHAT" — describe what needs to be accomplished, not how
- MINIMIZE CODE — show code only to illustrate current structure or problem areas
- TESTS REQUIRED — every task MUST include tests in deliverables
</critical>

<requirements>
- `tsconfig.base.json` MUST set `strict: true`, `noUncheckedIndexedAccess: true`, `exactOptionalPropertyTypes: true`, `moduleResolution: "Bundler"`, `target: "ES2022"`, `module: "ESNext"`, `jsx: "react-jsx"`, `isolatedModules: true`, `skipLibCheck: true`.
- `tsconfig.base.json` MUST NOT set `outDir`, `rootDir`, or `include`/`exclude` — those are per-workspace.
- `turbo.json` MUST define pipelines for `build`, `test`, `typecheck`, `lint`, `size`, and `e2e` with correct `dependsOn`/`outputs`/`inputs`.
- `turbo.json` MUST NOT enable remote cache (local-only per ADR-001).
- Root `package.json` MUST add scripts `build`, `test`, `lint`, `typecheck`, `size` that delegate to `turbo run <task>`.
- Running `pnpm turbo run typecheck` on a fresh repo MUST succeed (no workspaces yet → no-op).
</requirements>

## Subtasks

- [x] 2.1 Add `tsconfig.base.json` at repo root with strict compiler options.
- [x] 2.2 Add `turbo.json` with pipelines and per-pipeline `outputs` declarations.
- [x] 2.3 Add `turbo` to root devDependencies and wire root scripts to delegate.
- [x] 2.4 Verify Turbo discovers zero workspaces gracefully (no-op build).

## Implementation Details

Reference TechSpec "Build Order steps 2–3" and ADR-001. `outputs` per pipeline should include `dist/**` for build and `coverage/**` for test so Turbo cache invalidates correctly. Avoid environment-sensitive `inputs` overrides at this stage — defaults suffice until later tasks add specific patterns.

### Relevant Files

- `tsconfig.base.json` — strict TS contract for every workspace.
- `turbo.json` — pipeline DAG.
- `package.json` — root delegating scripts.

### Dependent Files

- `packages/markmd/tsconfig.json` (task_04) extends base.
- `apps/playground/tsconfig.json` (task_07) extends base.
- `ci.yml` (task_10) calls root scripts.

### Related ADRs

- [ADR-001: Monorepo with pnpm workspaces + Turborepo](adrs/adr-001.md) — pipeline orchestration and cache strategy.

## Deliverables

- Committed `tsconfig.base.json` and `turbo.json`.
- Root `package.json` scripts updated.
- Unit tests asserting config shape **(REQUIRED)**.
- Integration test: `pnpm turbo run typecheck` exits 0 **(REQUIRED)**.

## Tests

- Unit tests:
  - [x] `tsconfig.base.json` parses as valid JSON and contains `strict: true`, `noUncheckedIndexedAccess: true`, `exactOptionalPropertyTypes: true`.
  - [x] `turbo.json` parses and declares `build`, `test`, `lint`, `typecheck`, `size`, `e2e` tasks.
  - [x] `turbo.json` does NOT declare a `remoteCache` config (local-only).
  - [x] Root `package.json` exposes scripts `build`, `test`, `lint`, `typecheck`, `size`.
- Integration tests:
  - [x] `pnpm turbo run typecheck --dry=json` returns a valid plan with zero tasks (no workspaces yet).
  - [x] `pnpm turbo run build` exits 0 on empty workspace set.
- Test coverage target: >=80%
- All tests must pass

## Success Criteria

- All tests passing
- Test coverage >=80%
- Turbo runs every defined pipeline with no errors on the empty workspace set.
- `tsc --noEmit -p tsconfig.base.json` (with an empty test fixture extending it) compiles a strict-mode file successfully.
