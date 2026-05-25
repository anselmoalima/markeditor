import { useContext } from 'react';
import { BobEditorStateContext, BobEditorApiContext } from './contexts.js';
import type { BobEditorState } from './types.js';
import type { EditorAPI } from '../../types.js';

export function useEditorState(): BobEditorState {
  return useContext(BobEditorStateContext);
}

export function useEditorApi(): EditorAPI {
  const api = useContext(BobEditorApiContext);
  if (api === null) {
    throw new Error(
      '[bob-editor] useEditorApi must be called inside a BobEditorApiContext.Provider',
    );
  }
  return api;
}
