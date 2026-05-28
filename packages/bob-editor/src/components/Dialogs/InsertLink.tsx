import { useEffect, useRef, useState } from 'react';
import type React from 'react';

export interface InsertLinkProps {
  isOpen: boolean;
  onClose: () => void;
  onInsert: (label: string, url: string) => void;
  i18n: Record<string, string>;
}

export function InsertLink({
  isOpen,
  onClose,
  onInsert,
  i18n,
}: InsertLinkProps): JSX.Element | null {
  const [url, setUrl] = useState('');
  const [label, setLabel] = useState('');
  const urlInputRef = useRef<HTMLInputElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      setUrl('');
      setLabel('');
      // Auto-focus first input
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
    onInsert(label, url);
    onClose();
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
    <div className="bobmd-dialog-overlay" data-testid="bobmd-dialog-insert-link">
      <div
        ref={dialogRef}
        className="bobmd-dialog"
        role="dialog"
        aria-modal="true"
        aria-label={i18n['insertLink'] ?? 'Insert Link'}
        onKeyDown={handleTabTrap}
      >
        <h2 className="bobmd-dialog__title">{i18n['insertLink'] ?? 'Insert Link'}</h2>

        <div className="bobmd-dialog__field">
          <label htmlFor="bobmd-insert-link-url">{i18n['url'] ?? 'URL'}</label>
          <input
            ref={urlInputRef}
            id="bobmd-insert-link-url"
            type="url"
            value={url}
            required
            onChange={(e) => setUrl(e.currentTarget.value)}
          />
        </div>

        <div className="bobmd-dialog__field">
          <label htmlFor="bobmd-insert-link-label">{i18n['linkLabel'] ?? 'Label'}</label>
          <input
            id="bobmd-insert-link-label"
            type="text"
            value={label}
            onChange={(e) => setLabel(e.currentTarget.value)}
          />
        </div>

        <div className="bobmd-dialog__actions">
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
