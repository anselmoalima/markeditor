# Phase 0 — Monorepo Setup — Task List

## Tasks

| # | Title | Status | Complexity | Dependencies |
|---|-------|--------|------------|--------------|
| 01 | Repo skeleton + pnpm workspaces | pending | low | — |
| 02 | tsconfig.base + Turborepo pipeline | pending | low | task_01 |
| 03 | ESLint flat v9 + Prettier + Husky/lint-staged | pending | medium | task_02 |
| 04 | packages/markmd skeleton + tsup dual build | pending | medium | task_02 |
| 05 | Vitest config + smoke unit + type tests | pending | medium | task_04 |
| 06 | size-limit + publint + attw quality gates | pending | low | task_04 |
| 07 | apps/playground Vite skeleton consuming workspace lib | pending | medium | task_04 |
| 08 | Playwright config + smoke e2e + axe | pending | medium | task_07 |
| 09 | Changesets init (ignore apps/*) | pending | low | task_01 |
| 10 | ci.yml matrix Node 18/20/22 × React 18/19 | pending | high | task_03, task_05, task_06, task_08, task_09 |
| 11 | size.yml + release.yml with OIDC provenance | pending | high | task_09, task_10 |
| 12 | Smoke dry-run release (0.0.0-test tag) | pending | medium | task_11 |
| 13 | README + badges + CONTRIBUTING.md | pending | low | task_10, task_11 |
