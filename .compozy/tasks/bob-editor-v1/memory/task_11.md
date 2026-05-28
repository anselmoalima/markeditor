# Task Memory: task_11.md

Keep only task-local execution context here. Do not duplicate facts that are obvious from the repository, task file, PRD documents, or git history.

## Objective Snapshot

Implement Phase 5 features for v0.5.0:

1. `useStorageSync` hook with write-through + ADR-008 semantics
2. Image upload optimistic flow (InsertImage dialog, drag-drop, paste)
3. `exportAsHtml()` + `exportAsMarkdown()` (already wired in BobEditor.tsx via useImperativeHandle) + download helpers
4. Print CSS (`styles/print.css`)
5. Sticky toolbar CSS + `ToolbarConfig.sticky` flag
6. Custom `BobmdTheme` → `toStyleObject` must filter to `--mde-*` keys only
7. Integration tests: storage, imageUpload, export

## Important Decisions

- `exportAsHtml()` and `exportAsMarkdown()` already implemented in BobEditor.tsx useImperativeHandle. Just add download helpers + export UI.
- `toStyleObject()` currently copies ALL keys from BobmdTheme. Must update to filter `--mde-*` keys only per requirements.
- Image upload nonce format: `![Uploading...](data:image/upload-NONCE)` — unique per upload, string-replaceable.
- Storage enabled logic: `storage !== undefined && storage.enabled !== false`.
- Pass `onUploadFile` to InsertImage; keep upload logic in BobEditor.tsx (cleaner boundary).
- Pass `onPasteFile` through Editor/index.tsx → MonacoEditor + TextareaFallback.
- Export buttons: pass `onExportHtml/Markdown/Print` callbacks to Toolbar props.
- Sticky toolbar: Toolbar gets `sticky` class when `ToolbarConfig.sticky === true`.

## Files / Surfaces

**CREATE:**

- `packages/bob-editor/src/hooks/useStorageSync.ts`
- `packages/bob-editor/src/utils/download.ts`
- `packages/bob-editor/src/styles/print.css`
- `packages/bob-editor/tests/integration/storage.test.tsx`
- `packages/bob-editor/tests/integration/imageUpload.test.tsx`
- `packages/bob-editor/tests/integration/export.test.tsx`
- `.changeset/bob-editor-v0.5.0.md`

**UPDATE:**

- `packages/bob-editor/src/styles/index.css` — sticky toolbar CSS + @import print.css
- `packages/bob-editor/src/components/Toolbar/index.tsx` — sticky class, export buttons
- `packages/bob-editor/src/components/Dialogs/InsertImage.tsx` — file upload input
- `packages/bob-editor/src/components/Editor/index.tsx` — `onPasteFile` prop
- `packages/bob-editor/src/components/Editor/MonacoEditor.tsx` — paste handler
- `packages/bob-editor/src/components/Editor/TextareaFallback.tsx` — paste handler
- `packages/bob-editor/src/BobEditor.tsx` — useStorageSync, drag-drop, export, upload wiring

## Errors / Corrections

1. **jsdom localStorage un-spyable**: `vi.spyOn(window.localStorage, 'getItem')` silently fails — 0 calls recorded. Fix: `vi.stubGlobal('localStorage', {...})` works; for read assertions use behavior checks (textarea value); for writes use `waitFor(() => localStorage.getItem(key) === value)`.

2. **vi.useFakeTimers() + React 18**: With fake timers, React 18 scheduler effects don't fire during `act()`. Removed fake timers entirely; use real timers + `waitFor` + short debounce (50ms).

3. **StatusBar setInterval(5000ms)**: `vi.runAllTimersAsync()` hits 10,000 timer limit infinite loop. Never run all timers if fake timers are active with StatusBar.

4. **exactOptionalPropertyTypes**: Optional fields `prop?: Type` cannot be passed `undefined` explicitly. Fix: add `| undefined` to interface field type.

5. **ToolbarProps.onExportHtml async return**: Changed to `(() => void | Promise<void>) | undefined`.

6. **Pre-existing flaky test**: `build-artifacts.test.ts > playground smoke test` always fails without running dev server. Not caused by task_11.

## Verification Results

- Build: ✅ exit 0
- Typecheck: ✅ 0 errors
- Lint: ✅ 0 warnings
- Tests: 353 passed, 1 failed (pre-existing smoke test — unrelated)
- Coverage: 89.64% lines / 79.93% branches / 82.86% functions (all above thresholds)

## Status: DONE
