# TechSpec — Phase 0: Monorepo + CI Foundation

## Executive Summary

Phase 0 delivers the **NPM-ready foundation** for `markeditor`: a pnpm + Turborepo monorepo with one publishable package (`packages/markeditor`) and one private demo app (`apps/playground`), a dual ESM/CJS build via tsup, a Vitest + Playwright test stack with v8 coverage and axe-core, Changesets-driven releases with NPM provenance via OIDC, and a GitHub Actions CI matrix (Node 18/20/22 × React 18/19) that enforces lint, types, tests, bundle size, and package validity on every PR. No library feature code is written in Phase 0 — only an empty `<MarkEditor>` shell sufficient to prove the build pipeline end-to-end (build → publish-pack → consume in playground → render in Playwright).

**Primary trade-off:** front-loading tooling complexity (Turborepo cache, flat-config ESLint v9, dual `.d.ts`/`.d.cts`, provenance, size-limit) before any feature exists. The payoff is that every subsequent phase ships under TDD with a green CI gate and a one-merge path to NPM; the cost is ~1 week of setup with no user-visible output.

## System Architecture

### Component Overview

| Component                       | Type                      | Responsibility                                                                                                                 |
| ------------------------------- | ------------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| `packages/markeditor`               | Published NPM package     | Library source skeleton (`src/index.ts`, `src/MarkEditor.tsx` placeholder), build output (`dist/`), CSS bundle, test suites. |
| `apps/playground`               | Private Vite + React app  | Consumes `markeditor` via `workspace:*`, hosts Playwright e2e smoke test, deploys to Vercel from Phase 6 onward.                   |
| `turbo.json`                    | Pipeline orchestrator     | Declares `build`, `test`, `lint`, `typecheck`, `size`, `e2e` tasks with input/output hashing.                                  |
| `tsconfig.base.json`            | Shared TS config          | `strict: true`, `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`; extended by every workspace.                         |
| `eslint.config.js`              | Flat ESLint config (root) | Type-aware lint for TS/TSX, react/react-hooks/jsx-a11y/import-x plugins, per-workspace overrides.                              |
| `.changeset/`                   | Versioning workflow       | Records bump intents per PR; `apps/*` ignored.                                                                                 |
| `.github/workflows/ci.yml`      | PR gate                   | Matrix Node × React → install, lint, typecheck, test+coverage, build, size-limit, publint, attw, Playwright smoke.             |
| `.github/workflows/release.yml` | Publish workflow          | Changesets "Version Packages" PR; on merge: build + `npm publish --provenance` via OIDC.                                       |
| `.github/workflows/size.yml`    | PR size comment           | `andresz1/size-limit-action` posts diff comment.                                                                               |
| Husky + lint-staged             | Local pre-commit          | Runs `eslint --fix` + `prettier --write` on staged files.                                                                      |

### Data Flow

```
contributor edit ──▶ git commit
                         │ (pre-commit: lint-staged)
                         ▼
                     git push ──▶ PR
                                   │
                                   ▼
                            ci.yml (matrix)
                                   │
        ┌──────────┬───────────────┼───────────────┬───────────┐
        ▼          ▼               ▼               ▼           ▼
      lint     typecheck       vitest + cov      build      playwright
                                   │                          (playground)
                                   ▼
                              codecov upload
                                   │
                                   ▼
        size-limit ─▶ publint ─▶ attw ─▶ green check ─▶ merge
                                                          │
                                              (if .changeset present)
                                                          ▼
                                              release.yml ─▶ Version PR
                                                                │
                                                          merge ▼
                                                    pnpm changeset publish
                                                       --provenance ─▶ npm
```

### External System Interactions

- **NPM registry** — package publish with provenance (OIDC, no long-lived token).
- **Codecov** — coverage upload via `codecov/codecov-action@v4`.
- **GitHub OIDC** — short-lived token for npm provenance and (future) Vercel deploy.

## Implementation Design

### Core Interfaces

The library exposes a stable public surface from `packages/markeditor/src/index.ts`. In Phase 0 only the **placeholder shell** is implemented; the type contract below is what later phases must satisfy and what type-tests pin from day one.

