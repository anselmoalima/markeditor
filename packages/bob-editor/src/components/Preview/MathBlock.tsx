import { Component, useState, useEffect, type ReactNode, type ErrorInfo } from 'react';

const KATEX_CSS_URL = 'https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.css';

export function injectKatexCss(): void {
  if (typeof document === 'undefined') return;
  if (document.head.querySelector('link[data-bobmd-katex]')) return;
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = KATEX_CSS_URL;
  link.crossOrigin = 'anonymous';
  link.setAttribute('data-bobmd-katex', '');
  document.head.appendChild(link);
}

type KatexModule = typeof import('katex');

// Module-level cache avoids re-importing katex on every render
let katexCache: KatexModule | null = null;

async function loadKatex(): Promise<KatexModule> {
  if (katexCache) return katexCache;
  const mod = await import('katex');
  // katex ESM exports have a default that is the katex API object
  katexCache =
    (mod as unknown as { default: KatexModule }).default ?? (mod as unknown as KatexModule);
  return katexCache;
}

interface MathErrorBoundaryProps {
  children: ReactNode;
  tex?: string;
}

interface MathErrorBoundaryState {
  error: Error | null;
}

class MathErrorBoundary extends Component<MathErrorBoundaryProps, MathErrorBoundaryState> {
  state: MathErrorBoundaryState = { error: null };

  static getDerivedStateFromError(error: Error): MathErrorBoundaryState {
    return { error };
  }

  componentDidCatch(_error: Error, _info: ErrorInfo): void {}

  render(): ReactNode {
    if (this.state.error) {
      return (
        <span className="bobmd-math-error" role="alert">
          Math error: {this.props.tex ?? 'unknown'}
        </span>
      );
    }
    return this.props.children;
  }
}

interface MathBlockInnerProps {
  tex: string;
  display: boolean;
}

function MathBlockInner({ tex, display }: MathBlockInnerProps): JSX.Element {
  const [html, setHtml] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    injectKatexCss();
    let cancelled = false;
    loadKatex()
      .then((katex) => {
        if (cancelled) return;
        try {
          const rendered = katex.renderToString(tex, {
            displayMode: display,
            throwOnError: false,
            strict: false,
          });
          setHtml(rendered);
        } catch {
          setError(tex);
        }
      })
      .catch(() => {
        if (!cancelled) setError(tex);
      });
    return () => {
      cancelled = true;
    };
  }, [tex, display]);

  if (error !== null) {
    return (
      <span className="bobmd-math-error" role="alert">
        Math error: {error}
      </span>
    );
  }

  if (html === null) {
    return <span className="bobmd-math-loading">{tex}</span>;
  }

  return display ? (
    <div className="bobmd-math-display" dangerouslySetInnerHTML={{ __html: html }} />
  ) : (
    <span className="bobmd-math-inline" dangerouslySetInnerHTML={{ __html: html }} />
  );
}

export interface MathBlockProps {
  tex?: string;
  display?: string | boolean;
  children?: ReactNode;
}

export function MathBlock({ tex, display, children }: MathBlockProps): JSX.Element {
  useEffect(() => {
    injectKatexCss();
  }, []);

  if (tex !== undefined) {
    const isDisplay = display === 'true' || display === true;
    return (
      <MathErrorBoundary tex={tex}>
        <MathBlockInner tex={tex} display={isDisplay} />
      </MathErrorBoundary>
    );
  }

  return (
    <MathErrorBoundary>
      <span className="bobmd-math">{children}</span>
    </MathErrorBoundary>
  );
}
