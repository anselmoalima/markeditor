import { BobEditor } from 'bob-editor';

export function Uncontrolled() {
  return (
    <div data-testid="scenario-uncontrolled" style={{ height: 'calc(100vh - 80px)' }}>
      <p style={{ marginBottom: '0.5rem', fontSize: '0.85rem', color: '#666' }}>
        Uncontrolled editor with localStorage persistence. Type something, navigate away, then
        return — your edits are restored.
      </p>
      <BobEditor
        placeholder="Type something to test persistence..."
        storage={{ enabled: true, storageKey: 'playground-uncontrolled' }}
      />
    </div>
  );
}
