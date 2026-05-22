# PRD — markmd: Editor Markdown React (pacote NPM)

**Versão:** 1.1
**Data:** Maio de 2026
**Status:** Pronto para implementação
**Autor:** [Você]
**Nome do pacote NPM:** `markmd`
**Componente principal:** `<MarkmdEditor />`
**Stack-alvo:** React 18+ · TypeScript · Monaco Editor · unified/remark/rehype
**Distribuição:** Monorepo (pnpm workspaces) — `packages/markmd` publicado no NPM; `apps/playground` app de teste separado (NÃO publicado)

---

## 1. Sumário Executivo

Desenvolver `markmd` — componente React reutilizável e configurável que oferece um editor Markdown completo, comparável aos editores mais usados do mercado (StackEdit, HackMD, Obsidian, Typora). O componente deve permitir alternar entre modo de **edição** (com Monaco Editor) e **preview** (HTML renderizado), suportar a especificação completa do Markdown estendido (GFM + math + mermaid + alerts), expor um sistema de plugins para extensibilidade, e ser distribuído como **pacote NPM** React genérico configurável via props.

**Entrega final:** pacote NPM `markmd` publicável no registry público, com tipos TypeScript completos, dual ESM/CJS, tree-shaking, documentação, exemplos, **playground React separado** para testes práticos, suíte de testes TDD (unit + integration + e2e + a11y + bundle-size + type-tests).

**Estratégia de UI de testes:** A UI de playground/demo **NÃO faz parte** do pacote NPM publicado. Vive em `apps/playground` dentro do monorepo, conforme padrão de mercado (tiptap, lexical, mdxeditor). Razões: bundle limpo, separação de concerns, tree-shaking efetivo, demo pode ser deployado em Vercel/Netlify de forma independente.

---

## 2. Contexto e Motivação

### 2.1 Problema
Os editores de Markdown disponíveis no ecossistema React (`react-md-editor`, `react-mde`, `react-markdown`) apresentam limitações como:
- Bundles pesados sem possibilidade de tree-shaking efetivo
- APIs de plugin rígidas ou inexistentes
- Falta de uma toolbar verdadeiramente customizável
- Pouca flexibilidade no modo de visualização
- Ausência de suporte first-class para math, mermaid e callouts ao mesmo tempo

### 2.2 Oportunidade
Construir um componente que combine o melhor de cada concorrente: a experiência de digitação do Monaco (mesmo motor do VS Code), o pipeline robusto e extensível do `unified` (remark/rehype), e uma API React idiomática com TypeScript estrito.

### 2.3 Visão de produto
> "O melhor editor Markdown drop-in para aplicações React: instale, importe e configure. Funciona em qualquer contexto — blog, CMS, documentação técnica, ferramenta de notas — porque toda decisão de feature é uma prop."

---

## 3. Objetivos e Não-Objetivos

### 3.1 Objetivos (In-scope)
1. Componente React único e configurável: `<MarkmdEditor />`
2. Suporte completo a Markdown estendido (CommonMark + GFM + math + mermaid + alerts + footnotes)
3. Modo Toggle: usuário alterna entre **edição** e **preview** (sem split view)
4. Monaco Editor como engine de edição com syntax highlight de Markdown
5. Toolbar visual completa, totalmente customizável e extensível
6. Sistema de plugins formal com lifecycle hooks
7. Atalhos de teclado abrangentes, customizáveis e documentados
8. API tipada (TypeScript) com props bem definidos
9. Sanitização contra XSS por padrão
10. Temas claro/escuro/automático com suporte a temas customizados
11. Suporte a upload de imagens via callback
12. Exportação para HTML e cópia para clipboard
13. Persistência opcional em localStorage com auto-save configurável
14. i18n via configuração de strings

### 3.2 Não-objetivos (Out-of-scope) na v1.0
1. **Modo WYSIWYG verdadeiro** (edição direta no preview sem ver markdown)
2. **Split view** (edição e preview lado a lado simultaneamente)
3. **Colaboração em tempo real** (CRDTs, Y.js, Liveblocks)
4. **Sincronização com backend** (a aplicação consumidora resolve isso)
5. **Versionamento / histórico longo** (além do undo/redo do próprio Monaco)
6. **Editor mobile-first** (deve funcionar em mobile, mas não é otimizado)
7. **Plugins remotos** (carregados dinamicamente de URL)
8. **Renderização server-side (SSR)** do preview (suporte SSR completo fica para v1.1)

---

## 4. Personas e Casos de Uso

### 4.1 Personas
| Persona | Quem é | O que precisa |
|---|---|---|
| **Dev de produto** | Desenvolve um CMS/blog/SaaS em React | Importar `<MarkmdEditor />` e ter um editor funcional em minutos |
| **Dev de plataforma** | Constrói uma ferramenta interna complexa | Customizar toolbar, registrar plugins e atalhos específicos do domínio |
| **Dev de docs técnicas** | Sistema de documentação interna | Suporte a math, mermaid, code blocks com highlight, footnotes |
| **Usuário final** | Pessoa escrevendo o conteúdo | Editor responsivo, atalhos familiares, preview rápido e fiel |

### 4.2 Casos de uso prioritários
1. **Editor de posts** num CMS — usuário escreve markdown, alterna pro preview, salva
2. **Editor de docs técnicas** com fórmulas matemáticas e diagramas mermaid
3. **Editor de notas** rápido com atalhos extensivos e auto-save no localStorage
4. **Editor embedado em ferramenta interna** com toolbar customizada e plugins de domínio

---

## 5. Requisitos Funcionais

### 5.1 Modos de Visualização (Toggle)

**RF-5.1.1** O componente exibe **um único painel por vez**: ou o editor de código, ou o preview renderizado.

**RF-5.1.2** Um controle de toggle (botão na toolbar ou prop `mode`) alterna entre os modos `edit` e `preview`.

**RF-5.1.3** A transição entre modos preserva integralmente o estado do conteúdo.

**RF-5.1.4** A posição do scroll deve ser preservada de forma sensata ao alternar (scroll-sync best-effort por proporção).

**RF-5.1.5** Props relacionados:
```typescript
mode?: 'edit' | 'preview';         // controlado
defaultMode?: 'edit' | 'preview';  // não-controlado (default: 'edit')
onModeChange?: (mode: 'edit' | 'preview') => void;
allowedModes?: Array<'edit' | 'preview'>; // restringe quais modos são possíveis
```

---

### 5.2 Editor de Código (Monaco)

**RF-5.2.1** Usar `@monaco-editor/react` como wrapper oficial.

**RF-5.2.2** Linguagem do editor fixada em `markdown` para syntax highlight nativo.

**RF-5.2.3** Carregamento lazy do Monaco (split chunk) para não bloquear o load inicial da aplicação consumidora.

**RF-5.2.4** Features do Monaco habilitadas:
- Syntax highlight do Markdown
- Word wrap configurável (default: `on`)
- Minimap (configurável, default: `off`)
- Números de linha (configurável, default: `on`)
- Find & Replace (`Ctrl+F`, `Ctrl+H`)
- Multi-cursor (`Alt+Click`)
- Undo/Redo (`Ctrl+Z`, `Ctrl+Y`)
- Indentação automática
- Bracket matching

**RF-5.2.5** Configurações do Monaco expostas via prop `editorOptions` (pass-through tipado).

**RF-5.2.6** Comandos customizados (Ctrl+B, Ctrl+I, etc.) registrados via `editor.addCommand()` do Monaco.

**RF-5.2.7** Spell-check do navegador respeitado em campos editáveis (configurável via `enableSpellCheck`).

---

### 5.3 Renderização Markdown (Preview)

**RF-5.3.1** Pipeline de renderização baseado em **unified**:

