// @vitest-environment node

import { describe, it, expect } from 'vitest';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { execSync, spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const pkgRoot = resolve(__dirname, '../..');
const monorepoRoot = resolve(pkgRoot, '../..');
const distDir = resolve(pkgRoot, 'dist');

describe('dist artifacts', () => {
  it('dist/index.js (ESM) exists', () => {
    expect(existsSync(resolve(distDir, 'index.js'))).toBe(true);
  });

  it('dist/index.cjs (CJS) exists', () => {
    expect(existsSync(resolve(distDir, 'index.cjs'))).toBe(true);
  });

  it('dist/index.d.ts exists', () => {
    expect(existsSync(resolve(distDir, 'index.d.ts'))).toBe(true);
  });

  it('dist/index.d.cts (CJS types) exists', () => {
    expect(existsSync(resolve(distDir, 'index.d.cts'))).toBe(true);
  });

  it('dist/styles.css exists', () => {
    expect(existsSync(resolve(distDir, 'styles.css'))).toBe(true);
  });

  it('dist/plugins/ ESM + CJS + d.ts artifacts exist for all subpaths', () => {
    const plugins = ['emoji', 'mentions', 'wordCount', 'tableOfContents', 'index'];
    for (const p of plugins) {
      expect(existsSync(resolve(distDir, `plugins/${p}.js`)), `plugins/${p}.js`).toBe(true);
      expect(existsSync(resolve(distDir, `plugins/${p}.cjs`)), `plugins/${p}.cjs`).toBe(true);
      expect(existsSync(resolve(distDir, `plugins/${p}.d.ts`)), `plugins/${p}.d.ts`).toBe(true);
    }
  });
});

describe('publint', () => {
  it('exits 0 with zero warnings against stub dist', () => {
    execSync('pnpm run publint', {
      cwd: pkgRoot,
      encoding: 'utf-8',
      timeout: 30000,
      stdio: 'pipe',
    });
  }, 30000);
});

describe('attw', () => {
  it('--pack exits 0 with zero errors', () => {
    execSync('pnpm run attw', {
      cwd: pkgRoot,
      encoding: 'utf-8',
      timeout: 60000,
      stdio: 'pipe',
    });
  }, 60000);
});

describe('playground smoke test', () => {
  it(
    'dev server starts without error',
    () =>
      new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(() => {
          proc.kill('SIGTERM');
          reject(new Error('Playground dev server did not start within 30s'));
        }, 30000);

        const proc = spawn('pnpm', ['--filter', 'playground', 'dev', '--port', '5174'], {
          cwd: monorepoRoot,
          stdio: ['ignore', 'pipe', 'pipe'],
        });

        const onData = (data: Buffer) => {
          const text = data.toString();
          if (
            text.toLowerCase().includes('local') ||
            text.toLowerCase().includes('localhost') ||
            text.toLowerCase().includes('ready')
          ) {
            clearTimeout(timeout);
            proc.kill('SIGTERM');
            resolve();
          }
        };

        proc.stdout?.on('data', onData);
        proc.stderr?.on('data', onData);

        proc.on('error', (err) => {
          clearTimeout(timeout);
          reject(err);
        });
      }),
    35000,
  );
});
