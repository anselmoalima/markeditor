import type { PluggableList } from 'unified';
import type { Options as Schema } from 'rehype-sanitize';
import type { editor as MonacoEditorNS } from 'monaco-editor';
import type { Root } from 'hast';
import type React from 'react';

export type { Schema };

export type EditorMode = 'edit' | 'preview';

export type ThemePreset = 'light' | 'dark' | 'auto';

export type MessageKey = string;

export type I18nMessages = Record<MessageKey, string>;

export type SchemaExtension = Partial<Schema>;

export type HastRoot = Root;

export interface BobmdTheme {
  [variable: string]: string;
}

export interface StorageConfig {
  enabled?: boolean;
  storageKey?: string;
  storage?: 'localStorage' | 'sessionStorage';
  autoSaveInterval?: number;
}

export interface ExportConfig {
  html?: boolean;
  markdown?: boolean;
  print?: boolean;
  filename?: string;
}

export interface ToolbarButton {
  id: string;
  icon?: React.ReactNode;
  label?: string;
  title?: string;
  action: (api: EditorAPI) => void;
  isActive?: (api: EditorAPI) => boolean;
  isDisabled?: (api: EditorAPI) => boolean;
  shortcutId?: string;
}

export interface ToolbarConfig {
  items?: Array<ToolbarButton | string>;
  sticky?: boolean;
  overflow?: boolean;
}

export interface KeyboardShortcut {
  id: string;
  keys: string;
  action: (api: EditorAPI) => void;
  label?: string;
  description?: string;
}

export interface EditorAPI {
  getValue(): string;
  setValue(value: string): void;
  getSelection(): { start: number; end: number; text: string };
  getCursorPosition(): number;
  insertText(text: string, position?: number): void;
  replaceSelection(text: string): void;
  wrapSelection(before: string, after: string): void;
  getMode(): EditorMode;
  setMode(mode: EditorMode): void;
  focus(): void;
  blur(): void;
  showNotification(message: string, type?: 'info' | 'error' | 'success'): void;
}

export interface BobEditorRef {
  getValue(): string;
  setValue(value: string): void;
  focus(): void;
  blur(): void;
  getMode(): EditorMode;
  setMode(mode: EditorMode): void;
  insertText(text: string, opts?: { atCursor?: boolean; position?: number }): void;
  getSelection(): { start: number; end: number; text: string };
  exportAsHtml(): Promise<string>;
  exportAsMarkdown(): string;
}

export interface BobEditorPlugin {
  name: string;
  version?: string;
  remarkPlugins?: PluggableList;
  rehypePlugins?: PluggableList;
  sanitizeSchema?: SchemaExtension;
  toolbarButtons?: ToolbarButton[];
  shortcuts?: KeyboardShortcut[];
  components?: Record<string, React.ComponentType<unknown>>;
  i18n?: Record<string, Record<string, string>>;
  onMount?: (api: EditorAPI) => void | (() => void);
  onChange?: (value: string, api: EditorAPI) => void;
  onBeforeParse?: (markdown: string) => string;
  onAfterRender?: (root: HastRoot) => HastRoot | void;
}

export interface BobEditorProps {
  value?: string;
  defaultValue?: string;
  onChange?: (value: string) => void;
  onSave?: (value: string) => void | Promise<void>;
  placeholder?: string;
  readOnly?: boolean;

  mode?: EditorMode;
  defaultMode?: EditorMode;
  onModeChange?: (mode: EditorMode) => void;
  allowedModes?: readonly EditorMode[];

  toolbar?: boolean | ToolbarConfig;
  plugins?: readonly BobEditorPlugin[];
  shortcuts?: { override?: KeyboardShortcut[]; disable?: string[] };
  components?: Readonly<Record<string, React.ComponentType<unknown>>>;
  remarkPlugins?: PluggableList;
  rehypePlugins?: PluggableList;
  sanitize?: boolean | Schema | ((merged: Schema) => Schema);

  storage?: StorageConfig;
  theme?: ThemePreset | BobmdTheme;
  locale?: string;
  i18n?: Partial<I18nMessages>;
  onImageUpload?: (file: File) => Promise<{ url: string; alt?: string }>;
  enableExport?: boolean | ExportConfig;
  previewDebounceMs?: number;
  editorOptions?: Partial<MonacoEditorNS.IEditorOptions>;
  onMount?: (api: EditorAPI) => void;
  onError?: (error: Error) => void;
}
