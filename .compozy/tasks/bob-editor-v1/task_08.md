---
status: pending
title: Toolbar + modals + default shortcuts + i18n base (v0.2.0)
type: frontend
complexity: high
dependencies:
  - task_07
---

# Task 8: Toolbar + modals + default shortcuts + i18n base (v0.2.0)

## Overview

Implement the configurable toolbar with all default buttons from PRD §5.4.2, the four dialog modals (Insert Link, Insert Image, Insert Table, Shortcuts Help), all default keyboard shortcuts from PRD §5.6.1, and the i18n system with English and pt-BR catalogs. This is the second publicly releasable milestone (v0.2.0), completing the "full editing interface" layer on top of the MVP core.

<critical>
- ALWAYS READ the PRD and TechSpec before starting
- REFERENCE TECHSPEC for implementation details — do not duplicate here
- FOCUS ON "WHAT" — describe what needs to be accomplished, not how
- MINIMIZE CODE — show code only to illustrate current structure or problem areas
- TESTS REQUIRED — every task MUST include tests in deliverables
</critical>

<requirements>
- MUST implement `src/components/Toolbar/index.tsx` rendering buttons from `ToolbarConfig` + plugin contributions; must support `toolbar: false` (hide), `toolbar: true` (all defaults), and `toolbar: ToolbarConfig` (custom)
- MUST implement overflow menu in Toolbar that activates below 600 px container width (use `ResizeObserver`)
- MUST implement `src/components/Toolbar/ToolbarButton.tsx` with `aria-label`, `aria-pressed`, `aria-disabled`; navigable by Tab and Arrow keys
- MUST implement four modals in `src/components/Dialogs/`: `InsertLink`, `InsertImage`, `InsertTable`, `ShortcutsHelp` — each must trap focus, close on Esc, and render `aria-modal="true"` with a `<dialog>` element or focus-trap equivalent
- MUST implement all default keyboard shortcuts from PRD §5.6.1: bold (Mod+B), italic (Mod+I), strikethrough (Mod+Shift+X), heading (Mod+1–6), link (Mod+K), image (Mod+Shift+I), code (Mod+`), codeblock (Mod+Shift+`), blockquote (Mod+Shift+>), ordered list (Mod+Shift+7), unordered list (Mod+Shift+8), task list (Mod+Shift+9), undo (Mod+Z), redo (Mod+Shift+Z), save (Mod+S → `onSave`), help (Ctrl+?)
- MUST implement `src/i18n/en.ts` (English catalog — full `I18nMessages` type), `src/i18n/pt-BR.ts` (Portuguese — structurally complete subset), `src/i18n/index.ts` resolver
- MUST add `StatusBar.tsx` showing word count (debounced) and "saved X ago" display
- MUST implement `src/components/Dialogs/ShortcutsHelp.tsx` listing all active shortcuts (including overrides)
- MUST implement `src/hooks/useMonacoPrefetch.ts` that pre-fetches Monaco on editor focus before the user actually enters edit mode
- MUST wire `locale` + `i18n` props in `BobEditor.tsx` to provide localized labels to toolbar, modals, and status bar
- MUST allow shortcuts to be overridden or disabled via `shortcuts: { override, disable }` prop, delegating to `shortcutManager`
</requirements>

## Subtasks

- [ ] 8.1 Implement `src/components/Toolbar/index.tsx` + `ToolbarButton.tsx` with keyboard navigation and overflow
- [ ] 8.2 Implement `src/components/Dialogs/InsertLink.tsx`, `InsertImage.tsx`, `InsertTable.tsx`
- [ ] 8.3 Implement `src/components/Dialogs/ShortcutsHelp.tsx` (dynamic shortcut list)
- [ ] 8.4 Register all PRD §5.6.1 default shortcuts via `shortcutManager` in BobEditor
- [ ] 8.5 Implement `src/i18n/en.ts` + `pt-BR.ts` + `index.ts` resolver
- [ ] 8.6 Implement `src/components/StatusBar.tsx` (word count + saved-at)
- [ ] 8.7 Implement `src/hooks/useMonacoPrefetch.ts`
- [ ] 8.8 Wire locale/i18n + shortcuts props in `BobEditor.tsx`
- [ ] 8.9 Write integration tests for all toolbar buttons, modals, shortcuts

## Implementation Details

See TechSpec 'System Architecture' and PRD §5.4.2 (toolbar button list), §5.6.1 (default shortcuts), §5.9 (i18n). ADR-003 explains how toolbar reads EditorAPI context.

Key constraints:
- Toolbar overflow: use `ResizeObserver` on the toolbar container; buttons that overflow move to an overflow `<button>` menu.
- Focus trap in dialogs: either use the native `<dialog>` element with `showModal()` or implement a manual focus-trap loop; Tab/Shift+Tab must cycle within the dialog; Esc closes.
- `I18nMessages` keys are exactly the exported type from task_03; `pt-BR.ts` must satisfy `Record<MessageKey, string>` — enforce via a type test that `pt-BR` is assignable to `I18nMessages`.
- StatusBar word count: uses `debounce` from task_05 to avoid recount on every keystroke.
- `useMonacoPrefetch`: starts Monaco's dynamic import on `focus` event on the editor container; idempotent (does not re-fetch if already loaded).

