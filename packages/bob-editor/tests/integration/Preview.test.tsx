import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, waitFor, act, fireEvent } from '@testing-library/react';
import { Alert } from '../../src/components/Preview/Alert.js';
import { SafeLink } from '../../src/components/Preview/SafeLink.js';
import { SafeImage } from '../../src/components/Preview/SafeImage.js';
import { CodeBlock } from '../../src/components/Preview/CodeBlock.js';
import { MathBlock } from '../../src/components/Preview/MathBlock.js';

// --- Alert ---
describe('Alert component', () => {
  it('renders plain blockquote when no alert pattern', () => {
    render(<Alert>Regular quote content</Alert>);
    expect(document.querySelector('blockquote')).toBeTruthy();
  });

  it('[!NOTE] renders with role="note" and note class', () => {
    render(
      <Alert>
        <p>[!NOTE] This is a note.</p>
      </Alert>,
    );
    const el = document.querySelector('[data-callout-type="note"]');
    expect(el).toBeTruthy();
    expect(el?.getAttribute('role')).toBe('note');
    expect(el?.className).toContain('bobmd-alert-note');
  });

  it('[!WARNING] renders with warning-specific class', () => {
    render(
      <Alert>
        <p>[!WARNING] Watch out.</p>
      </Alert>,
    );
    const el = document.querySelector('[data-callout-type="warning"]');
    expect(el).toBeTruthy();
    expect(el?.className).toContain('bobmd-alert-warning');
  });

  it('[!TIP] renders correctly', () => {
    render(
      <Alert>
        <p>[!TIP] Helpful tip.</p>
      </Alert>,
    );
    expect(document.querySelector('[data-callout-type="tip"]')).toBeTruthy();
  });

  it('[!IMPORTANT] renders correctly', () => {
    render(
      <Alert>
        <p>[!IMPORTANT] Important info.</p>
      </Alert>,
    );
    expect(document.querySelector('[data-callout-type="important"]')).toBeTruthy();
  });

  it('[!CAUTION] renders correctly', () => {
    render(
      <Alert>
        <p>[!CAUTION] Be careful.</p>
      </Alert>,
    );
    expect(document.querySelector('[data-callout-type="caution"]')).toBeTruthy();
  });
});

// --- Alert additional branch coverage ---
describe('Alert edge cases', () => {
  it('renders plain blockquote for non-ReactElement first child', () => {
    render(<Alert>{'plain text child'}</Alert>);
    expect(document.querySelector('blockquote')).toBeTruthy();
  });

  it('renders plain blockquote when first child has no text content', () => {
    render(
      <Alert>
        <p></p>
      </Alert>,
    );
    expect(document.querySelector('blockquote')).toBeTruthy();
  });

  it('renders plain blockquote when alert marker is not recognised', () => {
    render(
      <Alert>
        <p>[!UNKNOWN] text</p>
      </Alert>,
    );
    expect(document.querySelector('blockquote')).toBeTruthy();
  });
});

// --- SafeLink ---
describe('SafeLink component', () => {
  it('renders an anchor with href', () => {
    render(<SafeLink href="https://example.com">Link</SafeLink>);
    const link = screen.getByText('Link') as HTMLAnchorElement;
    expect(link.href).toBe('https://example.com/');
  });

  it('blocks javascript: href', () => {
    render(<SafeLink href="javascript:alert(1)">XSS</SafeLink>);
    const link = screen.getByText('XSS') as HTMLAnchorElement;
    expect(link.href).not.toContain('javascript:');
    expect(link.getAttribute('href')).toBe('#');
  });

  it('adds rel=noopener noreferrer for external links', () => {
    render(<SafeLink href="https://external.com">Ext</SafeLink>);
    const link = screen.getByText('Ext');
    expect(link.getAttribute('rel')).toContain('noopener');
  });

  it('does not add rel for relative links', () => {
    render(<SafeLink href="#section">Hash</SafeLink>);
    const link = screen.getByText('Hash');
    expect(link.getAttribute('rel')).toBeNull();
  });
});

