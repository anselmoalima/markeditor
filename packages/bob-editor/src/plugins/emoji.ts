/* eslint-disable @typescript-eslint/no-explicit-any */
import { visit } from 'unist-util-visit';
import type { BobEditorPlugin } from '../types.js';

// Compact shortcode → unicode map. No external emoji library needed.
const EMOJI_MAP: Record<string, string> = {
  // Smileys & faces
  smile: '😊',
  grin: '😁',
  laughing: '😄',
  joy: '😂',
  rofl: '🤣',
  wink: '😉',
  heart_eyes: '😍',
  kissing_heart: '😘',
  relieved: '😌',
  sunglasses: '😎',
  thinking: '🤔',
  confused: '😕',
  cry: '😢',
  sob: '😭',
  angry: '😠',
  rage: '😡',
  expressionless: '😑',
  sleepy: '😴',
  yawn: '🥱',
  flushed: '😳',
  scream: '😱',
  astonished: '😲',
  hushed: '😯',
  fearful: '😨',
  weary: '😩',
  triumph: '😤',
  pensive: '😔',
  // Hands & gestures
  thumbsup: '👍',
  thumbsdown: '👎',
  clap: '👏',
  pray: '🙏',
  wave: '👋',
  raised_hands: '🙌',
  fist: '✊',
  crossed_fingers: '🤞',
  v: '✌️',
  // Hearts & symbols
  heart: '❤️',
  broken_heart: '💔',
  two_hearts: '💕',
  sparkling_heart: '💖',
  fire: '🔥',
  star: '⭐',
  star2: '🌟',
  dizzy: '💫',
  boom: '💥',
  tada: '🎉',
  balloon: '🎈',
  trophy: '🏆',
  rocket: '🚀',
  zap: '⚡',
  checkmark: '✅',
  x: '❌',
  warning: '⚠️',
  bulb: '💡',
  eyes: '👀',
  computer: '💻',
  phone: '📱',
  email: '📧',
  lock: '🔒',
  key: '🔑',
  bell: '🔔',
  book: '📚',
  pencil: '✏️',
  link: '🔗',
  magnifying_glass: '🔍',
  chart: '📊',
  // Nature
  sun: '☀️',
  moon: '🌙',
  cloud: '☁️',
  rain: '🌧️',
  snow: '❄️',
  rainbow: '🌈',
  // Animals
  cat: '🐱',
  dog: '🐶',
  bear: '🐻',
  rabbit: '🐰',
  fox: '🦊',
  lion: '🦁',
  unicorn: '🦄',
  // Food
  pizza: '🍕',
  burger: '🍔',
  coffee: '☕',
  cake: '🎂',
};

const SHORTCODE_RE = /:([a-zA-Z0-9_+\-]+):/g;

function remarkEmoji() {
  return function (tree: any) {
    visit(tree, 'text', function (node: any, index: number | undefined, parent: any) {
      if (index === undefined || !parent) return;
      if (!node.value.includes(':')) return;

      const parts: any[] = [];
      let last = 0;
      let replaced = false;
      const re = new RegExp(':([a-zA-Z0-9_+\\-]+):', 'g');
      let match: RegExpExecArray | null;

      while ((match = re.exec(node.value)) !== null) {
        const name = match[1]!;
        const emoji = EMOJI_MAP[name];
        if (emoji === undefined) continue;

        replaced = true;
        if (match.index > last) {
          parts.push({ type: 'text', value: node.value.slice(last, match.index) });
        }
        parts.push({ type: 'text', value: emoji });
        last = match.index + match[0].length;
      }

      if (!replaced) return;

      if (last < node.value.length) {
        parts.push({ type: 'text', value: node.value.slice(last) });
      }

      parent.children.splice(index, 1, ...parts);
    });
  };
}

export const emojiPlugin: BobEditorPlugin = {
  name: 'emoji',
  version: '1.0.0',
  remarkPlugins: [remarkEmoji],
  sanitizeSchema: {
    // Emoji are pure text nodes — no new tags or attributes required
  },
  toolbarButtons: [
    {
      id: 'insert-emoji-smile',
      label: '😊',
      title: 'Insert emoji :smile:',
      action: (api) => api.insertText(':smile:'),
    },
  ],
};

export { EMOJI_MAP };
