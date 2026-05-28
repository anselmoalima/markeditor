import { Component, useState, useEffect, useId, type ReactNode, type ErrorInfo } from 'react';
import type { Mermaid } from 'mermaid';

let mermaidCache: Mermaid | null = null;
let mermaidInitialized = false;

async function loadMermaid(): Promise<Mermaid> {
  if (mermaidCache) return mermaidCache;
  const mod = await import('mermaid');
  mermaidCache = mod.default;
  return mermaidCache;
}

/** Strip dangerous patterns from SVG output. */
export function sanitizeSvgOutput(svg: string): string {
  return svg
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/\bon\w+\s*=\s*["'][^"']*["']/gi, '')
    .replace(/\bon\w+\s*=\s*[^\s>]*/gi, '')
    .replace(/javascript\s*:/gi, '')
    .replace(/<a\s[^>]*href\s*=\s*["'](?!https?:)[^"']*["'][^>]*>/gi, (match) =>
      match.replace(/href\s*=\s*["'][^"']*["']/, 'href="#"'),
    );
}

interface MermaidErrorBoundaryState {
  error: Error | null;
}

class MermaidErrorBoundary extends Component<{ children: ReactNode }, MermaidErrorBoundaryState> {
  state: MermaidErrorBoundaryState = { error: null };

  static getDerivedStateFromError(error: Error): MermaidErrorBoundaryState {
    return { error };
  }

  componentDidCatch(_error: Error, _info: ErrorInfo): void {}

  render(): ReactNode {
    if (this.state.error) {
      return (
        <div className="bobmd-mermaid-error" role="alert">
          Diagram error: {this.state.error.message}
        </div>
      );
    }
    return this.props.children;
  }
}

interface MermaidDiagramInnerProps {
  code: string;
  id: string;
}

function MermaidDiagramInner({ code, id }: MermaidDiagramInnerProps): JSX.Element {
  const [svg, setSvg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    loadMermaid()
      .then(async (mermaid) => {
        if (cancelled) return;
        if (!mermaidInitialized) {
          mermaid.initialize({ startOnLoad: false, securityLevel: 'strict' });
          mermaidInitialized = true;
        }
        try {
          const { svg: rawSvg } = await mermaid.render(`mermaid-${id}`, code);
          if (!cancelled) setSvg(sanitizeSvgOutput(rawSvg));
        } catch (e) {
          if (!cancelled) setError(e instanceof Error ? e.message : 'Diagram parse error');
        }
      })
      .catch((e) => {
        if (!cancelled) setError(e instanceof Error ? e.message : 'Failed to load mermaid');
      });
    return () => {
      cancelled = true;
    };
  }, [code, id]);

  if (error !== null) {
    return (
      <div className="bobmd-mermaid-error" role="alert">
        Diagram error: {error}
      </div>
    );
  }

  if (svg === null) {
    return <div className="bobmd-mermaid-loading">Rendering diagram…</div>;
  }

  return (
    <div
      className="bobmd-mermaid"
      aria-label="Mermaid diagram"
      // SVG is sanitized above before being set
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  );
}

export interface MermaidDiagramProps {
  code: string;
}

export function MermaidDiagram({ code }: MermaidDiagramProps): JSX.Element {
  const id = useId().replace(/:/g, '');
  return (
    <MermaidErrorBoundary>
      <MermaidDiagramInner code={code} id={id} />
    </MermaidErrorBoundary>
  );
}