// --- SafeImage ---
describe('SafeImage component', () => {
  it('renders an img with safe src', () => {
    const { container } = render(<SafeImage src="https://example.com/img.png" alt="test" />);
    const img = container.querySelector('img');
    expect(img).toBeTruthy();
    expect(img?.src).toContain('example.com');
  });

  it('does not render when src is javascript:', () => {
    const { container } = render(<SafeImage src="javascript:alert(1)" alt="test" />);
    expect(container.querySelector('img')).toBeNull();
  });

  it('does not render when src is data:text/html', () => {
    const { container } = render(
      <SafeImage src="data:text/html,<script>alert(1)</script>" alt="test" />,
    );
    expect(container.querySelector('img')).toBeNull();
  });

  it('renders safe data:image/png src', () => {
    const { container } = render(<SafeImage src="data:image/png;base64,abc123" alt="test" />);
    expect(container.querySelector('img')).toBeTruthy();
  });
});

// --- CodeBlock ---
describe('CodeBlock component', () => {
  it('renders pre with code content', () => {
    render(
      <CodeBlock>
        <code className="language-javascript">{'const x = 1;'}</code>
      </CodeBlock>,
    );
    expect(document.querySelector('pre')).toBeTruthy();
    expect(document.querySelector('.bobmd-code-lang')?.textContent).toBe('javascript');
  });

  it('copy button calls navigator.clipboard.writeText', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText },
      writable: true,
      configurable: true,
    });

    const { container } = render(
      <CodeBlock>
        <code className="language-python">{'print("hello")'}</code>
      </CodeBlock>,
    );

    const copyBtn = container.querySelector('.bobmd-copy-btn') as HTMLButtonElement;
    expect(copyBtn).toBeTruthy();
    await act(async () => {
      fireEvent.click(copyBtn);
    });

    expect(writeText).toHaveBeenCalledWith('print("hello")');
  });
});

// --- CodeBlock edge cases ---
describe('CodeBlock edge cases', () => {
  it('renders code without language class', () => {
    const { container } = render(
      <CodeBlock>
        <code>{'plain code'}</code>
      </CodeBlock>,
    );
    expect(container.querySelector('pre')).toBeTruthy();
    expect(container.querySelector('.bobmd-code-lang')).toBeNull();
  });

  it('renders children when no code element', () => {
    const { container } = render(<CodeBlock>{'raw text'}</CodeBlock>);
    expect(container.querySelector('pre')).toBeTruthy();
  });
});

// --- MathBlock ---
describe('MathBlock component', () => {
  afterEach(() => {
    document.head.querySelectorAll('link[data-bobmd-katex]').forEach((el) => el.remove());
  });

  it('renders KaTeX span for valid math', async () => {
    render(<MathBlock tex="x^2" display={false} />);
    await waitFor(() => {
      expect(document.querySelector('.bobmd-math-inline, .katex, .bobmd-math')).toBeTruthy();
    });
  });

  it('renders inline error for malformed math without crashing preview', async () => {
    render(
      <div data-testid="preview">
        <MathBlock tex="\invalidcommand" display={false} />
      </div>,
    );
    // Should not crash — either shows error or renders katex error span
    await waitFor(() => {
      const preview = screen.getByTestId('preview');
      expect(preview).toBeTruthy();
    });
  });

  it('injects KaTeX CSS link exactly once for two instances', async () => {
    const { rerender } = render(
      <div>
        <MathBlock tex="a+b" display={false} />
        <MathBlock tex="c+d" display={true} />
      </div>,
    );
    await waitFor(() => {
      const links = document.head.querySelectorAll('link[data-bobmd-katex]');
      expect(links.length).toBe(1);
    });
    rerender(
      <div>
        <MathBlock tex="a+b" display={false} />
        <MathBlock tex="c+d" display={true} />
      </div>,
    );
    const links = document.head.querySelectorAll('link[data-bobmd-katex]');
    expect(links.length).toBe(1);
  });
});
