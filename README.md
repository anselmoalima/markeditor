# markeditor

> Configurable React Markdown editor — Monaco Editor + unified (remark/rehype) preview pipeline. GFM, math, Mermaid, plugins, themes, i18n.

[![CI](https://github.com/anselmoalima/markeditor/actions/workflows/ci.yml/badge.svg)](https://github.com/anselmoalima/markeditor/actions/workflows/ci.yml)
[![npm version](https://img.shields.io/npm/v/markeditor.svg)](https://www.npmjs.com/package/markeditor)
[![Coverage](https://codecov.io/gh/anselmoalima/markeditor/graph/badge.svg)](https://codecov.io/gh/anselmoalima/markeditor)
[![Bundle size](https://img.shields.io/bundlephobia/minzip/markeditor)](https://bundlephobia.com/package/markeditor)
[![License: MIT](https://img.shields.io/github/license/anselmoalima/markeditor)](LICENSE)

## Install

```bash
pnpm add markeditor
```

## Usage

```tsx
import { MarkEditor } from 'markeditor';
import 'markeditor/styles';

export default function App() {
  return <MarkEditor defaultValue="# Hello, world!" />;
}
```

Toggle between **edit** and **preview** mode via the built-in toolbar, or control it programmatically:

```tsx
import { useState } from 'react';
import { MarkEditor } from 'markeditor';
import 'markeditor/styles';
import type { MarkMode } from 'markeditor';

export default function App() {
  const [mode, setMode] = useState<MarkMode>('edit');

  return <MarkEditor defaultValue="# Hello" mode={mode} onModeChange={setMode} />;
}
```

## Playground

Live demo → [markeditor.vercel.app](https://markeditor.vercel.app) _(deploy in Phase 6)_

## Docs

- [PRD](PRD.md) — product requirements and feature roadmap
- [Design System](DESIGN.md) — tokens, colors, typography
- [Contributing](CONTRIBUTING.md) — dev workflow and release guide
- [Claude AI context](CLAUDE.md) — codebase guide for AI-assisted development

## License

MIT © [anselmoalima](https://github.com/anselmoalima)
