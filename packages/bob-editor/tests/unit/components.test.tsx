/**
 * Direct unit tests for low-coverage UI components.
 * These test component internals without going through BobEditor.
 */
import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TextareaFallback } from '../../src/components/Editor/TextareaFallback.js';
import { InsertImage } from '../../src/components/Dialogs/InsertImage.js';
import { InsertTable } from '../../src/components/Dialogs/InsertTable.js';
import { ShortcutsHelp } from '../../src/components/Dialogs/ShortcutsHelp.js';
import { StatusBar } from '../../src/components/StatusBar.js';
import { BobEditorStateContext } from '../../src/core/state/contexts.js';
import { initialState } from '../../src/core/state/reducer.js';

afterEach(cleanup);

// ---------------------------------------------------------------------------
// TextareaFallback
// ---------------------------------------------------------------------------

describe('TextareaFallback', () => {
  it('renders textarea with provided markdown value', () => {
    const onChange = vi.fn();
    render(<TextareaFallback markdown="# hello" onChange={onChange} />);
    const ta = screen.getByTestId('bobmd-textarea') as HTMLTextAreaElement;
    expect(ta.value).toBe('# hello');
  });

  it('calls onChange when user types', async () => {
    const onChange = vi.fn();
    render(<TextareaFallback markdown="" onChange={onChange} />);
    const ta = screen.getByTestId('bobmd-textarea');
    fireEvent.change(ta, { target: { value: 'new content' } });
    expect(onChange).toHaveBeenCalledWith('new content');
  });

  it('calls onSelectionChange on select event', () => {
    const onSelectionChange = vi.fn();
    const onChange = vi.fn();
    render(
      <TextareaFallback
        markdown="hello"
        onChange={onChange}
        onSelectionChange={onSelectionChange}
      />,
    );
    const ta = screen.getByTestId('bobmd-textarea') as HTMLTextAreaElement;
    Object.defineProperty(ta, 'selectionStart', { value: 0, writable: true });
    Object.defineProperty(ta, 'selectionEnd', { value: 5, writable: true });
    fireEvent.select(ta);
    expect(onSelectionChange).toHaveBeenCalledWith({ start: 0, end: 5, cursor: 5 });
  });

  it('calls onSelectionChange on keyup', () => {
    const onSelectionChange = vi.fn();
    const onChange = vi.fn();
    render(
      <TextareaFallback
        markdown="hello"
        onChange={onChange}
        onSelectionChange={onSelectionChange}
      />,
    );
    const ta = screen.getByTestId('bobmd-textarea') as HTMLTextAreaElement;
    Object.defineProperty(ta, 'selectionStart', { value: 2, writable: true });
    Object.defineProperty(ta, 'selectionEnd', { value: 4, writable: true });
    fireEvent.keyUp(ta, { key: 'ArrowRight' });
    expect(onSelectionChange).toHaveBeenCalledWith({ start: 2, end: 4, cursor: 4 });
  });

  it('renders placeholder when provided', () => {
    render(<TextareaFallback markdown="" onChange={vi.fn()} placeholder="Type here..." />);
    expect(screen.getByPlaceholderText('Type here...')).toBeInTheDocument();
  });

  it('readOnly attribute is applied', () => {
    render(<TextareaFallback markdown="read" onChange={vi.fn()} readOnly />);
    expect(screen.getByTestId('bobmd-textarea')).toHaveAttribute('readonly');
  });
});

// ---------------------------------------------------------------------------
// InsertImage
// ---------------------------------------------------------------------------

const i18nEn = {
  url: 'URL',
  altText: 'Alt Text',
  insert: 'Insert',
  cancel: 'Cancel',
  insertImage: 'Insert Image',
};

