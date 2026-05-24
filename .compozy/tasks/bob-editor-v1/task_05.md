---
status: pending
title: Core pipeline — unified, sanitize merger, lazy registry, utils
type: backend
complexity: high
dependencies:
  - task_03
---

# Task 5: Core pipeline — unified, sanitize merger, lazy registry, utils

## Overview

Build the async `unified` pipeline composer, the layered sanitize schema merger, the `LazyRegistry` for on-demand loading of KaTeX/Mermaid/highlight.js, and the utility modules (debounce, FNV-1a hash). These are pure modules with no React dependencies — unit-testable in complete isolation. The XSS fixture battery and the per-feature Markdown fixtures live here, establishing the safety and correctness baseline before any UI is built.

<critical>
- ALWAYS READ the PRD and TechSpec before starting
- REFERENCE TECHSPEC for implementation details — do not duplicate here
- FOCUS ON "WHAT" — describe what needs to be accomplished, not how
- MINIMIZE CODE — show code only to illustrate current structure or problem areas
- TESTS REQUIRED — every task MUST include tests in deliverables
</critical>

<requirements>
- MUST implement `src/core/pipeline/builder.ts`: factory that composes a `unified` `Processor` from the static core stack (remark-parse → remark-gfm → remark-math → remark-rehype → rehype-katex → rehype-highlight → rehype-sanitize → rehype-react) plus dynamically merged plugin `remarkPlugins` / `rehypePlugins` contributions; processor must be rebuilt whenever plugin list or sanitize schema version changes
- MUST implement `src/core/pipeline/memo.ts`: memoization layer using FNV-1a cache key (hash of markdown string + plugin-list signature + sanitize-schema version); bounded LRU ≤4 entries
- MUST implement abort semantics: `usePreview` hook (task_07) will use a generation counter; the pipeline module must accept an `AbortSignal`-equivalent (generation number passed to `process`) and skip stale results
- MUST implement `src/core/sanitize/schema.ts`: `getCoreSchema()` returning deep-cloned merged schema (defaultSchema + core extensions for math, mermaid, alerts, heading slugs)
- MUST implement `src/core/sanitize/merge.ts`: `mergeSanitizeSchema(base, ext)` with property-level union semantics; locked clauses (`on*` removal, `javascript:` block, unbound `data:` block) MUST be preserved after every merge — assert this in tests
- MUST implement `src/core/lazy/registry.ts`: `LazyRegistry` with `register(name, loader)` and `get(name)` → `Promise<Module>`; module-level cache so each loader fires at most once
- MUST implement `src/core/lazy/detector.ts`: `detectFeatures(markdown)` returning `Set<'math' | 'mermaid' | 'code'>` via conservative regex; used to pre-warm the registry before pipeline execution
- MUST implement `src/utils/hash.ts`: FNV-1a 32-bit hash over string
- MUST implement `src/utils/debounce.ts`: standard debounce returning a cancel function
- MUST create `tests/fixtures/xss/` directory with OWASP XSS Filter Cheat Sheet vectors as `.html` fixture files and tests asserting they are sanitized to safe output
- MUST create `tests/fixtures/markdown/` with `in.md` + `out.html` pairs for every feature row in PRD §5.3.2 (GFM, math, mermaid, alerts, footnotes, code blocks, heading slugs, task lists)
- MUST NOT add React imports in any file under `src/core/` or `src/utils/`
</requirements>

## Subtasks

- [ ] 5.1 Write XSS fixture battery and pipeline sanitize tests — TDD red phase
- [ ] 5.2 Implement `src/core/sanitize/schema.ts` + `merge.ts` — TDD green phase
- [ ] 5.3 Implement `src/utils/hash.ts` (FNV-1a) + `src/utils/debounce.ts`
- [ ] 5.4 Implement `src/core/lazy/registry.ts` + `detector.ts`
- [ ] 5.5 Implement `src/core/pipeline/builder.ts` — compose unified processor per plugin list
- [ ] 5.6 Implement `src/core/pipeline/memo.ts` — LRU memoization with FNV cache key
- [ ] 5.7 Create markdown feature fixtures (`tests/fixtures/markdown/`)
- [ ] 5.8 Write pipeline feature tests against fixtures (verify in.md → out.html equality)

## Implementation Details

See TechSpec 'Core Interfaces' → 'API Endpoints' and ADR-002, ADR-004, ADR-006 for pipeline composition, memoization strategy, sanitize merge semantics, and lazy-load registry design.

