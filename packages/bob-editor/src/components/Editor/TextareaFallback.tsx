import type { ChangeEventHandler, KeyboardEventHandler } from 'react';

export interface TextareaFallbackProps {
  markdown: string;
  placeholder?: string;
  readOnly?: boolean;
  onChange: (value: string) => void;
  onSelectionChange?: (selection: { start: number; end: number; cursor: number }) => void;
}

export function TextareaFallback({
  markdown,
  placeholder,
  readOnly,
  onChange,
  onSelectionChange,
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
      />
    </div>
  );
}