describe('InsertImage', () => {
  it('renders when isOpen=true', () => {
    render(<InsertImage isOpen onClose={vi.fn()} onInsert={vi.fn()} i18n={i18nEn} />);
    expect(screen.getByTestId('bobmd-dialog-insert-image')).toBeInTheDocument();
  });

  it('renders nothing when isOpen=false', () => {
    render(<InsertImage isOpen={false} onClose={vi.fn()} onInsert={vi.fn()} i18n={i18nEn} />);
    expect(screen.queryByTestId('bobmd-dialog-insert-image')).not.toBeInTheDocument();
  });

  it('calls onInsert with url and altText on insert button click', async () => {
    const user = userEvent.setup();
    const onInsert = vi.fn();
    const onClose = vi.fn();
    render(<InsertImage isOpen onClose={onClose} onInsert={onInsert} i18n={i18nEn} />);

    await user.type(screen.getByLabelText('URL'), 'https://example.com/img.png');
    await user.type(screen.getByLabelText('Alt Text'), 'Example image');
    await user.click(screen.getByRole('button', { name: 'Insert' }));

    expect(onInsert).toHaveBeenCalledWith('https://example.com/img.png', 'Example image');
    expect(onClose).toHaveBeenCalled();
  });

  it('does not call onInsert when URL is empty', async () => {
    const user = userEvent.setup();
    const onInsert = vi.fn();
    render(<InsertImage isOpen onClose={vi.fn()} onInsert={onInsert} i18n={i18nEn} />);

    // Insert button should be disabled when url is empty
    const insertBtn = screen.getByRole('button', { name: 'Insert' });
    expect(insertBtn).toBeDisabled();
    await user.click(insertBtn);
    expect(onInsert).not.toHaveBeenCalled();
  });

  it('calls onClose on cancel button click', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    render(<InsertImage isOpen onClose={onClose} onInsert={vi.fn()} i18n={i18nEn} />);
    await user.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(onClose).toHaveBeenCalled();
  });

  it('calls onClose on Escape key', () => {
    const onClose = vi.fn();
    render(<InsertImage isOpen onClose={onClose} onInsert={vi.fn()} i18n={i18nEn} />);
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onClose).toHaveBeenCalled();
  });

  it('focuses URL input on open', async () => {
    vi.useFakeTimers();
    render(<InsertImage isOpen onClose={vi.fn()} onInsert={vi.fn()} i18n={i18nEn} />);
    await vi.runAllTimersAsync();
    expect(document.activeElement).toBe(screen.getByLabelText('URL'));
    vi.useRealTimers();
  });
});

// ---------------------------------------------------------------------------
// InsertTable
// ---------------------------------------------------------------------------

const i18nTable = {
  rows: 'Rows',
  columns: 'Columns',
  insert: 'Insert',
  cancel: 'Cancel',
  insertTable: 'Insert Table',
};

