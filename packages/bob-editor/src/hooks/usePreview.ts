import { useEffect, useMemo, useRef, useState } from 'react';
import type React from 'react';
import type { PluggableList } from 'unified';
import type { Options as Schema } from 'rehype-sanitize';
import { buildProcessor, process as processPipeline } from '../core/pipeline/builder.js';
import { buildCacheKey, getCached, setCached } from '../core/pipeline/memo.js';
import { detectFeatures } from '../core/lazy/detector.js';
import { LazyRegistry } from '../core/lazy/registry.js';
import { hash } from '../utils/hash.js';

export interface UsePreviewOptions {
  markdown: string;
  previewDebounceMs?: number;
  remarkPlugins?: PluggableList;
  rehypePlugins?: PluggableList;
  components?: Readonly<Record<string, React.ComponentType<unknown>>>;
  sanitizeSchema?: Schema;
  pluginSignature?: string;
  onError?: (error: Error) => void;
}

export interface UsePreviewResult {
  element: JSX.Element | null;
  status: 'idle' | 'pending' | 'ready' | 'error';
  error: Error | null;
}

export function usePreview({
  markdown,
  previewDebounceMs = 150,
  remarkPlugins,
  rehypePlugins,
  components,
  sanitizeSchema,
  pluginSignature = '',
  onError,
}: UsePreviewOptions): UsePreviewResult {
  const [element, setElement] = useState<JSX.Element | null>(null);
  const [status, setStatus] = useState<UsePreviewResult['status']>('idle');
  const [error, setError] = useState<Error | null>(null);
  const generationRef = useRef(0);

  const schemaVersion = useMemo(() => hash(JSON.stringify(sanitizeSchema ?? {})), [sanitizeSchema]);

  useEffect(() => {
    setStatus('pending');
    setError(null);

    const timer = window.setTimeout(() => {
      const generation = ++generationRef.current;

      const features = detectFeatures(markdown);
      if (features.has('math')) {
        void LazyRegistry.prime('math', () => import('katex'));
      }
      if (features.has('code')) {
        void LazyRegistry.prime('code', () => import('highlight.js'));
      }
      if (features.has('mermaid')) {
        void LazyRegistry.prime('mermaid', () => Promise.resolve(undefined));
      }

      const cacheKey = buildCacheKey(markdown, pluginSignature, schemaVersion);
      const cached = getCached(cacheKey);
      if (cached) {
        setElement(cached);
        setStatus('ready');
        return;
      }

      const options: Parameters<typeof buildProcessor>[0] = {};
      if (remarkPlugins) options.remarkPlugins = remarkPlugins;
      if (rehypePlugins) options.rehypePlugins = rehypePlugins;
      if (sanitizeSchema) options.sanitizeSchema = sanitizeSchema;
      options.components = (components ?? {}) as Record<string, React.ComponentType<unknown>>;

      const processor = buildProcessor(options);

      void processPipeline(markdown, processor, generation, generationRef)
        .then((next) => {
          if (!next) return;
          setCached(cacheKey, next);
          setElement(next);
          setStatus('ready');
        })
        .catch((cause: unknown) => {
          if (generationRef.current !== generation) return;
          const err = cause instanceof Error ? cause : new Error('Preview processing failed');
          setError(err);
          setStatus('error');
          onError?.(err);
        });
    }, previewDebounceMs);

    return () => {
      window.clearTimeout(timer);
    };
  }, [
    markdown,
    previewDebounceMs,
    remarkPlugins,
    rehypePlugins,
    components,
    sanitizeSchema,
    pluginSignature,
    schemaVersion,
    onError,
  ]);

  return { element, status, error };
}
