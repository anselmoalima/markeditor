---
status: pending
title: A11y audit + perf bench + docs + examples + publish v1.0.0
type: docs
complexity: critical
dependencies:
  - task_07
  - task_08
  - task_09
  - task_10
  - task_11
  - task_12
---

# Task 13: A11y audit + perf bench + docs + examples + publish v1.0.0

## Overview

Complete the full v1.0.0 Definition of Done: zero WCAG 2.1 AA violations (jest-axe + Playwright), bench regression gate established, `size-limit` all gates green, README complete, 4+ examples in `examples/`, optional Storybook, final `publint` + `attw` + type-test pass, and a dry-run `changeset publish` to confirm the NPM artifact is well-formed. This task is the gate to shipping v1.0.0.

<critical>
- ALWAYS READ the PRD and TechSpec before starting
- REFERENCE TECHSPEC for implementation details — do not duplicate here
- FOCUS ON "WHAT" — describe what needs to be accomplished, not how
- MINIMIZE CODE — show code only to illustrate current structure or problem areas
- TESTS REQUIRED — every task MUST include tests in deliverables
</critical>

<requirements>
- MUST run jest-axe on every primary surface: edit mode, preview mode, toolbar, each modal (InsertLink, InsertImage, InsertTable, ShortcutsHelp), each theme variant (light, dark, custom) — zero violations per surface
- MUST ensure `@axe-core/playwright` scans in task_12 E2E pass for all 15 scenarios before marking this task complete
- MUST confirm `tests/bench/baseline.json` is committed and `vitest bench` passes the 1.2× regression gate for 10k-line document
- MUST run `pnpm --filter bob-editor size` and confirm all `size-limit` entries pass: core without Monaco < 80 KB gzip, full bundle with all lazy chunks < 500 KB gzip
- MUST complete `packages/bob-editor/README.md` with: install instructions, quick-start code, all prop documentation, plugin API, keyboard shortcut table, theme reference (all `--mde-*` tokens), migration guide (from Phase 0 stub), Bundler recipes section (Vite, Next.js, Remix Monaco worker setup)
- MUST write at least 4 example files in `examples/`: `basic.tsx` (controlled mode), `uncontrolled.tsx` (defaultValue + storage), `custom-plugins.tsx` (opt-in plugins), `custom-theme.tsx` (BobmdTheme object)
- MUST run `pnpm --filter bob-editor publint` with zero warnings
- MUST run `pnpm --filter bob-editor attw` with zero errors
- MUST run `pnpm --filter bob-editor typecheck` (tsc --noEmit) with zero errors
- MUST run `pnpm --filter bob-editor lint` with zero warnings (--max-warnings 0)
- MUST run `pnpm -r build` and confirm `dist/` artifacts are correct: ESM, CJS, d.ts, styles.css, all plugin subpaths
- MUST run `npm pack --dry-run` from `packages/bob-editor/` and verify the tarball contents against the `files` whitelist
- MUST create a final Changeset entry for v1.0.0 and run `changeset version` to bump
- SHOULD set up Storybook in `apps/docs/` with stories for `<BobEditor>` in each theme, each mode, and with each built-in plugin (optional per PRD Phase 6)
- MUST NOT publish to NPM from local — the GitHub Actions release workflow (task_01) handles publication
</requirements>

## Subtasks

- [ ] 13.1 Run jest-axe audit on all surfaces; fix any remaining violations
- [ ] 13.2 Confirm Playwright a11y scans pass on all 15 routes (delegate to task_12 results)
- [ ] 13.3 Run `vitest bench` and confirm 1.2× regression gate passes; commit/update `baseline.json` if needed
- [ ] 13.4 Run `pnpm --filter bob-editor size` and confirm all size-limit entries pass
- [ ] 13.5 Write complete `packages/bob-editor/README.md`
- [ ] 13.6 Write `examples/basic.tsx`, `uncontrolled.tsx`, `custom-plugins.tsx`, `custom-theme.tsx`
- [ ] 13.7 Run `publint` + `attw` + `typecheck` + `lint` — fix all remaining issues
- [ ] 13.8 Run `npm pack --dry-run` and verify tarball contents
- [ ] 13.9 Create v1.0.0 Changeset entry + run `changeset version`
- [ ] 13.10 (Optional) Set up Storybook in `apps/docs/`

## Implementation Details

See PRD §12 (Definition of Done) for the full checklist. TechSpec 'Monitoring and Observability' → Dev-mode warnings section for what should appear in dev mode but not production.

