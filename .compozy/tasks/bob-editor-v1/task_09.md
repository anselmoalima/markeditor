---
status: completed
title: Extended markdown — math, mermaid, alerts, footnotes, highlight (v0.3.0)
type: frontend
complexity: high
dependencies:
  - task_05
  - task_07
---

# Task 9: Extended markdown — math, mermaid, alerts, footnotes, highlight (v0.3.0)

## Overview

Implement the rich preview rendering components (KaTeX math, Mermaid diagrams, GitHub-style alerts/callouts, footnotes, syntax-highlighted code blocks with a copy button) and the five default-on built-in plugins. Each feature registers its sanitize schema extension via the plugin system from task_06 and has in/out fixture tests. This is the third publicly releasable milestone (v0.3.0).

<critical>
- ALWAYS READ the PRD and TechSpec before starting
- REFERENCE TECHSPEC for implementation details — do not duplicate here
- FOCUS ON "WHAT" — describe what needs to be accomplished, not how
- MINIMIZE CODE — show code only to illustrate current structure or problem areas
- TESTS REQUIRED — every task MUST include tests in deliverables
</critical>

<requirements>
- MUST implement `src/components/Preview/CodeBlock.tsx`: syntax highlight via highlight.js (lazy from registry); copy-to-clipboard button; language label; accessible (`aria-label` on copy button)
- MUST implement `src/components/Preview/MathBlock.tsx`: renders inline and block KaTeX math (lazy); component-level error boundary renders localized inline error on KaTeX parse failure — MUST NOT crash the entire preview
- MUST implement `src/components/Preview/MermaidDiagram.tsx`: renders Mermaid SVG (lazy); component-level error boundary for malformed diagrams; SVG output re-sanitized with a strict SVG-only schema before mounting (per ADR-004 risk section)
- MUST implement `src/components/Preview/Alert.tsx`: GitHub-style callouts (`> [!NOTE]`, `> [!WARNING]`, `> [!TIP]`, `> [!IMPORTANT]`, `> [!CAUTION]`) with appropriate ARIA roles
- MUST implement `src/components/Preview/SafeImage.tsx`: renders `<img>` with sanitized src; blocks `javascript:` and unbounded `data:` URIs
- MUST implement `src/components/Preview/SafeLink.tsx`: renders `<a>` with sanitized href; adds `rel="noopener noreferrer"` for external links; blocks `javascript:` hrefs
- MUST implement `src/plugins/builtin/gfm.ts`, `math.ts`, `mermaid.ts`, `alerts.ts`, `footnotes.ts` — each as a `BobEditorPlugin` conforming to the interface from task_03; these are active by default (bundled into the default plugin list in BobEditor)
- MUST register each built-in plugin's `sanitizeSchema` extension via `pluginManager` (task_06) so the schema merger incorporates them before the pipeline runs
- MUST add the built-in plugins to the default `components` map passed to `rehype-react` in the pipeline builder (task_05)
- MUST add markdown fixture files in `tests/fixtures/markdown/` for every feature: math (inline + block), mermaid, alerts (all 5 variants), footnotes, code blocks (multiple languages), heading slugs, task lists; assert `in.md` → expected `out.html` equality
- MUST NOT bundle KaTeX CSS statically — inject a `<link>` tag at runtime only if `link[data-bobmd-katex]` is absent (idempotent injection)
- SHOULD add a `tests/bench/pipeline.bench.ts` baseline with 1k/5k/10k-line fixtures; check in baseline JSON to enable CI regression gate
</requirements>

## Subtasks

- [x] 9.1 Implement `src/components/Preview/CodeBlock.tsx` with lazy highlight.js + copy button
- [x] 9.2 Implement `src/components/Preview/MathBlock.tsx` with error boundary + KaTeX CSS injection
- [x] 9.3 Implement `src/components/Preview/MermaidDiagram.tsx` with error boundary + SVG re-sanitize
- [x] 9.4 Implement `src/components/Preview/Alert.tsx` for all 5 GitHub callout variants
- [x] 9.5 Implement `src/components/Preview/SafeImage.tsx` + `SafeLink.tsx`
- [x] 9.6 Implement `src/plugins/builtin/` — gfm, math, mermaid, alerts, footnotes as BobEditorPlugin
- [x] 9.7 Add all built-in plugins to BobEditor default plugin list + components map
- [x] 9.8 Extend markdown fixture files for each feature; write fixture-based pipeline tests
- [x] 9.9 Write `tests/bench/pipeline.bench.ts`; establish baseline JSON

## Implementation Details

See TechSpec 'System Architecture' → Component Overview for the Preview component hierarchy, ADR-002 for pipeline composition with plugin `remarkPlugins`/`rehypePlugins`, ADR-004 for sanitize schema extensions per plugin, ADR-006 for lazy-load registry and content detector patterns.

Key constraints:

- KaTeX CSS injection: check `document.head.querySelector('link[data-bobmd-katex]')` before injecting; set `data-bobmd-katex` on the injected link so subsequent calls skip it.
- Mermaid SVG re-sanitize: after `mermaid.render()`, pass the SVG string through a strict allow-list (only safe SVG presentation tags; strip `<a href>` inside SVG unless absolute https).
- `CodeBlock` copy button: use `navigator.clipboard.writeText()` with a fallback to `document.execCommand('copy')`; show a visual "Copied!" confirmation for 2 seconds.
- Built-in plugins array in `BobEditor.tsx`: `[gfmPlugin, mathPlugin, mermaidPlugin, alertsPlugin, footnotesPlugin]`; consumers can filter the array to disable any built-in.
- Bench baseline: `vitest bench` produces a JSON file at `tests/bench/baseline.json`; CI asserts that new results are within 1.2× of baseline.

