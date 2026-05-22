---
status: pending
title: Playwright config + smoke e2e + axe
type: test
complexity: medium
dependencies:
  - task_07
---

# Task 08: Playwright config + smoke e2e + axe

## Overview
Add Playwright to `apps/playground` with a single smoke e2e test that drives the production build (via `webServer: pnpm preview`) and asserts the `<MarkmdEditor />` mounts cleanly. Wire `@axe-core/playwright` into the same test to assert zero serious/critical a11y violations. This is the cross-browser proof that the published library actually loads in a real DOM.

<critical>
- ALWAYS READ the PRD and TechSpec before starting
- REFERENCE TECHSPEC for implementation details — do not duplicate here
- FOCUS ON "WHAT" — describe what needs to be accomplished, not how
- MINIMIZE CODE — show code only to illustrate current structure or problem areas
- TESTS REQUIRED — every task MUST include tests in deliverables
</critical>

<requirements>
- `apps/playground/playwright.config.ts` MUST configure `webServer` that runs `pnpm --filter playground preview` and waits for the port to open.
- Browser projects MUST include at least Chromium; Firefox and WebKit recommended (gated by CI cost in task_10).
- `e2e/smoke.spec.ts` MUST navigate to `/`, wait for `[data-testid="markmd-editor"]` to be visible, and assert no `console.error` was emitted during the page lifecycle.
- `e2e/smoke.spec.ts` MUST run `AxeBuilder.analyze()` and fail on any `serious` or `critical` WCAG 2.1 AA violation.
- `pnpm --filter playground e2e` MUST run the suite headlessly and exit 0 on a clean build.
- Playwright browsers MUST be installable via `pnpm exec playwright install --with-deps chromium` and the CI step (added in task_10) MUST cache them.
</requirements>

## Subtasks
- [ ] 8.1 Install `@playwright/test` and `@axe-core/playwright` in `apps/playground`.
- [ ] 8.2 Add `apps/playground/playwright.config.ts` with `webServer` + `use.baseURL` + browser projects.
- [ ] 8.3 Add `e2e/smoke.spec.ts` covering mount + console-error guard + Axe analysis.
- [ ] 8.4 Add `pnpm --filter playground e2e` script and Turbo `e2e` task wiring (`dependsOn: ["playground#build"]`).
- [ ] 8.5 Document local prerequisite `pnpm exec playwright install --with-deps chromium` in `apps/playground/README.md` or root `CONTRIBUTING.md` stub.

## Implementation Details
Reference TechSpec sections "Testing Approach → E2E Tests" and ADR-003. Use `webServer.reuseExistingServer: !process.env.CI` so local re-runs are fast. Do NOT run e2e against the dev server — preview the production build to mirror what users will get.

### Relevant Files
- `apps/playground/playwright.config.ts` — runner config.
- `apps/playground/e2e/smoke.spec.ts` — smoke + axe spec.
- `apps/playground/package.json` — e2e script + new devDeps.

### Dependent Files
- `apps/playground/src/App.tsx` (task_07) is the page under test.
- `ci.yml` (task_10) runs the e2e suite as part of the matrix.

### Related ADRs
- [ADR-003: Test stack — Vitest (jsdom) + Playwright + axe-core + MSW](adrs/adr-003.md) — e2e + accessibility decisions.

## Deliverables
- Playwright config + smoke e2e spec committed.
- Playground README/CONTRIBUTING stub documenting browser-install prerequisite.
- E2E suite passes locally with zero Axe serious/critical violations **(REQUIRED)**.
- Console-error guard catches at least one synthetic error in a negative test fixture **(REQUIRED)**.

## Tests
- Unit tests:
  - [ ] `playwright.config.ts` exports a config with `webServer.command` referencing `preview` and `reuseExistingServer` keyed off `process.env.CI`.
  - [ ] `playwright.config.ts` declares the `chromium` project.
  - [ ] `e2e/smoke.spec.ts` parses and contains exactly one `test()` block named `"mounts editor with no a11y violations"` (or equivalent).
- Integration tests:
  - [ ] Running `pnpm --filter playground e2e` against the built playground exits 0.
  - [ ] Suite asserts `[data-testid="markmd-editor"]` is visible within 5s.
  - [ ] `AxeBuilder.analyze()` returns zero violations at `serious` or `critical` impact for the rendered page.
  - [ ] Negative test (separate spec or temp fixture): inject a `console.error` from the page and confirm the smoke test fails — then revert.
- Test coverage target: >=80% (e2e covers >=1 critical user flow: mount)
- All tests must pass

## Success Criteria
- All tests passing
- Smoke e2e completes in <30s on Chromium locally.
- Zero Axe serious/critical violations on the placeholder page.
- Test pattern is reusable as Phase 1 adds richer flows.
