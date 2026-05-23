---
status: pending
title: README + badges + CONTRIBUTING.md
type: docs
complexity: low
dependencies:
  - task_10
  - task_11
---

# Task 13: README + badges + CONTRIBUTING.md

## Overview

Write the root `README.md` with project pitch + badges (npm, CI, coverage, bundlephobia, license) and the `CONTRIBUTING.md` that documents the dev workflow (pnpm setup via Corepack, common commands, Changesets, branch protection, release procedure including the OIDC trust setup proven in task_12). This is the human-facing entry point that closes Phase 0.

<critical>
- ALWAYS READ the PRD and TechSpec before starting
- REFERENCE TECHSPEC for implementation details — do not duplicate here
- FOCUS ON "WHAT" — describe what needs to be accomplished, not how
- MINIMIZE CODE — show code only to illustrate current structure or problem areas
- TESTS REQUIRED — every task MUST include tests in deliverables
</critical>

<requirements>
- Root `README.md` MUST include: badges (npm version, CI status, Codecov coverage, bundlephobia size, license MIT), one-paragraph pitch, install snippet (`pnpm add markeditor`), minimal usage snippet (mount `<MarkEditor />` + `import 'markeditor/styles'`), link to playground (placeholder URL until task_6.5 Vercel deploy), link to PRD and DESIGN docs, license footer.
- `packages/markeditor/README.md` MUST mirror the root README content but be NPM-focused (the published tarball ships this file).
- `CONTRIBUTING.md` MUST document: prerequisites (Node ≥ 18.18, Corepack), common commands (`pnpm install`, `pnpm test`, `pnpm lint`, `pnpm build`, `pnpm changeset`), TDD policy reference (CLAUDE.md §4.1), Changesets workflow, branch protection requirements, release procedure with OIDC trust setup.
- All badge URLs MUST resolve to real targets (CI workflow, Codecov project, npm package).
- `CONTRIBUTING.md` MUST NOT reference any external system the project does not actually use.
</requirements>

## Subtasks

- [ ] 13.1 Author root `README.md` with badges + pitch + install/usage + links.
- [ ] 13.2 Author `packages/markeditor/README.md` (NPM-facing variant).
- [ ] 13.3 Author `CONTRIBUTING.md` covering setup, commands, TDD, Changesets, release.
- [ ] 13.4 Verify every badge URL renders correctly.
- [ ] 13.5 Cross-link `README.md` ↔ `CONTRIBUTING.md` ↔ `PRD.md` ↔ `DESIGN.md` ↔ `CLAUDE.md`.

## Implementation Details

Reference TechSpec section "Monitoring and Observability" (badge inventory) and PRD §11 Fase 6 checklist (README requirements anticipated early here). Keep both READMEs short — the goal is a working onboarding, not exhaustive docs (Phase 6 owns Docusaurus + Storybook).

### Relevant Files

- `README.md` (root) — project entry point.
- `packages/markeditor/README.md` — NPM tarball entry.
- `CONTRIBUTING.md` — dev workflow.

### Dependent Files

- `ci.yml` (task_10), Codecov project (set up in task_10) — referenced by badges.
- `release.yml` (task_11), task_12 procedure — referenced in CONTRIBUTING.

### Related ADRs

- [ADR-004: Versioning + publish — Changesets with NPM provenance via OIDC](adrs/adr-004.md) — release procedure documented in CONTRIBUTING.
- [ADR-005: Quality gates — ESLint flat + Prettier + Husky + size-limit + Codecov](adrs/adr-005.md) — coverage badge sourced from Codecov.

## Deliverables

- `README.md`, `packages/markeditor/README.md`, `CONTRIBUTING.md` committed.
- All badges resolve.
- Unit tests asserting required content present **(REQUIRED)**.
- Integration test: links validated by a Markdown link-check tool **(REQUIRED)**.

## Tests

- Unit tests:
  - [ ] Root `README.md` contains an `## Install` section with the literal `pnpm add markeditor` snippet.
  - [ ] Root `README.md` contains badge image references for npm version, CI, Codecov, bundlephobia, license.
  - [ ] `packages/markeditor/README.md` contains a usage snippet importing `MarkEditor` and `markeditor/styles`.
  - [ ] `CONTRIBUTING.md` contains sections `Setup`, `Common Commands`, `Tests`, `Changesets`, `Release`.
- Integration tests:
  - [ ] `pnpm exec markdown-link-check README.md CONTRIBUTING.md packages/markeditor/README.md` exits 0 (all links resolve).
  - [ ] Every badge image URL responds 200 (asserted by `curl -fI` script in CI).
  - [ ] `npm view markeditor readme` (post any future publish) includes the `packages/markeditor/README.md` content.
- Test coverage target: >=80% (markdown coverage via lint + link-check)
- All tests must pass

## Success Criteria

- All tests passing
- All badges resolve to live targets.
- A contributor following `CONTRIBUTING.md` cold can go from clone → green local `pnpm test` in under 5 minutes.
- READMEs render correctly on both GitHub and npmjs.com.
