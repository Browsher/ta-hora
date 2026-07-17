# Implementation Plan — Produtos Recomendados (produtos-recomendados)

## Task Overview

A feature é **aditiva e de baixo risco**: roda inteira no servidor, no render ISR
que a página de produto já faz, e **não toca o fragmento compartilhado do
carrinho** (diferente da `acessorios-sugeridos`). Mesmo assim, o plano é
**fundação-primeiro**: os dados (`tags` no produto) e a marca antes da busca; a
busca antes da UI; a UI antes de plugar na página. Nada é "integração" no fim — a
tarefa de integração (10) é uma leitura + um `<Componente/>` depois do `</article>`.

**Antes de construir**, o Bloco 0 faz a **auditoria adversarial do plano** com foco
nos quatro pontos que o usuário pediu — grafia `eseecloud`, fronteira server-only,
centralização em qualquer quantidade, e não-regressão da página.

## Steering Document Compliance

- **`structure.md`** — pt-BR no domínio (`recomendados`, `marca`, `marcaDoProduto`);
  dados em `lib/shopify/`; UI em `components/loja/`; rota em `app/produtos/[handle]/`;
  fronteira `server-only` para o que toca o token.
- **`tech.md`** — ISR do route segment preservado; **DoD = build limpo (com e sem
  `.env.local`) + `tsc --noEmit` limpo + verificação manual**; **sem suíte de
  testes formal**; **proibido `force-cache`/`fetchCache`**; Home segue `○ Static`.
- **Precedentes herdados:** `acessorios.ts` (busca por tag + filtro em JS +
  `server-only`), `CatalogGrid` (server component montando cards client),
  `verificar-tags.mjs` (salvaguarda fora do build, `process.exitCode`), classes de
  layout em `globals.css` (`produto-grid` da `layout-pagina-produto`).

## Atomic Task Requirements

Cada tarefa: **1–3 arquivos**, **15–30 min**, **um resultado testável**, caminhos
de arquivo explícitos.

## Task Format Guidelines

- Checkbox: `- [ ] Número. Descrição`
- **Sempre especificar arquivos**: caminho exato a criar/modificar
- Detalhes de implementação como bullets
- Requisitos como `_Requirements: X.Y_`; reuso como `_Leverage: caminho_`
- Só tarefas de código (as exceções estão marcadas: 🧑 **PORTÃO HUMANO** / 🔍 **AUDITORIA**)
- Evitar termos amplos ("sistema", "integração", "completo") em títulos

## Tasks

### Bloco 0 — Auditoria do plano (ANTES de construir)

- [x] 1. 🔍 **AUDITORIA ADVERSARIAL do plano** — os 4 focos do usuário
  - File: nenhum (revisão). **Antes de qualquer código.**
  - Reler `design.md` + este plano e responder, por escrito, aos 4 pontos:
    - **(a) Grafia `eseecloud`** — a constante em `tags.ts` (tarefa 4) é
      **`"eseecloud"`** (dois "e"), não `"essecloud"`? A busca (tarefa 6) monta
      `tag:${marca}` a partir de `MARCAS`, nunca de literal solto? Há **algum**
      outro lugar no plano que reescreva a marca e possa divergir? *(Medido:
      `tag:essecloud` → 0; `tag:eseecloud` → 4.)*
    - **(b) Fronteira server-only** — `recomendados.ts` (tarefa 6) leva
      `import "server-only"`? Nenhum componente de cliente o importa como **valor**
      (só a página, que é server)? `RecomendadosRelacionados` (tarefa 8) é Server
      Component (**sem `"use client"`**) e só importa **tipos** da camada de dados?
    - **(c) Centralização** — o CSS (tarefa 9) usa **flex + `justify-content:
      center`** (não grid fracionário), garantindo 1/2/3/4 cards **sempre no
      meio**? `flex-grow: 0` impede um card solto de esticar?
    - **(d) Não-regressão** — a tarefa 10 insere a seção **depois do `</article>`**
      (não como 3º filho do grid)? Não mexe em `revalidate`/`dynamicParams`/os dois
      modos de falha? `tags` no `PRODUCT_BY_HANDLE_QUERY` (tarefa 2) é aditivo e não
      altera os campos existentes?
  - Verificar ainda: alguma tarefa depende de outra posterior? Requisito sem
    tarefa, ou tarefa sem requisito?
  - **Se a auditoria achar defeito, corrigir o plano/design ANTES de seguir.**
  - Purpose: pegar o que build/tsc não pegam, antes de empilhar código
  - _Requirements: 1.2, 6.1, 6.3, 3.5, 7.1_

