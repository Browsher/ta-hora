# Implementation Plan — Catálogo da Loja (catalogo-loja)

## Task Overview
Implementação incremental do catálogo headless Shopify: primeiro a **migração de
build** (runtime/ISR) sem regredir o conteúdo atual, depois a **camada de dados
`lib/shopify/`** (server-only), os **componentes de apresentação** em
`components/loja/` (reutilizando os primitivos de `components/ui/`), as **rotas**
`/catalogo` e `/produtos/[handle]`, a **navegação** (religar o link "Catálogo") e
a atualização de **documentação**. Cada tarefa toca 1–3 arquivos e tem um
resultado testável.

## Steering Document Compliance
- **structure.md:** libs em `lib/shopify/`, componentes em `components/loja/`
  (um arquivo por componente), rotas em `app/`, nomes de domínio em pt-BR.
- **tech.md:** remove `output: "export"` (migração esperada), token só em env
  (`server-only` + `.env.example`), mantém `images.unoptimized`, ISR ≤ 5 min,
  alvo Vercel. DoD = `npm run build` limpo + verificação manual.

## Atomic Task Requirements
Cada tarefa: ≤ 1–3 arquivos, 15–30 min, um resultado testável, arquivos exatos,
referência a requisito e a código reutilizado.

## Tasks

### Bloco 1 — Migração de build e ambiente

- [x] 1. Ajustar `next.config.ts` para runtime (remover static export)
  - File: `next.config.ts`
  - Remover `output: "export"`; **manter** `images: { unoptimized: true }`
  - Purpose: habilitar SSR/ISR sem depender do otimizador do Next
  - _Leverage: next.config.ts (atual)_
  - _Requirements: 4.2, 4.5_

- [x] 2. Criar `.env.example` com as variáveis da Shopify
  - File: `.env.example`
  - Documentar `SHOPIFY_STORE_DOMAIN`, `SHOPIFY_STOREFRONT_TOKEN` e
    `SHOPIFY_STOREFRONT_API_VERSION` (comentar default `2025-01`; nota: atual 2026-07);
    valores placeholder, sem segredos; comentar os scopes necessários do token
    (`unauthenticated_read_product_listings`, `unauthenticated_read_product_inventory`)
  - **Verificar rastreabilidade:** `git check-ignore .env.example` deve retornar
    **vazio** (o arquivo precisa ser versionado; NÃO alterar o `.gitignore`)
  - Purpose: documentar config sem commitar segredos (`.env*` já é gitignored)
  - _Requirements: 1.2, Security_

- [x] 3. Adicionar dependência `server-only`
  - File: `package.json`
  - Instalar `server-only` (`npm i server-only`) para barrar import no cliente
  - Purpose: garantir fronteira servidor→cliente do token em tempo de build
  - _Requirements: 1.5, Security_

### Bloco 2 — Camada de dados `lib/shopify/`

- [x] 4. Criar tipos da loja em `lib/shopify/types.ts`
  - File: `lib/shopify/types.ts`
  - Definir `Money` (cru: `amount`/`currencyCode`), `ProductImage`, `Spec`,
    `ProductCard`, `Product`, e o tipo de preço formatado
    `{ price: string; currency: string }`
  - Purpose: contrato de tipos para a camada de dados e a UI
  - _Requirements: 2.2, 3.2_

- [x] 5. Criar mapa de metafields de specs em `lib/shopify/specs.ts`
  - File: `lib/shopify/specs.ts`
  - Exportar `SPEC_METAFIELDS: { namespace; key; label }[]` com placeholders
    (`specs/resolucao→"Resolução"`, `specs/conexao→"Conexão"`,
    `specs/visao_noturna→"Visão noturna"`) + `// TODO: confirmar namespace/keys reais`
  - Purpose: declarar quais metafields são "specs" e seus rótulos legíveis
  - _Requirements: 3.2_

