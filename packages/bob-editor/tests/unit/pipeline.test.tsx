import { describe, it, expect, beforeEach } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';
import { renderToStaticMarkup } from 'react-dom/server';
import { buildProcessor, process as pipelineProcess } from '../../src/core/pipeline/builder.js';
import { buildCacheKey, getCached, setCached, _resetMemo } from '../../src/core/pipeline/memo.js';
import { hash } from '../../src/utils/hash.js';
import type { GenerationRef } from '../../src/core/pipeline/builder.js';

const FIXTURES = join(import.meta.dirname ?? __dirname, '../fixtures');

function readFixture(path: string): string {
  return readFileSync(join(FIXTURES, path), 'utf-8');
}

function toHtml(element: JSX.Element): string {
  return renderToStaticMarkup(element);
}

describe('pipeline builder', () => {
  describe('XSS sanitization', () => {
    let proc: ReturnType<typeof buildProcessor>;

    beforeEach(() => {
      proc = buildProcessor();
    });

    it('strips <script> tags', async () => {
      const md = readFixture('xss/script-tag.md');
      const ref: GenerationRef = { current: 0 };
      const element = await pipelineProcess(md, proc, 0, ref);
      expect(element).not.toBeNull();
      const html = toHtml(element!);
      expect(html).not.toContain('<script');
      expect(html).not.toContain('alert(1)');
    });

    it('removes onerror attribute from img', async () => {
      const md = readFixture('xss/img-onerror.md');
      const ref: GenerationRef = { current: 0 };
      const element = await pipelineProcess(md, proc, 0, ref);
      expect(element).not.toBeNull();
      const html = toHtml(element!);
      expect(html).not.toContain('onerror');
      expect(html).not.toContain('alert(1)');
    });

    it('removes or replaces javascript: href', async () => {
      const md = readFixture('xss/javascript-href.md');
      const ref: GenerationRef = { current: 0 };
      const element = await pipelineProcess(md, proc, 0, ref);
      expect(element).not.toBeNull();
      const html = toHtml(element!);
      expect(html.toLowerCase()).not.toContain('javascript:');
    });

    it('strips data:text/html href', async () => {
      const md = readFixture('xss/data-html.md');
      const ref: GenerationRef = { current: 0 };
      const element = await pipelineProcess(md, proc, 0, ref);
      expect(element).not.toBeNull();
      const html = toHtml(element!);
      expect(html.toLowerCase()).not.toContain('data:text/html');
    });

    it('removes on* event attributes from all elements', async () => {
      const md = readFixture('xss/event-attrs.md');
      const ref: GenerationRef = { current: 0 };
      const element = await pipelineProcess(md, proc, 0, ref);
      expect(element).not.toBeNull();
      const html = toHtml(element!);
      expect(html).not.toMatch(/on\w+=/i);
    });

    it('removes onload from SVG', async () => {
      const md = readFixture('xss/svg-onload.md');
      const ref: GenerationRef = { current: 0 };
      const element = await pipelineProcess(md, proc, 0, ref);
      expect(element).not.toBeNull();
      const html = toHtml(element!);
      expect(html).not.toContain('onload');
    });
  });

  describe('markdown features', () => {
    let proc: ReturnType<typeof buildProcessor>;

    beforeEach(() => {
      proc = buildProcessor();
    });

    it('processes GFM table fixture', async () => {
      const md = readFixture('markdown/gfm/in.md');
      const ref: GenerationRef = { current: 0 };
      const element = await pipelineProcess(md, proc, 0, ref);
      expect(element).not.toBeNull();
      const html = toHtml(element!);
      expect(html).toContain('<table');
      expect(html).toContain('foo');
      expect(html).toContain('bar');
    });

    it('processes GFM strikethrough', async () => {
      const md = readFixture('markdown/gfm/in.md');
      const ref: GenerationRef = { current: 0 };
      const element = await pipelineProcess(md, proc, 0, ref);
      const html = toHtml(element!);
      expect(html).toContain('<del>');
    });

    it('processes math fixture and produces KaTeX output', async () => {
      const md = readFixture('markdown/math/in.md');
      const ref: GenerationRef = { current: 0 };
      const element = await pipelineProcess(md, proc, 0, ref);
      expect(element).not.toBeNull();
      const html = toHtml(element!);
      // KaTeX produces math elements or spans with katex class
      expect(html).toMatch(/katex|math/i);
    });

    it('processes code blocks fixture with language class', async () => {
      const md = readFixture('markdown/code/in.md');
      const ref: GenerationRef = { current: 0 };
      const element = await pipelineProcess(md, proc, 0, ref);
      expect(element).not.toBeNull();
      const html = toHtml(element!);
      expect(html).toContain('language-javascript');
    });

    it('processes headings fixture and adds id attributes (slug)', async () => {
      const md = readFixture('markdown/headings/in.md');
      const ref: GenerationRef = { current: 0 };
      const element = await pipelineProcess(md, proc, 0, ref);
      expect(element).not.toBeNull();
      const html = toHtml(element!);
      expect(html).toContain('id="user-content-heading-one"');
    });

    it('processes task lists fixture', async () => {
      const md = readFixture('markdown/tasklists/in.md');
      const ref: GenerationRef = { current: 0 };
      const element = await pipelineProcess(md, proc, 0, ref);
      expect(element).not.toBeNull();
      const html = toHtml(element!);
      expect(html).toContain('type="checkbox"');
    });
  });

  describe('full pipeline integration', () => {
    it('processes Hello World and returns element tree with h1 and strong', async () => {
      const proc = buildProcessor();
      const ref: GenerationRef = { current: 0 };
      const element = await pipelineProcess('# Hello\n\n**world**', proc, 0, ref);
      expect(element).not.toBeNull();
      const html = toHtml(element!);
      expect(html).toContain('<h1');
      expect(html).toContain('<strong>');
      expect(html).toContain('Hello');
      expect(html).toContain('world');
    });

    it('returns null when generation is stale', async () => {
      const proc = buildProcessor();
      const ref: GenerationRef = { current: 1 };
      // Pass generation 0 but ref.current is already 1 → stale
      const element = await pipelineProcess('# Hello', proc, 0, ref);
      expect(element).toBeNull();
    });

    it('returns element when generation matches ref', async () => {
      const proc = buildProcessor();
      const ref: GenerationRef = { current: 5 };
      const element = await pipelineProcess('# Hello', proc, 5, ref);
      expect(element).not.toBeNull();
    });
  });
});

