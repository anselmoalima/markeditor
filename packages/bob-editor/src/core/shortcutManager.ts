import type { KeyboardShortcut, EditorAPI } from '../types.js';

export interface ParsedShortcut {
  key: string;
  meta: boolean;
  ctrl: boolean;
  shift: boolean;
  alt: boolean;
}

export interface ShortcutEntry {
  id: string;
  keys: string;
  label?: string;
  parsed: ParsedShortcut;
  action: (api: EditorAPI) => void;
  disabled: boolean;
}

export interface ShortcutManager {
  parse(shortcut: string): ParsedShortcut;
  register(shortcuts: KeyboardShortcut[], api: EditorAPI): void;
  override(id: string, newShortcut: string): void;
  disable(id: string): void;
  destroy(): void;
  getEntries(): Array<{ id: string; keys: string; label?: string; disabled: boolean }>;
}

export interface ShortcutManagerOptions {
  platform?: string;
}

function isMac(platform: string): boolean {
  return /mac/i.test(platform);
}

export function createShortcutManager(options: ShortcutManagerOptions = {}): ShortcutManager {
  const platform = options.platform ?? (typeof navigator !== 'undefined' ? navigator.platform : '');
  const mac = isMac(platform);

  const entries: ShortcutEntry[] = [];
  let boundApi: EditorAPI | null = null;
  let listener: ((e: KeyboardEvent) => void) | null = null;

  function parseShortcut(shortcut: string): ParsedShortcut {
    const parts = shortcut.split('+');
    let meta = false;
    let ctrl = false;
    let shift = false;
    let alt = false;
    let key = '';

    for (const part of parts) {
      const p = part.trim();
      if (p === 'Mod') {
        if (mac) meta = true;
        else ctrl = true;
      } else if (p === 'Ctrl') {
        ctrl = true;
      } else if (p === 'Meta' || p === 'Cmd') {
        meta = true;
      } else if (p === 'Shift') {
        shift = true;
      } else if (p === 'Alt') {
        alt = true;
      } else {
        key = p.toLowerCase();
      }
    }

    return { key, meta, ctrl, shift, alt };
  }

  function matchesEvent(parsed: ParsedShortcut, e: KeyboardEvent): boolean {
    return (
      e.key.toLowerCase() === parsed.key &&
      e.metaKey === parsed.meta &&
      e.ctrlKey === parsed.ctrl &&
      e.shiftKey === parsed.shift &&
      e.altKey === parsed.alt
    );
  }

  function handleKeydown(e: KeyboardEvent): void {
    if (!boundApi) return;
    for (const entry of entries) {
      if (!entry.disabled && matchesEvent(entry.parsed, e)) {
        e.preventDefault();
        entry.action(boundApi);
      }
    }
  }

  return {
    parse: parseShortcut,

    register(shortcuts, api) {
      boundApi = api;
      for (const s of shortcuts) {
        const existing = entries.find((e) => e.id === s.id);
        if (existing) {
          existing.keys = s.keys;
          if (s.label !== undefined) {
            existing.label = s.label;
          } else {
            delete existing.label;
          }
          existing.parsed = parseShortcut(s.keys);
          existing.action = s.action;
          existing.disabled = false;
        } else {
          const entry: ShortcutEntry = {
            id: s.id,
            keys: s.keys,
            parsed: parseShortcut(s.keys),
            action: s.action,
            disabled: false,
          };
          if (s.label !== undefined) {
            entry.label = s.label;
          }
          entries.push(entry);
        }
      }

      if (listener === null) {
        listener = handleKeydown;
        document.addEventListener('keydown', listener);
      }
    },

    override(id, newShortcut) {
      const entry = entries.find((e) => e.id === id);
      if (entry) {
        entry.parsed = parseShortcut(newShortcut);
        entry.disabled = false;
      }
    },

    disable(id) {
      const entry = entries.find((e) => e.id === id);
      if (entry) {
        entry.disabled = true;
      }
    },

    destroy() {
      if (listener !== null) {
        document.removeEventListener('keydown', listener);
        listener = null;
      }
      entries.length = 0;
      boundApi = null;
    },

    getEntries() {
      return entries.map((e) => {
        const entry: { id: string; keys: string; label?: string; disabled: boolean } = {
          id: e.id,
          keys: e.keys,
          disabled: e.disabled,
        };
        if (e.label !== undefined) {
          entry.label = e.label;
        }
        return entry;
      });
    },
  };
}
