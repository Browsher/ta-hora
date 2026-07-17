# Implementation Plan

## Task Overview

Reforma do layout de `/produtos/[handle]` em passos atômicos. A ordem é
**dependência-primeiro**: a sanitização (função pura, testável isolada) antes do
componente que a consome, antes da página que orquestra, antes do CSS que a
página referencia. A salvaguarda e a auditoria fecham. Cada tarefa toca 1–3
arquivos e tem um resultado verificável.

Reuso máximo (nenhuma mudança em query, tipos, carrinho, galeria ou acessórios):
`getProductByHandle`, `StoreShell`, `ProductGallery`, `BotaoAdicionar`,
`PriceTag`, `Heading`. `sanitize-html` **já instalado** (fase de design).

## Steering Document Compliance

- Arquivos nos lugares do `structure.md`: dados/sanitização em `lib/shopify/`
  (`server-only`), UI em `components/loja/`, rota em `app/produtos/[handle]/`,
  script em `scripts/`.
- Nomes de domínio em **pt-BR**; `import "server-only"` no módulo que toca o
  `sanitize-html`; `process.exitCode` (nunca `process.exit()`) no script.
- DoD = **build + verificação manual** (tech.md §5); sem suíte de testes nova.

## Atomic Task Requirements

Cada tarefa: 1–3 arquivos, 15–30 min, um resultado testável, caminhos exatos.

## Tasks

- [ ] 1. Criar a função de sanitização em `lib/shopify/sanitizarDescricao.ts`
  - File: `lib/shopify/sanitizarDescricao.ts` (novo)
  - `import "server-only"` no topo; `import sanitizeHtml from "sanitize-html"`.
  - Exportar `sanitizarDescricao(htmlCru: string | null | undefined): string`.
  - `allowedTags`: `p, br, strong, b, em, i, u, ul, ol, li, a, h2, h3, h4,
    blockquote, span, img`.
  - `allowedAttributes`: `{ a: ["href","rel","target"], img: ["src","alt","loading","decoding"] }`.
    ⚠️ **Armadilha verificada:** `loading/decoding/rel/target` PRECISAM estar aqui,
    senão o filtro os remove DEPOIS do `transformTags` (falha silenciosa).
  - `allowedSchemes: ["http","https","mailto"]` (sem `javascript:`).
  - `transformTags.a` → injeta `rel="noopener noreferrer nofollow"`, `target="_blank"`.
  - `transformTags.img` → preserva `alt`; adiciona `loading="lazy"`,
    `decoding="async"`; se `src` é `cdn.shopify.com` e SEM `width` na query,
    acrescenta `width=800` via `new URL()` + `searchParams` dentro de try/catch
    (URL inválida → `src` intacto).
  - Vazio pós-limpeza: se NÃO há `<img>` E o texto sem tags/`&nbsp;` é vazio →
    retornar `""`.
  - Purpose: fronteira única de segurança + otimização do HTML da descrição.
  - _Requirements: 2.1, 2.4, 3.1, 3.2, 3.3, 3.5, 3.7, 4.1, 4.2, 4.4, 6.5_
  - _Leverage: padrão `server-only` de `lib/shopify/client.ts`; protótipo validado no design_

- [ ] 2. Verificar a sanitização contra o HTML real do ES-P9 e entradas adversariais
  - File: (sem novo arquivo — verificação; opcionalmente um script descartável)
  - Rodar `sanitizarDescricao` sobre: (a) o HTML real do ES-P9 (medido: `<p>`+4
    `<img>`, `alt=""`); (b) `<script>`, `<img onerror>`, `<a href="javascript:">`,
    `style=`, `<iframe>`; (c) `<p> </p>` e `<p>&nbsp;</p>`.
  - Confirmar: imagens saem com `?…&width=800` + `loading="lazy"` + `decoding="async"`;
    HTML perigoso removido; entrada só-espaço → `""`.
  - Purpose: provar o Req 3 e o Req 2.4 antes de plugar na página.
  - _Requirements: 2.4, 3.2, 4.1, 4.2_
  - _Leverage: HTML medido do ES-P9 (requirements.md), protótipo do design_

