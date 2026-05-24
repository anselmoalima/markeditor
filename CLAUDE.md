# CLAUDE.md

Guia operacional do projeto **bob-editor** para o Claude Code. Conteúdo derivado do `PRD.md` (v1.1). Em caso de conflito, o PRD é a fonte autoritativa.

---

## 1. Visão geral

`bob-editor` é um componente React (`<BobEditor />`) distribuído como pacote NPM. Oferece um editor Markdown completo com:

- **Modo toggle** (edit ↔ preview, sem split view)
- **Monaco Editor** como engine de edição (lazy load)
- **Pipeline unified** (remark/rehype) para renderização
- **Markdown estendido**: GFM, math (KaTeX), Mermaid, alerts/callouts, footnotes
- **Sistema de plugins** com lifecycle hooks e `EditorAPI` imperativa
- **Toolbar e atalhos** totalmente customizáveis
- **Sanitização XSS** por padrão (`rehype-sanitize`)
- **Temas** light/dark/auto + customizado via CSS variables
- **i18n**, persistência localStorage, upload de imagens, export HTML/MD

**Estratégia de entrega:** monorepo pnpm + Turborepo. Apenas `packages/bob-editor` é publicado no NPM. `apps/playground` é app Vite de teste, NÃO vai para o registry.

---

## 2. Stack obrigatória

| Camada | Tecnologia |
|---|---|
| Linguagem | TypeScript ^5.0 (strict) |
| UI | React ^18.0 \|\| ^19 (peerDep) |
| Editor | `@monaco-editor/react` ^4.6, `monaco-editor` ^0.46 |
| Pipeline | `unified` ^11, `remark-parse`, `remark-gfm`, `remark-math`, `remark-rehype`, `rehype-katex`, `rehype-highlight`, `rehype-sanitize`, `rehype-react`, `rehype-slug` |
| Math/Diagrams | `katex` ^0.16, `mermaid` ^10, `highlight.js` ^11 |
| Build da lib | `tsup` (dual ESM/CJS + d.ts + CSS) |
| Build do playground | Vite ^5 |
| Monorepo | pnpm workspaces + Turborepo |
| Testes | Vitest, @testing-library/react, user-event, jest-dom, jsdom, expect-type, MSW, Playwright, axe-core, jest-axe |
| Quality gates | `size-limit`, `publint`, `@arethetypeswrong/cli`, ESLint, Prettier |
| Release | Changesets + GitHub Actions OIDC (`npm publish --provenance`) |
| Node | >= 18 (matrix CI: 18/20/22) |

Não substituir dependências sem autorização explícita.

---

## 3. Estrutura de pastas

```
markdow-editor/
├── package.json                       # raiz: scripts orchestration
├── pnpm-workspace.yaml                # packages/*, apps/*
├── turbo.json
├── tsconfig.base.json
├── .changeset/
├── .github/workflows/                 # ci.yml, release.yml, size.yml
├── packages/
│   └── bob-editor/                    # ← PACOTE PUBLICADO
│       ├── package.json               # name: "bob-editor"
│       ├── tsup.config.ts
│       ├── vitest.config.ts
│       ├── size-limit.json
│       ├── src/
│       │   ├── index.ts               # entry público
│       │   ├── BobEditor.tsx
│       │   ├── components/            # Editor, Preview, Toolbar, Dialogs, ModeToggle
│       │   ├── core/                  # pipeline, sanitize, EditorAPI, pluginManager, shortcutManager
│       │   ├── plugins/               # builtin + types
│       │   ├── themes/
│       │   ├── hooks/
│       │   ├── utils/
│       │   ├── i18n/
│       │   ├── styles/                # 'bob-editor/styles'
│       │   └── types.ts
│       └── tests/
│           ├── unit/                  # *.test.ts
│           ├── integration/           # *.test.tsx (RTL + user-event)
│           ├── type/                  # *.test-d.ts
│           └── fixtures/              # markdown samples
├── apps/
│   ├── playground/                    # ← Vite app, NÃO publicado
│   │   ├── src/scenarios/             # rotas: /, /uncontrolled, /custom-toolbar, /with-plugins, /math, /mermaid, /alerts, /image-upload, /storage, /themes, /i18n, /export, /large-document, /readonly, /ssr-safe
│   │   └── e2e/                       # Playwright contra o playground
│   └── docs/                          # opcional: Storybook + Docusaurus
└── examples/                          # snippets curtos (lidos pelo README)
```

