import { BobEditor } from 'bob-editor';

const INITIAL_MARKDOWN = `# Mermaid Diagrams

Switch to Preview to see the rendered diagram.

\`\`\`mermaid
graph TD
  A[Start] --> B{Is it working?}
  B -- Yes --> C[Great!]
  B -- No --> D[Debug it]
  D --> B
\`\`\`

Sequence diagram:

\`\`\`mermaid
sequenceDiagram
  participant User
  participant Editor
  participant Preview
  User->>Editor: types markdown
  Editor->>Preview: dispatches content
  Preview-->>User: shows rendered HTML
\`\`\`
`;

export function MermaidScenario() {
  return (
    <div data-testid="scenario-mermaid" style={{ height: 'calc(100vh - 80px)' }}>
      <p style={{ marginBottom: '0.5rem', fontSize: '0.85rem', color: '#666' }}>
        Mermaid diagram rendering — switch to Preview.
      </p>
      <BobEditor defaultValue={INITIAL_MARKDOWN} />
    </div>
  );
}
