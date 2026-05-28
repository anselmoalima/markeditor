import type { BobEditorPlugin } from '../types.js';

export const wordCountPlugin: BobEditorPlugin = {
  name: 'wordCount',
  version: '1.0.0',
  onChange(value, api) {
    const trimmed = value.trim();
    const words = trimmed === '' ? 0 : trimmed.split(/\s+/).length;
    const chars = value.length;
    api.showNotification(`Words: ${words} | Chars: ${chars}`, 'info');
  },
};
