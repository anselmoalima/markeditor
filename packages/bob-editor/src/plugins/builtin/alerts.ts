import type { BobEditorPlugin } from '../../types.js';
import { Alert } from '../../components/Preview/Alert.js';

export const alertsPlugin: BobEditorPlugin = {
  name: 'alerts',
  version: '1.0.0',
  sanitizeSchema: {
    tagNames: ['div', 'section'],
    attributes: {
      div: ['className', 'data-callout-type', 'data-type', 'role', 'aria-label'],
    },
  },
  components: {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    blockquote: Alert as any,
  },
};