```
markdown string
  → remark-parse (mdast)
  → remark-gfm (tables, task lists, strikethrough, autolinks)
  → remark-math (suporte a $...$ e $$...$$)
  → remark-footnotes (footnotes GFM)
  → remark-rehype (mdast → hast)
  → rehype-katex (renderiza math)
  → rehype-highlight ou rehype-prism (syntax highlight em code blocks)
  → rehype-sanitize (segurança contra XSS)
  → plugins customizados (mermaid, alerts/callouts)
  → rehype-react (hast → React elements)
```

**RF-5.3.2** Markdown features mínimas suportadas:
| Categoria | Features |
|---|---|
| **Headings** | `#`, `##`, ..., `######` com anchor automático (id slugificado) |
| **Ênfase** | `**bold**`, `*italic*`, `~~strikethrough~~` |
| **Listas** | Ordenadas, não-ordenadas, aninhadas, task lists `- [ ]` e `- [x]` |
| **Links** | `[text](url)`, autolinks, ref-style |
| **Imagens** | `![alt](url)` com loading lazy |
| **Code** | `` `inline` ``, blocos com triple backtick + linguagem |
| **Blockquotes** | `> ...` aninháveis |
| **Tabelas** | GFM com alinhamento `:---`, `:---:`, `---:` |
| **HRs** | `---`, `***`, `___` |
| **Footnotes** | `[^1]` + `[^1]: ...` |
| **Math inline** | `$E = mc^2$` |
| **Math block** | `$$\n...\n$$` |
| **Mermaid** | ` ```mermaid\n...\n``` ` renderiza diagrama |
| **Alerts/Callouts** | `> [!NOTE]`, `> [!TIP]`, `> [!WARNING]`, `> [!CAUTION]`, `> [!IMPORTANT]` (estilo GitHub) |
| **HTML inline** | Permitido por padrão, mas sanitizado |

**RF-5.3.3** Code blocks devem ter:
- Syntax highlighting via highlight.js (mais leve) ou Prism
- Header opcional com nome da linguagem
- Botão "copiar" inline (configurável)

**RF-5.3.4** Sanitização contra XSS habilitada por padrão (`rehype-sanitize` com schema do GitHub). Configurável via prop `sanitize`.

**RF-5.3.5** Re-render do preview faz debounce de **150ms** após o último input (configurável).

**RF-5.3.6** Render do preview deve ser **memoizado** — mesmo markdown → mesmo output não re-processa.

---

### 5.4 Toolbar

**RF-5.4.1** Toolbar visível no topo do componente, acima do editor/preview.

**RF-5.4.2** **Botões padrão** (na ordem, agrupados):

| Grupo | Botões |
|---|---|
| Formatação | Bold, Italic, Strikethrough, Inline code |
| Headings | H1, H2, H3 (dropdown para H4-H6) |
| Listas | Bullet list, Numbered list, Task list |
| Blocos | Blockquote, Code block, Horizontal rule |
| Inserção | Link, Image, Table |
| Avançado | Math inline, Math block, Mermaid block, Footnote |
| Visualização | Toggle edit/preview |
| Ações | Copy as HTML, Export, Undo, Redo |

**RF-5.4.3** Cada botão exibe tooltip com nome + atalho de teclado.

**RF-5.4.4** A toolbar é **completamente configurável** via prop:

```typescript
toolbar?: boolean | {
  visible?: boolean;
  position?: 'top' | 'bottom';
  groups?: ToolbarGroup[];      // sobrescreve grupos padrão
  customButtons?: ToolbarButton[]; // adiciona botões custom
  hideButtons?: string[];        // esconde botões por id
  className?: string;
  sticky?: boolean;              // gruda no topo ao scroll
}
```

**RF-5.4.5** Cada botão custom tem a interface:

```typescript
interface ToolbarButton {
  id: string;
  label: string;
  icon: ReactNode;
  tooltip?: string;
  shortcut?: string;             // ex: 'Ctrl+Shift+K'
  onClick: (api: EditorAPI) => void;
  isActive?: (state: EditorState) => boolean;
  position?: { group: string; order: number };
}
```

**RF-5.4.6** Em modo preview, a toolbar mantém apenas botões aplicáveis (toggle, copy, export, undo/redo). Botões de formatação ficam desabilitados.

**RF-5.4.7** Em telas estreitas (<600px), botões secundários colapsam em um menu "..." (overflow).

---

### 5.5 Sistema de Plugins

**RF-5.5.1** Plugin é um objeto que implementa:

```typescript
interface MarkmdPlugin {
  name: string;                  // identificador único, ex: 'plugin-emoji'
  version?: string;
  
  // Pipeline de markdown
  remarkPlugins?: PluggableList;  // injeta plugins no remark
  rehypePlugins?: PluggableList;  // injeta plugins no rehype
  
  // Toolbar
  toolbarButtons?: ToolbarButton[];
  
  // Atalhos
  shortcuts?: KeyboardShortcut[];
  
  // Lifecycle hooks
  onMount?: (api: EditorAPI) => void | (() => void); // cleanup
  onChange?: (value: string, api: EditorAPI) => void;
  onBeforeParse?: (markdown: string) => string;       // transform markdown
  onAfterRender?: (html: string) => string;           // transform HTML
  
  // Renderers customizados de nó HTML
  components?: Record<string, React.ComponentType<any>>;
  
  // i18n strings que o plugin adiciona
  i18n?: Record<string, Record<string, string>>;
}
```

**RF-5.5.2** Plugins são passados via prop `plugins`:

```typescript
<MarkmdEditor plugins={[emojiPlugin, mentionsPlugin, taskTrackerPlugin]} />
```

**RF-5.5.3** Plugins têm acesso ao **EditorAPI** (objeto imperativo):

```typescript
interface EditorAPI {
  // Estado
  getValue(): string;
  setValue(value: string): void;
  getSelection(): { start: number; end: number; text: string };
  getCursorPosition(): number;
  
  // Mutações
  insertText(text: string, position?: number): void;
  replaceSelection(text: string): void;
  wrapSelection(before: string, after: string): void;
  
  // Modo
  getMode(): 'edit' | 'preview';
  setMode(mode: 'edit' | 'preview'): void;
  
  // Editor
  focus(): void;
  blur(): void;
  
  // Utilitários
  showNotification(message: string, type?: 'info' | 'error' | 'success'): void;
}
```

**RF-5.5.4** Plugins built-in distribuídos junto:
- `gfm` (ativo por padrão)
- `math` (ativo por padrão)
- `mermaid` (ativo por padrão)
- `alerts` (ativo por padrão)
- `footnotes` (ativo por padrão)
- `emoji` (opt-in)
- `mentions` (opt-in, requer config)
- `wordCount` (opt-in)
- `tableOfContents` (opt-in)

---

### 5.6 Atalhos de Teclado

**RF-5.6.1** Atalhos padrão (todos customizáveis via prop `shortcuts`):

| Atalho | Ação |
|---|---|
| `Ctrl/Cmd + B` | Bold |
| `Ctrl/Cmd + I` | Italic |
| `Ctrl/Cmd + Shift + X` | Strikethrough |
| `Ctrl/Cmd + K` | Insert link |
| `Ctrl/Cmd + E` | Inline code |
| `Ctrl/Cmd + Shift + C` | Code block |
| `Ctrl/Cmd + Shift + .` | Blockquote |
| `Ctrl/Cmd + Shift + 7` | Numbered list |
| `Ctrl/Cmd + Shift + 8` | Bullet list |
| `Ctrl/Cmd + Shift + 9` | Task list |
| `Ctrl/Cmd + Alt + 1..6` | Heading H1..H6 |
| `Ctrl/Cmd + Alt + T` | Insert table |
| `Ctrl/Cmd + Alt + M` | Math inline |
| `Ctrl/Cmd + Shift + M` | Math block |
| `Ctrl/Cmd + S` | onSave callback (não salva sozinho) |
| `Ctrl/Cmd + P` | Toggle edit ↔ preview |
| `Ctrl/Cmd + /` | Toggle comment (HTML comment) |
| `Tab` (em lista) | Indenta item |
| `Shift+Tab` (em lista) | Desindenta item |

