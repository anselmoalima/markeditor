import { useEffect, useState } from 'react';
import { BobEditor } from 'bob-editor';

const SSR_MARKDOWN = `# SSR Safe

This scenario simulates an SSR environment.

The **TextareaFallback** is shown synchronously before the component mounts,
ensuring content is accessible without JavaScript.

Once the component mounts (hydration), Monaco loads lazily.
`;

/**
 * Simulates an SSR / hydration pattern:
 * - Before mount (server render): show a plain textarea with the content
 * - After mount (client hydration): render the full <BobEditor />
 *
 * In a Next.js app this would be dynamic(() => import('./BobEditor'), { ssr: false })
 */
export function SsrSafe() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div data-testid="scenario-ssr-safe">
        <textarea
          data-testid="ssr-textarea-fallback"
          aria-label="Markdown editor (SSR fallback)"
          defaultValue={SSR_MARKDOWN}
          readOnly
          style={{ width: '100%', height: '300px', fontFamily: 'monospace', padding: '0.5rem' }}
        />
      </div>
    );
  }

  return (
    <div data-testid="scenario-ssr-safe" style={{ height: 'calc(100vh - 80px)' }}>
      <p style={{ marginBottom: '0.5rem', fontSize: '0.85rem', color: '#666' }}>
        SSR-safe: textarea fallback shown before mount; Monaco loads lazily after hydration.
      </p>
      <BobEditor defaultValue={SSR_MARKDOWN} />
    </div>
  );
}
