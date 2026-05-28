import React from 'react';
import { afterEach, describe, expect, it, vi, beforeEach } from 'vitest';
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BobEditor } from '../../src/BobEditor.js';
import { resolveMessage } from '../../src/i18n/index.js';

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

describe('Toolbar', () => {
  it('toolbar: false — no toolbar element rendered', () => {
    render(<BobEditor toolbar={false} />);
    expect(screen.queryByTestId('bobmd-toolbar')).not.toBeInTheDocument();
  });

  it('toolbar: true — all 19 default button IDs present', () => {
    render(<BobEditor toolbar={true} />);
    const expectedIds = [
      'bold',
      'italic',
      'strikethrough',
      'heading1',
      'heading2',
      'heading3',
      'heading4',
      'heading5',
      'heading6',
      'link',
      'image',
      'code',
      'codeblock',
      'blockquote',
      'ordered-list',
      'unordered-list',
      'task-list',
      'undo',
      'redo',
    ];
    for (const id of expectedIds) {
      expect(
        screen.getByTestId(`bobmd-toolbar-btn-${id}`),
        `Missing button: ${id}`,
      ).toBeInTheDocument();
    }
  });

  it('overflow at 500px: shows overflow button', async () => {
    let resizeCallback: ResizeObserverCallback | null = null;

    class MockResizeObserver {
      constructor(cb: ResizeObserverCallback) {
        resizeCallback = cb;
      }
      observe() {}
      unobserve() {}
      disconnect() {}
    }

    Object.defineProperty(window, 'ResizeObserver', {
      writable: true,
      value: MockResizeObserver,
    });

    render(<BobEditor toolbar={true} />);

    await act(async () => {
      resizeCallback?.(
        [{ contentRect: { width: 500 } } as ResizeObserverEntry],
        {} as ResizeObserver,
      );
    });

    expect(screen.getByTestId('bobmd-toolbar-overflow-btn')).toBeInTheDocument();
  });

  it('bold button has aria-pressed="false" initially', () => {
    render(<BobEditor toolbar={true} />);
    const boldBtn = screen.getByTestId('bobmd-toolbar-btn-bold');
    expect(boldBtn).toHaveAttribute('aria-pressed', 'false');
  });

  it('keyboard navigation: ArrowRight moves focus between toolbar buttons', async () => {
    render(<BobEditor toolbar={true} />);
    const toolbar = screen.getByTestId('bobmd-toolbar');
    const buttons = Array.from(
      toolbar.querySelectorAll<HTMLButtonElement>('button:not([disabled])'),
    );

    // Focus first button
    buttons[0]?.focus();
    expect(document.activeElement).toBe(buttons[0]);

    // ArrowRight
    fireEvent.keyDown(toolbar, { key: 'ArrowRight' });
    expect(document.activeElement).toBe(buttons[1]);
  });

  it('i18n resolver: resolveMessage("bold", "pt-BR") returns "Negrito"', () => {
    const result = resolveMessage('bold', 'pt-BR', {});
    expect(result).toBe('Negrito');
  });

  it('switching locale: bold button title changes', () => {
    const { rerender } = render(<BobEditor toolbar={true} locale="en" />);
    const boldBtn = screen.getByTestId('bobmd-toolbar-btn-bold');
    expect(boldBtn.title).toContain('Bold');

    rerender(<BobEditor toolbar={true} locale="pt-BR" />);
    const boldBtnPt = screen.getByTestId('bobmd-toolbar-btn-bold');
    expect(boldBtnPt.title).toContain('Negrito');
  });

  it('bold button click: wrapSelection called with ** markers', async () => {
    const user = userEvent.setup();
    render(<BobEditor toolbar={true} defaultValue="hello" />);

    const boldBtn = screen.getByTestId('bobmd-toolbar-btn-bold');
    await user.click(boldBtn);

    // After clicking bold on empty selection, content gets wrapped with **
    const textarea = screen.getByTestId('mock-monaco') as HTMLTextAreaElement;
    // Content changes to include ** ** markers around cursor
    expect(textarea.value).toContain('**');
  });

  it('Mod+B shortcut: triggers bold wrapping', async () => {
    render(<BobEditor toolbar={true} defaultValue="hello" />);

    fireEvent.keyDown(document, { key: 'b', ctrlKey: true });

    const textarea = screen.getByTestId('mock-monaco') as HTMLTextAreaElement;
    expect(textarea.value).toContain('**');
  });
});
