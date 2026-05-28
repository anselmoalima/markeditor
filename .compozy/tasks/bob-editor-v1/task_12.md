---
status: completed
title: Playground scenarios (15 routes) + Playwright E2E
type: test
complexity: high
dependencies:
  - task_07
  - task_08
  - task_09
  - task_10
  - task_11
---

# Task 12: Playground scenarios (15 routes) + Playwright E2E

## Overview

Implement all 15 playground scenario routes from PRD §7.5 in `apps/playground/src/scenarios/` and write the corresponding Playwright E2E specs in `apps/playground/e2e/`. The playground is the visual integration harness for every feature; E2E tests provide the cross-browser, real-DOM confidence layer. MSW mocks image upload; `@axe-core/playwright` runs an a11y scan on each route.

<critical>
- ALWAYS READ the PRD and TechSpec before starting
- REFERENCE TECHSPEC for implementation details — do not duplicate here
- FOCUS ON "WHAT" — describe what needs to be accomplished, not how
- MINIMIZE CODE — show code only to illustrate current structure or problem areas
- TESTS REQUIRED — every task MUST include tests in deliverables
</critical>

<requirements>
- MUST implement all 15 scenario routes in `apps/playground/src/scenarios/`: `default` (/), `uncontrolled` (/uncontrolled), `custom-toolbar` (/custom-toolbar), `with-plugins` (/with-plugins), `math` (/math), `mermaid` (/mermaid), `alerts` (/alerts), `image-upload` (/image-upload), `storage` (/storage), `themes` (/themes), `i18n` (/i18n), `export` (/export), `large-document` (/large-document), `readonly` (/readonly), `ssr-safe` (/ssr-safe)
- MUST wire MSW in the playground for `/image-upload` scenario: intercept the upload endpoint, serve a fixture response on success, return 500 for the failure test case
- MUST write Playwright specs in `apps/playground/e2e/` covering at minimum: typing in edit mode, edit→preview toggle, keyboard shortcuts (across Mac/Linux/Windows keyboard layouts via `page.keyboard`), image upload success + failure (MSW), export HTML + MD + print, interaction with a 10k-line document (no freeze), SSR-safe scenario mounts correctly
- MUST run `@axe-core/playwright` a11y scan on each route; CI spec fails on any WCAG 2.1 AA violation
- MUST configure Playwright to run across Chromium, Firefox, and WebKit
- MUST NOT export any playground code from the `bob-editor` package — the playground is entirely in `apps/`
- SHOULD add a DevTools sidebar in `apps/playground/src/App.tsx` listing all routes for easy navigation
</requirements>

## Subtasks

- [x] 12.1 Create `apps/playground/src/App.tsx` router with DevTools sidebar + route list
- [x] 12.2 Implement all 15 scenario route components in `apps/playground/src/scenarios/`
- [x] 12.3 Set up MSW in playground for image upload scenario
- [x] 12.4 Configure Playwright (`playwright.config.ts`) with Chromium + Firefox + WebKit + baseURL
- [x] 12.5 Write E2E specs: typing, toggle, shortcuts, upload (success + failure), export, large-doc, SSR
- [x] 12.6 Add `@axe-core/playwright` a11y scan per scenario route
- [x] 12.7 Confirm `pnpm --filter playground e2e` passes all specs on all browsers

## Implementation Details

See TechSpec 'Development Sequencing' → Build Order step 3 (playground scaffold) and PRD §7.5 for the full scenario list. The playground consumes `bob-editor` via `workspace:*` symlink; no build step is needed between editing the library and seeing changes in the playground (Vite HMR).

Key constraints:

