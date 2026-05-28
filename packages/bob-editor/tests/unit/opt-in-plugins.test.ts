import { describe, it, expect, vi } from 'vitest';
import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkRehype from 'remark-rehype';
import rehypeSanitize from 'rehype-sanitize';
import { toHtml } from 'hast-util-to-html';
import { emojiPlugin, EMOJI_MAP } from '../../src/plugins/emoji.js';
import { createMentionsPlugin } from '../../src/plugins/mentions.js';
import { wordCountPlugin } from '../../src/plugins/wordCount.js';
import { tableOfContentsPlugin } from '../../src/plugins/tableOfContents.js';
import { getCoreSchema } from '../../src/core/sanitize/index.js';
import { mergeSanitizeSchema } from '../../src/core/sanitize/merge.js';
import type { EditorAPI } from '../../src/types.js';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function renderMarkdown(
  markdown: string,
  remarkPlugins: Parameters<typeof unified.prototype.use>[0][] = [],
  sanitizeSchema = getCoreSchema(),
): Promise<string> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let proc: any = unified().use(remarkParse);
  for (const plugin of remarkPlugins) {
    proc = proc.use(plugin as never);
  }
  // Use hast-util-to-html as compiler (replaces rehype-stringify dependency)
  proc = proc
    .use(remarkRehype)
    .use(rehypeSanitize, sanitizeSchema)
    .use(function (this: any) {
      this.compiler = toHtml;
    });
  const result = await proc.process(markdown);
  return String(result);
}

