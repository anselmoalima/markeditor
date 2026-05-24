# TechSpec — bob-editor v1.0

> Source PRD: `PRD.md` (v1.1). Companion: `CLAUDE.md`. Scope: full v1.0 (Phases 0–6).

## Executive Summary

`bob-editor` is a publishable React component delivered as the `bob-editor` NPM package and developed inside a pnpm + Turborepo monorepo (`packages/bob-editor` + `apps/playground`). The library exposes a single `<BobEditor />` component (plus an imperative `BobEditorRef` and a `BobEditorPlugin` extension contract) that toggles between an edit pane (Monaco Editor, dynamic-imported) and a preview pane rendered by a `unified` pipeline (`remark-parse` → `remark-gfm`/`remark-math` → `remark-rehype` → `rehype-katex`/`rehype-highlight`/`rehype-sanitize` → `rehype-react`). State lives in a central `useReducer` exposed through two split React Contexts and a stable `EditorAPI` object that powers the public ref, plugins, the toolbar, and keyboard shortcuts.

The implementation strategy is layered: a tiny always-on core (pipeline composer, sanitize merger, reducer, plugin manager, shortcut manager, lazy registry, CSS variables) plus lazy chunks for heavy renderers (KaTeX, Mermaid, highlight.js) that are pre-warmed by content detection on every input. The primary technical trade-off is complexity in service of bundle size: the core stays under 80 KB gzip and a math-free, mermaid-free document never downloads either library, at the cost of an async render pipeline, a content-detection probe per change, and per-plugin sanitize-schema merging that must be defended by tests. Quality is enforced through a strict TDD pyramid (Vitest unit + RTL integration + type tests + Playwright e2e in the playground + jest-axe a11y + `vitest bench` baseline gate + `size-limit` + `publint` + `@arethetypeswrong/cli`) executed across a Node 18/20/22 × React 18/19 CI matrix. Releases ship through Changesets with `npm publish --provenance --access public` via GitHub Actions OIDC.

## System Architecture

### Component Overview

```
packages/bob-editor (publishable)
├── BobEditor.tsx              # public component, forwardRef, owns reducer
├── components/
│   ├── Editor/                # mode='edit'
│   │   ├── index.tsx          # orchestrator: TextareaFallback ↔ MonacoEditor (lazy)
│   │   ├── MonacoEditor.tsx   # dynamic-imported; binds Monaco model ↔ reducer
│   │   └── TextareaFallback.tsx
│   ├── Preview/               # mode='preview'
│   │   ├── index.tsx          # consumes usePreview(); renders ReactElement
│   │   ├── CodeBlock.tsx      # rehype-react component override + copy button
│   │   ├── MathBlock.tsx      # lazy KaTeX bridge
│   │   ├── MermaidDiagram.tsx # lazy Mermaid bridge
│   │   ├── Alert.tsx          # GitHub-style callout
│   │   └── SafeImage.tsx, SafeLink.tsx
│   ├── Toolbar/               # configurable, consumes context
│   ├── Dialogs/               # InsertLink, InsertImage, InsertTable, ShortcutsHelp
│   ├── StatusBar.tsx          # word count, "saved 2s ago"
│   └── ModeToggle.tsx
├── core/
│   ├── pipeline/              # unified pipeline builder, memo, abort
│   ├── sanitize/              # baseline schema + merge helpers
│   ├── state/                 # reducer, contexts, useEditorContext
│   ├── editorApi.ts           # stable EditorAPI factory
│   ├── pluginManager.ts       # registration, lifecycle, ordering
│   ├── shortcutManager.ts     # Mod+ parser, scope filter, override/disable
│   └── lazy/                  # registry, content detector
├── plugins/
│   ├── builtin/               # gfm, math, mermaid, alerts, footnotes (default-on)
│   ├── emoji.ts, mentions.ts, wordCount.ts, tableOfContents.ts (opt-in)
│   └── index.ts               # subpath barrel
├── hooks/                     # useControllableState, useStorageSync, usePreview, useMonacoPrefetch
├── themes/                    # light, dark, auto presets
├── i18n/                      # en, pt-BR, message catalog
├── styles/                    # plain CSS, .bobmd-* prefix, --mde-* vars
├── utils/                     # debounce, hash (FNV-1a), classnames
├── types.ts                   # public types (exported by index.ts)
└── index.ts
apps/playground (not published)
├── src/
│   ├── App.tsx                # router + DevTools sidebar
│   ├── scenarios/             # 15 routes per PRD §7.5
│   └── components/
└── e2e/                       # Playwright specs against scenarios
```

