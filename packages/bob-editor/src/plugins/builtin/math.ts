import type { BobEditorPlugin } from '../../types.js';
import { MathBlock, injectKatexCss } from '../../components/Preview/MathBlock.js';

export const mathPlugin: BobEditorPlugin = {
  name: 'math',
  version: '1.0.0',
  sanitizeSchema: {
    tagNames: [
      'math',
      'semantics',
      'annotation',
      'mrow',
      'msup',
      'msub',
      'msubsup',
      'mfrac',
      'mn',
      'mi',
      'mo',
      'mtext',
      'mspace',
      'mover',
      'munder',
      'munderover',
      'mtable',
      'mtr',
      'mtd',
      'msqrt',
      'mroot',
    ],
    attributes: {
      span: ['className', 'style', 'aria-hidden'],
      math: ['xmlns', 'display'],
      annotation: ['encoding'],
      mspace: ['width', 'height', 'depth'],
    },
  },
  components: {
    // MathBlock is available as a standalone component for direct use
    // The pipeline uses rehype-katex for rendering; MathBlock handles CSS injection
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    'math-block': MathBlock as any,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    'math-inline': MathBlock as any,
  },
  onMount: (_api) => {
    injectKatexCss();
  },
};
