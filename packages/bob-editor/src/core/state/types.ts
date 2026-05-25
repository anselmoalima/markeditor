import type { EditorMode } from '../../types.js';

/** @internal */
interface BobEditorState {
  markdown: string;
  mode: EditorMode;
  selection: { start: number; end: number };
  cursor: number;
  savedAt: number | null;
  storageStatus: 'idle' | 'saving' | 'saved' | 'error';
  storageDisabled: boolean;
  pipeline: { status: 'idle' | 'pending' | 'ready' | 'error'; error?: Error };
}

/** @internal */
type Action =
  | { type: 'content/setMarkdown'; markdown: string; source: 'user' | 'monaco' | 'api' | 'storage' }
  | { type: 'mode/set'; mode: EditorMode }
  | { type: 'selection/set'; start: number; end: number; cursor: number }
  | { type: 'storage/saving' }
  | { type: 'storage/saved'; at: number }
  | { type: 'storage/error'; error: Error }
  | { type: 'pipeline/pending' }
  | { type: 'pipeline/ready' }
  | { type: 'pipeline/error'; error: Error };

export type { BobEditorState, Action };
