import type { CSSProperties, ReactNode } from 'react';

export type MarkMode = 'edit' | 'preview';

export interface MarkEditorProps {
  value?: string;
  defaultValue?: string;
  onChange?: (value: string) => void;
  mode?: MarkMode;
  defaultMode?: MarkMode;
  onModeChange?: (mode: MarkMode) => void;
  height?: number | string;
  className?: string;
  style?: CSSProperties;
  children?: ReactNode;
}

export interface MarkEditorRef {
  getValue(): string;
  setValue(next: string): void;
  focus(): void;
}
