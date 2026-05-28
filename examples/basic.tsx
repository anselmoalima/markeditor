/**
 * Basic example: controlled mode with onChange + onSave.
 */
import { useRef, useState } from 'react';
import { BobEditor, type BobEditorRef } from 'bob-editor';
import 'bob-editor/styles';

const INITIAL_CONTENT = `# Hello, bob-editor!

Start typing Markdown here. Toggle between **Edit** and **Preview** using the button in the toolbar.

## Features

- GFM tables, task lists, and strikethrough
- Math with $E = mc^2$ and display blocks
- Code blocks with syntax highlighting
- Mermaid diagrams

\`\`\`mermaid
graph LR
  A[Start] --> B{Is it working?}
  B -- Yes --> C[Great!]
  B -- No  --> D[Debug]
\`\`\`
`;

export default function BasicExample() {
  const [value, setValue] = useState(INITIAL_CONTENT);
  const [lastSaved, setLastSaved] = useState<string | null>(null);
  const ref = useRef<BobEditorRef>(null);

  const handleSave = async (md: string) => {
    // Replace with a real API call
    await new Promise((r) => setTimeout(r, 200));
    setLastSaved(new Date().toLocaleTimeString());
    console.log('Saved:', md.slice(0, 80));
  };

  return (
    <div style={{ maxWidth: 900, margin: '2rem auto', padding: '0 1rem' }}>
      <h1>bob-editor — Basic (Controlled)</h1>

      <BobEditor
        ref={ref}
        value={value}
        onChange={setValue}
        onSave={handleSave}
        theme="light"
        toolbar
      />

      <div style={{ marginTop: '0.75rem', display: 'flex', gap: '1rem' }}>
        <button onClick={() => ref.current?.setMode('edit')}>Edit mode</button>
        <button onClick={() => ref.current?.setMode('preview')}>Preview mode</button>
        <button onClick={() => ref.current?.insertText('\n> A quoted block\n')}>
          Insert quote
        </button>
        {lastSaved && (
          <span style={{ marginLeft: 'auto', opacity: 0.6 }}>Saved at {lastSaved}</span>
        )}
      </div>

      <details style={{ marginTop: '1rem' }}>
        <summary>Raw Markdown</summary>
        <pre style={{ background: '#f6f8fa', padding: '1rem', overflow: 'auto' }}>{value}</pre>
      </details>
    </div>
  );
}
