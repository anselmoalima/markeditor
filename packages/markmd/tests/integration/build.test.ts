import { existsSync, readFileSync } from 'node:fs';
import { execSync } from 'node:child_process';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, it, expect } from 'vitest';

const __dirname = dirname(fileURLToPath(import.meta.url));
const distDir = resolve(__dirname, '../../dist');

describe('built artifacts exist', () => {
  it('dist/index.mjs exists', () => {
    expect(existsSync(resolve(distDir, 'index.mjs'))).toBe(true);
  });

  it('dist/index.cjs exists', () => {
    expect(existsSync(resolve(distDir, 'index.cjs'))).toBe(true);
  });

  it('dist/index.d.ts exists', () => {
    expect(existsSync(resolve(distDir, 'index.d.ts'))).toBe(true);
  });

  it('dist/index.d.cts exists', () => {
    expect(existsSync(resolve(distDir, 'index.d.cts'))).toBe(true);
  });

  it('dist/styles.css is non-empty', () => {
    const stylesPath = resolve(distDir, 'styles.css');
    expect(existsSync(stylesPath)).toBe(true);
    const content = readFileSync(stylesPath, 'utf8');
    expect(content.trim().length).toBeGreaterThan(0);
  });

  it('dist/plugins/index.mjs exists', () => {
    expect(existsSync(resolve(distDir, 'plugins/index.mjs'))).toBe(true);
  });

  it('dist/plugins/index.cjs exists', () => {
    expect(existsSync(resolve(distDir, 'plugins/index.cjs'))).toBe(true);
  });
});

describe('ESM import resolves MarkmdEditor', () => {
  it('node --input-type=module dynamic import exits 0', () => {
    const mjs = resolve(distDir, 'index.mjs');
    const cmd = `node --input-type=module -e "import('${mjs}').then(m => process.exit(m.MarkmdEditor ? 0 : 1)).catch(() => process.exit(1))"`;
    expect(() => execSync(cmd, { stdio: 'pipe' })).not.toThrow();
  });
});

describe('CJS require resolves MarkmdEditor', () => {
  it('node -e require exits 0', () => {
    const cjs = resolve(distDir, 'index.cjs');
    const cmd = `node -e "const m = require('${cjs}'); process.exit(m.MarkmdEditor ? 0 : 1)"`;
    expect(() => execSync(cmd, { stdio: 'pipe' })).not.toThrow();
  });
});
