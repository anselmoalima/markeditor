# Task Memory: task_06.md

Keep only task-local execution context here. Do not duplicate facts that are obvious from the repository, task file, PRD documents, or git history.

## Objective Snapshot

Add size-limit, publint, and attw quality gates with unit + integration tests. All three gates must pass on current dist/ and each must block a known-bad input.

## Important Decisions

- `size-limit.json` filename is used (no dot prefix) because `size-limit --config size-limit.json` flag is used in the `size` script. The standard cosmiconfig discovery uses `.size-limit.json`; we bypass that with `--config`.
- Bloat test uses a separate temp file `.size-limit-test-overflow.json` rather than temporarily replacing `size-limit.json`. This avoids a race condition where the unit test reads `size-limit.json` in a parallel vitest project while the integration test has overwritten it with a 1 B temp config.
- `size-limit` and `@size-limit/preset-small-lib` installed in `packages/markmd` devDependencies (not root), since that's where the config and script live. Root delegates via turbo.
- Root `pnpm publint` and `pnpm attw` scripts delegate to package with `pnpm --filter markmd <script>`.

## Learnings

- `size-limit@12.1.0` uses `lilconfig` with `searchPlaces` that does NOT include `size-limit.json` (without dot). Valid names: `.size-limit.json`, `package.json["size-limit"]`, `.size-limitrc`, etc. But `--config FILE` flag is supported.
- `size-limit` uses brotli compression by default (not gzip despite the `@size-limit/preset-small-lib` name suggesting gzip). Output says "minified and brotlied".
- fflate/attw bug (see shared MEMORY.md) did NOT crash attw 0.16.4/core 0.18.2 in this environment; `pnpm attw` exits 0 normally.

## Files / Surfaces

- `packages/markmd/size-limit.json` — created
- `packages/markmd/package.json` — added `size` script, `size-limit` + `@size-limit/preset-small-lib` devDeps
- `package.json` (root) — added `publint` and `attw` scripts
- `packages/markmd/tests/unit/quality-gates.test.ts` — 9 unit tests (config shape + root scripts)
- `packages/markmd/tests/integration/quality-gates.test.ts` — 4 integration tests (pnpm size/publint/attw pass; enforcement test)

## Errors / Corrections

- First attempt used `size-limit.json` without `--config` flag → size-limit couldn't find config, errored. Fix: add `--config size-limit.json` to the `size` script.
- First bloat test temporarily replaced `size-limit.json` → race condition with unit test reading same file in parallel vitest project. Fix: use separate temp file + `size-limit --config <tempfile>`.

## Ready for Next Run

task_06 complete. All 30 tests pass. Coverage 100/100/80/100.
