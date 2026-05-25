import { describe, it, expect } from 'vitest';
import { mergeSanitizeSchema } from '../../src/core/sanitize/merge.js';
import { getCoreSchema } from '../../src/core/sanitize/schema.js';
import type { Options as Schema } from 'rehype-sanitize';
import { defaultSchema } from 'rehype-sanitize';

describe('mergeSanitizeSchema', () => {
  it('adds tagNames from extension without removing base entries', () => {
    const base = structuredClone(defaultSchema) as Schema;
    const ext: Schema = { tagNames: ['math'] };
    const merged = mergeSanitizeSchema(base, ext);

    expect(merged.tagNames).toContain('math');
    // Original tags preserved
    expect(merged.tagNames).toContain('a');
    expect(merged.tagNames).toContain('p');
  });

  it('blocks script tag even if extension tries to add it', () => {
    const base = structuredClone(defaultSchema) as Schema;
    const ext: Schema = { tagNames: ['script', 'div'] };
    const merged = mergeSanitizeSchema(base, ext);

    expect(merged.tagNames).not.toContain('script');
    expect(merged.tagNames).toContain('div');
  });

  it('blocks on* event handler attributes after merge', () => {
    const base = structuredClone(defaultSchema) as Schema;
    const ext: Schema = {
      attributes: {
        '*': ['onclick', 'onmouseover', 'className'],
        div: ['onload'],
      },
    };
    const merged = mergeSanitizeSchema(base, ext);
    const globalAttrs = (merged.attributes as Record<string, string[]>)['*'] ?? [];
    const divAttrs = (merged.attributes as Record<string, string[]>)['div'] ?? [];

    expect(globalAttrs).not.toContain('onclick');
    expect(globalAttrs).not.toContain('onmouseover');
    expect(divAttrs).not.toContain('onload');
    expect(globalAttrs).toContain('className');
  });

  it('blocks javascript: protocol after merge', () => {
    const base = structuredClone(defaultSchema) as Schema;
    const ext: Schema = {
      protocols: {
        href: ['javascript', 'http', 'https'],
      },
    };
    const merged = mergeSanitizeSchema(base, ext);
    const hrefProtos = (merged.protocols as Record<string, string[]>)['href'] ?? [];

    expect(hrefProtos).not.toContain('javascript');
    expect(hrefProtos).toContain('http');
    expect(hrefProtos).toContain('https');
  });

  it('blocks data: protocol after merge', () => {
    const base = structuredClone(defaultSchema) as Schema;
    const ext: Schema = {
      protocols: {
        href: ['data', 'http'],
      },
    };
    const merged = mergeSanitizeSchema(base, ext);
    const hrefProtos = (merged.protocols as Record<string, string[]>)['href'] ?? [];

    expect(hrefProtos).not.toContain('data');
    expect(hrefProtos).toContain('http');
  });

  it('merges attributes from multiple extensions', () => {
    const base = structuredClone(defaultSchema) as Schema;
    const ext: Schema = {
      attributes: {
        span: ['className', 'style'],
        div: ['data-type'],
      },
    };
    const merged = mergeSanitizeSchema(base, ext);
    const spanAttrs = (merged.attributes as Record<string, string[]>)['span'] ?? [];
    const divAttrs = (merged.attributes as Record<string, string[]>)['div'] ?? [];

    expect(spanAttrs).toContain('className');
    expect(spanAttrs).toContain('style');
    expect(divAttrs).toContain('data-type');
  });

  it('deduplicates tagNames', () => {
    const base: Schema = { tagNames: ['p', 'div'] };
    const ext: Schema = { tagNames: ['p', 'span'] };
    const merged = mergeSanitizeSchema(base, ext);

    const count = (merged.tagNames ?? []).filter((t) => t === 'p').length;
    expect(count).toBe(1);
  });
});

describe('getCoreSchema', () => {
  it('returns a deep clone — mutating return does not affect next call', () => {
    const s1 = getCoreSchema();
    s1.tagNames?.push('__test_tag__');

    const s2 = getCoreSchema();
    expect(s2.tagNames).not.toContain('__test_tag__');
  });

  it('includes math tags', () => {
    const schema = getCoreSchema();
    expect(schema.tagNames).toContain('math');
    expect(schema.tagNames).toContain('mrow');
  });

  it('includes SVG tags for mermaid', () => {
    const schema = getCoreSchema();
    expect(schema.tagNames).toContain('svg');
    expect(schema.tagNames).toContain('g');
    expect(schema.tagNames).toContain('path');
  });

  it('includes div for alerts', () => {
    const schema = getCoreSchema();
    expect(schema.tagNames).toContain('div');
  });

  it('does not include script or style', () => {
    const schema = getCoreSchema();
    expect(schema.tagNames).not.toContain('script');
    expect(schema.tagNames).not.toContain('style');
  });

  it('allows id on heading tags for slugs', () => {
    const schema = getCoreSchema();
    const attrs = schema.attributes as Record<string, string[]>;
    expect(attrs['h1']).toContain('id');
    expect(attrs['h2']).toContain('id');
  });
});
