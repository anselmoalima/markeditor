import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { load as parseYaml } from 'js-yaml';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const ciPath = resolve(root, '.github/workflows/ci.yml');

function loadWorkflow() {
  const raw = readFileSync(ciPath, 'utf-8');
  return { raw, parsed: parseYaml(raw) };
}

/** Returns all run: strings from the job's steps array, in order. */
function stepRuns(parsed) {
  const jobs = parsed.jobs ?? {};
  const jobKeys = Object.keys(jobs);
  assert.ok(jobKeys.length > 0, 'Workflow must have at least one job');
  const steps = jobs[jobKeys[0]].steps ?? [];
  return steps.map((s) => s.run ?? null).filter(Boolean);
}

// ─── Unit: file presence ──────────────────────────────────────────────────────

describe('ci.yml presence', () => {
  test('.github/workflows/ci.yml exists', () => {
    assert.ok(existsSync(ciPath), '.github/workflows/ci.yml must exist');
  });
});

// ─── Unit: YAML validity ──────────────────────────────────────────────────────

describe('ci.yml YAML validity', () => {
  test('parses as valid YAML without throwing', () => {
    assert.doesNotThrow(() => loadWorkflow(), 'ci.yml must be valid YAML');
  });

  test('parsed result is an object', () => {
    const { parsed } = loadWorkflow();
    assert.equal(typeof parsed, 'object', 'Parsed YAML must be an object');
    assert.notEqual(parsed, null);
  });
});

// ─── Unit: triggers ───────────────────────────────────────────────────────────

describe('ci.yml triggers', () => {
  test('triggers on push to main', () => {
    const { parsed } = loadWorkflow();
    const branches = parsed?.on?.push?.branches ?? [];
    assert.ok(branches.includes('main'), 'Must trigger on push to main branch');
  });

  test('triggers on pull_request', () => {
    const { parsed } = loadWorkflow();
    const on = parsed?.on ?? {};
    assert.ok('pull_request' in on, 'Must trigger on pull_request');
  });
});

// ─── Unit: matrix ─────────────────────────────────────────────────────────────

describe('ci.yml matrix', () => {
  test('declares node-version: [18, 20, 22]', () => {
    const { parsed } = loadWorkflow();
    const jobs = parsed?.jobs ?? {};
    const jobKey = Object.keys(jobs)[0];
    const matrix = jobs[jobKey]?.strategy?.matrix ?? {};
    assert.deepEqual(
      matrix['node-version'],
      [18, 20, 22],
      'matrix.node-version must be [18, 20, 22]',
    );
  });

  test('declares react-version: [18, 19]', () => {
    const { parsed } = loadWorkflow();
    const jobs = parsed?.jobs ?? {};
    const jobKey = Object.keys(jobs)[0];
    const matrix = jobs[jobKey]?.strategy?.matrix ?? {};
    assert.deepEqual(
      matrix['react-version'],
      [18, 19],
      'matrix.react-version must be [18, 19]',
    );
  });

  test('matrix produces 6 cells (3 node × 2 react)', () => {
    const { parsed } = loadWorkflow();
    const jobs = parsed?.jobs ?? {};
    const jobKey = Object.keys(jobs)[0];
    const matrix = jobs[jobKey]?.strategy?.matrix ?? {};
    const nodeCount = (matrix['node-version'] ?? []).length;
    const reactCount = (matrix['react-version'] ?? []).length;
    assert.equal(nodeCount * reactCount, 6, 'Matrix must produce exactly 6 cells');
  });
});

// ─── Unit: step order ─────────────────────────────────────────────────────────

