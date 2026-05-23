# Task Memory: task_11.md

Keep only task-local execution context here. Do not duplicate facts that are obvious from the repository, task file, PRD documents, or git history.

## Objective Snapshot

Authored `size.yml` + `release.yml` GitHub Actions workflows and wired `prepublishOnly` in `packages/markmd/package.json`. All unit tests pass (40 tests in `tests/release.test.mjs`). Full config suite: 110 tests pass.

## Important Decisions

- `release.yml` uses `pnpm -r build` (not `turbo run build --force`) — this bypasses turbo cache naturally since it invokes workspace build scripts directly, satisfying the "no stale cache in release" requirement without needing the `--force` flag.
- `NPM_CONFIG_PROVENANCE: "true"` (quoted string) in changesets step env — explicit string avoids YAML boolean ambiguity. Test accepts both `true` and `"true"`.
- `concurrency.group: release` with `cancel-in-progress: false` — serializes simultaneous main-branch merges rather than cancelling in-progress releases.
- `size.yml` includes `build_script: pnpm -r build` and `package_manager: pnpm` inputs to `andresz1/size-limit-action@v1` so the action can rebuild both branches correctly for comparison.
- Subtask 11.4 (configure NPM OIDC trust on npmjs.com) explicitly deferred to task_13 per spec ("documented in CONTRIBUTING — task_13").

## Learnings

- actionlint not installed locally — integration tests skip gracefully via `which actionlint` check. Validate in CI on first push.
- `packages/markmd/package.json` had no `lint` script — added `"lint": "eslint . --max-warnings 0"` alongside `prepublishOnly` since `prepublishOnly` chains `pnpm run lint`.
- Test pattern: use `js-yaml` parse + `raw` string checks (same as ci.test.mjs). Step order tested via index comparison of parsed steps array.

## Files / Surfaces

- `.github/workflows/size.yml` — created
- `.github/workflows/release.yml` — created
- `packages/markmd/package.json` — added `lint` + `prepublishOnly` scripts
- `tests/release.test.mjs` — created (40 tests)
- `package.json` — `test:config` extended to include `tests/release.test.mjs`

## Errors / Corrections

None — first implementation passed all tests.

## Ready for Next Run

task_12 can now attempt the dry-run release on a `0.0.0-test` tag. OIDC trust on npmjs.com must be configured (subtask 11.4 → task_13 CONTRIBUTING docs) before a real publish succeeds.
