import { useEffect, useRef, useState } from 'react';
import type React from 'react';

export interface InsertImageProps {
  isOpen: boolean;
  onClose: () => void;
  onInsert: (url: string, altText: string) => void;
  onUploadFile?: (file: File) => void;
  i18n: Record<string, string>;
}

export function InsertImage({
  isOpen,
  onClose,
  onInsert,
  onUploadFile,
  i18n,
}: InsertImageProps): JSX.Element | null {
  const [url, setUrl] = useState('');
  const [altText, setAltText] = useState('');
  const urlInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      setUrl('');
      setAltText('');
      const timer = setTimeout(() => {
        urlInputRef.current?.focus();
      }, 0);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    function handleKeyDown(e: KeyboardEvent): void {
      if (e.key === 'Escape') {
        onClose();
      }
    }

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  function handleInsert(): void {
    if (!url) return;
    onInsert(url, altText);
    onClose();
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>): void {
    const file = e.currentTarget.files?.[0];
    if (!file || !onUploadFile) return;
    onUploadFile(file);
    onClose();
    // Reset so same file can be selected again
    e.currentTarget.value = '';
  }

  function handleTabTrap(e: React.KeyboardEvent<HTMLDivElement>): void {
    if (e.key !== 'Tab') return;
    const dialog = dialogRef.current;
    if (!dialog) return;

    const focusable = Array.from(
      dialog.querySelectorAll<HTMLElement>('input, button, [tabindex]:not([tabindex="-1"])'),
    ).filter((el) => !el.hasAttribute('disabled'));

    if (focusable.length === 0) return;

    const first = focusable[0];
    const last = focusable[focusable.length - 1];

    if (e.shiftKey) {
      if (document.activeElement === first) {
        e.preventDefault();
        last?.focus();
      }
    } else {
      if (document.activeElement === last) {
        e.preventDefault();
        first?.focus();
      }
    }
  }

  return (
    <div className="bobmd-dialog-overlay" data-testid="bobmd-dialog-insert-image">
      <div
        ref={dialogRef}
        className="bobmd-dialog"
        role="dialog"
        aria-modal="true"
        aria-label={i18n['insertImage'] ?? 'Insert Image'}
        onKeyDown={handleTabTrap}
      >
        <h2 className="bobmd-dialog__title">{i18n['insertImage'] ?? 'Insert Image'}</h2>

        <div className="bobmd-dialog__field">
          <label htmlFor="bobmd-insert-image-url">{i18n['url'] ?? 'URL'}</label>
          <input
            ref={urlInputRef}
            id="bobmd-insert-image-url"
            type="url"
            value={url}
            required
            onChange={(e) => setUrl(e.currentTarget.value)}
          />
        </div>

        <div className="bobmd-dialog__field">
          <label htmlFor="bobmd-insert-image-alt">{i18n['altText'] ?? 'Alt Text'}</label>
          <input
            id="bobmd-insert-image-alt"
            type="text"
            value={altText}
            onChange={(e) => setAltText(e.currentTarget.value)}
          />
        </div>

        <div className="bobmd-dialog__actions">
          {onUploadFile != null && (
            <>
              <input
                ref={fileInputRef}
                id="bobmd-insert-image-file"
                type="file"
                accept="image/*"
                style={{ display: 'none' }}
                onChange={handleFileChange}
                data-testid="bobmd-insert-image-file-input"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                data-testid="bobmd-upload-file-btn"
              >
                {i18n['uploadFile'] ?? 'Upload File'}
              </button>
            </>
          )}
          <button type="button" onClick={onClose}>
            {i18n['cancel'] ?? 'Cancel'}
          </button>
          <button type="button" onClick={handleInsert} disabled={!url}>
            {i18n['insert'] ?? 'Insert'}
          </button>
        </div>
      </div>
    </div>
  );
}
