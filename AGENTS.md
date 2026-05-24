# AGENTS.md

Contrato para agentes de IA (Claude, Codex, Cursor, Aider, Continue, etc.) trabalhando no repositório **bob-editor**. Derivado do `PRD.md` v1.1. Em conflito, o PRD prevalece.

> **Leitura obrigatória antes de qualquer task:** `./DESIGN.md` — sistema de design, tokens visuais e diretrizes de UI/UX do projeto. Toda decisão de UI deve respeitar o documento.

Companion: `CLAUDE.md` (mesmo conteúdo, formato Claude Code). Ambos refletem as mesmas regras — manter sincronizados.

---

## Projeto

`bob-editor` — componente React `<BobEditor />` distribuído como pacote NPM. Editor Markdown com modo toggle (edit ↔ preview), Monaco como engine, pipeline unified (remark/rehype), suporte a GFM + math + Mermaid + alerts + footnotes, sistema de plugins, toolbar configurável, atalhos customizáveis.

- **Pacote publicado:** `bob-editor` (NPM)
- **Componente principal:** `<BobEditor />`
- **Distribuição:** monorepo pnpm. Só `packages/bob-editor` vai pro NPM. `apps/playground` é app de teste, nunca publicado.

---

## Setup

```bash
# Pré-requisitos: Node >= 18, pnpm >= 9
pnpm install
```

Estrutura:

```
markdow-editor/
├── package.json                # raiz: scripts orchestration
├── pnpm-workspace.yaml
├── turbo.json
├── tsconfig.base.json
├── .changeset/
├── packages/
│   └── bob-editor/             # PACOTE NPM PUBLICADO
│       ├── src/
│       │   ├── index.ts        # entry público
│       │   ├── BobEditor.tsx
│       │   ├── components/
│       │   ├── core/           # pipeline, sanitize, EditorAPI, pluginManager, shortcutManager
│       │   ├── plugins/        # builtin + types
│       │   ├── themes/
│       │   ├── hooks/
│       │   ├── utils/
│       │   ├── i18n/
│       │   ├── styles/
│       │   └── types.ts
│       └── tests/
│           ├── unit/
│           ├── integration/
│           ├── type/
│           └── fixtures/
├── apps/
│   ├── playground/             # Vite app de teste (private: true)
│   └── docs/                   # opcional: Storybook + Docusaurus
└── examples/
```

---

## Stack

**Não substituir sem autorização.**

| Camada | Tecnologia |
|---|---|
| Linguagem | TypeScript ^5 (strict) |
| UI | React ^18 \|\| ^19 (peerDep) |
| Editor | `@monaco-editor/react` ^4.6, `monaco-editor` ^0.46 |
| Pipeline | `unified` ^11 + `remark-parse` + `remark-gfm` + `remark-math` + `remark-rehype` + `rehype-katex` + `rehype-highlight` + `rehype-sanitize` + `rehype-react` + `rehype-slug` |
| Math/Diagrams | `katex` ^0.16, `mermaid` ^10, `highlight.js` ^11 |
| Build lib | `tsup` (dual ESM/CJS + d.ts + CSS) |
| Build playground | Vite ^5 |
| Monorepo | pnpm workspaces + Turborepo |
| Testes | Vitest, @testing-library/react, user-event, jest-dom, jsdom, expect-type, MSW, Playwright, axe-core, jest-axe |
| Quality | size-limit, publint, @arethetypeswrong/cli, ESLint, Prettier |
| Release | Changesets + GitHub Actions OIDC (`npm publish --provenance`) |

---

## Comandos

Executar da raiz.

```bash
# Dev
pnpm --filter bob-editor dev          # tsup --watch
pnpm --filter playground dev          # HMR

# Build
pnpm -r build
pnpm --filter bob-editor build

# Testes
pnpm --filter bob-editor test
pnpm --filter bob-editor test:watch
pnpm --filter bob-editor test:coverage
pnpm --filter bob-editor test:types
pnpm --filter playground e2e          # Playwright

# Quality gates
pnpm --filter bob-editor typecheck    # tsc --noEmit
pnpm --filter bob-editor lint         # eslint . --max-warnings 0
pnpm --filter bob-editor size         # size-limit
pnpm --filter bob-editor publint
pnpm --filter bob-editor attw

# Release
pnpm changeset
pnpm changeset version
pnpm changeset publish
```

`prepublishOnly` encadeia: build → test → typecheck → lint → publint → attw → size. Não pular.

---

## Convenções