**Boundaries:**

- `core/` knows nothing about React rendering except the `rehype-react` final stage; everything else is React in `components/`/`hooks/`.
- Plugins talk to the editor only through `EditorAPI` and the `BobEditorPlugin` contract; they never reach into Monaco directly.
- The Monaco instance is held in a ref inside `MonacoEditor`; the reducer is the source of truth for markdown content.

**Data flow:**

```
User input ──► Monaco model.onDidChangeModelContent ──► dispatch({type:'content/setMarkdown'})
                                                              │
                                                              ├─► onChange prop (controlled signal)
                                                              ├─► storage debounce (write-through)
                                                              ├─► plugin.onChange(value, api)
                                                              └─► usePreview() recomputes (debounce 150 ms)
                                                                       │
                                                                       ▼
                                                  detect.markdown ── prime LazyRegistry
                                                                       │
                                                                       ▼
                                  pipeline.process(markdown) ──► React.ReactElement ──► <Preview/>
```

**External system interactions:** none at runtime. The library has no network calls of its own. Consumer-provided `onImageUpload` is the only outbound integration and is treated as an injected boundary (see Integration Points).

## Implementation Design

### Core Interfaces

Public TypeScript interfaces (live in `packages/bob-editor/src/types.ts`, re-exported by `index.ts`).

**Public component props (the API consumers depend on):**

```typescript
export interface BobEditorProps {
  // Content
  value?: string;
  defaultValue?: string;
  onChange?: (value: string) => void;
  onSave?: (value: string) => void | Promise<void>;
  placeholder?: string;
  readOnly?: boolean;

  // Mode
  mode?: EditorMode;
  defaultMode?: EditorMode;
  onModeChange?: (mode: EditorMode) => void;
  allowedModes?: readonly EditorMode[];

  // Composition
  toolbar?: boolean | ToolbarConfig;
  plugins?: readonly BobEditorPlugin[];
  shortcuts?: { override?: KeyboardShortcut[]; disable?: string[] };
  components?: Readonly<Record<string, React.ComponentType<unknown>>>;
  remarkPlugins?: PluggableList;
  rehypePlugins?: PluggableList;
  sanitize?: boolean | Schema | ((merged: Schema) => Schema);

  // Wiring (storage, theme, i18n, media, export, perf, events, monaco)
  storage?: StorageConfig;
  theme?: ThemePreset | BobmdTheme;
  locale?: string;
  i18n?: Partial<I18nMessages>;
  onImageUpload?: (file: File) => Promise<{ url: string; alt?: string }>;
  enableExport?: boolean | ExportConfig;
  previewDebounceMs?: number;
  editorOptions?: Partial<monaco.editor.IEditorOptions>;
  onMount?: (api: EditorAPI) => void;
  onError?: (error: Error) => void;
}
```

**Imperative ref handle (returned by `useImperativeHandle`):**

```typescript
export interface BobEditorRef {
  getValue(): string;
  setValue(value: string): void;
  focus(): void;
  blur(): void;
  getMode(): EditorMode;
  setMode(mode: EditorMode): void;
  insertText(text: string, opts?: { atCursor?: boolean; position?: number }): void;
  getSelection(): { start: number; end: number; text: string };
  exportAsHtml(): Promise<string>;
  exportAsMarkdown(): string;
}
```

**Plugin contract (the extension surface):**

