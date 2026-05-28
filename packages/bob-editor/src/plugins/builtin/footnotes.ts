import type { BobEditorPlugin } from '../../types.js';

export const footnotesPlugin: BobEditorPlugin = {
  name: 'footnotes',
  version: '1.0.0',
  sanitizeSchema: {
    tagNames: ['sup', 'section', 'hr'],
    attributes: {
      sup: ['id'],
      a: [
        'id',
        'aria-label',
        'aria-describedby',
        'role',
        'data-footnote-ref',
        'data-footnote-backref',
        'href',
      ],
      section: ['data-footnotes', 'className'],
      li: ['id'],
      ol: ['className'],
    },
    protocols: {
      href: ['http', 'https', '#'],
    },
  },
};
