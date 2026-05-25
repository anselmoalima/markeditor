import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createPluginManager } from '../../src/core/pluginManager.js';
import type { BobEditorPlugin, EditorAPI, HastRoot } from '../../src/types.js';

function makeApi(): EditorAPI {
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
  };
}

function makePlugin(overrides: Partial<BobEditorPlugin> = {}): BobEditorPlugin {
  return { name: 'test-plugin', ...overrides };
}

describe('createPluginManager', () => {
  let manager: ReturnType<typeof createPluginManager>;
  let api: EditorAPI;

  beforeEach(() => {
    manager = createPluginManager();
    api = makeApi();
  });

  // --- registration ---

  it('register returns plugins in registration order', () => {
    const p1 = makePlugin({ name: 'a' });
    const p2 = makePlugin({ name: 'b' });
    const result = manager.register([p1, p2], api);
    expect(result.map((p) => p.name)).toEqual(['a', 'b']);
  });

  it('register throws on conflicting toolbar button IDs naming both plugins', () => {
    const p1 = makePlugin({
      name: 'plugin-alpha',
      toolbarButtons: [{ id: 'bold', action: vi.fn() }],
    });
    const p2 = makePlugin({
      name: 'plugin-beta',
      toolbarButtons: [{ id: 'bold', action: vi.fn() }],
    });
    expect(() => manager.register([p1, p2], api)).toThrow(/bold/);
    expect(() => {
      createPluginManager().register([p1, p2], api);
    }).toThrow(/plugin-alpha/);
  });

  it('register merges sanitizeSchema from plugins into active schema', () => {
    const p1 = makePlugin({
      name: 'math-plugin',
      sanitizeSchema: { tagNames: ['math', 'annotation'] },
    });
    manager.register([p1], api);
    const schema = manager.getActiveSchema();
    expect(schema.tagNames).toContain('math');
    expect(schema.tagNames).toContain('annotation');
  });

  it('register does not allow on* attributes through sanitize schema merge', () => {
    const p1 = makePlugin({
      name: 'bad-plugin',
      sanitizeSchema: { attributes: { div: ['onclick'] } },
    });
    manager.register([p1], api);
    const schema = manager.getActiveSchema();
    const divAttrs = (schema.attributes as Record<string, string[]> | undefined)?.['div'] ?? [];
    expect(divAttrs).not.toContain('onclick');
  });

  // --- invokeOnMount ---

  it('invokeOnMount calls plugins in registration order', () => {
    const callOrder: string[] = [];
    const p1 = makePlugin({
      name: 'first',
      onMount: () => {
        callOrder.push('first');
      },
    });
    const p2 = makePlugin({
      name: 'second',
      onMount: () => {
        callOrder.push('second');
      },
    });
    manager.register([p1, p2], api);
    manager.invokeOnMount([p1, p2], api);
    expect(callOrder).toEqual(['first', 'second']);
  });

  it('invokeOnMount collects cleanup functions returned by onMount', () => {
    const cleanup1 = vi.fn();
    const cleanup2 = vi.fn();
    const p1 = makePlugin({ name: 'a', onMount: () => cleanup1 });
    const p2 = makePlugin({ name: 'b', onMount: () => cleanup2 });
    const cleanups = manager.invokeOnMount([p1, p2], api);
    expect(cleanups).toHaveLength(2);
  });

  it('invokeOnMount returns empty array if no plugins have onMount', () => {
    const p1 = makePlugin({ name: 'no-mount' });
    const cleanups = manager.invokeOnMount([p1], api);
    expect(cleanups).toEqual([]);
  });

  // --- invokeCleanup ---

  it('invokeCleanup calls each cleanup exactly once in reverse order', () => {
    const callOrder: number[] = [];
    const c1 = vi.fn(() => callOrder.push(1));
    const c2 = vi.fn(() => callOrder.push(2));
    const c3 = vi.fn(() => callOrder.push(3));
    manager.invokeCleanup([c1, c2, c3]);
    expect(c1).toHaveBeenCalledTimes(1);
    expect(c2).toHaveBeenCalledTimes(1);
    expect(c3).toHaveBeenCalledTimes(1);
    expect(callOrder).toEqual([3, 2, 1]);
  });

  it('invokeCleanup handles empty array', () => {
    expect(() => manager.invokeCleanup([])).not.toThrow();
  });

  // --- invokeOnChange ---

  it('invokeOnChange calls plugins onChange in registration order', () => {
    const callOrder: string[] = [];
    const p1 = makePlugin({
      name: 'a',
      onChange: () => {
        callOrder.push('a');
      },
    });
    const p2 = makePlugin({
      name: 'b',
      onChange: () => {
        callOrder.push('b');
      },
    });
    manager.invokeOnChange([p1, p2], 'hello', api);
    expect(callOrder).toEqual(['a', 'b']);
  });

  it('invokeOnChange emits console.warn on recursion depth > 2 but does not throw', () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    let count = 0;
    const p1 = makePlugin({
      name: 'recursive',
      onChange: (_v, a) => {
        count++;
        if (count < 5) {
          manager.invokeOnChange([p1], _v, a);
        }
      },
    });
    expect(() => manager.invokeOnChange([p1], 'x', api)).not.toThrow();
    expect(warnSpy).toHaveBeenCalled();
    warnSpy.mockRestore();
  });

  // --- invokeOnBeforeParse ---

  it('invokeOnBeforeParse chains transforms in registration order', () => {
    const p1 = makePlugin({ name: 'a', onBeforeParse: (md) => md + '-A' });
    const p2 = makePlugin({ name: 'b', onBeforeParse: (md) => md + '-B' });
    const result = manager.invokeOnBeforeParse([p1, p2], 'start');
    expect(result).toBe('start-A-B');
  });

  it('invokeOnBeforeParse returns markdown unchanged if no plugins transform', () => {
    const p1 = makePlugin({ name: 'no-transform' });
    const result = manager.invokeOnBeforeParse([p1], 'hello');
    expect(result).toBe('hello');
  });

  // --- invokeOnAfterRender ---

  it('invokeOnAfterRender chains hast transforms in registration order', () => {
    const hast: HastRoot = { type: 'root', children: [] };
    const p1 = makePlugin({
      name: 'a',
      onAfterRender: (root) => {
        return { ...root, children: [...root.children, { type: 'text', value: 'A' } as never] };
      },
    });
    const p2 = makePlugin({
      name: 'b',
      onAfterRender: (root) => {
        return { ...root, children: [...root.children, { type: 'text', value: 'B' } as never] };
      },
    });
    const result = manager.invokeOnAfterRender([p1, p2], hast);
    expect(result.children).toHaveLength(2);
  });

  it('invokeOnAfterRender returns hast unchanged if plugin returns void', () => {
    const hast: HastRoot = { type: 'root', children: [] };
    const p1 = makePlugin({ name: 'void-render', onAfterRender: () => undefined });
    const result = manager.invokeOnAfterRender([p1], hast);
    expect(result).toBe(hast);
  });

  // --- isolation via factory ---

  it('two createPluginManager instances have isolated schemas', () => {
    const m1 = createPluginManager();
    const m2 = createPluginManager();
    const p = makePlugin({ name: 'x', sanitizeSchema: { tagNames: ['custom-tag'] } });
    m1.register([p], api);
    const s2 = m2.getActiveSchema();
    expect(s2.tagNames ?? []).not.toContain('custom-tag');
  });
});

// --- integration: full lifecycle ---

describe('pluginManager full lifecycle integration', () => {
  it('mount → onChange → unmount in correct order with cleanup', () => {
    const log: string[] = [];
    const api = makeApi();
    const manager = createPluginManager();

    const cleanup = vi.fn(() => log.push('cleanup'));
    const p1 = makePlugin({
      name: 'lifecycle',
      onMount: (_a) => {
        log.push('mount');
        return cleanup;
      },
      onChange: (_v, _a) => {
        log.push('change');
      },
    });

    manager.register([p1], api);
    const cleanups = manager.invokeOnMount([p1], api);
    manager.invokeOnChange([p1], 'new value', api);
    manager.invokeCleanup(cleanups);

    expect(log).toEqual(['mount', 'change', 'cleanup']);
    expect(cleanup).toHaveBeenCalledTimes(1);
  });
});
