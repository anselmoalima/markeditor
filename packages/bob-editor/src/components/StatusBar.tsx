import { useEffect, useState } from 'react';
import { useEditorState } from '../core/state/useEditorContext.js';

function countWords(text: string): number {
  const trimmed = text.trim();
  if (!trimmed) return 0;
  return trimmed.split(/\s+/).length;
}

function formatSavedAt(savedAt: number, i18n: Record<string, string>): string {
  const diffMs = Date.now() - savedAt;
  const diffSeconds = Math.floor(diffMs / 1000);

  if (diffSeconds < 10) {
    return i18n['savedJustNow'] ?? 'Saved just now';
  }
  if (diffSeconds < 60) {
    const template = i18n['savedSecondsAgo'] ?? 'Saved {n}s ago';
    return template.replace('{n}', String(diffSeconds));
  }
  const diffMinutes = Math.floor(diffSeconds / 60);
  const template = i18n['savedMinutesAgo'] ?? 'Saved {n}m ago';
  return template.replace('{n}', String(diffMinutes));
}

export interface StatusBarProps {
  i18n: Record<string, string>;
}

export function StatusBar({ i18n }: StatusBarProps): JSX.Element {
  const state = useEditorState();

  const [wordCount, setWordCount] = useState(() => countWords(state.markdown));
  const [savedLabel, setSavedLabel] = useState<string | null>(null);

  // Debounce word count update
  useEffect(() => {
    const timer = setTimeout(() => {
      setWordCount(countWords(state.markdown));
    }, 300);
    return () => clearTimeout(timer);
  }, [state.markdown]);

  // Update saved label on interval
  useEffect(() => {
    if (state.savedAt === null) {
      setSavedLabel(null);
      return;
    }

    const update = (): void => {
      if (state.savedAt !== null) {
        setSavedLabel(formatSavedAt(state.savedAt, i18n));
      }
    };

    update();
    const interval = setInterval(update, 5000);
    return () => clearInterval(interval);
  }, [state.savedAt, i18n]);

  const wordCountLabel = i18n['wordCount'] ?? 'Words';

  return (
    <div className="bobmd-status-bar" data-testid="bobmd-status-bar">
      <span className="bobmd-status-bar__word-count">
        {wordCountLabel}: {wordCount}
      </span>
      {savedLabel !== null && <span className="bobmd-status-bar__saved-at">{savedLabel}</span>}
    </div>
  );
}
