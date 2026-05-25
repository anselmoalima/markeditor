import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],

  // Monaco Editor: prevent Vite from pre-bundling monaco-editor and its workers.
  // Without this, Vite tries to bundle Monaco into the main chunk and breaks
  // the AMD-style worker loading that Monaco depends on.
  optimizeDeps: {
    exclude: ['monaco-editor'],
  },

  worker: {
    format: 'es',
  },

  build: {
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          if (id.includes('monaco-editor')) return 'monaco';
        },
      },
    },
  },
});