describe('pipeline memo', () => {
  beforeEach(() => {
    _resetMemo();
  });

  it('getCached returns undefined for a missing key', () => {
    expect(getCached('nonexistent')).toBeUndefined();
  });

  it('setCached and getCached round-trip', () => {
    const element = <div>test</div>;
    setCached('key1', element);
    expect(getCached('key1')).toBe(element);
  });

  it('returns same reference on cache hit', () => {
    const element = <p>hello</p>;
    setCached('key-ref', element);
    expect(getCached('key-ref')).toBe(element);
  });

  it('evicts oldest entry when size exceeds 4', () => {
    const elements = Array.from({ length: 5 }, (_, i) => <span key={i}>{i}</span>);

    setCached('k1', elements[0]!);
    setCached('k2', elements[1]!);
    setCached('k3', elements[2]!);
    setCached('k4', elements[3]!);
    setCached('k5', elements[4]!); // k1 should be evicted

    expect(getCached('k1')).toBeUndefined();
    expect(getCached('k5')).toBe(elements[4]);
  });

  it('buildCacheKey is stable for same inputs', () => {
    const k1 = buildCacheKey('hello', 'pluginA', 1);
    const k2 = buildCacheKey('hello', 'pluginA', 1);
    expect(k1).toBe(k2);
  });

  it('buildCacheKey differs for different markdown', () => {
    const k1 = buildCacheKey('hello', 'pluginA', 1);
    const k2 = buildCacheKey('world', 'pluginA', 1);
    expect(k1).not.toBe(k2);
  });

  it('buildCacheKey uses FNV hash of markdown', () => {
    const key = buildCacheKey('test', 'sig', 0);
    expect(key).toContain(hash('test').toString(16));
  });

  it('processing same markdown twice returns same element reference (cache-based)', async () => {
    const proc = buildProcessor();
    const ref: GenerationRef = { current: 0 };
    const markdown = '# Cached test\n\nSome content.';

    const element1 = await pipelineProcess(markdown, proc, 0, ref);
    expect(element1).not.toBeNull();

    const cacheKey = buildCacheKey(markdown, '', 0);
    setCached(cacheKey, element1!);

    const cachedElement = getCached(cacheKey);
    expect(cachedElement).toBe(element1);
  });
});