```typescript
export interface BobEditorPlugin {
  name: string;
  version?: string;
  remarkPlugins?: PluggableList;
  rehypePlugins?: PluggableList;
  sanitizeSchema?: SchemaExtension;          // merged into active schema
  toolbarButtons?: ToolbarButton[];
  shortcuts?: KeyboardShortcut[];
  components?: Record<string, React.ComponentType<unknown>>;
  i18n?: Record<string, Record<string, string>>;
  onMount?: (api: EditorAPI) => void | (() => void);
  onChange?: (value: string, api: EditorAPI) => void;
  onBeforeParse?: (markdown: string) => string;
  onAfterRender?: (root: HastRoot) => HastRoot | void;
}
```

**`EditorAPI` (passed to plugins and to `onMount`):**

```typescript
export interface EditorAPI {
  getValue(): string;
  setValue(value: string): void;
  getSelection(): { start: number; end: number; text: string };
  getCursorPosition(): number;
  insertText(text: string, position?: number): void;
  replaceSelection(text: string): void;
  wrapSelection(before: string, after: string): void;
  getMode(): EditorMode;
  setMode(mode: EditorMode): void;
  focus(): void;
  blur(): void;
  showNotification(message: string, type?: 'info' | 'error' | 'success'): void;
}
```

**Error handling conventions:** the library never throws from a render path. Pipeline failures, plugin lifecycle exceptions, KaTeX/Mermaid parse errors, and storage quota errors are caught at their boundary, fired through `onError`, and surface in the preview as a localized inline `<ErrorNotice />`. Type errors at consumer boundaries are caught by the type tests in `tests/type/`.

### Data Models

The library has no database. The reducer state and a handful of structural types are the entire data model.

**Editor mode:**

```typescript
export type EditorMode = 'edit' | 'preview';
```

**Reducer state (internal, not exported):**

```typescript
interface BobEditorState {
  markdown: string;
  mode: EditorMode;
  selection: { start: number; end: number };
  cursor: number;
  savedAt: number | null;       // ms epoch, for "saved Xs ago"
  storageStatus: 'idle' | 'saving' | 'saved' | 'error';
  pipeline: { status: 'idle' | 'pending' | 'ready' | 'error'; error?: Error };
}
```

**Reducer actions (discriminated union):**

```typescript
type Action =
  | { type: 'content/setMarkdown'; markdown: string; source: 'user' | 'monaco' | 'api' | 'storage' }
  | { type: 'mode/set'; mode: EditorMode }
  | { type: 'selection/set'; start: number; end: number; cursor: number }
  | { type: 'storage/saving' }
  | { type: 'storage/saved'; at: number }
  | { type: 'storage/error'; error: Error }
  | { type: 'pipeline/pending' }
  | { type: 'pipeline/ready' }
  | { type: 'pipeline/error'; error: Error };
```

**Storage payload (localStorage / sessionStorage):**

- Key: `storageKey` prop (default `markdown-editor-content`).
- Value: raw markdown string. No JSON wrapper. No version metadata in v1.0.
- Write: debounced (`autoSaveInterval`, default 1000 ms). Guarded by `typeof window !== 'undefined'`.

**i18n messages:** `Record<MessageKey, string>` per locale. `MessageKey` is a string literal union built from the keys of the English catalog (`tests/type/` asserts that `pt-BR` is a structurally complete subset).

**Theme object (`BobmdTheme`):** PRD §5.10.2; rendered as inline CSS variables on the root element. No persistence.

### API Endpoints

Not applicable — `bob-editor` is a library, not a service. The closest equivalent is:

- **Public NPM surface** (`package.json#exports`):
  - `.` → component + types + plugins barrel
  - `./styles`, `./styles.css` → bundled stylesheet
  - `./plugins`, `./plugins/*` → individual opt-in plugins
  - `./package.json` → resolution helpers

- **Public type surface**: `BobEditorProps`, `BobEditorRef`, `EditorAPI`, `BobEditorPlugin`, `KeyboardShortcut`, `ToolbarButton`, `ToolbarConfig`, `ExportConfig`, `BobmdTheme`, `I18nMessages`, `EditorMode`, `StorageConfig`.

- **Imperative `BobEditorRef` methods**: see Core Interfaces.

## Integration Points

The library integrates with consumer-provided systems at three well-defined boundaries:

