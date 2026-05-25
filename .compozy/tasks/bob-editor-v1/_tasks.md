# bob-editor v1 — Task List

## Tasks

| #   | Title                                                                             | Status    | Complexity | Dependencies                                         |
| --- | --------------------------------------------------------------------------------- | --------- | ---------- | ---------------------------------------------------- |
| 01  | Monorepo scaffold — pnpm workspaces, Turborepo, CI/CD, Changesets                 | completed | high       | —                                                    |
| 02  | packages/bob-editor scaffold — tsup, exports map, apps/playground                 | completed | high       | task_01                                              |
| 03  | Public type surface + type tests                                                  | completed | medium     | task_02                                              |
| 04  | Core state — reducer, contexts, EditorAPI factory                                 | completed | high       | task_03                                              |
| 05  | Core pipeline — unified, sanitize merger, lazy registry, utils                    | completed | high       | task_03                                              |
| 06  | Plugin manager + shortcut manager                                                 | pending   | medium     | task_04, task_05                                     |
| 07  | MVP: BobEditor shell + Monaco lazy + textarea fallback + toggle + themes (v0.1.0) | pending   | critical   | task_04, task_05, task_06                            |
| 08  | Toolbar + modals + default shortcuts + i18n base (v0.2.0)                         | pending   | high       | task_07                                              |
| 09  | Extended markdown — math, mermaid, alerts, footnotes, highlight (v0.3.0)          | pending   | high       | task_05, task_07                                     |
| 10  | Opt-in built-in plugins — emoji, mentions, wordCount, TOC (v0.4.0)                | pending   | medium     | task_06, task_09                                     |
| 11  | Image upload + storage + export + sticky toolbar + custom themes (v0.5.0)         | pending   | high       | task_07, task_08                                     |
| 12  | Playground scenarios (15 routes) + Playwright E2E                                 | pending   | high       | task_07, task_08, task_09, task_10, task_11          |
| 13  | A11y audit + perf bench + docs + examples + publish v1.0.0                        | pending   | critical   | task_07, task_08, task_09, task_10, task_11, task_12 |
