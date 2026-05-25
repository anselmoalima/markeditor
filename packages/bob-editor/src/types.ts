// Public type surface — stub for task_02; fully populated in task_03.

export type EditorMode = 'edit' | 'preview';

export interface BobEditorProps {
  value?: string;
  defaultValue?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  readOnly?: boolean;
  mode?: EditorMode;
  defaultMode?: EditorMode;
}

export interface BobEditorRef {
  getValue(): string;
  setValue(value: string): void;
  focus(): void;
  getMode(): EditorMode;
  setMode(mode: EditorMode): void;
}

export interface EditorAPI {
  getValue(): string;
  setValue(value: string): void;
  getMode(): EditorMode;
  setMode(mode: EditorMode): void;
  focus(): void;
  blur(): void;
}

export interface BobEditorPlugin {
  name: string;
  version?: string;
  onMount?: (api: EditorAPI) => void | (() => void);
  onChange?: (value: string, api: EditorAPI) => void;
}
