# Workflow Memory

Keep only durable, cross-task context here. Do not duplicate facts that are obvious from the repository, PRD documents, or git history.

## Current State

- task_13 (A11y audit + docs + v1.0.0): DONE — all quality gates green, version 1.0.0
- All tasks 01–13 complete. Diff ready for manual review.

## Shared Decisions

- Storage: raw markdown string under `storageKey` (no JSON wrapper). Write-through in all modes; read-on-mount only when uncontrolled.
- Image upload optimistic placeholder nonce: `data:image/upload-NONCE` format for clean string replacement.
- Custom theme: only `--mde-*` prefixed keys from BobmdTheme object applied as inline CSS vars; others silently ignored.
- Sticky toolbar: `bobmd-toolbar--sticky` CSS class added when `ToolbarConfig.sticky === true`.
- Playground routing: hash-based (`window.location.hash`), no react-router-dom.
- Playwright webServer: uses `vite preview` (not `vite dev`) — avoids EMFILE inotify limit on Linux.
- WebKit system libs: placed missing `libavif13`, `libgav1-0`, `libyuv0`, `libevent-2.1-7` (from apt) into `~/.cache/ms-playwright/webkit-*/minibrowser-{gtk,wpe}/lib/`. `PLAYWRIGHT_SKIP_VALIDATE_HOST_REQUIREMENTS=1` set in `playwright.config.ts`.

## Shared Learnings

## Shared Learnings

### Testing Patterns (cross-task)

1. **jsdom localStorage is un-spyable**: `vi.spyOn(window.localStorage, 'getItem/setItem')` silently records 0 calls. Solution: `vi.stubGlobal('localStorage', { getItem: vi.fn(), ... })`.

2. **vi.useFakeTimers() + React 18 = broken effects**: React 18 concurrent mode uses scheduler internals. Prefer real timers + `waitFor` + short `autoSaveInterval: 50`.

3. **StatusBar setInterval(5000ms)**: `vi.runAllTimersAsync()` hits Vitest's 10,000 timer limit. Use bounded `advanceTimersByTimeAsync(N)` where N < 5000.

4. **exactOptionalPropertyTypes: true**: Optional fields cannot receive explicit `undefined`. Add `| undefined` to field type or use conditional spread.

5. **JSX string attributes with `\n`**: Assign to `const` variable, pass as `{variable}` expression.

6. **Pre-existing flaky test**: `build-artifacts.test.ts > playground smoke test` always fails without running dev server. Exclude from coverage.

7. **`useStorageSync` + `defaultValue`**: Providing `defaultValue` skips mount-time storage read (line 50: `if (hasDefaultValue) return`). Scenarios that need storage restore must NOT use `defaultValue` — use `placeholder` instead.

8. **Debounce cancel on unmount**: Auto-save debounce cancels when editor unmounts (e.g., toggle to preview). E2E tests must wait ≥1500ms for save to complete BEFORE toggling.

9. **Monaco `Ctrl+A` in WebKit**: In WebKit, `Ctrl+A` moves cursor to line start instead of selecting all. Use `Meta+A` in WebKit. Detect via `navigator.userAgent` (contains 'WebKit' but not 'Chromium'/'Chrome').

10. **Playwright storage test**: `page.reload()` in Firefox has timing issues with SPA re-init. Fix: navigate to `/` then back to `/storage` instead of reloading.

11. **jest-dom + Vitest setup**: `import '@testing-library/jest-dom/vitest'` as a side-effect import in setupFiles does NOT reliably extend Vitest's expect. Use explicit `import * as jestDomMatchers from '@testing-library/jest-dom/matchers'` then `expect.extend(jestDomMatchers)`. TypeScript types: use `/// <reference path="../node_modules/@testing-library/jest-dom/types/vitest.d.ts" />` in a `tests/jest-dom.d.ts` file.

12. **tsup externalizes all `dependencies`**: tsup automatically marks all packages in `dependencies` as external. The `external` array in tsup.config.ts is only needed for packages NOT in `dependencies`/`peerDependencies`. This means dist/index.js only imports (not bundles) unified, remark-_, rehype-_, etc.

13. **size-limit must mirror tsup externals**: All packages that tsup externalizes must also be in size-limit's `ignore` array. Otherwise size-limit re-bundles them from node_modules and reports inflated sizes. Correct core size: ~16 KB gzip; full: ~19 KB gzip.

### TypeScript Patterns

- Async callback props: `(() => void | Promise<void>) | undefined` — avoids return type mismatch.
- Boolean TS narrowing: `typeof config === 'object' && config.sticky`.

## Open Risks

- Playground smoke test (`build-artifacts.test.ts`) is permanently flaky in CI without running dev server. Should be tagged to skip or moved to E2E suite.
- WebKit system libs workaround is environment-specific. CI must either install `libavif13` etc. or keep libs in the ms-playwright cache directory.
- Bench baseline.json values are machine-specific (490ms for 10k on dev machine). CI runners may have different performance characteristics; baseline may need updating on first CI run.

## Handoffs

- All 13 tasks complete. bob-editor v1.0.0 ready for publication via GitHub Actions release workflow (task_01). Do NOT publish from local — use `changeset publish` only in CI.
