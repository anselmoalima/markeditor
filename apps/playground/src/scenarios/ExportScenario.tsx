import { useRef } from 'react';
import { BobEditor } from 'bob-editor';
import type { BobEditorRef } from 'bob-editor';

const INITIAL_MARKDOWN = `# Export Demo

This editor has HTML and Markdown export enabled.

Use the toolbar **Export** buttons or the ref methods below.

## Features

- **Export HTML**: downloads \`document.html\`
- **Export Markdown**: downloads \`document.md\`
- **Print**: opens browser print dialog
`;

export function ExportScenario() {
  const editorRef = useRef<BobEditorRef>(null);

  const handleExportHtmlViaRef = async () => {
    if (!editorRef.current) return;
    const html = await editorRef.current.exportAsHtml();
    const blob = new Blob([html], { type: 'text/html' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'document-via-ref.html';
    a.click();
    URL.revokeObjectURL(a.href);
  };

  return (
    <div data-testid="scenario-export" style={{ height: 'calc(100vh - 80px)' }}>
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.75rem', flexWrap: 'wrap' }}>
        <button
          type="button"
          data-testid="export-html-ref-btn"
          onClick={() => void handleExportHtmlViaRef()}
          style={{
            padding: '0.25rem 0.75rem',
            border: '1px solid #d0d0d0',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '0.8rem',
          }}
        >
          Export HTML via ref
        </button>
      </div>
      <BobEditor ref={editorRef} defaultValue={INITIAL_MARKDOWN} enableExport />
    </div>
  );
}
