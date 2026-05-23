---
status: completed
title: packages/markmd skeleton + tsup dual build
type: infra
complexity: medium
dependencies:
  - task_02
---

# Task 04: packages/markmd skeleton + tsup dual build

## Overview

Create the publishable workspace `packages/markmd` with the Phase 0 source shell (`MarkmdEditor` placeholder, `types.ts`, `index.ts`, bundled CSS), a complete `package.json` with `exports` map / `files` / `sideEffects` / `peerDependencies`, and a `tsup.config.ts` that produces ESM + CJS + `.d.ts` + `.d.cts` + CSS. After this task `pnpm --filter markmd build` MUST produce a `dist/` directory consumable by Node and Vite.

<critical>
- ALWAYS READ the PRD and TechSpec before starting
- REFERENCE TECHSPEC for implementation details — do not duplicate here
- FOCUS ON "WHAT" — describe what needs to be accomplished, not how
- MINIMIZE CODE — show code only to illustrate current structure or problem areas
- TESTS REQUIRED — every task MUST include tests in deliverables
</critical>

<requirements>
- Source files MUST follow TechSpec "Core Interfaces" — `MarkmdEditorProps`, `MarkmdEditorRef`, `MarkmdMode` exported from `src/types.ts` and re-exported from `src/index.ts`.
- `MarkmdEditor` MUST be a `forwardRef` placeholder rendering `<div data-testid="markmd-editor" />`. No Monaco, no pipeline yet.
- `package.json` MUST set `name: "markmd"`, `type: "module"`, `sideEffects: ["**/*.css"]`, `peerDependencies` React 18 || 19, `engines.node: ">=18.18"`, `files: ["dist", "README.md", "CHANGELOG.md", "LICENSE"]`.
- `exports` map MUST cover `.`, `./styles`, `./plugins`, `./plugins/*`, `./package.json` with `types`/`import`/`require` triples where applicable.
- `tsup.config.ts` MUST produce ESM (`.mjs`) + CJS (`.cjs`) + `.d.ts` + `.d.cts` + bundled CSS, with `splitting: true` (ESM), `treeshake: true`, externals for `react`, `react-dom`, `monaco-editor`, `katex`, `mermaid`.
- Build output MUST satisfy `publint` and `@arethetypeswrong/cli` with zero errors (warnings checked in task_06).
</requirements>

## Subtasks

- [x] 4.1 Scaffold `packages/markmd/` with `src/`, `tests/` placeholder, `package.json`, `tsconfig.json` extending base.
- [x] 4.2 Implement `src/types.ts`, `src/index.ts`, `src/MarkmdEditor.tsx`, `src/styles/index.css` per TechSpec Core Interfaces.
- [x] 4.3 Add `tsup.config.ts` producing dual ESM/CJS + d.ts + CSS bundle.
- [x] 4.4 Configure `exports` map with subpaths; add a `src/plugins/index.ts` stub so the subpath resolves cleanly.
- [x] 4.5 Verify `pnpm --filter markmd build` produces `dist/index.mjs`, `dist/index.cjs`, `dist/index.d.ts`, `dist/index.d.cts`, `dist/styles.css`, `dist/plugins/index.*`.

## Implementation Details

Reference TechSpec sections "Core Interfaces", "Data Models" (exports map), and ADR-002. Do NOT implement editor logic — placeholder shell only. CSS file can be empty (or single `:root` comment) but must build and be importable.

### Relevant Files

- `packages/markmd/package.json` — manifest with exports/files/sideEffects.
- `packages/markmd/tsup.config.ts` — build config.
- `packages/markmd/tsconfig.json` — extends `../../tsconfig.base.json`, sets `outDir: "dist"`.
- `packages/markmd/src/index.ts`, `src/types.ts`, `src/MarkmdEditor.tsx`, `src/styles/index.css`, `src/plugins/index.ts`.

### Dependent Files

- `apps/playground` (task_07) imports `markmd` via `workspace:*`.
- Vitest config (task_05) targets `packages/markmd/tests`.
- `size-limit.json` (task_06) measures `dist/index.mjs`.

### Related ADRs

- [ADR-002: Build toolchain — tsup for dual ESM/CJS + d.ts + CSS](adrs/adr-002.md) — tsup config decisions.

## Deliverables

- `packages/markmd/` source skeleton + build config.
- `pnpm --filter markmd build` produces a complete `dist/` tree.
- Unit tests confirming exported symbols are reachable from built artifacts **(REQUIRED)**.
- Integration tests asserting both ESM and CJS resolve correctly **(REQUIRED)**.

## Tests

- Unit tests:
  - [x] `import { MarkmdEditor, MarkmdEditorProps, MarkmdEditorRef, MarkmdMode } from 'markmd'` (sourced from `src/index.ts`) resolves at TS level.
  - [x] `MarkmdEditor` is a `forwardRef` component (has `$$typeof` ForwardRef tag).
  - [x] Rendering `<MarkmdEditor />` with `@testing-library/react` produces an element with `data-testid="markmd-editor"`.
  - [x] Calling `ref.current.getValue()` on a mounted editor returns the initial `defaultValue` or empty string.
- Integration tests:
  - [x] After build, `node --input-type=module -e "import('./packages/markmd/dist/index.mjs').then(m => process.exit(m.MarkmdEditor ? 0 : 1))"` exits 0.
  - [x] After build, `node -e "const m = require('./packages/markmd/dist/index.cjs'); process.exit(m.MarkmdEditor ? 0 : 1)"` exits 0.
  - [x] `dist/styles.css` is non-empty and resolvable via the `./styles` subpath.
- Test coverage target: >=80%
- All tests must pass

## Success Criteria

- All tests passing
- Test coverage >=80%
- `pnpm --filter markmd build` exits 0 and produces ESM + CJS + types (`.d.ts` + `.d.cts`) + CSS.
- Built artifacts importable in both ESM and CJS Node entry points.
