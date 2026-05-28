/**
 * Smoke render tests: each scenario component renders without throwing.
 * Uses RTL with jsdom. Monaco is never loaded (lazy import stays pending in jsdom).
 */
import { describe, it, expect, vi, beforeAll } from 'vitest';
import { render } from '@testing-library/react';
import { StrictMode } from 'react';

// --- mocks ---

// Mock monaco-editor dynamic import (prevents actual Monaco load in jsdom)
vi.mock('@monaco-editor/react', () => ({
  default: ({ value }: { value?: string }) => (
    <textarea data-testid="monaco-mock" defaultValue={value ?? ''} />
  ),
}));

// Mock bob-editor/styles import (CSS file)
vi.mock('bob-editor/styles', () => ({}));

// Mock MSW browser module (not needed for unit tests)
vi.mock('../src/mocks/browser.js', () => ({ worker: { start: vi.fn() } }));

// Mock the large markdown fixture raw import
vi.mock('../../../../packages/bob-editor/tests/fixtures/markdown/large/10k.md?raw', () => ({
  default: '# Large Document\n\nContent.',
}));

// Mock import.meta.env for main.tsx
vi.stubGlobal('import.meta', { env: { DEV: false, VITE_MSW: undefined } });

beforeAll(() => {
  // Suppress console.error for known React warnings in jsdom
  vi.spyOn(console, 'error').mockImplementation(() => undefined);
  vi.spyOn(console, 'warn').mockImplementation(() => undefined);
});

// --- helpers ---
function renderScenario(jsx: React.ReactElement) {
  const result = render(<StrictMode>{jsx}</StrictMode>);
  expect(result.container.firstChild).not.toBeNull();
  return result;
}

// --- smoke tests ---

describe('Scenario smoke renders', () => {
  it('Default renders', async () => {
    const { Default } = await import('../src/scenarios/Default.js');
    renderScenario(<Default />);
  });

  it('Uncontrolled renders', async () => {
    const { Uncontrolled } = await import('../src/scenarios/Uncontrolled.js');
    renderScenario(<Uncontrolled />);
  });

  it('CustomToolbar renders', async () => {
    const { CustomToolbar } = await import('../src/scenarios/CustomToolbar.js');
    renderScenario(<CustomToolbar />);
  });

  it('WithPlugins renders', async () => {
    const { WithPlugins } = await import('../src/scenarios/WithPlugins.js');
    renderScenario(<WithPlugins />);
  });

  it('MathScenario renders', async () => {
    const { MathScenario } = await import('../src/scenarios/MathScenario.js');
    renderScenario(<MathScenario />);
  });

  it('MermaidScenario renders', async () => {
    const { MermaidScenario } = await import('../src/scenarios/MermaidScenario.js');
    renderScenario(<MermaidScenario />);
  });

  it('AlertsScenario renders', async () => {
    const { AlertsScenario } = await import('../src/scenarios/AlertsScenario.js');
    renderScenario(<AlertsScenario />);
  });

  it('ImageUpload renders', async () => {
    const { ImageUpload } = await import('../src/scenarios/ImageUpload.js');
    renderScenario(<ImageUpload />);
  });

  it('StorageScenario renders', async () => {
    const { StorageScenario } = await import('../src/scenarios/StorageScenario.js');
    renderScenario(<StorageScenario />);
  });

  it('ThemesScenario renders', async () => {
    const { ThemesScenario } = await import('../src/scenarios/ThemesScenario.js');
    renderScenario(<ThemesScenario />);
  });

  it('I18nScenario renders', async () => {
    const { I18nScenario } = await import('../src/scenarios/I18nScenario.js');
    renderScenario(<I18nScenario />);
  });

  it('ExportScenario renders', async () => {
    const { ExportScenario } = await import('../src/scenarios/ExportScenario.js');
    renderScenario(<ExportScenario />);
  });

  it('LargeDocument renders', async () => {
    const { LargeDocument } = await import('../src/scenarios/LargeDocument.js');
    renderScenario(<LargeDocument />);
  });

  it('Readonly renders', async () => {
    const { Readonly } = await import('../src/scenarios/Readonly.js');
    renderScenario(<Readonly />);
  });

  it('SsrSafe renders', async () => {
    const { SsrSafe } = await import('../src/scenarios/SsrSafe.js');
    renderScenario(<SsrSafe />);
  });
});
