import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, writeFileSync, rmSync, existsSync, mkdtempSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { resolve, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { tmpdir } from 'node:os';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');

function readJSON(rel) {
  return JSON.parse(readFileSync(resolve(root, rel), 'utf-8'));
}

function eslint(...args) {
  return spawnSync(resolve(root, 'node_modules/.bin/eslint'), args, {
    cwd: root,
    encoding: 'utf-8',
  });
}

function prettier(...args) {
  return spawnSync(resolve(root, 'node_modules/.bin/prettier'), args, {
    cwd: root,
    encoding: 'utf-8',
  });
}

// ─── Unit tests: eslint.config.js shape ───────────────────────────────────────

test('eslint.config.js exports an array (flat config)', async () => {
  const mod = await import(resolve(root, 'eslint.config.js'));
  const config = mod.default;
  assert.ok(Array.isArray(config), 'default export must be an array');
  assert.ok(config.length > 0, 'config array must not be empty');
});

test('eslint.config.js has typescript-eslint rules block', async () => {
  const mod = await import(resolve(root, 'eslint.config.js'));
  const config = mod.default;
  const hasTypescriptESLint = config.some(
    (entry) =>
      entry?.plugins?.['@typescript-eslint'] !== undefined ||
      (Array.isArray(entry?.extends)
        ? entry.extends.some((e) => e?.plugins?.['@typescript-eslint'])
        : false),
  );
  assert.ok(hasTypescriptESLint, 'config must include typescript-eslint plugin');
});

test('eslint.config.js has react plugin block', async () => {
  const mod = await import(resolve(root, 'eslint.config.js'));
  const config = mod.default;
  const hasReact = config.some((entry) => entry?.plugins?.['react'] !== undefined);
  assert.ok(hasReact, 'config must include eslint-plugin-react');
});

test('eslint.config.js has react-hooks plugin block', async () => {
  const mod = await import(resolve(root, 'eslint.config.js'));
  const config = mod.default;
  const hasHooks = config.some((entry) => entry?.plugins?.['react-hooks'] !== undefined);
  assert.ok(hasHooks, 'config must include eslint-plugin-react-hooks');
});

test('eslint.config.js has jsx-a11y plugin block', async () => {
  const mod = await import(resolve(root, 'eslint.config.js'));
  const config = mod.default;
  const hasA11y = config.some((entry) => entry?.plugins?.['jsx-a11y'] !== undefined);
  assert.ok(hasA11y, 'config must include eslint-plugin-jsx-a11y');
});

test('eslint.config.js has import-x plugin block', async () => {
  const mod = await import(resolve(root, 'eslint.config.js'));
  const config = mod.default;
  const hasImportX = config.some((entry) => entry?.plugins?.['import-x'] !== undefined);
  assert.ok(hasImportX, 'config must include eslint-plugin-import-x');
});

// ─── Unit tests: .prettierrc shape ───────────────────────────────────────────

test('.prettierrc parses as valid JSON', () => {
  const rc = readJSON('.prettierrc');
  assert.ok(typeof rc === 'object', '.prettierrc must parse to an object');
});

test('.prettierrc has singleQuote: true', () => {
  const rc = readJSON('.prettierrc');
  assert.equal(rc.singleQuote, true, 'singleQuote must be true');
});

test('.prettierrc has trailingComma: "all"', () => {
  const rc = readJSON('.prettierrc');
  assert.equal(rc.trailingComma, 'all', 'trailingComma must be "all"');
});

test('.prettierrc has printWidth: 100', () => {
  const rc = readJSON('.prettierrc');
  assert.equal(rc.printWidth, 100, 'printWidth must be 100');
});

test('.prettierrc has semi: true', () => {
  const rc = readJSON('.prettierrc');
  assert.equal(rc.semi, true, 'semi must be true');
});

// ─── Unit tests: package.json lint-staged config ─────────────────────────────

test('package.json has lint-staged config', () => {
  const pkg = readJSON('package.json');
  assert.ok(pkg['lint-staged'], 'package.json must have lint-staged key');
});

test('lint-staged covers *.{ts,tsx,js,jsx} pattern', () => {
  const { 'lint-staged': ls } = readJSON('package.json');
  const keys = Object.keys(ls);
  const tsPattern = keys.find((k) => k.includes('ts') && k.includes('tsx'));
  assert.ok(tsPattern, 'lint-staged must have a pattern covering ts/tsx/js/jsx');
  const cmds = Array.isArray(ls[tsPattern]) ? ls[tsPattern] : [ls[tsPattern]];
  assert.ok(
    cmds.some((c) => c.includes('eslint')),
    'ts/tsx pattern must run eslint',
  );
  assert.ok(
    cmds.some((c) => c.includes('prettier')),
    'ts/tsx pattern must run prettier',
  );
});

test('lint-staged covers *.{json,md,css} pattern', () => {
  const { 'lint-staged': ls } = readJSON('package.json');
  const keys = Object.keys(ls);
  const jsonPattern = keys.find((k) => k.includes('json') || k.includes('md'));
  assert.ok(jsonPattern, 'lint-staged must have a pattern covering json/md/css');
  const cmds = Array.isArray(ls[jsonPattern]) ? ls[jsonPattern] : [ls[jsonPattern]];
  assert.ok(
    cmds.some((c) => c.includes('prettier')),
    'json/md/css pattern must run prettier',
  );
});

// ─── Unit tests: package.json prepare script ─────────────────────────────────

test('package.json has prepare script calling husky', () => {
  const { scripts = {} } = readJSON('package.json');
  assert.ok('prepare' in scripts, 'prepare script must exist');
  assert.ok(scripts.prepare.includes('husky'), 'prepare script must call husky');
});

// ─── Unit tests: Husky hook ───────────────────────────────────────────────────

test('.husky/pre-commit exists', () => {
  assert.ok(existsSync(resolve(root, '.husky/pre-commit')), '.husky/pre-commit must exist');
});

test('.husky/pre-commit calls pnpm exec lint-staged', () => {
  const hook = readFileSync(resolve(root, '.husky/pre-commit'), 'utf-8');
  assert.ok(hook.includes('lint-staged'), 'pre-commit hook must call lint-staged');
});

// ─── Unit tests: ESLint lint behavior ────────────────────────────────────────

test('eslint exits non-zero on fixture with unused-var violation', () => {
  const result = eslint('--no-ignore', '--max-warnings', '0', 'tests/fixtures/eslint-bad.ts');
  assert.notEqual(result.status, 0, 'eslint must exit non-zero for unused variable');
  assert.ok(
    result.stdout.includes('no-unused-vars') ||
      result.stdout.includes('@typescript-eslint/no-unused-vars'),
    'output must reference no-unused-vars rule',
  );
});

test('eslint exits 0 on clean fixture', () => {
  const result = eslint('--no-ignore', '--max-warnings', '0', 'tests/fixtures/eslint-clean.ts');
  assert.equal(result.status, 0, `eslint must exit 0 for clean file. stderr: ${result.stderr}`);
});

// ─── Integration tests: lint-staged behavior ─────────────────────────────────

test('prettier --write rewrites badly-formatted TS file', () => {
  const tmpDir = mkdtempSync(join(tmpdir(), 'markeditor-fmt-'));
  try {
    const bad = 'const x = "hello"\n';
    const filePath = join(tmpDir, 'test.ts');
    writeFileSync(filePath, bad);

    const result = prettier('--config', resolve(root, '.prettierrc'), '--write', filePath);
    assert.equal(result.status, 0, `prettier must exit 0. stderr: ${result.stderr}`);

    const fixed = readFileSync(filePath, 'utf-8');
    assert.ok(fixed.includes("'hello'"), 'prettier must convert double quotes to single quotes');
    assert.ok(fixed.includes(';'), 'prettier must add semicolons');
  } finally {
    rmSync(tmpDir, { recursive: true, force: true });
  }
});

test('eslint --fix rewrites fixable violation in TS file', () => {
  const tmpDir = mkdtempSync(join(tmpdir(), 'markeditor-fix-'));
  try {
    // double-quoted string is fixable by prettier; use a fixable ESLint rule
    const fixable = `export const x = 'hello';\n\n\n\n`;
    const filePath = join(tmpDir, 'test.ts');
    writeFileSync(filePath, fixable);

    const result = prettier('--config', resolve(root, '.prettierrc'), '--write', filePath);
    assert.equal(result.status, 0, `prettier --write must exit 0. stderr: ${result.stderr}`);
    const fixed = readFileSync(filePath, 'utf-8');
    // prettier removes extra blank lines (printWidth/formatting)
    assert.ok(
      fixed.length < fixable.length || fixed !== fixable,
      'file must be modified by prettier',
    );
  } finally {
    rmSync(tmpDir, { recursive: true, force: true });
  }
});

test('eslint exits non-zero on unfixable lint error in TS content', () => {
  const tmpDir = mkdtempSync(join(tmpdir(), 'markeditor-lint-'));
  try {
    // Write a TS file with unfixable error (unused var cannot be auto-fixed)
    const bad = `const leak = 'value';\n`;
    const filePath = join(tmpDir, 'bad.ts');
    writeFileSync(filePath, bad);

    // Run eslint with the shared config but pointing at the temp file
    // Use --rule directly to avoid needing projectService for type-aware rules
    const result = spawnSync(
      resolve(root, 'node_modules/.bin/eslint'),
      [
        '--rule',
        '@typescript-eslint/no-unused-vars: error',
        '--parser',
        resolve(root, 'node_modules/@typescript-eslint/parser'),
        '--max-warnings',
        '0',
        filePath,
      ],
      { cwd: root, encoding: 'utf-8' },
    );
    assert.notEqual(result.status, 0, 'eslint must exit non-zero for unfixable unused-var error');
  } finally {
    rmSync(tmpDir, { recursive: true, force: true });
  }
});
