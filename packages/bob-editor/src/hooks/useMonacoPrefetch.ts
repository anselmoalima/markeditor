import { useEffect, useRef } from 'react';
import type { RefObject } from 'react';

export function useMonacoPrefetch(containerRef: RefObject<HTMLElement | null>): void {
  const prefetchedRef = useRef(false);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    function handleFocusIn(): void {
      if (prefetchedRef.current) return;
      prefetchedRef.current = true;
      void import('@monaco-editor/react');
    }

    container.addEventListener('focusin', handleFocusIn);
    return () => {
      container.removeEventListener('focusin', handleFocusIn);
    };
  }, [containerRef]);
}