- [ ] 3. Criar o componente `DescricaoProduto` em `components/loja/DescricaoProduto.tsx`
  - File: `components/loja/DescricaoProduto.tsx` (novo)
  - **Server Component — SEM `"use client"`** (invariante crítica do boundary).
  - Props: `{ html: string }`. Se `html === ""` → `return null`.
  - Senão: `<div className="descricao-produto" dangerouslySetInnerHTML={{ __html: html }} />`.
  - Sem `onClick`, sem hooks, sem import de dados — só recebe a string pronta.
  - Purpose: renderizar o HTML já limpo com imagens contidas e não-clicáveis.
  - _Requirements: 2.1, 3.6_
  - _Leverage: classe `.descricao-produto` (task 4)_

- [ ] 4. Adicionar as regras CSS em `app/globals.css`
  - File: `app/globals.css` (modificar — acrescentar ao fim, sem tocar `:root`/base)
  - `.descricao-produto img { max-width:100%; height:auto; display:block; }`
  - `.descricao-produto img:not([width]) { aspect-ratio: 4 / 3; }` (reserva
    anti-shift; imagens do ES-P9 são ~4:3/3:4).
  - `.descricao-produto p { margin: 0 0 12px; }`
  - `@media (min-width:768px) and (min-height:1000px) { .produto-coluna-esquerda
    { position:sticky; top:24px; align-self:start; } }` — limiar 1000px (a esquerda
    inclui a galeria; ajustável na verificação manual).
  - Purpose: contenção das imagens (Req 3.4), anti-shift (Req 4.3) e sticky
    condicional (Req 1.2–1.4).
  - _Requirements: 1.2, 1.3, 1.4, 3.4, 4.3_
  - _Leverage: `app/globals.css` existente_

- [ ] 5. Reformar `app/produtos/[handle]/page.tsx` — grid, coluna esquerda, descrição
  - File: `app/produtos/[handle]/page.tsx` (modificar)
  - Após `if (!produto) notFound()`: `const descricaoLimpa =
    sanitizarDescricao(produto.descriptionHtml)`; `const temDescricao =
    descricaoLimpa !== ""`.
  - `<article>` com className condicional: com descrição → `grid ... items-start
    md:grid-cols-2 ...`; sem → `flex max-w-[560px] flex-col` (centrada).
  - Coluna esquerda = um `<div className="produto-coluna-esquerda">` empilhando,
    NESTA ordem: `ProductGallery` → `Heading` (nome) → `PriceTag` → `BotaoAdicionar`.
  - `{temDescricao && <DescricaoProduto html={descricaoLimpa} />}`.
  - Importar `sanitizarDescricao` e `DescricaoProduto`.
  - Purpose: montar o layout 2-colunas/1-coluna com a esquerda como bloco sticky.
  - _Requirements: 1.1, 1.5, 2.1, 2.2, 2.3, 5.1, 5.2, 5.3_
  - _Leverage: `StoreShell`, `ProductGallery`, `Heading`, `PriceTag`, `BotaoAdicionar`_

- [ ] 6. Remover `ProductSpecs` da página em `app/produtos/[handle]/page.tsx`
  - File: `app/produtos/[handle]/page.tsx` (modificar — continua da task 5)
  - Apagar o `import { ProductSpecs }` e o `<ProductSpecs .../>`.
  - Manter o arquivo `components/loja/ProductSpecs.tsx` no repo (spec futura).
  - Confirmar `npx tsc --noEmit` sem "import não usado".
  - Purpose: tirar a ficha técnica desta reforma (Req 7).
  - _Requirements: 7.1, 7.2, 7.3_
  - _Leverage: —_

