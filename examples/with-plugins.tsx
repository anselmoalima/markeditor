/**
 * Example: composing multiple opt-in plugins with BobEditor.
 *
 * Import only the plugins you need — each subpath is independently tree-shakable.
 */
import React, { useState } from 'react';
import { BobEditor } from 'bob-editor';
import 'bob-editor/styles';
import { emojiPlugin } from 'bob-editor/plugins/emoji';
import { createMentionsPlugin } from 'bob-editor/plugins/mentions';
import { wordCountPlugin } from 'bob-editor/plugins/wordCount';
import { tableOfContentsPlugin } from 'bob-editor/plugins/tableOfContents';
// Built-in plugins still available from the plugins barrel
import { gfmPlugin, mathPlugin } from 'bob-editor/plugins';

const mentionsPlugin = createMentionsPlugin({
  resolveMention: (username) => ({
    url: `https://github.com/${username}`,
    displayName: username,
  }),
});

const PLUGINS = [
  gfmPlugin,
  mathPlugin,
  emojiPlugin,
  mentionsPlugin,
  wordCountPlugin,
  tableOfContentsPlugin,
];

const INITIAL_MARKDOWN = `# Opt-in Plugins Demo

## Table of Contents (auto-generated above)

### Emoji Plugin

Type shortcodes like :tada: :rocket: :heart: to get emoji in preview.

### Mentions Plugin

Reference GitHub users like @octocat and @torvalds — they render as links.

### Word Count Plugin

The word count updates on every keystroke via the \`onChange\` hook.

## Math (built-in)

Inline math: $E = mc^2$

Block math:

$$
\\int_0^\\infty e^{-x^2} dx = \\frac{\\sqrt{\\pi}}{2}
$$
`;

export function WithPluginsExample(): JSX.Element {
  const [value, setValue] = useState(INITIAL_MARKDOWN);

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: 24 }}>
      <h1>bob-editor — Opt-in Plugins</h1>
      <BobEditor
        value={value}
        onChange={setValue}
        plugins={PLUGINS}
        onError={(err) => console.error('[bob-editor]', err)}
      />
    </div>
  );
}
