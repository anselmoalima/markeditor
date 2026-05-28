import { useEffect, useRef, useState } from 'react';
import type React from 'react';

export interface InsertTableProps {
  isOpen: boolean;
  onClose: () => void;
  onInsert: (rows: number, cols: number) => void;
  i18n: Record<string, string>;
}

export function InsertTable({
  isOpen,
  onClose,
  onInsert,
  i18n,
}: InsertTableProps): JSX.Element | null {
  const [rows, setRows] = useState(3);
  const [cols, setCols] = useState(3);
  const rowsInputRef = useRef<HTMLInputElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      setRows(3);
      setCols(3);
      const timer = setTimeout(() => {
        rowsInputRef.current?.focus();
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
    onInsert(rows, cols);
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
    <div className="bobmd-dialog-overlay" data-testid="bobmd-dialog-insert-table">
      <div
        ref={dialogRef}
        className="bobmd-dialog"
        role="dialog"
        aria-modal="true"
        aria-label={i18n['insertTable'] ?? 'Insert Table'}
        onKeyDown={handleTabTrap}
      >
        <h2 className="bobmd-dialog__title">{i18n['insertTable'] ?? 'Insert Table'}</h2>

        <div className="bobmd-dialog__field">
          <label htmlFor="bobmd-insert-table-rows">{i18n['rows'] ?? 'Rows'}</label>
          <input
            ref={rowsInputRef}
            id="bobmd-insert-table-rows"
            type="number"
            min={1}
            max={100}
            value={rows}
            onChange={(e) => setRows(Math.max(1, Number(e.currentTarget.value)))}
          />
        </div>

        <div className="bobmd-dialog__field">
          <label htmlFor="bobmd-insert-table-cols">{i18n['columns'] ?? 'Columns'}</label>
          <input
            id="bobmd-insert-table-cols"
            type="number"
            min={1}
            max={100}
            value={cols}
            onChange={(e) => setCols(Math.max(1, Number(e.currentTarget.value)))}
          />
        </div>

        <div className="bobmd-dialog__actions">
          <button type="button" onClick={onClose}>
            {i18n['cancel'] ?? 'Cancel'}
          </button>
          <button type="button" onClick={handleInsert}>
            {i18n['insert'] ?? 'Insert'}
          </button>
        </div>
      </div>
    </div>
  );
}
