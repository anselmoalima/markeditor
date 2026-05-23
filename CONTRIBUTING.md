# Contributing to markeditor

## Setup

### Prerequisites

- **Node.js ≥ 18.18** — use `.nvmrc`: `nvm use`
- **pnpm** via Corepack:

```bash
corepack enable
corepack prepare pnpm@latest --activate
```

### Clone and install

```bash
git clone git@github.com:anselmoalima/markeditor.git
cd markeditor
pnpm install
pnpm -r build
```

## Common Commands

| Command                                         | What it runs                                 |
| ----------------------------------------------- | -------------------------------------------- |
| `pnpm install`                                  | Install all workspace deps                   |
| `pnpm -r build`                                 | Build all packages (Turborepo)               |
| `pnpm -r test`                                  | Vitest unit + integration                    |
| `pnpm -r typecheck`                             | TypeScript strict check (`tsc --noEmit`)     |
| `pnpm -r lint`                                  | ESLint (`--max-warnings 0`)                  |
| `pnpm --filter markeditor size`                 | Bundle size check via size-limit             |
| `pnpm --filter markeditor publint`              | Package validity check                       |
| `pnpm --filter markeditor attw`                 | Type resolution check (Are The Types Wrong?) |
| `pnpm --filter playground dev`                  | Start playground dev server                  |
| `pnpm --filter playground exec playwright test` | E2E suite (requires built playground)        |
| `pnpm format`                                   | Prettier on all files                        |
| `pnpm changeset`                                | Create a changeset for your PR               |

## Tests

### TDD policy

Every user-facing change starts from a failing test (Red → Green → Refactor). PRs without passing tests are not merged. Minimum coverage: **≥ 80% lines, ≥ 75% branches** (Vitest v8). See [CLAUDE.md §4.1](CLAUDE.md).

### Running unit tests

```bash
pnpm -r test
```

### Running E2E tests

Install browsers once per machine (or after a major Playwright version upgrade):

```bash
pnpm exec playwright install --with-deps chromium
```

Then:

```bash
# Build playground first
pnpm --filter playground build

# Run E2E suite
pnpm --filter playground exec playwright test
```

Or via Turborepo (handles build ordering automatically):

```bash
pnpm turbo run e2e --filter=playground
```

## Changesets

Every PR with a user-visible change needs a changeset. `apps/*` changes do not need one.

```bash
pnpm changeset
```

Select the affected package (`markeditor`), choose the bump type (`patch` / `minor` / `major`), and write a short description. Commit the generated `.changeset/*.md` file with your PR.

## Branch protection

The `main` branch is protected:

- All status checks must pass: `ci / Node X / React Y` matrix (6 cells), `size`, `publint`, `attw`.
- At least one approving review required.
- Branch must be up to date before merging.
- Force-push and branch deletion are blocked.

## Release

Releases are managed by [Changesets](https://github.com/changesets/changesets) and published automatically via GitHub Actions.

### How it works

1. Merge one or more PRs that include `.changeset/*.md` files.
2. The `release.yml` workflow opens a **"Version Packages"** PR that bumps the version and writes `CHANGELOG.md`.
3. Merging that PR triggers `pnpm changeset publish --provenance`.
4. The package is published to npm with [provenance attestation](https://docs.npmjs.com/generating-provenance-statements) — no long-lived npm token stored in GitHub.

### OIDC trust setup (one-time, maintainers only)

npm provenance requires a trust relationship between the GitHub repo and npmjs.com:

```bash
# Authenticate to npm
npm login

# Grant publish trust to the GitHub Actions OIDC provider for this repo
npm access set provenance anselmoalima/markeditor
```

Verify the trust entry is visible:

```bash
npm access ls-collaborators markeditor
```

The `release.yml` workflow uses `permissions: id-token: write` and `contents: write`. No `NPM_TOKEN` secret is required — the OIDC token is exchanged for a short-lived publish credential at runtime.

### Manual dry-run

To test the pipeline without publishing:

```bash
# On a throwaway branch
pnpm --filter markeditor build
pnpm --filter markeditor pack --dry-run
```

See [PRD §11 Phase 0 — task_12](PRD.md) for the smoke dry-run procedure used to validate the OIDC trust before the first real publish.