| Boundary | Purpose | Auth | Error handling |
|---|---|---|---|
| `onImageUpload(file)` | Consumer-supplied upload pipeline; returns `{ url, alt? }`. | Caller's concern. | Failure rolls back the optimistic `![Uploading...]()` placeholder and emits `onError`. Retries are not built in. |
| `storage` (`localStorage` / `sessionStorage`) | Browser-local draft persistence. | None (origin-scoped). | `QuotaExceededError` → emit `onError`, disable storage for the session, log a dev warning. |
| Monaco worker assets | Bundler must serve Monaco's worker files. | None. | If workers fail to load, Monaco falls back to its in-thread mode; we never block the UI. |

The pipeline itself integrates with the `unified` ecosystem (remark/rehype) — those packages are dependencies, not external services.

## Impact Analysis

The repository currently contains only docs (`PRD.md`, `CLAUDE.md`, `AGENTS.md`, `DESIGN.md`). Every directory below is **new**.

| Component | Impact Type | Description and Risk | Required Action |
|---|---|---|---|
| `packages/bob-editor/` | new | Entire published library. Risk: low (greenfield, scope governed by PRD). | Build per Build Order. |
| `apps/playground/` | new | Demo + e2e host. Risk: low; isolated from publish path. | Build alongside library starting in Phase 1. |
| `pnpm-workspace.yaml`, `turbo.json`, `tsconfig.base.json` | new | Monorepo orchestration. Risk: medium — misconfigured workspaces break HMR and CI. | Validate via smoke test in Phase 0. |
| `.changeset/` | new | Versioning. Risk: low. | Initialize during Phase 0; enforce changeset-on-PR via CI. |
| `.github/workflows/{ci,release,size}.yml` | new | CI/CD. Risk: medium — OIDC provenance setup is fiddly the first time. | Land workflows in Phase 0; dry-run release before publishing 1.0. |
| `examples/` | new | Snippets consumed by README. Risk: low. | Author at least 4 examples in Phase 6. |
| Root `package.json`, `.eslintrc.cjs`, `.prettierrc`, `LICENSE`, `README.md` | new | Repo-level files. Risk: low. | Author in Phase 0 / Phase 6. |
| `apps/docs/` (optional Storybook + Docusaurus) | new, deferred | Doc site. Risk: low (optional in v1.0). | Decide in Phase 6 polish; ship if budget allows. |
| Existing `PRD.md`, `CLAUDE.md`, `AGENTS.md`, `DESIGN.md` | unchanged | Reference docs. | None. |

No existing code is modified or deprecated.

## Testing Approach

### Unit Tests

- **Tooling**: Vitest (jsdom env) + `@testing-library/jest-dom` + `expect-type` for type tests + `vitest bench` for performance.
- **Targets**: pipeline builder, sanitize schema merge, FNV-1a hash + cache key, debounce, lazy registry, content detector, shortcut parser (`Mod+B` cross-platform), plugin manager registration/cleanup ordering, reducer transitions, storage hook (with `localStorage` mock), every built-in plugin's contributions, theme application helper.
- **Mocks and boundaries**: `localStorage` / `sessionStorage` are replaced via `vi.spyOn`. Heavy modules (KaTeX, Mermaid, highlight.js) are mocked at the `LazyRegistry` boundary so unit tests run synchronously and bundle-free. Network is never hit (MSW is reserved for integration tests).
- **Critical scenarios and edges**:
  - Sanitize: full OWASP XSS Filter Cheat Sheet battery as fixtures under `tests/fixtures/xss/`.
  - Pipeline: every feature row of PRD §5.3.2 has an `in.md` + `out.html` fixture; the test asserts equality against the rendered ReactElement converted to HTML.
  - Plugin manager: cleanup function from `onMount` is invoked exactly once on unmount; plugin order is preserved across the four lifecycle hooks; conflicting toolbar button IDs produce a documented error.
  - Reducer: every action transitions deterministically; storage-error path disables future writes.
  - Shortcut manager: `Mod` resolves to `Cmd` on Mac (mocked `navigator.platform`), `Ctrl` elsewhere; `disable` removes default behavior; `override` replaces an action with the same ID.
