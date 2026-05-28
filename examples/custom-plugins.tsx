/**
 * Custom plugins example: activating opt-in built-in plugins and writing
 * a simple custom plugin that shows a live word count.
 */
import { useState } from 'react';
import { BobEditor, type BobEditorPlugin } from 'bob-editor';
import { emojiPlugin } from 'bob-editor/plugins/emoji';
import { mentionsPlugin } from 'bob-editor/plugins/mentions';
import { wordCountPlugin } from 'bob-editor/plugins/wordCount';
import { tableOfContentsPlugin } from 'bob-editor/plugins/tableOfContents';
import 'bob-editor/styles';

const INITIAL = `# Custom Plugins Demo

## Word Count
This paragraph is tracked by the word-count plugin. Watch the counter below update as you type.

## Emoji
Type :tada: or :rocket: and press Space to expand emojis.

## Mentions
Type @alice or @bob to trigger mention completions.

## Table of Contents
The ToC plugin automatically collects headings above.
`;

/** Simple custom plugin that forwards word count to a React state setter. */
function createWordCountPlugin(onCount: (n: number) => void): BobEditorPlugin {
  return {
    name: 'live-word-count',
    onChange(value) {
      const count = value.trim().split(/\s+/).filter(Boolean).length;
      onCount(count);
    },
    onMount(api) {
      // Initialise on mount
      const initial = api.getValue().trim().split(/\s+/).filter(Boolean).length;
      onCount(initial);
    },
  };
}

export default function CustomPluginsExample() {
  const [wordCount, setWordCount] = useState(0);

  const plugins = [
    emojiPlugin(),
    mentionsPlugin({ users: ['alice', 'bob', 'carol', 'dave'] }),
    wordCountPlugin(),
    tableOfContentsPlugin(),
    createWordCountPlugin(setWordCount),
  ];

  return (
    <div style={{ maxWidth: 960, margin: '2rem auto', padding: '0 1rem' }}>
      <h1>bob-editor — Custom Plugins</h1>

      <div style={{ display: 'flex', gap: '2rem' }}>
        <div style={{ flex: 1 }}>
          <BobEditor defaultValue={INITIAL} plugins={plugins} theme="light" />
        </div>

        <aside style={{ width: 180, flexShrink: 0 }}>
          <div
            style={{
              padding: '1rem',
              border: '1px solid #d0d0d0',
              borderRadius: 6,
              textAlign: 'center',
            }}
          >
            <div style={{ fontSize: 36, fontWeight: 700 }}>{wordCount}</div>
            <div style={{ color: '#666', fontSize: 13 }}>words</div>
          </div>
        </aside>
      </div>
    </div>
  );
}
