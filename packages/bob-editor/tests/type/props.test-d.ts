import { expectTypeOf, describe, it } from 'vitest';
import type {
  BobEditorProps,
  EditorMode,
  BobEditorPlugin,
  ToolbarConfig,
  KeyboardShortcut,
  StorageConfig,
  ExportConfig,
  BobmdTheme,
  ThemePreset,
  I18nMessages,
  EditorAPI,
} from '../../src/types.js';

describe('BobEditorProps', () => {
  it('all props are optional — empty object assignable', () => {
    const p: BobEditorProps = {};
    expectTypeOf(p).toMatchTypeOf<BobEditorProps>();
  });

  it('value is string | undefined', () => {
    expectTypeOf<BobEditorProps['value']>().toEqualTypeOf<string | undefined>();
  });

  it('defaultValue is string | undefined', () => {
    expectTypeOf<BobEditorProps['defaultValue']>().toEqualTypeOf<string | undefined>();
  });

  it('onChange is ((value: string) => void) | undefined', () => {
    expectTypeOf<BobEditorProps['onChange']>().toEqualTypeOf<
      ((value: string) => void) | undefined
    >();
  });

  it('placeholder is string | undefined', () => {
    expectTypeOf<BobEditorProps['placeholder']>().toEqualTypeOf<string | undefined>();
  });

  it('readOnly is boolean | undefined', () => {
    expectTypeOf<BobEditorProps['readOnly']>().toEqualTypeOf<boolean | undefined>();
  });

  it('mode is EditorMode | undefined', () => {
    expectTypeOf<BobEditorProps['mode']>().toEqualTypeOf<EditorMode | undefined>();
  });

  it('defaultMode is EditorMode | undefined', () => {
    expectTypeOf<BobEditorProps['defaultMode']>().toEqualTypeOf<EditorMode | undefined>();
  });

  it('onModeChange accepts (mode: EditorMode) => void', () => {
    expectTypeOf<BobEditorProps['onModeChange']>().toEqualTypeOf<
      ((mode: EditorMode) => void) | undefined
    >();
  });

  it('allowedModes is readonly EditorMode[] | undefined', () => {
    expectTypeOf<BobEditorProps['allowedModes']>().toEqualTypeOf<
      readonly EditorMode[] | undefined
    >();
  });

  it('toolbar is boolean | ToolbarConfig | undefined', () => {
    expectTypeOf<BobEditorProps['toolbar']>().toEqualTypeOf<boolean | ToolbarConfig | undefined>();
  });

  it('plugins is readonly BobEditorPlugin[] | undefined', () => {
    expectTypeOf<BobEditorProps['plugins']>().toEqualTypeOf<
      readonly BobEditorPlugin[] | undefined
    >();
  });

  it('shortcuts has override and disable fields', () => {
    expectTypeOf<BobEditorProps['shortcuts']>().toEqualTypeOf<
      { override?: KeyboardShortcut[]; disable?: string[] } | undefined
    >();
  });

  it('storage is StorageConfig | undefined', () => {
    expectTypeOf<BobEditorProps['storage']>().toEqualTypeOf<StorageConfig | undefined>();
  });

  it('enableExport is boolean | ExportConfig | undefined', () => {
    expectTypeOf<BobEditorProps['enableExport']>().toEqualTypeOf<
      boolean | ExportConfig | undefined
    >();
  });

  it('theme is ThemePreset | BobmdTheme | undefined', () => {
    expectTypeOf<BobEditorProps['theme']>().toEqualTypeOf<ThemePreset | BobmdTheme | undefined>();
  });

  it('i18n is Partial<I18nMessages> | undefined', () => {
    expectTypeOf<BobEditorProps['i18n']>().toEqualTypeOf<Partial<I18nMessages> | undefined>();
  });

  it('onImageUpload returns Promise with url and optional alt', () => {
    expectTypeOf<BobEditorProps['onImageUpload']>().toEqualTypeOf<
      ((file: File) => Promise<{ url: string; alt?: string }>) | undefined
    >();
  });

  it('previewDebounceMs is number | undefined', () => {
    expectTypeOf<BobEditorProps['previewDebounceMs']>().toEqualTypeOf<number | undefined>();
  });

  it('onMount accepts (api: EditorAPI) => void', () => {
    expectTypeOf<BobEditorProps['onMount']>().toEqualTypeOf<
      ((api: EditorAPI) => void) | undefined
    >();
  });

  it('onError accepts (error: Error) => void', () => {
    expectTypeOf<BobEditorProps['onError']>().toEqualTypeOf<((error: Error) => void) | undefined>();
  });
});
