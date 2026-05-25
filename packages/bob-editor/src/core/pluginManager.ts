import type { Options as Schema } from 'rehype-sanitize';
import type { BobEditorPlugin, EditorAPI, HastRoot } from '../types.js';
import { getCoreSchema } from './sanitize/schema.js';
import { mergeSanitizeSchema } from './sanitize/merge.js';

export interface PluginManager {
  register(plugins: readonly BobEditorPlugin[], api: EditorAPI): BobEditorPlugin[];
  invokeOnMount(plugins: readonly BobEditorPlugin[], api: EditorAPI): (() => void)[];
  invokeCleanup(cleanups: (() => void)[]): void;
  invokeOnChange(plugins: readonly BobEditorPlugin[], value: string, api: EditorAPI): void;
  invokeOnBeforeParse(plugins: readonly BobEditorPlugin[], markdown: string): string;
  invokeOnAfterRender(plugins: readonly BobEditorPlugin[], hast: HastRoot): HastRoot;
  getActiveSchema(): Schema;
}

export function createPluginManager(): PluginManager {
  let activeSchema: Schema = getCoreSchema();
  let recursionDepth = 0;

  return {
    register(plugins, _api) {
      activeSchema = getCoreSchema();

      const seenButtonIds = new Map<string, string>();

      for (const plugin of plugins) {
        if (plugin.toolbarButtons) {
          for (const btn of plugin.toolbarButtons) {
            const existing = seenButtonIds.get(btn.id);
            if (existing !== undefined) {
              throw new Error(
                `[bob-editor] Conflicting toolbar button id "${btn.id}" declared by plugins ` +
                  `"${existing}" and "${plugin.name}". Each toolbar button must have a unique id.`,
              );
            }
            seenButtonIds.set(btn.id, plugin.name);
          }
        }

        if (plugin.sanitizeSchema) {
          activeSchema = mergeSanitizeSchema(activeSchema, plugin.sanitizeSchema);
        }
      }

      return [...plugins];
    },

    invokeOnMount(plugins, api) {
      const cleanups: (() => void)[] = [];
      for (const plugin of plugins) {
        if (plugin.onMount) {
          const result = plugin.onMount(api);
          if (typeof result === 'function') {
            cleanups.push(result);
          }
        }
      }
      return cleanups;
    },

    invokeCleanup(cleanups) {
      for (let i = cleanups.length - 1; i >= 0; i--) {
        cleanups[i]!();
      }
    },

    invokeOnChange(plugins, value, api) {
      recursionDepth++;
      try {
        if (recursionDepth > 2) {
          if (process.env['NODE_ENV'] !== 'production') {
            console.warn(
              `[bob-editor] Plugin onChange recursion detected (depth=${recursionDepth}). ` +
                'Skipping to prevent infinite loop.',
            );
          }
          return;
        }
        for (const plugin of plugins) {
          plugin.onChange?.(value, api);
        }
      } finally {
        recursionDepth--;
      }
    },

    invokeOnBeforeParse(plugins, markdown) {
      let result = markdown;
      for (const plugin of plugins) {
        if (plugin.onBeforeParse) {
          result = plugin.onBeforeParse(result);
        }
      }
      return result;
    },

    invokeOnAfterRender(plugins, hast) {
      let result: HastRoot = hast;
      for (const plugin of plugins) {
        if (plugin.onAfterRender) {
          const next = plugin.onAfterRender(result);
          if (next !== undefined) {
            result = next;
          }
        }
      }
      return result;
    },

    getActiveSchema() {
      return activeSchema;
    },
  };
}