- `ssr-safe` scenario: simulate SSR by rendering BobEditor with `window` undefined or by using a Next.js-like pattern where the component mounts only after hydration; TextareaFallback must be visible before Monaco loads.
- `large-document` scenario: load a 10k-line fixture; assert that the preview renders within 3 seconds (Playwright `waitForSelector` with a timeout).
- Shortcut tests: use `page.keyboard.press('Control+b')` on Linux/Windows and `Meta+b` on Mac; Playwright allows keyboard layout selection.
- MSW for image upload: use `msw/browser` with `setupWorker`; the service worker must be registered before the test scenario loads.
- `i18n` scenario: demonstrates switching locale at runtime from English to pt-BR.

### Relevant Files

- `apps/playground/src/App.tsx` — update (DevTools sidebar + route list)
- `apps/playground/src/scenarios/` — 15 scenario files, all create
- `apps/playground/src/mocks/handlers.ts` — create (MSW handlers)
- `apps/playground/src/mocks/browser.ts` — create (MSW browser worker)
- `apps/playground/e2e/` — Playwright spec files, all create
- `apps/playground/playwright.config.ts` — create/update
- `apps/playground/public/mockServiceWorker.js` — generate via `msw init`
- `packages/bob-editor/tests/fixtures/markdown/large.md` — create (10k-line fixture, also used in task_09 bench)

### Dependent Files

- All `packages/bob-editor/src/` files (tasks 07–11) — playground imports and renders them

### Related ADRs

- [ADR-009: TDD pyramid with vitest bench regression gate and Changesets-backed provenance release](adrs/adr-009.md) — Defines that E2E tests live in playground/e2e, not in the library package

## Deliverables

- 15 scenario routes in `apps/playground/src/scenarios/`
- MSW handlers for image upload
- Playwright specs for all key user flows
- `@axe-core/playwright` a11y scan per route
- All specs passing on Chromium + Firefox + WebKit **(REQUIRED)**

## Tests

- Unit tests:
  - [ ] Each scenario file renders without throwing when imported (smoke render test with RTL)
- Integration tests (Playwright E2E):
  - [ ] `/` (default): type `# Hello` in edit mode → switch to preview → `<h1>Hello</h1>` visible
  - [ ] `/uncontrolled`: edit, navigate away, return — content restored from localStorage
  - [ ] `/custom-toolbar`: custom button appears in toolbar and executes its action on click
  - [ ] `/with-plugins`: emoji `:tada:` renders 🎉 in preview
  - [ ] `/math`: `$E=mc^2$` in edit mode → KaTeX output in preview
  - [ ] `/mermaid`: mermaid code block → SVG diagram in preview
  - [ ] `/alerts`: `> [!WARNING] msg` → alert component with warning class
  - [ ] `/image-upload` success: MSW returns `{ url: "https://example.com/img.png" }`; preview shows image
  - [ ] `/image-upload` failure: MSW returns 500; placeholder removed; error toast visible
  - [ ] `/storage`: editing and refreshing restores content
  - [ ] `/themes`: switching theme dropdown applies new CSS variables visually
  - [ ] `/i18n`: switching locale to pt-BR updates toolbar button tooltips to Portuguese
  - [ ] `/export`: clicking "Download HTML" triggers browser download dialog (Playwright download assertion)
  - [ ] `/large-document`: 10k-line document loads; preview renders within 3 seconds
  - [ ] `/readonly`: toolbar buttons and Monaco are disabled; text is not editable
  - [ ] `/ssr-safe`: TextareaFallback visible before Monaco chunk loads (assert textarea presence before Monaco)
  - [ ] A11y: every route passes `@axe-core/playwright` WCAG 2.1 AA scan
  - [ ] Shortcut Ctrl+B (Linux) / Meta+B (Mac): bold wraps selection in edit mode
- Test coverage target: >=80% (unit smoke renders)
- All Playwright specs must pass on Chromium, Firefox, WebKit

## Success Criteria

- All tests passing on all three browsers
- All 15 scenarios render without error
- A11y scan passes on every route (zero WCAG 2.1 AA violations)
- Large-document scenario renders within 3 seconds
- MSW upload mock works for both success and failure paths
- `pnpm --filter playground e2e` exits 0
