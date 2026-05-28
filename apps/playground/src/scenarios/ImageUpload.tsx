import { useState } from 'react';
import { BobEditor } from 'bob-editor';

const INITIAL_MARKDOWN = `# Image Upload

Drag and drop an image here, paste from clipboard, or use the toolbar to insert an image.

The upload is **mocked** via MSW — it returns a placeholder URL on success and a 500 error on failure.
`;

export function ImageUpload() {
  const [uploadLog, setUploadLog] = useState<string[]>([]);
  const [errorLog, setErrorLog] = useState<string[]>([]);
  const [value, setValue] = useState(INITIAL_MARKDOWN);

  const handleUpload = async (file: File): Promise<{ url: string; alt?: string }> => {
    setUploadLog((prev) => [...prev, `Uploading: ${file.name} (${file.size} bytes)`]);
    const fd = new FormData();
    fd.append('file', file);
    const response = await fetch('/api/upload', { method: 'POST', body: fd });
    if (!response.ok) {
      throw new Error(`Upload failed: ${response.status}`);
    }
    const data = (await response.json()) as { url: string; alt?: string };
    setUploadLog((prev) => [...prev, `✓ Uploaded: ${data.url}`]);
    return data;
  };

  return (
    <div data-testid="scenario-image-upload" style={{ height: 'calc(100vh - 80px)' }}>
      <p style={{ marginBottom: '0.5rem', fontSize: '0.85rem', color: '#666' }}>
        MSW intercepts <code>/api/upload</code>. Use the Insert Image toolbar button or drag &amp;
        drop.
      </p>
      <BobEditor
        value={value}
        onChange={setValue}
        onImageUpload={handleUpload}
        onError={(err) => setErrorLog((prev) => [...prev, `✗ ${err.message}`])}
      />
      {uploadLog.length > 0 && (
        <pre
          data-testid="upload-log"
          style={{ fontSize: '0.75rem', marginTop: '0.5rem', color: '#444' }}
        >
          {uploadLog.join('\n')}
        </pre>
      )}
      {errorLog.length > 0 && (
        <pre
          data-testid="error-log"
          style={{ fontSize: '0.75rem', marginTop: '0.5rem', color: '#c00' }}
        >
          {errorLog.join('\n')}
        </pre>
      )}
    </div>
  );
}
