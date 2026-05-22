# CLAUDE.md — Guia do projeto `markmd`

Guia para Claude Code trabalhar neste repositório. Para escopo completo de produto, ler `PRD.md` (fonte canônica). Para sistema de design (cores, tipografia, componentes, espaçamento), **ler e aplicar `DESIGN.md`** — fonte canônica visual para toda UI do playground, docs e componentes da lib.

---

## 1. O que é o projeto

`markmd` — componente React (`<MarkmdEditor />`) distribuído como pacote NPM. Editor Markdown configurável com Monaco Editor + pipeline `unified` (remark/rehype). Modo **toggle** entre `edit` e `preview` (sem split view, sem WYSIWYG na v1).

Stack-alvo: React 18+/19, TypeScript estrito, ESM+CJS dual build.

---

## 2. Layout do monorepo (pnpm workspaces)

```
packages/markmd/        ◀── PACOTE NPM PUBLICADO (única coisa que vai pro registry)
apps/playground/        ◀── App Vite/React de teste e demo (private, NÃO publicado)
apps/docs/              ◀── opcional: Storybook + Docusaurus
examples/               snippets curtos lidos pelo README
.changeset/             versionamento + changelog automático
.github/workflows/      ci.yml, release.yml, size.yml
turbo.json              pipeline build/test/lint/typecheck
```

Workspaces: `packages/*`, `apps/*`. Playground consome lib via `"markmd": "workspace:*"`.

---

## 3. Estrutura interna de `packages/markmd/src/`

```
index.ts            entry público — só re-exports
MarkmdEditor.tsx    componente principal
components/         Editor, Preview, Toolbar, Dialogs, ModeToggle
core/               pipeline, sanitize, EditorAPI, pluginManager, shortcutManager
plugins/            builtin (gfm, math, mermaid, alerts, footnotes, emoji, mentions, wordCount, toc)
themes/             light, dark, auto + tipo MarkmdTheme
hooks/              useDebounce, usePersistence, useShortcuts, etc.
utils/              helpers de markdown, slug, debounce
i18n/               strings en, pt-BR
styles/             CSS bundlado (importável: 'markmd/styles')
types.ts            tipos públicos (MarkmdEditorProps, EditorAPI, MarkmdPlugin, etc.)
```

Tests em `packages/markmd/tests/{unit,integration,type,fixtures}/`. E2E em `apps/playground/e2e/`.

---

## 4. Regras críticas (não negociáveis)

### 4.1 TDD obrigatório
Toda RF começa por teste falhando (Red → Green → Refactor). PR sem testes verdes não merge. Cobertura mínima: **≥80% linhas, ≥75% branches** (Vitest v8).

### 4.2 Nada de UI de demo no pacote publicado
`packages/markmd` exporta **apenas** `<MarkmdEditor />`, hooks, tipos, plugins, CSS. Showcase, controles de demo, theme switcher, rotas — tudo vai em `apps/playground`. Não acoplar Tailwind ou React Router à lib.

### 4.3 Segurança XSS
`rehype-sanitize` ativo **por padrão** (schema GitHub). Atributos `on*` removidos. `javascript:` bloqueado. `data:` só para imagens (configurável). Prop `sanitize` permite customizar mas nunca desligar silenciosamente.

### 4.4 Lazy load
Monaco, KaTeX, Mermaid carregam em chunks separados. Bundle inicial sem Monaco deve ficar **<80KB gzip**. Com Monaco lazy: **<500KB gzip**. `size-limit` enforced em CI — quebra de limite trava PR.

### 4.5 Tree-shaking
`sideEffects: ["**/*.css"]` no `package.json`. Plugins opt-in não devem entrar no bundle se não importados. Subpath exports (`markmd/plugins/emoji`) para imports granulares.

### 4.6 Pipeline unificado
Toda renderização passa por `core/pipeline.ts` baseado em `unified`. Ordem fixa: parse → gfm → math → user remark plugins → rehype → katex → highlight → sanitize → user rehype plugins → react. **Memoizar** output do pipeline. Debounce **150ms** (configurável via `previewDebounceMs`).

### 4.7 Controlado vs não-controlado
Componente suporta ambos. `value`+`onChange` = controlado. `defaultValue` = não-controlado. Mesma lógica para `mode`/`defaultMode`. Se `storage` ativo + `value` passado, `value` ganha.

### 4.8 Atalhos cross-platform
Usar `Mod+` na interface de `KeyboardShortcut.keys` — resolve em `Cmd` no Mac, `Ctrl` no Win/Linux. Testar ambos.

---

## 5. Comandos essenciais

Rodar da raiz (Turborepo orquestra):

| Comando | O que faz |
|---|---|
| `pnpm install` | Instala dependências em todos workspaces |
| `pnpm -r build` | Builda todos os pacotes |
| `pnpm -r test` | Roda testes (Vitest run) |
| `pnpm -r typecheck` | `tsc --noEmit` |
| `pnpm -r lint` | ESLint `--max-warnings 0` |
| `pnpm --filter markmd build` | Builda só o pacote |
| `pnpm --filter playground dev` | Sobe playground em dev |
| `pnpm --filter playground exec playwright test` | E2E |

