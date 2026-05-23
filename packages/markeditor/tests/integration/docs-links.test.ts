import { describe, it, expect } from 'vitest';
import { spawnSync } from 'node:child_process';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { existsSync } from 'node:fs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const pkgDir = resolve(__dirname, '../..');
const rootDir = resolve(pkgDir, '../..');

function runLinkCheck(files: string[]) {
  return spawnSync(
    'pnpm',
    ['exec', 'markdown-link-check', '--config', '.markdown-link-check.json', ...files],
    { cwd: rootDir, encoding: 'utf8', timeout: 120_000 },
  );
}

describe('doc files exist', () => {
  it('root README.md exists', () => {
    expect(existsSync(resolve(rootDir, 'README.md'))).toBe(true);
  });

  it('CONTRIBUTING.md exists', () => {
    expect(existsSync(resolve(rootDir, 'CONTRIBUTING.md'))).toBe(true);
  });

  it('packages/markeditor/README.md exists', () => {
    expect(existsSync(resolve(pkgDir, 'README.md'))).toBe(true);
  });
});

describe('markdown link check', () => {
  it('README.md links all resolve', () => {
    const result = runLinkCheck(['README.md']);
    expect(result.status, result.stderr || result.stdout).toBe(0);
  });

  it('CONTRIBUTING.md links all resolve', () => {
    const result = runLinkCheck(['CONTRIBUTING.md']);
    expect(result.status, result.stderr || result.stdout).toBe(0);
  });

  it('packages/markeditor/README.md links all resolve', () => {
    const result = runLinkCheck(['packages/markeditor/README.md']);
    expect(result.status, result.stderr || result.stdout).toBe(0);
  });
});
