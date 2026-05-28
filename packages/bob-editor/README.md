# bob-editor

> Full-featured React Markdown editor — Monaco-powered, unified-rendered, plugin-extensible.

[![npm](https://img.shields.io/npm/v/bob-editor)](https://www.npmjs.com/package/bob-editor)
[![license](https://img.shields.io/npm/l/bob-editor)](./LICENSE)
[![types](https://img.shields.io/npm/types/bob-editor)](./src/types.ts)

## Features

- **Toggle mode** — seamless Edit ↔ Preview toggle
- **Monaco Editor** engine (lazy-loaded, < 80 KB core bundle)
- **Rich Markdown** — GFM, math (KaTeX), Mermaid diagrams, alerts/callouts, footnotes, syntax highlighting
- **Plugin system** — lifecycle hooks, custom toolbar buttons, shortcuts, and rehype/remark extensions
- **Toolbar** — configurable, keyboard-navigable, sticky option
- **Themes** — `light` / `dark` / `auto` presets + full CSS-variable customization
- **i18n** — swap locale at runtime, fallback to `en`
- **Persistence** — localStorage / sessionStorage with configurable autoSave
- **Image upload** — click, drag-and-drop, paste; rollback on failure
- **Export** — HTML, Markdown, or print
- **Accessible** — WCAG 2.1 AA, zero axe violations

---

## Installation

```bash
npm install bob-editor
# or
pnpm add bob-editor
# or
yarn add bob-editor
```

React 18 or 19 is required as a peer dependency.

---

## Quick Start

```tsx
import { BobEditor } from 'bob-editor';
import 'bob-editor/styles';

export function App() {
  return <BobEditor defaultValue="# Hello, world!" />;
}
```

### Controlled mode

```tsx
import { useState } from 'react';
import { BobEditor } from 'bob-editor';
import 'bob-editor/styles';

export function App() {
  const [value, setValue] = useState('# Hello');

  return <BobEditor value={value} onChange={setValue} onSave={(md) => console.log('saved', md)} />;
}
```

---

## Props

### Content

| Prop           | Type                                       | Default | Description                  |
| -------------- | ------------------------------------------ | ------- | ---------------------------- |
| `value`        | `string`                                   | —       | Controlled Markdown value    |
| `defaultValue` | `string`                                   | `''`    | Uncontrolled initial value   |
| `onChange`     | `(value: string) => void`                  | —       | Called on every edit         |
| `onSave`       | `(value: string) => void \| Promise<void>` | —       | Called on `Mod+S`            |
| `placeholder`  | `string`                                   | `''`    | Placeholder shown when empty |
| `readOnly`     | `boolean`                                  | `false` | Disables editing             |

### Mode

| Prop           | Type                         | Default              | Description                        |
| -------------- | ---------------------------- | -------------------- | ---------------------------------- |
| `mode`         | `'edit' \| 'preview'`        | —                    | Controlled mode                    |
| `defaultMode`  | `'edit' \| 'preview'`        | `'edit'`             | Uncontrolled initial mode          |
| `onModeChange` | `(mode: EditorMode) => void` | —                    | Called on mode change              |
| `allowedModes` | `readonly EditorMode[]`      | `['edit','preview']` | Restrict which modes are available |

### Toolbar

| Prop      | Type                       | Default | Description            |
| --------- | -------------------------- | ------- | ---------------------- |
| `toolbar` | `boolean \| ToolbarConfig` | `true`  | Show/configure toolbar |

`ToolbarConfig`:

```ts
{
  items?: Array<ToolbarButton | string>; // string = built-in button id; 'separator' = divider
  sticky?: boolean;                      // stick toolbar to top on scroll
  overflow?: boolean;                    // collapse extra buttons into a dropdown
}
```

### Plugins & Extensions

| Prop            | Type                                                    | Default | Description                         |
| --------------- | ------------------------------------------------------- | ------- | ----------------------------------- |
| `plugins`       | `readonly BobEditorPlugin[]`                            | `[]`    | Custom plugins                      |
| `shortcuts`     | `{ override?: KeyboardShortcut[]; disable?: string[] }` | —       | Override/disable built-in shortcuts |
| `components`    | `Record<string, ComponentType>`                         | —       | Custom rehype React components      |
| `remarkPlugins` | `PluggableList`                                         | —       | Extra remark plugins                |
| `rehypePlugins` | `PluggableList`                                         | —       | Extra rehype plugins                |
| `sanitize`      | `boolean \| Schema \| ((merged: Schema) => Schema)`     | `true`  | Sanitization control                |

### Storage

| Prop      | Type            | Default | Description               |
| --------- | --------------- | ------- | ------------------------- |
| `storage` | `StorageConfig` | —       | Persistence configuration |

```ts
interface StorageConfig {
  enabled?: boolean; // default: false
  storageKey?: string; // default: 'bob-editor-content'
  storage?: 'localStorage' | 'sessionStorage'; // default: 'localStorage'
  autoSaveInterval?: number; // ms between auto-saves; default: 1000
}
```

### Theme & i18n

| Prop     | Type                                        | Default   | Description                      |
| -------- | ------------------------------------------- | --------- | -------------------------------- |
| `theme`  | `'light' \| 'dark' \| 'auto' \| BobmdTheme` | `'light'` | Theme preset or custom token map |
| `locale` | `string`                                    | `'en'`    | BCP 47 locale tag                |
| `i18n`   | `Partial<I18nMessages>`                     | —         | Override specific UI strings     |

### Images & Export

| Prop            | Type                                                     | Default | Description                 |
| --------------- | -------------------------------------------------------- | ------- | --------------------------- |
| `onImageUpload` | `(file: File) => Promise<{ url: string; alt?: string }>` | —       | Image upload handler        |
| `enableExport`  | `boolean \| ExportConfig`                                | `false` | Enable export toolbar items |

```ts
interface ExportConfig {
  html?: boolean; // Export as HTML
  markdown?: boolean; // Export as .md file
  print?: boolean; // Print preview
  filename?: string; // Base filename (default: 'document')
}
```

### Advanced

| Prop                | Type                       | Default | Description                        |
| ------------------- | -------------------------- | ------- | ---------------------------------- |
| `previewDebounceMs` | `number`                   | `150`   | Preview re-render debounce         |
| `editorOptions`     | `MonacoEditorOptions`      | —       | Pass-through Monaco editor options |
| `onMount`           | `(api: EditorAPI) => void` | —       | Called when editor mounts          |
| `onError`           | `(error: Error) => void`   | —       | Error boundary callback            |

---

## Imperative API (`ref`)

```tsx
import { useRef } from 'react';
import { BobEditor, type BobEditorRef } from 'bob-editor';
import 'bob-editor/styles';

export function App() {
  const ref = useRef<BobEditorRef>(null);

  return (
    <>
      <BobEditor ref={ref} defaultValue="Hello" />
      <button onClick={() => ref.current?.insertText('**bold**')}>Insert</button>
    </>
  );
}
```

### `BobEditorRef` methods

| Method             | Signature                       | Description                       |
| ------------------ | ------------------------------- | --------------------------------- |
| `getValue`         | `() => string`                  | Get current Markdown value        |
| `setValue`         | `(value: string) => void`       | Replace entire content            |
| `focus`            | `() => void`                    | Focus the editor                  |
| `blur`             | `() => void`                    | Blur the editor                   |
| `getMode`          | `() => EditorMode`              | Get current mode                  |
| `setMode`          | `(mode: EditorMode) => void`    | Switch mode                       |
| `insertText`       | `(text: string, opts?) => void` | Insert text at cursor or position |
| `getSelection`     | `() => { start, end, text }`    | Get selected text and range       |
| `exportAsHtml`     | `() => Promise<string>`         | Render to sanitized HTML string   |
| `exportAsMarkdown` | `() => string`                  | Get raw Markdown                  |

---

## Keyboard Shortcuts

`Mod` = `Cmd` on macOS, `Ctrl` on Windows/Linux.

| ID               | Keys           | Description              |
| ---------------- | -------------- | ------------------------ |
| `bold`           | `Mod+B`        | Bold                     |
| `italic`         | `Mod+I`        | Italic                   |
| `strikethrough`  | `Mod+Shift+X`  | Strikethrough            |
| `h1`             | `Mod+1`        | Heading 1                |
| `h2`             | `Mod+2`        | Heading 2                |
| `h3`             | `Mod+3`        | Heading 3                |
| `h4`             | `Mod+4`        | Heading 4                |
| `h5`             | `Mod+5`        | Heading 5                |
| `h6`             | `Mod+6`        | Heading 6                |
| `link`           | `Mod+K`        | Insert Link              |
| `image`          | `Mod+Shift+I`  | Insert Image             |
| `code`           | `Mod+\``       | Inline Code              |
| `code-block`     | `Mod+Shift+\`` | Code Block               |
| `blockquote`     | `Mod+Shift+>`  | Blockquote               |
| `ordered-list`   | `Mod+Shift+7`  | Ordered List             |
| `unordered-list` | `Mod+Shift+8`  | Unordered List           |
| `task-list`      | `Mod+Shift+9`  | Task List                |
| `undo`           | `Mod+Z`        | Undo                     |
| `redo`           | `Mod+Shift+Z`  | Redo                     |
| `save`           | `Mod+S`        | Save (triggers `onSave`) |
| `shortcuts-help` | `Ctrl+?`       | Show shortcuts dialog    |

### Override or disable shortcuts

```tsx
<BobEditor
  shortcuts={{
    override: [{ id: 'bold', keys: 'Mod+Shift+B', action: (api) => api.wrapSelection('**', '**') }],
    disable: ['strikethrough'],
  }}
/>
```

---

## Plugin System

```ts
import type { BobEditorPlugin } from 'bob-editor';

const wordCountPlugin: BobEditorPlugin = {
  name: 'my-word-count',
  onMount(api) {
    const interval = setInterval(() => {
      const words = api.getValue().split(/\s+/).filter(Boolean).length;
      console.log('Words:', words);
    }, 2000);
    return () => clearInterval(interval); // cleanup on unmount
  },
  onChange(value) {
    // called on every change
  },
};

// Apply to editor
<BobEditor plugins={[wordCountPlugin]} />
```

### Plugin interface

```ts
interface BobEditorPlugin {
  name: string;
  version?: string;
  remarkPlugins?: PluggableList;
  rehypePlugins?: PluggableList;
  sanitizeSchema?: SchemaExtension;
  toolbarButtons?: ToolbarButton[];
  shortcuts?: KeyboardShortcut[];
  components?: Record<string, ComponentType>;
  i18n?: Record<string, Record<string, string>>;
  onMount?: (api: EditorAPI) => void | (() => void);
  onChange?: (value: string, api: EditorAPI) => void;
  onBeforeParse?: (markdown: string) => string;
  onAfterRender?: (root: HastRoot) => HastRoot | void;
}
```

### Built-in opt-in plugins

```ts
import { emojiPlugin } from 'bob-editor/plugins/emoji';
import { mentionsPlugin } from 'bob-editor/plugins/mentions';
import { wordCountPlugin } from 'bob-editor/plugins/wordCount';
import { tableOfContentsPlugin } from 'bob-editor/plugins/tableOfContents';

<BobEditor plugins={[emojiPlugin(), mentionsPlugin(), wordCountPlugin()]} />
```

---

## Themes

### Presets

```tsx
<BobEditor theme="dark" />
<BobEditor theme="auto" />  {/* follows OS preference */}
```

### Custom theme via CSS variables

Override the `--mde-*` CSS custom properties on any ancestor element or globally:

```css
.my-editor {
  --mde-font-family: 'JetBrains Mono', monospace;
  --mde-font-size: 15px;
  --mde-border-radius: 4px;
  --mde-bg: #1e1e2e;
  --mde-fg: #cdd6f4;
  --mde-border: #45475a;
  --mde-accent: #89b4fa;
  --mde-toolbar-bg: #181825;
}
```

| Token                 | Default (light)         | Description                           |
| --------------------- | ----------------------- | ------------------------------------- |
| `--mde-font-family`   | `system-ui, sans-serif` | Editor font                           |
| `--mde-font-size`     | `14px`                  | Base font size                        |
| `--mde-border-radius` | `6px`                   | Corner radius                         |
| `--mde-bg`            | `#ffffff`               | Background                            |
| `--mde-fg`            | `#1a1a1a`               | Foreground / text                     |
| `--mde-border`        | `#d0d0d0`               | Border / divider                      |
| `--mde-accent`        | `#0066cc`               | Primary accent (links, focus, active) |
| `--mde-toolbar-bg`    | `var(--mde-bg)`         | Toolbar background                    |

### Custom theme via `BobmdTheme` object

```tsx
import type { BobmdTheme } from 'bob-editor';

const myTheme: BobmdTheme = {
  '--mde-bg': '#282c34',
  '--mde-fg': '#abb2bf',
  '--mde-border': '#3e4451',
  '--mde-accent': '#61afef',
};

<BobEditor theme={myTheme} />;
```

---

## Bundler Recipes

### Vite

```ts
// vite.config.ts
import { defineConfig } from 'vite';

export default defineConfig({
  optimizeDeps: {
    // Pre-bundle Monaco worker assets for dev server
    exclude: ['monaco-editor'],
  },
  worker: {
    format: 'es',
  },
});
```

### Next.js (App Router)

Monaco Editor is client-only. Use `dynamic` to skip SSR:

```tsx
// app/editor/page.tsx
import dynamic from 'next/dynamic';

const BobEditor = dynamic(() => import('bob-editor').then((m) => ({ default: m.BobEditor })), {
  ssr: false,
  loading: () => <p>Loading editor…</p>,
});

export default function EditorPage() {
  return (
    <>
      <link rel="stylesheet" href="/node_modules/bob-editor/dist/styles.css" />
      <BobEditor defaultValue="# Hello" />
    </>
  );
}
```

### Remix

```tsx
// app/routes/editor.tsx
import { ClientOnly } from 'remix-utils/client-only';

export default function EditorRoute() {
  return (
    <ClientOnly fallback={<p>Loading…</p>}>
      {() => {
        const { BobEditor } = require('bob-editor');
        return <BobEditor defaultValue="# Hello" />;
      }}
    </ClientOnly>
  );
}
```

---

## Migration Guide

If you previously used the Phase 0 stub (package version `0.0.x`), the component was not functional. Upgrade to `1.0.0` and replace any workaround imports:

```diff
- import { BobEditor } from 'bobmd';  // old package name
+ import { BobEditor } from 'bob-editor';
+ import 'bob-editor/styles';
```

All props in v1.0.0 are documented in this README. There is no breaking change from `0.0.x` since the prior version had no public API.

---

## License

MIT © 2024 Anselmo Lima