Pré-publish (em `packages/markmd`): `prepublishOnly` roda `build + test + typecheck + lint + publint + attw + size`.

---

## 6. Convenções de código

- **TypeScript estrito.** Sem `any` em código de produção. Tipos públicos em `types.ts`, exportados de `index.ts`.
- **Componentes**: PascalCase, um por arquivo, mesmo nome do arquivo (`Toolbar.tsx` → `export function Toolbar`).
- **Hooks**: `use*` prefix, em `hooks/`.
- **Plugins built-in**: arquivo único em `plugins/{nome}.ts`, export named (`export const emojiPlugin: MarkmdPlugin`).
- **CSS**: tudo via CSS variables `--mde-*`. Tipografia e cores sobrescritíveis. Sem CSS-in-JS.
- **Testes**: `*.test.ts` (unit), `*.test.tsx` (integration), `*.test-d.ts` (type-level com `expect-type`/`tsd`).
- **i18n**: chaves em `i18n/{locale}.ts`. Fallback sempre `en`. Plugins podem injetar strings via `plugin.i18n`.

---

## 7. API pública — pontos de atenção

Manter estável após v1.0 (SemVer estrito):

- `MarkmdEditorProps` (ver PRD §8.1)
- `EditorAPI` (ver PRD §5.5.3)
- `MarkmdPlugin` (ver PRD §5.5.1)
- `ToolbarButton`, `ToolbarConfig`, `KeyboardShortcut`, `MarkmdTheme`, `I18nMessages`
- `MarkmdEditorRef` (API imperativa via `useRef`)

Mudanças nesses contratos = **major version**. Type-tests (`tests/type/`) protegem contra regressão.

---

## 8. Fora de escopo na v1.0 (não implementar sem aprovação)

| Feature | Razão | Alvo |
|---|---|---|
| Split view | Decisão de produto: toggle escolhido | v1.1 |
| WYSIWYG verdadeiro | Complexidade dobraria escopo | v2.0 |
| Colaboração tempo real (Y.js) | Requer backend | v2.0+ |
| Plugins remotos via URL | Risco segurança | Talvez v1.2 |
| SSR completo do preview | Monaco client-only | v1.1 |
| Export PDF nativo | Libs pesadas | v1.2 |
| AI-assisted writing | Não é prioridade | v1.2+ |

Se usuário pedir algo desta lista, sinalizar fora de escopo da v1 antes de implementar.

---

## 9. Publicação NPM — checklist de identidade

- Nome: `markmd` · License: `MIT` · Versão via Changesets
- `exports` map com subpaths (`.`, `./styles`, `./plugins`, `./plugins/*`, `./package.json`)
- `peerDependencies`: React 18 || 19
- Provenance: `npm publish --provenance` via GitHub Actions OIDC
- `publint` + `attw` zero warnings antes de publicar
- Tarball: só `dist/`, `README.md`, `CHANGELOG.md`, `LICENSE` (whitelist via `files`)

---

## 10. Roadmap por fases (resumo)

| Fase | Entregável | Foco |
|---|---|---|
| 0 | Monorepo + CI verde | Setup, tooling, Changesets, size-limit |
| 1 | v0.1.0 — MVP | Pipeline + Monaco + toggle + temas básicos |
| 2 | v0.2.0 | Toolbar completa + atalhos + modais + i18n |
| 3 | v0.3.0 | Math + Mermaid + Alerts + code highlight |
| 4 | v0.4.0 | Sistema de plugins + EditorAPI + built-ins |
| 5 | v0.5.0 | Upload imagem + storage + export + temas custom |
| 6 | **v1.0.0** | A11y AA + perf + docs + deploy playground + publish NPM |

Detalhes por tarefa em `PRD.md §11`.

---

## 11. Onde olhar primeiro ao receber tarefa

1. **Sempre** abrir `PRD.md` na seção do RF mencionado (busca por `RF-5.x.y`).
1.1. Tarefa toca UI/estilo? **Abrir `DESIGN.md`** — usar tokens (`{colors.*}`, `{typography.*}`, `{spacing.*}`, `{rounded.*}`, `{component.*}`) ao invés de hex/valores inline. Cream canvas + coral + dark navy é a trindade — não introduzir 4ª cor.
2. Verificar se há teste existente em `tests/` cobrindo o comportamento — se sim, rodar antes de mexer.
3. Mudou contrato público (props, EditorAPI, plugin interface)? Atualizar type-tests + adicionar changeset.
4. Mudou bundle? Conferir `size-limit.json` e rodar `pnpm size`.
5. Mudou pipeline ou sanitize? Bateria XSS de `tests/unit/sanitize.test.ts` é obrigatória.

---

## 12. Padrões de mercado adotados como referência

- **tiptap, lexical, mdxeditor, codemirror**: separação lib pública vs app de demo
- **GitHub GFM**: spec de alerts/callouts (`> [!NOTE]` etc.) e schema de sanitização
- **StackEdit/HackMD**: UX do toggle edit↔preview
- **Obsidian**: design do sistema de plugins
- **Monaco**: editor (mesmo motor do VS Code)
