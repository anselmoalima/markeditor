import { useState } from 'react';
import { BobEditor } from 'bob-editor';
import type { ToolbarButton } from 'bob-editor';

const customButton: ToolbarButton = {
  id: 'insert-date',
  label: '📅',
  title: 'Insert current date',
  action: (api) => {
    const date = new Date().toISOString().split('T')[0];
    api.insertText(`**Date:** ${date}\n`);
  },
};

export function CustomToolbar() {
  const [value, setValue] = useState('# Custom Toolbar\n\nClick the 📅 button in the toolbar.\n');

  return (
    <div data-testid="scenario-custom-toolbar" style={{ height: 'calc(100vh - 80px)' }}>
      <p style={{ marginBottom: '0.5rem', fontSize: '0.85rem', color: '#666' }}>
        A custom &ldquo;Insert date&rdquo; button (📅) has been added to the toolbar.
      </p>
      <BobEditor
        value={value}
        onChange={setValue}
        toolbar={{ items: ['bold', 'italic', '|', 'insertLink', customButton] }}
      />
    </div>
  );
}