Key constraints:
- Hash function: FNV-1a over the markdown string is sufficient for cache identity; do NOT use `xxhash-wasm` (too heavy per ADR-002).
- Sanitize merge: `mergeSanitizeSchema` must perform property-level union for `tagNames`, `attributes`, `protocols` arrays; it must NOT replace security-clause entries (e.g., stripping `on*` is always active).
- LazyRegistry: module-level `Map<name, Promise>` so parallel calls to `get(name)` share the same Promise.
- Detector regex must be conservative (false positives are acceptable; false negatives are not) — prefer matching on `$`, `$$`, ` ```mermaid ` markers.
- Pipeline builder must accept a `components` map (for `rehype-react`) so task_09 can swap in custom React components.

### Relevant Files

- `packages/bob-editor/src/core/pipeline/builder.ts` — create
- `packages/bob-editor/src/core/pipeline/memo.ts` — create
- `packages/bob-editor/src/core/pipeline/index.ts` — create (barrel)
- `packages/bob-editor/src/core/sanitize/schema.ts` — create
- `packages/bob-editor/src/core/sanitize/merge.ts` — create
- `packages/bob-editor/src/core/sanitize/index.ts` — create (barrel)
- `packages/bob-editor/src/core/lazy/registry.ts` — create
- `packages/bob-editor/src/core/lazy/detector.ts` — create
- `packages/bob-editor/src/utils/hash.ts` — create
- `packages/bob-editor/src/utils/debounce.ts` — create
- `packages/bob-editor/tests/unit/pipeline.test.ts` — create
- `packages/bob-editor/tests/unit/sanitize.test.ts` — create
- `packages/bob-editor/tests/unit/lazy.test.ts` — create
- `packages/bob-editor/tests/unit/hash.test.ts` — create
- `packages/bob-editor/tests/fixtures/xss/` — create
- `packages/bob-editor/tests/fixtures/markdown/` — create

### Dependent Files

- `src/hooks/usePreview.ts` (task_07) — calls `pipeline.process`, reads `LazyRegistry`, uses debounce
- `src/core/pluginManager.ts` (task_06) — calls `mergeSanitizeSchema` on plugin registration
- `src/components/Preview/MathBlock.tsx` (task_09) — registered in LazyRegistry as `math`
- `src/components/Preview/MermaidDiagram.tsx` (task_09) — registered as `mermaid`
- `src/components/Preview/CodeBlock.tsx` (task_09) — registered as `code`

### Related ADRs

- [ADR-002: Async unified pipeline with debounced memoization](adrs/adr-002.md) — Pipeline composition, memo strategy, generation-counter abort
- [ADR-004: GitHub sanitize schema + plugin-contributed extensions](adrs/adr-004.md) — Sanitize merge semantics and locked clause enforcement
- [ADR-006: Lazy-load heavy renderers via content detection](adrs/adr-006.md) — LazyRegistry design and detector pre-warm pattern

## Deliverables

- `src/core/pipeline/` (builder, memo, index)
- `src/core/sanitize/` (schema, merge, index)
- `src/core/lazy/` (registry, detector)
- `src/utils/hash.ts`, `src/utils/debounce.ts`
- `tests/fixtures/xss/` with OWASP XSS vectors
- `tests/fixtures/markdown/` with per-feature in/out pairs
- Unit tests with 80%+ coverage **(REQUIRED)**

## Tests

- Unit tests:
  - [ ] `hash("hello")` returns a stable 32-bit number across invocations; `hash("hello") !== hash("world")`
  - [ ] `debounce(fn, 100)` calls `fn` once after 100 ms even if invoked 5 times within 100 ms (use `vi.useFakeTimers`)
  - [ ] `mergeSanitizeSchema(base, { tagNames: ['math'] })` adds `math` to `tagNames` without removing base entries
  - [ ] `mergeSanitizeSchema` with any extension: result still blocks `script`, `on*` event handlers, `javascript:` protocols
  - [ ] `mergeSanitizeSchema` with extension attempting to add `script` to tagNames: `script` must still be absent in result
  - [ ] `getCoreSchema()` returns a deep clone — mutating the return value does not affect the next call
  - [ ] `LazyRegistry.get("math")` called 3 times in parallel: the loader fires exactly once
  - [ ] `detectFeatures("$x^2$")` returns a Set containing `"math"`
  - [ ] `detectFeatures("```mermaid\ngraph TD\n```")` returns a Set containing `"mermaid"`
  - [ ] `detectFeatures("no special syntax")` returns an empty Set
  - [ ] XSS: `<script>alert(1)</script>` in markdown renders to sanitized HTML with no `<script>` tag
  - [ ] XSS: `<img onerror="alert(1)" src="x">` in markdown renders with `onerror` attribute removed
  - [ ] XSS: `[click](javascript:alert(1))` in markdown renders link with `href` removed or replaced with `#`
  - [ ] XSS: `<a href="data:text/html,<script>alert(1)</script>">` is stripped (non-image data: URI)
  - [ ] Pipeline fixture: `tests/fixtures/markdown/gfm/in.md` processes to HTML matching `out.html`
  - [ ] Pipeline fixture: `tests/fixtures/markdown/math/in.md` processes to HTML containing KaTeX output
- Integration tests:
  - [ ] Full pipeline execution: `process("# Hello\n\n**world**")` resolves to a React element tree containing `h1` and `strong`
  - [ ] Memoization: processing the same markdown twice returns the same element reference (cache hit)
  - [ ] Stale-generation abort: starting process, incrementing generation counter, then awaiting result returns `null` (aborted)
- Test coverage target: >=80%
- All tests must pass

## Success Criteria

- All tests passing
- Test coverage >=80%
- Zero XSS vectors in the OWASP battery survive sanitization
- All per-feature markdown fixtures match expected HTML output
- `LazyRegistry` loader fires at most once per name (verified by call-count assertion)
- No React imports in `src/core/` or `src/utils/`
- `tsc --noEmit` zero errors
