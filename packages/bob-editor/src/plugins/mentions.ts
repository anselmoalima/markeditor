/* eslint-disable @typescript-eslint/no-explicit-any */
import { visit } from 'unist-util-visit';
import type { BobEditorPlugin } from '../types.js';

export interface MentionResolution {
  url: string;
  displayName: string;
}

export type ResolveMention = (username: string) => MentionResolution;

const MENTION_RE = /@([a-zA-Z0-9_-]+)/g;

function createMentionsRemarkPlugin(resolveMention: ResolveMention) {
  return function () {
    return function (tree: any) {
      visit(tree, 'text', function (node: any, index: number | undefined, parent: any) {
        if (index === undefined || !parent) return;
        if (!node.value.includes('@')) return;

        const parts: any[] = [];
        let last = 0;
        let replaced = false;
        const re = new RegExp('@([a-zA-Z0-9_-]+)', 'g');
        let match: RegExpExecArray | null;

        while ((match = re.exec(node.value)) !== null) {
          const username = match[1]!;
          const resolved = resolveMention(username);

          replaced = true;
          if (match.index > last) {
            parts.push({ type: 'text', value: node.value.slice(last, match.index) });
          }
          parts.push({
            type: 'link',
            url: resolved.url,
            data: {
              hProperties: { className: ['bobmd-mention'] },
            },
            children: [{ type: 'text', value: `@${resolved.displayName}` }],
          });
          last = match.index + match[0].length;
        }

        if (!replaced) return;

        if (last < node.value.length) {
          parts.push({ type: 'text', value: node.value.slice(last) });
        }

        parent.children.splice(index, 1, ...parts);
      });
    };
  };
}

export function createMentionsPlugin(options: { resolveMention: ResolveMention }): BobEditorPlugin {
  return {
    name: 'mentions',
    version: '1.0.0',
    remarkPlugins: [createMentionsRemarkPlugin(options.resolveMention)],
    sanitizeSchema: {
      attributes: {
        // Allow className on <a> so the bobmd-mention class survives sanitization
        a: ['className'],
      },
    },
  };
}

// Legacy stub export — prefer createMentionsPlugin factory
export const mentionsPlugin: BobEditorPlugin = {
  name: 'mentions',
  version: '1.0.0',
};

export { MENTION_RE };
