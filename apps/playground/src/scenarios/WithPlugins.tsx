import { BobEditor } from 'bob-editor';
import { emojiPlugin } from 'bob-editor/plugins/emoji';
import type { BobEditorPlugin } from 'bob-editor';

// Only the emoji plugin (built-ins like gfm are included by default when plugins prop is used)
const PLUGINS: BobEditorPlugin[] = [emojiPlugin];

const INITIAL_MARKDOWN = `# With Plugins

The emoji plugin is active. Type emoji shortcodes:

- :tada: should render 🎉
- :rocket: should render 🚀
- :heart: should render ❤️
- :thumbsup: should render 👍
`;

export function WithPlugins() {
  return (
    <div data-testid="scenario-with-plugins" style={{ height: 'calc(100vh - 80px)' }}>
      <p style={{ marginBottom: '0.5rem', fontSize: '0.85rem', color: '#666' }}>
        Emoji plugin active: <code>:tada:</code> → 🎉
      </p>
      <BobEditor defaultValue={INITIAL_MARKDOWN} plugins={PLUGINS} />
    </div>
  );
}
