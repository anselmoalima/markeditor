import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, it, expect } from 'vitest';

const __dirname = dirname(fileURLToPath(import.meta.url));

interface PackageJson {
  private?: boolean;
  type?: string;
  dependencies?: Record<string, string>;
}

const pkg = JSON.parse(
  readFileSync(resolve(__dirname, '../../package.json'), 'utf8'),
) as PackageJson;

const appSource = readFileSync(resolve(__dirname, '../../src/App.tsx'), 'utf8');

describe('package.json', () => {
  it('is marked private', () => {
    expect(pkg.private).toBe(true);
  });

  it('declares markeditor as workspace dependency', () => {
    expect(pkg.dependencies?.markeditor).toBe('workspace:*');
  });

  it('has type module', () => {
    expect(pkg.type).toBe('module');
  });
});

describe('App.tsx', () => {
  it('imports markeditor/styles', () => {
    expect(appSource).toMatch(/import ['"]markeditor\/styles['"]/);
  });
});
