// Opt-in plugins (not active by default — import explicitly to use)
export { emojiPlugin, EMOJI_MAP } from './emoji.js';
export { createMentionsPlugin, mentionsPlugin } from './mentions.js';
export type { MentionResolution, ResolveMention } from './mentions.js';
export { wordCountPlugin } from './wordCount.js';
export { tableOfContentsPlugin } from './tableOfContents.js';

// Built-in plugins (active by default via BUILTIN_PLUGINS)
export {
  gfmPlugin,
  mathPlugin,
  mermaidPlugin,
  alertsPlugin,
  footnotesPlugin,
  DEFAULT_PLUGINS,
} from './builtin/index.js';

export type { BobEditorPlugin } from '../types.js';