### Relevant Files

- `packages/bob-editor/src/components/Toolbar/index.tsx` — create
- `packages/bob-editor/src/components/Toolbar/ToolbarButton.tsx` — create
- `packages/bob-editor/src/components/Dialogs/InsertLink.tsx` — create
- `packages/bob-editor/src/components/Dialogs/InsertImage.tsx` — create
- `packages/bob-editor/src/components/Dialogs/InsertTable.tsx` — create
- `packages/bob-editor/src/components/Dialogs/ShortcutsHelp.tsx` — create
- `packages/bob-editor/src/i18n/en.ts` — create
- `packages/bob-editor/src/i18n/pt-BR.ts` — create
- `packages/bob-editor/src/i18n/index.ts` — create
- `packages/bob-editor/src/components/StatusBar.tsx` — create
- `packages/bob-editor/src/hooks/useMonacoPrefetch.ts` — create
- `packages/bob-editor/src/BobEditor.tsx` (task_07) — update to wire toolbar, i18n, shortcuts props
- `packages/bob-editor/tests/integration/Toolbar.test.tsx` — create
- `packages/bob-editor/tests/integration/Dialogs.test.tsx` — create
- `packages/bob-editor/tests/type/i18n.test-d.ts` — create (pt-BR assignable to I18nMessages)

### Dependent Files

- `src/BobEditor.tsx` — updated to accept `toolbar`, `shortcuts`, `locale`, `i18n` props
- `src/plugins/builtin/` (task_09) — plugins add toolbar buttons via pluginManager

### Related ADRs

- [ADR-003: Central useReducer + Context with imperative EditorAPI](adrs/adr-003.md) — Toolbar reads EditorAPI from BobEditorApiContext to call insertText, wrapSelection, etc.

## Deliverables

- `src/components/Toolbar/` (index + ToolbarButton)
- `src/components/Dialogs/` (InsertLink, InsertImage, InsertTable, ShortcutsHelp)
- `src/i18n/` (en, pt-BR, resolver)
- `src/components/StatusBar.tsx`
- `src/hooks/useMonacoPrefetch.ts`
- Integration tests for toolbar, modals, shortcuts with 80%+ coverage **(REQUIRED)**
- Changeset entry for v0.2.0

## Tests

- Unit tests:
  - [ ] Toolbar with `toolbar: false`: no toolbar element rendered
  - [ ] Toolbar with `toolbar: true`: all default button IDs present in DOM
  - [ ] Toolbar overflow at 500 px container width: overflow button appears; hidden buttons accessible via overflow menu
  - [ ] ToolbarButton `aria-pressed` reflects toggle state (e.g., bold active when selection is bold)
  - [ ] Toolbar keyboard navigation: pressing ArrowRight moves focus to next button
  - [ ] i18n resolver: `resolveMessage("bold", "pt-BR", catalog)` returns Portuguese label
  - [ ] `pt-BR` catalog is structurally complete: every key in `en` is also in `pt-BR` (type test)
  - [ ] Switching `locale` prop from `"en"` to `"pt-BR"` at runtime updates toolbar tooltips
- Integration tests:
  - [ ] Bold button click: `wrapSelection("**", "**")` called; selected text wrapped in `**`
  - [ ] Mod+B shortcut: same result as bold button click (with mocked `navigator.platform`)
  - [ ] InsertLink modal: opens on Mod+K; Enter with URL and label inserts `[label](url)` at cursor; Esc closes without insertion
  - [ ] InsertTable modal: opens and inserts markdown table with selected rows × columns
  - [ ] ShortcutsHelp modal: opens on Ctrl+?; lists all active shortcuts including overridden ones
  - [ ] Focus trap in dialogs: Tab cycles within InsertLink modal; Esc closes
  - [ ] `shortcuts.disable("bold")`: Mod+B no longer wraps selection
  - [ ] `shortcuts.override("bold", { key: "Mod+Shift+B" })`: Mod+Shift+B wraps selection; old Mod+B does not
  - [ ] `onSave` prop: Mod+S calls `onSave(currentMarkdown)` once
  - [ ] A11y: `expect(container).toHaveNoViolations()` for toolbar, each modal, both themes (jest-axe)
- Test coverage target: >=80%
- All tests must pass

## Success Criteria

- All tests passing
- Test coverage >=80%
- All PRD §5.4.2 toolbar buttons render and function
- All PRD §5.6.1 shortcuts fire correct actions
- All modals trap focus and close on Esc
- pt-BR i18n catalog is structurally complete (type test passes)
- `pnpm -r build && pnpm -r test && pnpm -r typecheck && pnpm -r lint` pass
- v0.2.0 Changeset entry created