- [ ] 7. Criar a salvaguarda `scripts/verificar-descricao.mjs` + script no `package.json`
  - Files: `scripts/verificar-descricao.mjs` (novo); `package.json` (modificar)
  - Node puro; lê `SHOPIFY_STORE_DOMAIN`/`SHOPIFY_STOREFRONT_TOKEN`/versão de
    `process.env`; `fetch` de `products(first:50){nodes{handle descriptionHtml}}`.
  - Conta produtos com `descriptionHtml` não-vazio (trim); imprime resumo; se
    contagem `0` → `process.exitCode = 1`. **Nunca `process.exit()`.**
  - `package.json` → `"verificar:descricao": "node --env-file=.env.local scripts/verificar-descricao.mjs"`.
  - Purpose: fazer a pré-condição de dados cair com barulho (Req 8).
  - _Requirements: 8.1, 8.2, 8.3_
  - _Leverage: `scripts/verificar-tags.mjs` (padrão + armadilha do exit 127)_

- [ ] 8. AUDITORIA pré-build — revisar o diff antes de rodar o build
  - File: (revisão do diff completo desta spec — sem escrita)
  - **(a) Armadilha do `sanitize-html`:** confirmar que `loading, decoding` (img) e
    `rel, target` (a) estão na `allowedAttributes` — senão saem removidos.
  - **(b) Fronteira server-only:** `grep` por `"use client"` em
    `DescricaoProduto.tsx` (NÃO pode ter) e por import de `sanitizarDescricao`/
    `sanitize-html` em qualquer componente `"use client"` (NÃO pode haver). O
    módulo de sanitização tem `import "server-only"`.
  - **(c) Sem regressão:** `BotaoAdicionar` recebe o mesmo `handle` da rota (drawer
    + acessórios intactos); `revalidate=300` e `dynamicParams=true` presentes; a
    página não lê `cookies()`/`headers()`.
  - Purpose: pegar as três regressões de maior risco antes do build.
  - _Requirements: 3.1, 6.1, 6.2, 6.4, 6.5_
  - _Leverage: auditorias das specs `catalogo-loja`, `carrinho-loja`, `acessorios-sugeridos`_

- [ ] 9. Build + verificação de tipos + regime de render
  - File: (verificação — sem escrita)
  - `npx tsc --noEmit` limpo.
  - `npm run build` **com** `.env.local`: confirmar na saída que
    `/produtos/[handle]` segue ISR e `/` + `/sobre-nos` seguem `○ (Static)`.
  - `npm run build` **sem** `.env.local`: passa.
  - `grep` em `.next/static` por token/domínio → **0 ocorrências** (o
    `sanitize-html` não vazou pro cliente).
  - Purpose: provar Req 6 (build, tipos, regime, boundary).
  - _Requirements: 6.2, 6.3, 6.4, 6.6_
  - _Leverage: DoD do `tech.md`; checagem de `.next/static` da `catalogo-loja`_

- [ ] 10. Verificação manual no navegador (`npm run dev`)
  - File: (verificação — sem escrita)
  - **ES-P9** (`/produtos/camera-seguranca-es-p9`): desktop 2 colunas; esquerda
    gruda enquanto a descrição rola e solta no fim; 4 imagens contidas e
    não-clicáveis; Network mostra WebP `?width=800` (~434 KB no total).
  - **Faixa de risco** (janela ~850–950px de altura): botão "Adicionar"
    alcançável; se pinar fora, subir o limiar de 1000px.
  - **Produto sem descrição** (ex.: `camera-de-seguranca-q6`): 1 coluna centrada,
    sem espaço estranho.
  - **Botão "Adicionar"**: abre o drawer e dispara os acessórios sugeridos.
  - **Mobile** (< 768px): empilhado — galeria → nome → preço → botão → descrição.
  - `npm run verificar:descricao`: exit 0 (ES-P9 conta ≥ 1).
  - Purpose: provar Reqs 1, 2, 4, 5, 6.1, 8 no ambiente real.
  - _Requirements: 1.1, 1.3, 1.4, 2.2, 4.2, 5.1, 6.1, 8.1_
  - _Leverage: `npm run dev`; DevTools › Network_
