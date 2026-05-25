import { expectTypeOf, describe, it } from 'vitest';
import type { BobEditorRef, EditorAPI, EditorMode } from '../../src/types.js';

describe('BobEditorRef', () => {
  it('getValue() returns string', () => {
    expectTypeOf<BobEditorRef['getValue']>().returns.toEqualTypeOf<string>();
  });

  it('setValue(value: string) returns void', () => {
    expectTypeOf<BobEditorRef['setValue']>().parameters.toEqualTypeOf<[string]>();
    expectTypeOf<BobEditorRef['setValue']>().returns.toEqualTypeOf<void>();
  });

  it('focus() returns void', () => {
    expectTypeOf<BobEditorRef['focus']>().returns.toEqualTypeOf<void>();
  });

  it('blur() returns void', () => {
    expectTypeOf<BobEditorRef['blur']>().returns.toEqualTypeOf<void>();
  });

  it('getMode() returns EditorMode', () => {
    expectTypeOf<BobEditorRef['getMode']>().returns.toEqualTypeOf<EditorMode>();
  });

  it('setMode(mode: EditorMode) returns void', () => {
    expectTypeOf<BobEditorRef['setMode']>().parameters.toEqualTypeOf<[EditorMode]>();
    expectTypeOf<BobEditorRef['setMode']>().returns.toEqualTypeOf<void>();
  });

  it('getSelection() returns start/end/text shape', () => {
    expectTypeOf<BobEditorRef['getSelection']>().returns.toEqualTypeOf<{
      start: number;
      end: number;
      text: string;
    }>();
  });

  it('insertText accepts text and optional opts', () => {
    expectTypeOf<BobEditorRef['insertText']>().parameters.toEqualTypeOf<
      [string, ({ atCursor?: boolean; position?: number } | undefined)?]
    >();
  });

  it('exportAsHtml() returns Promise<string>', () => {
    expectTypeOf<BobEditorRef['exportAsHtml']>().returns.toEqualTypeOf<Promise<string>>();
  });

  it('exportAsMarkdown() returns string', () => {
    expectTypeOf<BobEditorRef['exportAsMarkdown']>().returns.toEqualTypeOf<string>();
  });
});

describe('EditorAPI', () => {
  it('getValue() returns string', () => {
    expectTypeOf<EditorAPI['getValue']>().returns.toEqualTypeOf<string>();
  });

  it('setValue(value: string) returns void', () => {
    expectTypeOf<EditorAPI['setValue']>().parameters.toEqualTypeOf<[string]>();
    expectTypeOf<EditorAPI['setValue']>().returns.toEqualTypeOf<void>();
  });

  it('getSelection() returns start/end/text shape', () => {
    expectTypeOf<EditorAPI['getSelection']>().returns.toEqualTypeOf<{
      start: number;
      end: number;
      text: string;
    }>();
  });

  it('getCursorPosition() returns number', () => {
    expectTypeOf<EditorAPI['getCursorPosition']>().returns.toEqualTypeOf<number>();
  });

  it('insertText(text, position?) returns void', () => {
    expectTypeOf<EditorAPI['insertText']>().parameters.toEqualTypeOf<
      [string, (number | undefined)?]
    >();
    expectTypeOf<EditorAPI['insertText']>().returns.toEqualTypeOf<void>();
  });

  it('replaceSelection(text) returns void', () => {
    expectTypeOf<EditorAPI['replaceSelection']>().parameters.toEqualTypeOf<[string]>();
    expectTypeOf<EditorAPI['replaceSelection']>().returns.toEqualTypeOf<void>();
  });

  it('wrapSelection(before, after) exists with correct signature', () => {
    expectTypeOf<EditorAPI['wrapSelection']>().parameters.toEqualTypeOf<[string, string]>();
    expectTypeOf<EditorAPI['wrapSelection']>().returns.toEqualTypeOf<void>();
  });

  it('getMode() returns EditorMode', () => {
    expectTypeOf<EditorAPI['getMode']>().returns.toEqualTypeOf<EditorMode>();
  });

  it('setMode(mode: EditorMode) returns void', () => {
    expectTypeOf<EditorAPI['setMode']>().parameters.toEqualTypeOf<[EditorMode]>();
    expectTypeOf<EditorAPI['setMode']>().returns.toEqualTypeOf<void>();
  });

  it('focus() returns void', () => {
    expectTypeOf<EditorAPI['focus']>().returns.toEqualTypeOf<void>();
  });

  it('blur() returns void', () => {
    expectTypeOf<EditorAPI['blur']>().returns.toEqualTypeOf<void>();
  });

  it('showNotification(message, type?) returns void', () => {
    expectTypeOf<EditorAPI['showNotification']>().returns.toEqualTypeOf<void>();
  });

  it('EditorAPI is separate from BobEditorRef — insertText signatures differ', () => {
    type RefInsertText = BobEditorRef['insertText'];
    type ApiInsertText = EditorAPI['insertText'];
    expectTypeOf<RefInsertText>().not.toEqualTypeOf<ApiInsertText>();
  });
});