### Bloco 1 — `tags` no produto (fundação de dados)

- [x] 2. Adicionar `tags` ao `PRODUCT_BY_HANDLE_QUERY`
  - File: `lib/shopify/queries.ts` (modificar)
  - Acrescentar o **escalar `tags`** ao `product(handle:)`, após `descriptionHtml`
  - **É só um campo escalar** — sem novo argumento, tipo ou conexão. Esta query é
    usada **só** por `getProductByHandle`, **não** pelo carrinho (baixo risco)
  - **NÃO** alterar `PRODUCTS_QUERY`, `ACESSORIOS_QUERY` nem
    `PRODUTO_PARA_CARRINHO_QUERY`
  - Purpose: a página passa a saber a marca sem segunda busca
  - _Leverage: `lib/shopify/queries.ts`_
  - _Requirements: 1.1, 9.1_

- [x] 3. Propagar `tags` no tipo cru, na normalização e no tipo de domínio
  - Files: `lib/shopify/normalize.ts` (modificar), `lib/shopify/types.ts` (modificar)
  - `normalize.ts`: `RawProduct` ganha `tags: string[]`; `normalizeProduct` mapeia
    **`tags: raw.tags ?? []`** — padrão defensivo já usado no arquivo (garante que
    `Product.tags` **nunca** é `undefined`)
  - `types.ts`: `Product` ganha `tags: string[]` — comentar que é o que permite
    descobrir a marca para os recomendados
  - Purpose: `Product` carrega a marca; `.includes()` nunca explode
  - _Leverage: `lib/shopify/normalize.ts` (padrão `?? []`), `lib/shopify/types.ts`_
  - _Requirements: 1.1, 7.5_

- [x] 4. Adicionar as constantes de marca e `marcaDoProduto` em `lib/shopify/tags.ts`
  - File: `lib/shopify/tags.ts` (modificar)
  - `export const TAG_ESEECLOUD = "eseecloud"` — 🔴 **DOIS "e" (es-ee-cloud). É a
    grafia CERTA, medida na loja; NÃO trocar por "essecloud" (devolve 0).** Comentar
    isso no código
  - `export const TAG_ICSEE = "icsee"`
  - `export const MARCAS = [TAG_ESEECLOUD, TAG_ICSEE] as const` — **ordem = desempate**
    (Req 1.5)
  - `marcaDoProduto(tags: string[]): string | null` → `MARCAS.find(m => tags.includes(m)) ?? null`
  - **SEM `server-only`** — string + função pura, sem token; mesmo precedente de
    `TAG_CAMERA`
  - Purpose: uma grafia só; a marca decidida por whitelist, com desempate definido
  - _Leverage: `lib/shopify/tags.ts` (precedente `TAG_CAMERA`/`TAG_ACESSORIO`)_
  - _Requirements: 1.2, 1.4, 1.5_

### Bloco 2 — Busca por marca (server-only)

- [x] 5. Adicionar `RECOMENDADOS_QUERY` em `lib/shopify/queries.ts`
  - File: `lib/shopify/queries.ts` (modificar)
  - `query Recomendados($query: String!, $first: Int!)` com
    `products(first: $first, query: $query)` → `nodes { id handle title
    availableForSale featuredImage {...} priceRange { minVariantPrice {...} } }`
  - **Seleção = `RawProductCard` + `availableForSale`** — para `normalizeProductCard`
    funcionar sem adaptador
  - **`availableForSale` NÃO entra na string de busca** — filtro em JS (tarefa 6)
  - Documento **novo**, cópia da forma da `ACESSORIOS_QUERY` — **não** reusar nem
    generalizar aquela (evita tocar a feature que já funciona)
  - Purpose: a busca por tag de marca, validada
  - _Leverage: `lib/shopify/queries.ts` (`ACESSORIOS_QUERY` como forma)_
  - _Requirements: 2.1, 2.5, 2.7_

