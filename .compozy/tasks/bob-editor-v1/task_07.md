---
status: completed
title: 'MVP — BobEditor shell + Monaco lazy + textarea fallback + toggle + themes (v0.1.0)'
type: frontend
complexity: critical
dependencies:
  - task_04
  - task_05
  - task_06
---

# Task 7: MVP — BobEditor shell + Monaco lazy + textarea fallback + toggle + themes (v0.1.0)

## Overview

Assemble the core `<BobEditor />` component by wiring together all previously built modules: the reducer/context layer, the pipeline, the managers, Monaco (lazy-loaded), a textarea fallback, the mode toggle, and the light/dark/auto theme system. The result is a fully functional edit-preview toggle editor — the first publicly releasable milestone (v0.1.0). Integration tests must cover controlled/uncontrolled modes, theme application, and React 18 strict-mode safety.

<critical>
- ALWAYS READ the PRD and TechSpec before starting
- REFERENCE TECHSPEC for implementation details — do not duplicate here
- FOCUS ON "WHAT" — describe what needs to be accomplished, not how
- MINIMIZE CODE — show code only to illustrate current structure or problem areas
- TESTS REQUIRED — every task MUST include tests in deliverables
</critical>

<requirements>
- MUST implement `src/BobEditor.tsx` using `forwardRef` + `useImperativeHandle` exposing the `BobEditorRef` surface; must initialize reducer via `useReducer`, provide both contexts, create `EditorAPI` via `createEditorApi`, initialize plugin and shortcut managers
- MUST implement `src/components/Editor/index.tsx` orchestrator: renders `<TextareaFallback>` immediately; conditionally swaps in `<MonacoEditor>` (loaded via `React.lazy + Suspense`) once the dynamic import resolves; both components dispatch `content/setMarkdown` with `source: 'monaco'`
- MUST implement `src/components/Editor/MonacoEditor.tsx`: binds Monaco model ↔ reducer state via `onDidChangeModelContent` + controlled sync effect; accepts `editorOptions` prop forwarded to Monaco
- MUST implement `src/components/Editor/TextareaFallback.tsx`: fully functional `<textarea>` wired to dispatcher; used in SSR and as Monaco loading placeholder
- MUST implement `src/components/Preview/index.tsx`: consumes `usePreview()` hook; renders the `ReactElement` from pipeline; shows a subtle loading indicator on first render only; error boundary for pipeline failures
- MUST implement `src/hooks/usePreview.ts`: debounced (150 ms default / `previewDebounceMs`), memoized (FNV cache key from task_05), generation-counter abort; calls `detectFeatures` to pre-warm `LazyRegistry`; dispatches `pipeline/pending`, `pipeline/ready`, `pipeline/error`
- MUST implement `src/components/ModeToggle.tsx`: renders a toggle button/aria-pressed; fires `mode/set` dispatch; respects `allowedModes` prop; has `aria-live` announcement of mode change
- MUST implement `src/themes/light.ts`, `dark.ts`, `auto.ts` as `BobmdTheme` objects
- MUST apply theme via inline CSS variables on the root element (`--mde-*` tokens); `auto` theme uses `matchMedia('(prefers-color-scheme: dark)')` and subscribes to changes
- MUST implement `src/styles/` with base `.bobmd-*` prefixed CSS; export to `dist/styles.css` via tsup
- MUST support controlled mode (`value` + `onChange`) and uncontrolled mode (`defaultValue`) using `useControllableState`
- MUST support `onMount(api)` prop: called once after manager initialization with the stable `EditorAPI`
- MUST guard Monaco against SSR: dynamic import is wrapped in `typeof window !== 'undefined'` check; TextareaFallback renders on server
- MUST call `createChangeset` and bump to `v0.1.0` as part of this task's acceptance
</requirements>

## Subtasks

- [x] 7.1 Implement `src/BobEditor.tsx` — context providers, reducer, manager initialization, ref handle
- [x] 7.2 Implement `src/components/Editor/TextareaFallback.tsx` + `MonacoEditor.tsx`
- [x] 7.3 Implement `src/components/Editor/index.tsx` — MonacoEditor lazy orchestrator
- [x] 7.4 Implement `src/hooks/usePreview.ts` — debounce, memo, generation abort, pre-warm
- [x] 7.5 Implement `src/components/Preview/index.tsx` — pipeline output renderer
- [x] 7.6 Implement `src/components/ModeToggle.tsx` with aria-live
- [x] 7.7 Implement `src/themes/` (light, dark, auto) + `src/styles/` CSS base
- [x] 7.8 Write integration tests (controlled/uncontrolled, toggle, themes, strict-mode)
- [x] 7.9 Bump Changeset → v0.1.0, run `pnpm -r build && pnpm -r test && pnpm -r typecheck && pnpm -r lint` (size-limit fixed: dynamic import for react-dom/server in exportAsHtml + ignore katex/highlight.js in size-limit.json — core 69.84 kB < 80 kB)

## Implementation Details

See TechSpec 'System Architecture' → Data Flow diagram, ADR-002 (usePreview generation counter), ADR-003 (context providers and manager wiring), ADR-005 (Monaco lazy), ADR-007 (CSS variables).

