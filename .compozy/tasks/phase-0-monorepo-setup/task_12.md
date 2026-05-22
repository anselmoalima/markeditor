---
status: pending
title: Smoke dry-run release (0.0.0-test tag)
type: chore
complexity: medium
dependencies:
  - task_11
---

# Task 12: Smoke dry-run release (0.0.0-test tag)

## Overview
Validate the end-to-end release pipeline by publishing a throwaway `0.0.0-test.N` prerelease of `markmd` to npm and confirming the provenance attestation is visible on `npmjs.com`. This is the only Phase 0 task that produces a real npm publish — it catches OIDC misconfiguration before v0.1.0.

<critical>
- ALWAYS READ the PRD and TechSpec before starting
- REFERENCE TECHSPEC for implementation details — do not duplicate here
- FOCUS ON "WHAT" — describe what needs to be accomplished, not how
- MINIMIZE CODE — show code only to illustrate current structure or problem areas
- TESTS REQUIRED — every task MUST include tests in deliverables
</critical>

<requirements>
- Test publish MUST use a prerelease tag (`pnpm changeset pre enter test` + a `0.0.0-test.0` changeset) so the version never collides with the future v0.1.0 stable release.
- Test publish MUST go to a separate dist-tag (`--tag test`) so `npm install markmd` (no tag) never resolves to it.
- Provenance attestation MUST be visible on `https://www.npmjs.com/package/markmd?activeTab=versions` and verifiable via `npm view markmd@<test-version> --json` (look for `"_attestations"` or `"provenance"` field).
- After validation, the test version MUST be deprecated via `npm deprecate markmd@<test-version> "test release — do not use"` and `pnpm changeset pre exit` MUST be run to leave prerelease mode cleanly.
- Steps performed MUST be documented in `CONTRIBUTING.md` (task_13) for future maintainers.
</requirements>

## Subtasks
- [ ] 12.1 Enter Changesets prerelease mode (`pnpm changeset pre enter test`).
- [ ] 12.2 Create a `0.0.0-test.0` changeset declaring a patch bump for `markmd`.
- [ ] 12.3 Merge the resulting Version Packages PR to trigger `release.yml`.
- [ ] 12.4 Verify the prerelease appears on npm with the `test` dist-tag and the provenance attestation is present.
- [ ] 12.5 Deprecate the test version on npm and exit prerelease mode (`pnpm changeset pre exit`).

## Implementation Details
Reference TechSpec section "Known Risks → OIDC publish misconfiguration" and ADR-004. This task is one-shot — once it succeeds, do not re-run unless `release.yml` is materially changed. If the publish fails, fix `release.yml` (task_11) and re-attempt; do not paper over OIDC issues with a long-lived token.

### Relevant Files
- `.changeset/pre.json` — prerelease state (auto-managed by Changesets).
- `.changeset/<generated>.md` — the test changeset.
- `packages/markmd/package.json` — version bumped by Changesets.

### Dependent Files
- `.github/workflows/release.yml` (task_11) is exercised here.
- `CONTRIBUTING.md` (task_13) documents the procedure.

### Related ADRs
- [ADR-004: Versioning + publish — Changesets with NPM provenance via OIDC](adrs/adr-004.md) — provenance pipeline.

## Deliverables
- One published-then-deprecated `markmd@0.0.0-test.N` version with provenance attestation.
- Documented procedure in `CONTRIBUTING.md` (handed off to task_13).
- Verification screenshot or `npm view` JSON dump committed under `.compozy/tasks/phase-0-monorepo-setup/release-smoke/` as evidence.
- Unit tests asserting prerelease config is exited cleanly **(REQUIRED)**.
- Integration test asserting provenance metadata is present on npm **(REQUIRED)**.

## Tests
- Unit tests:
  - [ ] After completion, `.changeset/pre.json` MUST NOT exist (prerelease mode exited).
  - [ ] `packages/markmd/package.json` `version` MUST NOT contain `-test` post-task (version reverted/cleared).
  - [ ] `release-smoke/npm-view.json` evidence file exists and contains a non-empty `dist.attestations` or `provenance` field.
- Integration tests:
  - [ ] `npm view markmd@<test-version> --json` returns the test version with provenance metadata.
  - [ ] `npm view markmd@<test-version>` includes `"deprecated": "test release — do not use"`.
  - [ ] `npm view markmd@latest` does NOT match the test version (separate dist-tag verified).
- Test coverage target: >=80% (manual but verifiable through saved npm view output)
- All tests must pass

## Success Criteria
- All tests passing
- Test version published, attested, deprecated, and isolated on the `test` dist-tag.
- Provenance attestation visible in npm UI.
- `release.yml` is proven end-to-end before v0.1.0.