- [x] 6. Criar `lib/shopify/recomendados.ts` (`server-only`)
  - File: `lib/shopify/recomendados.ts` (novo)
  - `import "server-only"`; `buscarRecomendados(marca: (typeof MARCAS)[number], handleAtual: string): Promise<ProductCard[]>`
    — 🔒 **`marca` tipada como elemento de `MARCAS`** (não `string`): trava no
    compilador que ninguém passe grafia arbitrária (defesa em profundidade,
    achado BAIXA-3 da auditoria). Importar `MARCAS` de `tags.ts` (`import type`
    não serve — é valor usado no tipo; `import { MARCAS }` normal, é módulo sem token)
  - `RawRecomendado extends RawProductCard { availableForSale: boolean }`
  - `storefrontFetch(RECOMENDADOS_QUERY, { query: \`tag:${marca}\`, first: 250 }, { revalidate: 300 })`
  - **Ordem das operações:** `.filter(availableForSale)` → `.filter(handle !== handleAtual)`
    → `.slice(0, 4)` → `.map(normalizeProductCard)`. **Cortar DEPOIS de excluir o
    atual** garante 4 **outras** câmeras (Req 2.2, 2.3, 2.4, 2.6)
  - **`{ revalidate: 300 }`, NUNCA `semCache`/`force-cache`** — participa do ISR da
    página (o cache "leve" é o da página, não do fetch)
  - **`marca` é sempre um elemento de `MARCAS`** (vem de `marcaDoProduto`) — o
    cliente nunca escolhe a busca. Comentar isso
  - **Pode lançar** (rede/Shopify fora) — quem degrada para `[]` é a página (tarefa 10)
  - Purpose: única camada que fala GraphQL de recomendados
  - _Leverage: `lib/shopify/acessorios.ts` (molde exato), `lib/shopify/client.ts`, `lib/shopify/normalize.ts` (`normalizeProductCard`), `lib/shopify/tags.ts`_
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7, 6.1, 6.2, 6.4, 9.3_

- [x] 7. Validar as queries no Dev MCP e exercitar na loja
  - File: nenhum (verificação)
  - Validar `PRODUCT_BY_HANDLE_QUERY` **com `tags`** e `RECOMENDADOS_QUERY` contra
    **2026-01** — **aviso de depreciação conta como falha** (Req 9.2)
  - **Executar de fato:** `tag:eseecloud` → **4** produtos disponíveis;
    `tag:icsee` → **3**. *(Já medido no design; o executor reproduz, não confia.)*
  - Confirmar que `product(handle:)` devolve `tags` como **array** para um produto real
  - Purpose: DoD do Req 9 — schema **e** loja (Req 9.4)
  - _Requirements: 9.1, 9.2, 9.4_

### Bloco 3 — UI (Server Component + CSS)

- [x] 8. Criar `components/loja/RecomendadosRelacionados.tsx` (Server Component)
  - File: `components/loja/RecomendadosRelacionados.tsx` (novo)
  - **SEM `"use client"`** — Server Component que monta os cards client (mesmo
    padrão do `CatalogGrid`)
  - Props: `{ produtos: ProductCard[] }` (`import type`)
  - **Guarda única:** `if (produtos.length === 0) return null` — cobre marca
    ausente, só-o-atual, todos indisponíveis e falha (a página passa `[]` em todos)
  - `<section className="recomendados-secao" aria-label="Você também pode gostar">`
    com `<Heading as="h2" size="grande" text="Você também pode gostar" color="var(--cor-texto)" accentColor="var(--cor-destaque)" />`
  - `<div className="recomendados-grade">{produtos.map(p => <ProductCardLink key={p.id} product={p} />)}</div>`
  - **Copy fixa no código** — exceção declarada ao "conteúdo em JSON" (precedente:
    `SeloPagamento`, "Você também vai precisar"); comentar
  - Cores só via `--cor-*`
  - Purpose: a seção, que some sozinha quando vazia
  - _Leverage: `components/loja/CatalogGrid.tsx` (padrão server→cards client), `components/loja/ProductCardLink.tsx`, `components/ui/Heading.tsx`_
  - _Requirements: 3.3, 4.1, 4.2, 4.3, 4.4, 4.5, 5.1, 5.3, 6.2, 6.3_

