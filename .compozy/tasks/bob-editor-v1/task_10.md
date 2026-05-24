---
status: pending
title: Opt-in built-in plugins — emoji, mentions, wordCount, TOC (v0.4.0)
type: frontend
complexity: medium
dependencies:
  - task_06
  - task_09
---

# Task 10: Opt-in built-in plugins — emoji, mentions, wordCount, TOC (v0.4.0)

## Overview

Implement the four opt-in built-in plugins (emoji, mentions, wordCount, tableOfContents) as individually importable `BobEditorPlugin` objects, each exported via its own subpath (`bob-editor/plugins/emoji`, etc.). Because they are opt-in (not in the default plugin list), consumers only download them if they import them. This is the fourth publicly releasable milestone (v0.4.0) and also the first real test of the plugin system's extensibility.

<critical>
- ALWAYS READ the PRD and TechSpec before starting
- REFERENCE TECHSPEC for implementation details — do not duplicate here
- FOCUS ON "WHAT" — describe what needs to be accomplished, not how
- MINIMIZE CODE — show code only to illustrate current structure or problem areas
- TESTS REQUIRED — every task MUST include tests in deliverables
</critical>

<requirements>
- MUST implement `src/plugins/emoji.ts`: `BobEditorPlugin` that transforms `:smile:` syntax to emoji characters in preview; adds a toolbar button (emoji picker or simple insert); NOT in default plugin list
- MUST implement `src/plugins/mentions.ts`: `BobEditorPlugin` that transforms `@username` to a styled link in preview; configurable `resolveMention(username) => { url, displayName }` via plugin factory; NOT in default plugin list
- MUST implement `src/plugins/wordCount.ts`: `BobEditorPlugin` that computes word count and character count in `onChange`; calls `api.showNotification` or exposes a React component via `components`; NOT in default plugin list
- MUST implement `src/plugins/tableOfContents.ts`: `BobEditorPlugin` that generates a TOC from heading slugs (from `rehype-slug`); exposes the TOC as a `onAfterRender` hast transform that inserts a TOC node; NOT in default plugin list
- MUST implement `src/plugins/index.ts` as a barrel re-exporting all four opt-in plugins plus the five default-on plugins from `builtin/`
- MUST configure `tsup.config.ts` (task_02) subpath entries so each plugin is independently tree-shakable: `bob-editor/plugins/emoji` imports ONLY the emoji code
- MUST verify that importing `bob-editor/plugins/emoji` does NOT pull in KaTeX or Mermaid (no cross-plugin bundling contamination)
- MUST write `examples/with-plugins.tsx` showing how to compose multiple opt-in plugins
- SHOULD implement `mentions.ts` as a factory: `createMentionsPlugin({ resolveMention })` returns a `BobEditorPlugin`; the `resolveMention` function is injected by the consumer
</requirements>

## Subtasks

- [ ] 10.1 Implement `src/plugins/emoji.ts` with remark plugin + optional toolbar button
- [ ] 10.2 Implement `src/plugins/mentions.ts` factory with configurable resolver
- [ ] 10.3 Implement `src/plugins/wordCount.ts` with onChange word/char count
- [ ] 10.4 Implement `src/plugins/tableOfContents.ts` with hast-level TOC insertion
- [ ] 10.5 Implement `src/plugins/index.ts` barrel + verify tsup subpath tree-shaking
- [ ] 10.6 Write `examples/with-plugins.tsx`
- [ ] 10.7 Write unit and integration tests for each plugin

## Implementation Details

See TechSpec 'System Architecture' → `plugins/` directory listing and PRD §5.5.4 (opt-in plugins list). Each plugin must conform to `BobEditorPlugin` from task_03; see TechSpec Core Interfaces for the full contract.

