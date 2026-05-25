import { hash } from '../../utils/hash.js';

const MAX_SIZE = 4;

interface CacheEntry {
  key: string;
  element: JSX.Element;
}

const lru: CacheEntry[] = [];

export function buildCacheKey(
  markdown: string,
  pluginSignature: string,
  schemaVersion: number,
): string {
  return `${hash(markdown).toString(16)}-${pluginSignature}-${schemaVersion}`;
}

export function getCached(key: string): JSX.Element | undefined {
  const idx = lru.findIndex((e) => e.key === key);
  if (idx === -1) return undefined;
  // Move to end (most recently used)
  const [entry] = lru.splice(idx, 1);
  if (entry) {
    lru.push(entry);
    return entry.element;
  }
  return undefined;
}

export function setCached(key: string, element: JSX.Element): void {
  const existing = lru.findIndex((e) => e.key === key);
  if (existing !== -1) {
    lru.splice(existing, 1);
  }
  lru.push({ key, element });
  if (lru.length > MAX_SIZE) {
    lru.shift(); // evict least recently used
  }
}

/** Only for testing. */
export function _resetMemo(): void {
  lru.length = 0;
}