**RF-5.6.2** Sistema de atalhos via interface:

```typescript
interface KeyboardShortcut {
  id: string;
  keys: string;                   // ex: 'Mod+B' (Mod = Cmd no Mac, Ctrl no Win/Linux)
  action: (api: EditorAPI) => void;
  description?: string;
  preventDefault?: boolean;       // default: true
  scope?: 'edit' | 'preview' | 'both'; // default: 'edit'
}
```

**RF-5.6.3** Prop para sobrescrever/desabilitar atalhos padrão:

```typescript
shortcuts?: {
  override?: KeyboardShortcut[];  // adiciona ou substitui
  disable?: string[];             // desabilita atalhos por id
};
```

**RF-5.6.4** Tela de "atalhos disponíveis" exibida com `Ctrl/Cmd + ?` (modal informativo).

---

### 5.7 Imagens e Mídia

**RF-5.7.1** Botão "Insert Image" na toolbar abre modal/dialog com:
- Aba 1: URL externa
- Aba 2: Upload de arquivo (se `onImageUpload` provido)
- Aba 3: Paste de imagem do clipboard

**RF-5.7.2** Drag-and-drop de imagem direto no editor é suportado (se `onImageUpload` provido).

**RF-5.7.3** Paste de imagem do clipboard é suportado (Ctrl+V de uma imagem).

**RF-5.7.4** Prop:

```typescript
onImageUpload?: (file: File) => Promise<{
  url: string;
  alt?: string;
}>;
// se não definido, upload é desabilitado, mas URL externa funciona
```

**RF-5.7.5** Durante upload, inserir placeholder `![Uploading...]()` no markdown, depois substituir pela URL real (otimismo + rollback se falhar).

---

### 5.8 Exportação

**RF-5.8.1** Funcionalidades de export:
- **Copy as HTML**: copia HTML renderizado pro clipboard
- **Copy as Markdown**: copia markdown source pro clipboard
- **Download as .md**: salva o markdown como arquivo
- **Download as .html**: salva o HTML renderizado como arquivo (com `<style>` inline básico)
- **Print** (`window.print()` aplicado ao preview)

**RF-5.8.2** Prop:

```typescript
enableExport?: boolean | {
  formats?: Array<'html' | 'markdown' | 'pdf-print'>;
  htmlTemplate?: (html: string) => string; // wrapper customizado
};
```

**RF-5.8.3** Botão "Export" na toolbar abre dropdown com opções habilitadas.

---

### 5.9 Persistência

**RF-5.9.1** Componente trabalha **controlado** ou **não-controlado**:
- Controlado: passar `value` + `onChange`
- Não-controlado: passar `defaultValue` opcionalmente

**RF-5.9.2** Persistência opcional via prop `storage`:

```typescript
storage?: 'localStorage' | 'sessionStorage' | false; // default: false
storageKey?: string; // default: 'markdown-editor-content'
autoSave?: boolean;  // default: true se storage definido
autoSaveInterval?: number; // ms, default: 1000
```

**RF-5.9.3** Quando `storage` está ativo:
- Ao montar, carrega valor do storage (se existir e `value`/`defaultValue` não foram passados)
- A cada mudança, faz debounce e grava no storage
- Indica "salvo" / "salvando..." sutilmente no canto da toolbar

**RF-5.9.4** Callback `onSave` é independente de storage — chamado quando usuário pressiona `Ctrl+S`.

---

### 5.10 Temas

**RF-5.10.1** Temas embutidos:
- `'light'` (default)
- `'dark'`
- `'auto'` (segue `prefers-color-scheme`)

**RF-5.10.2** Tema customizado via objeto:

```typescript
interface MarkmdTheme {
  editor: {
    background: string;
    foreground: string;
    monacoTheme?: 'vs' | 'vs-dark' | 'hc-black' | string; // tema Monaco
  };
  preview: {
    background: string;
    foreground: string;
    accentColor: string;
    codeBackground: string;
    blockquoteBorder: string;
    // ... outras tokens
  };
  toolbar: {
    background: string;
    foreground: string;
    buttonHover: string;
    border: string;
  };
}
```

**RF-5.10.3** Toda customização visual usa **CSS variables** (`--mde-*`) internamente. Override via CSS é possível.

**RF-5.10.4** Tipografia do preview segue um stack default (system fonts) mas é totalmente sobrescrevível via CSS variables.

---

## 6. Requisitos Não-Funcionais

### 6.1 Performance
| Métrica | Alvo |
|---|---|
| Tempo de carregamento inicial (sem Monaco) | <100ms |
| Tempo de carregamento do Monaco (lazy) | <500ms em rede 4G |
| Debounce de re-render do preview | 150ms (configurável) |
| Re-render em document de 10k linhas | <300ms |
| Bundle size (gzip, sem Monaco) | <80KB |
| Bundle size (gzip, com Monaco lazy) | <500KB |

### 6.2 Acessibilidade
- WCAG 2.1 nível AA
- Toolbar navegável por teclado (Tab/Arrow keys)
- Botões com `aria-label`, `aria-pressed`, `aria-disabled`
- Modais (insert link, insert image) com focus trap
- Anúncios via `aria-live` para mudanças de modo
- Suporte a high-contrast mode
- Foco visível em todos os elementos interativos

### 6.3 Segurança (XSS)
- **Sanitização ativa por padrão** via `rehype-sanitize` com schema do GitHub
- Permitir HTML inline configurável (`allowHtml`), mas **sempre sanitizado**
- Atributos `on*` (onClick, onError, etc.) sempre removidos
- `javascript:` URLs sempre bloqueadas
- `data:` URLs apenas para imagens, configurável

### 6.4 Compatibilidade
- React 18.0+ e React 19+
- TypeScript 5.0+
- Navegadores: últimas 2 versões de Chrome, Firefox, Safari, Edge
- Node.js 18+ (para build/dev)

### 6.5 Bundle Size
- Monaco em chunk separado (lazy)
- KaTeX em chunk separado (lazy, ativado se houver math)
- Mermaid em chunk separado (lazy, ativado se houver diagrama)
- Tree-shaking total para plugins não-usados
- Exports ESM e CJS

### 6.6 Requisitos de Pacote NPM

**RNF-6.6.1 — Identidade no registry:**
- `name`: `markmd`
- `version`: SemVer estrito, gerenciado por **Changesets**
- `license`: `MIT`
- `repository`, `bugs`, `homepage` apontando para o GitHub repo
- `keywords`: `["markdown","editor","react","monaco","remark","rehype","gfm","math","mermaid"]`

**RNF-6.6.2 — `package.json#exports` map (subpath exports):**

```json
{
  "name": "markmd",
  "type": "module",
  "main": "./dist/cjs/index.cjs",
  "module": "./dist/esm/index.js",
  "types": "./dist/types/index.d.ts",
  "exports": {
    ".": {
      "types": "./dist/types/index.d.ts",
      "import": "./dist/esm/index.js",
      "require": "./dist/cjs/index.cjs"
    },
    "./styles": "./dist/styles.css",
    "./styles.css": "./dist/styles.css",
    "./plugins": {
      "types": "./dist/types/plugins/index.d.ts",
      "import": "./dist/esm/plugins/index.js",
      "require": "./dist/cjs/plugins/index.cjs"
    },
    "./plugins/*": {
      "types": "./dist/types/plugins/*.d.ts",
      "import": "./dist/esm/plugins/*.js",
      "require": "./dist/cjs/plugins/*.cjs"
    },
    "./package.json": "./package.json"
  },
  "sideEffects": ["**/*.css"],
  "files": ["dist", "README.md", "CHANGELOG.md", "LICENSE"]
}
```

