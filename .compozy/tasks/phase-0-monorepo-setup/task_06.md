---
status: completed
title: size-limit + publint + attw quality gates
type: infra
complexity: low
dependencies:
  - task_04
---

# Task 06: size-limit + publint + attw quality gates

## Overview

Add the package-quality gates that protect the published bundle: `size-limit` enforcing per-entrypoint gzip budgets, `publint` validating the `package.json` exports/files contract, and `@arethetypeswrong/cli` (attw) validating dual `.d.ts`/`.d.cts` resolution. These gates are wired into both local scripts and CI later (task_10) and into `prepublishOnly` (task_11).

<critical>
- ALWAYS READ the PRD and TechSpec before starting
- REFERENCE TECHSPEC for implementation details — do not duplicate here
- FOCUS ON "WHAT" — describe what needs to be accomplished, not how
- MINIMIZE CODE — show code only to illustrate current structure or problem areas
- TESTS REQUIRED — every task MUST include tests in deliverables
</critical>

<requirements>
- `packages/markmd/size-limit.json` MUST define limits aligned with PRD §6.1: initial bundle without Monaco <80KB gzip; with Monaco lazy <500KB gzip; per-plugin entrypoints <10KB gzip each.
- `size-limit` MUST use `@size-limit/preset-small-lib`.
- `pnpm size` MUST exit non-zero if any limit is exceeded.
- `pnpm publint` MUST run `publint` against the built `packages/markmd` and exit non-zero on any error.
- `pnpm attw` MUST run `attw --pack packages/markmd` and exit non-zero on resolution errors (ignore `FalseExportDefault` only if explicitly justified).
- All three commands MUST be added to root scripts and to `packages/markmd/package.json` `prepublishOnly` chain (chain wired in task_11).
</requirements>

## Subtasks

- [x] 6.1 Install `size-limit`, `@size-limit/preset-small-lib`, `publint`, `@arethetypeswrong/cli` at the root.
- [x] 6.2 Create `packages/markmd/size-limit.json` with Phase 0 limits.
- [x] 6.3 Add root scripts `size`, `publint`, `attw` delegating to the package.
- [x] 6.4 Verify all three gates pass on the current `dist/` output.

## Implementation Details

Reference TechSpec section "Quality gates" and ADR-005. Phase 0 source is trivial so size-limit will report very small bundles — set limits to the eventual PRD §6.1 targets so any future regression is caught, not the current tiny baseline.

### Relevant Files

- `packages/markmd/size-limit.json` — limits per entrypoint.
- `package.json` (root) — `size`, `publint`, `attw` scripts.

### Dependent Files

- `packages/markmd/dist/*` (task_04 output) — measured by size-limit.
- `ci.yml` (task_10) runs all three gates.
- `release.yml` / `prepublishOnly` (task_11) chains them before publish.

### Related ADRs

- [ADR-002: Build toolchain — tsup for dual ESM/CJS + d.ts + CSS](adrs/adr-002.md) — dual types validation by attw.
- [ADR-005: Quality gates — ESLint flat + Prettier + Husky + size-limit + Codecov](adrs/adr-005.md) — bundle size enforcement.

## Deliverables

- `size-limit.json` committed.
- Root scripts `size`, `publint`, `attw`.
- Unit tests asserting config shape **(REQUIRED)**.
- Integration tests asserting each gate runs against built artifacts **(REQUIRED)**.

## Tests

- Unit tests:
  - [x] `size-limit.json` declares at least one entry pointing at `dist/index.mjs` with a `limit` field in KB.
  - [x] `size-limit.json` declares an entry for `dist/plugins/index.mjs` with limit `<10 KB`.
  - [x] Root `package.json` exposes scripts `size`, `publint`, `attw`.
- Integration tests:
  - [x] `pnpm size` on built `dist/` exits 0 (placeholder is far below limits).
  - [x] `pnpm publint` on built `dist/` exits 0 with zero errors.
  - [x] `pnpm attw --pack packages/markmd` exits 0 with no resolution errors for ESM, CJS, or types.
  - [x] Artificially bloating `dist/index.mjs` to >80KB makes `pnpm size` exit non-zero (run via a temp fixture, then revert).
- Test coverage target: >=80%
- All tests must pass

## Success Criteria

- All tests passing
- Test coverage >=80%
- All three gates pass on current build.
- Each gate blocks a known-bad input (oversized bundle, malformed exports map, missing `.d.cts`).