### TypeScript
- `strict: true`, `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`
- Tipos públicos em `packages/bob-editor/src/types.ts`, re-exportados pelo `index.ts`
- Type-tests obrigatórios: `tests/type/*.test-d.ts` (expect-type). Qualquer mudança em `BobEditorProps`, `EditorAPI`, `BobEditorPlugin`, `KeyboardShortcut`, `ToolbarButton` requer atualização

### React
- Componentes funcionais. Hooks customizados em `src/hooks/`
- `forwardRef` expondo `BobEditorRef`: `getValue`, `setValue`, `focus`, `getMode`, `setMode`, `insertText`, `getSelection`, `exportAsHtml`, `exportAsMarkdown`
- Suportar controlado (`value` + `onChange`) e não-controlado (`defaultValue`). Mesma regra para `mode`/`defaultMode`
- Cleanup obrigatório em `useEffect`, listeners, debounces, plugin `onMount` return functions

### Estilo
- CSS via CSS variables `--mde-*`. Override pelo consumidor é via CSS, não prop
- `sideEffects: ["**/*.css"]` — JS puro
- CSS bundlado em `dist/styles.css`, import via `bob-editor/styles`
- **NÃO usar** styled-components, emotion, TailwindCSS dentro da lib (Tailwind é só do playground)

### Plugins
- Interface `BobEditorPlugin` formal (PRD §5.5.1, §9)
- Built-in ativos por padrão: `gfm`, `math`, `mermaid`, `alerts`, `footnotes`
- Built-in opt-in: `emoji`, `mentions`, `wordCount`, `tableOfContents`
- Exportados via subpath: `bob-editor/plugins/emoji`, etc.

### Atalhos
- Sintaxe `Mod+B` (Mod = Cmd no Mac, Ctrl no resto)
- Cada atalho default tem `id` estável para override/disable

---

## Testes (TDD obrigatório)

**Filosofia:** toda RF começa por teste falhando antes de código de produção.

**Pirâmide:**
1. Unit (Vitest) — pipeline, sanitize, helpers, plugin built-ins, debounce, managers
2. Integration (RTL + user-event) — `<BobEditor />`, toolbar, modais, atalhos, toggle, persistência
3. Type (expect-type) — props públicas, EditorAPI, plugin interface
4. E2E (Playwright em `apps/playground`) — digitação, toggle, atalhos cross-OS, upload MSW, export
5. A11y — jest-axe (unit) + @axe-core/playwright (e2e). Zero violações WCAG 2.1 AA
6. Bench (`vitest bench`) — doc 10k linhas. Falha CI se > 1.2× baseline

**Cobertura mínima:** ≥ 80% linhas, ≥ 75% branches (Vitest v8 coverage).

**Obrigatório por categoria** (PRD §6.7.4):

| Categoria | Cobertura |
|---|---|
| Pipeline | Cada feature de RF-5.3.2 com fixture in/out |
| Sanitização | Bateria OWASP XSS Filter Cheat Sheet (`<script>`, `onerror`, `javascript:`, `data:` malicioso) |
| Toolbar | Cada botão default + custom + hide/override |
| Atalhos | Cada atalho de RF-5.6.1 + override + disable + cross-platform |
| Plugins | Cada lifecycle hook + ordem + cleanup |
| Persistência | Mount com storage, autoSave debounce, restore, conflito controlado vs storage |
| Imagens | Upload sucesso/falha (rollback), drag-drop, paste |
| Export | HTML, Markdown, download, print |
| Tema | light, dark, auto (mock matchMedia), customizado |
| i18n | Trocar locale runtime, fallback `en` |
| A11y | axe em edit, preview, cada modal, cada tema |

---

## Restrições críticas

### Não-objetivos v1.0 (NÃO implementar)
- WYSIWYG verdadeiro
- Split view (edit + preview simultâneo)
- Colaboração em tempo real (Y.js/CRDT)
- Sync com backend
- Plugins remotos carregados de URL
- SSR completo do preview (Monaco é client-only — usar fallback textarea)

### Performance (alvos não-negociáveis)
| Métrica | Limite |
|---|---|
| Bundle gzip sem Monaco | < 80 KB |
| Bundle gzip com Monaco lazy | < 500 KB |
| Re-render preview em 10k linhas | < 300 ms |
| Debounce preview | 150 ms (configurável `previewDebounceMs`) |
| Lazy load Monaco em 4G | < 500 ms |

`size-limit` enforced em CI bloqueia PR que estoure.

### Segurança
- `rehype-sanitize` schema GitHub ativo por padrão
- Atributos `on*` sempre removidos
- `javascript:` URLs sempre bloqueadas
- `data:` URLs só para imagens, configurável
- `allowHtml` permite HTML inline, **sempre sanitizado**