`packages/bob-editor` consome via `"bob-editor": "workspace:*"` (symlink pnpm + HMR).

---

## 4. Comandos principais

Executar a partir da raiz do monorepo.

```bash
# Instalação
pnpm install

# Dev
pnpm --filter bob-editor dev          # build watch da lib
pnpm --filter playground dev          # playground HMR

# Build
pnpm -r build                         # tudo (Turbo cuida da ordem)
pnpm --filter bob-editor build        # só a lib

# Testes
pnpm --filter bob-editor test                  # vitest run
pnpm --filter bob-editor test:watch
pnpm --filter bob-editor test:coverage
pnpm --filter bob-editor test:types            # vitest --typecheck
pnpm --filter playground e2e                   # Playwright

# Quality
pnpm --filter bob-editor typecheck             # tsc --noEmit
pnpm --filter bob-editor lint                  # eslint . --max-warnings 0
pnpm --filter bob-editor size                  # size-limit
pnpm --filter bob-editor publint               # lint do package.json
pnpm --filter bob-editor attw                  # arethetypeswrong

# Release
pnpm changeset                                 # criar entry de versão
pnpm changeset version                         # bump local
pnpm changeset publish                         # publica (CI faz isso)
```

`prepublishOnly` roda: `build → test → typecheck → lint → publint → attw → size`. Não pular.

---

## 5. Convenções de código

### TypeScript
- `strict: true`, `noUncheckedIndexedAccess: true`, `exactOptionalPropertyTypes: true`
- Tipos públicos vivem em `packages/bob-editor/src/types.ts` e são re-exportados pelo `index.ts`
- Type-tests (`tests/type/*.test-d.ts`) garantem que props públicas não regridem — qualquer mudança em `BobEditorProps`, `EditorAPI`, `BobEditorPlugin`, `KeyboardShortcut`, `ToolbarButton` requer atualização desses testes

### React
- Componentes funcionais. Hooks customizados em `src/hooks/`
- `forwardRef` para expor `BobEditorRef` (API imperativa: `getValue`, `setValue`, `focus`, `getMode`, `setMode`, `insertText`, `getSelection`, `exportAsHtml`, `exportAsMarkdown`)
- Suportar modo controlado (`value` + `onChange`) e não-controlado (`defaultValue`) — mesma lógica vale para `mode`/`defaultMode`
- Cleanup obrigatório em `useEffect` para listeners, debounces, plugin `onMount` returns

### Estilo
- CSS via CSS variables (`--mde-*`). Override por consumidor é via CSS, não por prop
- `sideEffects: ["**/*.css"]` no package.json — JS é puro
- CSS bundlado distribuído em `dist/styles.css`, importável como `bob-editor/styles`

### Plugins
- Interface `BobEditorPlugin` formal (ver PRD §5.5.1 e §9)
- Built-in ativos por padrão: `gfm`, `math`, `mermaid`, `alerts`, `footnotes`
- Built-in opt-in: `emoji`, `mentions`, `wordCount`, `tableOfContents`
- Plugins exportados via subpath: `bob-editor/plugins/emoji`, etc.

### Atalhos
- Sintaxe `Mod+B` (Mod = Cmd no Mac, Ctrl em Windows/Linux)
- Cada atalho default tem `id` estável — sobrescrever ou desabilitar por `id`

---

## 6. Testes (TDD obrigatório)

**Filosofia:** toda RF começa por teste falhando antes de código de produção. Sem exceção.

