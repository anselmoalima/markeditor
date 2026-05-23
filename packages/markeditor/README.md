# markeditor

> Configurable React Markdown editor — Monaco Editor + unified (remark/rehype) preview pipeline. GFM, math, Mermaid, plugins, themes, i18n.

[![CI](https://github.com/anselmoalima/markeditor/actions/workflows/ci.yml/badge.svg)](https://github.com/anselmoalima/markeditor/actions/workflows/ci.yml)
[![npm version](https://img.shields.io/npm/v/markeditor.svg)](https://www.npmjs.com/package/markeditor)
[![Coverage](https://codecov.io/gh/anselmoalima/markeditor/graph/badge.svg)](https://codecov.io/gh/anselmoalima/markeditor)
[![Bundle size](https://img.shields.io/bundlephobia/minzip/markeditor)](https://bundlephobia.com/package/markeditor)
[![License: MIT](https://img.shields.io/github/license/anselmoalima/markeditor)](https://github.com/anselmoalima/markeditor)

## Install

```bash
pnpm add markeditor
# or
npm install markeditor
# or
yarn add markeditor
```

React 18 or 19 required as a peer dependency.

## Usage

```tsx
import { MarkEditor } from 'markeditor';
import 'markeditor/styles';

export default function App() {
  return <MarkEditor defaultValue="# Hello, world!" />;
}
```

### Controlled mode

```tsx
import { useState } from 'react';
import { MarkEditor } from 'markeditor';
import 'markeditor/styles';

export default function App() {
  const [value, setValue] = useState('# Hello');

  return <MarkEditor value={value} onChange={setValue} />;
}
```

### Imperative API

```tsx
import { useRef } from 'react';
import { MarkEditor } from 'markeditor';
import 'markeditor/styles';
import type { MarkEditorRef } from 'markeditor';

export default function App() {
  const ref = useRef<MarkEditorRef>(null);

  return (
    <>
      <MarkEditor ref={ref} defaultValue="# Hello" />
      <button onClick={() => ref.current?.focus()}>Focus editor</button>
    </>
  );
}
```

## Bundle size

Initial bundle (no Monaco): **< 80 KB gzip**. Monaco loads lazily on first edit — the preview pipeline ships in the initial chunk.

## Requirements

- React `^18 || ^19`
- Node `>=18.18` (build/dev only)

## Links

- [GitHub](https://github.com/anselmoalima/markeditor) — source, issues, PRs
- Changelog — see [Releases](https://github.com/anselmoalima/markeditor/releases)

## License

MIT © [anselmoalima](https://github.com/anselmoalima)
