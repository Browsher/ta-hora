# Implementation Plan — Catálogo Consultivo

## Task Overview
Implementação **server-first e aditiva**, na ordem: fundação de dados (constantes → tipo → normalização → query) → salvaguarda dos dados na loja → núcleo puro de ordenação → UI (bloco, cliente, CSS) → fiação da página → auditoria de aceite (os 4 focos). Cada tarefa toca 1–3 arquivos e tem um resultado verificável. Nada quebra o catálogo atual: os campos crus entram **opcionais** e o `ProductCard` ganha campos que só o `normalizeProductCard` (único construtor) preenche.

## Steering Document Compliance
- **structure.md:** UI em `components/loja/`, primitivos de `components/ui/`, dados em `lib/shopify/`, CSS de layout em `app/globals.css`, salvaguarda em `scripts/verificar-*.mjs`. pt-BR em nomes/comentários.
- **tech.md:** token `server-only` intocado (cliente só `import type`); `/catalogo` segue ISR 300s; Home/`sobre-nos` seguem `○ Static`; money sempre da Shopify; sem framework de teste novo (DoD = build + verificação manual); check de dados **fora** do `npm run build`.

## Atomic Task Requirements
Cada tarefa: 1–3 arquivos, 15–30 min, um resultado testável, caminhos exatos, referências a requisitos e a código a reusar.

---

## Bloco 1 — Fundação de dados (servidor, aditivo)

- [ ] 1. Adicionar constantes de marca/recursos em `lib/shopify/tags.ts`
  - File: `lib/shopify/tags.ts` (modificar — adicionar ao final, sem tocar no existente)
  - Adicionar `export const TAG_MAIS_RECURSOS = "mais-recursos"`
  - Adicionar `export type Marca = (typeof MARCAS)[number]`
  - Adicionar `export const ROTULO_MARCA: Record<Marca, string> = { eseecloud: "EseeCloud", icsee: "iCSee" }`
  - Comentar: rótulo de exibição DESACOPLADO da grafia da tag; arquivo segue sem `server-only` (atravessa a fronteira como `types.ts`)
  - Purpose: fonte única do rótulo de marca e da tag de recursos para servidor E cliente
  - _Requirements: 2.2, 3.4, 6.5_
  - _Leverage: lib/shopify/tags.ts (MARCAS, TAG_ESEECLOUD, TAG_ICSEE, marcaDoProduto)_

- [ ] 2. Estender o contrato `ProductCard` em `lib/shopify/types.ts`
  - File: `lib/shopify/types.ts` (modificar a interface `ProductCard`)
  - Adicionar `import type { Marca } from "./tags"` (type-only; sem ciclo)
  - Adicionar os campos: `marca: Marca | null`, `resumo: string | null`, `maisRecursos: boolean`, `precoNumerico: number`
  - Comentar cada campo: derivados no SERVIDOR; `precoNumerico` é SÓ chave de ordenação (nunca exibido); construtor único é `normalizeProductCard` (por isso podem ser obrigatórios)
  - Purpose: contrato compartilhado que o cliente consome como `import type`
  - _Requirements: 5.5, 6.1_
  - _Leverage: lib/shopify/types.ts (ProductCard, FormattedPrice, ProductImage), lib/shopify/tags.ts (Marca da Tarefa 1)_

