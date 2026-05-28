/**
 * Uncontrolled example: defaultValue + localStorage persistence.
 *
 * The editor manages its own state internally. Storage keeps content
 * across page reloads without any React state management.
 */
import { useRef } from 'react';
import { BobEditor, type BobEditorRef } from 'bob-editor';
import 'bob-editor/styles';

export default function UncontrolledExample() {
  const ref = useRef<BobEditorRef>(null);

  return (
    <div style={{ maxWidth: 900, margin: '2rem auto', padding: '0 1rem' }}>
      <h1>bob-editor — Uncontrolled + Storage</h1>
      <p style={{ color: '#666' }}>
        Content is automatically persisted to <code>localStorage</code> every second. Reload the
        page to confirm it is restored.
      </p>

      <BobEditor
        ref={ref}
        defaultValue="# Uncontrolled editor\n\nEdit this content and reload the page — it will be restored."
        defaultMode="edit"
        theme="auto"
        storage={{
          enabled: true,
          storageKey: 'uncontrolled-example',
          storage: 'localStorage',
          autoSaveInterval: 1000,
        }}
        toolbar={{ sticky: true }}
      />

      <div style={{ marginTop: '0.75rem', display: 'flex', gap: '0.5rem' }}>
        <button
          onClick={() => {
            localStorage.removeItem('uncontrolled-example');
            window.location.reload();
          }}
        >
          Clear storage &amp; reload
        </button>
        <button onClick={() => alert(ref.current?.exportAsMarkdown())}>Get current Markdown</button>
      </div>
    </div>
  );
}
