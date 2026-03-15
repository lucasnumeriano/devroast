# specs/

Especificações de features escritas **antes** da implementação. O objetivo é pesquisar, decidir e documentar o plano antes de escrever código.

## Formato

Cada spec é um arquivo Markdown na raiz de `specs/` com o nome em kebab-case descrevendo a feature (ex: `drizzle.md`, `code-editor-syntax-highlight.md`).

### Estrutura

```markdown
# Título da Feature

## Resumo
Parágrafo curto explicando o que será feito e por quê.

---

## Pesquisa Realizada
Análise de alternativas, como outras ferramentas resolvem o problema, benchmarks de bundle size, trade-offs. Usar tabelas para comparações.

## Decisão Arquitetural
Qual caminho foi escolhido e a justificativa em bullet points.

---

## Especificação da Implementação
Detalhes técnicos: componentes, APIs, props, schemas, estrutura de arquivos, código de exemplo. Ser específico o suficiente para que a implementação possa ser feita seguindo o doc.

## Tarefas de Implementação
Checklist (`- [ ]`) com as tarefas concretas, agrupadas por fase se necessário.

## Questões em Aberto
Pontos que ainda precisam de decisão ou investigação.
```

### Regras

- **Língua**: português (consistente com o projeto).
- **Seções opcionais**: "Pesquisa Realizada" e "Questões em Aberto" podem ser omitidas se a feature for simples.
- **Seções obrigatórias**: Resumo, Decisão Arquitetural, Especificação da Implementação, Tarefas de Implementação.
- **Código de exemplo**: incluir snippets reais com tipos e imports, não pseudo-código.
- **Dependências**: listar comandos de instalação exatos (`pnpm add ...`).
- **Referências ao design**: quando aplicável, mapear campos/componentes para as telas do design.
