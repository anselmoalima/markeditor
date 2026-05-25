import { createContext } from 'react';
import type { BobEditorState } from './types.js';
import type { EditorAPI } from '../../types.js';
import { initialState } from './reducer.js';

export const BobEditorStateContext = createContext<BobEditorState>(initialState);

// Stable API object — never triggers re-renders on state change.
// Consumers of this context will only re-render when the api object reference changes,
// which happens only on mount (useMemo with no deps in BobEditor).
export const BobEditorApiContext = createContext<EditorAPI | null>(null);
