export type LazyFeature = 'math' | 'mermaid' | 'code';

const MATH_PATTERNS = [
  /\$\$[\s\S]+?\$\$/, // display math $$...$$
  /\$[^$\n]+?\$/, // inline math $...$
  /\\\([^)]+?\\\)/, // inline math \(...\)
  /\\\[[^\]]*?\\\]/, // display math \[...\]
];

const MERMAID_PATTERN = /```\s*mermaid/;

const CODE_FENCE_PATTERN = /^```\s*\w/m;

/** Conservative feature detection — false positives OK, false negatives are not. */
export function detectFeatures(markdown: string): Set<LazyFeature> {
  const features = new Set<LazyFeature>();

  for (const re of MATH_PATTERNS) {
    if (re.test(markdown)) {
      features.add('math');
      break;
    }
  }

  if (MERMAID_PATTERN.test(markdown)) {
    features.add('mermaid');
  }

  if (CODE_FENCE_PATTERN.test(markdown)) {
    features.add('code');
  }

  return features;
}
