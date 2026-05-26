import { useEffect } from 'react';
import type React from 'react';
import Editor from '@monaco-editor/react';
import type { editor as MonacoEditorNS } from 'monaco-editor';

export interface MonacoEditorProps {
  markdown: string;
  placeholder?: string;
  readOnly?: boolean;
  editorOptions?: Partial<MonacoEditorNS.IEditorOptions>;
  editorRef: React.MutableRefObject<MonacoEditorNS.IStandaloneCodeEditor | null>;
  onChange: (value: string) => void;
  onSelectionChange?: (selection: { start: number; end: number; cursor: number }) => void;
}

export default function MonacoEditor({
  markdown,
  placeholder,
  readOnly,
  editorOptions,
  editorRef,
  onChange,
  onSelectionChange,
}: MonacoEditorProps): JSX.Element {
  useEffect(() => {
    const editor = editorRef.current;
    if (!editor) return;
    if (editor.getValue() !== markdown) {
      editor.setValue(markdown);
    }
  }, [editorRef, markdown]);

  return (
    <div className="bobmd-editor-panel" data-testid="bobmd-editor-panel">
      <Editor
        height="320px"
        defaultLanguage="markdown"
        value={markdown}
        onChange={(value) => onChange(value ?? '')}
        onMount={(editor) => {
          editorRef.current = editor;
          if (editor.getValue() !== markdown) {
            editor.setValue(markdown);
          }

          const selectDisposable = editor.onDidChangeCursorSelection(() => {
            const selection = editor.getSelection();
            if (!selection) return;
            const model = editor.getModel();
            if (!model) return;
            const start = model.getOffsetAt(selection.getStartPosition());
            const end = model.getOffsetAt(selection.getEndPosition());
            onSelectionChange?.({ start, end, cursor: end });
          });

          const contentDisposable = editor.onDidChangeModelContent(() => {
            onChange(editor.getValue());
          });

          const originalDispose = editor.dispose.bind(editor);
          editor.dispose = () => {
            selectDisposable.dispose();
            contentDisposable.dispose();
            originalDispose();
          };
        }}
        {...(readOnly !== undefined
          ? { options: { ...(editorOptions ?? {}), readOnly } }
          : editorOptions
            ? { options: editorOptions }
            : {})}
      />
      {placeholder ? (
        <span className="bobmd-visually-hidden" aria-hidden>
          {placeholder}
        </span>
      ) : null}
    </div>
  );
}
