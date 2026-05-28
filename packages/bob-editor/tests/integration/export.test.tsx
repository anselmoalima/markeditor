import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe } from 'jest-axe';
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

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe('Export features', () => {
  it('exportAsHtml() returns HTML string with heading for "# Hello" markdown', async () => {
    let editorRef: React.RefObject<import('../../src/types.js').BobEditorRef | null> | null = null;
    function Wrapper() {
      const ref = React.useRef<import('../../src/types.js').BobEditorRef>(null);
      editorRef = ref;
      return <BobEditor ref={ref} defaultValue="# Hello" />;
    }

    render(<Wrapper />);
    await act(async () => {});

    const html = await editorRef!.current!.exportAsHtml();
    expect(html).toContain('<h1');
    expect(html).toContain('Hello');
  });

  it('exportAsHtml() output does not contain <script> tags (sanitized)', async () => {
    let editorRef: React.RefObject<import('../../src/types.js').BobEditorRef | null> | null = null;
    function Wrapper() {
      const ref = React.useRef<import('../../src/types.js').BobEditorRef>(null);
      editorRef = ref;
      return (
        <BobEditor ref={ref} defaultValue={'<script>alert("xss")</script>'} sanitize={false} />
      );
    }

    render(<Wrapper />);
    await act(async () => {});

    const html = await editorRef!.current!.exportAsHtml();
    expect(html).not.toMatch(/<script/i);
  });

  it('exportAsMarkdown() returns the raw markdown unchanged', async () => {
    let editorRef: React.RefObject<import('../../src/types.js').BobEditorRef | null> | null = null;
    const markdown = '# Hello\n\nSome **bold** text';
    function Wrapper() {
      const ref = React.useRef<import('../../src/types.js').BobEditorRef>(null);
      editorRef = ref;
      return <BobEditor ref={ref} defaultValue={markdown} />;
    }

    render(<Wrapper />);
    await act(async () => {});

    const md = editorRef!.current!.exportAsMarkdown();
    expect(md).toBe(markdown);
  });

  it('Export HTML button triggers download (mocked URL.createObjectURL + anchor click)', async () => {
    const mockCreateObjectURL = vi.fn().mockReturnValue('blob:mock-url');
    const mockRevokeObjectURL = vi.fn();
    const mockClick = vi.fn();

    vi.stubGlobal('URL', {
      ...URL,
      createObjectURL: mockCreateObjectURL,
      revokeObjectURL: mockRevokeObjectURL,
    });

    const origCreateElement = document.createElement.bind(document);
    vi.spyOn(document, 'createElement').mockImplementation((tag: string) => {
      const el = origCreateElement(tag);
      if (tag === 'a') {
        Object.defineProperty(el, 'click', { value: mockClick, configurable: true });
      }
      return el;
    });

    render(<BobEditor defaultValue="# Export Test" enableExport />);
    await act(async () => {});

    const exportHtmlBtn = screen.getByRole('button', { name: /export html/i });
    await userEvent.click(exportHtmlBtn);

    await vi.waitFor(() => {
      expect(mockCreateObjectURL).toHaveBeenCalled();
      expect(mockClick).toHaveBeenCalled();
    });
  });

  it('custom BobmdTheme prop sets --mde-bg CSS variable on root element', async () => {
    const { container } = render(
      <BobEditor defaultValue="" theme={{ '--mde-bg': '#ffffff', '--mde-fg': '#000000' }} />,
    );
    await act(async () => {});

    const root = container.firstElementChild as HTMLElement;
    expect(root.style.getPropertyValue('--mde-bg')).toBe('#ffffff');
    expect(root.style.getPropertyValue('--mde-fg')).toBe('#000000');
  });

  it('sticky toolbar: ToolbarConfig.sticky = true adds bobmd-toolbar--sticky class', async () => {
    render(<BobEditor defaultValue="" toolbar={{ sticky: true }} />);
    await act(async () => {});

    const toolbar = document.querySelector('.bobmd-toolbar');
    expect(toolbar).toHaveClass('bobmd-toolbar--sticky');
  });

  it('non-sticky toolbar does not have bobmd-toolbar--sticky class by default', async () => {
    render(<BobEditor defaultValue="" />);
    await act(async () => {});

    const toolbar = document.querySelector('.bobmd-toolbar');
    expect(toolbar).not.toHaveClass('bobmd-toolbar--sticky');
  });

  it('a11y: export section has no violations', async () => {
    const { container } = render(<BobEditor defaultValue="# Test" enableExport />);
    await act(async () => {});

    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
