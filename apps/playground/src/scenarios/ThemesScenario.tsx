import { useState } from 'react';
import { BobEditor, lightTheme, darkTheme, autoTheme } from 'bob-editor';
import type { BobmdTheme } from 'bob-editor';

type ThemeKey = 'light' | 'dark' | 'auto' | 'custom';

const customTheme: BobmdTheme = {
  '--mde-bg': '#1a1a2e',
  '--mde-fg': '#e0e0ff',
  '--mde-border': '#4a4a8a',
  '--mde-accent': '#7a7aff',
  '--mde-color-bg': '#1a1a2e',
  '--mde-color-fg': '#e0e0ff',
  '--mde-color-accent': '#7a7aff',
  '--mde-color-border': '#4a4a8a',
  '--mde-color-surface': '#2a2a4a',
  '--mde-color-code-bg': '#0d0d1a',
  '--mde-color-toolbar-bg': '#2a2a4a',
};

const THEME_MAP: Record<ThemeKey, BobmdTheme | 'light' | 'dark' | 'auto'> = {
  light: 'light',
  dark: 'dark',
  auto: 'auto',
  custom: customTheme,
};

const THEME_LABELS: Record<ThemeKey, string> = {
  light: 'Light',
  dark: 'Dark',
  auto: 'Auto (system)',
  custom: 'Custom (purple)',
};

export function ThemesScenario() {
  const [activeTheme, setActiveTheme] = useState<ThemeKey>('light');

  return (
    <div data-testid="scenario-themes" style={{ height: 'calc(100vh - 80px)' }}>
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.75rem', flexWrap: 'wrap' }}>
        {(Object.keys(THEME_MAP) as ThemeKey[]).map((key) => (
          <button
            key={key}
            type="button"
            data-testid={`theme-btn-${key}`}
            aria-pressed={activeTheme === key}
            onClick={() => setActiveTheme(key)}
            style={{
              padding: '0.25rem 0.75rem',
              border: '1px solid #d0d0d0',
              borderRadius: '4px',
              background: activeTheme === key ? '#0066cc' : '#fff',
              color: activeTheme === key ? '#fff' : '#333',
              cursor: 'pointer',
              fontSize: '0.8rem',
            }}
          >
            {THEME_LABELS[key]}
          </button>
        ))}
      </div>
      <BobEditor
        defaultValue={`# Theme: ${THEME_LABELS[activeTheme]}\n\nThis editor uses the **${THEME_LABELS[activeTheme]}** theme.`}
        theme={THEME_MAP[activeTheme]}
        key={activeTheme}
      />
    </div>
  );
}

// Suppress unused import warnings
void lightTheme;
void darkTheme;
void autoTheme;
