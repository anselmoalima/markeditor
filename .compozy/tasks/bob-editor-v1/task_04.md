---
status: completed
title: Core state — reducer, contexts, EditorAPI factory
type: frontend
complexity: high
dependencies:
  - task_03
---

# Task 4: Core state — reducer, contexts, EditorAPI factory

## Overview

Implement the central state layer: a `useReducer`-based state machine with split React Contexts, and a stable `EditorAPI` factory object. This is the single source of truth for all markdown content, mode, selection, and status — consumed by the toolbar, plugins, ref handle, and the preview pipeline. Must be fully unit-tested before task_07 assembles the component.

<critical>
- ALWAYS READ the PRD and TechSpec before starting
- REFERENCE TECHSPEC for implementation details — do not duplicate here
- FOCUS ON "WHAT" — describe what needs to be accomplished, not how
- MINIMIZE CODE — show code only to illustrate current structure or problem areas
- TESTS REQUIRED — every task MUST include tests in deliverables
</critical>

<requirements>
- MUST implement `src/core/state/reducer.ts` handling all action types from `Action` discriminated union defined in task_03 internal types
- MUST implement `src/core/state/contexts.tsx` with TWO separate contexts: `BobEditorStateContext` (state slice, causes re-renders) and `BobEditorApiContext` (stable API object, never triggers re-renders on state change)
- MUST implement `src/core/state/useEditorContext.ts` hook that reads from both contexts with appropriate selectors
- MUST implement `src/core/editorApi.ts` `createEditorApi(dispatch, getState, editorRef)` factory returning a stable `EditorAPI` object; methods read live refs, never close over state snapshots
- MUST implement `src/hooks/useControllableState.ts`: resolves controlled (`value` prop defined) vs uncontrolled (internal reducer); always calls `onChange` on user mutations; never reads storage
- MUST implement `src/core/state/index.ts` barrel exporting the context providers and hooks
- MUST write unit tests for reducer covering every action type before implementing the reducer (TDD red phase)
- MUST guard against plugin `onChange` recursion: track recursion depth in a ref; emit dev-mode `console.warn` when depth > 2
- MUST handle `storage/error` action by disabling future storage writes for the session (see TechSpec Data Models)
- MUST NOT let any component (toolbar, Monaco) import directly from reducer — all mutations go through `dispatch` obtained from the API context
</requirements>

## Subtasks

- [x] 4.1 Write reducer unit tests (all action types) — TDD red phase
- [x] 4.2 Implement `src/core/state/reducer.ts` — TDD green phase
- [x] 4.3 Implement `src/core/state/contexts.tsx` with split BobEditorStateContext + BobEditorApiContext
- [x] 4.4 Implement `src/core/state/useEditorContext.ts` selector hook
- [x] 4.5 Implement `src/core/editorApi.ts` stable EditorAPI factory
- [x] 4.6 Implement `src/hooks/useControllableState.ts` controlled/uncontrolled resolver
- [x] 4.7 Verify: toolbar and plugin consumers can read state without triggering keypress-level re-renders

## Implementation Details

See TechSpec 'Core Interfaces' → Data Models for `BobEditorState` and `Action` types, and ADR-003 'Implementation Notes' for context split rationale and Monaco ref integration pattern.

Key constraints:

- Split contexts prevent toolbar/plugins from re-rendering on every keystroke: `BobEditorApiContext` value is the same object reference across renders; only `BobEditorStateContext` changes.
- `EditorAPI.insertText` delegates to Monaco `editor.executeEdits` when `editorRef.current` is non-null; falls back to string-splice when Monaco is absent (textarea mode or SSR).
- `useControllableState`: when `value` prop is defined, always return it as current value; dispatch `content/setMarkdown` with `source: 'api'` to update internal state so `onChange` fires; never read from storage in controlled mode.
- Reducer must be a pure function with no side effects.

### Relevant Files

- `packages/bob-editor/src/core/state/reducer.ts` — create
- `packages/bob-editor/src/core/state/contexts.tsx` — create
- `packages/bob-editor/src/core/state/useEditorContext.ts` — create
- `packages/bob-editor/src/core/state/index.ts` — create (barrel)
- `packages/bob-editor/src/core/editorApi.ts` — create
- `packages/bob-editor/src/hooks/useControllableState.ts` — create
- `packages/bob-editor/src/core/state/types.ts` — written in task_03, extended here
- `packages/bob-editor/tests/unit/reducer.test.ts` — create (write first, TDD)
- `packages/bob-editor/tests/unit/editorApi.test.ts` — create

### Dependent Files

- `src/core/pluginManager.ts` (task_06) — calls `createEditorApi`
- `src/BobEditor.tsx` (task_07) — provides context, calls `useImperativeHandle`
- `src/components/Toolbar/` (task_08) — reads API context
- All plugin files (task_09, task_10) — receive `EditorAPI` via `onMount`

### Related ADRs

- [ADR-003: Central useReducer + Context with imperative EditorAPI](adrs/adr-003.md) — Core architectural decision this task implements

## Deliverables

- `src/core/state/reducer.ts` with all action handlers
- `src/core/state/contexts.tsx` with split context providers
- `src/core/state/useEditorContext.ts` selector hook
- `src/core/editorApi.ts` stable factory
- `src/hooks/useControllableState.ts`
- Unit tests for reducer and EditorAPI with 80%+ coverage **(REQUIRED)**

## Tests

- Unit tests:
  - [ ] `content/setMarkdown` action: state.markdown updates to payload; onChange is not called from reducer (side effects belong in component)
  - [ ] `mode/set` action with `EditorMode.preview`: state.mode becomes `"preview"`
  - [ ] `storage/error` action: subsequent reducer state sets a `storageDisabled: true` flag that prevents storage writes
  - [ ] `pipeline/error` action: state.pipeline.status becomes `"error"` and state.pipeline.error is set
  - [ ] `selection/set` action: state.selection updates with provided start/end/cursor
  - [ ] Reducer is pure: calling with same state + action always returns equal result
  - [ ] `useControllableState` with `value` prop: always returns `value` regardless of dispatch calls
  - [ ] `useControllableState` without `value` prop: returns internal state; updates on dispatch
  - [ ] `EditorAPI.insertText` with `atCursor: true` inserts at current cursor position (Monaco absent path)
  - [ ] Plugin onChange recursion: dispatching from inside onChange causes a dev warning at depth 3
- Integration tests:
  - [ ] `BobEditorStateContext` and `BobEditorApiContext` mounted with provider: consumer hook reads correct initial state
  - [ ] Multiple consumers of `BobEditorApiContext` do not re-render when markdown changes (referential stability)
- Test coverage target: >=80%
- All tests must pass

## Success Criteria

- All tests passing
- Test coverage >=80%
- Reducer passes all action-type tests written in TDD red phase
- `BobEditorApiContext` consumers do not re-render on keystroke (verified with `renderCount` assertions in integration test)
- `tsc --noEmit` zero errors
