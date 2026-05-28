import { useEffect, useRef } from 'react';
import type React from 'react';

export interface ShortcutEntry {
  id: string;
  label?: string;
  keys: string;
  disabled: boolean;
}

export interface ShortcutsHelpProps {
  isOpen: boolean;
  onClose: () => void;
  shortcuts: ShortcutEntry[];
  i18n: Record<string, string>;
}

export function ShortcutsHelp({
  isOpen,
  onClose,
  shortcuts,
  i18n,
}: ShortcutsHelpProps): JSX.Element | null {
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => {
        dialogRef.current?.focus();
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

  const activeShortcuts = shortcuts.filter((s) => !s.disabled);

  function handleTabTrap(e: React.KeyboardEvent<HTMLDivElement>): void {
    if (e.key !== 'Tab') return;
    const dialog = dialogRef.current;
    if (!dialog) return;

    const focusable = Array.from(
      dialog.querySelectorAll<HTMLElement>('button, [tabindex]:not([tabindex="-1"])'),
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
    <div className="bobmd-dialog-overlay" data-testid="bobmd-dialog-shortcuts-help">
      <div
        ref={dialogRef}
        className="bobmd-dialog"
        role="dialog"
        aria-modal="true"
        aria-label={i18n['shortcutsHelp'] ?? 'Keyboard Shortcuts'}
        tabIndex={-1}
        onKeyDown={handleTabTrap}
      >
        <h2 className="bobmd-dialog__title">{i18n['shortcutsHelp'] ?? 'Keyboard Shortcuts'}</h2>

        <table className="bobmd-shortcuts-table">
          <thead>
            <tr>
              <th>{i18n['shortcutKey'] ?? 'Key'}</th>
              <th>{i18n['shortcutAction'] ?? 'Action'}</th>
            </tr>
          </thead>
          <tbody>
            {activeShortcuts.map((shortcut) => (
              <tr key={shortcut.id}>
                <td>
                  <kbd>{shortcut.keys}</kbd>
                </td>
                <td>{shortcut.label ?? shortcut.id}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="bobmd-dialog__actions">
          <button type="button" onClick={onClose}>
            {i18n['cancel'] ?? 'Close'}
          </button>
        </div>
      </div>
    </div>
  );
}