- **Coverage gates**: ≥80% lines, ≥75% branches (Vitest v8 coverage), enforced in CI.
- **Bench**: `tests/bench/pipeline.bench.ts` runs the pipeline against 1k, 5k, 10k-line fixtures. Baseline JSON checked into the repo; CI fails on >1.2× regression.

### Integration Tests

- **Tooling**: Vitest + jsdom + RTL + `@testing-library/user-event` + `jest-axe` + MSW (for `onImageUpload`).
- **Targets in one test**: the full `<BobEditor />` mounted in a wrapper that exercises:
  - Mode toggle preserves content, fires `onModeChange`, respects `allowedModes`.
  - Controlled mode (`value` + `onChange`) round-trips; uncontrolled mode hydrates from `defaultValue` or storage; controlled + `storage` writes but never reads.
  - Toolbar buttons mutate content via dispatch; modals (Insert Link, Insert Image, Insert Table, Shortcuts Help) trap focus and close on Esc; overflow menu appears below 600 px width.
  - Every default keyboard shortcut from PRD §5.6.1 fires its action; `override` and `disable` work; `Ctrl/Cmd+?` opens the help modal.
  - Plugins: each lifecycle hook fires in registration order; `onBeforeParse` transforms input; `onAfterRender` transforms hast; `onMount` cleanup runs on unmount; no memory leaks (assertion via `wrapper.unmount` + GC simulation).
  - Image upload optimistic flow: success replaces placeholder; failure rolls back and surfaces toast.
  - Export: HTML/Markdown copy-to-clipboard via mocked `navigator.clipboard`; download via mocked anchor click.
  - Themes: light, dark, auto (with `matchMedia` mock), custom theme object writes CSS variables.
  - i18n: switching `locale` updates tooltips and labels; fallback to `en` when key missing.
  - A11y: every primary surface (edit, preview, each modal, each theme) passes `expect(container).toHaveNoViolations()`.
- **Setup**: Vitest global setup file mounts `@testing-library/jest-dom` + `jest-axe/extend-expect`, mocks `matchMedia`, `IntersectionObserver`, `ResizeObserver`, `navigator.clipboard`, and shadows `localStorage`/`sessionStorage` with in-memory implementations.
- **Environment dependencies**: jsdom is sufficient; Monaco is mocked at the dynamic-import boundary (RTL tests never load real Monaco — they assert against the textarea fallback or a Monaco stub).

### End-to-end (`apps/playground/e2e`)

- Playwright across Chromium, Firefox, WebKit.
- One spec per scenario route from PRD §7.5: typing, mode toggle, every shortcut (with Mac/Linux/Windows keyboard layouts), upload sucesso/falha (MSW), export (HTML/MD/print), large-document interaction, SSR-safe scenario (Next.js-like wrapper that mounts after hydration).
- A11y via `@axe-core/playwright` once per route.
- Type tests run via `vitest --typecheck` in CI; package shape via `publint` + `@arethetypeswrong/cli`; bundle limits via `size-limit`.

## Development Sequencing

### Build Order