**Pirâmide:**
1. **Unit** (Vitest) — pipeline puro, sanitize, helpers, plugin built-ins, debounce, shortcut/plugin managers
2. **Integration** (RTL + user-event) — `<BobEditor />`, toolbar, modais, atalhos, toggle, persistência, controlado vs não-controlado
3. **Type** (`expect-type`) — props públicas, `EditorAPI`, plugin interface
4. **E2E** (Playwright em `apps/playground`) — digitação, toggle, atalhos cross-OS, upload mockado (MSW), export
5. **A11y** — `jest-axe` (unit) e `@axe-core/playwright` (e2e). Zero violações WCAG 2.1 AA
6. **Bench** (`vitest bench`) — render em doc 10k linhas. Falha CI se > 1.2× baseline

**Cobertura mínima:** ≥ 80% linhas, ≥ 75% branches (Vitest v8). PR só merge com testes verdes.

**Obrigatório por categoria** (ver PRD §6.7.4):
- Pipeline: cada feature de RF-5.3.2 com fixture in/out (`tests/fixtures/`)
- Sanitização: bateria do OWASP XSS Filter Cheat Sheet (`<script>`, `onerror`, `javascript:`, `data:` malicioso)
- Toolbar: cada botão default + custom button + hide/override
- Atalhos: cada atalho de RF-5.6.1 + override + disable + cross-platform
- Plugins: cada lifecycle hook + ordem de execução + cleanup
- Persistência: mount com storage, autoSave debounce, restore, conflito controlado vs storage
- Imagens: upload sucesso/falha (rollback), drag-drop, paste
- Export: HTML, Markdown, download, print
- Tema: light, dark, auto (mock `matchMedia`), customizado
- i18n: trocar locale em runtime, fallback `en`
- A11y: axe em edit, preview, cada modal, cada tema

---

## 7. Restrições críticas (PRD)

### Não-objetivos v1.0 (NÃO implementar)
- WYSIWYG verdadeiro
- Split view (edit + preview simultâneo)
- Colaboração em tempo real (Y.js/CRDT)
- Sync com backend
- Plugins remotos carregados de URL
- SSR completo do preview (Monaco é client-only — fallback de textarea em SSR)

### Performance (alvos não-negociáveis)
- Bundle gzip sem Monaco: < 80 KB
- Bundle gzip com Monaco lazy: < 500 KB
- Re-render preview em 10k linhas: < 300 ms
- Debounce preview: 150 ms (configurável via `previewDebounceMs`)
- Monaco lazy load: < 500 ms em 4G

`size-limit` enforced em CI bloqueia PR que estoure.

### Segurança
- `rehype-sanitize` com schema GitHub ativo por padrão
- Atributos `on*` sempre removidos
- `javascript:` URLs sempre bloqueadas
- `data:` URLs apenas para imagens (configurável)
- `allowHtml` permite HTML inline mas **sempre sanitizado**

### Acessibilidade
- WCAG 2.1 AA — zero violações
- Toolbar navegável por Tab/Arrow
- `aria-label`, `aria-pressed`, `aria-disabled` em botões
- Focus trap em modais
- `aria-live` para mudança de modo
- Foco visível em todos os interativos

### Pacote NPM
- `name`: `bob-editor` (exato — reservar no registry)
- `license`: MIT
- `exports` map completo (ver PRD §6.6.2) — subpaths `./styles`, `./plugins`, `./plugins/*`
- Dual ESM + CJS + types + source maps
- `peerDependencies`: `react`, `react-dom` (`^18 || ^19`)
- `sideEffects: ["**/*.css"]`
- `files`: whitelist `["dist", "README.md", "CHANGELOG.md", "LICENSE"]` (sem `.npmignore`)
- Publicação com `--provenance --access public` via OIDC

---

## 8. Fases de implementação (PRD §11)

Cada fase é entregável independente:

- **Fase 0** — Setup monorepo + infra (pnpm, Turbo, tsup, Vitest, Playwright, Changesets, CI/CD, size-limit, publint, attw)
- **Fase 1** — MVP: pipeline básico + Monaco lazy + toggle edit/preview + temas light/dark → **v0.1.0**
- **Fase 2** — Toolbar completa + atalhos + modais + i18n → **v0.2.0**
- **Fase 3** — Math, Mermaid, alerts, footnotes, code blocks com highlight + copy → **v0.3.0**
- **Fase 4** — Sistema de plugins formal + built-ins (emoji, mentions, wordCount, tableOfContents) → **v0.4.0**
- **Fase 5** — Upload de imagens, drag-drop, paste, persistência localStorage, export HTML/MD, sticky toolbar, temas custom → **v0.5.0**
- **Fase 6** — Polish, a11y audit, perf audit, docs, Storybook, e2e, deploy playground, publish → **v1.0.0**

Antes de iniciar fase nova, validar contra critérios de aceitação da fase anterior.

---

## 9. Definition of Done (v1.0 — PRD §12)

1. Todos RF-5.x implementados
2. Todos RNF (§6) atendidos, incluindo §6.6 (NPM) e §6.7 (Testes)
3. Cobertura ≥ 80% linhas / 75% branches
4. `tsc --noEmit` zero erros em todos os workspaces
5. `eslint . --max-warnings 0` limpo
6. `publint` + `attw` zero warnings
7. `size-limit` passa todos limites
8. Docs completas (README pacote + README raiz + Storybook)
9. Playground cobre todos cenários §7.5 e está deployado
10. 4+ exemplos em `examples/`
11. Axe zero violações AA (unit + e2e)
12. Playwright cobre digitar, toggle, atalhos, upload, export
13. Bundle dentro dos limites
14. Type-tests garantem estabilidade da API pública
15. CI verde em matrix Node 18/20/22 × React 18/19
16. Publicado no NPM com ESM + CJS + types + CSS + provenance
17. Changesets configurado
18. LICENSE, CHANGELOG, README no tarball

---

## 10. Riscos conhecidos (PRD §14)

| Risco | Mitigação |
|---|---|
| Monaco pesado e SSR-incompatível | Lazy load + fallback de textarea em SSR |
| KaTeX/Mermaid quebram em conteúdo malformado | Catch erros, exibir mensagem inline, não derrubar o preview inteiro |
| Pipeline `unified` é assíncrono | `useEffect` + estado, loading sutil |
| Conflitos de atalho com SO | Atalhos conservadores + permitir override |
| Sanitização agressiva quebra conteúdo legítimo | Schema GitHub customizável |
| Bundle escala com plugins | Tree-shaking + plugins lazy |
| Memory leaks com unmount frequente | Cleanup em todo hook e plugin `onMount` |

---

## 11. Pontos de atenção para o agente

- **Não criar arquivos fora de `packages/bob-editor` ou `apps/playground` sem motivo claro.** Esta é uma lib publicável — escopo importa.
- **Não vazar TailwindCSS, React Router ou outras escolhas do playground para a lib.** O playground é app de demo, não tem influência no bundle do pacote.
- **Não publicar nada do `apps/`.** Apenas `packages/bob-editor` vai pro NPM.
- **TDD não é opcional** — se for adicionar feature de RF, escrever teste falhando primeiro.
- **Nome do pacote é `bob-editor`** (PRD evoluiu de `bobmd`). Em qualquer divergência no PRD, esse é o nome correto.
- **Componente principal é `<BobEditor />`** — não renomear sem aprovação.
- **Pipeline é assíncrono** — `unified().process()` retorna Promise. Não tratar como síncrono.
- **Monaco é client-only** — qualquer renderização SSR precisa de fallback (textarea ou skeleton).
- **CSS variables são o contrato visual** — toda customização visual passa por `--mde-*`. Não usar styled-components, emotion, ou Tailwind dentro da lib.
- **Antes de marcar tarefa completa, rodar `pnpm -r build && pnpm -r test && pnpm -r typecheck && pnpm -r lint`** localmente.

---

## 12. Referências

- PRD canônico: `./PRD.md` (v1.1)
- AGENTS.md: contrato análogo para agentes não-Claude
- CommonMark: https://spec.commonmark.org/
- GFM: https://github.github.com/gfm/
- unified: https://unifiedjs.com/
- Monaco: https://microsoft.github.io/monaco-editor/
- WCAG 2.1: https://www.w3.org/TR/WCAG21/