### Relevant Files

- `packages/bob-editor/src/components/Preview/CodeBlock.tsx` — create
- `packages/bob-editor/src/components/Preview/MathBlock.tsx` — create
- `packages/bob-editor/src/components/Preview/MermaidDiagram.tsx` — create
- `packages/bob-editor/src/components/Preview/Alert.tsx` — create
- `packages/bob-editor/src/components/Preview/SafeImage.tsx` — create
- `packages/bob-editor/src/components/Preview/SafeLink.tsx` — create
- `packages/bob-editor/src/plugins/builtin/gfm.ts` — create
- `packages/bob-editor/src/plugins/builtin/math.ts` — create
- `packages/bob-editor/src/plugins/builtin/mermaid.ts` — create
- `packages/bob-editor/src/plugins/builtin/alerts.ts` — create
- `packages/bob-editor/src/plugins/builtin/footnotes.ts` — create
- `packages/bob-editor/tests/fixtures/markdown/` — extend (task_05 started; add new fixtures here)
- `packages/bob-editor/tests/unit/builtin-plugins.test.ts` — create
- `packages/bob-editor/tests/bench/pipeline.bench.ts` — create
- `packages/bob-editor/tests/bench/baseline.json` — create (committed)
- `packages/bob-editor/src/BobEditor.tsx` (task_07) — update default plugins list + components map
- `packages/bob-editor/src/core/pipeline/builder.ts` (task_05) — update to accept `components` map

### Dependent Files

- `src/plugins/emoji.ts` (task_10) — follows the same BobEditorPlugin pattern established here
- `apps/playground/src/scenarios/math.tsx` (task_12) — uses math built-in
- `apps/playground/src/scenarios/mermaid.tsx` (task_12) — uses mermaid built-in

### Related ADRs

- [ADR-002: Async unified pipeline with debounced memoization](adrs/adr-002.md) — Plugin remarkPlugins/rehypePlugins merge into pipeline
- [ADR-004: GitHub sanitize schema + plugin-contributed extensions](adrs/adr-004.md) — Each built-in plugin contributes sanitizeSchema; locked clauses enforced post-merge
- [ADR-006: Lazy-load heavy renderers via content detection](adrs/adr-006.md) — KaTeX, Mermaid, highlight.js in LazyRegistry

## Deliverables

- `src/components/Preview/` (CodeBlock, MathBlock, MermaidDiagram, Alert, SafeImage, SafeLink)
- `src/plugins/builtin/` (gfm, math, mermaid, alerts, footnotes)
- Extended `tests/fixtures/markdown/` per-feature pairs
- `tests/bench/pipeline.bench.ts` + committed `baseline.json`
- Unit + integration tests with 80%+ coverage **(REQUIRED)**
- Changeset entry for v0.3.0

## Tests

- Unit tests:
  - [ ] `MathBlock` with `$x^2$`: renders a KaTeX span, does not throw
  - [ ] `MathBlock` with malformed `$\invalidcommand$`: renders inline error message; does not crash preview
  - [ ] `MermaidDiagram` with valid `graph TD; A-->B`: renders an SVG element
  - [ ] `MermaidDiagram` with malformed diagram: renders inline error; does not crash
  - [ ] `MermaidDiagram` SVG output: does not contain `<script>` or `javascript:` after re-sanitize
  - [ ] `Alert` with `> [!NOTE] text`: renders with `role="note"` and note styling class
  - [ ] `Alert` with `> [!WARNING] text`: renders with warning-specific class
  - [ ] `CodeBlock` copy button: `navigator.clipboard.writeText` called with the code content
  - [ ] `SafeLink` with `href="javascript:alert(1)"`: rendered href is empty or `#`
  - [ ] `SafeImage` with `src="data:text/html,..."`: image not rendered or src stripped
  - [ ] Built-in `mathPlugin.sanitizeSchema`: after merge, `math` and `semantics` tags allowed
  - [ ] Built-in `mermaidPlugin.sanitizeSchema`: after merge, `svg` tag and key SVG attributes allowed
  - [ ] Bench: pipeline processing 10k-line fixture completes in < 300 ms (Vitest bench assertion)
  - [ ] Fixture: `tests/fixtures/markdown/math/in.md` → rendered output matches `out.html`
  - [ ] Fixture: `tests/fixtures/markdown/alerts/in.md` → all 5 callout variants present in output
- Integration tests:
  - [ ] `<BobEditor>` in preview mode with `$E=mc^2$`: MathBlock visible in preview
  - [ ] `<BobEditor>` in preview mode with malformed math: inline error message visible; rest of preview intact
  - [ ] `<BobEditor>` in preview mode with code block: copy button renders; clicking copies code to clipboard
  - [ ] KaTeX CSS link injected exactly once when two BobEditor instances mount
- Test coverage target: >=80%
- All tests must pass

## Success Criteria

- All tests passing
- Test coverage >=80%
- All 5 built-in plugins registered by default; each has a `sanitizeSchema` that passes XSS tests
- KaTeX/Mermaid render failures degrade gracefully (inline error, no preview crash)
- Bench baseline established; 10k-line fixture renders in < 300 ms
- `pnpm -r build && pnpm -r test && pnpm -r typecheck && pnpm -r lint` pass
- v0.3.0 Changeset entry created
