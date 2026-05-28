import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./tests/setup.ts'],
    globals: false,
    include: ['tests/**/*.test.{ts,tsx}'],
    // Exclude playwright e2e specs
    exclude: ['e2e/**', 'node_modules/**'],
  },
  // Resolve workspace package
  resolve: {
    alias: {},
  },
});
