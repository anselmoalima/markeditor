---
status: pending
title: Vitest config + smoke unit + type tests
type: test
complexity: medium
dependencies:
  - task_04
---

# Task 05: Vitest config + smoke unit + type tests

## Overview
Wire Vitest (jsdom + v8 coverage) into `packages/markmd`, add the smoke unit test for the `MarkmdEditor` placeholder, and add the type-level test that pins the public API shape (`MarkmdEditorProps`, `MarkmdEditorRef`, `MarkmdMode`). This establishes the TDD loop and the public-API regression guard from day one.

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
- Type-level tests MUST use `expect-type` against `MarkmdEditorProps`, `MarkmdEditorRef`, `MarkmdMode`.
- Smoke unit test MUST render `<MarkmdEditor />` via `@testing-library/react` and assert presence of `data-testid="markmd-editor"`.
- `pnpm --filter markmd test --run` MUST exit 0 with coverage report generated under `coverage/`.
</requirements>

## Subtasks
- [ ] 5.1 Install Vitest, @testing-library/react, @testing-library/jest-dom, jsdom, @vitest/coverage-v8, expect-type as workspace devDeps in `packages/markmd`.
- [ ] 5.2 Add `packages/markmd/vitest.config.ts` and `tests/setup.ts`.
- [ ] 5.3 Add `tests/unit/MarkmdEditor.test.tsx` smoke test.
- [ ] 5.4 Add `tests/type/props.test-d.ts` and a separate `tsconfig.types-test.json` invoked by `pnpm typecheck:types-test`.
- [ ] 5.5 Wire `packages/markmd/package.json` scripts `test`, `test:watch`, `test:coverage`, `typecheck`, `typecheck:types-test` into Turbo.

## Implementation Details
Reference TechSpec sections "Testing Approach → Unit Tests" and "Integration Tests" (type-level subsection) and ADR-003. Keep coverage `include` narrow — Phase 0 source is small; an unscoped `include` risks artificial coverage gaps.

### Relevant Files
- `packages/markmd/vitest.config.ts` — main runner config.
- `packages/markmd/tests/setup.ts` — jest-dom import.
- `packages/markmd/tests/unit/MarkmdEditor.test.tsx` — smoke render test.
- `packages/markmd/tests/type/props.test-d.ts` — type-level assertions.
- `packages/markmd/tsconfig.types-test.json` — strict typecheck for `.test-d.ts` files.

### Dependent Files
- `packages/markmd/src/MarkmdEditor.tsx`, `src/types.ts`, `src/index.ts` — under test.
- `ci.yml` (task_10) runs `pnpm -r test` and uploads coverage.

### Related ADRs
- [ADR-003: Test stack — Vitest (jsdom) + Playwright + axe-core + MSW](adrs/adr-003.md) — Vitest stack rationale.

## Deliverables
- Vitest config + setup file + smoke unit test + type-level test.
- Updated `packages/markmd/package.json` test scripts.
- Coverage report generated at `packages/markmd/coverage/`.
- Unit tests with 80%+ coverage **(REQUIRED)**.
- Integration tests for type-level API stability **(REQUIRED)**.

## Tests
- Unit tests:
  - [ ] `<MarkmdEditor />` renders an element with `data-testid="markmd-editor"`.
  - [ ] `<MarkmdEditor className="foo" />` applies the className to the rendered element.
  - [ ] `<MarkmdEditor style={{ height: 100 }} />` applies the inline style.
  - [ ] Ref forwarding: `ref.current.getValue()` returns `""` for an editor mounted with no `defaultValue`.
  - [ ] Ref forwarding: `ref.current.setValue("x"); ref.current.getValue()` returns `"x"`.
- Integration tests:
  - [ ] Type-level: `expectTypeOf<MarkmdEditorProps>().toMatchTypeOf<{ value?: string; mode?: 'edit' | 'preview' }>()` compiles.
  - [ ] Type-level: removing `MarkmdMode` from the union or renaming `MarkmdEditorRef.getValue` fails `tsc --noEmit` on `tsconfig.types-test.json`.
  - [ ] `pnpm --filter markmd test:coverage` generates `coverage/coverage-final.json` and meets thresholds.
- Test coverage target: >=80%
- All tests must pass

## Success Criteria
- All tests passing
- Test coverage >=80% (lines), >=75% (branches)
- Type-level tests fail compilation when public API shape changes.
- Coverage artifacts produced and ingestible by Codecov (task_10).