- [x] 6. Criar cliente Storefront em `lib/shopify/client.ts`
  - File: `lib/shopify/client.ts`
  - `import "server-only"` na 1ª linha; `storefrontFetch<T>(query, variables?, opts?)`;
    ler env (domínio/token/versão com default `2025-01`); montar endpoint
    `https://{domínio}/api/{versão}/graphql.json`; header
    `X-Shopify-Storefront-Access-Token`; `fetch` com `next: { revalidate }`
  - Purpose: executar GraphQL server-side com o token de env
  - _Requirements: 1.1, 1.3, 1.5_

- [x] 7. Adicionar tratamento de erro/env ausente em `client.ts`
  - File: `lib/shopify/client.ts` (continua da tarefa 6)
  - Lançar erro explícito se domínio/token ausentes; tratar `!res.ok` e
    `json.errors` lançando `Error` **sem** interpolar o token
  - Purpose: falha segura e sem vazar credencial
  - _Requirements: 1.2, 1.4_

- [x] 8. Criar documentos GraphQL em `lib/shopify/queries.ts`
  - File: `lib/shopify/queries.ts`
  - `import "server-only"` na 1ª linha (defesa em profundidade); `PRODUCTS_QUERY`
    (`products(first)`: id, handle, title, featuredImage, priceRange.minVariantPrice);
    `PRODUCT_BY_HANDLE_QUERY` (title, descriptionHtml, images, priceRange,
    `metafields(identifiers)`)
  - Purpose: consultas versionadas para vitrine e produto
  - _Leverage: lib/shopify/specs.ts_
  - _Requirements: 2.1, 3.1, 3.2_

- [x] 9. Criar `formatMoney` em `lib/shopify/normalize.ts`
  - File: `lib/shopify/normalize.ts`
  - `formatMoney(m: Money)` **respeita o `currencyCode`** (não fixa BRL): mapear
    código → símbolo (BRL→"R$"; demais→símbolo/código); número no padrão pt-BR
    (milhar ".", decimal ","), ex. `"1799.90"/BRL` → `{ price: "1.799,90", currency: "R$" }`
  - Purpose: preço no formato que o `PriceTag` espera, com moeda correta
  - _Leverage: components/ui/PriceTag.tsx_
  - _Requirements: 2.2, 3.2_

- [x] 10. Adicionar normalizadores em `lib/shopify/normalize.ts`
  - File: `lib/shopify/normalize.ts` (continua da tarefa 9)
  - `normalizeProductCard(raw)` e `normalizeProduct(raw)`; extrair `specs: Spec[]`
    via `SPEC_METAFIELDS`, **omitindo** metafields nulos/ausentes
  - Purpose: converter GraphQL cru → tipos limpos
  - _Leverage: lib/shopify/specs.ts, lib/shopify/types.ts_
  - _Requirements: 3.2_

- [x] 11. Criar API de dados em `lib/shopify/products.ts`
  - File: `lib/shopify/products.ts`
  - `import "server-only"` na 1ª linha (defesa em profundidade);
    `getProducts(): Promise<ProductCard[]>` e
    `getProductByHandle(handle): Promise<Product | null>` (null quando `product` é null)
  - Purpose: funções de alto nível que as rotas consomem
  - _Leverage: lib/shopify/client.ts, lib/shopify/queries.ts, lib/shopify/normalize.ts_
  - _Requirements: 2.1, 3.1, 3.3_

### Bloco 3 — Componentes de apresentação `components/loja/`

> **Padrão de segurança (M1):** todos os componentes deste bloco importam tipos
> de `lib/shopify/types.ts` via **`import type`** (apagado na compilação — nunca
> arrasta runtime de servidor pro bundle do cliente).