```ts
// packages/markeditor/src/types.ts (Phase 0 — minimal stable surface)
import type { CSSProperties, ReactNode } from 'react';

export type MarkMode = 'edit' | 'preview';

export interface MarkEditorProps {
  value?: string;
  defaultValue?: string;
  onChange?: (value: string) => void;
  mode?: MarkMode;
  defaultMode?: MarkMode;
  onModeChange?: (mode: MarkMode) => void;
  height?: number | string;
  className?: string;
  style?: CSSProperties;
  children?: ReactNode;
}

export interface MarkEditorRef {
  getValue(): string;
  setValue(next: string): void;
  focus(): void;
}
```

```ts
// packages/markeditor/src/index.ts (Phase 0 entry)
export { MarkEditor } from './MarkEditor';
export type { MarkEditorProps, MarkEditorRef, MarkMode } from './types';
```

```ts
// packages/markeditor/src/MarkEditor.tsx (Phase 0 placeholder — render only)
import { forwardRef, useImperativeHandle, useRef } from 'react';
import type { MarkEditorProps, MarkEditorRef } from './types';

export const MarkEditor = forwardRef<MarkEditorRef, MarkEditorProps>(
  function MarkEditor(props, ref) {
    const valueRef = useRef(props.value ?? props.defaultValue ?? '');
    useImperativeHandle(ref, () => ({
      getValue: () => valueRef.current,
      setValue: (v) => { valueRef.current = v; },
      focus: () => {},
    }));
    return <div data-testid="mark-editor" className={props.className} style={props.style} />;
  },
);
```

### Data Models

Phase 0 has no domain data model. Configuration artifacts (deserved by static analysis, not runtime types):

- `package.json` exports map for `packages/markeditor`:
  ```json
  {
    "name": "markeditor",
    "type": "module",
    "exports": {
      ".": {
        "types": "./dist/index.d.ts",
        "import": "./dist/index.mjs",
        "require": "./dist/index.cjs"
      },
      "./styles": "./dist/styles.css",
      "./plugins": {
        "types": "./dist/plugins/index.d.ts",
        "import": "./dist/plugins/index.mjs",
        "require": "./dist/plugins/index.cjs"
      },
      "./package.json": "./package.json"
    },
    "files": ["dist", "README.md", "CHANGELOG.md", "LICENSE"],
    "sideEffects": ["**/*.css"],
    "peerDependencies": { "react": "^18 || ^19", "react-dom": "^18 || ^19" },
    "engines": { "node": ">=18.18" },
    "packageManager": "pnpm@9.x.x"
  }
  ```

### API Endpoints

Not applicable — `markeditor` is a client-side library; no HTTP surface.

## Integration Points

| External system      | Purpose                     | Auth                             | Failure mode                                                       |
| -------------------- | --------------------------- | -------------------------------- | ------------------------------------------------------------------ |
| NPM registry         | Publish `markeditor` package    | GitHub OIDC → npm provenance     | Release workflow fails; no partial publish (Changesets is atomic). |
| Codecov              | Coverage badge + trend      | OIDC (token-less) or repo secret | CI warning, non-blocking.                                          |
| GitHub Actions cache | Speed up Turbo + pnpm-store | Native                           | Cold cache → slower CI, still green.                               |

## Impact Analysis

| Component                                                        | Impact Type | Description and Risk                                                                                                                                                    | Required Action                                                |
| ---------------------------------------------------------------- | ----------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------- |
| Repo root                                                        | New         | Adds `pnpm-workspace.yaml`, `turbo.json`, `tsconfig.base.json`, `eslint.config.js`, `.prettierrc`, `.changeset/`, `.husky/`, root `package.json`. Low risk: greenfield. | Create files per Build Order.                                  |
| `packages/markeditor`                                                | New         | New package directory with skeleton source, tests, build config (`tsup.config.ts`), `size-limit.json`.                                                                  | Scaffold per ADR-001/002.                                      |
| `apps/playground`                                                | New         | Vite app consuming `markeditor` via `workspace:*`, Playwright e2e config. Low risk: not published.                                                                          | Scaffold per ADR-003.                                          |
| GitHub Actions                                                   | New         | Three workflows (`ci.yml`, `release.yml`, `size.yml`). Risk: OIDC misconfig blocks first release.                                                                       | Dry-run release workflow before v0.1.0; tag with `0.0.0-test`. |
| Existing files (`PRD.md`, `DESIGN.md`, `CLAUDE.md`, `README.md`) | Untouched   | None.                                                                                                                                                                   | No change.                                                     |

## Testing Approach

### Unit Tests

- **Vitest**, `environment: 'jsdom'`, setup file imports `@testing-library/jest-dom`.
- **Phase 0 scope (smoke only):**
  - `MarkEditor.test.tsx` — renders without crashing, exposes `data-testid="mark-editor"`.
  - `index.test.ts` — `import { MarkEditor } from 'markeditor'` resolves and is a function.
