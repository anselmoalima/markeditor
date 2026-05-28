import { BobEditor } from 'bob-editor';

export function StorageScenario() {
  return (
    <div data-testid="scenario-storage" style={{ height: 'calc(100vh - 80px)' }}>
      <p style={{ marginBottom: '0.5rem', fontSize: '0.85rem', color: '#666' }}>
        Auto-save enabled — edits persist to <code>localStorage</code>. Refresh the page to verify
        content is restored.
      </p>
      <BobEditor
        placeholder="Type something to test auto-save persistence..."
        storage={{
          enabled: true,
          storageKey: 'playground-storage-demo',
          autoSaveInterval: 1000,
        }}
      />
    </div>
  );
}
