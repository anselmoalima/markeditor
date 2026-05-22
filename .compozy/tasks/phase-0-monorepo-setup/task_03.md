---
status: pending
title: ESLint flat v9 + Prettier + Husky/lint-staged
type: infra
complexity: medium
dependencies:
  - task_02
---

# Task 03: ESLint flat v9 + Prettier + Husky/lint-staged

## Overview
Install and configure the lint/format toolchain: ESLint 9 flat config (`eslint.config.js`) covering TS/TSX with react, react-hooks, jsx-a11y, and import-x plugins; Prettier 3 with shared config; Husky pre-commit + lint-staged so staged files are auto-fixed before commit. This is the local quality gate that prevents lint debt from reaching CI.

<critical>
- ALWAYS READ the PRD and TechSpec before starting
- REFERENCE TECHSPEC for implementation details — do not duplicate here
- FOCUS ON "WHAT" — describe what needs to be accomplished, not how
- MINIMIZE CODE — show code only to illustrate current structure or problem areas
- TESTS REQUIRED — every task MUST include tests in deliverables
</critical>

<requirements>
- `eslint.config.js` MUST be flat-config (no `.eslintrc.*`) and target ESLint v9+.
- Lint MUST be type-aware for `.ts`/`.tsx` (project-references-aware via `tsconfig.base.json`).
- Plugin coverage MUST include `typescript-eslint`, `eslint-plugin-react`, `eslint-plugin-react-hooks`, `eslint-plugin-jsx-a11y`, `eslint-plugin-import-x`.
- `pnpm lint` MUST run `eslint . --max-warnings 0`.
- `.prettierrc` MUST set `singleQuote: true`, `trailingComma: "all"`, `printWidth: 100`, `semi: true`.
- Husky + lint-staged MUST run `eslint --fix` + `prettier --write` on staged `*.{ts,tsx,js,jsx}` and `prettier --write` on staged `*.{json,md,css}`.
- `prepare` script MUST install Husky automatically on `pnpm install`.
</requirements>

## Subtasks
- [ ] 3.1 Install ESLint 9 + plugins + Prettier + Husky + lint-staged at root.
- [ ] 3.2 Create `eslint.config.js` with shared rules and per-workspace overrides (placeholder for `packages/*` and `apps/*`).
- [ ] 3.3 Create `.prettierrc` and `.prettierignore`.
- [ ] 3.4 Add `lint-staged` config to root `package.json` and `.husky/pre-commit` hook.
- [ ] 3.5 Add `prepare` script to bootstrap Husky.
- [ ] 3.6 Add `pnpm lint`, `pnpm format`, `pnpm format:check` root scripts wired to Turbo where applicable.

## Implementation Details
Reference TechSpec "Build Order steps 4–5" and ADR-005. Keep ESLint config flat and modular; avoid per-package `eslint.config.js` unless overrides differ. Pre-commit hook should be fast (<2s on typical staged diff) — defer typecheck to CI.

### Relevant Files
- `eslint.config.js` — flat config at root.
- `.prettierrc`, `.prettierignore` — Prettier setup.
- `.husky/pre-commit` — hook calling `pnpm exec lint-staged`.
- `package.json` — `lint-staged` block + `prepare` script.

### Dependent Files
- Every `.ts`/`.tsx` file in `packages/markmd` and `apps/playground` (tasks 04, 07) must pass lint.
- `ci.yml` (task_10) runs `pnpm lint` as a gate.

### Related ADRs
- [ADR-005: Quality gates — ESLint flat + Prettier + Husky + size-limit + Codecov](adrs/adr-005.md) — lint/format/hooks decisions.

## Deliverables
- Committed `eslint.config.js`, `.prettierrc`, `.prettierignore`, `.husky/pre-commit`.
- Updated root `package.json` with deps, scripts, `lint-staged` block.
- Unit tests asserting config shape **(REQUIRED)**.
- Integration tests for hook execution **(REQUIRED)**.

## Tests
- Unit tests:
  - [ ] `eslint.config.js` exports an array containing rules for `typescript-eslint`, `react`, `react-hooks`, `jsx-a11y`, `import-x`.
  - [ ] `.prettierrc` parses and contains `singleQuote: true`, `trailingComma: "all"`, `printWidth: 100`.
  - [ ] Root `package.json` `lint-staged` map covers `*.{ts,tsx,js,jsx}` and `*.{json,md,css}` patterns.
  - [ ] `pnpm lint` on a fixture file with a `no-unused-vars` violation exits non-zero.
  - [ ] `pnpm lint` on a clean fixture file exits 0.
- Integration tests:
  - [ ] Staging a `*.ts` file with unfixable lint error and running `pnpm exec lint-staged` exits non-zero.
  - [ ] Staging a `*.ts` file with a fixable formatting issue and running `pnpm exec lint-staged` rewrites the file and stages the fix.
- Test coverage target: >=80%
- All tests must pass

## Success Criteria
- All tests passing
- Test coverage >=80%
- `pnpm lint --max-warnings 0` exits 0 on the current tree.
- Pre-commit hook blocks commits that introduce lint errors.
