# Task Memory: task_07.md

Keep only task-local execution context here. Do not duplicate facts that are obvious from the repository, task file, PRD documents, or git history.

## Objective Snapshot

Scaffold `apps/playground` as a private Vite+React app consuming `markeditor` via `workspace:*`, prove the symlink works, wire Turbo `preview` task.

## Important Decisions

- Excluded `src/main.tsx` from coverage scope (entry point, not unit-testable without DOM harness). Only `src/App.tsx` in coverage include.
- Used `pnpm exec vite preview --port PORT --strictPort` in integration test rather than the npm script, to allow dynamic port injection.
- Static grep test (readFileSync + regex) used to assert `App.tsx` imports `markeditor/styles` — simpler than Vite import graph inspection.
- Added `tsconfig.eslint.json` to playground following the same pattern as `packages/markeditor` (extends tsconfig.json, includes tests/**).
- Updated `eslint.config.js` `apps/*` placeholder to use `projectService: false, project: './apps/playground/tsconfig.eslint.json'`.
- `turbo.json` `preview` task: `dependsOn: ["build"], cache: false` — preview depends on local build, not cacheable.

## Learnings

- `getFreePort()` via `createServer().listen(0)` + `waitForServer()` polling loop (300ms intervals, 15s max) reliably starts vite preview in integration tests.
- `require.resolve('markeditor', { paths: [playgroundDir] })` resolves to `packages/markeditor/dist/index.cjs` — confirms workspace symlink, not hoisted copy.
- `vitest.config.ts` must import `@vitejs/plugin-react` when unit tests render components that ultimately import from built markeditor dist (react JSX runtime needs to be consistent).

## Files / Surfaces

- `apps/playground/package.json`
- `apps/playground/vite.config.ts`
- `apps/playground/tsconfig.json`
- `apps/playground/tsconfig.eslint.json`
- `apps/playground/index.html`
- `apps/playground/src/main.tsx`
- `apps/playground/src/App.tsx`
- `apps/playground/vitest.config.ts`
- `apps/playground/tests/setup.ts`
- `apps/playground/tests/unit/App.test.tsx`
- `apps/playground/tests/unit/config.test.ts`
- `apps/playground/tests/integration/build.test.ts`
- `turbo.json` — added `preview` task
- `eslint.config.js` — replaced `apps/*` placeholder with `apps/playground/**` override

## Errors / Corrections

None. First run succeeded.

## Ready for Next Run

- task_08 (Playwright config + smoke e2e + axe) targets this playground. The `pnpm --filter playground preview` command is what the Playwright `webServer` config will use to start the app.
- Playground `dist/` must be present for Playwright e2e (ensure `pnpm --filter playground build` runs in CI before e2e step).