- [x] 9. Adicionar as classes da seção e da grade centralizada em `app/globals.css`
  - File: `app/globals.css` (modificar)
  - `.recomendados-secao`: `max-width: 1200px; margin: 0 auto; padding: 0 clamp(20px,5vw,64px) 72px`
    — 🔴 **`padding-top: 0`** (achado BAIXA-1): o `<article>` acima já tem
    `padding-bottom: 72px`; um top extra somaria ~80px de vão
  - `.recomendados-grade`: **`display:flex; flex-wrap:wrap; justify-content:center;
    align-items:stretch; gap:20px; margin-top:24px`**
  - `.recomendados-grade > *`: **`flex: 0 1 clamp(150px, 42vw, 240px); max-width: 260px`**
    — 🔴 base **responsiva** (achado MÉDIA-1): ~150px no celular → **2 cards por
    linha** (consistente com o `/catalogo`), 240px no desktop → até 4.
    **`flex-grow:0`** impede um card solto esticar; `justify-content:center`
    centraliza **1, 2, 3 ou 4** (Req 3.5). **NÃO** usar grid de colunas
    fracionárias (deixaria 1 card colado à esquerda)
  - Escopar por classe — **não** tocar `:root` nem base. O `240px` é ajustável na
    verificação manual
  - Purpose: seção largura-total centralizada + grade centralizada em qualquer nº
  - _Leverage: `app/globals.css` (precedente `produto-grid`/`produto-unico`)_
  - _Requirements: 3.1, 3.2, 3.4, 3.5, 3.6_

### Bloco 4 — Integração na página

- [x] 10. Plugar a seção em `app/produtos/[handle]/page.tsx`
  - File: `app/produtos/[handle]/page.tsx` (modificar)
  - Imports: `marcaDoProduto` (de `tags`), `buscarRecomendados` (de `recomendados`),
    `RecomendadosRelacionados`, `type ProductCard`
  - Após `if (!produto) notFound()` e o cálculo de `descricaoLimpa`:
    ```
    const marca = marcaDoProduto(produto.tags)
    let recomendados: ProductCard[] = []
    if (marca) {
      try { recomendados = await buscarRecomendados(marca, produto.handle) }
      catch { recomendados = [] }  // extra não derruba a página
    }
    ```
  - Renderizar **`<RecomendadosRelacionados produtos={recomendados} />` DEPOIS do
    `</article>`** e ainda dentro do `<StoreShell>` — 🔴 **não** como 3º filho do
    `<article>` (cairia no auto-flow das 2 colunas)
  - **NÃO** alterar `revalidate`/`dynamicParams`/`generateStaticParams`/
    `generateMetadata` nem os dois modos de falha (Shopify offline / `notFound`)
  - **Sem `console.error`** no catch — a mensagem de `storefrontFetch` conteria o endpoint
  - Purpose: a seção no lugar certo, aditiva
  - _Leverage: `app/produtos/[handle]/page.tsx`, `components/loja/RecomendadosRelacionados.tsx`, `lib/shopify/recomendados.ts`, `lib/shopify/tags.ts`_
  - _Requirements: 1.3, 3.1, 3.7, 5.2, 6.5, 7.1, 7.3_

### Bloco 5 — Salvaguarda (OPCIONAL) e documentação

> ⚪ **Bloco OPCIONAL (Req 8 é desejável, não bloqueante).** A pré-condição de
> dados está atendida (medida). Entregar a feature sem este bloco é decisão
> consciente; a salvaguarda é barata e recomendada.

- [ ] 11. ⚪ (Opcional) Criar `scripts/verificar-marcas.mjs` e o script npm
  - Files: `scripts/verificar-marcas.mjs` (novo), `package.json` (modificar)
  - **Falha (exit ≠ 0)** se **nenhum** produto publicado tiver `eseecloud` **ou**
    `icsee`. Reportar a contagem por marca. **Avisar (sem falhar)** produtos **sem
    tag de marca**, nomeando handles
  - **`process.exitCode`, NUNCA `process.exit()`** (armadilha do exit 127 no Windows)
  - `"verificar:marcas": "node --env-file=.env.local scripts/verificar-marcas.mjs"`
  - **NÃO** acoplar ao `npm run build`; duplica env/versão (exceção declarada, comentada)
  - 🔴 Usar **`eseecloud`** (dois "e") — a mesma constante de `tags.ts`, não literal duplicado
  - Purpose: a grafia divergente (que já aconteceu) falha com barulho
  - _Leverage: `scripts/verificar-tags.mjs` (estrutura + comentário do exitCode), `lib/shopify/tags.ts` (grafia)_
  - _Requirements: 8.1, 8.2, 8.3, 8.4_