- **Coverage:** `provider: 'v8'`, thresholds `lines ≥ 80`, `branches ≥ 75`, `functions ≥ 80`, `statements ≥ 80`. Phase 0 source is small; the placeholder must be 100% covered by the smoke test or thresholds must scope-include only `src/**` files that exist.
- **Mocks:** none in Phase 0.

### Integration Tests

- **Type-level tests** (`tests/type/*.test-d.ts`) using `expect-type` — pin `MarkEditorProps`, `MarkEditorRef`, `MarkMode` shape so accidental breaking changes fail `tsc --noEmit`.
- **Package smoke (CI step):** `pnpm pack` the built library into a tarball, install it into a temp dir, `node -e "require('markeditor')"` + `node --input-type=module -e "import('markeditor')"`. Asserts the exports map works for both module systems. (Belt-and-braces alongside the Playwright check.)

### E2E Tests

- **Playwright** in `apps/playground/e2e/smoke.spec.ts`:
  - Build playground (`pnpm --filter playground build`), serve with `pnpm --filter playground preview` via `webServer` config.
  - Navigate to `/`, assert `[data-testid="mark-editor"]` is visible, no console errors.
- **Axe in e2e:** `@axe-core/playwright` `analyze()` — Phase 0 page must have zero serious/critical violations (placeholder is empty; trivial pass establishes the gate).

### CI Matrix

`ci.yml` matrix: `node: [18, 20, 22]` × `react: [18, 19]` (6 cells). React variant injected via `pnpm install --filter ... react@${{ matrix.react }} react-dom@${{ matrix.react }}` step before test.

## Development Sequencing

### Build Order

1. **Repo skeleton + pnpm workspaces** — root `package.json`, `pnpm-workspace.yaml`, `.gitignore`, `.editorconfig`, `LICENSE` (MIT), `.nvmrc` (Node 20). No dependencies.
2. **TypeScript base config** — `tsconfig.base.json` with strict flags. Depends on step 1.
3. **Turborepo** — `turbo.json` with `build/test/lint/typecheck/size` pipelines. Depends on step 1.
4. **ESLint flat config + Prettier** — `eslint.config.js`, `.prettierrc`, `.prettierignore`. Depends on steps 1–2.
5. **Husky + lint-staged** — `.husky/pre-commit`, `lint-staged` in root `package.json`, `prepare` script. Depends on step 4.
6. **`packages/markeditor` skeleton** — `src/index.ts`, `src/MarkEditor.tsx`, `src/types.ts`, `src/styles/index.css`, `package.json` with `exports` map, `tsconfig.json` extending base. Depends on steps 1–2.
7. **tsup build config** — `tsup.config.ts` producing ESM + CJS + d.ts + CSS. Depends on step 6.
8. **Vitest config + smoke tests** — `vitest.config.ts`, `tests/unit/MarkEditor.test.tsx`, `tests/type/props.test-d.ts`. Depends on steps 6–7.
9. **size-limit, publint, attw configs** — `size-limit.json` in `packages/markeditor`, root scripts to invoke. Depends on step 7.
10. **`apps/playground` skeleton** — Vite + React app, `"markeditor": "workspace:*"`, one route rendering `<MarkEditor />`. Depends on step 6.
11. **Playwright config + smoke e2e** — `apps/playground/playwright.config.ts`, `e2e/smoke.spec.ts`, `@axe-core/playwright` integration. Depends on step 10.
12. **Changesets init** — `pnpm changeset init`, configure `.changeset/config.json` to ignore `apps/*`. Depends on step 1.
13. **`ci.yml`** — checkout, pnpm setup via Corepack, install, lint, typecheck, test+coverage upload, build, size, publint, attw, e2e. Matrix Node 18/20/22 × React 18/19. Depends on steps 2–11.
14. **`size.yml`** — PR comment workflow. Depends on step 9.
15. **`release.yml`** — Changesets action with OIDC permissions, `npm publish --provenance`. Depends on steps 12–13.
16. **Smoke dry-run release** — tag `0.0.0-test.1` on a throwaway branch, confirm provenance attestation visible on npm. Depends on step 15.
17. **README + badges + CONTRIBUTING.md skeleton** — installation, dev workflow, link to CLAUDE.md. Depends on steps 1, 13, 15.

### Technical Dependencies

