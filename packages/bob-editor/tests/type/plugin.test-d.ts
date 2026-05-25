import { expectTypeOf, describe, it } from 'vitest';
import type {
  BobEditorPlugin,
  KeyboardShortcut,
  ToolbarButton,
  ToolbarConfig,
  EditorAPI,
  EditorMode,
  HastRoot,
  SchemaExtension,
} from '../../src/types.js';

describe('EditorMode', () => {
  it('is "edit" | "preview" union — not a broader string', () => {
    expectTypeOf<EditorMode>().toEqualTypeOf<'edit' | 'preview'>();
  });

  it('does not accept arbitrary strings', () => {
    expectTypeOf<'other'>().not.toMatchTypeOf<EditorMode>();
  });
});

describe('BobEditorPlugin', () => {
  it('name is required string', () => {
    expectTypeOf<BobEditorPlugin['name']>().toEqualTypeOf<string>();
    // @ts-expect-error — name is required
    const _bad: BobEditorPlugin = {};
    void _bad;
  });

  it('version is optional string', () => {
    expectTypeOf<BobEditorPlugin['version']>().toEqualTypeOf<string | undefined>();
  });

  it('onMount is optional and accepts (api: EditorAPI) => void | (() => void)', () => {
    expectTypeOf<BobEditorPlugin['onMount']>().toEqualTypeOf<
      ((api: EditorAPI) => void | (() => void)) | undefined
    >();
  });

  it('onChange is optional and accepts (value: string, api: EditorAPI) => void', () => {
    expectTypeOf<BobEditorPlugin['onChange']>().toEqualTypeOf<
      ((value: string, api: EditorAPI) => void) | undefined
    >();
  });

  it('onBeforeParse accepts markdown string and returns string', () => {
    expectTypeOf<BobEditorPlugin['onBeforeParse']>().toEqualTypeOf<
      ((markdown: string) => string) | undefined
    >();
  });

  it('onAfterRender accepts and returns HastRoot', () => {
    expectTypeOf<BobEditorPlugin['onAfterRender']>().toEqualTypeOf<
      ((root: HastRoot) => HastRoot | void) | undefined
    >();
  });

  it('sanitizeSchema is SchemaExtension | undefined', () => {
    expectTypeOf<BobEditorPlugin['sanitizeSchema']>().toEqualTypeOf<SchemaExtension | undefined>();
  });

  it('toolbarButtons is ToolbarButton[] | undefined', () => {
    expectTypeOf<BobEditorPlugin['toolbarButtons']>().toEqualTypeOf<ToolbarButton[] | undefined>();
  });

  it('shortcuts is KeyboardShortcut[] | undefined', () => {
    expectTypeOf<BobEditorPlugin['shortcuts']>().toEqualTypeOf<KeyboardShortcut[] | undefined>();
  });

  it('minimal valid plugin — only name required', () => {
    const plugin: BobEditorPlugin = { name: 'my-plugin' };
    expectTypeOf(plugin).toMatchTypeOf<BobEditorPlugin>();
  });
});

describe('KeyboardShortcut', () => {
  it('id is required string', () => {
    expectTypeOf<KeyboardShortcut['id']>().toEqualTypeOf<string>();
  });

  it('keys is required string', () => {
    expectTypeOf<KeyboardShortcut['keys']>().toEqualTypeOf<string>();
  });

  it('action is required and accepts EditorAPI', () => {
    expectTypeOf<KeyboardShortcut['action']>().parameters.toEqualTypeOf<[EditorAPI]>();
    expectTypeOf<KeyboardShortcut['action']>().returns.toEqualTypeOf<void>();
  });

  it('label is optional string', () => {
    expectTypeOf<KeyboardShortcut['label']>().toEqualTypeOf<string | undefined>();
  });

  it('description is optional string', () => {
    expectTypeOf<KeyboardShortcut['description']>().toEqualTypeOf<string | undefined>();
  });

  it('minimal valid shortcut — id, keys, action required', () => {
    const shortcut: KeyboardShortcut = {
      id: 'bold',
      keys: 'Mod+B',
      action: (_api) => {},
    };
    expectTypeOf(shortcut).toMatchTypeOf<KeyboardShortcut>();
  });
});

describe('ToolbarButton', () => {
  it('id is required string', () => {
    expectTypeOf<ToolbarButton['id']>().toEqualTypeOf<string>();
  });

  it('action is required and accepts EditorAPI', () => {
    expectTypeOf<ToolbarButton['action']>().parameters.toEqualTypeOf<[EditorAPI]>();
    expectTypeOf<ToolbarButton['action']>().returns.toEqualTypeOf<void>();
  });

  it('isActive is optional predicate', () => {
    expectTypeOf<ToolbarButton['isActive']>().toEqualTypeOf<
      ((api: EditorAPI) => boolean) | undefined
    >();
  });

  it('isDisabled is optional predicate', () => {
    expectTypeOf<ToolbarButton['isDisabled']>().toEqualTypeOf<
      ((api: EditorAPI) => boolean) | undefined
    >();
  });
});

describe('ToolbarConfig', () => {
  it('items is optional array of ToolbarButton | string', () => {
    expectTypeOf<ToolbarConfig['items']>().toEqualTypeOf<
      Array<ToolbarButton | string> | undefined
    >();
  });

  it('sticky is boolean | undefined', () => {
    expectTypeOf<ToolbarConfig['sticky']>().toEqualTypeOf<boolean | undefined>();
  });

  it('overflow is boolean | undefined', () => {
    expectTypeOf<ToolbarConfig['overflow']>().toEqualTypeOf<boolean | undefined>();
  });
});
