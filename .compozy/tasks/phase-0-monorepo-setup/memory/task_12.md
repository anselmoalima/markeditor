# Task Memory: task_12.md

Keep only task-local execution context here. Do not duplicate facts that are obvious from the repository, task file, PRD documents, or git history.

## Objective Snapshot

Smoke dry-run release (0.0.0-test tag) — validate end-to-end release pipeline by publishing a test prerelease of `markeditor` to npm with provenance attestation, then deprecating it.

## Important Decisions

- Real npm publish BLOCKED by three external prerequisites (see Blockers section).
- Chose to: simulate local changeset workflow + write tests for verifiable state + skip integration tests with clear documentation.
- Unit tests check: pre.json absent, no -test in version, evidence dir exists, release.yml OIDC ready.
- Integration tests: skipped with `{ skip: reason }` — will auto-activate once npm auth and package name are available.

## Blockers (why full publish not done)

1. `markeditor` npm package owned by `banyawat <bunyawat.38@gmail.com>` — verified with `npm view markeditor --json`
2. No npm authentication (`npm whoami` → 401 Unauthorized)
3. No GitHub remote (`git remote -v` → empty) — release.yml cannot be triggered
4. NPM OIDC trust not yet configured (task_11 subtask 11.4 deferred to task_13)

## Learnings

- `pnpm changeset pre exit` does NOT delete pre.json — it changes mode from "pre" to "exit". pre.json is fully removed only after the next `pnpm changeset version` run (or manual deletion).
- Simulation produced version `0.0.8-test.0` (patch bump from 0.0.7). Task spec mentions `0.0.0-test.0` but that assumed the package was at 0.0.0; current version progression makes `0.0.8-test.0` the correct prerelease.
- `packages/markeditor/` is untracked in git → `git checkout -- packages/markeditor/package.json` fails silently. The existing changeset integration test (task_09) has a latent bug: after its version bump, the version permanently increments because git revert fails. Version was 0.0.7, became 0.0.8 after test:config run. My tests are version-agnostic (check for absence of -test), so they still pass.

## Files / Surfaces

- NEW: `tests/release-smoke.test.mjs` — 16 unit + 3 skipped integration tests
- NEW: `.compozy/tasks/phase-0-monorepo-setup/release-smoke/npm-view.json` — evidence placeholder with blocker documentation
- NEW: `.compozy/tasks/phase-0-monorepo-setup/release-smoke/BLOCKERS.md` — full blocker analysis + resolution steps
- MODIFIED: `package.json` → added `tests/release-smoke.test.mjs` to `test:config` script

## Errors / Corrections

- Test file v1 had `await import()` inside non-async `describe` blocks → rewrote with top-level imports.
- `git checkout -- packages/markeditor/package.json` failed (untracked file) → used Edit tool to manually reset version.

## Ready for Next Run

- Task is PARTIALLY COMPLETE: local simulation done, tests pass, documentation complete.
- Full completion requires: resolving npm package name, npm authentication, GitHub remote + OIDC trust.
- Once blockers resolved: follow steps in `release-smoke/BLOCKERS.md`, update `npm-view.json` with real output, mark task completed.
- Latent issue to fix in task_09 tests: changeset version integration test permanently bumps package version because packages/ is untracked. Consider writing a CHANGELOG.md sentinel file or using node:fs directly to restore rather than `git checkout`.