- [x] 12. Criar `ProductCardLink` em `components/loja/ProductCardLink.tsx`
  - File: `components/loja/ProductCardLink.tsx` ("use client")
  - `import type` do tipo `ProductCard`; `<Link href={\`/produtos/${handle}\`}>`
    envolvendo `ImageSlot` (`alt={image?.altText ?? title}`, `aspect-ratio`) +
    `Text` (título) + `PriceTag`
  - Purpose: card clicável da vitrine
  - _Leverage: components/ui/ImageSlot.tsx, components/ui/Text.tsx, components/ui/PriceTag.tsx, lib/shopify/types.ts_
  - _Requirements: 2.2, 2.3, 2.4_

- [x] 13. Criar `CatalogGrid` em `components/loja/CatalogGrid.tsx`
  - File: `components/loja/CatalogGrid.tsx`
  - `import type` do tipo `ProductCard`; grid `auto-fit` (padrão do `ProductGrid`);
    mapear `products` → `ProductCardLink`; **estado vazio** amigável quando
    `products.length === 0`
  - Purpose: layout responsivo da vitrine + estado vazio
  - _Leverage: components/loja/ProductCardLink.tsx, components/sections/ProductGrid/ProductGrid.tsx (padrão de grid), lib/shopify/types.ts_
  - _Requirements: 2.1, 2.5, 2.6_

- [x] 14. Criar `ProductGallery` em `components/loja/ProductGallery.tsx`
  - File: `components/loja/ProductGallery.tsx` ("use client")
  - `import type` do tipo `ProductImage`; imagem principal + thumbnails; troca via
    `useState`; `alt={img.altText ?? title}`
  - Purpose: galeria da página de produto
  - _Leverage: components/ui/ImageSlot.tsx, lib/shopify/types.ts_
  - _Requirements: 3.2, 3.4, Usability_

- [x] 15. Criar `ProductSpecs` em `components/loja/ProductSpecs.tsx`
  - File: `components/loja/ProductSpecs.tsx`
  - `import type` do tipo `Spec`; renderizar `specs: Spec[]` como pares rótulo/valor
    (tema `--cor-*`); lista vazia → não renderiza a seção
  - Purpose: bloco de especificações técnicas
  - _Leverage: components/ui/Text.tsx, lib/shopify/types.ts_
  - _Requirements: 3.2_

- [x] 16. Criar `AddToCartPlaceholder` em `components/loja/AddToCartPlaceholder.tsx`
  - File: `components/loja/AddToCartPlaceholder.tsx` ("use client")
  - `<button type="button" disabled aria-disabled>` estilizado com tema/`tokens`
    (visual do CtaButton sólido); **inerte** (sem handler, não navega); `// TODO: carrinho`
  - Purpose: placeholder do futuro "adicionar ao carrinho"
  - _Leverage: lib/tokens.ts, components/ui/CtaButton.tsx (referência visual)_
  - _Requirements: 3.5_

### Bloco 4 — Rotas

- [x] 17. Criar rota da vitrine em `app/catalogo/page.tsx`
  - File: `app/catalogo/page.tsx` (Server Component)
  - `export const revalidate = 300`; `getProducts()` em `try/catch`; erro →
    bloco de erro amigável; sucesso → `<CatalogGrid products />`; `<main>` com fundo do tema
  - Purpose: página `/catalogo` com ISR e degradação controlada
  - _Leverage: lib/shopify/products.ts, components/loja/CatalogGrid.tsx_
  - _Requirements: 2.1, 2.5, 2.6, 4.1, 4.4_

