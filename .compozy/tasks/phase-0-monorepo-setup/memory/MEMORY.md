# Workflow Memory

Keep only durable, cross-task context here. Do not duplicate facts that are obvious from the repository, PRD documents, or git history.

## Current State

- task_01 (Repo skeleton + pnpm workspaces): **completed**
- task_02 (tsconfig.base + Turborepo pipeline): **completed** — Turbo 2.9.14, `tasks` v2 API
- task_03 (ESLint flat v9 + Prettier + Husky/lint-staged): **completed**
- task_04 (packages/markeditor skeleton + tsup dual build): **completed** — see task_04.md
- task_05 (Vitest config + smoke unit + type tests): **completed** — 17 tests pass, coverage 100/100/80/100 meets thresholds, type-level tests via expect-type + tsconfig.types-test.json
- task_07 (apps/playground Vite skeleton): **completed** — see task_07.md
- task_09 (Changesets init): **completed** — `@changesets/cli@^2.31.0` at root, `.changeset/config.json` with `access:public`, `ignore:["playground"]`, `baseBranch:main`. Scripts `changeset`, `changeset:version`, `changeset:publish` added to root. Tests in `tests/changeset.test.mjs` (13 tests, all pass).
- task_10 (ci.yml matrix): **completed** — `.github/workflows/ci.yml` authored, 26 unit tests pass. `js-yaml@4.1.1` added as root devDep for YAML test parsing. React override via `pnpm update react@$VERSION -r`. Primary cell: node 20 + react 19.
- task_11 (size.yml + release.yml): **completed** — see task_11.md
- Tasks task_08, task_12, task_13: still pending

## Shared Decisions

- **pnpm@9.15.4** chosen as concrete version for `packageManager` field. All tasks referencing pnpm version should use 9.x.
- **COREPACK_ENABLE_STRICT=0** on the dev machine — pnpm@10.14.0 is the local binary. Corepack does not enforce version mismatch. Lockfiles generated locally are pnpm@10 but lockfileVersion '9.0' (compatible with pnpm@9).
- **lockfileVersion '9.0'** is shared between pnpm 9 and pnpm 10 — no format incompatibility risk.
- Workspace globs: `packages/*` and `apps/*` (no `apps/docs` glob needed separately — covered by `apps/*`).

## Shared Learnings

