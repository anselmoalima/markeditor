---
'bob-editor': minor
---

feat: extended markdown — math, mermaid, alerts, footnotes, code highlight (v0.3.0)

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
