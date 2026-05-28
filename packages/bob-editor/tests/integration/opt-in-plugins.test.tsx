import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe } from 'jest-axe';
import { BobEditor } from '../../src/BobEditor.js';
import { emojiPlugin } from '../../src/plugins/emoji.js';
import { createMentionsPlugin } from '../../src/plugins/mentions.js';
import { wordCountPlugin } from '../../src/plugins/wordCount.js';
import { tableOfContentsPlugin } from '../../src/plugins/tableOfContents.js';
import { gfmPlugin } from '../../src/plugins/builtin/gfm.js';

vi.mock('@monaco-editor/react', () => ({
  default: ({ value, onChange }: { value: string; onChange?: (value: string) => void }) => (
    <textarea
      aria-label="Markdown editor"
      data-testid="mock-monaco"
      value={value}
      onChange={(event) => onChange?.(event.currentTarget.value)}
    />
  ),
}));

afterEach(cleanup);

const mentionsPlugin = createMentionsPlugin({
  resolveMention: (u) => ({ url: `/u/${u}`, displayName: u }),
});

async function switchToPreview(): Promise<void> {
  await userEvent.click(screen.getByTestId('bobmd-mode-toggle'));
  await waitFor(() => {
    expect(screen.queryByTestId('bobmd-preview')).toBeInTheDocument();
  });
}

// ---------------------------------------------------------------------------
// emojiPlugin integration
// ---------------------------------------------------------------------------

describe('emojiPlugin integration', () => {
  it('renders :tada: as emoji character in preview', async () => {
    render(<BobEditor defaultValue=":tada:" plugins={[gfmPlugin, emojiPlugin]} />);
    await switchToPreview();
    await waitFor(
      () => {
        const preview = screen.getByTestId('bobmd-preview');
        expect(preview.textContent).toContain('🎉');
      },
      { timeout: 2000 },
    );
  });

  it('does not render raw shortcode text in preview', async () => {
    render(<BobEditor defaultValue=":smile:" plugins={[gfmPlugin, emojiPlugin]} />);
    await switchToPreview();
    await waitFor(
      () => {
        const preview = screen.getByTestId('bobmd-preview');
        expect(preview.textContent).not.toContain(':smile:');
      },
      { timeout: 2000 },
    );
  });
});

// ---------------------------------------------------------------------------
// createMentionsPlugin integration
// ---------------------------------------------------------------------------

describe('createMentionsPlugin integration', () => {
  it('@alice renders as a link in preview', async () => {
    render(<BobEditor defaultValue="@alice" plugins={[gfmPlugin, mentionsPlugin]} />);
    await switchToPreview();
    await waitFor(
      () => {
        const preview = screen.getByTestId('bobmd-preview');
        const link = preview.querySelector('a[href="/u/alice"]');
        expect(link).toBeTruthy();
        expect(link?.textContent).toContain('@alice');
      },
      { timeout: 2000 },
    );
  });

  it('mention link has bobmd-mention class', async () => {
    render(<BobEditor defaultValue="@bob" plugins={[gfmPlugin, mentionsPlugin]} />);
    await switchToPreview();
    await waitFor(
      () => {
        const preview = screen.getByTestId('bobmd-preview');
        expect(preview.querySelector('.bobmd-mention')).toBeTruthy();
      },
      { timeout: 2000 },
    );
  });
});

// ---------------------------------------------------------------------------
// wordCountPlugin integration
// ---------------------------------------------------------------------------

describe('wordCountPlugin integration', () => {
  it('editor renders with wordCountPlugin without errors', async () => {
    render(<BobEditor defaultValue="hello world" plugins={[gfmPlugin, wordCountPlugin]} />);
    const editor = await screen.findByTestId('mock-monaco');
    expect(editor).toBeInTheDocument();
  });

  it('typing updates word count via onChange hook (no crash)', async () => {
    const user = userEvent.setup();
    render(<BobEditor defaultValue="" plugins={[gfmPlugin, wordCountPlugin]} />);
    const editor = await screen.findByTestId('mock-monaco');
    await user.type(editor, 'hello world');
    // Plugin calls showNotification which is a no-op; verify editor still renders
    expect(editor).toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// tableOfContentsPlugin integration
// ---------------------------------------------------------------------------

describe('tableOfContentsPlugin integration', () => {
  it('renders TOC nav element in preview for markdown with headings', async () => {
    const md = '# H1\n\n## H2\n\n### H3';
    render(<BobEditor defaultValue={md} plugins={[gfmPlugin, tableOfContentsPlugin]} />);
    await switchToPreview();
    await waitFor(
      () => {
        const preview = screen.getByTestId('bobmd-preview');
        const nav = preview.querySelector('nav');
        expect(nav).toBeTruthy();
        expect(nav?.getAttribute('aria-label')).toBe('Table of contents');
      },
      { timeout: 2000 },
    );
  });

  it('TOC contains links to heading IDs', async () => {
    const md = '# Introduction\n\n## Usage';
    render(<BobEditor defaultValue={md} plugins={[gfmPlugin, tableOfContentsPlugin]} />);
    await switchToPreview();
    await waitFor(
      () => {
        const preview = screen.getByTestId('bobmd-preview');
        const links = preview.querySelectorAll('nav a');
        expect(links.length).toBeGreaterThanOrEqual(2);
        const hrefs = Array.from(links).map((a) => a.getAttribute('href'));
        expect(hrefs.some((h) => h?.startsWith('#'))).toBe(true);
      },
      { timeout: 2000 },
    );
  });

  it('does not render TOC when there are no headings', async () => {
    render(
      <BobEditor defaultValue="Just a paragraph." plugins={[gfmPlugin, tableOfContentsPlugin]} />,
    );
    await switchToPreview();
    // wait for preview to settle
    await act(async () => {
      await new Promise((r) => setTimeout(r, 300));
    });
    const preview = screen.getByTestId('bobmd-preview');
    expect(preview.querySelector('nav')).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// Multiple plugins together
// ---------------------------------------------------------------------------

describe('multiple opt-in plugins together', () => {
  it('all four opt-in plugins active simultaneously without conflicts', async () => {
    const md = '# Hello\n\n:tada: @alice hello world';
    render(
      <BobEditor
        defaultValue={md}
        plugins={[gfmPlugin, emojiPlugin, mentionsPlugin, wordCountPlugin, tableOfContentsPlugin]}
      />,
    );
    await switchToPreview();
    await waitFor(
      () => {
        const preview = screen.getByTestId('bobmd-preview');
        // emoji rendered
        expect(preview.textContent).toContain('🎉');
        // mention rendered
        expect(preview.querySelector('.bobmd-mention')).toBeTruthy();
        // TOC rendered
        expect(preview.querySelector('nav')).toBeTruthy();
      },
      { timeout: 2000 },
    );
  });
});

// ---------------------------------------------------------------------------
// A11y
// ---------------------------------------------------------------------------

describe('a11y with opt-in plugins', () => {
  it('BobEditor with all four opt-in plugins has no violations', async () => {
    const md = '# Title\n\n:rocket: @user some text';
    const { container } = render(
      <BobEditor
        defaultValue={md}
        plugins={[gfmPlugin, emojiPlugin, mentionsPlugin, wordCountPlugin, tableOfContentsPlugin]}
      />,
    );
    await switchToPreview();
    await waitFor(
      () => {
        expect(screen.getByTestId('bobmd-preview')).toBeInTheDocument();
      },
      { timeout: 2000 },
    );
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
