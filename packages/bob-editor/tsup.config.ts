import { defineConfig } from 'tsup';

const external = ['react', 'react-dom', 'monaco-editor', '@monaco-editor/react'];

const jsEntries = {
  index: 'src/index.ts',
  'plugins/index': 'src/plugins/index.ts',
  'plugins/emoji': 'src/plugins/emoji.ts',
  'plugins/mentions': 'src/plugins/mentions.ts',
  'plugins/wordCount': 'src/plugins/wordCount.ts',
  'plugins/tableOfContents': 'src/plugins/tableOfContents.ts',
};

// Each entry gets its own DTS build to prevent rollup-plugin-dts from creating
// shared chunks (hash-named files that are invisible to the exports map and
// cause attw to crash with an unhandled TypeError).
const dtsBuilds = Object.entries(jsEntries).map(([name, src]) => ({
  entry: { [name]: src },
  outDir: 'dist',
  format: ['esm', 'cjs'] as const,
  dts: { only: true } as const,
  external,
  clean: false,
}));

export default defineConfig([
  // ESM + CJS build (no DTS here — avoids shared chunk generation)
  {
    entry: jsEntries,
    format: ['esm', 'cjs'],
    dts: false,
    sourcemap: true,
    clean: true,
    treeshake: true,
    splitting: false,
    outDir: 'dist',
    external,
    esbuildOptions(options) {
      options.jsx = 'automatic';
    },
  },
  // Per-entry DTS builds — each is single-entry so rollup inlines all types
  ...dtsBuilds,
  // CSS-only entry → dist/styles.css
  {
    entry: { styles: 'src/styles/index.css' },
    outDir: 'dist',
    format: ['esm'],
    clean: false,
  },
]);
