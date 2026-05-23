# Task Memory: task_10.md

Keep only task-local execution context here. Do not duplicate facts that are obvious from the repository, task file, PRD documents, or git history.

## Objective Snapshot

Author `.github/workflows/ci.yml` — matrix Node 18/20/22 × React 18/19, ordered quality gate steps, caches, Codecov upload on primary cell (node 20 + react 19).

## Important Decisions

- **React override via `pnpm update react@$VERSION react-dom@$VERSION -r`**: runs after `--frozen-lockfile` install; modifies node_modules + package.json ephemerally in CI. No `--no-save` flag exists in pnpm v9 — this is the intended pattern.
- **Primary cell**: `node-version == 20 && react-version == 19` — condition on the codecov step `if:` line.
- **Corepack approach**: `corepack enable` runs after `setup-node`, then `pnpm store path --silent` is called to get store path for manual cache step (not using `setup-node cache: pnpm` since corepack must run first).
- **YAML parsing in tests**: added `js-yaml@4.1.1` as root devDep — no built-in YAML parser in Node 18+; Python3 PyYAML not guaranteed.
- **fail-fast: false** on matrix — all cells run so all failure modes are visible; individual steps still fail fast (GH Actions default).
- **`pnpm -r test -- --coverage`**: passes `--coverage` to vitest in each workspace. Both markeditor and playground generate coverage.
- **Codecov OIDC**: uses `token: ${{ secrets.CODECOV_TOKEN }}` — codecov-action@v4 auto-selects OIDC when available, falls back to token.
- **Job summary**: `if: always()` step writes to `$GITHUB_STEP_SUMMARY` for Markdown PR comment (built-in checks approach).

## Learnings

- `actions/setup-node@v4` with `cache: 'pnpm'` requires pnpm to exist before setup-node for cache to work. Corepack-based approach requires manual pnpm store path retrieval + separate cache step.
- `matrix.node-version == 20 && matrix.react-version == 19` in YAML `if:` — GitHub Actions evaluates without `${{ }}` wrapper; integers work in matrix comparisons.
- `actionlint` not installed locally — CI must validate the workflow on push.

## Files / Surfaces

- `.github/workflows/ci.yml` — created
- `tests/ci.test.mjs` — 26 unit tests, all pass
- `package.json` — added `js-yaml@^4.1.0` devDep, extended `test:config` to include `tests/ci.test.mjs`

## Errors / Corrections

None.

## Ready for Next Run

- task_08 (Playwright config) still pending — `pnpm --filter playground e2e` step in ci.yml will fail in live CI until task_08 is merged.
- task_11 (size.yml + release.yml) depends on this task being complete.
- `actionlint` not run locally — install and verify before first CI push.
