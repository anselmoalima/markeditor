import { Suspense, lazy, useEffect, useState } from 'react';
import type React from 'react';
import type { editor as MonacoEditorNS } from 'monaco-editor';
import { TextareaFallback } from './TextareaFallback.js';

const LazyMonacoEditor = lazy(() => import('./MonacoEditor.js'));

export interface EditorProps {
  markdown: string;
  placeholder?: string;
  readOnly?: boolean;
  editorOptions?: Partial<MonacoEditorNS.IEditorOptions>;
  editorRef: React.MutableRefObject<MonacoEditorNS.IStandaloneCodeEditor | null>;
  onChange: (value: string, source: 'monaco') => void;
  onSelectionChange?: (selection: { start: number; end: number; cursor: number }) => void;
  onPasteFile?: (file: File) => void;
}

export function Editor({
  markdown,
  placeholder,
  readOnly,
  editorOptions,
  editorRef,
  onChange,
  onSelectionChange,
  onPasteFile,
}: EditorProps): JSX.Element {
  const isClient = typeof window !== 'undefined';
  const [shouldLoadMonaco, setShouldLoadMonaco] = useState(false);

  useEffect(() => {
    if (isClient) {
      setShouldLoadMonaco(true);
    }
  }, [isClient]);

  const fallback = (
    <TextareaFallback
      markdown={markdown}
      onChange={(value) => onChange(value, 'monaco')}
      {...(placeholder !== undefined ? { placeholder } : {})}
      {...(readOnly !== undefined ? { readOnly } : {})}
      {...(onSelectionChange ? { onSelectionChange } : {})}
      {...(onPasteFile ? { onPasteFile } : {})}
    />
  );

  if (!isClient || !shouldLoadMonaco) {
    return fallback;
  }

  return (
    <Suspense fallback={fallback}>
      <LazyMonacoEditor
        markdown={markdown}
        editorRef={editorRef}
        onChange={(value) => onChange(value, 'monaco')}
        {...(placeholder !== undefined ? { placeholder } : {})}
        {...(readOnly !== undefined ? { readOnly } : {})}
        {...(editorOptions ? { editorOptions } : {})}
        {...(onSelectionChange ? { onSelectionChange } : {})}
        {...(onPasteFile ? { onPasteFile } : {})}
      />
    </Suspense>
  );
}
