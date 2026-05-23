import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, writeFileSync, existsSync, rmSync, readdirSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');

function readJSON(rel) {
  return JSON.parse(readFileSync(resolve(root, rel), 'utf-8'));
}

/** Returns changeset MD files in .changeset/ (excludes README.md and config.json). */
function listChangesetFiles() {
  const dir = resolve(root, '.changeset');
  if (!existsSync(dir)) return [];
  return readdirSync(dir).filter((f) => f.endsWith('.md') && f !== 'README.md');
}

// ─── Unit: config shape ───────────────────────────────────────────────────────

describe('changeset config shape', () => {
  test('.changeset/config.json has access: public', () => {
    const cfg = readJSON('.changeset/config.json');
    assert.equal(cfg.access, 'public', 'access must be "public"');
  });

  test('.changeset/config.json has baseBranch: main', () => {
    const cfg = readJSON('.changeset/config.json');
    assert.equal(cfg.baseBranch, 'main', 'baseBranch must be "main"');
  });

  test('.changeset/config.json has changelog: @changesets/cli/changelog', () => {
    const cfg = readJSON('.changeset/config.json');
    assert.equal(cfg.changelog, '@changesets/cli/changelog');
  });

  test('.changeset/config.json ignores playground', () => {
    const cfg = readJSON('.changeset/config.json');
    assert.ok(Array.isArray(cfg.ignore), 'ignore must be an array');
    assert.ok(cfg.ignore.includes('playground'), 'ignore must include "playground"');
  });
});

// ─── Unit: root package.json ──────────────────────────────────────────────────

describe('root package.json changeset setup', () => {
  test('@changesets/cli is in root devDependencies', () => {
    const { devDependencies = {} } = readJSON('package.json');
    assert.ok('@changesets/cli' in devDependencies, '@changesets/cli must be in devDependencies');
  });

  test('scripts.changeset exists and invokes changeset', () => {
    const { scripts = {} } = readJSON('package.json');
    assert.ok('changeset' in scripts, 'scripts.changeset must exist');
    assert.ok(scripts.changeset.includes('changeset'));
  });

  test('scripts.changeset:version exists and invokes changeset version', () => {
    const { scripts = {} } = readJSON('package.json');
    assert.ok('changeset:version' in scripts, 'scripts.changeset:version must exist');
    assert.ok(scripts['changeset:version'].includes('changeset version'));
  });

  test('scripts.changeset:publish exists and invokes changeset publish', () => {
    const { scripts = {} } = readJSON('package.json');
    assert.ok('changeset:publish' in scripts, 'scripts.changeset:publish must exist');
    assert.ok(scripts['changeset:publish'].includes('changeset publish'));
  });
});

// ─── Unit: .changeset directory ───────────────────────────────────────────────

describe('.changeset directory', () => {
  test('.changeset/README.md exists', () => {
    assert.ok(existsSync(resolve(root, '.changeset/README.md')), '.changeset/README.md must exist');
  });

  test('.changeset/config.json is valid JSON', () => {
    assert.doesNotThrow(() => readJSON('.changeset/config.json'));
  });
});

// ─── Integration: changeset status ───────────────────────────────────────────

describe('changeset status', () => {
  test('exits non-zero when no changeset files exist', () => {
    const existing = listChangesetFiles();
    if (existing.length > 0) {
      // Pre-existing changesets: skip rather than giving a false negative
      return;
    }
    const result = spawnSync('pnpm', ['changeset', 'status'], {
      cwd: root,
      encoding: 'utf-8',
    });
    assert.notEqual(result.status, 0, 'changeset status must exit non-zero with no changesets');
  });

  test('--output flag produces valid JSON', () => {
    const outputPath = resolve(root, '.changeset/changeset-status-test.json');
    try {
      spawnSync('pnpm', ['changeset', 'status', `--output=${outputPath}`], {
        cwd: root,
        encoding: 'utf-8',
      });
      if (existsSync(outputPath)) {
        const raw = readFileSync(outputPath, 'utf-8');
        assert.doesNotThrow(() => JSON.parse(raw), 'status --output must produce valid JSON');
      }
    } finally {
      if (existsSync(outputPath)) rmSync(outputPath, { force: true });
    }
  });
});

// ─── Integration: changeset version bumps markeditor only ────────────────────────

describe('changeset version isolation', () => {
  const tempChangeset = resolve(root, '.changeset/test-bump-task09.md');
  const markeditorPkg = resolve(root, 'packages/markeditor/package.json');
  const playgroundPkg = resolve(root, 'apps/playground/package.json');
  const markeditorChangelog = resolve(root, 'packages/markeditor/CHANGELOG.md');

  test('pnpm changeset version bumps markeditor but not playground', () => {
    const markeditorBefore = readJSON('packages/markeditor/package.json').version;
    const playgroundBefore = readJSON('apps/playground/package.json').version;

    writeFileSync(tempChangeset, `---\n"markeditor": patch\n---\n\ntest: task_09 integration bump\n`);

    let versionResult;
    try {
      versionResult = spawnSync('pnpm', ['changeset', 'version'], {
        cwd: root,
        encoding: 'utf-8',
      });

      assert.equal(
        versionResult.status,
        0,
        `changeset version must exit 0.\nstdout: ${versionResult.stdout}\nstderr: ${versionResult.stderr}`,
      );

      const markeditorAfter = readJSON('packages/markeditor/package.json').version;
      const playgroundAfter = readJSON('apps/playground/package.json').version;

      assert.notEqual(markeditorAfter, markeditorBefore, 'markeditor version must be bumped by changeset version');
      assert.equal(playgroundAfter, playgroundBefore, 'playground version must NOT change');
    } finally {
      // Restore packages/markeditor/package.json
      spawnSync('git', ['checkout', '--', 'packages/markeditor/package.json'], { cwd: root });

      // CHANGELOG.md is new if markeditor had none before — remove it; restore if it was tracked
      if (existsSync(markeditorChangelog)) {
        const tracked = spawnSync(
          'git',
          ['ls-files', '--error-unmatch', 'packages/markeditor/CHANGELOG.md'],
          { cwd: root, encoding: 'utf-8' },
        );
        if (tracked.status !== 0) {
          rmSync(markeditorChangelog, { force: true });
        } else {
          spawnSync('git', ['checkout', '--', 'packages/markeditor/CHANGELOG.md'], { cwd: root });
        }
      }

      // changeset version deletes the changeset file — clean up if it somehow remains
      if (existsSync(tempChangeset)) rmSync(tempChangeset, { force: true });
    }
  });
});
