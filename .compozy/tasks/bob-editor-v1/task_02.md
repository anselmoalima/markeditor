---
status: pending
title: packages/bob-editor scaffold — tsup, exports map, apps/playground
type: infra
complexity: high
dependencies:
  - task_01
---

# Task 2: packages/bob-editor scaffold — tsup, exports map, apps/playground

## Overview

Create the publish-ready scaffold for `packages/bob-editor` and the Vite playground consumer. This task establishes the build pipeline (tsup dual ESM/CJS + d.ts + CSS), the complete `exports` map, all quality-gate configs, and a working playground that can consume the library via `workspace:*`. The output is a buildable (empty) library and a running playground — no feature code yet.

<critical>
- ALWAYS READ the PRD and TechSpec before starting
- REFERENCE TECHSPEC for implementation details — do not duplicate here
- FOCUS ON "WHAT" — describe what needs to be accomplished, not how
- MINIMIZE CODE — show code only to illustrate current structure or problem areas
- TESTS REQUIRED — every task MUST include tests in deliverables
</critical>

<requirements>
- MUST create `packages/bob-editor/package.json` with `name: "bob-editor"` (exact), `license: "MIT"`, correct `exports` map (`.`, `./styles`, `./styles.css`, `./plugins`, `./plugins/*`, `./package.json`), `peerDependencies: { "react": "^18 || ^19", "react-dom": "^18 || ^19" }`, `sideEffects: ["**/*.css"]`, `files: ["dist", "README.md", "CHANGELOG.md", "LICENSE"]`
- MUST create `packages/bob-editor/tsup.config.ts` producing dual ESM + CJS + `.d.ts` + `dist/styles.css`; declare separate entry points for each `./plugins/*` subpath so each is independently tree-shakable
- MUST create `packages/bob-editor/vitest.config.ts` targeting jsdom environment with Vitest v8 coverage thresholds ≥80% lines / ≥75% branches
- MUST create `packages/bob-editor/size-limit.json` with limits: core without Monaco < 80 KB gzip; core with all lazy chunks < 500 KB gzip (see TechSpec Performance targets)
- MUST create stub `packages/bob-editor/src/index.ts` that re-exports placeholder types; this file will grow in task_03
- MUST create stub `packages/bob-editor/src/types.ts` with placeholder (populated in task_03)
- MUST create `apps/playground/package.json` with `"bob-editor": "workspace:*"` dependency and Vite + React devDeps
- MUST create `apps/playground/vite.config.ts` with the Monaco worker recipe (see TechSpec Known Risks) and React plugin
- MUST create `apps/playground/src/main.tsx` + `apps/playground/src/App.tsx` placeholder that imports and renders `<div>bob-editor playground</div>`
- MUST configure `prepublishOnly` script: `build && test && typecheck && lint && publint && attw && size`
- SHOULD add `packages/bob-editor/publint.config.js` and `.attw.json` (or inline in package scripts) for quality-gate configs
- MUST NOT add any library feature code — only scaffold
</requirements>

## Subtasks

- [ ] 2.1 Create `packages/bob-editor/package.json` with all publish-ready fields
- [ ] 2.2 Create `packages/bob-editor/tsup.config.ts` with dual ESM/CJS + CSS + subpath entries
- [ ] 2.3 Create `packages/bob-editor/vitest.config.ts` + `size-limit.json` + quality-gate configs
- [ ] 2.4 Create stub `src/index.ts` and `src/types.ts` (placeholders only)
- [ ] 2.5 Create `apps/playground/` scaffold (package.json, vite.config.ts, main.tsx, App.tsx)
- [ ] 2.6 Verify build chain: `pnpm --filter bob-editor build` produces `dist/` with ESM + CJS + d.ts + CSS
- [ ] 2.7 Write scaffold validation tests (see Tests section)

## Implementation Details

See TechSpec 'Development Sequencing' → Build Order steps 2–3, ADR-001 'Implementation Notes' for the exact `tsup.config.ts` entry list.

Key constraints from TechSpec:
- `exports` map must include both `import` (ESM) and `require` (CJS) conditions for `.` and each plugin subpath.
- `./styles` and `./styles.css` both resolve to `dist/styles.css`.
- `prepublishOnly` runs in this exact order; skipping steps is not allowed (CLAUDE.md §4).
- Playground `vite.config.ts` must include the `optimizeDeps.exclude: ['monaco-editor']` + `worker` script configuration to avoid bundling Monaco workers into the main chunk.

### Relevant Files

- `packages/bob-editor/package.json` — publish manifest
- `packages/bob-editor/tsup.config.ts` — build config
- `packages/bob-editor/vitest.config.ts` — test config
- `packages/bob-editor/size-limit.json` — bundle size gates
- `packages/bob-editor/src/index.ts` — public entry (stub)
- `packages/bob-editor/src/types.ts` — public types (stub)
- `apps/playground/package.json` — playground dependencies
- `apps/playground/vite.config.ts` — playground build + Monaco worker config
- `apps/playground/src/main.tsx` — Vite entry
- `apps/playground/src/App.tsx` — placeholder component

### Dependent Files

- `packages/bob-editor/src/types.ts` (task_03) — will be fully populated
- `packages/bob-editor/src/index.ts` (task_03) — will export all public symbols
- All component files (task_07+) — depend on tsup config being correct

### Related ADRs

- [ADR-001: pnpm + Turborepo monorepo with tsup dual ESM/CJS build](adrs/adr-001.md) — Defines tsup entry points, exports map structure, and Changesets release process

## Deliverables

- `packages/bob-editor/package.json` with complete publish configuration
- `packages/bob-editor/tsup.config.ts` producing correct dual-output + CSS
- `packages/bob-editor/vitest.config.ts` with coverage thresholds
- `packages/bob-editor/size-limit.json` with < 80 KB / < 500 KB limits
- Stub `src/index.ts` and `src/types.ts`
- `apps/playground/` scaffold with Vite + workspace consumer
- Scaffold validation tests with 80%+ coverage **(REQUIRED)**

## Tests

- Unit tests:
  - [ ] `packages/bob-editor/package.json`: `name === "bob-editor"`, `sideEffects` includes `"**/*.css"`, `files` whitelist correct, `exports["."]` has `import` + `require` + `types` conditions
  - [ ] `packages/bob-editor/package.json`: `exports["./styles"]` and `exports["./styles.css"]` both resolve to `"./dist/styles.css"`
  - [ ] `vitest.config.ts`: coverage thresholds are lines ≥80, branches ≥75
  - [ ] `size-limit.json`: contains entries for core-without-monaco < 81920 bytes gzip and full-bundle < 512000 bytes
- Integration tests:
  - [ ] `pnpm --filter bob-editor build` exits 0 and produces `dist/index.js` (ESM), `dist/index.cjs` (CJS), `dist/index.d.ts`, `dist/styles.css`
  - [ ] `pnpm --filter playground dev --port 5173` starts without error (smoke-start then kill)
  - [ ] `publint packages/bob-editor` exits 0 with zero warnings against the stub dist
  - [ ] `attw --pack packages/bob-editor` exits 0 with zero errors
- Test coverage target: >=80%
- All tests must pass

## Success Criteria

- All tests passing
- Test coverage >=80%
- `pnpm --filter bob-editor build` produces all required dist artifacts
- `publint` + `attw` report zero warnings against the dist
- Playground dev server starts and renders the placeholder
- Package name is exactly `bob-editor` — not `markmd`, `markeditor`, or any other variant
