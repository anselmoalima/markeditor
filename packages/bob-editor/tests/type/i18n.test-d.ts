import { expectTypeOf } from 'vitest';
import type { I18nMessages } from '../../src/types.js';
import { ptBR } from '../../src/i18n/pt-BR.js';
import { en } from '../../src/i18n/en.js';

type EnKeys = keyof typeof en;

// pt-BR is assignable to I18nMessages
expectTypeOf(ptBR).toMatchTypeOf<I18nMessages>();

// pt-BR covers all en keys
expectTypeOf(ptBR).toMatchTypeOf<Record<EnKeys, string>>();
