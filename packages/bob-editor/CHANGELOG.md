# bob-editor

## 1.0.0

### Major Changes

- Release v1.0.0 — full-featured React Markdown editor

  Complete implementation with Monaco Editor, unified pipeline (GFM, math, Mermaid, alerts, footnotes), plugin system, toolbar, keyboard shortcuts, themes, i18n, localStorage persistence, image upload, HTML/Markdown export, and full WCAG 2.1 AA accessibility compliance.

  ### Features
  - Toggle edit/preview mode with Monaco Editor (lazy-loaded)
  - Markdown pipeline: GFM, KaTeX math, Mermaid diagrams, code highlighting, alerts, footnotes
  - Fully configurable toolbar with built-in and custom buttons
  - Plugin system with lifecycle hooks (`onMount`, `onChange`, `onBeforeParse`, `onAfterRender`)
  - Built-in opt-in plugins: emoji, mentions, wordCount, tableOfContents
  - Keyboard shortcuts with override/disable support
  - Themes: `light`, `dark`, `auto` presets + custom `BobmdTheme` CSS-variable objects
  - i18n runtime locale switching with `en` fallback
  - localStorage/sessionStorage persistence with configurable autoSave
  - Image upload, drag-and-drop, paste (with rollback on failure)
  - Export as HTML, Markdown, or print
  - Imperative `BobEditorRef` API: `getValue`, `setValue`, `insertText`, `getSelection`, `exportAsHtml`, `exportAsMarkdown`
  - WCAG 2.1 AA compliant (zero axe violations)
  - Dual ESM + CJS output, TypeScript types, CSS bundle

### Minor Changes

- 9c28354: Release v0.1.0 MVP with `BobEditor` shell, lazy Monaco orchestration with textarea fallback, preview hook/component, mode toggle, base theme wiring, and integration coverage.
- 250359b: feat: toolbar, modals, default shortcuts, i18n base (v0.2.0)
- 3d744e6: feat: extended markdown — math, mermaid, alerts, footnotes, code highlight (v0.3.0)

  Adds rich preview rendering components and five default-on built-in plugins:
  - `CodeBlock`: syntax-highlighted code blocks with copy-to-clipboard button and language label
  - `MathBlock`: lazy KaTeX rendering with CSS injection and error boundary
  - `MermaidDiagram`: lazy Mermaid SVG rendering with SVG re-sanitization and error boundary
  - `Alert`: GitHub-style callouts (`[!NOTE]`, `[!WARNING]`, `[!TIP]`, `[!IMPORTANT]`, `[!CAUTION]`)
  - `SafeLink`: anchors with `javascript:` blocking and `rel="noopener noreferrer"` for external links
  - `SafeImage`: images with `javascript:` and unsafe `data:` URI blocking

  Built-in plugins (active by default):
  - `gfmPlugin`: GFM tables, strikethrough, task lists; provides SafeLink, SafeImage, CodeBlock
  - `mathPlugin`: KaTeX schema extensions + CSS injection on mount
  - `mermaidPlugin`: SVG sanitize schema extensions
  - `alertsPlugin`: callout schema + Alert component
  - `footnotesPlugin`: footnote schema extensions

  Bug fix: `mergedComponents`/`mergedRemarkPlugins`/`mergedRehypePlugins` now correctly recalculate after plugins are registered (added `managerReady` as dependency).

- d899b07: feat: opt-in built-in plugins — emoji, mentions, wordCount, tableOfContents (v0.4.0)
  - `emojiPlugin` — remark plugin transforming `:shortcode:` to unicode emoji; includes emoji toolbar button; exported via `bob-editor/plugins/emoji`
  - `createMentionsPlugin({ resolveMention })` — factory returning a plugin that transforms `@username` to a styled `<a class="bobmd-mention">` link; exported via `bob-editor/plugins/mentions`
  - `wordCountPlugin` — `onChange` hook computing word/char count and calling `api.showNotification`; exported via `bob-editor/plugins/wordCount`
  - `tableOfContentsPlugin` — `onAfterRender` hast transform prepending a `<nav aria-label="Table of contents"><ul>...</ul></nav>` built from heading slugs; exported via `bob-editor/plugins/tableOfContents`
  - `src/plugins/index.ts` barrel re-exports all four opt-in plugins plus the five default built-ins
  - Wire `onAfterRender` hooks as a unified rehype plugin (before `rehype-sanitize`) in `BobEditor.tsx`
  - Fix `mergeSanitizeSchema`: plain-string attribute entries now correctly override tuple restrictions from base schema (`collapseUnrestrictedAttrs`)

- feat(v0.5.0): image upload, storage persistence, HTML/MD export, sticky toolbar, custom themes

  ## Features

  ### Image Upload (optimistic flow)
  - Insert optimistic placeholder (`![Uploading...](data:image/upload-NONCE)`) on file selection
  - Replace placeholder with `![alt](url)` on successful upload
  - Remove placeholder and call `onError` on upload failure
  - Drag-drop upload via `onDragOver`/`onDrop` handlers on the root element
  - Paste upload via `paste` event handlers in `MonacoEditor` and `TextareaFallback`

  ### Storage Persistence (`useStorageSync`)
  - Write-through semantics: debounced write to `localStorage`/`sessionStorage` on every markdown change
  - ADR-008: reads from storage on mount only when uncontrolled (no `value` prop) and no `defaultValue`
  - Controlled mode (with `value` prop): writes but never reads; emits `console.warn` once per mount
  - `QuotaExceededError` handling: dispatches `storage/error`, disables storage for session, calls `onError`

  ### Export
  - `EditorAPI.exportAsHtml()`: runs unified pipeline, serializes with `renderToStaticMarkup`, sanitized
  - `EditorAPI.exportAsMarkdown()`: returns raw markdown string
  - Download helpers: create Blob + anchor click for `.html` and `.md` files
  - Print support via `window.print()` + `@media print` CSS
  - `enableExport` prop: `true` or `ExportConfig` to show export toolbar section

  ### Sticky Toolbar
  - `ToolbarConfig.sticky: true` applies `position: sticky; top: 0` via `bobmd-toolbar--sticky` class

  ### Custom Themes
  - `theme` prop accepts a `BobmdTheme` object with `--mde-*` CSS custom properties
  - Properties are applied as inline CSS variables on the root element
  - Non-`--mde-*` keys are silently ignored
