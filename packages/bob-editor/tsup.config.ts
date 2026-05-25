import { defineConfig } from 'tsup';

export default defineConfig([
  // JavaScript + TypeScript entries (ESM + CJS + d.ts)
  {
    entry: {
      index: 'src/index.ts',
      'plugins/index': 'src/plugins/index.ts',
      'plugins/emoji': 'src/plugins/emoji.ts',
      'plugins/mentions': 'src/plugins/mentions.ts',
      'plugins/wordCount': 'src/plugins/wordCount.ts',
      'plugins/tableOfContents': 'src/plugins/tableOfContents.ts',
    },
    format: ['esm', 'cjs'],
    dts: true,
    sourcemap: true,
    clean: true,
    treeshake: true,
    splitting: false,
    outDir: 'dist',
    external: ['react', 'react-dom', 'monaco-editor', '@monaco-editor/react'],
    esbuildOptions(options) {
      options.jsx = 'automatic';
    },
  },
  // CSS-only entry → dist/styles.css
  {
    entry: { styles: 'src/styles/index.css' },
    outDir: 'dist',
    format: ['esm'],
    // esbuild outputs dist/styles.css; dist/styles.js is an empty side-effect artifact
  },
]);