**RNF-6.6.3 — Dual build ESM + CJS + types:**
- Builder: **tsup** (Rollup interno) ou **unbuild**
- Saída: `dist/esm/`, `dist/cjs/`, `dist/types/`, `dist/styles.css`
- Source maps publicados (`*.map`)
- `.d.ts` único por entrypoint (rollup-plugin-dts)

**RNF-6.6.4 — Peer dependencies (não bundladas):**
```json
{
  "peerDependencies": {
    "react": "^18.0.0 || ^19.0.0",
    "react-dom": "^18.0.0 || ^19.0.0"
  },
  "peerDependenciesMeta": {
    "react": { "optional": false },
    "react-dom": { "optional": false }
  }
}
```
Monaco, KaTeX, Mermaid: avaliar `optionalPeerDependencies` para consumidores que queiram versão própria; default = `dependencies` para zero-config.

**RNF-6.6.5 — Publicação segura:**
- NPM `--access public`
- **Provenance** habilitado (`npm publish --provenance`) via GitHub Actions OIDC
- 2FA obrigatório na conta de publicação
- `prepublishOnly`: roda `build` + `test` + `lint` + `typecheck` + `size-limit`
- `.npmignore` ausente — preferir whitelist via `files`
- Verificação pré-publish: `pnpm publint` (lint do package.json) + `pnpm attw` (Are The Types Wrong?)

**RNF-6.6.6 — Versionamento e changelog:**
- **Changesets** (`@changesets/cli`) para PRs introduzirem entrada de versão
- Release automático via GitHub Action ao mergear changeset
- CHANGELOG.md gerado automaticamente
- Tags Git por release; GitHub Releases com notas

**RNF-6.6.7 — Consumo do pacote (DX-alvo):**
```tsx
import { MarkmdEditor } from 'markmd';
import 'markmd/styles';
import { emojiPlugin } from 'markmd/plugins/emoji';
```
- Import principal sem side effects (exceto CSS via subpath explícito)
- Tipos auto-importados (TS detecta via `types` em exports)
- Compatível com Next.js (App Router + Pages), Remix, Vite, CRA legacy

**RNF-6.6.8 — Bundle observability:**
- `size-limit` enforced em CI — bloqueia PR que estoure limite
- `bundlephobia` badge no README
- `publint` e `arethetypeswrong` zero warnings

---

### 6.7 Estratégia de Testes (TDD + padrões de mercado)

**RNF-6.7.1 — Filosofia TDD:**
- Toda feature de RF começa por teste falhando antes de código de produção
- Pirâmide: **muitos unit → integration moderados → poucos e2e seletivos**
- PR só merge com testes verdes + cobertura mantida

**RNF-6.7.2 — Stack de testes:**

| Camada | Ferramenta | Escopo |
|---|---|---|
| Unit | **Vitest** | Funções puras: pipeline, sanitize, helpers de markdown, shortcutManager, debounce, plugins built-in |
| Component/Integration | **@testing-library/react** + **@testing-library/user-event** + **@testing-library/jest-dom** | Comportamento do `<MarkmdEditor />`, toolbar, modais, atalhos, modo toggle, persistência, controlado vs não-controlado |
| Type-level | **expect-type** ou **tsd** | Garantir tipos públicos não regridem (props, EditorAPI, plugin interface) |
| Snapshot | Vitest inline snapshots | Output HTML do pipeline para fixtures de markdown |
| E2E | **Playwright** (no `apps/playground`) | Fluxos reais: digitar, alternar modo, atalhos cross-OS, upload mockado, export |
| Acessibilidade | **axe-core** + **@axe-core/playwright** + **jest-axe** | Zero violações WCAG AA em unit e e2e |
| Visual regression | **Playwright screenshots** ou **Chromatic** (Storybook) | Toolbar, preview, temas light/dark |
| Bundle size | **size-limit** | Limites por entrypoint (RF-6.1) em CI |
| API contracts | **publint** + **@arethetypeswrong/cli** | Package.json + tipos publicados corretos |
| Mocks de I/O | **MSW** | `onImageUpload`, fetch de menções, etc. |
| Coverage | **Vitest v8 coverage** | ≥ 80% linhas, ≥ 75% branches |

**RNF-6.7.3 — Estrutura de testes por feature (ciclo TDD):**

Para cada RF, produzir nesta ordem:
1. **Teste falhando** descrevendo comportamento esperado (Red)
2. Implementação mínima até passar (Green)
3. Refatoração com testes verdes (Refactor)

Exemplo — RF-5.1.2 (toggle edit/preview):
```ts
// tests/integration/mode-toggle.test.tsx
describe('mode toggle', () => {
  it('starts in edit mode by default', () => { /* ... */ });
  it('switches to preview when toggle clicked', async () => { /* ... */ });
  it('preserves content when switching modes', async () => { /* ... */ });
  it('fires onModeChange callback', async () => { /* ... */ });
  it('respects allowedModes prop', () => { /* ... */ });
});
```

**RNF-6.7.4 — Testes obrigatórios por categoria:**

| Categoria | Cobertura mínima |
|---|---|
| Pipeline markdown | Cada feature de RF-5.3.2 com fixture in/out |
| Sanitização | XSS vectors conhecidos (`<script>`, `onerror`, `javascript:`, `data:` malicioso) — battery do OWASP XSS Filter Cheat Sheet |
| Toolbar | Cada botão default + custom button + hide/override |
| Atalhos | Cada atalho de RF-5.6.1 + override + disable + cross-platform (Cmd vs Ctrl) |
| Plugins | Cada lifecycle hook + ordem de execução + cleanup |
| Persistência | Mount com storage, autoSave debounce, restore, conflito controlado vs storage |
| Imagens | Upload sucesso, falha (rollback), drag-drop, paste |
| Export | HTML, Markdown, download, print |
| Tema | light, dark, auto (mock matchMedia), customizado |
| i18n | Trocar locale em runtime, fallback para `en` |
| Acessibilidade | axe em modo edit, modo preview, cada modal, cada tema |

**RNF-6.7.5 — Cross-environment:**
- Testes rodam em **jsdom** (Vitest) para a grande maioria
- E2E em **Chromium, Firefox, WebKit** (Playwright matrix)
- CI valida em **Node 18 + 20 + 22** e **React 18 + 19**

**RNF-6.7.6 — Performance tests:**
- Benchmark de render do pipeline em document de 10k linhas (Vitest `bench`)
- Regression: falha CI se tempo > 1.2× baseline

---

## 7. Arquitetura Técnica

### 7.1 Stack final

**Core:**
- `react` ^18.0.0
- `typescript` ^5.0.0

**Editor:**
- `@monaco-editor/react` ^4.6.0
- `monaco-editor` ^0.46.0

**Pipeline Markdown:**
- `unified` ^11.0.0
- `remark-parse`
- `remark-gfm`
- `remark-math`
- `remark-rehype`
- `rehype-katex`
- `rehype-highlight` (ou `rehype-prism-plus`)
- `rehype-sanitize`
- `rehype-react`

**Math/Diagrams:**
- `katex` ^0.16.0
- `mermaid` ^10.0.0

**Build:**
- `vite` ^5.0.0 (dev + build da lib)
- `vitest` (testes)
- `@testing-library/react` (testes de componente)
- `playwright` (e2e opcional)
- `storybook` ^7.0.0 (showcase e desenvolvimento)
- `tsup` ou `rollup` (build da biblioteca)

### 7.2 Estrutura de pastas (Monorepo pnpm workspaces)

