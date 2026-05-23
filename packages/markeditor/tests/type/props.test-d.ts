import { expectTypeOf } from 'expect-type';
import type { MarkEditorProps, MarkEditorRef, MarkMode } from '../../src/types';

expectTypeOf<MarkMode>().toEqualTypeOf<'edit' | 'preview'>();

expectTypeOf<MarkEditorProps>().toMatchTypeOf<{
  value?: string;
  mode?: 'edit' | 'preview';
}>();

expectTypeOf<MarkEditorRef['getValue']>().toEqualTypeOf<() => string>();
expectTypeOf<MarkEditorRef['setValue']>().toEqualTypeOf<(next: string) => void>();
expectTypeOf<MarkEditorRef['focus']>().toEqualTypeOf<() => void>();
