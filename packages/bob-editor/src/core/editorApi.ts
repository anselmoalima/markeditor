import type { RefObject, Dispatch } from 'react';
import type { editor as MonacoEditor } from 'monaco-editor';
import type { Action, BobEditorState } from './state/types.js';
import type { EditorAPI } from '../types.js';

export interface RecursionGuard {
  enter(): void;
  exit(): void;
  depth(): number;
}

export function createRecursionGuard(): RecursionGuard {
  let _depth = 0;
  return {
    enter() {
      _depth++;
    },
    exit() {
      _depth--;
    },
    depth() {
      return _depth;
    },
  };
}

export function createEditorApi(
  dispatch: Dispatch<Action>,
  getState: () => BobEditorState,
  editorRef: RefObject<MonacoEditor.IStandaloneCodeEditor | null>,
  recursionGuard?: RecursionGuard,
): EditorAPI {
  const guard = recursionGuard ?? createRecursionGuard();

  function warnIfRecursing(method: string): boolean {
    if (guard.depth() > 2) {
      if (process.env['NODE_ENV'] !== 'production') {
        console.warn(
          `[bob-editor] Plugin onChange recursion detected (depth=${guard.depth()}) in EditorAPI.${method}. ` +
            'Mutation skipped to prevent infinite loop.',
        );
      }
      return true;
    }
    return false;
  }

  return {
    getValue(): string {
      return getState().markdown;
    },

    setValue(value: string): void {
      if (warnIfRecursing('setValue')) return;
      dispatch({ type: 'content/setMarkdown', markdown: value, source: 'api' });
    },

    getSelection(): { start: number; end: number; text: string } {
      const { selection, markdown } = getState();
      return {
        start: selection.start,
        end: selection.end,
        text: markdown.slice(selection.start, selection.end),
      };
    },

    getCursorPosition(): number {
      return getState().cursor;
    },

    insertText(text: string, position?: number): void {
      if (warnIfRecursing('insertText')) return;
      const editor = editorRef.current;
      if (editor) {
        const model = editor.getModel();
        const pos =
          position != null
            ? (model?.getPositionAt(position) ?? editor.getPosition())
            : editor.getPosition();
        if (pos) {
          editor.executeEdits('bob-editor', [
            {
              range: {
                startLineNumber: pos.lineNumber,
                startColumn: pos.column,
                endLineNumber: pos.lineNumber,
                endColumn: pos.column,
              },
              text,
              forceMoveMarkers: true,
            },
          ]);
        }
      } else {
        const { markdown, cursor } = getState();
        const idx = position ?? cursor;
        const next = markdown.slice(0, idx) + text + markdown.slice(idx);
        dispatch({ type: 'content/setMarkdown', markdown: next, source: 'api' });
      }
    },

    replaceSelection(text: string): void {
      if (warnIfRecursing('replaceSelection')) return;
      const editor = editorRef.current;
      if (editor) {
        const sel = editor.getSelection();
        if (sel) {
          editor.executeEdits('bob-editor', [{ range: sel, text, forceMoveMarkers: true }]);
        }
      } else {
        const { markdown, selection } = getState();
        const next = markdown.slice(0, selection.start) + text + markdown.slice(selection.end);
        dispatch({ type: 'content/setMarkdown', markdown: next, source: 'api' });
      }
    },

    wrapSelection(before: string, after: string): void {
      if (warnIfRecursing('wrapSelection')) return;
      const editor = editorRef.current;
      if (editor) {
        const sel = editor.getSelection();
        if (sel) {
          const selected = editor.getModel()?.getValueInRange(sel) ?? '';
          editor.executeEdits('bob-editor', [
            { range: sel, text: before + selected + after, forceMoveMarkers: true },
          ]);
        }
      } else {
        const { markdown, selection } = getState();
        const selected = markdown.slice(selection.start, selection.end);
        const next =
          markdown.slice(0, selection.start) +
          before +
          selected +
          after +
          markdown.slice(selection.end);
        dispatch({ type: 'content/setMarkdown', markdown: next, source: 'api' });
      }
    },

    getMode() {
      return getState().mode;
    },

    setMode(mode) {
      dispatch({ type: 'mode/set', mode });
    },

    focus(): void {
      editorRef.current?.focus();
    },

    blur(): void {
      const domNode = editorRef.current?.getDomNode();
      if (domNode) {
        (domNode as HTMLElement).blur();
      }
    },

    showNotification(_message, _type) {
      // Implemented in task_08 (Toolbar + modals)
    },
  };
}
