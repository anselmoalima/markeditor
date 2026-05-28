import type { ChangeEventHandler, ClipboardEventHandler, KeyboardEventHandler } from 'react';

export interface TextareaFallbackProps {
  markdown: string;
  placeholder?: string;
  readOnly?: boolean;
  onChange: (value: string) => void;
  onSelectionChange?: (selection: { start: number; end: number; cursor: number }) => void;
  onPasteFile?: (file: File) => void;
}

export function TextareaFallback({
  markdown,
  placeholder,
  readOnly,
  onChange,
  onSelectionChange,
  onPasteFile,
}: TextareaFallbackProps): JSX.Element {
  const handleChange: ChangeEventHandler<HTMLTextAreaElement> = (event) => {
    onChange(event.currentTarget.value);
  };

  const publishSelection = (target: HTMLTextAreaElement) => {
    const start = target.selectionStart ?? 0;
    const end = target.selectionEnd ?? start;
    onSelectionChange?.({ start, end, cursor: end });
  };

  const handleSelection: ChangeEventHandler<HTMLTextAreaElement> = (event) => {
    publishSelection(event.currentTarget);
  };

  const handleKeyUp: KeyboardEventHandler<HTMLTextAreaElement> = (event) => {
    const start = event.currentTarget.selectionStart ?? 0;
    const end = event.currentTarget.selectionEnd ?? start;
    onSelectionChange?.({ start, end, cursor: end });
  };

  const handlePaste: ClipboardEventHandler<HTMLTextAreaElement> = (event) => {
    if (!onPasteFile) return;
    const file = event.clipboardData?.files?.[0];
    if (file && file.type.startsWith('image/')) {
      event.preventDefault();
      onPasteFile(file);
    }
  };

  return (
    <div className="bobmd-editor-panel" data-testid="bobmd-editor-panel">
      <textarea
        className="bobmd-textarea"
        data-testid="bobmd-textarea"
        aria-label="Markdown editor"
        placeholder={placeholder}
        readOnly={readOnly}
        value={markdown}
        onChange={handleChange}
        onSelect={handleSelection}
        onKeyUp={handleKeyUp}
        onPaste={onPasteFile ? handlePaste : undefined}
      />
    </div>
  );
}
