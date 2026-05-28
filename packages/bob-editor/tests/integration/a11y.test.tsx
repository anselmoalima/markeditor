import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe } from 'jest-axe';
import { BobEditor } from '../../src/BobEditor.js';
import { InsertTable } from '../../src/components/Dialogs/InsertTable.js';

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

describe('A11y audit — all surfaces', () => {
  it('edit mode: zero violations', async () => {
    const { container } = render(<BobEditor defaultValue="# Hello world" />);
    await act(async () => {});
    expect(await axe(container)).toHaveNoViolations();
  });

  it('preview mode: zero violations', async () => {
    const user = userEvent.setup();
    const { container } = render(<BobEditor defaultValue="# Hello world" />);
    await act(async () => {});
    await user.click(screen.getByTestId('bobmd-mode-toggle'));
    await waitFor(() => screen.getByTestId('bobmd-preview'));
    expect(await axe(container)).toHaveNoViolations();
  });

  it('toolbar visible: zero violations', async () => {
    const { container } = render(<BobEditor toolbar={true} defaultValue="toolbar test" />);
    await act(async () => {});
    expect(screen.getByTestId('bobmd-toolbar')).toBeInTheDocument();
    expect(await axe(container)).toHaveNoViolations();
  });

  it('InsertLink modal open: zero violations', async () => {
    const user = userEvent.setup();
    const { container } = render(<BobEditor toolbar={true} />);
    await act(async () => {});
    await user.click(screen.getByTestId('bobmd-toolbar-btn-link'));
    await waitFor(() => screen.getByTestId('bobmd-dialog-insert-link'));
    expect(await axe(container)).toHaveNoViolations();
  });

  it('InsertImage modal open: zero violations', async () => {
    const user = userEvent.setup();
    const { container } = render(<BobEditor toolbar={true} />);
    await act(async () => {});
    await user.click(screen.getByTestId('bobmd-toolbar-btn-image'));
    await waitFor(() => screen.getByTestId('bobmd-dialog-insert-image'));
    expect(await axe(container)).toHaveNoViolations();
  });

  it('InsertTable modal open: zero violations', async () => {
    const { container } = render(
      <InsertTable isOpen={true} onClose={vi.fn()} onInsert={vi.fn()} i18n={{}} />,
    );
    await act(async () => {});
    expect(await axe(container)).toHaveNoViolations();
  });

  it('ShortcutsHelp modal open: zero violations', async () => {
    const { container } = render(<BobEditor toolbar={true} />);
    await act(async () => {});
    fireEvent.keyDown(document, { key: '?', ctrlKey: true });
    await waitFor(() => screen.getByTestId('bobmd-dialog-shortcuts-help'));
    expect(await axe(container)).toHaveNoViolations();
  });

  it('dark theme active: zero violations', async () => {
    const { container } = render(<BobEditor theme="dark" defaultValue="dark theme" />);
    await act(async () => {});
    expect(await axe(container)).toHaveNoViolations();
  });

  it('custom BobmdTheme active: zero violations', async () => {
    const customTheme = {
      '--mde-bg': '#1a1a2e',
      '--mde-text': '#e0e0e0',
      '--mde-border': '#444',
      '--mde-accent': '#9966cc',
    };
    const { container } = render(
      <BobEditor theme={customTheme} defaultValue="custom theme test" />,
    );
    await act(async () => {});
    expect(await axe(container)).toHaveNoViolations();
  });
});