- [ ] 3. Derivar os campos novos em `lib/shopify/normalize.ts`
  - File: `lib/shopify/normalize.ts` (modificar `RawProductCard` e `normalizeProductCard`)
  - Em `RawProductCard`: adicionar `tags?: string[]` e `resumo?: { value: string } | null` (OPCIONAIS — não quebram `acessorios.ts`/`recomendados.ts`, que estendem esta interface sem selecionar tags/metafield)
  - Importar `marcaDoProduto`, `TAG_MAIS_RECURSOS` de `./tags`
  - Em `normalizeProductCard`: derivar `const tags = raw.tags ?? []`, e retornar também `marca: marcaDoProduto(tags)`, `resumo: raw.resumo?.value?.trim() || null`, `maisRecursos: tags.includes(TAG_MAIS_RECURSOS)`, `precoNumerico: Number(raw.priceRange.minVariantPrice.amount)`
  - Comentar: `precoNumerico` assume amount numérico finito (Shopify sempre entrega string numérica); resumo vazio/ausente → `null`
  - Purpose: servidor entrega o `ProductCard` pronto (opção A aprovada)
  - _Requirements: 5.4, 5.5, 1.5, 2.1_
  - _Leverage: lib/shopify/normalize.ts (normalizeProductCard, normalizeImage, formatMoney), lib/shopify/tags.ts_

- [ ] 4. Estender `PRODUCTS_QUERY` em `lib/shopify/queries.ts` (validar 2026-01)
  - File: `lib/shopify/queries.ts` (modificar SÓ a `PRODUCTS_QUERY`)
  - Adicionar `tags` e `resumo: metafield(namespace: "custom", key: "resumo") { value }` à seleção de `nodes` (preservar `id/handle/title/featuredImage/priceRange`)
  - Comentar: aditivo; alimenta selo/resumo/filtro; 1 requisição (sem N+1); usada só por `getProducts`
  - **Validar a query alterada via Dev MCP `validate_graphql_codeblocks` (storefront-graphql, 2026-01) antes de concluir**
  - Purpose: trazer os dados novos numa única busca do catálogo
  - _Requirements: 5.1, 5.2, 5.6_
  - _Leverage: lib/shopify/queries.ts (PRODUCTS_QUERY), lib/shopify/products.ts (getProducts — assinatura inalterada)_

---

## Bloco 2 — Salvaguarda dos dados na loja (item (b) da auditoria)

- [ ] 5. Criar `scripts/verificar-resumo.mjs` + npm script `verificar:resumo`
  - Files: `scripts/verificar-resumo.mjs` (novo), `package.json` (adicionar script)
  - Modelar LINHA A LINHA em `scripts/verificar-marcas.mjs`: Node puro (não importa `lib/shopify/`), lê `SHOPIFY_STORE_DOMAIN`/`SHOPIFY_STOREFRONT_TOKEN`, versão default `2026-01` duplicada com comentário "mude nos dois lugares", pagina `products`, mensagem de erro SEM token, `process.exitCode` (NUNCA `process.exit()`)
  - Query do script: `nodes { handle title resumo: metafield(namespace:"custom", key:"resumo"){ value } }`
  - Saída: contar quantas câmeras têm `resumo` preenchido; listar as SEM resumo por handle; **exit 1 se NENHUMA tiver** (chave errada ou dados não preenchidos), exit 0 caso contrário
  - `package.json`: `"verificar:resumo": "node --env-file=.env.local scripts/verificar-resumo.mjs"`
  - Purpose: confirmar a chave `custom.resumo` nos DADOS reais da loja (lição do eseecloud) — não só no schema
  - _Requirements: 5.3, NFR Reliability_
  - _Leverage: scripts/verificar-marcas.mjs (padrão completo), package.json (scripts verificar:*)_

---

## Bloco 3 — Núcleo de ordenação (função pura)

- [ ] 6. Criar `ordenarCatalogo` + tipo `FiltroCatalogo` em `components/loja/ordenarCatalogo.ts`
  - File: `components/loja/ordenarCatalogo.ts` (novo — módulo puro, sem "use client", sem imports de valor da camada Shopify)
  - Exportar `type FiltroCatalogo = "todas" | "melhor-preco" | "mais-recursos" | "eseecloud" | "icsee"`
  - Exportar `ordenarCatalogo(produtos: ProductCard[], filtro: FiltroCatalogo): ProductCard[]` (`import type { ProductCard }`)
  - `todas` → retorna `produtos` (identidade, sem cópia); demais → `[...produtos].sort(...)` estável (ES2019): `melhor-preco` por `precoNumerico` asc (empate mantém ordem); `mais-recursos`/`eseecloud`/`icsee` → partição estável (casa → rank 0, resto → rank 1)
  - Comentar: nunca filtra para fora (comprimento invariante = "nunca esconde"); não muta a entrada
  - Purpose: coração testável do filtro (item (c) da auditoria)
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 4.3_
  - _Leverage: lib/shopify/types.ts (ProductCard), lib/shopify/tags.ts (Marca)_