- [x] 18. Criar rota de produto em `app/produtos/[handle]/page.tsx`
  - File: `app/produtos/[handle]/page.tsx` (Server Component)
  - `export const revalidate = 300`; `export const dynamicParams = true`; tratar os
    **dois modos de falha DISTINTOS**: (a) fetch em `try/catch` → **Shopify offline**
    renderiza UI de erro amigável; (b) `notFound()` **FORA do try** quando o produto
    é `null` (handle inexistente) — nunca dentro do `catch` (senão engole o
    `NEXT_NOT_FOUND`). Renderizar `ProductGallery` + `Heading` + `PriceTag` +
    descrição (`descriptionHtml`) + `ProductSpecs` + `AddToCartPlaceholder`
  - Purpose: página de produto com ISR, 404 controlado e resiliência a Shopify offline
  - _Leverage: lib/shopify/products.ts, components/loja/*, components/ui/PriceTag.tsx, components/ui/Heading.tsx_
  - _Requirements: 3.1, 3.2, 3.3, 3.5, 3.6, 4.1, 4.4_

- [x] 19. Adicionar `generateMetadata` e `generateStaticParams` **tolerantes** em `app/produtos/[handle]/page.tsx`
  - File: `app/produtos/[handle]/page.tsx` (continua da tarefa 18)
  - `generateStaticParams` chama a Shopify em `try/catch` → **em erro retorna `[]`**
    (deixa tudo pro ISR on-demand; build sem `.env.local` NÃO quebra);
    `generateMetadata` idem → título genérico em erro; sucesso → `<title>` com o
    nome do produto
  - Purpose: SEO básico + pré-render tolerante a env/Shopify ausente no build
  - _Leverage: lib/shopify/products.ts_
  - _Requirements: 3.1, 4.1, 4.6_

### Bloco 5 — Navegação e documentação

- [x] 20. Religar o link "Catálogo" na Navbar e no Footer (aditivo)
  - Files: `layouts/_home.json`, `layouts/sobre-nos.json`
  - Nos DOIS arquivos: adicionar `link1Href: "/catalogo"` na seção Navbar (o
    `link1Label` "Catálogo" já existe) e `column1Link1Href: "/catalogo"` na seção
    Footer (o `column1Link1Label` "Catálogo" já existe). **Somente adicionar o
    href** — não mexer nos demais links; validar que os JSONs continuam válidos
  - Purpose: tornar `/catalogo` alcançável pela navegação sem regredir navbar/footer
  - _Leverage: components/sections/Navbar/Navbar.tsx, components/sections/Footer/Footer.tsx_
  - _Requirements: 2.7_

- [x] 21. Atualizar documentação do modelo de build (runtime)
  - Files: `README.md`, `.claude/steering/tech.md`
  - README: o build não gera mais `out/` estático; deploy é runtime na Vercel
    (`npm start` p/ produção local). tech.md → seção "Comandos": ajustar o
    comentário de `npm run build` (não é mais export estático)
  - Purpose: docs param de descrever um build que não existe mais
  - _Requirements: 4.7_

### Bloco 6 — Verificação (DoD: build + manual)

- [x] 22. Verificar build (com e SEM env) e não-regressão do conteúdo atual
  - Files: — (execução: `npm run build`)
  - Confirmar build de runtime sem erros de TypeScript; **build SEM `.env.local`
    conclui com sucesso** (páginas de produto caem no ISR); Home (`/`) e Sobre Nós
    (`/sobre-nos`) continuam pré-renderizando (SSG) sem depender da Shopify
  - Purpose: DoD — build limpo (inclusive sem credenciais) + site atual sem regressão
  - _Requirements: 4.2, 4.3, 4.6_

- [x] 23. Verificação manual dos fluxos da loja (ACEITAÇÃO — requer credenciais reais)
  - Files: — (execução: `npm run dev` com `.env.local` real)
  - **Etapa de aceitação humana, não é tarefa de código de agente** (precisa de
    token/loja Shopify reais): `/catalogo` lista produtos → card leva a
    `/produtos/[handle]` com galeria, preço e specs; `/produtos/handle-invalido` → 404;
    link "Catálogo" na navbar/footer leva à vitrine
  - **Checagem automatizável (roda sem credenciais):** após `npm run build`,
    confirmar que o token NÃO aparece nos artefatos do cliente
    (`grep -r "$SHOPIFY_STOREFRONT_TOKEN" .next/static` retorna vazio)
  - Purpose: DoD — aceitação ponta a ponta + garantia de não-vazamento do token
  - _Requirements: 2.1, 2.3, 2.7, 3.1, 3.3, 1.5_
