---
name: task_08
description: Playwright config + smoke e2e + axe implementation memory
metadata:
  type: project
---

# Task Memory: task_08.md

Keep only task-local execution context here. Do not duplicate facts that are obvious from the repository, task file, PRD documents, or git history.

## Objective Snapshot

Add Playwright to `apps/playground` with:
- `playwright.config.ts` — webServer (`pnpm --filter playground preview`, port 4173), reuseExistingServer, chromium + firefox + webkit projects
- `e2e/smoke.spec.ts` — mount check (`[data-testid="markmd-editor"]`), console.error guard, Axe analyze (zero serious/critical)
- `package.json` — add `e2e` script + `@playwright/test` + `@axe-core/playwright` devDeps
- `turbo.json` — ensure e2e depends on playground build
- CONTRIBUTING.md stub — browser install prerequisite

Key constraints:
- webServer runs preview (production build), NOT dev server
- reuseExistingServer: !process.env.CI (fast local re-runs)
- Axe: WCAG 2.1 AA, fail on serious + critical only
- MarkmdEditor already has `data-testid="markmd-editor"` on the root div

## Important Decisions

- Vite preview defaults to port 4173 — no need to override vite.config.ts
- turbo.json e2e task updated: add "build" to dependsOn so playground builds itself before e2e
- tsconfig.eslint.json for apps/playground already exists — playwright.config.ts and e2e/ need to be included
- CONTRIBUTING.md created at root (not README — keeps docs centralized)
- playwright.config.ts: testDir points to `./e2e` relative to apps/playground

## Learnings

## Files / Surfaces

- apps/playground/playwright.config.ts (new)
- apps/playground/e2e/smoke.spec.ts (new)
- apps/playground/package.json (add devDeps + e2e script)
- apps/playground/tsconfig.json (add e2e/ and playwright.config.ts to include)
- apps/playground/tsconfig.eslint.json (add e2e/** and playwright.config.ts)
- turbo.json (update e2e.dependsOn)
- CONTRIBUTING.md (new, root)

## Errors / Corrections

## Ready for Next Run
