import { useEffect, useRef } from 'react';
import type { Dispatch } from 'react';
import type { Action } from '../core/state/types.js';
import type { StorageConfig } from '../types.js';
import { debounce } from '../utils/debounce.js';

export interface UseStorageSyncOptions {
  markdown: string;
  dispatch: Dispatch<Action>;
  isControlled: boolean;
  hasDefaultValue: boolean;
  storage?: StorageConfig | undefined;
  onError?: ((error: Error) => void) | undefined;
}

export function useStorageSync({
  markdown,
  dispatch,
  isControlled,
  hasDefaultValue,
  storage,
  onError,
}: UseStorageSyncOptions): void {
  const storageDisabledRef = useRef(false);
  const warnedRef = useRef(false);

  const enabled = storage !== undefined && storage.enabled !== false;
  const storageType = storage?.storage ?? 'localStorage';
  const storageKey = storage?.storageKey ?? 'markdown-editor-content';
  const autoSaveInterval = storage?.autoSaveInterval ?? 1000;

  // Mount-time read: only in uncontrolled mode with no defaultValue
  useEffect(() => {
    if (!enabled) return;
    if (typeof window === 'undefined') return;

    if (isControlled) {
      if (process.env['NODE_ENV'] !== 'production' && !warnedRef.current) {
        warnedRef.current = true;
        console.warn(
          '[bob-editor] Storage is active in controlled mode (value prop provided). ' +
            'Storage will write but never read on mount. To restore from storage, ' +
            'read the storage key on your side and pass the value as the initial `value` prop. ' +
            'See ADR-008.',
        );
      }
      return;
    }

    if (hasDefaultValue) return;

    const store = storageType === 'sessionStorage' ? window.sessionStorage : window.localStorage;
    try {
      const stored = store.getItem(storageKey);
      if (stored !== null) {
        dispatch({ type: 'content/setMarkdown', markdown: stored, source: 'storage' });
      }
    } catch {
      // Storage access may throw in some restricted environments
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // intentionally runs only on mount

  // Write-through: debounced on markdown change
  useEffect(() => {
    if (!enabled) return;
    if (typeof window === 'undefined') return;
    if (storageDisabledRef.current) return;

    const store = storageType === 'sessionStorage' ? window.sessionStorage : window.localStorage;

    const debouncedWrite = debounce(() => {
      if (storageDisabledRef.current) return;
      try {
        dispatch({ type: 'storage/saving' });
        store.setItem(storageKey, markdown);
        dispatch({ type: 'storage/saved', at: Date.now() });
      } catch (error) {
        const isQuotaError =
          error instanceof DOMException &&
          (error.name === 'QuotaExceededError' || error.name === 'NS_ERROR_DOM_QUOTA_REACHED');
        if (isQuotaError) {
          storageDisabledRef.current = true;
          const err = error as Error;
          dispatch({ type: 'storage/error', error: err });
          onError?.(err);
        }
      }
    }, autoSaveInterval);

    debouncedWrite();

    return () => {
      debouncedWrite.cancel();
    };
  }, [markdown, enabled, storageType, storageKey, autoSaveInterval, dispatch, onError]);
}
