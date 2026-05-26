import { Component, type ErrorInfo } from 'react';
import type React from 'react';
import type { PluggableList } from 'unified';
import type { Options as Schema } from 'rehype-sanitize';
import { usePreview } from '../../hooks/usePreview.js';

class PreviewErrorBoundary extends Component<
  { children: React.ReactNode; onError?: (error: Error) => void },
  { error: Error | null }
> {
  state = { error: null as Error | null };

  static getDerivedStateFromError(error: Error): { error: Error } {
    return { error };
  }

  componentDidCatch(error: Error, _errorInfo: ErrorInfo): void {
    this.props.onError?.(error);
  }

  render(): React.ReactNode {
    if (this.state.error) {
      return (
        <div role="alert" className="bobmd-preview-error">
          {this.state.error.message}
        </div>
      );
    }
    return this.props.children;
  }
}

export interface PreviewProps {
  markdown: string;
  previewDebounceMs?: number;
  remarkPlugins?: PluggableList;
  rehypePlugins?: PluggableList;
  components?: Readonly<Record<string, React.ComponentType<unknown>>>;
  sanitizeSchema?: Schema;
  pluginSignature?: string;
  onError?: (error: Error) => void;
}

export function Preview({
  markdown,
  previewDebounceMs,
  remarkPlugins,
  rehypePlugins,
  components,
  sanitizeSchema,
  pluginSignature,
  onError,
}: PreviewProps): JSX.Element {
  const hookOptions = {
    markdown,
    ...(previewDebounceMs !== undefined ? { previewDebounceMs } : {}),
    ...(remarkPlugins ? { remarkPlugins } : {}),
    ...(rehypePlugins ? { rehypePlugins } : {}),
    ...(components ? { components } : {}),
    ...(sanitizeSchema ? { sanitizeSchema } : {}),
    ...(pluginSignature ? { pluginSignature } : {}),
    ...(onError ? { onError } : {}),
  };
  const { element, status, error } = usePreview(hookOptions);

  return (
    <PreviewErrorBoundary {...(onError ? { onError } : {})}>
      <div className="bobmd-preview" data-testid="bobmd-preview" aria-live="polite">
        {!element && status === 'pending' ? (
          <div className="bobmd-preview-loading" data-testid="bobmd-preview-loading">
            Rendering preview...
          </div>
        ) : null}
        {status === 'error' && error ? (
          <div role="alert" className="bobmd-preview-error">
            {error.message}
          </div>
        ) : null}
        {element}
      </div>
    </PreviewErrorBoundary>
  );
}
