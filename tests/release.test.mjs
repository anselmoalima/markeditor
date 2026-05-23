import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { load as parseYaml } from 'js-yaml';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');

function loadWorkflow(name) {
  const path = resolve(root, `.github/workflows/${name}`);
  const raw = readFileSync(path, 'utf-8');
  return { raw, parsed: parseYaml(raw), path };
}

function getSteps(parsed) {
  const jobs = parsed.jobs ?? {};
  const jobKey = Object.keys(jobs)[0];
  return jobs[jobKey]?.steps ?? [];
}

// ─── size.yml: presence ───────────────────────────────────────────────────────

describe('size.yml presence', () => {
  test('.github/workflows/size.yml exists', () => {
    const p = resolve(root, '.github/workflows/size.yml');
    assert.ok(existsSync(p), '.github/workflows/size.yml must exist');
  });
});

// ─── size.yml: YAML validity ──────────────────────────────────────────────────

describe('size.yml YAML validity', () => {
  test('parses as valid YAML without throwing', () => {
    assert.doesNotThrow(() => loadWorkflow('size.yml'), 'size.yml must be valid YAML');
  });

  test('parsed result is an object', () => {
    const { parsed } = loadWorkflow('size.yml');
    assert.equal(typeof parsed, 'object');
    assert.notEqual(parsed, null);
  });
});

// ─── size.yml: triggers ───────────────────────────────────────────────────────

describe('size.yml triggers', () => {
  test('triggers on pull_request', () => {
    const { parsed } = loadWorkflow('size.yml');
    const on = parsed?.on ?? {};
    assert.ok('pull_request' in on, 'Must trigger on pull_request');
  });

  test('does NOT trigger on push', () => {
    const { parsed } = loadWorkflow('size.yml');
    const on = parsed?.on ?? {};
    assert.ok(!('push' in on), 'size.yml must NOT trigger on push');
  });
});

// ─── size.yml: size-limit step ────────────────────────────────────────────────

describe('size.yml size-limit step', () => {
  test('uses andresz1/size-limit-action@v1', () => {
    const { raw } = loadWorkflow('size.yml');
    assert.ok(
      raw.includes('andresz1/size-limit-action@v1'),
      'Must use andresz1/size-limit-action@v1',
    );
  });

  test('size-limit step has script: pnpm size', () => {
    const { parsed } = loadWorkflow('size.yml');
    const steps = getSteps(parsed);
    const sizeLimitStep = steps.find(
      (s) => typeof s.uses === 'string' && s.uses.includes('size-limit-action'),
    );
    assert.ok(sizeLimitStep, 'size-limit-action step must exist');
    const script = sizeLimitStep?.with?.script ?? '';
    assert.ok(
      script.includes('pnpm size'),
      `script must include "pnpm size". Got: "${script}"`,
    );
  });

  test('size-limit step passes github_token', () => {
    const { parsed } = loadWorkflow('size.yml');
    const steps = getSteps(parsed);
    const sizeLimitStep = steps.find(
      (s) => typeof s.uses === 'string' && s.uses.includes('size-limit-action'),
    );
    assert.ok(sizeLimitStep, 'size-limit-action step must exist');
    const token = String(sizeLimitStep?.with?.github_token ?? '');
    assert.ok(token.includes('GITHUB_TOKEN'), 'Must pass github_token from GITHUB_TOKEN secret');
  });
});

// ─── size.yml: pnpm cache ─────────────────────────────────────────────────────

describe('size.yml caches pnpm store', () => {
  test('configures pnpm store cache', () => {
    const { raw } = loadWorkflow('size.yml');
    assert.ok(raw.includes('pnpm-store'), 'Must configure pnpm store cache');
    assert.ok(raw.includes('pnpm-lock.yaml'), 'pnpm cache key must hash pnpm-lock.yaml');
  });
});

// ─── release.yml: presence ────────────────────────────────────────────────────

describe('release.yml presence', () => {
  test('.github/workflows/release.yml exists', () => {
    const p = resolve(root, '.github/workflows/release.yml');
    assert.ok(existsSync(p), '.github/workflows/release.yml must exist');
  });
});

// ─── release.yml: YAML validity ───────────────────────────────────────────────

describe('release.yml YAML validity', () => {
  test('parses as valid YAML without throwing', () => {
    assert.doesNotThrow(() => loadWorkflow('release.yml'), 'release.yml must be valid YAML');
  });

  test('parsed result is an object', () => {
    const { parsed } = loadWorkflow('release.yml');
    assert.equal(typeof parsed, 'object');
    assert.notEqual(parsed, null);
  });
});

// ─── release.yml: triggers ────────────────────────────────────────────────────

