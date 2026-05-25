import type { BobEditorState, Action } from './types.js';

export const initialState: BobEditorState = {
  markdown: '',
  mode: 'edit',
  selection: { start: 0, end: 0 },
  cursor: 0,
  savedAt: null,
  storageStatus: 'idle',
  storageDisabled: false,
  pipeline: { status: 'idle' },
};

export function reducer(state: BobEditorState, action: Action): BobEditorState {
  switch (action.type) {
    case 'content/setMarkdown':
      return { ...state, markdown: action.markdown };

    case 'mode/set':
      return { ...state, mode: action.mode };

    case 'selection/set':
      return {
        ...state,
        selection: { start: action.start, end: action.end },
        cursor: action.cursor,
      };

    case 'storage/saving':
      return { ...state, storageStatus: 'saving' };

    case 'storage/saved':
      return { ...state, storageStatus: 'saved', savedAt: action.at };

    case 'storage/error':
      return { ...state, storageStatus: 'error', storageDisabled: true };

    case 'pipeline/pending':
      return { ...state, pipeline: { status: 'pending' } };

    case 'pipeline/ready':
      return { ...state, pipeline: { status: 'ready' } };

    case 'pipeline/error':
      return { ...state, pipeline: { status: 'error', error: action.error } };

    default:
      return state;
  }
}
