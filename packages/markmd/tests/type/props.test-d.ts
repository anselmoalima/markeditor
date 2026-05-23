import { expectTypeOf } from 'expect-type';
import type { MarkmdEditorProps, MarkmdEditorRef, MarkmdMode } from '../../src/types';

expectTypeOf<MarkmdMode>().toEqualTypeOf<'edit' | 'preview'>();

expectTypeOf<MarkmdEditorProps>().toMatchTypeOf<{
  value?: string;
  mode?: 'edit' | 'preview';
}>();

expectTypeOf<MarkmdEditorRef['getValue']>().toEqualTypeOf<() => string>();
expectTypeOf<MarkmdEditorRef['setValue']>().toEqualTypeOf<(next: string) => void>();
expectTypeOf<MarkmdEditorRef['focus']>().toEqualTypeOf<() => void>();
