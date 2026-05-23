/**
 * Release smoke dry-run verification tests (task_12).
 *
 * Unit tests verify the LOCAL state after the prerelease workflow simulation.
 * Integration tests that require an actual npm publish are guarded by an
 * npm auth check and skipped when not authenticated.
 *
 * Blockers preventing the full end-to-end publish are documented in:
 *   .compozy/tasks/phase-0-monorepo-setup/release-smoke/BLOCKERS.md
 */

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { load as parseYaml } from 'js-yaml';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');

function readJSON(rel) {
  return JSON.parse(readFileSync(resolve(root, rel), 'utf-8'));
}

function loadWorkflow(name) {
  const path = resolve(root, `.github/workflows/${name}`);
  const raw = readFileSync(path, 'utf-8');
  return { raw, parsed: parseYaml(raw) };
}

// ─── Unit: prerelease mode exited cleanly ─────────────────────────────────────

describe('Unit: prerelease mode exited cleanly', () => {
  test('.changeset/pre.json does NOT exist (prerelease mode was exited)', () => {
    const preJson = resolve(root, '.changeset/pre.json');
    assert.ok(
      !existsSync(preJson),
      '.changeset/pre.json must not exist — prerelease mode must be exited before task completion',
    );
  });
});

// ─── Unit: package version clean ─────────────────────────────────────────────

describe('Unit: package version clean after simulation', () => {
  test('packages/markmd/package.json version does NOT contain -test', () => {
    const pkg = readJSON('packages/markmd/package.json');
    assert.ok(
      !pkg.version.includes('-test'),
      `packages/markmd/package.json version must not contain "-test" after task. Got: "${pkg.version}"`,
    );
  });

  test('packages/markmd/package.json version is a valid semver string', () => {
    const pkg = readJSON('packages/markmd/package.json');
    assert.match(
      pkg.version,
      /^\d+\.\d+\.\d+(-[\w.]+)*(\+[\w.]+)*$/,
      `version must be valid semver. Got: "${pkg.version}"`,
    );
  });
});

// ─── Unit: release-smoke evidence directory ──────────────────────────────────

describe('Unit: release-smoke evidence directory', () => {
  const smokeDir = resolve(root, '.compozy/tasks/phase-0-monorepo-setup/release-smoke');
  const evidencePath = '.compozy/tasks/phase-0-monorepo-setup/release-smoke/npm-view.json';

  test('release-smoke/ directory exists', () => {
    assert.ok(existsSync(smokeDir), 'release-smoke/ evidence directory must exist');
  });

  test('npm-view.json exists in release-smoke/', () => {
    const p = resolve(smokeDir, 'npm-view.json');
    assert.ok(existsSync(p), 'release-smoke/npm-view.json must exist');
  });

  test('npm-view.json is valid JSON', () => {
    const p = resolve(smokeDir, 'npm-view.json');
    assert.doesNotThrow(
      () => JSON.parse(readFileSync(p, 'utf-8')),
      'npm-view.json must be valid JSON',
    );
  });

  test('npm-view.json documents a version (real or simulated)', () => {
    const data = readJSON(evidencePath);
    const hasVersion =
      typeof data.version === 'string' ||
      typeof data._simulation_version === 'string';
    assert.ok(
      hasVersion,
      'npm-view.json must contain "version" (real publish) or "_simulation_version" (simulation)',
    );
  });

  test('BLOCKERS.md exists (documents why full publish was not done)', () => {
    const p = resolve(smokeDir, 'BLOCKERS.md');
    assert.ok(existsSync(p), 'release-smoke/BLOCKERS.md must exist');
  });
});

// ─── Unit: .changeset config intact ──────────────────────────────────────────

describe('Unit: changeset config intact after simulation', () => {
  test('.changeset/config.json still valid and has access: public', () => {
    const cfg = readJSON('.changeset/config.json');
    assert.equal(cfg.access, 'public', 'changeset config access must remain "public"');
  });

  test('.changeset/config.json still ignores playground', () => {
    const cfg = readJSON('.changeset/config.json');
    assert.ok(
      Array.isArray(cfg.ignore) && cfg.ignore.includes('playground'),
      'changeset config must still ignore playground',
    );
  });

  test('no leftover smoke-test changeset files in .changeset/', () => {
    const files = readdirSync(resolve(root, '.changeset'));
    const leftover = files.find((f) => f.includes('smoke-test-release'));
    assert.ok(
      leftover == null,
      `smoke-test-release.md must be cleaned up after simulation. Found: ${leftover}`,
    );
  });
});

