import { defineConfig } from 'tsup';

export default defineConfig({
  entry: {
    index: 'src/index.ts',
    'plugins/index': 'src/plugins/index.ts',
  },
  format: ['esm', 'cjs'],
  dts: true,
  splitting: true,
  treeshake: true,
  external: ['react', 'react-dom', 'monaco-editor', 'katex', 'mermaid'],
  outExtension({ format }) {
    return { js: format === 'esm' ? '.mjs' : '.cjs' };
  },
  clean: true,
});
