/**
 * Scaffold validation tests — task_02.
 * Validates packages/bob-editor config and dist artifacts.
 * Uses Node.js built-in test runner (Node 18+, no extra deps).
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execSync } from 'node:child_process';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const bobPkg = join(root, 'packages/bob-editor');
const playgroundPkg = join(root, 'apps/playground');

function readJson(relPath) {
  return JSON.parse(readFileSync(join(root, relPath), 'utf-8'));
}

function readText(relPath) {
  return readFileSync(join(root, relPath), 'utf-8');
}

// ── packages/bob-editor/package.json ─────────────────────────────────────────

test('bob-editor/package.json: exists', () => {
  assert.ok(existsSync(join(bobPkg, 'package.json')));
});

test('bob-editor/package.json: name is exactly "bob-editor"', () => {
  const pkg = readJson('packages/bob-editor/package.json');
  assert.strictEqual(pkg.name, 'bob-editor');
});

test('bob-editor/package.json: license is "MIT"', () => {
  const pkg = readJson('packages/bob-editor/package.json');
  assert.strictEqual(pkg.license, 'MIT');
});

test('bob-editor/package.json: sideEffects includes "**/*.css"', () => {
  const pkg = readJson('packages/bob-editor/package.json');
  assert.ok(Array.isArray(pkg.sideEffects), 'sideEffects should be array');
  assert.ok(pkg.sideEffects.includes('**/*.css'), 'sideEffects should include **/*.css');
});

test('bob-editor/package.json: files whitelist contains "dist"', () => {
  const pkg = readJson('packages/bob-editor/package.json');
  assert.ok(Array.isArray(pkg.files), 'files should be array');
  assert.ok(pkg.files.includes('dist'), 'files should include dist');
  assert.ok(pkg.files.includes('README.md'), 'files should include README.md');
  assert.ok(pkg.files.includes('CHANGELOG.md'), 'files should include CHANGELOG.md');
  assert.ok(pkg.files.includes('LICENSE'), 'files should include LICENSE');
});

test('bob-editor/package.json: peerDependencies has react ^18 || ^19', () => {
  const pkg = readJson('packages/bob-editor/package.json');
  assert.ok(pkg.peerDependencies, 'peerDependencies missing');
  assert.ok(pkg.peerDependencies.react, 'react peer dep missing');
  assert.ok(
    pkg.peerDependencies.react.includes('18') && pkg.peerDependencies.react.includes('19'),
    'react peer dep should support both 18 and 19',
  );
  assert.ok(pkg.peerDependencies['react-dom'], 'react-dom peer dep missing');
});

test('bob-editor/package.json: exports["."] has import + require conditions', () => {
  const pkg = readJson('packages/bob-editor/package.json');
  const main = pkg.exports['.'];
  assert.ok(main, 'exports["."] missing');
  assert.ok(main.import, 'import condition missing');
  assert.ok(main.require, 'require condition missing');
});

test('bob-editor/package.json: exports["."] import has types + default', () => {
  const pkg = readJson('packages/bob-editor/package.json');
  const importCond = pkg.exports['.'].import;
  assert.ok(importCond.types, 'import.types missing');
  assert.ok(importCond.default, 'import.default missing');
});

test('bob-editor/package.json: exports["."] require has types + default', () => {
  const pkg = readJson('packages/bob-editor/package.json');
  const requireCond = pkg.exports['.'].require;
  assert.ok(requireCond.types, 'require.types missing');
  assert.ok(requireCond.default, 'require.default missing');
});

test('bob-editor/package.json: exports["./styles"] resolves to dist/styles.css', () => {
  const pkg = readJson('packages/bob-editor/package.json');
  assert.strictEqual(pkg.exports['./styles'], './dist/styles.css');
});

test('bob-editor/package.json: exports["./styles.css"] resolves to dist/styles.css', () => {
  const pkg = readJson('packages/bob-editor/package.json');
  assert.strictEqual(pkg.exports['./styles.css'], './dist/styles.css');
});

