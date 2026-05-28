/**
 * Custom theme example: applying a `BobmdTheme` object and switching
 * between multiple presets at runtime.
 */
import { useState } from 'react';
import { BobEditor, type BobmdTheme } from 'bob-editor';
import 'bob-editor/styles';

const themes: Record<string, BobmdTheme | 'light' | 'dark' | 'auto'> = {
  Light: 'light',
  Dark: 'dark',
  Auto: 'auto',
  Catppuccin: {
    '--mde-font-family': "'JetBrains Mono', monospace",
    '--mde-font-size': '14px',
    '--mde-border-radius': '8px',
    '--mde-bg': '#1e1e2e',
    '--mde-fg': '#cdd6f4',
    '--mde-border': '#45475a',
    '--mde-accent': '#89b4fa',
    '--mde-toolbar-bg': '#181825',
  },
  Solarized: {
    '--mde-bg': '#fdf6e3',
    '--mde-fg': '#657b83',
    '--mde-border': '#eee8d5',
    '--mde-accent': '#268bd2',
    '--mde-toolbar-bg': '#eee8d5',
  },
  Nord: {
    '--mde-bg': '#2e3440',
    '--mde-fg': '#d8dee9',
    '--mde-border': '#4c566a',
    '--mde-accent': '#88c0d0',
    '--mde-toolbar-bg': '#3b4252',
  },
};

const CONTENT = `# Theme Switcher

Use the buttons above to switch between built-in presets and fully **custom CSS variable themes**.

All customisation happens through \`--mde-*\` CSS variables — no extra CSS classes needed.

\`\`\`ts
const catppuccin: BobmdTheme = {
  '--mde-bg': '#1e1e2e',
  '--mde-fg': '#cdd6f4',
  '--mde-accent': '#89b4fa',
};

<BobEditor theme={catppuccin} />
\`\`\`

> **Tip:** Pass a \`BobmdTheme\` object for fully programmatic control, or use the preset strings
> \`"light"\`, \`"dark"\`, or \`"auto"\` for OS-aware switching.
`;

export default function CustomThemeExample() {
  const [selected, setSelected] = useState<string>('Light');
  const theme = themes[selected]!;

  return (
    <div style={{ maxWidth: 900, margin: '2rem auto', padding: '0 1rem' }}>
      <h1>bob-editor — Custom Themes</h1>

      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
        {Object.keys(themes).map((name) => (
          <button
            key={name}
            onClick={() => setSelected(name)}
            style={{
              padding: '0.35rem 0.9rem',
              borderRadius: 4,
              border: '1px solid #ccc',
              background: selected === name ? '#0066cc' : 'white',
              color: selected === name ? 'white' : 'inherit',
              cursor: 'pointer',
            }}
          >
            {name}
          </button>
        ))}
      </div>

      <BobEditor defaultValue={CONTENT} theme={theme} toolbar={{ sticky: false }} />

      {typeof theme === 'object' && (
        <details style={{ marginTop: '1rem' }}>
          <summary>Active theme tokens</summary>
          <pre style={{ background: '#f6f8fa', padding: '1rem', overflow: 'auto', fontSize: 13 }}>
            {JSON.stringify(theme, null, 2)}
          </pre>
        </details>
      )}
    </div>
  );
}
