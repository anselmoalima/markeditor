import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { gfmPlugin } from '../../src/plugins/builtin/gfm.js';
import { mathPlugin } from '../../src/plugins/builtin/math.js';
import { mermaidPlugin } from '../../src/plugins/builtin/mermaid.js';
import { alertsPlugin } from '../../src/plugins/builtin/alerts.js';
import { footnotesPlugin } from '../../src/plugins/builtin/footnotes.js';
import { injectKatexCss } from '../../src/components/Preview/MathBlock.js';
import { sanitizeSvgOutput } from '../../src/components/Preview/MermaidDiagram.js';

describe('gfm plugin', () => {
  it('has correct name', () => {
    expect(gfmPlugin.name).toBe('gfm');
  });

  it('sanitizeSchema allows table elements', () => {
    expect(gfmPlugin.sanitizeSchema?.tagNames).toContain('table');
    expect(gfmPlugin.sanitizeSchema?.tagNames).toContain('td');
    expect(gfmPlugin.sanitizeSchema?.tagNames).toContain('th');
  });

  it('sanitizeSchema allows del for strikethrough', () => {
    expect(gfmPlugin.sanitizeSchema?.tagNames).toContain('del');
  });

  it('components map includes SafeLink, SafeImage, CodeBlock', () => {
    expect(gfmPlugin.components?.['a']).toBeDefined();
    expect(gfmPlugin.components?.['img']).toBeDefined();
    expect(gfmPlugin.components?.['pre']).toBeDefined();
  });
});

describe('math plugin', () => {
  it('has correct name', () => {
    expect(mathPlugin.name).toBe('math');
  });

  it('sanitizeSchema allows math and semantics tags', () => {
    expect(mathPlugin.sanitizeSchema?.tagNames).toContain('math');
    expect(mathPlugin.sanitizeSchema?.tagNames).toContain('semantics');
  });

  it('onMount injects KaTeX CSS link (idempotent)', () => {
    const mockApi = {} as Parameters<NonNullable<typeof mathPlugin.onMount>>[0];

    // Should not throw
    mathPlugin.onMount?.(mockApi);

    // Called twice — still only one link
    mathPlugin.onMount?.(mockApi);

    const links = document.head.querySelectorAll('link[data-bobmd-katex]');
    expect(links.length).toBe(1);
  });
});

describe('mermaid plugin', () => {
  it('has correct name', () => {
    expect(mermaidPlugin.name).toBe('mermaid');
  });

  it('sanitizeSchema allows svg and key SVG elements', () => {
    expect(mermaidPlugin.sanitizeSchema?.tagNames).toContain('svg');
    expect(mermaidPlugin.sanitizeSchema?.tagNames).toContain('path');
    expect(mermaidPlugin.sanitizeSchema?.tagNames).toContain('g');
  });
});

describe('alerts plugin', () => {
  it('has correct name', () => {
    expect(alertsPlugin.name).toBe('alerts');
  });

  it('components map includes blockquote override', () => {
    expect(alertsPlugin.components?.['blockquote']).toBeDefined();
  });

  it('sanitizeSchema allows data-callout-type on div', () => {
    const divAttrs = alertsPlugin.sanitizeSchema?.attributes?.['div'];
    expect(divAttrs).toContain('data-callout-type');
  });
});

describe('footnotes plugin', () => {
  it('has correct name', () => {
    expect(footnotesPlugin.name).toBe('footnotes');
  });

  it('sanitizeSchema allows sup element', () => {
    expect(footnotesPlugin.sanitizeSchema?.tagNames).toContain('sup');
  });
});

describe('injectKatexCss', () => {
  afterEach(() => {
    document.head.querySelectorAll('link[data-bobmd-katex]').forEach((el) => el.remove());
  });

  it('injects a link element with data-bobmd-katex', () => {
    injectKatexCss();
    const link = document.head.querySelector('link[data-bobmd-katex]');
    expect(link).toBeTruthy();
    expect(link?.getAttribute('rel')).toBe('stylesheet');
  });

  it('is idempotent: injects only once', () => {
    injectKatexCss();
    injectKatexCss();
    injectKatexCss();
    const links = document.head.querySelectorAll('link[data-bobmd-katex]');
    expect(links.length).toBe(1);
  });
});

describe('sanitizeSvgOutput', () => {
  it('removes script tags', () => {
    const svg = '<svg><script>alert(1)</script></svg>';
    expect(sanitizeSvgOutput(svg)).not.toContain('<script');
    expect(sanitizeSvgOutput(svg)).not.toContain('alert(1)');
  });

  it('removes on* event handlers', () => {
    const svg = '<svg onload="alert(1)"><circle onmouseover="bad()"/></svg>';
    const result = sanitizeSvgOutput(svg);
    expect(result).not.toMatch(/on\w+="/i);
  });

  it('removes javascript: URIs', () => {
    const svg = '<svg><a href="javascript:alert(1)">x</a></svg>';
    const result = sanitizeSvgOutput(svg);
    expect(result.toLowerCase()).not.toContain('javascript:');
  });

  it('keeps safe SVG content', () => {
    const svg =
      '<svg width="100" height="100"><rect x="0" y="0" width="50" height="50" fill="blue"/></svg>';
    const result = sanitizeSvgOutput(svg);
    expect(result).toContain('<rect');
    expect(result).toContain('fill="blue"');
  });
});
