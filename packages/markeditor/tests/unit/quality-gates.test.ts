import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, it, expect } from 'vitest';

const __dirname = dirname(fileURLToPath(import.meta.url));
const pkgDir = resolve(__dirname, '../..');
const rootDir = resolve(pkgDir, '../..');

type SizeLimitEntry = {
  name?: string;
  path: string;
  limit: string;
};

describe('size-limit.json shape', () => {
  const config = JSON.parse(
    readFileSync(resolve(pkgDir, 'size-limit.json'), 'utf8'),
  ) as unknown as SizeLimitEntry[];

  it('is an array', () => {
    expect(Array.isArray(config)).toBe(true);
    expect(config.length).toBeGreaterThan(0);
  });

  it('declares an entry pointing at dist/index.mjs with a KB limit', () => {
    const entry = config.find((e) => e.path === 'dist/index.mjs');
    expect(entry).toBeDefined();
    expect(entry!.limit).toMatch(/KB$/);
    const kb = parseFloat(entry!.limit);
    expect(kb).toBeGreaterThan(0);
  });

  it('declares an entry for dist/plugins/index.mjs with limit <=10 KB', () => {
    const entry = config.find((e) => e.path === 'dist/plugins/index.mjs');
    expect(entry).toBeDefined();
    const kb = parseFloat(entry!.limit);
    expect(kb).toBeLessThanOrEqual(10);
    expect(entry!.limit).toMatch(/KB$/);
  });

  it('main bundle limit is <=80 KB', () => {
    const entry = config.find((e) => e.path === 'dist/index.mjs');
    const kb = parseFloat(entry!.limit);
    expect(kb).toBeLessThanOrEqual(80);
  });
});

describe('root package.json scripts', () => {
  const pkg = JSON.parse(readFileSync(resolve(rootDir, 'package.json'), 'utf8')) as unknown as {
    scripts: Record<string, string>;
  };

  it('exposes script "size"', () => {
    expect(pkg.scripts['size']).toBeDefined();
    expect(typeof pkg.scripts['size']).toBe('string');
  });

  it('exposes script "publint"', () => {
    expect(pkg.scripts['publint']).toBeDefined();
    expect(typeof pkg.scripts['publint']).toBe('string');
  });

  it('exposes script "attw"', () => {
    expect(pkg.scripts['attw']).toBeDefined();
    expect(typeof pkg.scripts['attw']).toBe('string');
  });

  it('"publint" script delegates to markeditor package', () => {
    expect(pkg.scripts['publint']).toContain('markeditor');
  });

  it('"attw" script delegates to markeditor package', () => {
    expect(pkg.scripts['attw']).toContain('markeditor');
  });
});
