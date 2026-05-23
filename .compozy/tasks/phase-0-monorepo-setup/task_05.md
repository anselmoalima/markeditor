---
status: completed
title: Vitest config + smoke unit + type tests
type: test
complexity: medium
dependencies:
  - task_04
---

# Task 05: Vitest config + smoke unit + type tests

## Overview

Wire Vitest (jsdom + v8 coverage) into `packages/markeditor`, add the smoke unit test for the `MarkEditor` placeholder, and add the type-level test that pins the public API shape (`MarkEditorProps`, `MarkEditorRef`, `MarkMode`). This establishes the TDD loop and the public-API regression guard from day one.

<critical>
- ALWAYS READ the PRD and TechSpec before starting
- REFERENCE TECHSPEC for implementation details — do not duplicate here
- FOCUS ON "WHAT" — describe what needs to be accomplished, not how
- MINIMIZE CODE — show code only to illustrate current structure or problem areas
- TESTS REQUIRED — every task MUST include tests in deliverables
</critical>

<requirements>
- `vitest.config.ts` MUST set `environment: 'jsdom'`, `coverage.provider: 'v8'`, `coverage.thresholds: { lines: 80, branches: 75, functions: 80, statements: 80 }`.
- `coverage.include` MUST be scoped to `src/**` and exclude `src/styles/**`, `src/**/index.ts` re-exports, and test fixtures.
- A `tests/setup.ts` MUST import `@testing-library/jest-dom`.
- Type-level tests MUST use `expect-type` against `MarkEditorProps`, `MarkEditorRef`, `MarkMode`.
- Smoke unit test MUST render `<MarkEditor />` via `@testing-library/react` and assert presence of `data-testid="mark-editor"`.
- `pnpm --filter markeditor test --run` MUST exit 0 with coverage report generated under `coverage/`.
</requirements>

## Subtasks

- [x] 5.1 Install Vitest, @testing-library/react, @testing-library/jest-dom, jsdom, @vitest/coverage-v8, expect-type as workspace devDeps in `packages/markeditor`.
- [x] 5.2 Add `packages/markeditor/vitest.config.ts` and `tests/setup.ts`.
- [x] 5.3 Add `tests/unit/MarkEditor.test.tsx` smoke test.
- [x] 5.4 Add `tests/type/props.test-d.ts` and a separate `tsconfig.types-test.json` invoked by `pnpm typecheck:types-test`.
- [x] 5.5 Wire `packages/markeditor/package.json` scripts `test`, `test:watch`, `test:coverage`, `typecheck`, `typecheck:types-test` into Turbo.

## Implementation Details

Reference TechSpec sections "Testing Approach → Unit Tests" and "Integration Tests" (type-level subsection) and ADR-003. Keep coverage `include` narrow — Phase 0 source is small; an unscoped `include` risks artificial coverage gaps.

### Relevant Files

- `packages/markeditor/vitest.config.ts` — main runner config.
- `packages/markeditor/tests/setup.ts` — jest-dom import.
- `packages/markeditor/tests/unit/MarkEditor.test.tsx` — smoke render test.
- `packages/markeditor/tests/type/props.test-d.ts` — type-level assertions.
- `packages/markeditor/tsconfig.types-test.json` — strict typecheck for `.test-d.ts` files.

### Dependent Files

- `packages/markeditor/src/MarkEditor.tsx`, `src/types.ts`, `src/index.ts` — under test.
- `ci.yml` (task_10) runs `pnpm -r test` and uploads coverage.

### Related ADRs

- [ADR-003: Test stack — Vitest (jsdom) + Playwright + axe-core + MSW](adrs/adr-003.md) — Vitest stack rationale.

## Deliverables

- Vitest config + setup file + smoke unit test + type-level test.
- Updated `packages/markeditor/package.json` test scripts.
- Coverage report generated at `packages/markeditor/coverage/`.
- Unit tests with 80%+ coverage **(REQUIRED)**.
- Integration tests for type-level API stability **(REQUIRED)**.

## Tests

- Unit tests:
  - [x] `<MarkEditor />` renders an element with `data-testid="mark-editor"`.
  - [x] `<MarkEditor className="foo" />` applies the className to the rendered element.
  - [x] `<MarkEditor style={{ height: 100 }} />` applies the inline style.
  - [x] Ref forwarding: `ref.current.getValue()` returns `""` for an editor mounted with no `defaultValue`.
  - [x] Ref forwarding: `ref.current.setValue("x"); ref.current.getValue()` returns `"x"`.
- Integration tests:
  - [x] Type-level: `expectTypeOf<MarkEditorProps>().toMatchTypeOf<{ value?: string; mode?: 'edit' | 'preview' }>()` compiles.
  - [x] Type-level: removing `MarkMode` from the union or renaming `MarkEditorRef.getValue` fails `tsc --noEmit` on `tsconfig.types-test.json`.
  - [x] `pnpm --filter markeditor test:coverage` generates `coverage/coverage-final.json` and meets thresholds.
- Test coverage target: >=80%
- All tests must pass

## Success Criteria

- All tests passing
- Test coverage >=80% (lines), >=75% (branches)
- Type-level tests fail compilation when public API shape changes.
- Coverage artifacts produced and ingestible by Codecov (task_10).
