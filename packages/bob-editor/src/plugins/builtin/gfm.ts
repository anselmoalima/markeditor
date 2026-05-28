import type { BobEditorPlugin } from '../../types.js';
import { SafeLink } from '../../components/Preview/SafeLink.js';
import { SafeImage } from '../../components/Preview/SafeImage.js';
import { CodeBlock } from '../../components/Preview/CodeBlock.js';

export const gfmPlugin: BobEditorPlugin = {
  name: 'gfm',
  version: '1.0.0',
  sanitizeSchema: {
    tagNames: [
      'del',
      'input',
      'table',
      'thead',
      'tbody',
      'tr',
      'th',
      'td',
      'sup',
      'section',
      'ol',
      'li',
    ],
    attributes: {
      input: ['type', 'checked', 'disabled'],
      th: ['align'],
      td: ['align'],
      // Heading slugs from rehype-slug
      h1: ['id'],
      h2: ['id'],
      h3: ['id'],
      h4: ['id'],
      h5: ['id'],
      h6: ['id'],
      // Footnote anchors
      a: [
        'href',
        'id',
        'aria-label',
        'aria-describedby',
        'role',
        'data-footnote-ref',
        'data-footnote-backref',
      ],
      sup: ['id'],
      section: ['data-footnotes', 'className'],
      li: ['id'],
      ol: ['className'],
    },
    protocols: {
      href: ['http', 'https', 'mailto', '#'],
    },
  },
  components: {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    a: SafeLink as any,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    img: SafeImage as any,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    pre: CodeBlock as any,
  },
};