```
markmd/                                  # raiz do monorepo
├── package.json                         # raiz: scripts orchestration, devDeps compartilhados
├── pnpm-workspace.yaml                  # workspaces: packages/*, apps/*
├── turbo.json                           # Turborepo: pipeline build/test/lint
├── .changeset/                          # Changesets — versionamento + changelog
├── .github/workflows/                   # CI/CD (test, lint, build, publish, size)
│   ├── ci.yml
│   ├── release.yml                      # publish via changesets + provenance
│   └── size.yml                         # size-limit em PR
├── tsconfig.base.json                   # config TS compartilhada
├── .eslintrc.cjs
├── .prettierrc
├── LICENSE
├── README.md
│
├── packages/
│   └── markmd/                          # ◀── PACOTE NPM PUBLICADO
│       ├── package.json                 # name: "markmd", exports map, peerDeps
│       ├── tsconfig.json
│       ├── tsup.config.ts               # build dual ESM/CJS + d.ts + CSS
│       ├── vitest.config.ts
│       ├── size-limit.json              # limites de bundle
│       ├── README.md                    # vai no tarball NPM
│       ├── CHANGELOG.md                 # gerado por changesets
│       ├── src/
│       │   ├── index.ts                 # entry público (re-exports)
│       │   ├── MarkmdEditor.tsx
│       │   ├── components/              # Editor, Preview, Toolbar, Dialogs, ModeToggle
│       │   ├── core/                    # pipeline, sanitize, EditorAPI, pluginManager, shortcutManager
│       │   ├── plugins/                 # builtin + types
│       │   ├── themes/
│       │   ├── hooks/
│       │   ├── utils/
│       │   ├── i18n/
│       │   ├── styles/                  # CSS bundlado (importável: 'markmd/styles')
│       │   └── types.ts                 # tipos públicos
│       ├── tests/
│       │   ├── unit/                    # *.test.ts — Vitest
│       │   ├── integration/             # *.test.tsx — RTL + user-event
│       │   ├── type/                    # *.test-d.ts — expect-type/tsd
│       │   └── fixtures/                # markdown samples
│       └── dist/                        # gerado: esm/, cjs/, types/, styles.css
│
├── apps/
│   ├── playground/                      # ◀── UI REACT DE TESTE (NÃO publicada)
│   │   ├── package.json                 # private: true
│   │   ├── vite.config.ts
│   │   ├── index.html
│   │   ├── src/
│   │   │   ├── main.tsx
│   │   │   ├── App.tsx                  # showcase interativo do <MarkmdEditor />
│   │   │   ├── scenarios/               # cenários: básico, custom toolbar, plugins, math, mermaid, upload
│   │   │   ├── components/              # controles laterais (props, toggles, theme switch)
│   │   │   └── styles/
│   │   ├── e2e/                         # Playwright contra o playground
│   │   │   ├── playwright.config.ts
│   │   │   ├── editor.spec.ts
│   │   │   ├── toolbar.spec.ts
│   │   │   ├── shortcuts.spec.ts
│   │   │   └── a11y.spec.ts             # axe-core
│   │   └── public/
│   │
│   └── docs/                            # opcional (fase polish): Storybook + Docusaurus
│       ├── .storybook/
│       └── stories/                     # 20+ stories cobrindo todas features
│
└── examples/                            # snippets curtos de uso (lidos pelo README)
    ├── basic/
    ├── custom-toolbar/
    ├── with-plugins/
    └── full-features/
```

**Decisão arquitetural — UI no pacote NPM:** ❌ NÃO incluída.
- `packages/markmd` exporta apenas `<MarkmdEditor />`, hooks, tipos, plugins, CSS.
- `apps/playground` é app Vite + React consumindo `markmd` via workspace symlink (`"markmd": "workspace:*"`).
- Razões (alinhadas com padrão de mercado — tiptap, lexical, mdxeditor, codemirror):
  1. **Bundle limpo:** zero código de demo no pacote final
  2. **Separação de concerns:** lib não acopla escolhas de UI de demo (rotas, controles, theme switcher)
  3. **Tree-shaking efetivo:** consumidor não baga arrasto de showcase
  4. **Deploy independente:** playground vai pra Vercel/Netlify sem afetar publicação
  5. **DX:** workspace symlink permite HMR ao editar a lib direto do playground

### 7.3 Diagrama de fluxo

```
┌─────────────────────────────────────────────────────────────┐
│                      <MarkmdEditor />                     │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │                  Toolbar                            │   │
│  │   [B] [I] [H1] [List] ... [Toggle: Edit|Preview]    │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │                                                     │   │
│  │   Modo = 'edit'           Modo = 'preview'          │   │
│  │   ┌──────────────┐        ┌──────────────┐          │   │
│  │   │   Monaco     │   OR   │   Preview    │          │   │
│  │   │   Editor     │        │   (HTML)     │          │   │
│  │   └──────────────┘        └──────────────┘          │   │
│  │                                                     │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  Status bar (opcional): word count · "saved 2s ago"         │
└─────────────────────────────────────────────────────────────┘

           ↓                              ↓
    [onChange(value)]              [Pipeline unified]
           ↓                              ↓
    [Storage opcional]             [HTML sanitizado]
                                          ↓
                                   [rehype-react]
                                          ↓
                                   [React elements]
```

### 7.4 Pipeline de renderização (detalhado)

```typescript
import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import remarkRehype from 'remark-rehype';
import rehypeKatex from 'rehype-katex';
import rehypeHighlight from 'rehype-highlight';
import rehypeSanitize, { defaultSchema } from 'rehype-sanitize';
import rehypeReact from 'rehype-react';

const pipeline = unified()
  .use(remarkParse)
  .use(remarkGfm)
  .use(remarkMath)
  .use(...userRemarkPlugins) // de plugins
  .use(remarkRehype, { allowDangerousHtml: true })
  .use(rehypeKatex)
  .use(rehypeHighlight, { ignoreMissing: true })
  .use(rehypeSanitize, sanitizeSchema) // customizado
  .use(...userRehypePlugins)
  .use(rehypeReact, {
    createElement: React.createElement,
    components: {
      code: CodeBlock,         // override pra code blocks com copy
      pre: PreBlock,
      img: SafeImage,
      a: SafeLink,
      // ...plugin components
    },
  });

const result = await pipeline.process(markdown);
return result.result; // React.ReactElement
```

### 7.5 Playground App (`apps/playground`)

**Propósito:** Aplicação React standalone para testar o `<MarkmdEditor />` em cenários reais. **NÃO publicada no NPM.** Usada por devs do pacote + base para e2e Playwright + deploy público para demo.

**Stack:**
- Vite + React + TypeScript
- TailwindCSS (escolha de demo — não vaza pro pacote)
- React Router (cenários como rotas)
- Consome `markmd` via `"markmd": "workspace:*"` (symlink pnpm)

**Cenários cobertos (rotas):**
| Rota | Cenário |
|---|---|
| `/` | Editor básico — value/onChange controlado |
| `/uncontrolled` | Não-controlado com defaultValue |
| `/custom-toolbar` | Toolbar com botões custom + grupos reorganizados |
| `/with-plugins` | Emoji + mentions + wordCount + tableOfContents ativos |
| `/math` | KaTeX inline e block em destaque |
| `/mermaid` | Diagramas Mermaid |
| `/alerts` | Callouts GitHub-style |
| `/image-upload` | Upload mockado (MSW) com sucesso e falha |
| `/storage` | Persistência localStorage + autoSave |
| `/themes` | Switcher light/dark/auto/custom |
| `/i18n` | Switcher en / pt-BR + locale custom |
| `/export` | Export para HTML, Markdown, print |
| `/large-document` | Performance: doc de 10k linhas |
| `/readonly` | Modo somente leitura |
| `/ssr-safe` | Demonstra fallback SSR (Next.js-like) |

