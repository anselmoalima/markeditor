---
status: completed
title: Image upload + storage + export + sticky toolbar + custom themes (v0.5.0)
type: frontend
complexity: high
dependencies:
  - task_07
  - task_08
---

# Task 11: Image upload + storage + export + sticky toolbar + custom themes (v0.5.0)

## Overview

Implement the five remaining Phase 5 features: image upload with optimistic UI and rollback, localStorage/sessionStorage persistence with ADR-008 controlled-vs-uncontrolled semantics, HTML/Markdown export, sticky toolbar behavior, and consumer-defined custom themes via the `BobmdTheme` object. This is the fifth releasable milestone (v0.5.0), completing the full feature set before polish and publication.

<critical>
- ALWAYS READ the PRD and TechSpec before starting
- REFERENCE TECHSPEC for implementation details — do not duplicate here
- FOCUS ON "WHAT" — describe what needs to be accomplished, not how
- MINIMIZE CODE — show code only to illustrate current structure or problem areas
- TESTS REQUIRED — every task MUST include tests in deliverables
</critical>

<requirements>
- MUST implement `src/hooks/useStorageSync.ts` with write-through semantics: always writes on content change (debounced by `autoSaveInterval`, default 1000 ms); reads on mount ONLY when in uncontrolled mode (no `value` prop); `QuotaExceededError` → dispatch `storage/error`, disable storage for session, call `onError`; guard with `typeof window !== 'undefined'`
- MUST issue a dev-mode `console.warn` when controlled mode (`value` prop) + storage are both active (ADR-008 dev warning)
- MUST implement image upload flow in `InsertImage` dialog (task_08 adds the dialog shell): on file selection, insert optimistic `![Uploading...](data:)` placeholder; call `onImageUpload(file)`; on resolve, replace placeholder with `![alt](url)`; on reject, remove placeholder and call `onError`
- MUST implement drag-drop upload: `<BobEditor>` root element has `onDragOver` + `onDrop` handlers; dropped image files go through the same `onImageUpload` flow
- MUST implement paste upload: `MonacoEditor.tsx` and `TextareaFallback.tsx` handle `paste` events; detect `DataTransfer.files` with image MIME types; route through `onImageUpload`
- MUST implement `EditorAPI.exportAsHtml()`: runs the unified pipeline on current markdown, serializes the ReactElement to HTML string using `react-dom/server` (or `renderToStaticMarkup`), returns it; sanitized
- MUST implement `EditorAPI.exportAsMarkdown()`: returns `getValue()` directly
- MUST implement download-as-file helpers accessible from a toolbar Export button (or from the playground scenario): create a Blob + anchor click
- MUST implement print support: `window.print()` called after injecting a print stylesheet (or via a CSS `@media print` rule in `styles/`)
- MUST support `enableExport: boolean | ExportConfig` prop on `BobEditor`; when truthy, show export toolbar section
- MUST implement sticky toolbar: when `toolbar.sticky: true` in `ToolbarConfig`, toolbar uses `position: sticky; top: 0` with z-index; disable by default
- MUST implement custom theme: when `theme` prop is a `BobmdTheme` object, serialize all `--mde-*` keys as inline CSS variables on the root element (not just preset names)
- MUST NOT break controlled mode: controlled + storage combination MUST emit warning and MUST NOT restore from storage on mount; see ADR-008
</requirements>

## Subtasks

- [x] 11.1 Implement `src/hooks/useStorageSync.ts` with write-through + ADR-008 controlled guard
- [x] 11.2 Wire image upload optimistic flow into InsertImage dialog, drag-drop, and paste handlers
- [x] 11.3 Implement `exportAsHtml()` + `exportAsMarkdown()` on EditorAPI + download helpers
- [x] 11.4 Add print support via `@media print` CSS + `window.print()` call
- [x] 11.5 Implement sticky toolbar CSS + `ToolbarConfig.sticky` flag
- [x] 11.6 Implement custom `BobmdTheme` object → inline CSS variable application
- [x] 11.7 Wire all features into `BobEditor.tsx` and write integration tests

## Implementation Details

See TechSpec 'Data Models' → Storage Payload for the storage key/value format and session disable behavior, ADR-008 for the full controlled-vs-storage semantics decision. TechSpec Integration Points table for the `onImageUpload` boundary and error contract.

Key constraints:

- Storage: raw markdown string stored under `storageKey` prop (default `"markdown-editor-content"`); no JSON wrapper in v1.0.
- Image upload optimistic: the placeholder is a syntactically valid markdown image so the preview renders it immediately; the placeholder must be uniquely identifiable (e.g., append a nonce) to allow clean replacement.
- Paste detection: check `e.clipboardData.files[0].type.startsWith('image/')` before routing to upload.
- `exportAsHtml()`: use `react-dom/server` `renderToStaticMarkup` on the last rendered pipeline output (or re-run pipeline); the result must pass the same XSS sanitize pass.
- Custom theme: only `--mde-*` prefixed keys from the `BobmdTheme` object should be applied; unknown keys are silently ignored.
- Storage write-through in controlled mode: still writes (useful for crash recovery) but NEVER reads on mount. The dev warning appears exactly once per mount.