Key constraints:

- Monaco is mocked at the dynamic-import boundary in RTL tests — tests assert against `TextareaFallback` or a Monaco stub, never load real Monaco.
- `usePreview` generation counter: each new call to the effect increments the counter; on cleanup, the captured counter value is compared to the current; results from mismatched generations are discarded.
- React 18 strict mode fires effects twice in dev; `usePreview` generation counter handles this correctly (second effect run increments generation, discards first result).
- CSS: selector prefix `.bobmd-`, variable prefix `--mde-`; no inline styles for theming (only CSS variables on root).
- `auto` theme: subscribe to `matchMedia('(prefers-color-scheme: dark)').addEventListener('change', ...)` and clean up in effect return.

### Relevant Files

- `packages/bob-editor/src/BobEditor.tsx` — create (main component)
- `packages/bob-editor/src/components/Editor/index.tsx` — create
- `packages/bob-editor/src/components/Editor/MonacoEditor.tsx` — create
- `packages/bob-editor/src/components/Editor/TextareaFallback.tsx` — create
- `packages/bob-editor/src/components/Preview/index.tsx` — create
- `packages/bob-editor/src/hooks/usePreview.ts` — create
- `packages/bob-editor/src/components/ModeToggle.tsx` — create
- `packages/bob-editor/src/themes/light.ts`, `dark.ts`, `auto.ts` — create
- `packages/bob-editor/src/styles/base.css`, `themes.css` — create
- `packages/bob-editor/tests/integration/BobEditor.test.tsx` — create

### Dependent Files

- `src/components/Toolbar/` (task_08) — mounted inside BobEditor
- `src/i18n/` (task_08) — consumed by BobEditor for locale
- `src/hooks/useStorageSync.ts` (task_11) — wired into BobEditor useEffect

### Related ADRs

- [ADR-002: Async unified pipeline with debounced memoization](adrs/adr-002.md) — usePreview design and abort semantics
- [ADR-003: Central useReducer + Context with imperative EditorAPI](adrs/adr-003.md) — BobEditor as context provider
- [ADR-005: Monaco lazy-loaded via dynamic import; SSR fallback is textarea](adrs/adr-005.md) — Editor component lazy strategy
- [ADR-007: Prefixed plain CSS with CSS variables](adrs/adr-007.md) — Theme and style system contract

## Deliverables

- `src/BobEditor.tsx` (forwardRef, complete prop surface from task_03)
- `src/components/Editor/` (TextareaFallback, MonacoEditor, orchestrator)
- `src/components/Preview/index.tsx`
- `src/hooks/usePreview.ts`
- `src/components/ModeToggle.tsx`
- `src/themes/` + `src/styles/`
- Integration tests with 80%+ coverage **(REQUIRED)**
- Changeset entry for v0.1.0

## Tests

- Unit tests:
  - [x] `usePreview` with fake timers: output element updates 150 ms after markdown change, not before
  - [x] `usePreview` generation abort: starting process, triggering a new render cycle, confirms stale result discarded (no `pipeline/ready` dispatch from stale run)
  - [x] `auto` theme: toggling `matchMedia` mock from light to dark applies dark CSS variables on root
- Integration tests:
  - [x] Controlled mode: `<BobEditor value="# Hello" onChange={fn}>` — typing in textarea calls `fn`; changing `value` prop updates displayed content
  - [x] Uncontrolled mode: `<BobEditor defaultValue="# Hi">` — textarea shows `# Hi`; editing updates internal state without external `onChange` required
  - [x] Mode toggle: clicking ModeToggle from edit to preview renders preview div; `onModeChange` fires with `"preview"`
  - [x] Mode toggle: content is preserved when toggling back to edit
  - [x] `allowedModes: ["preview"]`: ModeToggle is hidden or disabled
  - [x] `readOnly: true`: textarea and Monaco are both in read-only mode
  - [x] `onMount(api)` fires once after mount with a stable `EditorAPI` object
  - [x] Light theme: root element has `--mde-bg` CSS variable matching light theme value
  - [x] Dark theme: root element has `--mde-bg` CSS variable matching dark theme value
  - [x] React 18 strict mode: component mounts correctly; no duplicate `onMount` calls (managers initialize once)
  - [x] SSR guard: `BobEditor` renders without throwing in a jsdom environment where `window` is defined but `monaco-editor` is mocked to `null`
  - [x] A11y: `expect(container).toHaveNoViolations()` passes for edit mode and preview mode (jest-axe)
- Test coverage target: >=80%
- All tests must pass

## Success Criteria

- All tests passing
- Test coverage >=80%
- Edit → preview toggle works; content preserved on toggle
- Monaco lazy-loads correctly (TextareaFallback shown during load)
- Controlled and uncontrolled modes both function
- Theme CSS variables applied; auto theme responds to system preference change
- `pnpm -r build && pnpm -r test && pnpm -r typecheck && pnpm -r lint` all pass
- `size-limit` core-without-Monaco < 80 KB gzip
- v0.1.0 Changeset entry created
