---
status: pending
title: Plugin manager + shortcut manager
type: backend
complexity: medium
dependencies:
  - task_04
  - task_05
---

# Task 6: Plugin manager + shortcut manager

## Overview

Implement the two manager modules that wire plugin contributions and keyboard shortcuts into the pipeline and UI. `pluginManager` handles registration order, lifecycle invocation (`onMount`, `onChange`, `onBeforeParse`, `onAfterRender`), sanitize schema contribution, and cleanup. `shortcutManager` parses `Mod+<key>` syntax cross-platform, manages override/disable by stable ID, and scopes shortcuts to the active editor element. Both modules are pure (no React) and fully unit-tested before being wired into the component in task_07.

<critical>
- ALWAYS READ the PRD and TechSpec before starting
- REFERENCE TECHSPEC for implementation details — do not duplicate here
- FOCUS ON "WHAT" — describe what needs to be accomplished, not how
- MINIMIZE CODE — show code only to illustrate current structure or problem areas
- TESTS REQUIRED — every task MUST include tests in deliverables
</critical>

<requirements>
- MUST implement `src/core/pluginManager.ts` with: `register(plugins, api)` → sorted plugin list; `invokeOnMount(plugins, api)` → returns cleanup array; `invokeCleanup(cleanups)` → calls each exactly once; `invokeOnChange(plugins, value, api)` with recursion-depth guard (depth > 2 triggers dev warn); `invokeOnBeforeParse(plugins, markdown)` → chained transforms; `invokeOnAfterRender(plugins, hast)` → chained hast transforms
- MUST guarantee lifecycle invocation order matches registration order for all hooks
- MUST detect conflicting toolbar button IDs across plugins and throw a documented error (not a silent override)
- MUST implement `src/core/shortcutManager.ts` with: `parse(shortcut: string)` normalizing `Mod` to `Meta` on macOS and `Ctrl` elsewhere (detect via `navigator.platform` / `navigator.userAgent`); `register(shortcuts, handler)` attaches a single `keydown` listener; `override(id, newShortcut)` replaces by stable ID; `disable(id)` removes by stable ID; `destroy()` removes all listeners
- MUST collect `sanitizeSchema` from each plugin during registration and call `mergeSanitizeSchema` from task_05 to build the active schema
- MUST NOT import React in `pluginManager.ts` or `shortcutManager.ts`
- SHOULD export `createPluginManager()` and `createShortcutManager()` factory functions so each `<BobEditor />` instance has isolated state
</requirements>

## Subtasks

- [ ] 6.1 Write pluginManager unit tests covering lifecycle order and cleanup — TDD red phase
- [ ] 6.2 Implement `src/core/pluginManager.ts` — TDD green phase
- [ ] 6.3 Write shortcutManager unit tests (Mod normalization, override, disable) — TDD red phase
- [ ] 6.4 Implement `src/core/shortcutManager.ts` — TDD green phase
- [ ] 6.5 Verify: sanitize schema contributions from plugins merge correctly via `mergeSanitizeSchema`

## Implementation Details

See TechSpec 'System Architecture' → Component Overview for the plugin/shortcut manager role in the data flow, and ADR-003 for the `EditorAPI` object these managers receive.

Key constraints:
- `invokeOnMount` returns cleanup functions returned by each plugin's `onMount`; cleanups are stored and called in reverse order on unmount (consistent with React's cleanup semantics).
- `invokeOnChange` must track recursion depth via a counter that increments on entry and decrements on exit; the guard fires `console.warn` at depth > 2 but does NOT throw (to avoid crashing the editor on third-party plugin bugs).
- `shortcutManager`: attach a single `keydown` listener to the document (not per-shortcut) and dispatch by matching; `Mod` normalization must be testable by mocking `navigator.platform`.
- Conflicting toolbar button IDs: two plugins each declaring a button with the same `id` must produce an `Error` with a message naming the conflicting plugins.

### Relevant Files

- `packages/bob-editor/src/core/pluginManager.ts` — create
- `packages/bob-editor/src/core/shortcutManager.ts` — create
- `packages/bob-editor/tests/unit/pluginManager.test.ts` — create
- `packages/bob-editor/tests/unit/shortcutManager.test.ts` — create
- `packages/bob-editor/src/core/sanitize/merge.ts` (task_05) — called during plugin registration
- `packages/bob-editor/src/core/editorApi.ts` (task_04) — passed to `invokeOnMount`

### Dependent Files

- `src/BobEditor.tsx` (task_07) — creates managers per instance, calls `invokeOnMount` in effect, `invokeCleanup` on unmount
- `src/components/Toolbar/` (task_08) — reads toolbar button contributions from plugin manager
- All plugin files (task_09, task_10) — registered via pluginManager

### Related ADRs

- [ADR-003: Central useReducer + Context with imperative EditorAPI](adrs/adr-003.md) — Explains why EditorAPI is passed to plugins (not context)
- [ADR-004: GitHub sanitize schema + plugin-contributed extensions](adrs/adr-004.md) — Plugin sanitizeSchema contribution merged at registration

## Deliverables

- `src/core/pluginManager.ts` with all lifecycle hooks
- `src/core/shortcutManager.ts` with Mod normalization, override, disable
- Unit tests for both managers with 80%+ coverage **(REQUIRED)**

## Tests

- Unit tests:
  - [ ] `invokeOnMount([pluginA, pluginB], api)`: pluginA.onMount called before pluginB.onMount (order preserved)
  - [ ] `invokeCleanup([cleanupA, cleanupB])`: each cleanup called exactly once, in reverse order
  - [ ] `invokeOnChange` with plugin that dispatches within `onChange`: recursion counter reaches 3 and emits `console.warn`
  - [ ] `invokeOnBeforeParse([pluginA, pluginB], markdown)`: result is markdown piped through pluginA.onBeforeParse then pluginB.onBeforeParse
  - [ ] Conflicting toolbar button IDs: registering two plugins with button `id: "bold"` throws an Error mentioning both plugin names
  - [ ] `mergeSanitizeSchema` called with plugin schema contributions during registration: active schema contains plugin-added tag
  - [ ] `shortcutManager.parse("Mod+B")` on macOS (mocked `navigator.platform = "MacIntel"`): returns `{ key: "b", meta: true, ctrl: false }`
  - [ ] `shortcutManager.parse("Mod+B")` on Linux (mocked `navigator.platform = "Linux"`): returns `{ key: "b", meta: false, ctrl: true }`
  - [ ] `shortcutManager.override("bold", "Ctrl+Shift+B")`: pressing Ctrl+Shift+B triggers bold handler; original Ctrl+B does not
  - [ ] `shortcutManager.disable("bold")`: pressing Ctrl+B does not trigger bold handler
  - [ ] `shortcutManager.destroy()`: removes all keydown listeners (assert via `removeEventListener` spy)
- Integration tests:
  - [ ] Full plugin lifecycle: mount → onChange fires → unmount triggers cleanup — all in correct order
  - [ ] Two `createShortcutManager()` instances: each has isolated state (disabling in one does not affect the other)
- Test coverage target: >=80%
- All tests must pass

## Success Criteria

- All tests passing
- Test coverage >=80%
- Plugin lifecycle order is deterministic and matches registration order
- Cleanup runs exactly once on unmount (no memory leaks)
- `Mod` resolves correctly for macOS and Linux/Windows (tested with mocked platform)
- No React imports in either manager module
- `tsc --noEmit` zero errors