### Acessibilidade
- WCAG 2.1 AA — zero violações
- Toolbar navegável Tab/Arrow
- `aria-label`, `aria-pressed`, `aria-disabled` em botões
- Focus trap em modais
- `aria-live` para mudança de modo
- Foco visível em todos interativos

### Pacote NPM
- `name`: `bob-editor` (exato — reservar no registry)
- `license`: MIT
- `exports` map completo (PRD §6.6.2) com subpaths `./styles`, `./plugins`, `./plugins/*`
- Dual ESM + CJS + types + source maps
- `peerDependencies`: `react`, `react-dom` (`^18 || ^19`)
- `sideEffects: ["**/*.css"]`
- `files`: whitelist `["dist", "README.md", "CHANGELOG.md", "LICENSE"]` (sem `.npmignore`)
- Publicação com `--provenance --access public` via OIDC

---

## Fases (PRD §11)

| Fase | Entregável | Versão |
|---|---|---|
| 0 | Monorepo + infra (pnpm, Turbo, tsup, Vitest, Playwright, Changesets, CI, size-limit, publint, attw) | — |
| 1 | MVP: pipeline básico + Monaco lazy + toggle edit/preview + temas light/dark | 0.1.0 |
| 2 | Toolbar completa + atalhos + modais + i18n | 0.2.0 |
| 3 | Math + Mermaid + alerts + footnotes + code highlight + copy button | 0.3.0 |
| 4 | Sistema de plugins formal + built-ins (emoji, mentions, wordCount, tableOfContents) | 0.4.0 |
| 5 | Upload imagens, drag-drop, paste, localStorage, export HTML/MD, sticky toolbar, temas custom | 0.5.0 |
| 6 | Polish, a11y audit, perf audit, docs, Storybook, e2e, deploy playground, publish | 1.0.0 |

---

## Definition of Done v1.0 (PRD §12)

1. Todos RF-5.x implementados
2. Todos RNF (§6) atendidos, incluindo §6.6 (NPM) e §6.7 (Testes)
3. Cobertura ≥ 80% / 75%
4. `tsc --noEmit` zero erros
5. `eslint --max-warnings 0` limpo
6. `publint` + `attw` zero warnings
7. `size-limit` passa todos limites
8. Docs completas (READMEs + Storybook)
9. Playground cobre todos cenários §7.5 e deployado
10. 4+ exemplos em `examples/`
11. Axe zero violações AA (unit + e2e)
12. Playwright cobre digitar, toggle, atalhos, upload, export
13. Bundle dentro dos limites
14. Type-tests garantem API pública
15. CI verde em matrix Node 18/20/22 × React 18/19
16. Publicado no NPM com ESM + CJS + types + CSS + provenance
17. Changesets configurado
18. LICENSE + CHANGELOG + README no tarball

---

## Pontos de atenção

- **Escopo:** não criar arquivos fora de `packages/bob-editor` ou `apps/playground` sem motivo claro
- **Isolamento da lib:** não vazar Tailwind, React Router ou outras escolhas do playground para o pacote
- **Só publicar `packages/bob-editor`** — nada de `apps/` no registry
- **TDD não é opcional** — feature de RF começa por teste falhando
- **Nome do pacote: `bob-editor`** (PRD evoluiu de `bobmd`). Em divergência no PRD, esse é o correto
- **Componente: `<BobEditor />`** — não renomear sem aprovação
- **Pipeline `unified` é async** — `.process()` retorna Promise
- **Monaco é client-only** — qualquer renderização SSR precisa fallback (textarea/skeleton)
- **CSS variables são o contrato visual** — toda customização passa por `--mde-*`
- **Validação local antes de marcar tarefa pronta:** `pnpm -r build && pnpm -r test && pnpm -r typecheck && pnpm -r lint`

---

## Convenções de PR/commit

- **Commits:** Conventional Commits (`feat:`, `fix:`, `chore:`, `docs:`, `test:`, `refactor:`, `perf:`)
- **Changeset obrigatório** para qualquer PR que altere comportamento público da lib
- **PRs devem passar** todos os quality gates antes de merge: test, lint, typecheck, size, publint, attw, axe
- **Cobertura não pode regredir** abaixo do mínimo (80%/75%)

---

## Referências

- PRD canônico: `./PRD.md` (v1.1)
- **DESIGN.md**: sistema de design, tokens, diretrizes UI/UX — leitura obrigatória
- CLAUDE.md: contrato análogo para Claude Code
- CommonMark: https://spec.commonmark.org/
- GFM: https://github.github.com/gfm/
- unified: https://unifiedjs.com/
- Monaco: https://microsoft.github.io/monaco-editor/
- WCAG 2.1: https://www.w3.org/TR/WCAG21/