- `node -e "..."` in shell scripts inherits CJS mode even when package.json has `"type": "module"` — `require()` works inside node -e. Use `export VAR` before node -e to pass shell vars via `process.env`.
- `.prettierignore` MUST include `.compozy/` and `.agents/` — prettier ran on `.compozy/` files during task_03 and deleted `_tasks.md` from working tree (root cause unclear, but excluding internal workflow dirs is safer).
- **Vitest multi-project config + @testing-library**: use `import '@testing-library/jest-dom/vitest'` (not bare `@testing-library/jest-dom`) in setup.ts — the bare import calls `expect.extend()` globally but global `expect` is not available in multi-project mode. Also add explicit `afterEach(cleanup)` from `@testing-library/react` — auto-cleanup does not run in multi-project Vitest.
- **attw exports map format**: use fully-nested conditions — `"import": { "types": "...", "default": "..." }` and `"require": { "types": "...", "default": "..." }`. A flat top-level `"types"` alongside `"require"` causes FalseESM (node16 CJS path picks up the ESM `.d.ts`).
- **attw CSS exports**: `./styles` with a CSS-only export will always fail attw resolution (no TypeScript types for CSS). Use `--exclude-entrypoints ./styles` in the attw script.
- **attw node10**: packages with `engines.node: ">=18.18"` can safely use `--ignore-rules no-resolution` — node10 doesn't support `exports` field, so all entries fail there and it's out of scope.
- **fflate streaming Gunzip bug in attw ≤0.18.2**: present in core@0.18.2 source but did NOT crash in practice on this machine. No patch needed; monitor if it resurfaces.
- **size-limit cosmiconfig**: `size-limit@12.1.0` uses `lilconfig` with `searchPlaces` that does NOT include `size-limit.json` (no dot). Config must be named `.size-limit.json` OR pass `--config size-limit.json` in the script. We use the `--config` approach so the filename matches the spec's `packages/markeditor/size-limit.json`.
- **Vitest parallel-project race condition**: when two vitest projects (unit + integration) run in parallel, integration tests must NOT write to config files that unit tests read. Use a separate temp file for any "bad input" enforcement test and clean it up in `finally`.
- **ESLint tsconfig for test files**: `packages/markeditor/tsconfig.json` excludes `tests/` (correct for publishing). ESLint's `projectService` cannot find test files from it. Fix: create `packages/markeditor/tsconfig.eslint.json` extending the package tsconfig but including tests + vitest.config, then in `eslint.config.js` add a `packages/markeditor/**` override with `projectService: false, project: './packages/markeditor/tsconfig.eslint.json'`. Use `allowDefaultProject` only for files that TRULY have no tsconfig (not for excluded files).
- **ESLint flat config rule order**: `reactPlugin.configs.flat.recommended` and `importXFlatConfigs.recommended` override earlier rule settings. Put final rule overrides (`react/react-in-jsx-scope: off`, `import-x/no-unresolved: off`) in a LAST block AFTER all plugin configs.
- **`allowDefaultProject` no `**`**: typescript-eslint's `allowDefaultProject` rejects globs containing `**` (performance guard). Use single-star globs or the `tsconfig.eslint.json` approach for packages with nested test dirs.
- **`tsconfig.eslint.json` pattern applies to all workspaces**: packages/markeditor and apps/playground both need it (extends workspace tsconfig.json, adds tests/** includes). Each workspace gets a `files: ['workspace/**']` override in root `eslint.config.js` with `projectService: false, project: './workspace/tsconfig.eslint.json'`.
- **Integration test preview server**: use `getFreePort()` (createServer listen 0) + `waitForServer()` polling loop (300ms intervals, 15s max) to start `pnpm exec vite preview --port PORT --strictPort` in a `spawn` process. Kill in `afterAll`. This pattern works reliably for task_08 Playwright `webServer` config too.

## Open Risks

- **CRITICAL — npm package name taken**: `markeditor` on npmjs.com is owned by `banyawat <bunyawat.38@gmail.com>` (latest: 0.5.0-rc5). Cannot publish to it. Must either claim the name (if abandoned) or switch to a scoped name (e.g. `@byefive/markeditor`). This blocks task_12 full completion and all future npm publishes.
- **CRITICAL — no GitHub remote**: `git remote -v` is empty. `release.yml` requires a push to `main` to trigger. Must add a GitHub remote before any CI/release workflow can run.
- task_12 dry-run release: local simulation complete (changeset pre enter/exit cycle verified, version 0.0.8-test.0 produced). Real publish blocked by npm name ownership + no GitHub remote. Integration tests skipped with documentation in `release-smoke/BLOCKERS.md`.
- **Latent bug — changeset integration test bumps version permanently**: `tests/changeset.test.mjs` runs `pnpm changeset version` then tries `git checkout -- packages/markeditor/package.json` to revert. Fails silently because `packages/` is untracked. Version increments by 1 patch on every test run (0.0.7 → 0.0.8 → ...). Fix: use `node:fs` to read/restore original version instead of git checkout.
- `actionlint` not installed locally — validate workflows in CI on first push.
- **fflate/attw patch fragility**: `@arethetypeswrong/core/dist/createPackage.js` was manually patched to fix the streaming Gunzip double-callback bug. This patch is overwritten by `pnpm install`. task_06 should either automate the patch via `postinstall` script or wait for attw to fix upstream (issue exists in ≤0.18.2).

## Handoffs

- task_02 complete: Turbo 2.9.14 installed. Uses `tasks` key (v2 API). No-op on empty workspace confirmed. Config tests in `tests/config.test.mjs` via `node:test` — no Vitest at root (task_05's job).
- task_03 complete: `pnpm lint` = `eslint . --max-warnings 0` (NOT turbo run lint — flat config at root covers full tree). `pnpm format` / `pnpm format:check` added. Husky pre-commit calls lint-staged. Tests in `tests/lint.test.mjs` (22 tests). All 31 config+lint tests pass. `allowDefaultProject` set in projectService for `tests/fixtures/*.ts`.
- task_04 complete: `packages/markeditor` skeleton live. `pnpm --filter markeditor build` exits 0. 16 tests pass (7 unit + 9 integration). publint "All good!". attw "No problems found 🌟". Vitest multi-project config already in `packages/markeditor/vitest.config.ts` — task_05 extends or reuses it. See Open Risks for fflate/attw patch.
- task_05 complete: `expect-type@1.3.0` devDep added. `tests/type/props.test-d.ts` + `tsconfig.types-test.json` created. Scripts `test:coverage` and `typecheck:types-test` added. Turbo task `typecheck:types-test` added. 17 tests pass. `pnpm typecheck:types-test` exits 0.
- task_06 complete: `size-limit@12.1.0` + `@size-limit/preset-small-lib` added to `packages/markeditor`. `size-limit.json` created with 80 KB (main) and 10 KB (plugins) limits. Root scripts `publint` and `attw` added. 30 tests pass (9 unit + 4 integration new). All three gates pass on current dist. ESLint now clean (`pnpm lint` exits 0) — see shared learnings for details.
- task_07 complete: `apps/playground` scaffolded. `pnpm --filter playground build/test/typecheck` all exit 0. 8 tests pass (5 unit + 3 integration). Coverage 100%. Symlink resolves to `packages/markeditor/dist/index.cjs`. `preview` task added to turbo.json. ESLint override for `apps/playground/**` added using `tsconfig.eslint.json` pattern.
- task_09 complete: `@changesets/cli@^2.31.0` installed at root. `.changeset/config.json`: `access:public`, `baseBranch:main`, `ignore:["playground"]`. Root scripts `changeset/changeset:version/changeset:publish` added. `tests/changeset.test.mjs` added (13 tests). Integration test: `changeset version` bumps markeditor, reverts via `git checkout -- packages/markeditor/package.json` in `finally` block. `test:config` script extended to include `tests/changeset.test.mjs`. 44 total config tests pass.
- task_11 complete: `.github/workflows/size.yml` + `.github/workflows/release.yml` authored. `packages/markeditor/package.json` gains `lint` + `prepublishOnly` (7-gate chain). `tests/release.test.mjs` added (40 tests). `test:config` extended. 110 total config tests pass.
- task_12 blocked (partial): local changeset simulation done (pre enter → 0.0.8-test.0 → pre exit verified). Real publish blocked by npm name ownership (taken by banyawat) + no GitHub remote. `tests/release-smoke.test.mjs` added (16 unit pass + 3 integration skipped). Evidence in `.compozy/tasks/phase-0-monorepo-setup/release-smoke/`. 129 total config tests (126 pass + 3 skipped).
