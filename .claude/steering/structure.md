# Structure — Ta Hora

## Idioma

**Português (pt-BR)** em todo o código: comentários, nomes de variáveis/arquivos
de domínio (`paleta`, `estilos`, `efeitos`, `fundo`, `destaque`) e conteúdo.
Manter esse padrão — novos arquivos de domínio seguem a nomenclatura em português;
nomes de API do React/Next permanecem em inglês (ex.: `Component`, `content`).

## Árvore de diretórios

```
app/                      Rotas do Next (App Router)
  layout.tsx              RootLayout (html lang="pt-BR", metadata)
  globals.css             :root de fábrica (paleta fallback) + base Tailwind
  page.tsx                Home — importa layouts/_home.json
  sobre-nos/page.tsx      Rota "Sobre Nós"
components/
  preview/PreviewContent  Renderizador genérico: mapeia sections → componentes
  sections/<Nome>/        Uma pasta por seção: <Nome>.tsx + index.ts (barrel)
  ui/                     Primitivos reutilizáveis (Heading, Text, CtaButton, PriceTag…)
  efeitos/                Providers/efeitos globais (AnimatedBackground, etc.)
layouts/                  Dados de layout em JSON (fonte da verdade do conteúdo)
  _home.json              Home
  sobre-nos.json          Sobre Nós
lib/                      Tipos, tema (paleta/estilos), contextos de efeito, hooks, utils
public/uploads/           Imagens/assets
```

## Padrões

### Rota (page.tsx)
Server Component minimalista: importa o JSON do layout, resolve a paleta
(`globalSettings.paleta ?? getPaleta(estilo)`) e delega ao `PreviewContent`.
Cada rota é um `Layout` COMPLETO e resolvido (navbar/footer/paleta já embutidos)
— o projeto exportado não conhece o conceito de "Site".

### Nova seção — checklist
1. Criar `components/sections/<Nome>/<Nome>.tsx` (`"use client"`).
2. Criar `components/sections/<Nome>/index.ts` re-exportando o componente (barrel).
3. Em `components/preview/PreviewContent.tsx`: adicionar o **import estático** E a
   entrada no `componentMap` (obrigatório — Turbopack não faz import dinâmico).
4. Consumir efeitos via `useSectionEffects()` / helpers de `lib/sectionEffectHelpers.ts`.
5. Usar primitivos de `components/ui/` em vez de recriar botões/textos/etc.
6. Cores via variáveis `--cor-*` (ou `accentColor`), nunca hex hard-coded que
   ignore o tema.

### Contrato de props de seção (vindo do PreviewContent)
Cada componente recebe: `type`, `variation`, `effect`, `...section.content`
(espalhado), `content` (o objeto inteiro) e `accentColor` (resolvido —
`var(--cor-destaque)` ou hex do usuário). Content é sempre `Record<string, unknown>`
com campos opcionais tipados na interface local do componente.

### Convenções de código
- Componentes: **PascalCase**; pasta da seção = nome do componente.
- Hooks em `lib/use*.ts`; contextos em `lib/*Context.ts`.
- Comentários explicam **o porquê** (armadilhas de hidratação, compat, decisões de
  tema) — manter esse nível de documentação inline ao mexer nessas áreas.
- Tokens de design em `lib/tokens.ts`; paletas em `lib/estilos.ts`.

## Onde as coisas moram

| Preciso mudar…             | Vá para…                                        |
|----------------------------|-------------------------------------------------|
| Texto/imagem de uma página | O JSON em `layouts/`                             |
| Cores do tema              | `globalSettings.paleta` no JSON, ou `lib/estilos.ts` |
| Comportamento de uma seção | `components/sections/<Nome>/`                    |
| Registrar nova seção       | `componentMap` em `PreviewContent.tsx`          |
| Primitivo de UI            | `components/ui/`                                 |
| Efeitos/animação globais   | `components/efeitos/` + `lib/*Context.ts`        |
| Tipos do Layout            | `lib/types.ts`                                   |

## Convenções de conteúdo (layouts JSON)

- Nome de arquivo de página: `slug.json`; a home é `_home.json`.
- Campos multipágina (`kind`, `siteId`, `slug`, `isHome`, `order`) são opcionais.
- Ao editar JSON, preservar campos legados desconhecidos — não "limpar" o arquivo.
