/**
 * Infrastructure smoke tests — validates config files without external deps.
 * Uses Node.js built-in test runner (available from Node 18+).
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');

function readJson(relPath) {
  return JSON.parse(readFileSync(join(root, relPath), 'utf-8'));
}

function readText(relPath) {
  return readFileSync(join(root, relPath), 'utf-8');
}

// ── pnpm-workspace.yaml ──────────────────────────────────────────────────────

test('pnpm-workspace.yaml: exists', () => {
  assert.ok(existsSync(join(root, 'pnpm-workspace.yaml')));
});

test('pnpm-workspace.yaml: lists packages/*', () => {
  const content = readText('pnpm-workspace.yaml');
  assert.ok(content.includes("'packages/*'") || content.includes('"packages/*"') || content.includes('packages/*'));
});

test('pnpm-workspace.yaml: lists apps/*', () => {
  const content = readText('pnpm-workspace.yaml');
  assert.ok(content.includes("'apps/*'") || content.includes('"apps/*"') || content.includes('apps/*'));
});

// ── turbo.json ───────────────────────────────────────────────────────────────

test('turbo.json: is valid JSON', () => {
  const turbo = readJson('turbo.json');
  assert.ok(turbo !== null);
});

test('turbo.json: has build task', () => {
  const { tasks } = readJson('turbo.json');
  assert.ok(tasks.build, 'build task missing');
});

test('turbo.json: build.dependsOn is ["^build"]', () => {
  const { tasks } = readJson('turbo.json');
  assert.deepEqual(tasks.build.dependsOn, ['^build']);
});

test('turbo.json: has test task', () => {
  const { tasks } = readJson('turbo.json');
  assert.ok(tasks.test, 'test task missing');
});

test('turbo.json: has typecheck task', () => {
  const { tasks } = readJson('turbo.json');
  assert.ok(tasks.typecheck, 'typecheck task missing');
});

test('turbo.json: has lint task', () => {
  const { tasks } = readJson('turbo.json');
  assert.ok(tasks.lint, 'lint task missing');
});

test('turbo.json: has size task', () => {
  const { tasks } = readJson('turbo.json');
  assert.ok(tasks.size, 'size task missing');
});

test('turbo.json: has e2e task', () => {
  const { tasks } = readJson('turbo.json');
  assert.ok(tasks.e2e, 'e2e task missing');
});

test('turbo.json: has test:types task', () => {
  const { tasks } = readJson('turbo.json');
  assert.ok(tasks['test:types'], 'test:types task missing');
});

// ── tsconfig.base.json ───────────────────────────────────────────────────────

test('tsconfig.base.json: is valid JSON', () => {
  const tsconfig = readJson('tsconfig.base.json');
  assert.ok(tsconfig !== null);
});

test('tsconfig.base.json: strict is true', () => {
  const { compilerOptions } = readJson('tsconfig.base.json');
  assert.strictEqual(compilerOptions.strict, true);
});

test('tsconfig.base.json: noUncheckedIndexedAccess is true', () => {
  const { compilerOptions } = readJson('tsconfig.base.json');
  assert.strictEqual(compilerOptions.noUncheckedIndexedAccess, true);
});

test('tsconfig.base.json: exactOptionalPropertyTypes is true', () => {
  const { compilerOptions } = readJson('tsconfig.base.json');
  assert.strictEqual(compilerOptions.exactOptionalPropertyTypes, true);
});

// ── .changeset/config.json ───────────────────────────────────────────────────

test('.changeset/config.json: exists', () => {
  assert.ok(existsSync(join(root, '.changeset/config.json')));
});

test('.changeset/config.json: access is "public"', () => {
  const config = readJson('.changeset/config.json');
  assert.strictEqual(config.access, 'public');
});

test('.changeset/config.json: baseBranch is set', () => {
  const config = readJson('.changeset/config.json');
  assert.ok(config.baseBranch === 'main' || config.baseBranch === 'master');
});

test('.changeset/config.json: ignore is an array', () => {
  const config = readJson('.changeset/config.json');
  assert.ok(Array.isArray(config.ignore));
});

// ── root package.json ────────────────────────────────────────────────────────

test('package.json: is private', () => {
  const pkg = readJson('package.json');
  assert.strictEqual(pkg.private, true);
});

test('package.json: has "build" script using turbo', () => {
  const { scripts } = readJson('package.json');
  assert.ok(scripts.build, 'build script missing');
  assert.ok(scripts.build.includes('turbo'), 'build script should use turbo');
});

test('package.json: has "test" script', () => {
  const { scripts } = readJson('package.json');
  assert.ok(scripts.test, 'test script missing');
});

test('package.json: has "typecheck" script', () => {
  const { scripts } = readJson('package.json');
  assert.ok(scripts.typecheck, 'typecheck script missing');
});

test('package.json: has "lint" script', () => {
  const { scripts } = readJson('package.json');
  assert.ok(scripts.lint, 'lint script missing');
});

// ── required root files ──────────────────────────────────────────────────────

test('LICENSE: exists', () => {
  assert.ok(existsSync(join(root, 'LICENSE')));
});

test('LICENSE: is MIT', () => {
  const content = readText('LICENSE');
  assert.ok(content.includes('MIT License'));
});

test('.nvmrc: exists and contains "18"', () => {
  assert.ok(existsSync(join(root, '.nvmrc')));
  const content = readText('.nvmrc').trim();
  assert.strictEqual(content, '18');
});

test('.editorconfig: exists', () => {
  assert.ok(existsSync(join(root, '.editorconfig')));
});

test('.prettierrc: exists', () => {
  assert.ok(existsSync(join(root, '.prettierrc')));
});

test('eslint.config.js: exists', () => {
  assert.ok(existsSync(join(root, 'eslint.config.js')));
});

test('CONTRIBUTING.md: exists', () => {
  assert.ok(existsSync(join(root, 'CONTRIBUTING.md')));
});

test('README.md: exists', () => {
  assert.ok(existsSync(join(root, 'README.md')));
});

// ── GitHub workflows ─────────────────────────────────────────────────────────

test('.github/workflows/ci.yml: exists', () => {
  assert.ok(existsSync(join(root, '.github/workflows/ci.yml')));
});

test('.github/workflows/release.yml: exists', () => {
  assert.ok(existsSync(join(root, '.github/workflows/release.yml')));
});

test('.github/workflows/size.yml: exists', () => {
  assert.ok(existsSync(join(root, '.github/workflows/size.yml')));
});

test('ci.yml: contains Node 18 matrix entry', () => {
  const content = readText('.github/workflows/ci.yml');
  assert.ok(content.includes("'18'") || content.includes('"18"'));
});

test('ci.yml: contains Node 20 matrix entry', () => {
  const content = readText('.github/workflows/ci.yml');
  assert.ok(content.includes("'20'") || content.includes('"20"'));
});

test('ci.yml: contains Node 22 matrix entry', () => {
  const content = readText('.github/workflows/ci.yml');
  assert.ok(content.includes("'22'") || content.includes('"22"'));
});

test('ci.yml: contains React 18 matrix entry', () => {
  const content = readText('.github/workflows/ci.yml');
  assert.ok(content.includes("'18'") || content.includes('"18"'));
});

test('ci.yml: contains React 19 matrix entry', () => {
  const content = readText('.github/workflows/ci.yml');
  assert.ok(content.includes("'19'") || content.includes('"19"'));
});

test('ci.yml: uses frozen-lockfile', () => {
  const content = readText('.github/workflows/ci.yml');
  assert.ok(content.includes('--frozen-lockfile'));
});

test('release.yml: contains id-token write permission', () => {
  const content = readText('.github/workflows/release.yml');
  assert.ok(content.includes('id-token') && content.includes('write'));
});

test('release.yml: uses NPM_CONFIG_PROVENANCE', () => {
  const content = readText('.github/workflows/release.yml');
  assert.ok(content.includes('NPM_CONFIG_PROVENANCE'));
});

test('release.yml: uses changesets/action', () => {
  const content = readText('.github/workflows/release.yml');
  assert.ok(content.includes('changesets/action'));
});
