# Structure — Ta Hora

## Idioma

**Português (pt-BR)** em todo o código: comentários, nomes de variáveis/arquivos
de domínio (`paleta`, `estilos`, `efeitos`, `fundo`, `destaque`, `carrinho`,
`cupom`) e conteúdo. Manter esse padrão — novos arquivos de domínio seguem a
nomenclatura em português; nomes de API do React/Next permanecem em inglês
(ex.: `Component`, `content`, `revalidate`).

## Árvore de diretórios

```
app/                      Rotas do Next (App Router)
  layout.tsx              RootLayout (html lang="pt-BR", metadata)
  globals.css             :root de fábrica (paleta fallback) + base Tailwind
  page.tsx                Home — importa layouts/_home.json          [○ Static]
  sobre-nos/page.tsx      Rota "Sobre Nós"                            [○ Static]
  catalogo/page.tsx       Vitrine da loja (Shopify)                   [ISR 300s]
  produtos/[handle]/page.tsx  Página de produto (Shopify)             [ISR 300s]
components/
  preview/PreviewContent  Renderizador genérico: mapeia sections → componentes
                          (aplica MotionConfig + wrapper de paleta)
  sections/<Nome>/        Uma pasta por seção: <Nome>.tsx + index.ts (barrel)
  loja/                   UI da loja (NÃO dirigida por JSON) — StoreShell (chrome
                          + wrapper de paleta), CatalogGrid, ProductCardLink,
                          ProductGallery, ProductSpecs
  ui/                     Primitivos reutilizáveis (Heading, Text, CtaButton, PriceTag…)
  efeitos/                Providers/efeitos globais (AnimatedBackground, etc.)
layouts/                  Dados de layout em JSON (fonte da verdade do CONTEÚDO)
  _home.json              Home
  sobre-nos.json          Sobre Nós
lib/                      Tipos, tema (paleta/estilos), contextos de efeito, hooks, utils
  shopify/                Camada de dados da Shopify (`server-only` — detém o token)
    client.ts             storefrontFetch: único ponto de saída HTTP + versão da API
    queries.ts            Documentos GraphQL
    products.ts           API de alto nível consumida pelas rotas
    normalize.ts          Raw → tipos do domínio (formatMoney)
    types.ts              Tipos compartilhados (SEM server-only: o cliente usa `import type`)
    specs.ts              Metafields de especificação
public/uploads/           Imagens/assets
.env.example              Variáveis da Shopify (o token NUNCA usa NEXT_PUBLIC_)
```

## Padrões

### Rota de conteúdo (Home, Sobre Nós)
Server Component minimalista: importa o JSON do layout, resolve a paleta
(`globalSettings.paleta ?? getPaleta(estilo)`) e delega ao `PreviewContent`.
Cada rota é um `Layout` COMPLETO e resolvido (navbar/footer/paleta já embutidos)
— o projeto exportado não conhece o conceito de "Site". **Sem `cookies()`/
`headers()`**: essas rotas precisam continuar `○ (Static)`.

### Rota da loja (`/catalogo`, `/produtos/[handle]`)
Server Component `async` que: declara `export const revalidate = 300` (é daqui
que vem o ISR — ver `tech.md` → "Modelo de build"), busca os dados via
`lib/shopify/products.ts` dentro de `try/catch` (Shopify fora → estado de erro
amigável, o build nunca quebra por env ausente) e renderiza dentro do
`StoreShell` (chrome + paleta do site).

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
**Seções são compartilhadas:** `Navbar`/`Footer` são renderizados tanto pelo
`PreviewContent` (Home, Sobre Nós) quanto pelo `StoreShell` (loja). Alterá-los
afeta o site inteiro — mudanças devem ser **aditivas**, sem prop nova obrigatória
e sem quebrar os JSONs existentes.

### Fronteira cliente/servidor (loja)
- Módulos que tocam o token levam `import "server-only"` → o build **falha** se um
  componente de cliente os importar.
- Componentes de cliente importam da camada de dados **apenas tipos**
  (`import type` — apagado na compilação).
- `lib/shopify/types.ts` é o contrato compartilhado e por isso **não** leva
  `server-only`.

### Convenções de código
- Componentes: **PascalCase**; pasta da seção = nome do componente.
- Hooks em `lib/use*.ts`; contextos em `lib/*Context.ts`.
- Comentários explicam **o porquê** (armadilhas de hidratação, compat, decisões de
  tema) — manter esse nível de documentação inline ao mexer nessas áreas.
- Tokens de design em `lib/tokens.ts`; paletas em `lib/estilos.ts`.

## Onde as coisas moram

| Preciso mudar…                    | Vá para…                                        |
|-----------------------------------|-------------------------------------------------|
| Texto/imagem de uma página        | O JSON em `layouts/`                             |
| Cores do tema                     | `globalSettings.paleta` no JSON, ou `lib/estilos.ts` |
| Comportamento de uma seção        | `components/sections/<Nome>/`                    |
| Registrar nova seção              | `componentMap` em `PreviewContent.tsx`          |
| Primitivo de UI                   | `components/ui/`                                 |
| Efeitos/animação globais          | `components/efeitos/` + `lib/*Context.ts`        |
| Tipos do Layout                   | `lib/types.ts`                                   |
| Query/mutation da Shopify         | `lib/shopify/queries.ts` (+ `client.ts`)         |
| Preço/estoque/produto (dados)     | `lib/shopify/products.ts` → `normalize.ts`       |
| UI do catálogo / produto          | `components/loja/`                               |
| Chrome das rotas da loja          | `components/loja/StoreShell.tsx`                 |
| Janela de ISR da loja             | `export const revalidate` na `page.tsx` da rota  |

## Convenções de conteúdo (layouts JSON)

- Nome de arquivo de página: `slug.json`; a home é `_home.json`.
- Campos multipágina (`kind`, `siteId`, `slug`, `isHome`, `order`) são opcionais.
- Ao editar JSON, preservar campos legados desconhecidos — não "limpar" o arquivo.
- **Os dados da loja NÃO moram em JSON** — produto, preço e estoque vêm da
  Shopify. Só o conteúdo editorial é JSON.
