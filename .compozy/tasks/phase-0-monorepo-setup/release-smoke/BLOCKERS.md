# Release Smoke Dry-Run — Blockers

## Date Assessed: 2026-05-23

## Local Simulation Status: COMPLETED

The local changeset workflow was fully simulated and verified:

- `pnpm changeset pre enter test` — creates `.changeset/pre.json` with `mode: pre, tag: test`
- Changeset file created declaring patch bump for `markmd`
- `pnpm changeset version` — produced `0.0.8-test.0` (patch bump from current 0.0.7)
- `pnpm changeset pre exit` — transitions `pre.json` to `mode: exit`
- Cleanup: `pre.json` removed, version reset to `0.0.7`, changeset file removed

Post-simulation state verified:
- `.changeset/pre.json` → does NOT exist ✅
- `packages/markmd/package.json` version → `0.0.7` (no `-test` suffix) ✅

## Real Publish Blockers

### Blocker 1: npm package name not owned

The package name `markmd` on npm is already owned by `banyawat <bunyawat.38@gmail.com>`.

```
npm view markmd --json → maintainers: [{ name: 'banyawat', email: 'bunyawat.38@gmail.com' }]
npm view markmd dist-tags.latest → 0.5.0-rc5
```

**Resolution:** Either claim the name if abandoned, negotiate with the owner, or use a scoped name (e.g. `@byefive/markmd`).

### Blocker 2: npm authentication not configured

```
npm whoami → 401 Unauthorized
```

**Resolution:** `npm login` or configure `NPM_TOKEN` / OIDC trust.

### Blocker 3: No GitHub remote configured

```
git remote -v → (no output)
```

The `release.yml` workflow triggers on push to `main` and uses GitHub OIDC to publish to npm. Without a GitHub remote, the workflow cannot be triggered.

**Resolution:** Create a GitHub repository and configure it as origin:
```bash
git remote add origin https://github.com/<owner>/<repo>
git push -u origin master
```

### Blocker 4: GitHub OIDC trust not configured on npm

Even with a GitHub remote, npm OIDC trust must be configured on npmjs.com for the specific repository. See TechSpec "Known Risks → OIDC publish misconfiguration" and ADR-004.

**Resolution:** Follow the procedure documented in `CONTRIBUTING.md` (task_13) once the npm package name is available.

## Steps to Complete After Blockers Are Resolved

1. Resolve npm package name (claim or use scoped name)
2. `npm login` or configure OIDC trust on npmjs.com
3. Push repository to GitHub remote
4. `pnpm changeset pre enter test`
5. Create changeset: `pnpm changeset` (patch bump for `markmd`)
6. Commit and push changeset + `pre.json`
7. Wait for `release.yml` to create the "Version Packages" PR
8. Merge the Version Packages PR
9. Wait for `release.yml` publish step to complete
10. Verify: `npm view markmd@0.0.8-test.0 --json` (look for `provenance` or `_attestations`)
11. Deprecate: `npm deprecate markmd@0.0.8-test.0 "test release — do not use"`
12. `pnpm changeset pre exit` and commit
13. Update `npm-view.json` with real npm view output
14. Update task_12.md status to completed
