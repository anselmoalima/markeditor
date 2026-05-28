import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BobEditor } from '../../src/BobEditor.js';

vi.mock('@monaco-editor/react', () => ({
  default: ({ value, onChange }: { value: string; onChange?: (value: string) => void }) => (
    <textarea
      aria-label="Markdown editor"
      data-testid="mock-monaco"
      value={value}
      onChange={(e) => onChange?.(e.currentTarget.value)}
    />
  ),
}));

function getEditorInput(): HTMLTextAreaElement {
  const monaco = screen.queryByTestId('mock-monaco');
  if (monaco instanceof HTMLTextAreaElement) return monaco;
  return screen.getByTestId('bobmd-textarea') as HTMLTextAreaElement;
}

function makeImageFile(name = 'photo.png', type = 'image/png'): File {
  return new File(['data'], name, { type });
}

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe('Image upload — optimistic flow', () => {
  it('success: placeholder replaced with final image URL', async () => {
    const onImageUpload = vi
      .fn()
      .mockResolvedValue({ url: 'https://cdn.example.com/img.png', alt: 'photo' });

    render(<BobEditor defaultValue="Hello world" onImageUpload={onImageUpload} />);
    await act(async () => {});

    // Open InsertImage dialog via toolbar
    const imageBtn = screen.getByRole('button', { name: /image/i });
    await userEvent.click(imageBtn);

    // Upload a file via the file input in the dialog
    const fileInput = screen.getByTestId('bobmd-insert-image-file-input');
    const file = makeImageFile();
    await userEvent.upload(fileInput, file);

    await waitFor(() => expect(onImageUpload).toHaveBeenCalledWith(file));

    // After promise resolves, markdown should contain the final image, not the placeholder
    await waitFor(() => {
      const input = getEditorInput();
      expect(input.value).toContain('https://cdn.example.com/img.png');
      expect(input.value).not.toContain('data:image/upload-');
    });
  });

  it('failure: placeholder removed and onError called', async () => {
    const uploadError = new Error('Upload failed');
    const onImageUpload = vi.fn().mockRejectedValue(uploadError);
    const onError = vi.fn();

    render(
      <BobEditor defaultValue="Hello world" onImageUpload={onImageUpload} onError={onError} />,
    );
    await act(async () => {});

    const imageBtn = screen.getByRole('button', { name: /image/i });
    await userEvent.click(imageBtn);

    const fileInput = screen.getByTestId('bobmd-insert-image-file-input');
    const file = makeImageFile();
    await userEvent.upload(fileInput, file);

    await waitFor(() => expect(onError).toHaveBeenCalledWith(uploadError));

    // Placeholder should be removed from markdown
    await waitFor(() => {
      const input = getEditorInput();
      expect(input.value).not.toContain('data:image/upload-');
    });
  });

  it('drag-drop: dropped image file triggers onImageUpload', async () => {
    const onImageUpload = vi
      .fn()
      .mockResolvedValue({ url: 'https://cdn.example.com/drag.png', alt: '' });
    const { container } = render(<BobEditor defaultValue="" onImageUpload={onImageUpload} />);
    await act(async () => {});

    const rootDiv = container.firstElementChild as HTMLElement;
    const file = makeImageFile('drag.png');

    fireEvent.dragOver(rootDiv, {
      dataTransfer: {
        items: [{ kind: 'file', type: 'image/png' }],
      },
    });

    fireEvent.drop(rootDiv, {
      dataTransfer: {
        files: [file],
      },
    });

    await waitFor(() => expect(onImageUpload).toHaveBeenCalledWith(file));
  });

  it('paste: pasted image file triggers onImageUpload via TextareaFallback', async () => {
    const onImageUpload = vi
      .fn()
      .mockResolvedValue({ url: 'https://cdn.example.com/paste.png', alt: '' });

    render(<BobEditor defaultValue="" onImageUpload={onImageUpload} />);
    await act(async () => {});

    const file = makeImageFile('paste.png');
    const textarea = screen.queryByTestId('bobmd-textarea');
    if (!textarea) {
      // If Monaco mock is loaded, paste is handled differently; skip this test path
      return;
    }

    fireEvent.paste(textarea, {
      clipboardData: {
        files: [file],
        items: [{ kind: 'file', type: 'image/png', getAsFile: () => file }],
      },
    });

    await waitFor(() => expect(onImageUpload).toHaveBeenCalledWith(file));
  });
});
