---
status: pending
title: Public type surface + type tests
type: frontend
complexity: medium
dependencies:
  - task_02
---

# Task 3: Public type surface + type tests

## Overview

Define the complete public TypeScript API in `src/types.ts` and lock it with `expect-type` regression tests before any implementation code is written. This task establishes the API contract that all other tasks depend on; changes here require updating the type tests, acting as a breaking-change gate for the library's public surface.

<critical>
- ALWAYS READ the PRD and TechSpec before starting
- REFERENCE TECHSPEC for implementation details — do not duplicate here
- FOCUS ON "WHAT" — describe what needs to be accomplished, not how
- MINIMIZE CODE — show code only to illustrate current structure or problem areas
- TESTS REQUIRED — every task MUST include tests in deliverables
</critical>

<requirements>
- MUST define all public interfaces in `packages/bob-editor/src/types.ts` exactly as specified in TechSpec 'Core Interfaces': `BobEditorProps`, `BobEditorRef`, `EditorAPI`, `BobEditorPlugin`, `KeyboardShortcut`, `ToolbarButton`, `ToolbarConfig`, `ExportConfig`, `BobmdTheme`, `I18nMessages`, `EditorMode`, `StorageConfig`
- MUST define internal types `BobEditorState` and `Action` discriminated union (not exported) — keep in `src/core/state/types.ts`; internal types MUST NOT appear in `src/types.ts`
- MUST re-export all public types from `src/index.ts` under named exports
- MUST write `tests/type/props.test-d.ts` asserting structural correctness of `BobEditorProps` using `expect-type`
- MUST write `tests/type/api.test-d.ts` asserting `BobEditorRef` and `EditorAPI` method signatures
- MUST write `tests/type/plugin.test-d.ts` asserting `BobEditorPlugin`, `KeyboardShortcut`, `ToolbarButton` shapes
- MUST ensure `tsc --noEmit` passes with zero errors on all types
- SHOULD mark internal-only types with `@internal` JSDoc; do not expose them in the public API
- MUST NOT implement any logic — types only in this task
</requirements>

## Subtasks

- [ ] 3.1 Write `src/types.ts` with all public interfaces from TechSpec Core Interfaces section
- [ ] 3.2 Write `src/core/state/types.ts` with internal `BobEditorState` and `Action` discriminated union
- [ ] 3.3 Update `src/index.ts` to re-export all public types
- [ ] 3.4 Write `tests/type/props.test-d.ts` — `BobEditorProps` structural assertions
- [ ] 3.5 Write `tests/type/api.test-d.ts` — `BobEditorRef` + `EditorAPI` method signature assertions
- [ ] 3.6 Write `tests/type/plugin.test-d.ts` — `BobEditorPlugin`, `KeyboardShortcut`, `ToolbarButton` assertions
- [ ] 3.7 Run `pnpm --filter bob-editor test:types` and confirm zero type errors

## Implementation Details

See TechSpec 'Core Interfaces' section for the exact interface definitions. Do not copy them here — reference TechSpec directly.

Key constraints:
- `BobEditorProps.sanitize` accepts `boolean | Schema | ((merged: Schema) => Schema)` where `Schema` comes from `rehype-sanitize`.
- `BobEditorProps.plugins` is `readonly BobEditorPlugin[]` — enforce immutability.
- `EditorAPI` is a separate interface from `BobEditorRef`; the ref exposes a narrower surface (see TechSpec).
- `BobEditorPlugin.sanitizeSchema` type is `SchemaExtension` — define or import from `rehype-sanitize`.
- All `onMount`, `onChange` etc. on `BobEditorPlugin` are optional.
- `i18n` messages type: `Record<MessageKey, string>` where `MessageKey` is a string literal union from the English catalog — defer the full catalog to task_08 but define the shape here.

### Relevant Files

- `packages/bob-editor/src/types.ts` — public type surface (create)
- `packages/bob-editor/src/core/state/types.ts` — internal state types (create)
- `packages/bob-editor/src/index.ts` — public entry (update to re-export)
- `packages/bob-editor/tests/type/props.test-d.ts` — create
- `packages/bob-editor/tests/type/api.test-d.ts` — create
- `packages/bob-editor/tests/type/plugin.test-d.ts` — create

### Dependent Files

- `src/core/state/reducer.ts` (task_04) — uses `BobEditorState` and `Action`
- `src/core/editorApi.ts` (task_04) — implements `EditorAPI`
- `src/BobEditor.tsx` (task_07) — implements `BobEditorProps` and `BobEditorRef`
- All plugin files (task_09, task_10) — implement `BobEditorPlugin`

### Related ADRs

- [ADR-003: Central useReducer + Context with imperative EditorAPI](adrs/adr-003.md) — Explains why `EditorAPI` and `BobEditorRef` are separate interfaces

## Deliverables

- `src/types.ts` with complete public type surface
- `src/core/state/types.ts` with internal types
- Updated `src/index.ts` re-exporting all public types
- `tests/type/props.test-d.ts`, `api.test-d.ts`, `plugin.test-d.ts`
- Type tests with 80%+ coverage **(REQUIRED)**
- `tsc --noEmit` passing with zero errors

## Tests

- Unit tests:
  - [ ] `BobEditorProps.value` is `string | undefined` (not required)
  - [ ] `BobEditorProps.onChange` is `((value: string) => void) | undefined`
  - [ ] `BobEditorProps.plugins` is `readonly BobEditorPlugin[]` (readonly array)
  - [ ] `BobEditorRef.getValue()` returns `string`
  - [ ] `BobEditorRef.setValue(value: string)` returns `void`
  - [ ] `EditorAPI.wrapSelection(before: string, after: string)` exists with correct signature
  - [ ] `BobEditorPlugin.name` is required `string`
  - [ ] `BobEditorPlugin.onMount` is optional and accepts `(api: EditorAPI) => void | (() => void)`
  - [ ] `EditorMode` is `"edit" | "preview"` union (not a broader string)
  - [ ] Types from `src/index.ts` are assignable: `const p: BobEditorProps = {}` (all props optional)
- Integration tests:
  - [ ] `pnpm --filter bob-editor typecheck` exits 0 with zero errors
  - [ ] `pnpm --filter bob-editor test:types` (vitest --typecheck) exits 0
- Test coverage target: >=80%
- All tests must pass

## Success Criteria

- All tests passing
- Test coverage >=80%
- `tsc --noEmit` zero errors
- `pnpm --filter bob-editor test:types` passes
- All public interfaces match TechSpec Core Interfaces exactly
- No implementation code exists — types and test files only