1. **Monorepo skeleton + tooling baseline** — no dependencies. Create `pnpm-workspace.yaml`, `turbo.json`, `tsconfig.base.json`, root ESLint/Prettier configs, LICENSE, root README placeholder. Initialize Changesets.
2. **`packages/bob-editor` scaffold with publish-ready `package.json`** — depends on step 1. `tsup.config.ts` (dual ESM/CJS + d.ts + CSS), `exports` map, `peerDependencies`, `sideEffects`, `files` whitelist. Empty `src/index.ts` that exports the canonical types as placeholder stubs.
3. **`apps/playground` scaffold consuming `bob-editor` via `workspace:*`** — depends on step 2. Vite app, single placeholder route renders the stub component to prove the symlink + build chain.
4. **CI workflows (`ci.yml`, `release.yml`, `size.yml`)** — depends on step 2. Matrix Node 18/20/22 × React 18/19. Wire `publint`, `@arethetypeswrong/cli`, `size-limit`, coverage thresholds.
5. **Core types in `src/types.ts`** — depends on step 2. Land the full public type surface from Core Interfaces; write `tests/type/*.test-d.ts` as a regression net before any implementation. Locks the API surface.
6. **Reducer + contexts + EditorAPI factory** — depends on step 5. `src/core/state/`, `src/core/editorApi.ts`. Unit-tested first (TDD red phase).
7. **Pipeline composer + sanitize merger + lazy registry + content detector** — depends on step 5. `src/core/pipeline/`, `src/core/sanitize/`, `src/core/lazy/`. Pure modules, unit-testable in isolation.
8. **Plugin manager + shortcut manager** — depends on step 6 and step 7. Wires plugin contributions into the pipeline composer, the toolbar registry, and the keyboard listener.
9. **Phase 1 MVP component: `<BobEditor />` shell + Monaco lazy + textarea fallback + light/dark themes + toggle** — depends on steps 6, 7, 8. Integration tests for toggle, controlled-vs-uncontrolled, theme application. Cuts **v0.1.0**.
10. **Phase 2 toolbar + modals + default shortcuts + i18n base** — depends on step 9. Lands every PRD §5.4.2 button, every PRD §5.6.1 shortcut, en + pt-BR catalogs, the shortcuts help modal. Cuts **v0.2.0**.
11. **Phase 3 extended markdown features (math, mermaid, alerts, footnotes, code blocks with highlight + copy, heading slugs, optional interactive task lists)** — depends on steps 7, 9. Each feature ships with sanitize-schema extension and fixture-based unit tests. Cuts **v0.3.0**.
12. **Phase 4 plugin system polish + opt-in built-ins (emoji, mentions, wordCount, tableOfContents)** — depends on steps 8, 11. Plugin docs + example custom plugin in `examples/`. Cuts **v0.4.0**.
13. **Phase 5 images + storage + export + sticky toolbar + custom themes** — depends on step 10. Image upload optimistic flow, drag-drop, paste, controlled-vs-storage rules per ADR-008, HTML/MD export, print. Cuts **v0.5.0**.
14. **Phase 6 a11y audit, perf audit, README + Storybook, full Playwright suite, deploy playground, publish 1.0** — depends on every previous step. Final compliance against PRD §12 Definition of Done.

### Technical Dependencies

- **External**: NPM account with 2FA, `bob-editor` name reserved (`npm view bob-editor`), GitHub repo with NPM Trusted Publisher (OIDC) configured, NPM token in GitHub Secrets, Vercel/Netlify project for `apps/playground` deploy.
- **Internal infrastructure**: pnpm ≥9, Node ≥18, Turborepo CLI, Playwright browsers cached in CI.
- **No shared components from other teams**: greenfield project.
- **Blocking risks**: NPM name availability must be confirmed before step 2 finalizes; if unavailable, ADR-001 needs an addendum picking an alternate name.

## Monitoring and Observability

The library is a client-side React component; runtime observability is the consumer's responsibility. The library exposes hooks consumers can wire into their own observability stack:

- **`onError(error)`** — every caught failure (pipeline, plugin, storage quota, image upload) is funneled here with a stable error shape (`name`, `message`, `cause?`, source-tagged).
- **`onMount(api)` and `onSelectionChange`** — telemetry hooks consumers may attach to.
- **`status` exported on the imperative ref (future minor)** — exposes `{ pipeline: 'idle'|'pending'|'ready'|'error'; lazy: Record<string, 'pending'|'ready'> }` for consumers who want a debug overlay.

For development time:

- **Dev-mode warnings** logged to `console.warn` for: controlled + storage misuse (ADR-008), plugin recursion depth >2 (ADR-003), conflicting toolbar IDs, weakened sanitize clauses (ADR-004), bundle splitting failure heuristics (Monaco chunk name).
- **Storybook** (Phase 6) renders every component variation; CI runs Storybook test-runner to snapshot visual surfaces.
- **`size-limit` PR comments** report per-entry bundle diffs.
- **`vitest bench` regression gate** posts the perf diff to PR checks.
- **Coverage report** comment on PRs.

