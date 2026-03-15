# Code Editor com Syntax Highlighting

## Resumo

Expandir o editor de código existente (`CodeEditor`) para suportar syntax highlighting dinâmico com detecção automática de linguagem e seleção manual pelo usuário.

---

## Pesquisa Realizada

### Como o ray-so faz

O [ray-so](https://github.com/raycast/ray-so) da Raycast **não** usa CodeMirror nem Monaco. A arquitetura deles é:

| Camada | Tecnologia |
|---|---|
| Editor | `<textarea>` invisível (sem library de editor) |
| Syntax highlight | **Shiki** (TextMate grammars, tema `css-variables`) |
| Detecção de linguagem | **highlight.js** `highlightAuto()` (~305KB) |
| Estado | **Jotai** com persistência na URL hash |

O textarea fica transparente por cima do HTML renderizado pelo Shiki. O usuário digita no textarea, mas vê o output colorido do Shiki. Eles implementam manualmente tab indent, auto-indent e bracket close.

Para detecção, usam `hljs.highlightAuto(code, Object.keys(LANGUAGES))` — rodando o parser de todas as linguagens registradas e pegando a de maior relevância. É pesado (~305KB) mas cobre 190+ linguagens.

Para seleção manual, usam um Combobox com busca. Dois estados: linguagem detectada automaticamente e linguagem selecionada pelo usuário. Se o usuário selecionar, a manual prevalece.

### Alternativas avaliadas

#### 1. CodeMirror 6 com highlighting nativo (Lezer)

- **Bundle**: ~119KB gzip (core + basicSetup)
- **Linguagens**: ~40 (oficial + comunidade), cada uma em pacote separado (~15-155KB)
- **Qualidade**: Boa, não VS Code-level, mas suficiente para colar código
- **Performance**: Excelente — parsers incrementais, só re-parseia o que mudou
- **Prós**: Já está no projeto, tree-shakeable, boa UX de edição, acessível
- **Contras**: ~40 linguagens vs 200+ do TextMate

#### 2. Textarea + Shiki overlay (abordagem ray-so)

- **Bundle**: ~34KB (Shiki core) + grammars lazy-loaded
- **Linguagens**: 200+ (TextMate grammars)
- **Qualidade**: VS Code-identical
- **Prós**: Leve, highlight perfeito, lazy loading de grammars
- **Contras**: Precisa reimplementar features de editor (tab, undo, seleção). Sincronização scroll/cursor entre textarea e overlay é frágil

#### 3. CodeMirror 6 + @shikijs/codemirror (híbrido)

- **Status**: **Descontinuado** — o pacote `@shikijs/codemirror` não aparece mais na documentação do Shiki v4 e retorna 404 no npm
- **Veredito**: Não viável

#### 4. Monaco Editor

- **Bundle**: **~3.95MB** raw JS (~992KB gzip)
- **Prós**: Experiência completa de VS Code
- **Contras**: Completamente desproporcional para um app de colar código. Requer web workers, configuração especial de webpack/turbopack, incompatível com SSR
- **Veredito**: Overkill

### Detecção automática de linguagem

#### flourite (recomendado)

- **Bundle**: ~6KB gzip, 0 dependências
- **Linguagens**: 23 (todas as mainstream: JS/TS, Python, Java, C/C++, Go, Rust, Ruby, PHP, etc.)
- **Método**: Heurísticas baseadas em regex — rápido
- **Diferencial**: Opção `{ shiki: true }` retorna IDs compatíveis com Shiki nativamente
- **API**: `flourite(code, { shiki: true })` → `{ language: 'typescript', statistics: {...} }`

#### highlight.js highlightAuto (ray-so usa)

- **Bundle**: ~305KB gzip (build completo)
- **Linguagens**: 190+
- **Método**: Roda o parser de cada linguagem e compara relevância — lento
- **Contras**: Pesado, lento, sem compatibilidade nativa com Shiki

---

## Decisão Arquitetural

**Manter CodeMirror 6 com highlighting nativo (Lezer) + flourite para detecção.**

### Justificativa

1. **Já existe no projeto** — o `CodeEditor` já usa CodeMirror 6 com tema customizado
2. **O foco é colar/digitar e ver colorido** — não precisa de highlight VS Code-level
3. **Performance** — parsers Lezer são incrementais, ideais para edição em tempo real
4. **Bundle controlado** — só carregamos os language packs que precisamos (~15-20)
5. **flourite é minúsculo** (6KB) e cobre as linguagens mainstream com IDs Shiki-compatíveis
6. **Shiki continua sendo usado** para o `CodeBlock` (componente server-side de exibição de resultados)

---

## Especificação da Implementação

### Linguagens suportadas

~15-20 linguagens populares, cada uma com seu language pack do CodeMirror:

| Linguagem | Pacote CodeMirror | ID flourite |
|---|---|---|
| JavaScript | `@codemirror/lang-javascript` (já instalado) | `javascript` |
| TypeScript | `@codemirror/lang-javascript` (jsx/tsx) | `typescript` |
| Python | `@codemirror/lang-python` | `python` |
| Java | `@codemirror/lang-java` | `java` |
| C | `@codemirror/lang-cpp` | `c` |
| C++ | `@codemirror/lang-cpp` | `cpp` |
| C# | Usar `@replit/codemirror-lang-csharp` ou stream parser | `cs` |
| Go | `@codemirror/lang-go` (community) | `go` |
| Rust | `@codemirror/lang-rust` | `rust` |
| Ruby | `@codemirror/lang-ruby` (community) | `ruby` |
| PHP | `@codemirror/lang-php` | `php` |
| HTML | `@codemirror/lang-html` | `html` |
| CSS | `@codemirror/lang-css` | `css` |
| SQL | `@codemirror/lang-sql` | `sql` |
| JSON | `@codemirror/lang-json` | `json` |
| Markdown | `@codemirror/lang-markdown` | `markdown` |
| Shell/Bash | `@codemirror/legacy-modes` (stream parser) | N/A |
| YAML | `@codemirror/lang-yaml` | `yaml` |
| Kotlin | `@codemirror/lang-kotlin` (community) | `kotlin` |
| Swift | `@codemirror/lang-swift` (community) | N/A |

> **Nota**: Linguagens sem pacote CodeMirror oficial podem usar `@codemirror/legacy-modes` (wrappers de stream parsers do CodeMirror 5) ou pacotes da comunidade. Avaliar disponibilidade na implementação.

### Dependências a instalar

```
pnpm add flourite @codemirror/lang-python @codemirror/lang-java @codemirror/lang-cpp @codemirror/lang-rust @codemirror/lang-php @codemirror/lang-html @codemirror/lang-css @codemirror/lang-sql @codemirror/lang-json @codemirror/lang-markdown @codemirror/lang-yaml
```

> Pacotes da comunidade (Go, Ruby, Kotlin, Swift, C#, Shell) devem ser avaliados separadamente quanto a manutenção e qualidade.

### Componente: `CodeEditor` (refatoração)

Arquivo: `src/components/ui/code-editor.tsx`

#### Novas props

```ts
type CodeEditorProps = {
  value?: string
  onChange?: (value: string) => void
  language?: string                    // linguagem selecionada manualmente
  onLanguageChange?: (lang: string) => void  // callback quando linguagem muda (auto ou manual)
  className?: string
}
```

#### Comportamento de detecção

1. Quando o usuário cola ou digita código, rodar `flourite(code, { shiki: true })` com debounce (~300ms)
2. Se o usuário **não** selecionou uma linguagem manualmente, aplicar a linguagem detectada
3. Se o usuário **selecionou** manualmente, a seleção manual prevalece
4. Quando a linguagem muda (por detecção ou seleção), trocar o language extension do CodeMirror via `EditorView.dispatch` com `StateEffect` usando um `Compartment`

#### Troca dinâmica de linguagem no CodeMirror

O CodeMirror 6 usa `Compartment` para extensions que podem mudar em runtime:

```ts
import { Compartment } from '@codemirror/state'

const languageCompartment = new Compartment()

// Na criação do estado:
EditorState.create({
  extensions: [
    languageCompartment.of(javascript()),
    // ...outras extensions
  ],
})

// Para trocar a linguagem:
view.dispatch({
  effects: languageCompartment.reconfigure(python()),
})
```

### Componente: `LanguageSelect`

Novo componente para seleção manual de linguagem.

Arquivo: `src/components/ui/language-select.tsx`

#### Requisitos

- Dropdown/select com a lista de linguagens suportadas
- Opção "Auto-detect" no topo (padrão)
- Mostra a linguagem detectada ao lado quando em modo auto (ex: "Auto-detect · typescript")
- Visual consistente com o design system (dark theme, zinc scale, JetBrains Mono)
- Posicionado na barra de cabeçalho do editor (ao lado dos traffic light dots) ou logo abaixo

#### Integração com a homepage

Na `page.tsx`, o estado de linguagem será gerenciado:

```ts
const [code, setCode] = useState('')
const [language, setLanguage] = useState<string | undefined>(undefined) // undefined = auto-detect
const [detectedLanguage, setDetectedLanguage] = useState('plaintext')
```

O `LanguageSelect` e o `CodeEditor` compartilham esses estados.

### Registry de linguagens

Criar um mapeamento centralizado para não espalhar imports de language packs:

Arquivo: `src/lib/languages.ts`

```ts
type LanguageDefinition = {
  id: string           // ID interno (key do flourite/shiki)
  label: string        // Nome para exibição ("JavaScript", "Python")
  codemirror: () => Promise<Extension>  // Lazy import do language pack
}

const LANGUAGES: LanguageDefinition[] = [
  {
    id: 'javascript',
    label: 'JavaScript',
    codemirror: () => import('@codemirror/lang-javascript').then((m) => m.javascript()),
  },
  {
    id: 'typescript',
    label: 'TypeScript',
    codemirror: () => import('@codemirror/lang-javascript').then((m) => m.javascript({ typescript: true })),
  },
  {
    id: 'python',
    label: 'Python',
    codemirror: () => import('@codemirror/lang-python').then((m) => m.python()),
  },
  // ... demais linguagens
]
```

Isso permite lazy loading dos language packs — só carrega quando a linguagem é detectada/selecionada.

---

## Tarefas de Implementação

- [ ] Instalar dependências (`flourite` + language packs do CodeMirror)
- [ ] Criar o registry de linguagens (`src/lib/languages.ts`)
- [ ] Refatorar `CodeEditor` para aceitar `language` dinâmico via `Compartment`
- [ ] Integrar `flourite` para detecção automática com debounce
- [ ] Criar componente `LanguageSelect` para seleção manual
- [ ] Integrar `LanguageSelect` no header do editor ou na barra de ações
- [ ] Atualizar `page.tsx` para gerenciar estado de linguagem
- [ ] Testar com snippets de diferentes linguagens (JS, Python, Go, Rust, SQL, etc.)
- [ ] Verificar que `pnpm lint` e `pnpm build` passam

---

## Questões em Aberto

1. **Posição do seletor de linguagem**: No header do editor (ao lado dos dots) ou na barra de ações abaixo? O header parece mais natural pois é contexto do editor.
2. **C# e Shell/Bash**: Pacotes da comunidade para CodeMirror podem ter qualidade variável. Testar e avaliar se vale incluir ou manter como "plaintext" fallback.
3. **Fallback para linguagens não suportadas**: Quando `flourite` retorna uma linguagem que não temos language pack, usar plaintext (sem highlight) silenciosamente.
4. **Debounce da detecção**: 300ms parece razoável para não rodar detecção a cada keystroke, mas testar na prática para o caso de paste (que deve ser instantâneo).
