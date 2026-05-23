# Task Memory: task_03.md

Keep only task-local execution context here. Do not duplicate facts that are obvious from the repository, task file, PRD documents, or git history.

## Objective Snapshot

ESLint flat v9 + Prettier + Husky/lint-staged — **completed**.

## Important Decisions

- `pnpm lint` set to `eslint . --max-warnings 0` (not `turbo run lint`) — flat config at root covers full tree, no per-workspace lint scripts needed.
- `allowDefaultProject: ['tests/fixtures/*.ts']` added to `projectService` so test fixtures get type-aware lint without a dedicated tsconfig.
- Used named import `{ flatConfigs as importXFlatConfigs }` from `eslint-plugin-import-x` to avoid `import-x/no-named-as-default-member` warning on the config file itself.
- Updated `tests/config.test.mjs` to remove `lint` from "must use turbo run" assertion — lint now runs ESLint directly.
- Integration tests implemented via direct `eslint --fix` and `prettier --write` on temp dirs (not full git staging simulation) — adequate for verifying the commands lint-staged runs.

## Files / Surfaces

- `eslint.config.js` (new)
- `.prettierrc` (new)
- `.prettierignore` (new)
- `.husky/pre-commit` (new)
- `.husky/_/` (Husky internals, auto-generated)
- `package.json` (updated: prepare, lint, format, format:check scripts; lint-staged block; devDeps)
- `tests/lint.test.mjs` (new — 22 tests)
- `tests/fixtures/eslint-bad.ts` (new)
- `tests/fixtures/eslint-clean.ts` (new)
- `tests/config.test.mjs` (updated: lint script assertion)
- All repo files reformatted by `pnpm format` run

## Ready for Next Run

task_04 (packages/markmd skeleton) can proceed. Every `.ts`/`.tsx` file it adds must pass `pnpm lint`.
