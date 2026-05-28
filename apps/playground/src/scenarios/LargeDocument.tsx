import { BobEditor } from 'bob-editor';

// Import the 10k-line fixture as a raw string via Vite's ?raw query
// This is the same fixture used in bench tests.
import largeMarkdown from '../../../../packages/bob-editor/tests/fixtures/markdown/large/10k.md?raw';

export function LargeDocument() {
  return (
    <div data-testid="scenario-large-document" style={{ height: 'calc(100vh - 80px)' }}>
      <p style={{ marginBottom: '0.5rem', fontSize: '0.85rem', color: '#666' }}>
        10,000-line document — switch to Preview and verify it renders within 3 seconds.
      </p>
      <BobEditor defaultValue={largeMarkdown} previewDebounceMs={150} />
    </div>
  );
}
