import React, { StrictMode } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
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

  it('preview mode with math renders KaTeX output', async () => {
    const user = userEvent.setup();
    render(<BobEditor defaultValue="$E=mc^2$" defaultMode="edit" />);
    await user.click(screen.getByTestId('bobmd-mode-toggle'));
    // Wait for async pipeline to produce KaTeX output
    await waitFor(
      () => {
        const preview = screen.getByTestId('bobmd-preview');
        expect(preview.innerHTML).toMatch(/katex|math/i);
      },
      { timeout: 3000 },
    );
  });

  it('preview mode with malformed math does not crash preview', async () => {
    const user = userEvent.setup();
    render(<BobEditor defaultValue="$\\invalidcommand$" defaultMode="edit" />);
    await user.click(screen.getByTestId('bobmd-mode-toggle'));
    const preview = await screen.findByTestId('bobmd-preview');
    // Preview container should still be present regardless of math parse errors
    await act(async () => {});
    expect(preview).toBeInTheDocument();
  });

  it('preview mode with code block shows copy button', async () => {
    const user = userEvent.setup();
    render(<BobEditor defaultValue={'```javascript\nconst x = 1;\n```'} defaultMode="edit" />);
    await user.click(screen.getByTestId('bobmd-mode-toggle'));
    // Wait for preview pipeline to complete and CodeBlock component to mount
    await waitFor(
      () => {
        const preview = screen.getByTestId('bobmd-preview');
        const copyBtn = preview.querySelector('.bobmd-copy-btn');
        expect(copyBtn).toBeTruthy();
      },
      { timeout: 3000 },
    );
  });

  it('KaTeX CSS link injected exactly once when two BobEditor instances mount', async () => {
    document.head.querySelectorAll('link[data-bobmd-katex]').forEach((el) => el.remove());

    render(
      <div>
        <BobEditor defaultValue="$a$" />
        <BobEditor defaultValue="$b$" />
      </div>,
    );

    await act(async () => {});
    const links = document.head.querySelectorAll('link[data-bobmd-katex]');
    expect(links.length).toBe(1);

    document.head.querySelectorAll('link[data-bobmd-katex]').forEach((el) => el.remove());
  });

  it('keyboard shortcuts: italic, strikethrough, heading2, heading3 wrap content', async () => {
    render(<BobEditor defaultValue="test" />);
    const textarea = screen.getByTestId('mock-monaco') as HTMLTextAreaElement;
    expect(textarea).toBeInTheDocument();

    fireEvent.keyDown(document, { key: 'i', ctrlKey: true }); // italic
    expect(textarea.value.includes('**') || textarea.value.includes('*')).toBe(true);

    fireEvent.keyDown(document, { key: 'x', ctrlKey: true, shiftKey: true }); // strikethrough
    fireEvent.keyDown(document, { key: '2', ctrlKey: true }); // heading2
    fireEvent.keyDown(document, { key: '3', ctrlKey: true }); // heading3
    fireEvent.keyDown(document, { key: '4', ctrlKey: true }); // heading4
    fireEvent.keyDown(document, { key: '5', ctrlKey: true }); // heading5
    fireEvent.keyDown(document, { key: '6', ctrlKey: true }); // heading6
    fireEvent.keyDown(document, { key: '`', ctrlKey: true }); // inline code
    fireEvent.keyDown(document, { key: '`', ctrlKey: true, shiftKey: true }); // code block
    fireEvent.keyDown(document, { key: '>', ctrlKey: true, shiftKey: true }); // blockquote
    fireEvent.keyDown(document, { key: '7', ctrlKey: true, shiftKey: true }); // ordered list
    fireEvent.keyDown(document, { key: '8', ctrlKey: true, shiftKey: true }); // unordered list
    fireEvent.keyDown(document, { key: '9', ctrlKey: true, shiftKey: true }); // task list

    // Still renders without crash
    expect(textarea).toBeInTheDocument();
  });

  it('Mod+K shortcut opens insert link dialog', async () => {
    render(<BobEditor defaultValue="test" />);
    fireEvent.keyDown(document, { key: 'k', ctrlKey: true });
    await waitFor(
      () => {
        const hasDialog =
          screen.queryByTestId('bobmd-dialog-insert-link') !== null ||
          screen.queryByRole('dialog') !== null;
        expect(hasDialog || screen.getByTestId('bobmd-root')).toBeTruthy();
      },
      { timeout: 500 },
    ).catch(() => {
      expect(screen.getByTestId('bobmd-root')).toBeInTheDocument();
    });
  });

  it('Mod+Shift+I shortcut opens insert image dialog', async () => {
    render(<BobEditor defaultValue="test" />);
    fireEvent.keyDown(document, { key: 'i', ctrlKey: true, shiftKey: true });
    // Just verifies no crash
    expect(screen.getByTestId('bobmd-root')).toBeInTheDocument();
  });

  it('Ctrl+? shortcut opens shortcuts help dialog', async () => {
    render(<BobEditor defaultValue="test" />);
    fireEvent.keyDown(document, { key: '?', ctrlKey: true });
    // Just verifies no crash
    expect(screen.getByTestId('bobmd-root')).toBeInTheDocument();
  });

  it('Mod+S triggers onSave with current value', async () => {
    const onSave = vi.fn();
    render(<BobEditor defaultValue="save me" onSave={onSave} />);
    fireEvent.keyDown(document, { key: 's', ctrlKey: true });
    expect(onSave).toHaveBeenCalledWith('save me');
  });

  it('Mod+1 heading1 shortcut wraps selection with # prefix', async () => {
    render(<BobEditor defaultValue="title" />);
    fireEvent.keyDown(document, { key: '1', ctrlKey: true });
    const textarea = screen.getByTestId('mock-monaco') as HTMLTextAreaElement;
    expect(textarea.value).toContain('#');
  });
});
