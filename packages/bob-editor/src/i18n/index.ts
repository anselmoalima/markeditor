export { en } from './en.js';
export { ptBR } from './pt-BR.js';
export type { EnCatalog, EnKey } from './en.js';

import { en } from './en.js';
import { ptBR } from './pt-BR.js';

const catalog: Record<string, Record<string, string>> = {
  en: en as Record<string, string>,
  'pt-BR': ptBR as Record<string, string>,
};

/**
 * Looks up a single message key.
 * Priority: overrides → locale catalog → 'en' catalog → key (fallback).
 */
export function resolveMessage(
  key: string,
  locale: string,
  overrides?: Partial<Record<string, string>>,
): string {
  if (overrides && key in overrides) {
    return overrides[key] as string;
  }
  const localeCatalog = catalog[locale];
  if (localeCatalog && key in localeCatalog) {
    return localeCatalog[key] as string;
  }
  const enCatalog = catalog['en'];
  if (enCatalog && key in enCatalog) {
    return enCatalog[key] as string;
  }
  return key;
}

/**
 * Returns a merged catalog: en + locale catalog + overrides.
 */
export function resolveMessages(
  locale: string,
  overrides?: Partial<Record<string, string>>,
): Record<string, string> {
  const base: Record<string, string> = { ...(catalog['en'] ?? {}) };
  const localeCatalog = catalog[locale];
  if (localeCatalog) {
    Object.assign(base, localeCatalog);
  }
  if (overrides) {
    Object.assign(base, overrides);
  }
  return base;
}