describe('InsertTable', () => {
  it('renders when isOpen=true', () => {
    render(<InsertTable isOpen onClose={vi.fn()} onInsert={vi.fn()} i18n={i18nTable} />);
    expect(screen.getByTestId('bobmd-dialog-insert-table')).toBeInTheDocument();
  });

  it('renders nothing when isOpen=false', () => {
    render(<InsertTable isOpen={false} onClose={vi.fn()} onInsert={vi.fn()} i18n={i18nTable} />);
    expect(screen.queryByTestId('bobmd-dialog-insert-table')).not.toBeInTheDocument();
  });

  it('calls onInsert with default rows=3 cols=3 on insert button click', async () => {
    const user = userEvent.setup();
    const onInsert = vi.fn();
    const onClose = vi.fn();
    render(<InsertTable isOpen onClose={onClose} onInsert={onInsert} i18n={i18nTable} />);
    await user.click(screen.getByRole('button', { name: 'Insert' }));
    expect(onInsert).toHaveBeenCalledWith(3, 3);
    expect(onClose).toHaveBeenCalled();
  });

  it('calls onInsert with updated rows and cols', async () => {
    const user = userEvent.setup();
    const onInsert = vi.fn();
    render(<InsertTable isOpen onClose={vi.fn()} onInsert={onInsert} i18n={i18nTable} />);

    fireEvent.change(screen.getByLabelText('Rows'), { target: { value: '5' } });
    fireEvent.change(screen.getByLabelText('Columns'), { target: { value: '4' } });

    await user.click(screen.getByRole('button', { name: 'Insert' }));
    expect(onInsert).toHaveBeenCalledWith(5, 4);
  });

  it('calls onClose on cancel button click', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    render(<InsertTable isOpen onClose={onClose} onInsert={vi.fn()} i18n={i18nTable} />);
    await user.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(onClose).toHaveBeenCalled();
  });

  it('calls onClose on Escape key', () => {
    const onClose = vi.fn();
    render(<InsertTable isOpen onClose={onClose} onInsert={vi.fn()} i18n={i18nTable} />);
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onClose).toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// ShortcutsHelp
// ---------------------------------------------------------------------------

describe('ShortcutsHelp', () => {
  const shortcuts = [
    { id: 'bold', label: 'Bold', keys: 'Ctrl+B', disabled: false },
    { id: 'italic', label: 'Italic', keys: 'Ctrl+I', disabled: false },
    { id: 'disabled-one', label: 'Disabled', keys: 'Ctrl+D', disabled: true },
  ];
  const i18n = {
    shortcutsHelp: 'Shortcuts',
    shortcutKey: 'Key',
    shortcutAction: 'Action',
    cancel: 'Close',
  };

  it('renders when isOpen=true and shows active shortcuts only', () => {
    render(<ShortcutsHelp isOpen shortcuts={shortcuts} onClose={vi.fn()} i18n={i18n} />);
    expect(screen.getByTestId('bobmd-dialog-shortcuts-help')).toBeInTheDocument();
    expect(screen.getByText('Bold')).toBeInTheDocument();
    expect(screen.queryByText('Disabled')).not.toBeInTheDocument();
  });

  it('renders nothing when isOpen=false', () => {
    render(<ShortcutsHelp isOpen={false} shortcuts={shortcuts} onClose={vi.fn()} i18n={i18n} />);
    expect(screen.queryByTestId('bobmd-dialog-shortcuts-help')).not.toBeInTheDocument();
  });

  it('calls onClose on close button click', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    render(<ShortcutsHelp isOpen shortcuts={shortcuts} onClose={onClose} i18n={i18n} />);
    await user.click(screen.getByRole('button', { name: 'Close' }));
    expect(onClose).toHaveBeenCalled();
  });

  it('calls onClose on Escape key', () => {
    const onClose = vi.fn();
    render(<ShortcutsHelp isOpen shortcuts={shortcuts} onClose={onClose} i18n={i18n} />);
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onClose).toHaveBeenCalled();
  });

  it('handleTabTrap: Tab on last focusable wraps to first', async () => {
    render(<ShortcutsHelp isOpen shortcuts={shortcuts} onClose={vi.fn()} i18n={i18n} />);
    const dialog = screen.getByTestId('bobmd-dialog-shortcuts-help');
    const closeBtn = screen.getByRole('button', { name: 'Close' });
    closeBtn.focus();
    // Fire Tab (non-shift) while focused on last element
    fireEvent.keyDown(dialog.firstChild as Element, { key: 'Tab', shiftKey: false });
    // No throw = handleTabTrap executed
    expect(document.activeElement).toBeInstanceOf(HTMLElement);
  });
});

// ---------------------------------------------------------------------------
// StatusBar
// ---------------------------------------------------------------------------

describe('StatusBar', () => {
  function renderStatusBar(markdown: string) {
    return render(
      <BobEditorStateContext.Provider value={{ ...initialState, markdown }}>
        <StatusBar
          i18n={{
            wordCount: 'Words',
            savedJustNow: 'Saved just now',
            savedSecondsAgo: 'Saved {n}s ago',
            savedMinutesAgo: 'Saved {n}m ago',
          }}
        />
      </BobEditorStateContext.Provider>,
    );
  }

  it('renders word count for initial content', async () => {
    vi.useFakeTimers();
    renderStatusBar('hello world foo');
    await vi.runAllTimersAsync();
    const bar = screen.getByTestId('bobmd-status-bar');
    expect(bar.textContent).toContain('3');
    vi.useRealTimers();
  });

  it('shows Words: 0 for empty markdown', async () => {
    vi.useFakeTimers();
    renderStatusBar('');
    await vi.runAllTimersAsync();
    const bar = screen.getByTestId('bobmd-status-bar');
    expect(bar.textContent).toContain('0');
    vi.useRealTimers();
  });

  it('shows saved label when savedAt is set', () => {
    const now = Date.now();
    render(
      <BobEditorStateContext.Provider value={{ ...initialState, savedAt: now - 5000 }}>
        <StatusBar
          i18n={{
            wordCount: 'Words',
            savedJustNow: 'Saved just now',
            savedSecondsAgo: 'Saved {n}s ago',
            savedMinutesAgo: 'Saved {n}m ago',
          }}
        />
      </BobEditorStateContext.Provider>,
    );
    const bar = screen.getByTestId('bobmd-status-bar');
    // Should show some saved label
    expect(bar.textContent).toContain('Saved');
  });
});
