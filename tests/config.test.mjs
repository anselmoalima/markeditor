import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');

function readJSON(rel) {
  return JSON.parse(readFileSync(resolve(root, rel), 'utf-8'));
}

test('tsconfig.base.json has required strict options', () => {
  const { compilerOptions: co } = readJSON('tsconfig.base.json');
  assert.equal(co.strict, true, 'strict must be true');
  assert.equal(co.noUncheckedIndexedAccess, true, 'noUncheckedIndexedAccess must be true');
  assert.equal(co.exactOptionalPropertyTypes, true, 'exactOptionalPropertyTypes must be true');
  assert.equal(co.moduleResolution, 'Bundler', 'moduleResolution must be Bundler');
  assert.equal(co.target, 'ES2022', 'target must be ES2022');
  assert.equal(co.module, 'ESNext', 'module must be ESNext');
  assert.equal(co.jsx, 'react-jsx', 'jsx must be react-jsx');
  assert.equal(co.isolatedModules, true, 'isolatedModules must be true');
  assert.equal(co.skipLibCheck, true, 'skipLibCheck must be true');
});

test('tsconfig.base.json does not set outDir, rootDir, include, or exclude', () => {
  const config = readJSON('tsconfig.base.json');
  const co = config.compilerOptions ?? {};
  assert.equal('outDir' in co, false, 'outDir must not be set (per-workspace)');
  assert.equal('rootDir' in co, false, 'rootDir must not be set (per-workspace)');
  assert.equal('include' in config, false, 'include must not be set (per-workspace)');
  assert.equal('exclude' in config, false, 'exclude must not be set (per-workspace)');
});

test('turbo.json parses and declares all required tasks', () => {
  const turbo = readJSON('turbo.json');
  const tasks = turbo.tasks ?? turbo.pipeline ?? {};
  const required = ['build', 'test', 'lint', 'typecheck', 'size', 'e2e'];
  for (const name of required) {
    assert.ok(name in tasks, `tasks.${name} is missing from turbo.json`);
  }
});

test('turbo.json build task has ^build dependsOn and dist/** output', () => {
  const { tasks } = readJSON('turbo.json');
  assert.deepEqual(tasks.build.dependsOn, ['^build']);
  assert.ok(tasks.build.outputs.includes('dist/**'), 'build outputs must include dist/**');
});

test('turbo.json test task declares coverage/** output', () => {
  const { tasks } = readJSON('turbo.json');
  assert.ok(tasks.test.outputs.includes('coverage/**'), 'test outputs must include coverage/**');
});

test('turbo.json does not declare remoteCache', () => {
  const turbo = readJSON('turbo.json');
  assert.equal(
    'remoteCache' in turbo,
    false,
    'remoteCache must not be present (local-only per ADR-001)',
  );
});

test('root package.json exposes required scripts', () => {
  const { scripts = {} } = readJSON('package.json');
  const required = ['build', 'test', 'lint', 'typecheck', 'size'];
  for (const name of required) {
    assert.ok(name in scripts, `scripts.${name} is missing from root package.json`);
  }
});

test('root package.json scripts delegate to turbo run (except lint)', () => {
  const { scripts = {} } = readJSON('package.json');
  for (const name of ['build', 'test', 'typecheck', 'size']) {
    assert.ok(scripts[name]?.includes('turbo run'), `scripts.${name} must delegate to turbo run`);
  }
  // lint runs eslint directly at root (flat config covers full tree)
  assert.ok(scripts['lint']?.includes('eslint'), 'scripts.lint must run eslint');
  assert.ok(
    scripts['lint']?.includes('--max-warnings 0'),
    'scripts.lint must use --max-warnings 0',
  );
});

test('root package.json has turbo in devDependencies', () => {
  const { devDependencies = {} } = readJSON('package.json');
  assert.ok('turbo' in devDependencies, 'turbo must be in devDependencies');
});
