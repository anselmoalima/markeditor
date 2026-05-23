# Task Memory: task_05.md

Keep only task-local execution context here. Do not duplicate facts that are obvious from the repository, task file, PRD documents, or git history.

## Objective Snapshot

Wire Vitest (jsdom + v8) + smoke unit tests + type-level tests into `packages/markeditor`. Establish TDD loop and public-API regression guard.

## Important Decisions

- Used `expect-type@1.3.0` (npm pkg, not Vitest's built-in) for `.test-d.ts` type assertions — run via `tsc --noEmit -p tsconfig.types-test.json`, not via Vitest.
- `tests/setup.ts` already correct from task_04: uses `@testing-library/jest-dom/vitest` + explicit `afterEach(cleanup)`.
- `vitest.config.ts` already existed from task_04 — added `coverage.exclude` only.
- `types.ts` appears at 0% in v8 coverage (type-only file, no runtime code) but aggregate still meets thresholds — this is expected behavior.

## Learnings

- `pnpm --filter markeditor test --run` fails (pnpm treats `--run` as its own flag). Use `pnpm test` from within the package directory instead.
- `expect-type` package and Vitest's built-in `expectTypeOf` share the same API (`.toEqualTypeOf`, `.toMatchTypeOf`) — they're compatible by design.

## Files / Surfaces

- `packages/markeditor/vitest.config.ts` — added `coverage.exclude`
- `packages/markeditor/package.json` — added `expect-type@1.3.0` devDep, `test:coverage` and `typecheck:types-test` scripts
- `packages/markeditor/tests/unit/MarkEditor.test.tsx` — added style prop test (now 8 tests)
- `packages/markeditor/tests/type/props.test-d.ts` — created (new)
- `packages/markeditor/tsconfig.types-test.json` — created (new)
- `turbo.json` — added `typecheck:types-test` task
- `packages/markeditor/coverage/` — generated with coverage-final.json

## Errors / Corrections

None.

## Ready for Next Run

task_05 complete. Next: task_06 (size-limit + publint + attw quality gates).