function makeMockApi(overrides: Partial<EditorAPI> = {}): EditorAPI {
  return {
    getValue: vi.fn(() => ''),
    setValue: vi.fn(),
    getSelection: vi.fn(() => ({ start: 0, end: 0, text: '' })),
    getCursorPosition: vi.fn(() => 0),
    insertText: vi.fn(),
    replaceSelection: vi.fn(),
    wrapSelection: vi.fn(),
    getMode: vi.fn(() => 'edit' as const),
    setMode: vi.fn(),
    focus: vi.fn(),
    blur: vi.fn(),
    showNotification: vi.fn(),
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// emojiPlugin
// ---------------------------------------------------------------------------

describe('emojiPlugin', () => {
  it('has correct name and version', () => {
    expect(emojiPlugin.name).toBe('emoji');
    expect(emojiPlugin.version).toBe('1.0.0');
  });

  it('remarkPlugins list is defined and non-empty', () => {
    expect(emojiPlugin.remarkPlugins).toBeDefined();
    expect((emojiPlugin.remarkPlugins ?? []).length).toBeGreaterThan(0);
  });

  it('transforms :smile: to emoji character in output', async () => {
    const html = await renderMarkdown(':smile:', emojiPlugin.remarkPlugins as never[]);
    expect(html).toContain(EMOJI_MAP['smile']);
    expect(html).not.toContain(':smile:');
  });

  it('transforms :tada: to 🎉', async () => {
    const html = await renderMarkdown(':tada:', emojiPlugin.remarkPlugins as never[]);
    expect(html).toContain('🎉');
  });

  it('transforms :rocket: to 🚀', async () => {
    const html = await renderMarkdown(':rocket:', emojiPlugin.remarkPlugins as never[]);
    expect(html).toContain('🚀');
  });

  it('leaves unknown shortcodes unchanged', async () => {
    const html = await renderMarkdown(':not_a_real_emoji:', emojiPlugin.remarkPlugins as never[]);
    expect(html).toContain(':not_a_real_emoji:');
  });

  it('transforms multiple emoji in a single paragraph', async () => {
    const html = await renderMarkdown(
      ':heart: and :fire: and :tada:',
      emojiPlugin.remarkPlugins as never[],
    );
    expect(html).toContain(EMOJI_MAP['heart']);
    expect(html).toContain(EMOJI_MAP['fire']);
    expect(html).toContain(EMOJI_MAP['tada']);
  });

  it('does not export MermaidDiagram or MathBlock symbols', async () => {
    // Dynamic import to simulate tree-shaking isolation
    const mod = await import('../../src/plugins/emoji.js');
    expect((mod as Record<string, unknown>)['MermaidDiagram']).toBeUndefined();
    expect((mod as Record<string, unknown>)['MathBlock']).toBeUndefined();
  });

  it('has a toolbar button for emoji insertion', () => {
    expect(emojiPlugin.toolbarButtons).toBeDefined();
    expect((emojiPlugin.toolbarButtons ?? []).length).toBeGreaterThan(0);
    const btn = emojiPlugin.toolbarButtons![0]!;
    const mockApi = makeMockApi();
    btn.action(mockApi);
    expect(mockApi.insertText).toHaveBeenCalledWith(':smile:');
  });

  it('sanitizeSchema extension does not weaken locked security clauses', () => {
    const base = getCoreSchema();
    const merged = mergeSanitizeSchema(base, emojiPlugin.sanitizeSchema ?? {});
    // on* event attributes must remain blocked
    const allAttrs = Object.values(merged.attributes ?? {}).flat();
    const hasOnAttr = allAttrs.some((a) => typeof a === 'string' && /^on/i.test(a));
    expect(hasOnAttr).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// createMentionsPlugin
// ---------------------------------------------------------------------------

describe('createMentionsPlugin', () => {
  const plugin = createMentionsPlugin({
    resolveMention: (u) => ({ url: `/u/${u}`, displayName: u }),
  });

  it('returns a plugin with name mentions', () => {
    expect(plugin.name).toBe('mentions');
  });

  it('transforms @alice to a link pointing to /u/alice', async () => {
    const schema = mergeSanitizeSchema(getCoreSchema(), plugin.sanitizeSchema ?? {});
    const html = await renderMarkdown('@alice', plugin.remarkPlugins as never[], schema);
    expect(html).toContain('href="/u/alice"');
    expect(html).toContain('@alice');
  });

  it('link has the bobmd-mention class', async () => {
    const schema = mergeSanitizeSchema(getCoreSchema(), plugin.sanitizeSchema ?? {});
    const html = await renderMarkdown('@alice', plugin.remarkPlugins as never[], schema);
    expect(html).toContain('bobmd-mention');
  });

  it('supports multiple mentions in one paragraph', async () => {
    const schema = mergeSanitizeSchema(getCoreSchema(), plugin.sanitizeSchema ?? {});
    const html = await renderMarkdown('@alice and @bob', plugin.remarkPlugins as never[], schema);
    expect(html).toContain('href="/u/alice"');
    expect(html).toContain('href="/u/bob"');
  });

  it('custom resolveMention is called with the correct username', async () => {
    const resolver = vi.fn((u: string) => ({ url: `https://example.com/${u}`, displayName: u }));
    const customPlugin = createMentionsPlugin({ resolveMention: resolver });
    const schema = mergeSanitizeSchema(getCoreSchema(), customPlugin.sanitizeSchema ?? {});
    await renderMarkdown('@charlie', customPlugin.remarkPlugins as never[], schema);
    expect(resolver).toHaveBeenCalledWith('charlie');
  });

  it('sanitizeSchema allows className on <a>', () => {
    const aAttrs = plugin.sanitizeSchema?.attributes?.['a'];
    expect(aAttrs).toContain('className');
  });

  it('does not export MermaidDiagram or MathBlock symbols', async () => {
    const mod = await import('../../src/plugins/mentions.js');
    expect((mod as Record<string, unknown>)['MermaidDiagram']).toBeUndefined();
    expect((mod as Record<string, unknown>)['MathBlock']).toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// wordCountPlugin
// ---------------------------------------------------------------------------

describe('wordCountPlugin', () => {
  it('has correct name', () => {
    expect(wordCountPlugin.name).toBe('wordCount');
  });

  it('onChange with "hello world" calls showNotification with Words: 2 | Chars: 11', () => {
    const api = makeMockApi();
    wordCountPlugin.onChange!('hello world', api);
    expect(api.showNotification).toHaveBeenCalledWith('Words: 2 | Chars: 11', 'info');
  });

  it('onChange with empty string reports Words: 0', () => {
    const api = makeMockApi();
    wordCountPlugin.onChange!('', api);
    expect(api.showNotification).toHaveBeenCalledWith('Words: 0 | Chars: 0', 'info');
  });

  it('onChange with whitespace-only string reports Words: 0', () => {
    const api = makeMockApi();
    wordCountPlugin.onChange!('   ', api);
    expect(api.showNotification).toHaveBeenCalledWith('Words: 0 | Chars: 3', 'info');
  });

  it('counts multi-line content correctly', () => {
    const api = makeMockApi();
    wordCountPlugin.onChange!('foo\nbar\nbaz', api);
    expect(api.showNotification).toHaveBeenCalledWith('Words: 3 | Chars: 11', 'info');
  });
});

// ---------------------------------------------------------------------------
// tableOfContentsPlugin
// ---------------------------------------------------------------------------

describe('tableOfContentsPlugin', () => {
  it('has correct name', () => {
    expect(tableOfContentsPlugin.name).toBe('tableOfContents');
  });

  it('onAfterRender: hast tree with h2 nodes gets a <nav> prepended', () => {
    const root = {
      type: 'root',
      children: [
        {
          type: 'element',
          tagName: 'h2',
          properties: { id: 'intro' },
          children: [{ type: 'text', value: 'Introduction' }],
        },
        {
          type: 'element',
          tagName: 'h2',
          properties: { id: 'usage' },
          children: [{ type: 'text', value: 'Usage' }],
        },
      ],
    };

    tableOfContentsPlugin.onAfterRender!(root as never);

    expect(root.children.length).toBe(3);
    const nav = root.children[0] as never as {
      type: string;
      tagName: string;
      properties: Record<string, unknown>;
      children: unknown[];
    };
    expect(nav.type).toBe('element');
    expect(nav.tagName).toBe('nav');
    expect(nav.properties['ariaLabel']).toBe('Table of contents');
  });

  it('onAfterRender: list items link to heading IDs', () => {
    const root = {
      type: 'root',
      children: [
        {
          type: 'element',
          tagName: 'h3',
          properties: { id: 'section-one' },
          children: [{ type: 'text', value: 'Section One' }],
        },
      ],
    };

    tableOfContentsPlugin.onAfterRender!(root as never);

    // nav → ul → li → a
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const nav = root.children[0] as any as { children: any[] };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const ul = nav.children[0] as { children: any[] };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const li = ul.children[0] as { children: any[] };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const a = li.children[0] as {
      tagName: string;
      properties: { href: string; className: string[] };
    };
    expect(a.tagName).toBe('a');
    expect(a.properties.href).toBe('#section-one');
    expect(a.properties.className).toContain('bobmd-toc-h3');
  });

  it('onAfterRender: returns void when no headings with ids', () => {
    const root = {
      type: 'root',
      children: [
        {
          type: 'element',
          tagName: 'p',
          properties: {},
          children: [{ type: 'text', value: 'no headings' }],
        },
      ],
    };

    const result = tableOfContentsPlugin.onAfterRender!(root as never);
    expect(result).toBeUndefined();
    // Root unchanged
    expect(root.children.length).toBe(1);
  });

  it('sanitizeSchema adds nav tagName', () => {
    expect(tableOfContentsPlugin.sanitizeSchema?.tagNames).toContain('nav');
  });

  it('sanitizeSchema allows ariaLabel on nav', () => {
    const navAttrs = tableOfContentsPlugin.sanitizeSchema?.attributes?.['nav'];
    expect(navAttrs).toContain('ariaLabel');
  });

  it('sanitizeSchema allows # in href protocols', () => {
    const hrefProtos = tableOfContentsPlugin.sanitizeSchema?.protocols?.['href'];
    expect(hrefProtos).toContain('#');
  });
});

// ---------------------------------------------------------------------------
// plugins/index barrel
// ---------------------------------------------------------------------------

describe('plugins barrel', () => {
  it('exports all four opt-in plugins and built-ins', async () => {
    const mod = await import('../../src/plugins/index.js');
    expect(mod.emojiPlugin).toBeDefined();
    expect(mod.createMentionsPlugin).toBeDefined();
    expect(mod.wordCountPlugin).toBeDefined();
    expect(mod.tableOfContentsPlugin).toBeDefined();
    expect(mod.gfmPlugin).toBeDefined();
    expect(mod.mathPlugin).toBeDefined();
    expect(mod.mermaidPlugin).toBeDefined();
    expect(mod.alertsPlugin).toBeDefined();
    expect(mod.footnotesPlugin).toBeDefined();
    expect(mod.DEFAULT_PLUGINS).toBeDefined();
  });
});
