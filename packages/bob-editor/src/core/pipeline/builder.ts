/* eslint-disable @typescript-eslint/no-explicit-any */
import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import remarkRehype from 'remark-rehype';
import rehypeSlug from 'rehype-slug';
import rehypeKatex from 'rehype-katex';
import rehypeHighlight from 'rehype-highlight';
import rehypeSanitize from 'rehype-sanitize';
import rehypeReact from 'rehype-react';
import * as runtime from 'react/jsx-runtime';
import type { PluggableList } from 'unified';
import type { Options as Schema } from 'rehype-sanitize';
import { getCoreSchema } from '../sanitize/index.js';
import { mergeSanitizeSchema } from '../sanitize/merge.js';

export interface PipelineOptions {
  remarkPlugins?: PluggableList;
  rehypePlugins?: PluggableList;
  components?: Record<string, React.ComponentType<any>>;
  sanitizeSchema?: Schema;
}

export interface GenerationRef {
  current: number;
}

type AnyProcessor = any;

/** Builds a unified Processor configured with the full core stack. */
export function buildProcessor(opts: PipelineOptions = {}): AnyProcessor {
  const schema = opts.sanitizeSchema
    ? mergeSanitizeSchema(getCoreSchema(), opts.sanitizeSchema)
    : getCoreSchema();

  let proc: AnyProcessor = unified().use(remarkParse).use(remarkGfm).use(remarkMath);

  if (opts.remarkPlugins?.length) {
    proc = proc.use(opts.remarkPlugins);
  }

  proc = proc
    .use(remarkRehype, { allowDangerousHtml: false })
    .use(rehypeSlug)
    .use(rehypeKatex, { throwOnError: false, strict: false })
    .use(rehypeHighlight, { detect: false });

  if (opts.rehypePlugins?.length) {
    proc = proc.use(opts.rehypePlugins);
  }

  proc = proc.use(rehypeSanitize, schema).use(rehypeReact, {
    Fragment: runtime.Fragment,
    jsx: runtime.jsx,
    jsxs: runtime.jsxs,
    components: opts.components ?? {},
  });

  return proc;
}

/**
 * Runs the pipeline and returns the resulting JSX element.
 * If `generationRef.current !== generation` after async work, returns null (stale).
 */
export async function process(
  markdown: string,
  processor: AnyProcessor,
  generation: number,
  generationRef: GenerationRef,
): Promise<JSX.Element | null> {
  const file = await (processor as AnyProcessor).process(markdown);
  if (generationRef.current !== generation) {
    return null;
  }
  return file.result as JSX.Element;
}