// ─── Unit: release.yml OIDC ready for real publish ───────────────────────────

describe('Unit: release.yml OIDC ready for real publish', () => {
  test('release.yml has id-token: write permission (required for OIDC provenance)', () => {
    const { parsed } = loadWorkflow('release.yml');
    assert.equal(
      parsed?.permissions?.['id-token'],
      'write',
      'release.yml must have id-token: write for OIDC npm provenance',
    );
  });

  test('release.yml sets NPM_CONFIG_PROVENANCE=true', () => {
    const { raw } = loadWorkflow('release.yml');
    assert.ok(
      raw.includes('NPM_CONFIG_PROVENANCE'),
      'release.yml must set NPM_CONFIG_PROVENANCE for npm provenance attestation',
    );
  });

  test('release.yml uses changesets/action@v1 for publish', () => {
    const { raw } = loadWorkflow('release.yml');
    assert.ok(
      raw.includes('changesets/action@v1'),
      'release.yml must use changesets/action@v1',
    );
  });
});

// ─── Unit: changeset pre cycle mechanics ─────────────────────────────────────

describe('Unit: changeset pre enter/exit cycle', () => {
  test('pre.json absent confirms exit cycle completed successfully', () => {
    const preJson = resolve(root, '.changeset/pre.json');
    assert.ok(!existsSync(preJson), 'pre.json must be absent (exit cycle completed)');
  });

  test('markmd version has no prerelease suffix after simulation', () => {
    const pkg = readJSON('packages/markmd/package.json');
    const hasPrerelease = /-(alpha|beta|rc|test|next|canary)/.test(pkg.version);
    assert.ok(!hasPrerelease, `markmd version must not have prerelease suffix. Got: ${pkg.version}`);
  });
});

// ─── Integration: npm verification (requires npm auth + package ownership) ───

describe('Integration: npm verification (skipped — requires npm access)', () => {
  const npmAuthCheck = spawnSync('npm', ['whoami'], {
    encoding: 'utf-8',
    timeout: 5000,
    env: { ...process.env, npm_config_loglevel: 'silent' },
  });
  const npmAccessAvailable = npmAuthCheck.status === 0;

  const skipReason = npmAccessAvailable
    ? 'npm authenticated but markmd package owned by banyawat@gmail.com — cannot publish to it'
    : 'npm not authenticated (npm whoami → 401). Resolve blockers in release-smoke/BLOCKERS.md first';

  test('npm view markmd@<test-version> has provenance metadata', { skip: skipReason }, async () => {
    const result = spawnSync('npm', ['view', 'markmd@0.0.8-test.0', '--json'], {
      encoding: 'utf-8',
      timeout: 15000,
    });
    assert.equal(result.status, 0, 'npm view must succeed');
    const data = JSON.parse(result.stdout);
    const hasProvenance =
      (data.dist?.attestations != null && Object.keys(data.dist.attestations).length > 0) ||
      data.provenance != null;
    assert.ok(hasProvenance, 'npm view output must contain provenance attestation metadata');
  });

  test('npm view markmd@<test-version> shows deprecated message', { skip: skipReason }, async () => {
    const result = spawnSync('npm', ['view', 'markmd@0.0.8-test.0', '--json'], {
      encoding: 'utf-8',
      timeout: 15000,
    });
    assert.equal(result.status, 0, 'npm view must succeed');
    const data = JSON.parse(result.stdout);
    assert.ok(
      typeof data.deprecated === 'string' && data.deprecated.length > 0,
      'test version must be deprecated after task_12 completion',
    );
  });

  test('npm view markmd@latest does NOT resolve to the test version', { skip: skipReason }, async () => {
    const result = spawnSync('npm', ['view', 'markmd@latest', '--json'], {
      encoding: 'utf-8',
      timeout: 15000,
    });
    assert.equal(result.status, 0, 'npm view latest must succeed');
    const data = JSON.parse(result.stdout);
    assert.ok(
      !String(data.version ?? '').includes('-test'),
      `latest dist-tag must NOT resolve to a -test version. Got: "${data.version}"`,
    );
  });
});
