import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createShortcutManager } from '../../src/core/shortcutManager.js';
import type { EditorAPI } from '../../src/types.js';

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

function fireKeydown(
  key: string,
  opts: { ctrlKey?: boolean; metaKey?: boolean; shiftKey?: boolean; altKey?: boolean } = {},
) {
  const event = new KeyboardEvent('keydown', {
    key,
    ctrlKey: opts.ctrlKey ?? false,
    metaKey: opts.metaKey ?? false,
    shiftKey: opts.shiftKey ?? false,
    altKey: opts.altKey ?? false,
    bubbles: true,
  });
  document.dispatchEvent(event);
  return event;
}

describe('shortcutManager.parse', () => {
  it('parse "Mod+B" on macOS (navigator.platform = MacIntel) returns meta:true ctrl:false', () => {
    const manager = createShortcutManager({ platform: 'MacIntel' });
    const parsed = manager.parse('Mod+B');
    expect(parsed).toMatchObject({ key: 'b', meta: true, ctrl: false });
  });

  it('parse "Mod+B" on Linux (navigator.platform = Linux) returns meta:false ctrl:true', () => {
    const manager = createShortcutManager({ platform: 'Linux x86_64' });
    const parsed = manager.parse('Mod+B');
    expect(parsed).toMatchObject({ key: 'b', meta: false, ctrl: true });
  });

  it('parse "Mod+B" on Windows returns meta:false ctrl:true', () => {
    const manager = createShortcutManager({ platform: 'Win32' });
    const parsed = manager.parse('Mod+B');
    expect(parsed).toMatchObject({ key: 'b', meta: false, ctrl: true });
  });

  it('parse "Ctrl+Shift+B" returns ctrl:true shift:true key:b', () => {
    const manager = createShortcutManager({ platform: 'Linux x86_64' });
    const parsed = manager.parse('Ctrl+Shift+B');
    expect(parsed).toMatchObject({ key: 'b', ctrl: true, shift: true, meta: false });
  });

  it('parse "Alt+K" returns alt:true key:k', () => {
    const manager = createShortcutManager({ platform: 'Linux x86_64' });
    const parsed = manager.parse('Alt+K');
    expect(parsed).toMatchObject({ key: 'k', alt: true });
  });
});

describe('shortcutManager register and keydown dispatch', () => {
  let manager: ReturnType<typeof createShortcutManager>;
  let api: EditorAPI;

  beforeEach(() => {
    manager = createShortcutManager({ platform: 'Linux x86_64' });
    api = makeApi();
  });

  afterEach(() => {
    manager.destroy();
  });

  it('fires handler when matching keydown event is dispatched', () => {
    const handler = vi.fn();
    manager.register([{ id: 'bold', keys: 'Mod+B', action: handler }], api);
    fireKeydown('b', { ctrlKey: true });
    expect(handler).toHaveBeenCalledTimes(1);
    expect(handler).toHaveBeenCalledWith(api);
  });

  it('does not fire handler for non-matching keydown', () => {
    const handler = vi.fn();
    manager.register([{ id: 'bold', keys: 'Mod+B', action: handler }], api);
    fireKeydown('k', { ctrlKey: true });
    expect(handler).not.toHaveBeenCalled();
  });

  it('register attaches a single keydown listener for multiple shortcuts', () => {
    const addSpy = vi.spyOn(document, 'addEventListener');
    manager.register(
      [
        { id: 'bold', keys: 'Mod+B', action: vi.fn() },
        { id: 'italic', keys: 'Mod+I', action: vi.fn() },
      ],
      api,
    );
    const keydownCalls = addSpy.mock.calls.filter(([event]) => event === 'keydown');
    expect(keydownCalls).toHaveLength(1);
    addSpy.mockRestore();
  });
});

describe('shortcutManager override', () => {
  let manager: ReturnType<typeof createShortcutManager>;
  let api: EditorAPI;

  beforeEach(() => {
    manager = createShortcutManager({ platform: 'Linux x86_64' });
    api = makeApi();
  });

  afterEach(() => {
    manager.destroy();
  });

  it('override replaces shortcut: new keys trigger handler, old keys do not', () => {
    const handler = vi.fn();
    manager.register([{ id: 'bold', keys: 'Mod+B', action: handler }], api);
    manager.override('bold', 'Ctrl+Shift+B');

    fireKeydown('b', { ctrlKey: true });
    expect(handler).not.toHaveBeenCalled();

    fireKeydown('b', { ctrlKey: true, shiftKey: true });
    expect(handler).toHaveBeenCalledTimes(1);
  });

  it('override on non-existent id does nothing', () => {
    manager.register([{ id: 'bold', keys: 'Mod+B', action: vi.fn() }], api);
    expect(() => manager.override('nonexistent', 'Ctrl+Z')).not.toThrow();
  });
});

describe('shortcutManager disable', () => {
  let manager: ReturnType<typeof createShortcutManager>;
  let api: EditorAPI;

  beforeEach(() => {
    manager = createShortcutManager({ platform: 'Linux x86_64' });
    api = makeApi();
  });

  afterEach(() => {
    manager.destroy();
  });

  it('disable prevents handler from firing', () => {
    const handler = vi.fn();
    manager.register([{ id: 'bold', keys: 'Mod+B', action: handler }], api);
    manager.disable('bold');
    fireKeydown('b', { ctrlKey: true });
    expect(handler).not.toHaveBeenCalled();
  });

  it('disable on non-existent id does nothing', () => {
    manager.register([{ id: 'bold', keys: 'Mod+B', action: vi.fn() }], api);
    expect(() => manager.disable('nonexistent')).not.toThrow();
  });
});

describe('shortcutManager destroy', () => {
  it('destroy removes all keydown listeners', () => {
    const manager = createShortcutManager({ platform: 'Linux x86_64' });
    const api = makeApi();
    const removeSpy = vi.spyOn(document, 'removeEventListener');
    const handler = vi.fn();
    manager.register([{ id: 'bold', keys: 'Mod+B', action: handler }], api);
    manager.destroy();
    const keydownRemovals = removeSpy.mock.calls.filter(([event]) => event === 'keydown');
    expect(keydownRemovals.length).toBeGreaterThanOrEqual(1);
    removeSpy.mockRestore();
  });

  it('handler does not fire after destroy', () => {
    const manager = createShortcutManager({ platform: 'Linux x86_64' });
    const api = makeApi();
    const handler = vi.fn();
    manager.register([{ id: 'bold', keys: 'Mod+B', action: handler }], api);
    manager.destroy();
    fireKeydown('b', { ctrlKey: true });
    expect(handler).not.toHaveBeenCalled();
  });
});

describe('shortcutManager isolation', () => {
  it('two instances have isolated state: disabling in one does not affect the other', () => {
    const m1 = createShortcutManager({ platform: 'Linux x86_64' });
    const m2 = createShortcutManager({ platform: 'Linux x86_64' });
    const api = makeApi();
    const h1 = vi.fn();
    const h2 = vi.fn();

    m1.register([{ id: 'bold', keys: 'Mod+B', action: h1 }], api);
    m2.register([{ id: 'bold', keys: 'Mod+B', action: h2 }], api);

    m1.disable('bold');
    fireKeydown('b', { ctrlKey: true });

    expect(h1).not.toHaveBeenCalled();
    expect(h2).toHaveBeenCalledTimes(1);

    m1.destroy();
    m2.destroy();
  });
});