---

## Bloco 4 — UI da vitrine

- [ ] 7. Criar `CameraBloco` (apresentacional) em `components/loja/CameraBloco.tsx`
  - File: `components/loja/CameraBloco.tsx` (novo)
  - Props `{ produto: ProductCard }` (`import type`); sem hooks, sem estado
  - Composição na ordem de leitura: `ImageSlot` (fallback nativo se `image` nulo) → nome como `Link` p/ `/produtos/{handle}` → **selo** só se `produto.marca` (`ROTULO_MARCA[produto.marca]`) → **resumo** só se `produto.resumo` (`<Text>`) → `PriceTag` → botão "ver detalhes" (`Link` p/ `/produtos/{handle}`)
  - Classes `catalogo-bloco` etc.; cores via `--cor-*`
  - Purpose: um bloco largo por câmera (consultivo)
  - _Requirements: 1.1, 1.4, 1.5, 1.6, 1.7, 2.2, 2.3, 2.4_
  - _Leverage: components/ui/ImageSlot, Text, PriceTag; components/loja/ProductCardLink.tsx (padrão de card+Link); lib/shopify/tags.ts (ROTULO_MARCA)_

- [ ] 8. Criar `CatalogoConsultivo` + `FiltroBar` em `components/loja/CatalogoConsultivo.tsx`
  - File: `components/loja/CatalogoConsultivo.tsx` (novo — `"use client"`)
  - Props `{ produtos: ProductCard[] }` (`import type`); `useState<FiltroCatalogo>("todas")`; `useMemo(() => ordenarCatalogo(produtos, filtro), [produtos, filtro])`
  - `produtos.length === 0` → estado vazio "Nenhum produto disponível no momento." SEM barra de filtros (Req 8.1)
  - Renderizar `FiltroBar` (5 botões pt-BR fixos: Todas/Melhor preço/Mais recursos/EseeCloud/iCSee, `aria-pressed`, ativo via `--cor-destaque`) + `<div className="catalogo-lista">` mapeando `<CameraBloco key={p.id} produto={p} />`
  - Import de VALOR só de `./ordenarCatalogo` e `./CameraBloco` (nunca módulo `server-only`)
  - Purpose: estado do filtro + reordenação leve; SSR entrega tudo no HTML inicial
  - _Requirements: 3.1, 3.2, 3.8, 3.9, 3.10, 4.1, 4.2, 4.3, 6.1, 6.2, 6.3, 6.4, 8.1, 8.2_
  - _Leverage: components/loja/ordenarCatalogo.ts (Tarefa 6), components/loja/CameraBloco.tsx (Tarefa 7)_

- [ ] 9. Adicionar as classes de layout do catálogo em `app/globals.css`
  - File: `app/globals.css` (modificar — adicionar junto às classes da loja)
  - `.catalogo-filtros` (flex, `flex-wrap`, gap, alvos ≥ 40px, estado ativo destacado); `.catalogo-lista` (coluna + gap); `.catalogo-bloco` (desktop `flex-direction:row`, imagem ~40%, `background: var(--cor-card)`, borda `color-mix(in srgb, var(--cor-destaque) 14%, transparent)`, radius 20; **`@media (max-width:767px)` → `flex-direction:column`**) — sem scroll horizontal
  - Purpose: bloco largo horizontal que colapsa no mobile, na paleta do site
  - _Requirements: 1.2, 1.3, 2.4_
  - _Leverage: app/globals.css (.produto-grid, .recomendados-secao, .recomendados-grade — precedente), lib/paleta.ts (--cor-*)_

