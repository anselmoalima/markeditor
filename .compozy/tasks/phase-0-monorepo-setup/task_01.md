---
status: completed
title: Repo skeleton + pnpm workspaces
type: infra
complexity: low
dependencies: []
---

# Task 01: Repo skeleton + pnpm workspaces

## Overview

Bootstrap the empty repo into a pnpm-workspace monorepo with the root files every later task assumes (root `package.json`, `pnpm-workspace.yaml`, `.gitignore`, `.editorconfig`, `.nvmrc`, `LICENSE`). This is the entry point that unlocks every other Phase 0 task; nothing else can run until pnpm recognizes the workspace layout and Corepack pins the package manager.

<critical>
- ALWAYS READ the PRD and TechSpec before starting
- REFERENCE TECHSPEC for implementation details — do not duplicate here
- FOCUS ON "WHAT" — describe what needs to be accomplished, not how
- MINIMIZE CODE — show code only to illustrate current structure or problem areas
- TESTS REQUIRED — every task MUST include tests in deliverables
</critical>

<requirements>
- Root `package.json` MUST set `"private": true`, `"packageManager": "pnpm@9.x.x"`, `"engines": { "node": ">=18.18" }`, and `"type": "module"`.
- `pnpm-workspace.yaml` MUST declare workspaces `packages/*` and `apps/*`.
- `.gitignore` MUST exclude `node_modules`, `dist`, `coverage`, `.turbo`, `playwright-report`, `test-results`, `.changeset/.cache`, and OS files.
- `LICENSE` MUST be MIT under the project author.
- `.nvmrc` MUST pin Node 20 (LTS aligned with PRD matrix midpoint).
- `.editorconfig` MUST enforce LF, UTF-8, 2-space indent, trim trailing whitespace.
- `pnpm install` from a clean clone MUST succeed with zero warnings.
</requirements>

## Subtasks

- [x] 1.1 Create root `package.json` with private flag, packageManager pin, engines, and shared scripts placeholders.
- [x] 1.2 Create `pnpm-workspace.yaml` declaring `packages/*` and `apps/*`.
- [x] 1.3 Create `.gitignore`, `.editorconfig`, `.nvmrc`, `LICENSE` (MIT).
- [x] 1.4 Run `pnpm install` and commit the lockfile.
- [x] 1.5 Add a CI-callable smoke check that verifies workspace discovery (`pnpm -r --shell-mode exec true` or `pnpm m ls --json`).

## Implementation Details

Reference TechSpec sections "System Architecture → Component Overview" and "Build Order step 1". Root `package.json` exports map and library-specific fields belong in `packages/markeditor` (task_04), not here. The root must remain minimal — no library dependencies, only dev tooling shared across workspaces in later tasks.

### Relevant Files

- `package.json` — root manifest, private, sets packageManager + engines.
- `pnpm-workspace.yaml` — workspace discovery.
- `.gitignore`, `.editorconfig`, `.nvmrc`, `LICENSE` — base hygiene files.

### Dependent Files

- Every later workspace (`packages/markeditor`, `apps/playground`) depends on workspace discovery working.
- `turbo.json` (task_02), `eslint.config.js` (task_03), GH Actions workflows (task_10/11) all assume Corepack-provisioned pnpm.

### Related ADRs

- [ADR-001: Monorepo with pnpm workspaces + Turborepo](adrs/adr-001.md) — establishes pnpm + workspace globs chosen here.

## Deliverables

- Committed root files: `package.json`, `pnpm-workspace.yaml`, `.gitignore`, `.editorconfig`, `.nvmrc`, `LICENSE`, `pnpm-lock.yaml`.
- Smoke check script in root `package.json` (e.g., `"check:workspaces": "pnpm m ls --json > /dev/null"`).
- Shell/CI unit test asserting workspace discovery **(REQUIRED)**.
- Integration check: clean clone + `pnpm install --frozen-lockfile` exits 0 **(REQUIRED)**.

## Tests

- Unit tests:
  - [x] `pnpm m ls --json` returns valid JSON containing exactly one root and zero workspaces yet (workspaces added in later tasks).
  - [x] Running `pnpm install --frozen-lockfile` on the committed lockfile exits 0 with no warnings.
  - [x] `node -e "require('./package.json').packageManager.startsWith('pnpm@9')"` exits 0.
- Integration tests:
  - [x] Fresh clone in temp dir + Corepack-enabled shell: `corepack pnpm install` succeeds without prompting for pnpm download confirmation.
- Test coverage target: >=80% (script coverage of the smoke check)
- All tests must pass

## Success Criteria

- All tests passing
- Test coverage >=80%
- `pnpm install` from clean clone exits 0 with no warnings on Node 18.18, 20, 22.
- Root manifest validates against `publint` schema for private package fields.