describe('ci.yml step order', () => {
  test('contains pnpm install --frozen-lockfile step', () => {
    const { raw } = loadWorkflow();
    assert.ok(
      raw.includes('pnpm install --frozen-lockfile'),
      'Must have pnpm install --frozen-lockfile step',
    );
  });

  test('contains React version override step', () => {
    const { raw } = loadWorkflow();
    assert.ok(
      raw.includes('pnpm update react@') && raw.includes('react-dom@'),
      'Must have React version override step',
    );
  });

  test('contains pnpm lint step with --max-warnings 0', () => {
    const { raw } = loadWorkflow();
    assert.ok(raw.includes('pnpm lint'), 'Must have pnpm lint step');
    assert.ok(raw.includes('--max-warnings 0'), 'Lint step must include --max-warnings 0');
  });

  test('contains pnpm -r typecheck step', () => {
    const { raw } = loadWorkflow();
    assert.ok(raw.includes('pnpm -r typecheck'), 'Must have pnpm -r typecheck step');
  });

  test('contains pnpm -r test step', () => {
    const { raw } = loadWorkflow();
    assert.ok(raw.includes('pnpm -r test'), 'Must have pnpm -r test step');
  });

  test('contains pnpm size step', () => {
    const { raw } = loadWorkflow();
    assert.ok(raw.includes('pnpm size'), 'Must have pnpm size step');
  });

  test('contains pnpm publint step', () => {
    const { raw } = loadWorkflow();
    assert.ok(raw.includes('pnpm publint'), 'Must have pnpm publint step');
  });

  test('contains pnpm attw step', () => {
    const { raw } = loadWorkflow();
    assert.ok(raw.includes('pnpm attw'), 'Must have pnpm attw step');
  });

  test('contains pnpm --filter playground e2e step', () => {
    const { raw } = loadWorkflow();
    assert.ok(
      raw.includes('pnpm --filter playground e2e'),
      'Must have pnpm --filter playground e2e step',
    );
  });

  test('contains playwright install step', () => {
    const { raw } = loadWorkflow();
    assert.ok(
      raw.includes('playwright install') && raw.includes('chromium'),
      'Must have playwright install --with-deps chromium step',
    );
  });

  test('required steps appear in correct relative order', () => {
    const runs = stepRuns(loadWorkflow().parsed);
    const idx = (pattern) => runs.findIndex((r) => r.includes(pattern));

    const installIdx = idx('pnpm install --frozen-lockfile');
    const overrideIdx = idx('pnpm update react@');
    const lintIdx = idx('pnpm lint');
    const typecheckIdx = idx('pnpm -r typecheck');
    const testIdx = idx('pnpm -r test');
    const sizeIdx = idx('pnpm size');
    const publintIdx = idx('pnpm publint');
    const attwIdx = idx('pnpm attw');
    const playwrightInstallIdx = idx('playwright install');
    const e2eIdx = idx('pnpm --filter playground e2e');

    assert.ok(installIdx !== -1, 'install step must exist');
    assert.ok(overrideIdx !== -1, 'React override step must exist');
    assert.ok(lintIdx !== -1, 'lint step must exist');
    assert.ok(typecheckIdx !== -1, 'typecheck step must exist');
    assert.ok(testIdx !== -1, 'test step must exist');
    assert.ok(sizeIdx !== -1, 'size step must exist');
    assert.ok(publintIdx !== -1, 'publint step must exist');
    assert.ok(attwIdx !== -1, 'attw step must exist');
    assert.ok(playwrightInstallIdx !== -1, 'playwright install step must exist');
    assert.ok(e2eIdx !== -1, 'e2e step must exist');

    assert.ok(installIdx < overrideIdx, 'install must precede react override');
    assert.ok(overrideIdx < lintIdx, 'react override must precede lint');
    assert.ok(lintIdx < typecheckIdx, 'lint must precede typecheck');
    assert.ok(typecheckIdx < testIdx, 'typecheck must precede test');
    assert.ok(testIdx < sizeIdx, 'test must precede size check');
    assert.ok(sizeIdx < publintIdx, 'size must precede publint');
    assert.ok(publintIdx < attwIdx, 'publint must precede attw');
    assert.ok(attwIdx < playwrightInstallIdx, 'attw must precede playwright install');
    assert.ok(playwrightInstallIdx < e2eIdx, 'playwright install must precede e2e');
  });
});

// ─── Unit: caches ─────────────────────────────────────────────────────────────

describe('ci.yml caches', () => {
  test('caches pnpm store', () => {
    const { raw } = loadWorkflow();
    assert.ok(raw.includes('pnpm-store'), 'Must configure pnpm store cache');
    assert.ok(raw.includes('pnpm-lock.yaml'), 'pnpm cache key must hash pnpm-lock.yaml');
  });

  test('caches Turbo build outputs', () => {
    const { raw } = loadWorkflow();
    assert.ok(raw.includes('.turbo'), 'Must configure Turbo cache (.turbo)');
  });

  test('caches Playwright browsers', () => {
    const { raw } = loadWorkflow();
    assert.ok(
      raw.includes('ms-playwright'),
      'Must configure Playwright browser cache (~/.cache/ms-playwright)',
    );
  });
});

// ─── Unit: Codecov step ───────────────────────────────────────────────────────

describe('ci.yml Codecov upload', () => {
  test('contains codecov/codecov-action@v4 step', () => {
    const { raw } = loadWorkflow();
    assert.ok(
      raw.includes('codecov/codecov-action@v4'),
      'Must use codecov/codecov-action@v4',
    );
  });

  test('Codecov step is gated on primary matrix cell (node 20 + react 19)', () => {
    const { parsed } = loadWorkflow();
    const jobs = parsed?.jobs ?? {};
    const jobKey = Object.keys(jobs)[0];
    const steps = jobs[jobKey]?.steps ?? [];

    const codecovStep = steps.find(
      (s) => typeof s.uses === 'string' && s.uses.startsWith('codecov/codecov-action'),
    );

    assert.ok(codecovStep, 'codecov step must exist in workflow');
    assert.ok(
      typeof codecovStep.if === 'string' || typeof codecovStep.if === 'boolean',
      'codecov step must have an if condition',
    );

    const condition = String(codecovStep.if);
    assert.ok(
      condition.includes('node-version') && condition.includes('20'),
      `Codecov if condition must reference node-version == 20. Got: "${condition}"`,
    );
    assert.ok(
      condition.includes('react-version') && condition.includes('19'),
      `Codecov if condition must reference react-version == 19. Got: "${condition}"`,
    );
  });

  test('Codecov step uses CODECOV_TOKEN secret', () => {
    const { raw } = loadWorkflow();
    assert.ok(
      raw.includes('CODECOV_TOKEN'),
      'Codecov step must reference CODECOV_TOKEN secret',
    );
  });
});

// ─── Unit: job summary step ───────────────────────────────────────────────────

describe('ci.yml job summary', () => {
  test('has a step that writes to GITHUB_STEP_SUMMARY', () => {
    const { raw } = loadWorkflow();
    assert.ok(
      raw.includes('GITHUB_STEP_SUMMARY'),
      'Must write a job summary to GITHUB_STEP_SUMMARY',
    );
  });
});
