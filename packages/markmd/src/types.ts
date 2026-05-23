import type { CSSProperties, ReactNode } from 'react';

export type MarkmdMode = 'edit' | 'preview';

export interface MarkmdEditorProps {
  value?: string;
  defaultValue?: string;
  onChange?: (value: string) => void;
  mode?: MarkmdMode;
  defaultMode?: MarkmdMode;
  onModeChange?: (mode: MarkmdMode) => void;
  height?: number | string;
  className?: string;
  style?: CSSProperties;
  children?: ReactNode;
}

export interface MarkmdEditorRef {
  getValue(): string;
  setValue(next: string): void;
  focus(): void;
}
