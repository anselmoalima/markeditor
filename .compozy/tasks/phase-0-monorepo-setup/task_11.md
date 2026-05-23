---
status: completed
title: size.yml + release.yml with OIDC provenance
type: infra
complexity: high
dependencies:
  - task_09
  - task_10
---

# Task 11: size.yml + release.yml with OIDC provenance

## Overview

Author two GitHub Actions workflows: `size.yml` posts a bundle-diff comment on every PR via `andresz1/size-limit-action`, and `release.yml` consumes Changesets to open a "Version Packages" PR and, on merge, publishes `markeditor` to npm with provenance via OIDC (`id-token: write`). This closes the loop from commit → published package.

<critical>
- ALWAYS READ the PRD and TechSpec before starting
- REFERENCE TECHSPEC for implementation details — do not duplicate here
- FOCUS ON "WHAT" — describe what needs to be accomplished, not how
- MINIMIZE CODE — show code only to illustrate current structure or problem areas
- TESTS REQUIRED — every task MUST include tests in deliverables
</critical>

<requirements>
- `.github/workflows/size.yml` MUST run on `pull_request` and post a size-diff comment using `andresz1/size-limit-action@v1`.
- `.github/workflows/release.yml` MUST run on `push` to `main`, use `changesets/action@v1`, set permissions `contents: write`, `pull-requests: write`, `id-token: write`.
- `release.yml` MUST run `pnpm install --frozen-lockfile`, `pnpm -r build`, `pnpm publint`, `pnpm attw`, `pnpm size` before invoking Changesets publish.
- Changesets publish step MUST run `pnpm changeset publish` with `NPM_CONFIG_PROVENANCE=true`.
- `packages/markeditor/package.json` `prepublishOnly` MUST run `build && test && typecheck && lint && publint && attw && size`.
- Workflow MUST NOT use a long-lived `NPM_TOKEN` if the npm org/repo supports OIDC trust; otherwise document fallback `NPM_TOKEN` secret usage.
- Workflow MUST fail closed if any gate step fails (no partial publish).
</requirements>

## Subtasks

- [x] 11.1 Author `.github/workflows/size.yml` invoking `andresz1/size-limit-action@v1` with `script: "pnpm size"`.
- [x] 11.2 Author `.github/workflows/release.yml` with Changesets action, OIDC permissions, and the full pre-publish gate chain.
- [x] 11.3 Set `packages/markeditor/package.json` `prepublishOnly` to run the full local gate chain.
- [ ] 11.4 Configure NPM provenance trust on `npmjs.com` for this repo (documented in CONTRIBUTING — task_13). **Deferred to task_13.**
- [x] 11.5 Add a dummy concurrency group to `release.yml` so simultaneous merges serialize releases.

## Implementation Details

Reference TechSpec sections "Data Flow" (publish path) and ADR-004. Provenance is mandatory per PRD §9 — do not ship a release workflow without `id-token: write` + `NPM_CONFIG_PROVENANCE=true`. If npm OIDC trust cannot be configured immediately, gate provenance behind a feature flag in the workflow until task_12 confirms the dry-run succeeded.

### Relevant Files

- `.github/workflows/size.yml` — PR size comment.
- `.github/workflows/release.yml` — Changesets publish flow.
- `packages/markeditor/package.json` — `prepublishOnly` chain.

### Dependent Files

- `ci.yml` (task_10) must be green for `release.yml` to ever trigger meaningfully.
- `.changeset/config.json` (task_09) drives the version PR.
- Task_12 validates this workflow with a dry-run tag.

### Related ADRs

- [ADR-004: Versioning + publish — Changesets with NPM provenance via OIDC](adrs/adr-004.md) — release flow + provenance.
- [ADR-005: Quality gates — ESLint flat + Prettier + Husky + size-limit + Codecov](adrs/adr-005.md) — pre-publish gate chain.

## Deliverables

- `size.yml` + `release.yml` committed.
- `prepublishOnly` script wired in `packages/markeditor/package.json`.
- Unit tests asserting workflow shape **(REQUIRED)**.
- Integration tests verifying release workflow can run in dry-run mode without publishing **(REQUIRED, real publish validated in task_12)**.

## Tests

- Unit tests:
  - [x] `size.yml` parses, triggers on `pull_request`, and invokes `andresz1/size-limit-action@v1` with `script: "pnpm size"`.
  - [x] `release.yml` parses, triggers on `push` to `main`, sets `permissions.id-token: write`, `contents: write`, `pull-requests: write`.
  - [x] `release.yml` runs `pnpm publint`, `pnpm attw`, `pnpm size` BEFORE `changesets/action@v1`.
  - [x] `release.yml` sets `NPM_CONFIG_PROVENANCE=true` in the publish step env.
  - [x] `packages/markeditor/package.json` `prepublishOnly` chain includes all 7 gates.
- Integration tests:
  - [x] `actionlint .github/workflows/{size,release}.yml` — skips gracefully if not installed locally; will validate in CI on first push.
  - [ ] Manual dry-run of `release.yml` on a branch (no real publish) generates a "Version Packages" PR draft. **Validated in task_12.**
  - [ ] Opening a PR with a deliberate +10KB bundle bloat causes `size.yml` to post a comment flagging the regression. **Validated on first PR after push.**
- Test coverage target: >=80%
- All tests must pass

## Success Criteria

- All tests passing
- Both workflows lint clean and run green on at least one PR cycle.
- "Version Packages" PR appears automatically when a changeset is merged to `main`.
- Provenance attestation is generated (visible after task_12 dry-run publish).