describe('release.yml triggers', () => {
  test('triggers on push to main', () => {
    const { parsed } = loadWorkflow('release.yml');
    const branches = parsed?.on?.push?.branches ?? [];
    assert.ok(branches.includes('main'), 'Must trigger on push to main');
  });

  test('does NOT trigger on pull_request', () => {
    const { parsed } = loadWorkflow('release.yml');
    const on = parsed?.on ?? {};
    assert.ok(!('pull_request' in on), 'release.yml must NOT trigger on pull_request');
  });
});

// ─── release.yml: permissions ─────────────────────────────────────────────────

describe('release.yml permissions', () => {
  test('sets contents: write', () => {
    const { parsed } = loadWorkflow('release.yml');
    const perms = parsed?.permissions ?? {};
    assert.equal(perms.contents, 'write', 'permissions.contents must be write');
  });

  test('sets pull-requests: write', () => {
    const { parsed } = loadWorkflow('release.yml');
    const perms = parsed?.permissions ?? {};
    assert.equal(perms['pull-requests'], 'write', 'permissions.pull-requests must be write');
  });

  test('sets id-token: write', () => {
    const { parsed } = loadWorkflow('release.yml');
    const perms = parsed?.permissions ?? {};
    assert.equal(perms['id-token'], 'write', 'permissions.id-token must be write');
  });
});

// ─── release.yml: concurrency ─────────────────────────────────────────────────

describe('release.yml concurrency', () => {
  test('has a concurrency group', () => {
    const { parsed } = loadWorkflow('release.yml');
    const concurrency = parsed?.concurrency ?? {};
    assert.ok(concurrency.group, 'Must define a concurrency group to serialize releases');
  });

  test('cancel-in-progress is false (serializes releases, no cancellation)', () => {
    const { parsed } = loadWorkflow('release.yml');
    const concurrency = parsed?.concurrency ?? {};
    assert.equal(
      concurrency['cancel-in-progress'],
      false,
      'cancel-in-progress must be false so simultaneous merges serialize rather than cancel',
    );
  });
});

// ─── release.yml: gate steps ─────────────────────────────────────────────────

describe('release.yml gate steps present', () => {
  test('runs pnpm install --frozen-lockfile', () => {
    const { raw } = loadWorkflow('release.yml');
    assert.ok(raw.includes('pnpm install --frozen-lockfile'), 'Must run pnpm install --frozen-lockfile');
  });

  test('runs pnpm -r build', () => {
    const { raw } = loadWorkflow('release.yml');
    assert.ok(raw.includes('pnpm -r build'), 'Must run pnpm -r build');
  });

  test('runs pnpm publint', () => {
    const { raw } = loadWorkflow('release.yml');
    assert.ok(raw.includes('pnpm publint'), 'Must run pnpm publint gate');
  });

  test('runs pnpm attw', () => {
    const { raw } = loadWorkflow('release.yml');
    assert.ok(raw.includes('pnpm attw'), 'Must run pnpm attw gate');
  });

  test('runs pnpm size', () => {
    const { raw } = loadWorkflow('release.yml');
    assert.ok(raw.includes('pnpm size'), 'Must run pnpm size gate');
  });

  test('uses changesets/action@v1', () => {
    const { raw } = loadWorkflow('release.yml');
    assert.ok(raw.includes('changesets/action@v1'), 'Must use changesets/action@v1');
  });
});

// ─── release.yml: gate order ──────────────────────────────────────────────────

describe('release.yml gate order', () => {
  test('build, publint, attw, size all appear before changesets/action@v1', () => {
    const { parsed } = loadWorkflow('release.yml');
    const steps = getSteps(parsed);

    const changesetsIdx = steps.findIndex(
      (s) => typeof s.uses === 'string' && s.uses.includes('changesets/action'),
    );
    assert.ok(changesetsIdx !== -1, 'changesets/action step must exist');

    const findRunIdx = (pattern) =>
      steps.findIndex((s) => typeof s.run === 'string' && s.run.includes(pattern));

    const buildIdx = findRunIdx('pnpm -r build');
    const publintIdx = findRunIdx('pnpm publint');
    const attwIdx = findRunIdx('pnpm attw');
    const sizeIdx = findRunIdx('pnpm size');

    assert.ok(buildIdx !== -1, 'pnpm -r build step must exist');
    assert.ok(publintIdx !== -1, 'pnpm publint step must exist');
    assert.ok(attwIdx !== -1, 'pnpm attw step must exist');
    assert.ok(sizeIdx !== -1, 'pnpm size step must exist');

    assert.ok(buildIdx < changesetsIdx, 'build must precede changesets action');
    assert.ok(publintIdx < changesetsIdx, 'publint must precede changesets action');
    assert.ok(attwIdx < changesetsIdx, 'attw must precede changesets action');
    assert.ok(sizeIdx < changesetsIdx, 'size must precede changesets action');
  });

  test('install precedes build', () => {
    const { parsed } = loadWorkflow('release.yml');
    const steps = getSteps(parsed);
    const findRunIdx = (pattern) =>
      steps.findIndex((s) => typeof s.run === 'string' && s.run.includes(pattern));
    const installIdx = findRunIdx('pnpm install --frozen-lockfile');
    const buildIdx = findRunIdx('pnpm -r build');
    assert.ok(installIdx !== -1, 'install step must exist');
    assert.ok(buildIdx !== -1, 'build step must exist');
    assert.ok(installIdx < buildIdx, 'install must precede build');
  });
});

