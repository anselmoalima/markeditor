import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, it, expect } from 'vitest';

const __dirname = dirname(fileURLToPath(import.meta.url));
const pkgDir = resolve(__dirname, '../..');
const rootDir = resolve(pkgDir, '../..');

const rootReadme = readFileSync(resolve(rootDir, 'README.md'), 'utf8');
const pkgReadme = readFileSync(resolve(pkgDir, 'README.md'), 'utf8');
const contributing = readFileSync(resolve(rootDir, 'CONTRIBUTING.md'), 'utf8');

describe('root README.md', () => {
  it('contains ## Install section', () => {
    expect(rootReadme).toMatch(/^## Install/m);
  });

  it('contains pnpm add markeditor snippet', () => {
    expect(rootReadme).toContain('pnpm add markeditor');
  });

  it('contains npm version badge', () => {
    expect(rootReadme).toMatch(/img\.shields\.io\/npm\/v\/markeditor/);
  });

  it('contains CI badge', () => {
    expect(rootReadme).toMatch(
      /github\.com\/anselmoalima\/markeditor\/actions\/workflows\/ci\.yml\/badge\.svg/,
    );
  });

  it('contains Codecov coverage badge', () => {
    expect(rootReadme).toMatch(/codecov\.io\/gh\/anselmoalima\/markeditor/);
  });

  it('contains bundlephobia size badge', () => {
    expect(rootReadme).toMatch(/img\.shields\.io\/bundlephobia\/minzip\/markeditor/);
  });

  it('contains license badge', () => {
    expect(rootReadme).toMatch(/img\.shields\.io\/github\/license\/anselmoalima\/markeditor/);
  });

  it('links to PRD.md', () => {
    expect(rootReadme).toContain('PRD.md');
  });

  it('links to DESIGN.md', () => {
    expect(rootReadme).toContain('DESIGN.md');
  });

  it('links to CONTRIBUTING.md', () => {
    expect(rootReadme).toContain('CONTRIBUTING.md');
  });

  it('contains MIT license footer', () => {
    expect(rootReadme).toMatch(/MIT/);
  });
});

describe('packages/markeditor/README.md', () => {
  it('contains ## Install section', () => {
    expect(pkgReadme).toMatch(/^## Install/m);
  });

  it('contains pnpm add markeditor snippet', () => {
    expect(pkgReadme).toContain('pnpm add markeditor');
  });

  it('contains MarkEditor import in usage snippet', () => {
    expect(pkgReadme).toContain("from 'markeditor'");
    expect(pkgReadme).toContain('MarkEditor');
  });

  it('contains markeditor/styles import in usage snippet', () => {
    expect(pkgReadme).toContain('markeditor/styles');
  });

  it('contains npm version badge', () => {
    expect(pkgReadme).toMatch(/img\.shields\.io\/npm\/v\/markeditor/);
  });

  it('contains CI badge', () => {
    expect(pkgReadme).toMatch(
      /github\.com\/anselmoalima\/markeditor\/actions\/workflows\/ci\.yml\/badge\.svg/,
    );
  });

  it('contains MIT license', () => {
    expect(pkgReadme).toMatch(/MIT/);
  });
});

describe('CONTRIBUTING.md', () => {
  it('contains Setup section', () => {
    expect(contributing).toMatch(/^## Setup/m);
  });

  it('contains Common Commands section', () => {
    expect(contributing).toMatch(/^## Common Commands/m);
  });

  it('contains Tests section', () => {
    expect(contributing).toMatch(/^## Tests/m);
  });

  it('contains Changesets section', () => {
    expect(contributing).toMatch(/^## Changesets/m);
  });

  it('contains Release section', () => {
    expect(contributing).toMatch(/^## Release/m);
  });

  it('references TDD policy', () => {
    expect(contributing).toMatch(/TDD|Red.*Green|failing test/i);
  });

  it('references OIDC in release section', () => {
    expect(contributing).toMatch(/OIDC/);
  });

  it('references branch protection', () => {
    expect(contributing).toMatch(/[Bb]ranch protection/);
  });

  it('references Corepack for pnpm setup', () => {
    expect(contributing).toMatch(/[Cc]orepack/);
  });

  it('references pnpm changeset command', () => {
    expect(contributing).toContain('pnpm changeset');
  });
});
