#!/usr/bin/env bash
# Smoke test: verifies pnpm workspace discovery and basic repo invariants.
# Exit 0 = pass. Any non-zero = fail.
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$REPO_ROOT"

echo "==> [1/3] Checking packageManager field starts with 'pnpm@9'"
node -e "
  const fs = require('fs');
  const pkg = JSON.parse(fs.readFileSync('./package.json', 'utf8'));
  if (!pkg.packageManager.startsWith('pnpm@9')) {
    process.stderr.write('FAIL: packageManager is ' + pkg.packageManager + ', expected pnpm@9.x.x\n');
    process.exit(1);
  }
  console.log('  OK: packageManager =', pkg.packageManager);
"

echo "==> [2/3] Checking 'pnpm m ls --json' returns valid JSON"
WS_JSON=$(pnpm m ls --json)
export WS_JSON
node -e "
  const list = JSON.parse(process.env.WS_JSON);
  if (!Array.isArray(list)) {
    process.stderr.write('FAIL: expected JSON array, got: ' + typeof list + '\n');
    process.exit(1);
  }
  const nonRoot = list.filter(w => !w.path || w.path === process.cwd() ? false : true);
  if (nonRoot.length !== 0) {
    process.stderr.write('FAIL: expected 0 non-root workspaces, got ' + nonRoot.length + '\n');
    process.exit(1);
  }
  console.log('  OK: workspace list valid, non-root workspaces =', nonRoot.length);
"

echo "==> [3/3] Checking 'pnpm install --frozen-lockfile' exits 0"
pnpm install --frozen-lockfile > /dev/null 2>&1
echo "  OK: pnpm install --frozen-lockfile succeeded"

echo ""
echo "All smoke checks passed."
