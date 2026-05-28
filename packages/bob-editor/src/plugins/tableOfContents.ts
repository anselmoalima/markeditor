/* eslint-disable @typescript-eslint/no-explicit-any */
import { visit } from 'unist-util-visit';
import type { BobEditorPlugin, HastRoot } from '../types.js';

interface HeadingItem {
  id: string;
  text: string;
  level: number;
}

function extractText(node: any): string {
  if (node.type === 'text') return (node.value as string) ?? '';
  const children: any[] = node.children ?? [];
  return children.map((c: any) => extractText(c)).join('');
}

export const tableOfContentsPlugin: BobEditorPlugin = {
  name: 'tableOfContents',
  version: '1.0.0',
  sanitizeSchema: {
    // <nav> is not in rehype-sanitize defaultSchema — must add it
    tagNames: ['nav'],
    attributes: {
      nav: ['className', 'ariaLabel'],
      // Allow any className on <a> for toc-level classes (bobmd-toc-h1 etc.)
      a: ['className'],
    },
    // Hash protocol for in-page heading links
    protocols: {
      href: ['#'],
    },
  },
  onAfterRender(root: HastRoot): HastRoot | void {
    const headings: HeadingItem[] = [];

    visit(root as any, 'element', (node: any) => {
      if (!/^h[1-6]$/.test(node.tagName as string)) return;
      const id = node.properties?.id as string | undefined;
      if (!id) return;
      const text = extractText(node) || id;
      const level = parseInt((node.tagName as string)[1]!, 10);
      headings.push({ id, text, level });
    });

    if (headings.length === 0) return;

    const tocNode: any = {
      type: 'element',
      tagName: 'nav',
      properties: {
        ariaLabel: 'Table of contents',
        className: ['bobmd-toc'],
      },
      children: [
        {
          type: 'element',
          tagName: 'ul',
          properties: {},
          children: headings.map((h) => ({
            type: 'element',
            tagName: 'li',
            properties: {},
            children: [
              {
                type: 'element',
                tagName: 'a',
                properties: {
                  href: `#${h.id}`,
                  className: [`bobmd-toc-h${h.level}`],
                },
                children: [{ type: 'text', value: h.text }],
              },
            ],
          })),
        },
      ],
    };

    root.children.unshift(tocNode);
  },
};