### Relevant Files

- `packages/bob-editor/src/hooks/useStorageSync.ts` — create
- `packages/bob-editor/src/BobEditor.tsx` (task_07) — update: wire useStorageSync, drag-drop handlers, theme, enableExport
- `packages/bob-editor/src/components/Dialogs/InsertImage.tsx` (task_08) — update: add file input + upload flow
- `packages/bob-editor/src/components/Editor/MonacoEditor.tsx` (task_07) — update: paste handler
- `packages/bob-editor/src/components/Editor/TextareaFallback.tsx` (task_07) — update: paste handler
- `packages/bob-editor/src/core/editorApi.ts` (task_04) — update: add exportAsHtml + exportAsMarkdown
- `packages/bob-editor/src/styles/print.css` — create
- `packages/bob-editor/tests/integration/storage.test.tsx` — create
- `packages/bob-editor/tests/integration/imageUpload.test.tsx` — create
- `packages/bob-editor/tests/integration/export.test.tsx` — create

### Dependent Files

- `apps/playground/src/scenarios/storage.tsx` (task_12) — demonstrates localStorage persistence
- `apps/playground/src/scenarios/image-upload.tsx` (task_12) — demonstrates upload + MSW mock
- `apps/playground/src/scenarios/export.tsx` (task_12) — demonstrates export + download

### Related ADRs

- [ADR-008: Controlled value always wins; storage is write-through and restores only when uncontrolled](adrs/adr-008.md) — Defines the exact controlled vs storage semantics this task implements

## Deliverables

- `src/hooks/useStorageSync.ts`
- Image upload optimistic flow (InsertImage, drag-drop, paste)
- `exportAsHtml()` + `exportAsMarkdown()` on EditorAPI + download helpers
- Print support CSS
- Sticky toolbar
- Custom `BobmdTheme` support
- Integration tests for storage, image upload, export with 80%+ coverage **(REQUIRED)**
- Changeset entry for v0.5.0

## Tests

- Unit tests:
  - [ ] `useStorageSync` uncontrolled mode on mount: reads from `localStorage.getItem(storageKey)` and dispatches `content/setMarkdown` with restored value
  - [ ] `useStorageSync` controlled mode on mount: does NOT call `localStorage.getItem`; emits `console.warn` once
  - [ ] `useStorageSync` on content change: calls `localStorage.setItem(storageKey, markdown)` after `autoSaveInterval` debounce
  - [ ] `QuotaExceededError` from `localStorage.setItem`: dispatches `storage/error`; subsequent writes are skipped
  - [ ] `exportAsHtml()`: returns an HTML string containing `<h1>Hello</h1>` when markdown is `# Hello`
  - [ ] `exportAsHtml()` output: does not contain `<script>` tags (sanitized)
  - [ ] `exportAsMarkdown()`: returns the raw markdown string unchanged
- Integration tests:
  - [ ] Image upload success: MSW intercepts upload; placeholder replaced with final image; preview shows image
  - [ ] Image upload failure: MSW returns 500; placeholder removed; `onError` called with upload error
  - [ ] Drag-drop image: `DragEvent` with image file dispatched to root; upload flow triggered
  - [ ] Paste image: `ClipboardEvent` with image file; upload flow triggered; confirmed via `onImageUpload` spy
  - [ ] Storage restore: mount with no `value` prop and localStorage pre-seeded; textarea shows stored content
  - [ ] Controlled + storage: mount with `value` prop + `storage` prop; content is `value`, not stored content; `console.warn` emitted once
  - [ ] Export HTML button: triggers download with `.html` extension; `document.createElement('a').click` called (mocked)
  - [ ] Custom `BobmdTheme` prop `{ '--mde-bg': '#fff' }`: root element style has `--mde-bg: #fff`
  - [ ] Sticky toolbar: `ToolbarConfig.sticky: true` adds `position: sticky` to toolbar element
  - [ ] A11y: `expect(container).toHaveNoViolations()` for export section and toolbar variants
- Test coverage target: >=80%
- All tests must pass

## Success Criteria

- All tests passing
- Test coverage >=80%
- Controlled + storage warning emitted exactly once (not on every render)
- Image upload optimistic flow: success replaces placeholder, failure rolls back cleanly
- `exportAsHtml()` output is sanitized (no XSS)
- `pnpm -r build && pnpm -r test && pnpm -r typecheck && pnpm -r lint` pass
- v0.5.0 Changeset entry created
