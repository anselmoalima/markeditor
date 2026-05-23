---
status: completed
title: apps/playground Vite skeleton consuming workspace lib
type: infra
complexity: medium
dependencies:
  - task_04
---

# Task 07: apps/playground Vite skeleton consuming workspace lib

## Overview

Scaffold `apps/playground` as a private Vite + React app that imports `markmd` via `"markmd": "workspace:*"`. This proves the workspace symlink works end-to-end and gives Playwright a target to drive in task_08. The app is never published — it is a demo / smoke harness.

<critical>
- ALWAYS READ the PRD and TechSpec before starting
- REFERENCE TECHSPEC for implementation details — do not duplicate here
- FOCUS ON "WHAT" — describe what needs to be accomplished, not how
- MINIMIZE CODE — show code only to illustrate current structure or problem areas
- TESTS REQUIRED — every task MUST include tests in deliverables
</critical>

<requirements>
- `apps/playground/package.json` MUST set `"private": true`, `"type": "module"`, and `"markmd": "workspace:*"` in dependencies.
- App MUST be Vite + React 18 (or 19, configurable later in CI matrix); single `index.html`, `src/main.tsx`, `src/App.tsx`.
- `src/App.tsx` MUST render `<MarkmdEditor />` imported from `'markmd'`, with `import 'markmd/styles'`.
- `pnpm --filter playground dev` MUST start a dev server.
- `pnpm --filter playground build` MUST produce a production bundle under `apps/playground/dist/`.
- `pnpm --filter playground preview` MUST serve the production bundle.
- App MUST NOT introduce Tailwind, React Router, or any other framework-level deps in Phase 0.
</requirements>

## Subtasks

- [x] 7.1 Scaffold `apps/playground` with `package.json`, `vite.config.ts`, `tsconfig.json` (extends base), `index.html`.
- [x] 7.2 Implement `src/main.tsx` mounting `<App />` and `src/App.tsx` rendering `<MarkmdEditor />`.
- [x] 7.3 Import `markmd/styles` from `App.tsx`.
- [x] 7.4 Verify dev/build/preview commands all work locally.
- [x] 7.5 Wire playground tasks into Turbo (`build`, `preview`) with `dependsOn: ["markmd#build"]`.

## Implementation Details

Reference TechSpec sections "Component Overview" (apps/playground row) and "Build Order step 10". Do not add demo controls, theme switcher, or showcase content here — Phase 1+ owns that. Phase 0 playground is the minimum viable mount.

### Relevant Files

- `apps/playground/package.json` — workspace dep on `markmd`.
- `apps/playground/vite.config.ts` — Vite config (default React plugin).
- `apps/playground/tsconfig.json` — extends base.
- `apps/playground/index.html`, `src/main.tsx`, `src/App.tsx`.

### Dependent Files

- `packages/markmd` (task_04) is consumed via symlink.
- `apps/playground/playwright.config.ts` and `e2e/smoke.spec.ts` (task_08) target this app.
- `ci.yml` (task_10) builds the playground as part of the smoke matrix.

### Related ADRs

- [ADR-001: Monorepo with pnpm workspaces + Turborepo](adrs/adr-001.md) — workspace consumption pattern.

## Deliverables

- `apps/playground/` workspace fully scaffolded and runnable.
- Updated `turbo.json` `dependsOn` for `playground#build` → `markmd#build`.
- Unit tests for `App.tsx` mount **(REQUIRED)**.
- Integration test: production build artifact loads and renders the editor **(REQUIRED)**.

## Tests

- Unit tests:
  - [x] Rendering `<App />` via `@testing-library/react` shows an element with `data-testid="markmd-editor"`.
  - [x] `App.tsx` imports `markmd/styles` (asserted via spying on Vite import graph or static grep test).
  - [x] `apps/playground/package.json` declares `"markmd": "workspace:*"` and is marked `private: true`.
- Integration tests:
  - [x] `pnpm --filter playground build` exits 0 and produces `dist/index.html`.
  - [x] `pnpm --filter playground preview` serves the built bundle on a free port and responds 200 to `GET /`.
  - [x] Symlink validation: `node -e "require.resolve('markmd', { paths: ['apps/playground'] })"` resolves to the workspace package, not a hoisted copy.
- Test coverage target: >=80%
- All tests must pass

## Success Criteria

- All tests passing
- Test coverage >=80%
- Dev, build, and preview commands all work locally and in CI.
- Playground bundle correctly resolves the workspace `markmd` package.