- [ ] 10. Fiar o `CatalogoConsultivo` na rota `app/catalogo/page.tsx`
  - File: `app/catalogo/page.tsx` (modificar SÓ a linha do corpo)
  - Trocar `import { CatalogGrid }` por `import { CatalogoConsultivo }`; `corpo = <CatalogoConsultivo produtos={produtos} />`
  - Manter intactos: `export const revalidate = 300`, o `try/catch` (erro amigável), `StoreShell`, `SectionLabel` + `<h1>` "Catálogo"
  - Purpose: publicar a nova vitrine sem tocar no regime/erro da rota
  - _Requirements: 4.4, 7.1, 7.5, 8.1_
  - _Leverage: app/catalogo/page.tsx (estrutura atual), components/loja/CatalogoConsultivo.tsx (Tarefa 8)_

---

## Bloco 5 — Auditoria de aceite (os 4 focos) + Definition of Done

> Gate de "pronto", não etapa opcional. Executar após o Bloco 4. (b) usa o script novo; (a)/(c)/(d) são build + verificação manual. Nada disto entra no `npm run build` (que passa sem `.env.local`).

- [ ] 11. Auditoria (b) — chave `custom.resumo` confirmada na loja real
  - Rodar `npm run verificar:resumo` e conferir a contagem real (esperado: as 7 câmeras com resumo); zero → investigar grafia da chave/dados antes de seguir
  - Purpose: garantir que o resumo não some em silêncio por chave divergente
  - _Requirements: 5.3_
  - _Leverage: scripts/verificar-resumo.mjs (Tarefa 5)_

- [ ] 12. Auditoria (c) — filtro reordena de forma estável
  - Em `npm run dev`: clicar EseeCloud/iCSee/Mais recursos → grupo que casa sobe mantendo a ordem relativa; "Todas" restaura a ordem original; "Melhor preço" ordena crescente e empate não embaralha
  - Network tab: clicar filtros NÃO dispara requisição; imagens não piscam (`key={p.id}`)
  - Purpose: reordenação previsível, sem "pular" cards nem recarregar
  - _Requirements: 3.2, 3.3, 3.6, 3.7, 3.9_
  - _Leverage: components/loja/ordenarCatalogo.ts, CatalogoConsultivo.tsx_

- [ ] 13. Auditoria (a) — SEO: todas no HTML, sem JS, nunca `display:none`
  - `npm run build && npm start`; `curl -s .../catalogo` (ou View Source): as 7 câmeras (links `/produtos/…`, nomes, resumos, selos) no HTML bruto
  - DevTools sem JavaScript → 7 câmeras visíveis e "ver detalhes" navega
  - Em cada filtro: `document.querySelectorAll('.catalogo-bloco').length === 7`; grep no código garante ausência de `display:none`/desmontagem
  - Purpose: catálogo indexável e resiliente a "sem JS"
  - _Requirements: 4.1, 4.2, 4.3_
  - _Leverage: app/catalogo/page.tsx, CatalogoConsultivo.tsx_

- [ ] 14. Auditoria (d) + DoD — não-regressão e regime de render
  - `npx tsc --noEmit` limpo; `npm run build` OK e a saída mostra `/` e `/sobre-nos` `○ (Static)`, `/catalogo` e `/produtos/[handle]` ISR
  - `npm run build` **sem `.env.local`** conclui; grep do token/domínio em `.next/static` → 0 ocorrências
  - Abrir uma página de produto: acessórios sugeridos + "Você também pode gostar" + carrinho intactos
  - Purpose: nenhuma regressão silenciosa (build, regime, downstream, segredo)
  - _Requirements: 7.1, 7.2, 7.3, 7.4, NFR Security_
  - _Leverage: lib/shopify/acessorios.ts, recomendados.ts; app/produtos/[handle]/page.tsx; tech.md (DoD)_