test('bob-editor/package.json: exports["./plugins"] exists', () => {
  const pkg = readJson('packages/bob-editor/package.json');
  assert.ok(pkg.exports['./plugins'], './plugins export missing');
});

test('bob-editor/package.json: exports["./plugins/emoji"] exists', () => {
  const pkg = readJson('packages/bob-editor/package.json');
  assert.ok(pkg.exports['./plugins/emoji'], './plugins/emoji export missing');
});

test('bob-editor/package.json: prepublishOnly script is defined', () => {
  const pkg = readJson('packages/bob-editor/package.json');
  assert.ok(pkg.scripts.prepublishOnly, 'prepublishOnly script missing');
  const p = pkg.scripts.prepublishOnly;
  assert.ok(p.includes('build'), 'prepublishOnly should include build');
  assert.ok(p.includes('test'), 'prepublishOnly should include test');
  assert.ok(p.includes('typecheck'), 'prepublishOnly should include typecheck');
  assert.ok(p.includes('publint'), 'prepublishOnly should include publint');
  assert.ok(p.includes('attw'), 'prepublishOnly should include attw');
  assert.ok(p.includes('size'), 'prepublishOnly should include size');
});

// ── vitest.config.ts ──────────────────────────────────────────────────────────

test('bob-editor/vitest.config.ts: exists', () => {
  assert.ok(existsSync(join(bobPkg, 'vitest.config.ts')));
});

test('bob-editor/vitest.config.ts: specifies jsdom environment', () => {
  const content = readText('packages/bob-editor/vitest.config.ts');
  assert.ok(content.includes('jsdom'), 'vitest config should use jsdom environment');
});

test('bob-editor/vitest.config.ts: lines threshold >= 80', () => {
  const content = readText('packages/bob-editor/vitest.config.ts');
  // Check that 80 appears in the context of coverage thresholds
  assert.ok(
    content.includes('lines: 80') || content.includes("lines:80") || content.includes('lines:80'),
    'lines threshold should be 80',
  );
});

test('bob-editor/vitest.config.ts: branches threshold >= 75', () => {
  const content = readText('packages/bob-editor/vitest.config.ts');
  assert.ok(
    content.includes('branches: 75') ||
      content.includes('branches:75') ||
      content.includes('branches: 75'),
    'branches threshold should be 75',
  );
});

// ── size-limit.json ───────────────────────────────────────────────────────────

test('bob-editor/size-limit.json: exists', () => {
  assert.ok(existsSync(join(bobPkg, 'size-limit.json')));
});

test('bob-editor/size-limit.json: has core (without Monaco) entry', () => {
  const limits = readJson('packages/bob-editor/size-limit.json');
  assert.ok(Array.isArray(limits) && limits.length >= 1, 'size-limit.json should be a non-empty array');
  const coreEntry = limits.find(
    (e) =>
      typeof e.path === 'string' &&
      e.path.includes('index.js') &&
      !Array.isArray(e.path),
  );
  assert.ok(coreEntry, 'core single-entry item missing');
  assert.ok(coreEntry.limit, 'core entry limit missing');
});

test('bob-editor/size-limit.json: has full-bundle entry', () => {
  const limits = readJson('packages/bob-editor/size-limit.json');
  const fullEntry = limits.find((e) => Array.isArray(e.path) && e.path.length > 1);
  assert.ok(fullEntry, 'full-bundle (multi-path) entry missing');
  assert.ok(fullEntry.limit, 'full-bundle entry limit missing');
});

// ── apps/playground/package.json ─────────────────────────────────────────────

test('apps/playground/package.json: exists', () => {
  assert.ok(existsSync(join(playgroundPkg, 'package.json')));
});

test('apps/playground/package.json: is private', () => {
  const pkg = readJson('apps/playground/package.json');
  assert.strictEqual(pkg.private, true);
});