Key constraints:
- Each plugin file must be a valid tsup entry so `bob-editor/plugins/emoji` resolves to its own chunk without bundling other plugins.
- `wordCount.ts` uses `onChange` hook (not `onMount`) since word count changes with content; do not use a React side-effect inside the plugin — the `api.showNotification` call surfaces it.
- `tableOfContents.ts` uses `onAfterRender(hast)` to walk the hast tree, collect `h1-h6` nodes (already have `id` from `rehype-slug`), and prepend a `<nav aria-label="Table of contents"><ul>...</ul></nav>` hast node.
- Emoji: use a remark plugin (e.g., `remark-emoji`) or implement a simple shortcode-to-unicode map if the dependency is too heavy; the plugin must declare `sanitizeSchema` extension for any classes it adds.
- Verify tree-shaking: `size-limit` entry for `bob-editor/plugins/emoji` must be < 5 KB gzip if no emoji library is bundled (shortcode map approach); mention if a heavier dep is chosen.

### Relevant Files

- `packages/bob-editor/src/plugins/emoji.ts` — create
- `packages/bob-editor/src/plugins/mentions.ts` — create
- `packages/bob-editor/src/plugins/wordCount.ts` — create
- `packages/bob-editor/src/plugins/tableOfContents.ts` — create
- `packages/bob-editor/src/plugins/index.ts` — create (barrel)
- `packages/bob-editor/tsup.config.ts` (task_02) — verify subpath entries are present
- `packages/bob-editor/tests/unit/opt-in-plugins.test.ts` — create
- `examples/with-plugins.tsx` — create

### Dependent Files

- `apps/playground/src/scenarios/with-plugins.tsx` (task_12) — uses all four opt-in plugins
- `packages/bob-editor/package.json` (task_02) — `exports["./plugins/emoji"]` etc. must be declared

### Related ADRs

- [ADR-006: Lazy-load heavy renderers via content detection](adrs/adr-006.md) — Tree-shaking strategy ensures opt-in plugins don't inflate the core bundle

## Deliverables

- `src/plugins/emoji.ts`, `mentions.ts`, `wordCount.ts`, `tableOfContents.ts`
- `src/plugins/index.ts` barrel
- `examples/with-plugins.tsx`
- Unit and integration tests with 80%+ coverage **(REQUIRED)**
- Changeset entry for v0.4.0

## Tests

- Unit tests:
  - [ ] `emojiPlugin.remarkPlugins`: processing `":smile:"` markdown results in 😊 in the output
  - [ ] `createMentionsPlugin({ resolveMention: (u) => ({ url: '/u/' + u, displayName: u }) })`: `"@alice"` in markdown renders as a link to `/u/alice`
  - [ ] `wordCountPlugin.onChange`: called with `"hello world"` sets word count to 2 and char count to 11
  - [ ] `tableOfContentsPlugin.onAfterRender`: a hast tree with two `h2` nodes gets a `<nav>` node prepended containing two list items
  - [ ] Importing `bob-editor/plugins/emoji` does NOT export `MermaidDiagram` or `MathBlock` symbols
  - [ ] `emojiPlugin.sanitizeSchema`: after merge, any emoji-specific classes allowed without weakening security clauses
- Integration tests:
  - [ ] `<BobEditor plugins={[emojiPlugin]}>` in preview mode with `":tada:"`: emoji character visible in preview
  - [ ] `<BobEditor plugins={[createMentionsPlugin({...})]}>`: `@alice` renders as a link
  - [ ] `<BobEditor plugins={[wordCountPlugin]}>`: word count updates after typing
  - [ ] `<BobEditor plugins={[tableOfContentsPlugin]}>` with `# H1\n## H2\n### H3` markdown: TOC nav element rendered in preview
  - [ ] Multiple opt-in plugins together: emoji + mentions + wordCount + TOC all active simultaneously without conflicts or errors
  - [ ] A11y: `expect(container).toHaveNoViolations()` for BobEditor with all four opt-in plugins active
- Test coverage target: >=80%
- All tests must pass

## Success Criteria

- All tests passing
- Test coverage >=80%
- Each opt-in plugin importable via its subpath without bundling other plugins
- `size-limit` entry for `./plugins/emoji` passes
- `publint` + `attw` still pass after adding new subpath exports
- v0.4.0 Changeset entry created
