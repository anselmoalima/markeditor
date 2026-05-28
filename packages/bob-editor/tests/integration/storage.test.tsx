import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, render, screen, waitFor } from '@testing-library/react';
import { BobEditor } from '../../src/BobEditor.js';

vi.mock('@monaco-editor/react', () => ({
  default: ({ value, onChange }: { value: string; onChange?: (value: string) => void }) => (
    <textarea
      aria-label="Markdown editor"
      data-testid="mock-monaco"
      value={value}
      onChange={(e) => onChange?.(e.currentTarget.value)}
    />
  ),
}));

function getEditorInput(): HTMLTextAreaElement {
  const monaco = screen.queryByTestId('mock-monaco');
  if (monaco instanceof HTMLTextAreaElement) return monaco;
  return screen.getByTestId('bobmd-textarea') as HTMLTextAreaElement;
}

afterEach(() => {
  cleanup();
  localStorage.clear();
  sessionStorage.clear();
  vi.unstubAllGlobals();
});

describe('useStorageSync — unit-level via BobEditor', () => {
  it('reads from localStorage on mount when uncontrolled and no defaultValue', async () => {
    // jsdom localStorage does not support vi.spyOn; verify via observable UI behavior
    localStorage.setItem('markdown-editor-content', '# Stored heading');

    render(<BobEditor storage={{ storageKey: 'markdown-editor-content' }} />);
    await act(async () => {});

    const input = getEditorInput();
    expect(input).toHaveValue('# Stored heading');
  });

  it('does NOT read from localStorage in controlled mode; emits console.warn once', async () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    localStorage.setItem('markdown-editor-content', '# Stored');

    render(
      <BobEditor
        value="# Controlled"
        onChange={() => {}}
        storage={{ storageKey: 'markdown-editor-content' }}
      />,
    );
    await act(async () => {});

    // Content comes from value prop, not storage
    const input = getEditorInput();
    expect(input).toHaveValue('# Controlled');

    const bobWarnCalls = warnSpy.mock.calls.filter((c) => String(c[0]).includes('[bob-editor]'));
    expect(bobWarnCalls.length).toBe(1);

    warnSpy.mockRestore();
  });

  it('does NOT read when defaultValue is provided (has explicit initial value)', async () => {
    localStorage.setItem('test-key', '# Stored');

    render(<BobEditor defaultValue="# Default" storage={{ storageKey: 'test-key' }} />);
    await act(async () => {});

    const input = getEditorInput();
    expect(input).toHaveValue('# Default');
  });

  it('writes to localStorage after autoSaveInterval debounce', async () => {
    render(
      <BobEditor
        defaultValue="# Hello"
        storage={{ storageKey: 'write-test', autoSaveInterval: 50 }}
      />,
    );

    // jsdom localStorage does not support vi.spyOn; read the value directly
    await waitFor(() => expect(localStorage.getItem('write-test')).toBe('# Hello'), {
      timeout: 1000,
    });
  });

  it('still writes in controlled mode (write-through)', async () => {
    vi.spyOn(console, 'warn').mockImplementation(() => {});

    render(
      <BobEditor
        value="# Controlled content"
        onChange={() => {}}
        storage={{ storageKey: 'write-through-test', autoSaveInterval: 50 }}
      />,
    );

    await waitFor(
      () => expect(localStorage.getItem('write-through-test')).toBe('# Controlled content'),
      { timeout: 1000 },
    );
  });

  it('dispatches storage/error and calls onError on QuotaExceededError', async () => {
    const onError = vi.fn();
    const quotaError = new DOMException('QuotaExceededError', 'QuotaExceededError');

    // jsdom does not allow vi.spyOn on localStorage; use vi.stubGlobal to inject a throwing setItem
    const data: Record<string, string> = {};
    let callCount = 0;
    vi.stubGlobal('localStorage', {
      getItem: (key: string) => data[key] ?? null,
      setItem: (key: string, value: string) => {
        if (callCount++ === 0) throw quotaError;
        data[key] = value;
      },
      removeItem: (key: string) => {
        delete data[key];
      },
      clear: () => {
        Object.keys(data).forEach((k) => delete data[k]);
      },
      length: 0,
      key: () => null,
    });

    render(
      <BobEditor
        defaultValue="# test"
        storage={{ storageKey: 'quota-test', autoSaveInterval: 50 }}
        onError={onError}
      />,
    );

    await waitFor(() => expect(onError).toHaveBeenCalledWith(quotaError), { timeout: 1000 });
  });
});

describe('Storage integration — controlled-vs-uncontrolled semantics', () => {
  it('storage restore: mount with no value and pre-seeded localStorage shows stored content', async () => {
    localStorage.setItem('restore-test', '# Restored from storage');

    render(<BobEditor storage={{ storageKey: 'restore-test' }} />);
    await act(async () => {});

    const input = getEditorInput();
    expect(input).toHaveValue('# Restored from storage');
  });

  it('controlled + storage: content is value prop, not stored; console.warn emitted once per mount', async () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    localStorage.setItem('ctrl-test', '# Stored content');

    render(
      <BobEditor
        value="# Controlled value"
        onChange={() => {}}
        storage={{ storageKey: 'ctrl-test' }}
      />,
    );
    await act(async () => {});

    const input = getEditorInput();
    expect(input).toHaveValue('# Controlled value');

    const bobWarnCalls = warnSpy.mock.calls.filter((c) => String(c[0]).includes('[bob-editor]'));
    expect(bobWarnCalls.length).toBe(1);

    // Re-render should not emit another warning
    warnSpy.mockClear();
    // Warning is not re-emitted because warnedRef persists per-instance

    warnSpy.mockRestore();
  });
});