**Painel lateral (DevTools):**
- Toggle de props em tempo real (mode, theme, readOnly, etc.)
- Inspetor de EditorAPI (botões para chamar `getValue`, `setMode`, `insertText`, etc.)
- Visualizador de eventos disparados (`onChange`, `onModeChange`, `onSave`)
- Diff de markdown vs HTML renderizado

**Deploy:** Vercel/Netlify via workflow `deploy-playground.yml`. URL pública vira "live demo" no README do pacote.

---

## 8. API do Componente

### 8.1 Props (interface completa)

```typescript
interface MarkmdEditorProps {
  // ───── Conteúdo ─────
  /** Valor controlado do markdown */
  value?: string;
  /** Valor inicial (não-controlado) */
  defaultValue?: string;
  /** Callback de mudança */
  onChange?: (value: string) => void;
  /** Callback ao pressionar Ctrl+S */
  onSave?: (value: string) => void | Promise<void>;
  /** Placeholder quando vazio */
  placeholder?: string;
  /** Modo somente leitura */
  readOnly?: boolean;

  // ───── Modos ─────
  /** Modo controlado */
  mode?: 'edit' | 'preview';
  /** Modo inicial (não-controlado) */
  defaultMode?: 'edit' | 'preview';
  /** Callback de mudança de modo */
  onModeChange?: (mode: 'edit' | 'preview') => void;
  /** Restringe modos disponíveis */
  allowedModes?: Array<'edit' | 'preview'>;

  // ───── Toolbar ─────
  toolbar?: boolean | ToolbarConfig;

  // ───── Editor (Monaco) ─────
  editorOptions?: Partial<monaco.editor.IEditorOptions>;
  enableSpellCheck?: boolean;
  enableLineNumbers?: boolean;
  enableMinimap?: boolean;
  enableWordWrap?: boolean;

  // ───── Plugins ─────
  plugins?: MarkmdPlugin[];

  // ───── Atalhos ─────
  shortcuts?: {
    override?: KeyboardShortcut[];
    disable?: string[];
  };

  // ───── Persistência ─────
  storage?: 'localStorage' | 'sessionStorage' | false;
  storageKey?: string;
  autoSave?: boolean;
  autoSaveInterval?: number;

  // ───── Tema ─────
  theme?: 'light' | 'dark' | 'auto' | MarkmdTheme;

  // ───── Layout ─────
  height?: string | number;
  width?: string | number;
  minHeight?: string | number;
  maxHeight?: string | number;
  className?: string;
  style?: React.CSSProperties;

  // ───── i18n ─────
  locale?: 'en' | 'pt-BR' | string;
  i18n?: Partial<I18nMessages>;

  // ───── Mídia ─────
  onImageUpload?: (file: File) => Promise<{ url: string; alt?: string }>;
  acceptedImageTypes?: string[]; // default: ['image/png', 'image/jpeg', 'image/gif', 'image/webp']
  maxImageSize?: number; // bytes

  // ───── Export ─────
  enableExport?: boolean | ExportConfig;

  // ───── Performance ─────
  previewDebounceMs?: number; // default: 150

  // ───── Markdown ─────
  /** Plugins remark adicionais */
  remarkPlugins?: PluggableList;
  /** Plugins rehype adicionais */
  rehypePlugins?: PluggableList;
  /** Schema de sanitização customizado */
  sanitize?: boolean | Schema;
  /** Renderers de componente customizados */
  components?: Record<string, React.ComponentType<any>>;

  // ───── Eventos ─────
  onMount?: (api: EditorAPI) => void;
  onError?: (error: Error) => void;
  onFocus?: () => void;
  onBlur?: () => void;
  onSelectionChange?: (selection: Selection) => void;
}
```

### 8.2 API imperativa (via ref)

```typescript
const ref = useRef<MarkmdEditorRef>(null);

<MarkmdEditor ref={ref} />

// Métodos disponíveis no ref:
ref.current?.getValue();
ref.current?.setValue('# Novo conteúdo');
ref.current?.focus();
ref.current?.getMode();
ref.current?.setMode('preview');
ref.current?.insertText('texto', { atCursor: true });
ref.current?.getSelection();
ref.current?.exportAsHtml();
ref.current?.exportAsMarkdown();
```

### 8.3 Eventos disparados (resumo)

| Evento | Quando dispara |
|---|---|
| `onChange` | A cada mudança do conteúdo (debounced pelo Monaco) |
| `onSave` | `Ctrl+S` pressionado |
| `onModeChange` | Usuário alterna edit ↔ preview |
| `onMount` | Componente montou; recebe EditorAPI |
| `onFocus` / `onBlur` | Editor ganha/perde foco |
| `onSelectionChange` | Seleção muda no editor |
| `onError` | Erro de parsing ou plugin |

---

## 9. Sistema de Plugins (detalhes)

### 9.1 Exemplo: plugin de emojis

```typescript
import { MarkmdPlugin } from 'markmd';

export const emojiPlugin: MarkmdPlugin = {
  name: 'emoji',
  version: '1.0.0',

  onBeforeParse: (markdown) => {
    // :smile: → 😄
    return markdown.replace(/:(\w+):/g, (match, name) => {
      return EMOJI_MAP[name] ?? match;
    });
  },

  toolbarButtons: [{
    id: 'emoji-picker',
    label: 'Insert emoji',
    icon: <EmojiIcon />,
    shortcut: 'Mod+Shift+E',
    onClick: (api) => {
      // abre picker de emojis
      const emoji = await pickEmoji();
      api.insertText(emoji);
    },
  }],

  shortcuts: [{
    id: 'emoji-picker',
    keys: 'Mod+Shift+E',
    action: (api) => {
      // mesma ação
    },
  }],
};
```

### 9.2 Exemplo: plugin de menções

```typescript
export const mentionsPlugin = (options: {
  fetchUsers: (query: string) => Promise<User[]>;
}): MarkmdPlugin => ({
  name: 'mentions',
  
  remarkPlugins: [[remarkMention, options]],
  
  components: {
    mention: ({ username }) => (
      <a href={`/users/${username}`} className="mention">
        @{username}
      </a>
    ),
  },
});
```

### 9.3 Lifecycle do plugin

```
1. Componente monta
   → pluginManager.register(plugins)
   → para cada plugin: onMount(api) chamado
   → remarkPlugins/rehypePlugins adicionados ao pipeline
   → toolbarButtons registrados na toolbar
   → shortcuts registrados no shortcutManager

2. Usuário digita
   → onBeforeParse(markdown) chamado (em ordem dos plugins)
   → pipeline executa
   → onAfterRender(html) chamado

3. Componente desmonta
   → para cada plugin: cleanup do onMount executado
```

---

## 10. Atalhos de Teclado (referência completa)

Ver tabela completa em **RF-5.6.1**.

Modal exibido com `Ctrl/Cmd+?` lista todos os atalhos ativos, agrupados por categoria, traduzidos conforme `locale`.

---

## 11. Roadmap de Implementação (Fases)

> **Nota:** cada fase é independente e entregável. Ao final de cada fase, há uma versão usável da biblioteca com mais recursos.

### Fase 0 — Setup do Monorepo + Infra de Testes (Semana 0)
**Objetivo:** Fundação NPM-ready antes de uma linha de feature.
- [ ] `pnpm-workspace.yaml` + `packages/markmd` + `apps/playground`
- [ ] Turborepo (`turbo.json`) com pipeline build/test/lint/typecheck
- [ ] `packages/markmd/package.json` com `exports` map completo, `peerDeps`, `files`, `sideEffects`
- [ ] tsup configurado para dual ESM/CJS + d.ts + CSS bundling
- [ ] Vitest configurado (jsdom env, coverage v8, setup file com `@testing-library/jest-dom`)
- [ ] Playwright configurado em `apps/playground/e2e`
- [ ] Changesets inicializado (`.changeset/config.json`)
- [ ] size-limit, publint, attw, axe-core, jest-axe, MSW instalados
- [ ] ESLint + Prettier + TS strict compartilhados via `tsconfig.base.json`
- [ ] GitHub Actions: `ci.yml` (test+lint+typecheck+size), `release.yml` (changesets+publish+provenance)
- [ ] Playground Vite app esqueleto consumindo `markmd` via workspace
- [ ] Smoke test: pacote builda + importa no playground + roda

