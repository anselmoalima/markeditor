import { BobEditor } from 'bob-editor';

const INITIAL_MARKDOWN = `# Hello, bob-editor

Type some **Markdown** here and click **Preview** to see the rendered output.

- Item 1
- Item 2
- Item 3

> A blockquote

\`\`\`js
console.log('Hello, world!');
\`\`\`
`;

export function Default() {
  return (
    <div data-testid="scenario-default" style={{ height: 'calc(100vh - 80px)' }}>
      <BobEditor defaultValue={INITIAL_MARKDOWN} />
    </div>
  );
}