- [ ] 12. ⚪ (Opcional) Documentar a feature e o `verificar:marcas` no `README.md`
  - File: `README.md` (modificar)
  - Como funciona (tag de marca `eseecloud`/`icsee` → recomendados da mesma marca,
    muda pelo admin sem código); registrar que **`eseecloud` tem dois "e" de
    propósito**; o que o `verificar:marcas` prova e por que não está no build
  - Purpose: a salvaguarda e a grafia não-óbvia ficam documentadas
  - _Leverage: `README.md` (seção do `verificar:tags` como modelo)_
  - _Requirements: 8.4_

### Bloco 6 — Verificação (DoD: build + manual)

- [ ] 13. Verificar build, tipos, fronteira e regime de render
  - File: nenhum (verificação)
  - `npx tsc --noEmit` limpo; `npm run build` limpo; **e sem `.env.local`** (backup
    + checksum ao restaurar) — o build passa e a seção só degrada em runtime
  - Token e domínio em `.next/static` → **0 ocorrências** (Req 6.1)
  - Nenhum componente importa `lib/shopify/recomendados` como **valor** (só a página)
  - `grep` por `fetchCache`/`force-cache` → **0** (Req 6.4)
  - Saída do build: `/` e `/sobre-nos` **`○ (Static)`**; `/catalogo` e
    `/produtos/[handle]` em ISR 300s (Req 7.2, 7.3)
  - Purpose: DoD estrutural — a fronteira e o regime provados
  - _Requirements: 6.1, 6.4, 7.2, 7.3, 7.4_

- [ ] 14. 🧑 **PORTÃO HUMANO** — os fluxos da seção (`npm run dev`)
  - File: nenhum (verificação). **Não é tarefa de agente**
  - **Câmera `eseecloud`** (ex.: `camera-seguranca-es-p9`) → seção "Você também
    pode gostar" com **3** cards (as outras 3 `eseecloud`), **sem** o atual
  - **Câmera `icsee`** (ex.: `camera-seguranca-a31h`) → **2** cards `icsee`, nunca
    mistura marca
  - 🔴 **CENTRALIZAÇÃO — o teste que o CSS existe para passar:** conferir 3 e 2
    cards **centralizados no meio**, sem vazio à direita. Se possível, forçar 1
    card (janela/dados) e ver **um card sozinho no centro**
  - **Clicar num card** → navega para `/produtos/<handle>`; **não** adiciona ao
    carrinho, **não** abre o drawer (Req 4.2, 4.3)
  - **Não-regressão da página (Req 7.1):** 2 colunas + sticky, botão Adicionar abre
    o drawer e dispara os acessórios, descrição rica, e um produto **sem descrição**
    (1 coluna) — tudo intacto
  - **Mobile:** cards empilham (1–2 por linha), **centralizados**
  - **`.env.local` renomeado** → site sobe, produto degrada como já degradava,
    **sem seção e sem erro** (restaurar depois)
  - **Teclado:** os cards (`<Link>`) focáveis e navegáveis
  - Purpose: DoD — o que só aparece em runtime (centralização + não-regressão)
  - _Requirements: 2.2, 2.3, 3.4, 3.5, 4.2, 4.3, 5.1, 5.2, 7.1_

## Preparação para a auditoria (Bloco 0, tarefa 1)

O foco, em ordem de dano — os quatro pontos que o usuário pediu:

1. 🔴 **Grafia `eseecloud`** — o literal certo (dois "e") no lugar certo (`tags.ts`),
   e a busca montada a partir de `MARCAS`, nunca de string solta. Medido:
   `essecloud` → 0, `eseecloud` → 4. Um "conserto" para `essecloud` mata a seção
   em silêncio — a tarefa 4 e o `verificar:marcas` existem contra isso.
2. 🔴 **Fronteira server-only** — `recomendados.ts` com `import "server-only"`;
   `RecomendadosRelacionados` server (sem `"use client"`); cliente importa só
   tipos; token com **0 ocorrências** em `.next/static` (tarefa 13).
3. 🔴 **Centralização em qualquer quantidade** — flex + `justify-content:center` +
   `flex-grow:0`, não grid fracionário. Verificável só em runtime (tarefa 14) — o
   build não pega "1 card colado à esquerda".
4. 🔴 **Não-regressão da página** — seção **depois do `</article>`**; `revalidate`/
   `dynamicParams`/os dois modos de falha intactos; `tags` aditivo na query. O
   sticky, o botão, os acessórios e a descrição continuam idênticos.