**Entregável:** Monorepo verde no CI, pronto para TDD.

### Fase 1 — MVP / Foundation (Semana 1-2)
**Objetivo:** Editor funcional básico com toggle e renderização. **TDD desde o primeiro commit.**
- [ ] Testes unit do pipeline markdown (fixtures de RF-5.3.2)
- [ ] Pipeline básico: remark + remark-gfm + rehype + rehype-sanitize + rehype-react
- [ ] Componente `<MarkmdEditor>` esqueleto (teste de mount primeiro)
- [ ] Integração com Monaco Editor (lazy load)
- [ ] Testes integration: toggle edit/preview (RTL + user-event)
- [ ] Toggle edit/preview funcional
- [ ] Props básicos: `value`, `onChange`, `mode`, `onModeChange`, `height`
- [ ] Type-tests dos props públicos (expect-type)
- [ ] Tema light e dark
- [ ] Playground: rotas `/`, `/uncontrolled`, `/themes`
- [ ] Storybook básico com 3 stories

**Entregável:** v0.1.0 — componente importável funcional, publicável (dry-run NPM).

### Fase 2 — Toolbar e Atalhos (Semana 3)
- [ ] Componente `<Toolbar>` configurável
- [ ] Todos os botões padrão (RF-5.4.2) funcionais
- [ ] Modais: Insert Link, Insert Image (URL), Insert Table
- [ ] Sistema de atalhos (`shortcutManager`)
- [ ] Todos os atalhos padrão (RF-5.6.1) ativos
- [ ] Modal de "atalhos disponíveis" (`Ctrl+?`)
- [ ] Tooltips com atalho
- [ ] Overflow menu para telas estreitas
- [ ] i18n base (en, pt-BR)

**Entregável:** v0.2.0 — editor com toolbar completa funcional.

### Fase 3 — Markdown Estendido (Semana 4)
- [ ] Math inline e block (remark-math + rehype-katex)
- [ ] Mermaid (custom rehype plugin que detecta `mermaid` code block)
- [ ] Alerts/Callouts GitHub-style (`> [!NOTE]` etc.)
- [ ] Footnotes (já vem com GFM mas precisa estilizar)
- [ ] Code blocks com syntax highlight (rehype-highlight)
- [ ] Code blocks com botão "copy"
- [ ] Anchors automáticos em headings (rehype-slug)
- [ ] Task lists interativos (checkbox clicável no preview, opcional)

**Entregável:** v0.3.0 — todo o espectro de markdown suportado.

### Fase 4 — Sistema de Plugins (Semana 5)
- [ ] Interface formal `MarkmdPlugin`
- [ ] `pluginManager.ts` com lifecycle
- [ ] `EditorAPI` completa
- [ ] Hooks: onBeforeParse, onAfterRender, onChange, onMount
- [ ] Plugin built-in: emoji
- [ ] Plugin built-in: mentions (template)
- [ ] Plugin built-in: wordCount
- [ ] Plugin built-in: tableOfContents
- [ ] Documentação do sistema de plugins
- [ ] Exemplo de plugin custom em `examples/`

**Entregável:** v0.4.0 — biblioteca extensível.

### Fase 5 — Recursos Avançados (Semana 6)
- [ ] Upload de imagens via `onImageUpload`
- [ ] Drag-and-drop de imagens
- [ ] Paste de imagens do clipboard
- [ ] Persistência em localStorage (`storage`, `autoSave`)
- [ ] Indicador "salvando..." / "salvo"
- [ ] Export para HTML (`Copy as HTML`, `Download .html`)
- [ ] Export para Markdown (`Copy as Markdown`, `Download .md`)
- [ ] Print (via `window.print()`)
- [ ] Sticky toolbar opcional
- [ ] Temas customizados via objeto

**Entregável:** v0.5.0 — pronto para uso em produção.

### Fase 6 — Polish e Lançamento NPM (Semana 7)
- [ ] Acessibilidade completa (audit com Axe — zero violações AA)
- [ ] Performance audit (bundle size, render time, bench de 10k linhas)
- [ ] Documentação completa (README + site Docusaurus opcional)
- [ ] Storybook com 20+ exemplos cobrindo todas as features
- [ ] Suíte e2e Playwright completa contra `apps/playground`
- [ ] `publint` + `attw` zero warnings
- [ ] `size-limit` dentro dos alvos (RF-6.1)
- [ ] Deploy do `apps/playground` na Vercel (URL pública)
- [ ] CI/CD verde: test + lint + typecheck + size + e2e
- [ ] Workflow de release: changesets + `npm publish --provenance` via OIDC
- [ ] README com badges (npm, bundlephobia, CI, coverage), instalação, quickstart, recipes, link do playground
- [ ] LICENSE (MIT), CHANGELOG.md inicial
- [ ] Publicação `markmd@1.0.0` no NPM registry

**Entregável:** v1.0.0 — `npm install markmd` funcional, demo público no ar.

---

## 12. Critérios de Aceitação (Definition of Done)

Para considerar a v1.0 completa:

1. ✅ Todos os requisitos funcionais (RF-5.x) implementados
2. ✅ Todos os requisitos não-funcionais (Seção 6) atendidos, incluindo 6.6 (NPM) e 6.7 (Testes)
3. ✅ Cobertura de testes ≥ 80% linhas / ≥ 75% branches (Vitest v8 coverage)
4. ✅ Zero erros de tipos (`tsc --noEmit` limpo) em todos os workspaces
5. ✅ Zero warnings de lint (`eslint . --max-warnings 0`)
6. ✅ `publint` e `@arethetypeswrong/cli` zero warnings
7. ✅ `size-limit` passa todos os limites configurados
8. ✅ Documentação completa (README do pacote + README raiz + Storybook)
9. ✅ Playground (`apps/playground`) cobre todos os cenários listados em 7.5 e está deployado publicamente
10. ✅ 4+ snippets funcionais em `examples/`
11. ✅ Axe-core: zero violações nível AA (unit + e2e)
12. ✅ Suíte Playwright e2e cobre fluxos críticos (digitar, toggle, atalhos, upload, export)
13. ✅ Bundle size dentro dos limites (RF-6.1, RF-6.5)
14. ✅ Type-tests garantem estabilidade da API pública
15. ✅ CI/CD verde em PR e main; matrix Node 18/20/22 × React 18/19
16. ✅ Publicação `markmd` no NPM com ESM + CJS + types + CSS + provenance
17. ✅ Changesets configurado e funcionando para releases futuras
18. ✅ LICENSE (MIT), CHANGELOG.md, README.md no tarball publicado

---

## 13. Fora de Escopo (v1.0 — anotado para futuro)

| Feature | Razão de adiar | Possível versão |
|---|---|---|
| Split view (edit + preview lado a lado) | Decisão de produto: toggle escolhido | v1.1 |
| WYSIWYG verdadeiro | Complexidade alta, escopo dobraria | v2.0 |
| Colaboração em tempo real (Y.js) | Requer backend, escopo enorme | v2.0+ |
| Versionamento de documentos | Fora do componente | Nunca |
| Plugins remotos via URL | Risco de segurança | Talvez v1.2 |
| Otimização mobile-first | Funciona, mas não otimizado | v1.1 |
| SSR completo do preview | Monaco é client-only | v1.1 (preview SSR) |
| AI-assisted writing | Não é prioridade do produto | v1.2+ |
| Export PDF nativo (sem print) | Lib pesada (pdfmake/jsPDF) | v1.2 |

