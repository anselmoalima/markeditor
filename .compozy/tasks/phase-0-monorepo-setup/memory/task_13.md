# Task Memory: task_13.md

## Objective Snapshot

Root README.md, packages/markeditor/README.md, CONTRIBUTING.md — with badges, cross-links, TDD policy, Changesets + OIDC release procedure.

## Important Decisions

- `packages/markeditor/README.md` links LICENSE badge to `https://github.com/anselmoalima/markeditor` (not local `LICENSE` or GitHub blob) because `packages/markeditor/` has no LICENSE file and GitHub blob URLs return 404 until first push.
- CHANGELOG.md link replaced with `https://github.com/anselmoalima/markeditor/releases` for same reason.
- Added `markdown-link-check@^3.13.7` to root devDependencies.
- `.markdown-link-check.json` ignores: playground URL, npm/bundlephobia package pages, codecov project, CI badge SVG (all pre-publish or pre-first-CI-run).
- CI badge SVG `badge.svg` returns 404 until first workflow run — added to ignore list.
- Integration tests use `spawnSync('pnpm', ['exec', 'markdown-link-check', ...], { cwd: rootDir })`.

## Learnings

- `markdown-link-check` checks both image src URLs and anchor link URLs in badge markdown.
- GitHub Actions badge SVG endpoint is only live after first workflow run.
- Local relative links in pkg README resolve relative to the pkg dir, not repo root.

## Files / Surfaces

- `README.md` (root) — created
- `packages/markeditor/README.md` — created
- `CONTRIBUTING.md` — rewritten
- `packages/markeditor/tests/unit/docs.test.ts` — created (28 unit tests)
- `packages/markeditor/tests/integration/docs-links.test.ts` — created (6 integration tests)
- `.markdown-link-check.json` — created
- `package.json` (root) — added `markdown-link-check` devDep

## Errors / Corrections

- Initial LICENSE badge in pkg README linked to local `LICENSE` (400 error) — fixed to repo URL.
- Initial CHANGELOG link used GitHub blob URL that returns 404 before push — fixed to `/releases`.
- MD034 lint warning on bare URL in root README — fixed to proper markdown link.
- MD060 table alignment in CONTRIBUTING.md — reformatted to minimal pipe style.

## Ready for Next Run

Task completed. 64/64 tests pass. Lint + typecheck clean.