Key constraints:
- jest-axe audit: run `axe(container)` after mounting `<BobEditor>` with the relevant surface active; `toHaveNoViolations()` must pass before proceeding.
- Bench gate: `vitest bench` uses `baseline.json`; if CI environment produces results >1.2× baseline, fail. Update baseline.json when intentional perf improvements land (commit explicitly).
- `README.md` Bundler recipes: must include a working `vite.config.ts` snippet that resolves Monaco workers; must include a Next.js App Router snippet using `dynamic(() => import('bob-editor'), { ssr: false })`.
- `npm pack --dry-run`: output must contain `dist/index.js`, `dist/index.cjs`, `dist/index.d.ts`, `dist/styles.css`, `README.md`, `CHANGELOG.md`, `LICENSE`; must NOT contain `src/`, `tests/`, `node_modules/`.
- Root `README.md` should also be updated with final badges and links.
- Storybook: if time allows, add stories for at minimum: `<BobEditor>` in light + dark theme, edit + preview mode, with math plugin active.

### Relevant Files

- `packages/bob-editor/README.md` — update (complete)
- `packages/bob-editor/CHANGELOG.md` — generated by `changeset version`
- `examples/basic.tsx` — create
- `examples/uncontrolled.tsx` — create
- `examples/custom-plugins.tsx` — create
- `examples/custom-theme.tsx` — create
- `packages/bob-editor/tests/bench/baseline.json` (task_09) — update if needed
- `README.md` (root) — update with final badges
- `apps/docs/` — create (optional Storybook)
- All existing test files — remediate any a11y violations found

### Dependent Files

- All `packages/bob-editor/src/` files — must pass all quality gates
- `apps/playground/` (task_12) — E2E must be green before this task completes

### Related ADRs

- [ADR-001: pnpm + Turborepo monorepo with tsup dual ESM/CJS build](adrs/adr-001.md) — Confirms publish pipeline and tarball requirements
- [ADR-009: TDD pyramid with vitest bench regression gate and Changesets-backed provenance release](adrs/adr-009.md) — Defines coverage gates, bench gate, and Changesets release process this task finalizes

## Deliverables

- Complete `packages/bob-editor/README.md`
- `examples/` directory with 4+ example files
- jest-axe zero violations on all surfaces
- `vitest bench` passing 1.2× gate with committed `baseline.json`
- `size-limit` all entries green
- `publint` + `attw` zero warnings
- `npm pack --dry-run` tarball contents verified
- v1.0.0 Changeset entry + `changeset version` applied
- (Optional) Storybook in `apps/docs/`
- Final CI validation tests with 80%+ coverage **(REQUIRED)**

## Tests

- Unit tests:
  - [ ] jest-axe: `<BobEditor mode="edit">` — `expect(container).toHaveNoViolations()`
  - [ ] jest-axe: `<BobEditor mode="preview">` — `expect(container).toHaveNoViolations()`
  - [ ] jest-axe: `<BobEditor>` with toolbar visible — `expect(container).toHaveNoViolations()`
  - [ ] jest-axe: InsertLink modal open — `expect(container).toHaveNoViolations()`
  - [ ] jest-axe: InsertImage modal open — `expect(container).toHaveNoViolations()`
  - [ ] jest-axe: InsertTable modal open — `expect(container).toHaveNoViolations()`
  - [ ] jest-axe: ShortcutsHelp modal open — `expect(container).toHaveNoViolations()`
  - [ ] jest-axe: dark theme active — `expect(container).toHaveNoViolations()`
  - [ ] jest-axe: custom `BobmdTheme` active — `expect(container).toHaveNoViolations()`
  - [ ] `npm pack --dry-run` output contains `dist/index.js`, `dist/index.cjs`, `dist/styles.css`, `README.md`, `LICENSE`, `CHANGELOG.md`
  - [ ] `npm pack --dry-run` output does NOT contain `src/` or `tests/` paths
- Integration tests:
  - [ ] `pnpm --filter bob-editor size` exits 0 (size-limit gate)
  - [ ] `pnpm --filter bob-editor typecheck` exits 0 with zero errors
  - [ ] `pnpm --filter bob-editor lint` exits 0 with zero warnings
  - [ ] `pnpm --filter bob-editor publint` exits 0
  - [ ] `pnpm --filter bob-editor attw` exits 0
  - [ ] `vitest bench` — 10k-line fixture result ≤ 1.2× baseline value
- Test coverage target: >=80%
- All tests must pass

## Success Criteria

- All tests passing
- Test coverage >=80%
- Zero jest-axe violations across all surfaces and themes
- Zero `@axe-core/playwright` violations across all 15 Playwright scenarios (task_12 green)
- `size-limit` all entries green (core < 80 KB, full < 500 KB)
- `publint` + `attw` zero warnings
- `tsc --noEmit` zero errors
- `eslint --max-warnings 0` clean
- `npm pack --dry-run` tarball is correct
- v1.0.0 Changeset entry created and `changeset version` applied
- All 17 Definition of Done items from PRD §12 verified and checked off