---

## 14. Riscos Técnicos e Mitigações

| Risco | Impacto | Mitigação |
|---|---|---|
| Monaco é pesado e SSR-incompatível | Alto | Lazy load + fallback de textarea em SSR |
| KaTeX/Mermaid quebram em conteúdo malformado | Médio | Catch erros e exibir mensagem inline, não quebrar todo o preview |
| Pipeline `unified` é assíncrono | Médio | Usar `useEffect` + estado, com loading sutil |
| Conflitos de atalho com o sistema operacional | Médio | Usar atalhos conservadores; permitir override |
| Sanitização muito agressiva quebra conteúdo legítimo | Médio | Schema baseado no GitHub, customizável |
| Bundle size escala com plugins | Médio | Tree-shaking estrito + plugins lazy |
| Diferenças Monaco entre Mac/Windows/Linux | Baixo | Testar nos 3 SOs |
| Memory leaks com unmount frequente | Médio | Garantir cleanup em todos os hooks e plugins |

---

## 15. Dependências (lista final)

### Dependências `peer`
```json
{
  "react": "^18.0.0 || ^19.0.0",
  "react-dom": "^18.0.0 || ^19.0.0"
}
```

### Dependências de runtime
```json
{
  "@monaco-editor/react": "^4.6.0",
  "monaco-editor": "^0.46.0",
  "unified": "^11.0.0",
  "remark-parse": "^11.0.0",
  "remark-gfm": "^4.0.0",
  "remark-math": "^6.0.0",
  "remark-rehype": "^11.0.0",
  "rehype-katex": "^7.0.0",
  "rehype-highlight": "^7.0.0",
  "rehype-sanitize": "^6.0.0",
  "rehype-react": "^8.0.0",
  "rehype-slug": "^6.0.0",
  "katex": "^0.16.0",
  "mermaid": "^10.0.0",
  "highlight.js": "^11.0.0"
}
```

### Dependências de desenvolvimento
```json
{
  "vite": "^5.0.0",
  "vitest": "^1.0.0",
  "@vitest/coverage-v8": "^1.0.0",
  "@testing-library/react": "^14.0.0",
  "@testing-library/user-event": "^14.0.0",
  "@testing-library/jest-dom": "^6.0.0",
  "jsdom": "^24.0.0",
  "expect-type": "^0.17.0",
  "msw": "^2.0.0",
  "@axe-core/playwright": "^4.8.0",
  "jest-axe": "^9.0.0",
  "@types/react": "^18.0.0",
  "typescript": "^5.0.0",
  "eslint": "^8.0.0",
  "@typescript-eslint/parser": "^6.0.0",
  "prettier": "^3.0.0",
  "storybook": "^7.0.0",
  "playwright": "^1.40.0",
  "@playwright/test": "^1.40.0",
  "tsup": "^8.0.0",
  "size-limit": "^11.0.0",
  "@size-limit/preset-small-lib": "^11.0.0",
  "publint": "^0.2.0",
  "@arethetypeswrong/cli": "^0.15.0",
  "@changesets/cli": "^2.27.0",
  "turbo": "^1.13.0"
}
```

### Workspace tooling (raiz)
```json
{
  "pnpm": "^9.0.0",
  "node": ">=18.0.0"
}
```

---

## 16. Apêndice

### 16.1 Glossário

| Termo | Definição |
|---|---|
| **AST** | Abstract Syntax Tree — árvore de nós representando estrutura do markdown |
| **mdast** | Markdown AST, formato do remark |
| **hast** | HTML AST, formato do rehype |
| **unified** | Engine que coordena transformações entre ASTs |
| **GFM** | GitHub Flavored Markdown |
| **WYSIWYG** | What You See Is What You Get — edição visual direta |
| **Lazy load** | Carregar recurso só quando necessário |
| **Tree-shaking** | Remoção de código não-usado no bundle final |
| **CRDT** | Conflict-free Replicated Data Type — base para colaboração em tempo real |
| **Sanitização** | Limpeza de HTML potencialmente malicioso |
| **EditorAPI** | Objeto imperativo exposto a plugins para controlar o editor |

### 16.2 Referências
- CommonMark Spec: https://spec.commonmark.org/
- GFM Spec: https://github.github.com/gfm/
- unified ecosystem: https://unifiedjs.com/
- Monaco Editor: https://microsoft.github.io/monaco-editor/
- KaTeX: https://katex.org/
- Mermaid: https://mermaid.js.org/
- WCAG 2.1: https://www.w3.org/TR/WCAG21/

### 16.3 Editores de referência (benchmark visual)
- **StackEdit** (modo toggle): inspiração para alternância edit/preview
- **HackMD**: inspiração para toolbar e features estendidas
- **Obsidian**: inspiração para sistema de plugins e atalhos
- **Typora**: inspiração para minimalismo visual quando toolbar oculta
- **GitHub editor (Markdown)**: inspiração para alerts/callouts e GFM

---

## 17. Próximos Passos (após aprovação do PRD)

1. **Quebra em tasks granulares** — usar este PRD para gerar issues/tasks no Linear/Jira/GitHub Projects
2. **Setup do repositório** — criar repo, configurar CI/CD, instalar dependências base
3. **Início da Fase 1** — implementar MVP seguindo o roadmap
4. **Revisões intermediárias** — ao final de cada fase, validar contra os critérios de aceitação

---

## 18. Fluxo de Publicação NPM

### 18.1 Scripts obrigatórios em `packages/markmd/package.json`

```json
{
  "scripts": {
    "build": "tsup",
    "dev": "tsup --watch",
    "test": "vitest run",
    "test:watch": "vitest",
    "test:coverage": "vitest run --coverage",
    "test:types": "vitest run --typecheck",
    "typecheck": "tsc --noEmit",
    "lint": "eslint . --max-warnings 0",
    "size": "size-limit",
    "publint": "publint",
    "attw": "attw --pack .",
    "prepublishOnly": "pnpm run build && pnpm run test && pnpm run typecheck && pnpm run lint && pnpm run publint && pnpm run attw && pnpm run size"
  }
}
```

### 18.2 Workflow de release (GitHub Actions)

```yaml
# .github/workflows/release.yml
name: Release
on:
  push:
    branches: [main]
permissions:
  contents: write
  pull-requests: write
  id-token: write   # OIDC para provenance
jobs:
  release:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v3
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          registry-url: https://registry.npmjs.org
      - run: pnpm install --frozen-lockfile
      - run: pnpm -r build
      - uses: changesets/action@v1
        with:
          publish: pnpm changeset publish
        env:
          NODE_AUTH_TOKEN: ${{ secrets.NPM_TOKEN }}
          NPM_CONFIG_PROVENANCE: true
```

### 18.3 Checklist pré-1ª publicação

- [ ] Reservar nome `markmd` no NPM (verificar disponibilidade: `npm view markmd`)
- [ ] Conta NPM com 2FA habilitado
- [ ] `NPM_TOKEN` configurado em GitHub Secrets (granular token, somente publish do pacote)
- [ ] GitHub repo público com Trusted Publisher (OIDC) configurado no NPM
- [ ] LICENSE no root + dentro do pacote
- [ ] README.md do pacote com seção "Installation", "Quick Start", "Props", "Plugins", "License", "Live Demo"
- [ ] Bandeira final: `npm pack --dry-run` revisado (tarball contém só `dist/`, `README.md`, `LICENSE`, `CHANGELOG.md`, `package.json`)
- [ ] Primeira publicação: `npm publish --provenance --access public --tag latest`

### 18.4 Política pós-publicação

- Breaking changes apenas em majors (SemVer)
- Suporte ativo às 2 majors mais recentes do React
- Issues triadas em até 7 dias
- Deprecation warnings 1 minor antes de remoção

---

**FIM DO PRD**
