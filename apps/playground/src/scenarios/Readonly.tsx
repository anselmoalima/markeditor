import { BobEditor } from 'bob-editor';

const READONLY_MARKDOWN = `# Read-Only Editor

This editor is in **read-only** mode.

- Toolbar buttons are disabled
- Monaco editor is not editable
- The mode toggle is still available
`;

export function Readonly() {
  return (
    <div data-testid="scenario-readonly" style={{ height: 'calc(100vh - 80px)' }}>
      <p style={{ marginBottom: '0.5rem', fontSize: '0.85rem', color: '#666' }}>
        <code>readOnly=true</code> — toolbar and editor are disabled.
      </p>
      <BobEditor defaultValue={READONLY_MARKDOWN} readOnly />
    </div>
  );
}
