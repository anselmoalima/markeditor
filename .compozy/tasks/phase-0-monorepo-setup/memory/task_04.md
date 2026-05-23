---
name: task-04-memory
description: Task-local execution context for task_04 — packages/markeditor skeleton + tsup dual build
metadata:
  type: project
---

# Task Memory: task_04.md

## Status

**COMPLETED** — all verification green.

## Objective Snapshot

Create `packages/markeditor` with Phase 0 skeleton:
- `MarkEditor` forwardRef placeholder, `types.ts`, `index.ts`, `styles/index.css`, `plugins/index.ts`
- `tsup.config.ts` → dual ESM/CJS + `.d.ts` + `.d.cts` + CSS
- `package.json` with correct exports map, sideEffects, peerDeps, engines, files
- Vitest unit + integration tests pass
- `pnpm --filter markeditor build` produces complete `dist/`

## Decisions Made

- CSS handled by postscript copy in build script: `node -e "...copyFileSync('src/styles/index.css','dist/styles.css')"` — tsup CSS entry unreliable without format key.
- `exports` map uses **fully-nested** format for each condition: `"import": { "types": "...", "default": "..." }` and `"require": { "types": "...", "default": "..." }`. Flat top-level `"types"` causes FalseESM in CJS context per attw.
- `./styles` export uses `{ "style": "...", "default": "..." }` — no `types` field (CSS has none). attw run with `--exclude-entrypoints ./styles`.
- attw script args: `--ignore-rules no-resolution --exclude-entrypoints ./styles`. `no-resolution` covers node10 (out of scope for `engines.node: ">=18.18"`).
- `@arethetypeswrong/cli` pinned to `^0.16.4`.
- `dts: true` in tsup generates `.d.ts` (ESM) + `.d.cts` (CJS) correctly.
- `splitting: true` for ESM; tsup handles correctly with dual format.

## Fixes Applied During Implementation

1. **`tests/setup.ts`**: Changed `import '@testing-library/jest-dom'` → `import '@testing-library/jest-dom/vitest'` + added `import { afterEach } from 'vitest'; afterEach(cleanup)`. Vitest multi-project config does not auto-cleanup DOM and does not expose global `expect` for the jest-dom shim.
2. **`package.json` exports map**: Moved from flat `"types": "...d.ts"` at root to fully-nested per-condition format. Fixes attw FalseESM.
3. **fflate streaming Gunzip bug in attw**: `createPackage.js` in `@arethetypeswrong/core@0.16.4` uses `(chunk) => (unzipped = chunk)` — Gunzip calls callback twice (data, then empty), capturing empty. Manually patched installed file to accumulate chunks. **Risk: patch lost on `pnpm install`.**

## Files / Surfaces

- `packages/markeditor/package.json`
- `packages/markeditor/tsconfig.json`
- `packages/markeditor/tsup.config.ts`
- `packages/markeditor/vitest.config.ts`
- `packages/markeditor/src/types.ts`
- `packages/markeditor/src/index.ts`
- `packages/markeditor/src/MarkEditor.tsx`
- `packages/markeditor/src/styles/index.css`
- `packages/markeditor/src/plugins/index.ts`
- `packages/markeditor/tests/setup.ts`
- `packages/markeditor/tests/unit/MarkEditor.test.tsx`
- `packages/markeditor/tests/integration/build.test.ts`

## Verification Evidence

- `pnpm build` exit 0: dist/{index.mjs,index.cjs,index.d.ts,index.d.cts,styles.css,plugins/*} ✓
- `tsc --noEmit` exit 0 ✓
- `vitest run --coverage`: 16/16 pass, stmts 100%, branches 100%, functions 83.33%, lines 100% ✓
- `publint`: "All good!" ✓
- `attw --pack . --ignore-rules no-resolution --exclude-entrypoints ./styles`: "No problems found 🌟" ✓
- ESM + CJS Node.js smoke: both exit 0 ✓

## Handoff

Task complete. task_05 (Vitest config smoke unit + type tests) can now proceed — Vitest config already lives in `packages/markeditor/vitest.config.ts`; task_05 may need to consolidate or extend it. Note that the `vitest.config.ts` uses the `projects` multi-project API.