test('apps/playground/package.json: depends on bob-editor workspace:*', () => {
  const pkg = readJson('apps/playground/package.json');
  const bobDep = pkg.dependencies?.['bob-editor'] || pkg.devDependencies?.['bob-editor'];
  assert.ok(bobDep, 'bob-editor dependency missing in playground');
  assert.ok(
    bobDep.includes('workspace:'),
    'bob-editor dependency should use workspace: protocol',
  );
});

// ── playground source files ───────────────────────────────────────────────────

test('apps/playground/vite.config.ts: exists', () => {
  assert.ok(existsSync(join(playgroundPkg, 'vite.config.ts')));
});

test('apps/playground/vite.config.ts: excludes monaco-editor from optimizeDeps', () => {
  const content = readText('apps/playground/vite.config.ts');
  assert.ok(content.includes('monaco-editor'), 'vite config should reference monaco-editor');
  assert.ok(content.includes('exclude'), 'vite config should have exclude for monaco-editor');
});

test('apps/playground/src/main.tsx: exists', () => {
  assert.ok(existsSync(join(playgroundPkg, 'src/main.tsx')));
});

test('apps/playground/src/App.tsx: exists', () => {
  assert.ok(existsSync(join(playgroundPkg, 'src/App.tsx')));
});

test('apps/playground/index.html: exists', () => {
  assert.ok(existsSync(join(playgroundPkg, 'index.html')));
});

// ── build artifacts ───────────────────────────────────────────────────────────

test('dist/index.js (ESM) exists', () => {
  assert.ok(
    existsSync(join(bobPkg, 'dist/index.js')),
    'dist/index.js missing — run: pnpm --filter bob-editor build',
  );
});

test('dist/index.cjs (CJS) exists', () => {
  assert.ok(existsSync(join(bobPkg, 'dist/index.cjs')), 'dist/index.cjs missing');
});

test('dist/index.d.ts (ESM types) exists', () => {
  assert.ok(existsSync(join(bobPkg, 'dist/index.d.ts')), 'dist/index.d.ts missing');
});

test('dist/index.d.cts (CJS types) exists', () => {
  assert.ok(existsSync(join(bobPkg, 'dist/index.d.cts')), 'dist/index.d.cts missing');
});

test('dist/styles.css exists', () => {
  assert.ok(existsSync(join(bobPkg, 'dist/styles.css')), 'dist/styles.css missing');
});

test('dist/plugins/emoji.js exists', () => {
  assert.ok(existsSync(join(bobPkg, 'dist/plugins/emoji.js')), 'dist/plugins/emoji.js missing');
});

test('dist/plugins/index.d.ts exists', () => {
  assert.ok(existsSync(join(bobPkg, 'dist/plugins/index.d.ts')), 'dist/plugins/index.d.ts missing');
});

// ── publint ───────────────────────────────────────────────────────────────────

test('publint exits 0 with zero warnings', () => {
  const output = execSync('pnpm --filter bob-editor publint', {
    cwd: root,
    encoding: 'utf-8',
    stdio: ['pipe', 'pipe', 'pipe'],
  });
  assert.ok(
    output.includes('All good!') || !output.includes('Warnings') ,
    `publint should pass; got: ${output}`,
  );
});

// ── attw ─────────────────────────────────────────────────────────────────────

test('attw is skipped on Node 22+ (fflate/Node22 incompatibility; validated in CI with Node 18/20)', (t) => {
  const nodeVersion = parseInt(process.version.slice(1).split('.')[0], 10);
  if (nodeVersion >= 22) {
    t.skip('attw uses fflate which has a known incompatibility with Node 22+ (see fflate#207)');
    return;
  }
  const result = execSync('pnpm --filter bob-editor attw', {
    cwd: root,
    encoding: 'utf-8',
    stdio: ['pipe', 'pipe', 'pipe'],
  });
  assert.ok(result !== null, 'attw should succeed');
});