// ─── release.yml: NPM provenance ─────────────────────────────────────────────

describe('release.yml NPM provenance', () => {
  test('changesets step sets NPM_CONFIG_PROVENANCE=true in env', () => {
    const { parsed } = loadWorkflow('release.yml');
    const steps = getSteps(parsed);
    const changesetsStep = steps.find(
      (s) => typeof s.uses === 'string' && s.uses.includes('changesets/action'),
    );
    assert.ok(changesetsStep, 'changesets/action step must exist');
    const env = changesetsStep?.env ?? {};
    const provenanceValue = env.NPM_CONFIG_PROVENANCE;
    assert.ok(
      provenanceValue === true || provenanceValue === 'true',
      `NPM_CONFIG_PROVENANCE must be true in changesets step env. Got: ${JSON.stringify(provenanceValue)}`,
    );
  });

  test('changesets publish command uses pnpm changeset publish', () => {
    const { parsed } = loadWorkflow('release.yml');
    const steps = getSteps(parsed);
    const changesetsStep = steps.find(
      (s) => typeof s.uses === 'string' && s.uses.includes('changesets/action'),
    );
    assert.ok(changesetsStep, 'changesets/action step must exist');
    const publishCmd = changesetsStep?.with?.publish ?? '';
    assert.ok(
      publishCmd.includes('changeset publish'),
      `publish command must include "changeset publish". Got: "${publishCmd}"`,
    );
  });
});

// ─── release.yml: pnpm cache ──────────────────────────────────────────────────

describe('release.yml caches pnpm store', () => {
  test('configures pnpm store cache', () => {
    const { raw } = loadWorkflow('release.yml');
    assert.ok(raw.includes('pnpm-store'), 'Must configure pnpm store cache');
    assert.ok(raw.includes('pnpm-lock.yaml'), 'pnpm cache key must hash pnpm-lock.yaml');
  });
});

// ─── packages/markmd/package.json: prepublishOnly ────────────────────────────

describe('packages/markmd prepublishOnly', () => {
  function loadPackageJson() {
    const path = resolve(root, 'packages/markmd/package.json');
    return JSON.parse(readFileSync(path, 'utf-8'));
  }

  test('has prepublishOnly script', () => {
    const pkg = loadPackageJson();
    assert.ok(
      typeof pkg.scripts?.prepublishOnly === 'string' && pkg.scripts.prepublishOnly.length > 0,
      'packages/markmd/package.json must have a non-empty prepublishOnly script',
    );
  });

  const GATES = ['build', 'test', 'typecheck', 'lint', 'publint', 'attw', 'size'];

  for (const gate of GATES) {
    test(`prepublishOnly includes "${gate}" gate`, () => {
      const pkg = loadPackageJson();
      const script = pkg.scripts?.prepublishOnly ?? '';
      assert.ok(
        script.includes(gate),
        `prepublishOnly must include "${gate}" gate. Got: "${script}"`,
      );
    });
  }
});

// ─── Integration: actionlint ──────────────────────────────────────────────────

describe('workflow lint (actionlint)', () => {
  test('actionlint validates size.yml (skipped if actionlint not installed)', async () => {
    const { execFile } = await import('node:child_process');
    const { promisify } = await import('node:util');
    const exec = promisify(execFile);

    try {
      await exec('which', ['actionlint']);
    } catch {
      return; // actionlint not installed — skip gracefully
    }

    const sizePath = resolve(root, '.github/workflows/size.yml');
    try {
      await exec('actionlint', [sizePath]);
    } catch (err) {
      assert.fail(`actionlint reported issues in size.yml:\n${err.stdout ?? err.message}`);
    }
  });

  test('actionlint validates release.yml (skipped if actionlint not installed)', async () => {
    const { execFile } = await import('node:child_process');
    const { promisify } = await import('node:util');
    const exec = promisify(execFile);

    try {
      await exec('which', ['actionlint']);
    } catch {
      return; // actionlint not installed — skip gracefully
    }

    const releasePath = resolve(root, '.github/workflows/release.yml');
    try {
      await exec('actionlint', [releasePath]);
    } catch (err) {
      assert.fail(`actionlint reported issues in release.yml:\n${err.stdout ?? err.message}`);
    }
  });
});
