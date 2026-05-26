import { useEffect, useMemo, useState } from 'react';
import type { EditorMode } from '../types.js';

export interface ModeToggleProps {
  mode: EditorMode;
  allowedModes?: readonly EditorMode[];
  onToggle: (mode: EditorMode) => void;
}

export function ModeToggle({ mode, allowedModes, onToggle }: ModeToggleProps): JSX.Element | null {
  const modes = useMemo(
    () => (allowedModes && allowedModes.length > 0 ? [...allowedModes] : ['edit', 'preview']),
    [allowedModes],
  );

  const [announcement, setAnnouncement] = useState('');

  useEffect(() => {
    setAnnouncement(mode === 'edit' ? 'Edit mode' : 'Preview mode');
  }, [mode]);

  if (modes.length <= 1) {
    return null;
  }

  const nextMode: EditorMode = mode === 'edit' ? 'preview' : 'edit';
  const disabled = !modes.includes(nextMode);

  return (
    <div className="bobmd-mode-toggle-wrap">
      <button
        type="button"
        className="bobmd-mode-toggle"
        data-testid="bobmd-mode-toggle"
        aria-pressed={mode === 'preview'}
        aria-label="Toggle edit/preview mode"
        disabled={disabled}
        onClick={() => {
          if (!disabled) onToggle(nextMode);
        }}
      >
        {mode === 'edit' ? 'Preview' : 'Edit'}
      </button>
      <span className="bobmd-visually-hidden" aria-live="polite">
        {announcement}
      </span>
    </div>
  );
}
