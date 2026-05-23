import { describe, it, expect } from 'vitest';
import { spawnSync } from 'node:child_process';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { writeFileSync, unlinkSync } from 'node:fs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const pkgDir = resolve(__dirname, '../..');

function run(args: string[], cwd = pkgDir) {
  return spawnSync('pnpm', args, { cwd, encoding: 'utf8', timeout: 60_000 });
}

describe('size gate', () => {
  it('pnpm size exits 0 on current dist', () => {
    const result = run(['size']);
    expect(result.status, result.stderr || result.stdout).toBe(0);
  });

  it('size-limit exits non-zero when a limit is exceeded', () => {
    // Write a temp config with a 1 B limit to verify enforcement.
    // Uses a separate file (not size-limit.json) to avoid a race condition
    // with the unit test that reads size-limit.json in a parallel project.
    const tempConfig = JSON.stringify([{ path: 'dist/index.mjs', limit: '1 B' }]);
    const tempConfigPath = resolve(pkgDir, '.size-limit-test-overflow.json');
    writeFileSync(tempConfigPath, tempConfig);
    try {
      const result = run(['exec', 'size-limit', '--config', '.size-limit-test-overflow.json']);
      expect(result.status).not.toBe(0);
    } finally {
      unlinkSync(tempConfigPath);
    }
  });
});

describe('publint gate', () => {
  it('pnpm publint exits 0 with no errors', () => {
    const result = run(['publint']);
    expect(result.status, result.stderr || result.stdout).toBe(0);
    expect(result.stdout).toContain('All good');
  });
});

describe('attw gate', () => {
  it('pnpm attw exits 0 with no resolution errors', () => {
    const result = run(['attw']);
    expect(result.status, result.stderr || result.stdout).toBe(0);
    expect(result.stdout).toContain('No problems found');
  });
});