No metrics, logs, or alerts are emitted from production code; PRD §1 keeps the library self-contained.

## Technical Considerations

### Key Decisions

| Decision | Rationale | Trade-off | Alternatives rejected |
|---|---|---|---|
| pnpm + Turborepo monorepo, `tsup` dual ESM/CJS build, Changesets + OIDC `--provenance` release | PRD §6.6 publish requirements; market-standard for React libraries; clean separation of library and playground. | Two-tool surface (pnpm + npm publish); engineers learn Turbo task graph. | Single-package repo (loses playground separation); Vite library mode (poor multi-entry CJS); unbuild (less mature CSS path). |
| `unified` async pipeline → `rehype-react` with debounce + memoization + generation-counter abort | PRD §7.4 reference architecture; correct under React 18 strict mode. | More code than `processSync`; first render is one microtask late. | `hast-util-to-jsx-runtime` (diverges from PRD); synchronous pipeline (blocks main thread on large docs); Web Worker pipeline (out of scope). |
| Central `useReducer` + split contexts + stable `EditorAPI` object | One source of truth for content/mode/selection; plugins, toolbar, shortcuts, ref all share it; controlled and uncontrolled live in the same reducer. | Reducer grows; must split contexts to avoid re-render storms. | Zustand (new dep not in PRD §15); per-slice `useState` (race conditions across plugins); Monaco-as-source-of-truth (no Monaco in preview/SSR). |
| GitHub baseline sanitize schema + per-plugin extension merge + locked security clauses | PRD §6.3 default-on sanitization that still supports math/mermaid/alerts; third-party plugins can extend cleanly. | Schema merger complexity; misconfigured plugin can reopen narrow XSS vectors. | Single pre-merged schema (third-party plugins can't extend); opt-in sanitize (violates RNF-6.3); double-pass sanitize (perf budget). |
| Monaco via dynamic `import()` + accessible textarea fallback in SSR / pre-resolve | PRD §6.1 bundle budget + PRD §14 risk mitigation; one component, zero consumer config. | Brief mode-switch flash; bundler-specific recipes for Monaco workers. | Two exported components (worse DX); null/skeleton fallback (no pre-hydration editing); Monaco as opt-in subpath (defeats DX). |
| Lazy KaTeX/Mermaid/highlight.js via content-detection pre-warm + module-level cache | PRD §6.5 per-feature chunk budgets; PRD §5.5.4 built-ins default-on. | Detection regex must be conservative; KaTeX CSS injection at runtime. | Suspense-only on first node mount (bad first paint); opt-in flags (PRD violation); single combined chunk (per-feature budget violation). |
| Plain CSS with `.bobmd-*` prefix + `--mde-*` CSS variables | PRD §5.10.3 contract; CLAUDE.md §5 prohibits styled-components/emotion; zero runtime cost. | Naming discipline enforced by stylelint; specificity wars possible. | CSS Modules (breaks override contract); vanilla-extract / Stylex (new dep); styled-components (forbidden by CLAUDE.md). |
| Controlled `value` always wins; storage is write-through, restores only when uncontrolled | Preserves React's controlled-component contract; still offers "remember my draft" UX in uncontrolled mode and crash-recovery telemetry in controlled mode. | Consumers wanting controlled-mode restore must implement it themselves. | Storage-precedence-at-mount (violates controlled contract); storage-disabled-in-controlled (loses crash-recovery use case). |
| TDD pyramid (Vitest + RTL + type tests + Playwright + jest-axe + `vitest bench` + `size-limit` + `publint` + `attw`); CI matrix Node 18/20/22 × React 18/19 | PRD §6.7; every category from RNF-6.7.4 has an owner; perf and bundle regressions are gated, not advisory. | CI runtime grows with the matrix; bench baseline is brittle on shared runners. | Manual perf checks (RNF-6.7.6 violation); Playwright in library package (PRD §7.5 places e2e in playground); long-lived NPM_TOKEN without OIDC (no provenance). |

### Known Risks

| Risk | Likelihood | Mitigation |
|---|---|---|
| Monaco workers fail in some bundlers (Vite especially) | Medium | README "Bundler recipes" section; smoke-test Vite, Next.js, Remix consumers in CI. |
| KaTeX or Mermaid throw on malformed input and crash the preview | Medium | Component-level error boundary inside `<MathBlock />` and `<MermaidDiagram />`; render localized inline error. |
| Async pipeline races under React 18 strict-mode double effects | High | Generation-counter abort in `usePreview`; integration test asserts strict-mode equivalence. |
| Plugin recursion (`onChange` dispatches that retrigger `onChange`) | Medium | Recursion-depth guard with dev warning at depth >2; integration test asserts non-recursive behavior. |
| Sanitize merge weakens locked clauses by accident | Low (high impact) | `mergeSanitizeSchema` asserts locked clauses post-merge; XSS battery runs against every built-in plugin. |
| `size-limit` regressions block urgent PRs | Medium | Per-chunk budgets give engineers a clear contract; can be raised via explicit ADR amendment. |
| `bob-editor` name unavailable on NPM | Low | Verify via `npm view bob-editor` during step 1 of Build Order; addendum ADR if alternate name needed. |
| KaTeX CSS injection conflicts with consumer's existing KaTeX | Low | Inject only if a `link[data-bobmd-katex]` is absent; document override in README. |
| Mermaid bundle size dominates "with all chunks" total | High | `size-limit` per-chunk budgets isolate Mermaid; document that consumers can disable the Mermaid built-in via `plugins: plugins.filter(p => p.name !== 'mermaid')`. |

Areas requiring further research or prototyping: (a) Monaco worker setup recipe under Next.js 15 App Router with Turbopack — needs validation before Phase 6 release; (b) jsx-runtime alignment of `rehype-react` v8 with React 19 — needs a Phase 1 smoke test to confirm no regressions.

## Architecture Decision Records

- [ADR-001: pnpm + Turborepo monorepo with tsup dual ESM/CJS build](adrs/adr-001.md) — Adopt pnpm workspaces + Turbo + tsup with Changesets/OIDC publish to meet PRD §6.6 NPM requirements.
- [ADR-002: Async unified pipeline rendered through `rehype-react` with debounced memoization](adrs/adr-002.md) — Compose `unified` per-instance, debounce 150 ms, FNV cache key, abort stale runs via generation counter.
- [ADR-003: Central `useReducer` + Context with imperative `EditorAPI` for plugin extensibility](adrs/adr-003.md) — One reducer + split state/api contexts; stable `EditorAPI` shared by ref, plugins, toolbar, shortcuts.
- [ADR-004: GitHub sanitize schema as baseline, plugin-contributed extensions merged at registration](adrs/adr-004.md) — `defaultSchema` + per-plugin `sanitizeSchema` merge + immutable security clauses.
- [ADR-005: Monaco lazy-loaded via dynamic `import()`; SSR/loading fallback is an accessible `<textarea>`](adrs/adr-005.md) — Single component; `React.lazy` for Monaco; functional textarea fallback wired to the same reducer.
- [ADR-006: Lazy-load heavy renderers (KaTeX, Mermaid, highlight.js) via content detection with import cache](adrs/adr-006.md) — Conservative regex pre-warm + module-level `LazyRegistry` keep math-free docs free of math bytes.
- [ADR-007: Prefixed plain CSS bundled to `bob-editor/styles` with `--mde-*` CSS variables](adrs/adr-007.md) — `.bobmd-` selector prefix, plain CSS, `--mde-*` token contract, stylelint enforcement.
- [ADR-008: Controlled `value` always wins; storage is write-through and restores only when uncontrolled](adrs/adr-008.md) — Preserve React controlled contract; storage as soft backup; dev-mode warning for controlled + storage combinations.
- [ADR-009: TDD pyramid with `vitest bench` regression gate and Changesets-backed provenance release](adrs/adr-009.md) — Full pyramid, ≥80%/≥75% coverage gates, 1.2× bench regression gate, Changesets + OIDC `--provenance`.
