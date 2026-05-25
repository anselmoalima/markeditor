// @vitest-environment node

import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const pkgRoot = resolve(__dirname, '../..');

function readJSON<T>(relPath: string): T {
  return JSON.parse(readFileSync(resolve(pkgRoot, relPath), 'utf-8')) as T;
}

interface ExportsCondition {
  types: string;
  default: string;
}

interface PkgJson {
  name: string;
  license: string;
  sideEffects: string[];
  files: string[];
  exports: Record<string, unknown>;
  peerDependencies: Record<string, string>;
}

interface SizeLimitEntry {
  name: string;
  path: string | string[];
  limit: string;
  gzip?: boolean;
}

describe('package.json', () => {
  const pkg = readJSON<PkgJson>('package.json');

  it('name is "bob-editor"', () => {
    expect(pkg.name).toBe('bob-editor');
  });

  it('license is MIT', () => {
    expect(pkg.license).toBe('MIT');
  });

  it('sideEffects includes "**/*.css"', () => {
    expect(pkg.sideEffects).toContain('**/*.css');
  });

  it('files whitelist contains required entries', () => {
    expect(pkg.files).toContain('dist');
    expect(pkg.files).toContain('README.md');
    expect(pkg.files).toContain('CHANGELOG.md');
    expect(pkg.files).toContain('LICENSE');
  });

  it('exports["."] has import + require conditions each with types', () => {
    const dotExport = pkg.exports['.'] as Record<string, ExportsCondition>;
    expect(dotExport).toHaveProperty('import');
    expect(dotExport).toHaveProperty('require');
    expect(dotExport['import']).toHaveProperty('types');
    expect(dotExport['require']).toHaveProperty('types');
  });

  it('exports["./styles"] resolves to dist/styles.css', () => {
    expect(pkg.exports['./styles']).toBe('./dist/styles.css');
  });

  it('exports["./styles.css"] resolves to dist/styles.css', () => {
    expect(pkg.exports['./styles.css']).toBe('./dist/styles.css');
  });

  it('peerDependencies declare react ^18 || ^19', () => {
    expect(pkg.peerDependencies['react']).toMatch(/\^18/);
    expect(pkg.peerDependencies['react']).toMatch(/\^19/);
  });

  it('peerDependencies declare react-dom', () => {
    expect(pkg.peerDependencies['react-dom']).toBeDefined();
  });

  it('exports["./package.json"] is defined', () => {
    expect(pkg.exports['./package.json']).toBe('./package.json');
  });
});

describe('size-limit.json', () => {
  const limits = readJSON<SizeLimitEntry[]>('size-limit.json');

  it('has core-without-monaco entry with 80 kB limit', () => {
    const core = limits.find(
      (e) => e.name.toLowerCase().includes('without') || e.name.toLowerCase().includes('core'),
    );
    expect(core, 'core-without-monaco entry').toBeDefined();
    expect(core!.limit).toBe('80 kB');
  });

  it('has full-bundle entry with 500 kB limit', () => {
    const full = limits.find((e) => e.name.toLowerCase().includes('full'));
    expect(full, 'full-bundle entry').toBeDefined();
    expect(full!.limit).toBe('500 kB');
  });

  it('all entries have gzip enabled', () => {
    for (const entry of limits) {
      if (entry.gzip !== undefined) {
        expect(entry.gzip).toBe(true);
      }
    }
  });
});

describe('vitest.config.ts thresholds', () => {
  const text = readFileSync(resolve(pkgRoot, 'vitest.config.ts'), 'utf-8');

  it('lines threshold is 80', () => {
    expect(text).toMatch(/lines:\s*80/);
  });

  it('branches threshold is 75', () => {
    expect(text).toMatch(/branches:\s*75/);
  });

  it('environment is jsdom', () => {
    expect(text).toMatch(/environment:\s*['"]jsdom['"]/);
  });

  it('coverage provider is v8', () => {
    expect(text).toMatch(/provider:\s*['"]v8['"]/);
  });
});