- **GitHub repo settings:** Actions enabled, NPM provenance OIDC trust set up for npmjs.com (`npm access`).
- **NPM org/account:** `markeditor` name available; 2FA on publish account.
- **Codecov:** OSS project linked to GitHub repo.
- **Node 20+ locally** for Corepack to provision pnpm.

## Monitoring and Observability

Phase 0 produces no runtime service to monitor. CI/build observability:

- **CI status badge** in README (`actions/workflows/ci.yml/badge.svg`).
- **Codecov badge** in README, trend tracked per PR comment.
- **Bundlephobia / size-limit PR comment** posts diff on every PR.
- **npm provenance attestation** visible on `npmjs.com/package/markeditor` after first publish.
- **Failure escalation:** broken `main` blocks all PRs (GitHub branch protection requires green `ci.yml`).

## Technical Considerations

### Key Decisions

- **Monorepo with pnpm + Turborepo** (ADR-001): publish/demo separation + cached pipeline. Trade-off: contributors must use pnpm. Alternative: single-package with `examples/` — rejected because demo code would risk leaking into the tarball.
- **tsup for dual ESM/CJS + d.ts + CSS** (ADR-002): one config produces all artifacts. Trade-off: tsup is opinionated. Alternative: Vite library mode — rejected for heavier dual-output config.
- **Vitest + Playwright + axe-core + MSW** (ADR-003): fastest TDD loop + cross-browser e2e + a11y from day one. Trade-off: two runners. Alternative: Jest+Cypress — rejected on speed and matrix simplicity.
- **Changesets + OIDC provenance** (ADR-004): explicit version PRs, supply-chain trust. Trade-off: contributors must run `pnpm changeset`. Alternative: semantic-release — rejected for less reviewable releases.
- **ESLint flat config v9 + Husky + size-limit + Codecov** (ADR-005): modern lint, fast local feedback, hard CI gates. Trade-off: a few plugins may still be legacy-only. Alternative: Biome — rejected because a11y rule coverage critical for AA target.
- **CI cache: GH Actions only** (no Turbo remote cache) — chosen for simplicity in a small repo; revisit at Phase 4+ if CI > 10 min.
- **Engines: Node ≥ 18.18, pnpm via Corepack** — matches PRD matrix (Node 18/20/22), zero-install for contributors with modern Node.

### Known Risks

- **OIDC publish misconfiguration** — first release could fail mid-flow. Mitigation: dry-run with `0.0.0-test.N` tag before v0.1.0; document trust setup in CONTRIBUTING.md.
- **ESLint flat config plugin gaps** — a rare plugin may not support flat. Mitigation: pin verified versions; keep an escape hatch issue tracked.
- **Turbo cache poisoning** — stale build outputs could ship. Mitigation: `release.yml` uses `turbo run build --force` (no cache).
- **jsdom + Monaco impedance** — relevant from Phase 1, but tests in Phase 0 must already mock Monaco so the smoke test pattern is established correctly.
- **Coverage thresholds with near-empty source** — Phase 0 has ~30 LOC; one untested branch fails thresholds. Mitigation: scope `coverage.include` to existing files only; raise thresholds as code is added.

## Architecture Decision Records

- [ADR-001: Monorepo with pnpm workspaces + Turborepo](adrs/adr-001.md) — chose pnpm + Turborepo over npm+Nx, single-package, and Yarn Berry for fast installs, cached pipelines, and clean publish/demo separation.
- [ADR-002: Build toolchain — tsup for dual ESM/CJS + d.ts + CSS](adrs/adr-002.md) — chose tsup over Vite library mode, raw Rollup, and tsc-only for a single-config dual build with CSS bundling.
- [ADR-003: Test stack — Vitest (jsdom) + Playwright + axe-core + MSW](adrs/adr-003.md) — chose Vitest+Playwright over Jest+Cypress for speed, native ESM, and clean separation of unit vs e2e.
- [ADR-004: Versioning + publish — Changesets with NPM provenance via OIDC](adrs/adr-004.md) — chose Changesets over semantic-release and manual publish for reviewable, monorepo-aware releases with supply-chain provenance.
- [ADR-005: Quality gates — ESLint flat config v9 + Prettier + Husky/lint-staged + size-limit + Codecov](adrs/adr-005.md) — chose ESLint+Prettier+Husky+size-limit+Codecov over Biome, simple-git-hooks, and no-upload variants for mature a11y rules, fast local feedback, and a visible quality badge.
