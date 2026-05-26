import React, { StrictMode } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe } from 'jest-axe';
import { BobEditor } from '../../src/BobEditor.js';
import { lightTheme } from '../../src/themes/light.js';
import { darkTheme } from '../../src/themes/dark.js';

vi.mock('@monaco-editor/react', () => ({
  default: ({
    value,
    onChange,
    options,
  }: {
    value: string;
    onChange?: (value: string) => void;
    options?: { readOnly?: boolean };
  }) => (
    <textarea
      aria-label="Markdown editor"
      data-testid="mock-monaco"
      value={value}
      readOnly={Boolean(options?.readOnly)}
      onChange={(event) => onChange?.(event.currentTarget.value)}
    />
  ),
}));

afterEach(cleanup);

function getEditorInput(): HTMLTextAreaElement {
  const monaco = screen.queryByTestId('mock-monaco');
  if (monaco instanceof HTMLTextAreaElement) return monaco;
  return screen.getByTestId('bobmd-textarea') as HTMLTextAreaElement;
}

describe('BobEditor integration', () => {
  it('controlled mode: typing calls onChange and prop updates editor content', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    const { rerender } = render(<BobEditor value="# Hello" onChange={onChange} />);

    const editorInput = (await screen.findByTestId('mock-monaco')) as HTMLTextAreaElement;
    await user.type(editorInput, ' world');
    expect(onChange).toHaveBeenCalled();

    rerender(<BobEditor value="# New" onChange={onChange} />);
    expect(getEditorInput()).toHaveValue('# New');
  });

  it('uncontrolled mode: starts from defaultValue and updates internal state', async () => {
    const user = userEvent.setup();
    render(<BobEditor defaultValue="# Hi" />);

    const textarea = (await screen.findByTestId('mock-monaco')) as HTMLTextAreaElement;
    expect(textarea).toHaveValue('# Hi');

    await user.type(textarea, ' there');
    expect(textarea).toHaveValue('# Hi there');
  });

  it('mode toggle switches to preview and fires onModeChange', async () => {
    const user = userEvent.setup();
    const onModeChange = vi.fn();
    render(<BobEditor defaultValue="# Title" onModeChange={onModeChange} />);

    await user.click(screen.getByTestId('bobmd-mode-toggle'));
    expect(onModeChange).toHaveBeenCalledWith('preview');
    expect(screen.getByTestId('bobmd-preview')).toBeInTheDocument();
  });

  it('preserves content when toggling preview back to edit', async () => {
    const user = userEvent.setup();
    render(<BobEditor defaultValue="# Keep me" />);

    await user.click(screen.getByTestId('bobmd-mode-toggle'));
    await user.click(screen.getByTestId('bobmd-mode-toggle'));

    expect(getEditorInput()).toHaveValue('# Keep me');
  });

  it('allowedModes with single mode hides mode toggle', () => {
    render(<BobEditor allowedModes={['preview']} defaultMode="preview" />);
    expect(screen.queryByTestId('bobmd-mode-toggle')).not.toBeInTheDocument();
  });

  it('readOnly applies to textarea and monaco', () => {
    render(<BobEditor readOnly defaultValue="readonly" />);
    expect(screen.getByTestId('mock-monaco')).toHaveAttribute('readonly');
  });

  it('onMount fires once in strict mode', async () => {
    vi.useFakeTimers();
    const onMount = vi.fn();

    render(
      <StrictMode>
        <BobEditor onMount={onMount} />
      </StrictMode>,
    );

    await vi.runAllTimersAsync();
    expect(onMount).toHaveBeenCalledTimes(1);
    vi.useRealTimers();
  });

  it('applies light and dark theme variables on root', () => {
    const { rerender } = render(<BobEditor theme="light" />);
    const root = screen.getByTestId('bobmd-root');
    expect(root).toHaveStyle(`--mde-bg: ${lightTheme['--mde-bg']}`);

    rerender(<BobEditor theme="dark" />);
    expect(root).toHaveStyle(`--mde-bg: ${darkTheme['--mde-bg']}`);
  });

  it('is accessible in edit and preview mode', async () => {
    const user = userEvent.setup();
    const { container } = render(<BobEditor defaultValue="# A11y" />);
    expect(await axe(container)).toHaveNoViolations();

    await user.click(screen.getByTestId('bobmd-mode-toggle'));
    expect(await axe(container)).toHaveNoViolations();
  });

  it('auto theme follows matchMedia changes', async () => {
    const listeners = new Set<(event: MediaQueryListEvent) => void>();
    let dark = false;

    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: () => ({
        get matches() {
          return dark;
        },
        media: '(prefers-color-scheme: dark)',
        onchange: null,
        addListener: () => undefined,
        removeListener: () => undefined,
        addEventListener: (_: string, cb: (event: MediaQueryListEvent) => void) =>
          listeners.add(cb),
        removeEventListener: (_: string, cb: (event: MediaQueryListEvent) => void) =>
          listeners.delete(cb),
        dispatchEvent: () => false,
      }),
    });

    render(<BobEditor theme="auto" />);
    const root = screen.getByTestId('bobmd-root');
    expect(root).toHaveStyle(`--mde-bg: ${lightTheme['--mde-bg']}`);

    dark = true;
    await act(async () => {
      for (const listener of listeners) {
        listener({ matches: true } as MediaQueryListEvent);
      }
    });

    expect(root).toHaveStyle(`--mde-bg: ${darkTheme['--mde-bg']}`);
  });

  it('SSR-safe fallback renders without Monaco errors', () => {
    expect(() => render(<BobEditor defaultValue="server-safe" />)).not.toThrow();
    expect(getEditorInput()).toBeInTheDocument();
  });
});
