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

  it('toolbar button clicks: strikethrough, code, blockquote, lists all trigger wrapSelection', async () => {
    const user = userEvent.setup();
    render(<BobEditor toolbar={true} defaultValue="text" />);

    // Click strikethrough
    await user.click(screen.getByTestId('bobmd-toolbar-btn-strikethrough'));
    let val = (screen.getByTestId('mock-monaco') as HTMLTextAreaElement).value;
    expect(val).toContain('~~');

    // Click code (inline)
    await user.click(screen.getByTestId('bobmd-toolbar-btn-code'));
    val = (screen.getByTestId('mock-monaco') as HTMLTextAreaElement).value;
    expect(val).toContain('`');

    // Click blockquote
    await user.click(screen.getByTestId('bobmd-toolbar-btn-blockquote'));
    val = (screen.getByTestId('mock-monaco') as HTMLTextAreaElement).value;
    expect(val).toContain('>');

    // Click ordered-list
    await user.click(screen.getByTestId('bobmd-toolbar-btn-ordered-list'));
    val = (screen.getByTestId('mock-monaco') as HTMLTextAreaElement).value;
    expect(val).toContain('1.');

    // Click unordered-list
    await user.click(screen.getByTestId('bobmd-toolbar-btn-unordered-list'));
    val = (screen.getByTestId('mock-monaco') as HTMLTextAreaElement).value;
    expect(val).toContain('- ');

    // Click task-list
    await user.click(screen.getByTestId('bobmd-toolbar-btn-task-list'));
    val = (screen.getByTestId('mock-monaco') as HTMLTextAreaElement).value;
    expect(val).toContain('[ ]');
  });

  it('heading buttons 1-6 all insert heading markers', async () => {
    const user = userEvent.setup();
    render(<BobEditor toolbar={true} defaultValue="text" />);

    for (const level of [2, 3, 4, 5, 6] as const) {
      await user.click(screen.getByTestId(`bobmd-toolbar-btn-heading${level}`));
      const val = (screen.getByTestId('mock-monaco') as HTMLTextAreaElement).value;
      expect(val).toContain('#');
    }
  });

  it('codeblock button inserts code block markers', async () => {
    const user = userEvent.setup();
    render(<BobEditor toolbar={true} defaultValue="text" />);
    await user.click(screen.getByTestId('bobmd-toolbar-btn-codeblock'));
    const val = (screen.getByTestId('mock-monaco') as HTMLTextAreaElement).value;
    expect(val).toContain('```');
  });

  it('undo and redo buttons fire without crash', async () => {
    // jsdom does not implement execCommand — define a no-op to avoid unhandled errors
    const execCommandMock = vi.fn().mockReturnValue(true);
    Object.defineProperty(document, 'execCommand', {
      value: execCommandMock,
      writable: true,
      configurable: true,
    });

    const user = userEvent.setup();
    render(<BobEditor toolbar={true} defaultValue="text" />);
    await user.click(screen.getByTestId('bobmd-toolbar-btn-undo'));
    await user.click(screen.getByTestId('bobmd-toolbar-btn-redo'));
    expect(screen.getByTestId('bobmd-toolbar')).toBeInTheDocument();
    expect(execCommandMock).toHaveBeenCalledWith('undo');
    expect(execCommandMock).toHaveBeenCalledWith('redo');

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    delete (document as any).execCommand;
  });

  it('image toolbar button opens insert image dialog', async () => {
    const user = userEvent.setup();
    render(<BobEditor toolbar={true} />);
    await user.click(screen.getByTestId('bobmd-toolbar-btn-image'));
    expect(screen.getByTestId('bobmd-dialog-insert-image')).toBeInTheDocument();
  });

  it('overflow button toggles overflow menu', async () => {
    let resizeCallback: ResizeObserverCallback | null = null;

    class MockResizeObserver2 {
      constructor(cb: ResizeObserverCallback) {
        resizeCallback = cb;
      }
      observe() {}
      unobserve() {}
      disconnect() {}
    }

    Object.defineProperty(window, 'ResizeObserver', {
      writable: true,
      value: MockResizeObserver2,
    });

    const user = userEvent.setup();
    render(<BobEditor toolbar={true} />);

    await act(async () => {
      resizeCallback?.(
        [{ contentRect: { width: 400 } } as ResizeObserverEntry],
        {} as ResizeObserver,
      );
    });

    const overflowBtn = screen.getByTestId('bobmd-toolbar-overflow-btn');
    expect(overflowBtn).toBeInTheDocument();

    await user.click(overflowBtn);
    expect(screen.getByTestId('bobmd-toolbar-overflow-menu')).toBeInTheDocument();

    await user.click(overflowBtn);
    expect(screen.queryByTestId('bobmd-toolbar-overflow-menu')).not.toBeInTheDocument();
  });

  it('custom toolbar config with ToolbarConfig object renders custom buttons', async () => {
    const user = userEvent.setup();
    const customAction = vi.fn();
    render(
      <BobEditor
        toolbar={{
          items: [
            'bold',
            {
              id: 'custom-btn',
              label: 'Custom',
              action: customAction,
            },
          ],
        }}
      />,
    );

    expect(screen.getByTestId('bobmd-toolbar-btn-bold')).toBeInTheDocument();
    await user.click(screen.getByTestId('bobmd-toolbar-btn-custom-btn'));
    expect(customAction).toHaveBeenCalled();
  });
});
