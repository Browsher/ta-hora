# Implementation Plan — Carrinho da Loja (carrinho-loja)

## Task Overview

Construção de baixo para cima, com a **fronteira de segurança primeiro**: tipos e
cache → camada de dados (`server-only`) → Server Actions (cookie `httpOnly`) →
componentes de cliente → integração → verificação.

A ordem não é estética. Cada bloco só depende dos anteriores, e a fronteira
cliente/servidor é estabelecida **antes** de existir qualquer componente de
cliente — assim é impossível "só por enquanto" importar a camada do token no
cliente e consertar depois.

**Substituição, não convivência:** o `AddToCartPlaceholder` é **removido** na
tarefa 20 (o TODO dele aponta para esta spec). Não fica placeholder morto.

## Steering Document Compliance

- **`structure.md`** — pt-BR em nomes de domínio e comentários; dados em
  `lib/shopify/`, novo domínio em `lib/carrinho/`, componentes em
  `components/loja/` (um arquivo por componente), rotas no App Router.
- **`tech.md`** — runtime (SSR/ISR) já migrado; **DoD = `npm run build` limpo +
  verificação manual**; **sem suíte de testes formal** (o `tech.md` proíbe
  adicionar infra de testes sem pedido) — por isso o Bloco 7 é build + manual, e
  a rede de segurança é estrutural (tipos, `server-only`, script de variantes).
- **Correções de steering** (tarefas 26–27b, **já executadas**) — o design provou
  que `tech.md:87` e o `product.md` afirmavam coisas falsas; a auditoria achou
  mais nove, incluindo uma (`tech.md:54–59`: *"sem código de servidor, sem Route
  Handlers"*) que **vetaria esta arquitetura** se alguém acreditasse nela. O
  steering foi corrigido **antes** do Bloco 1 de propósito. Precedente:
  `catalogo-loja` Req 4.7.

## Atomic Task Requirements

Cada tarefa: **1–3 arquivos**, **15–30 min**, **um resultado testável**, caminhos
de arquivo explícitos.

## Task Format Guidelines

- Formato de checkbox: `- [ ] Número. Descrição`
- **Sempre especificar arquivos**: caminho exato a criar/modificar
- Detalhes de implementação como bullets
- Requisitos referenciados como `_Requirements: X.Y_`
- Código existente a reaproveitar como `_Leverage: caminho/arquivo.ts_`
- Só tarefas de código (as exceções estão marcadas: 🧑 **PORTÃO HUMANO** para
  verificação que exige credenciais/olho humano, e as tarefas de documentação
  26–27c, que o `catalogo-loja` Req 4.7 estabeleceu como precedente)
- Evitar termos amplos ("sistema", "integração", "completo") em títulos de tarefa

## Tasks

### Bloco 1 — Fundação: cache e tipos

- [x] 1. Estender `StorefrontFetchOptions` para expressar "sem cache" em `lib/shopify/client.ts`
  - File: `lib/shopify/client.ts` (modificar)
  - Trocar a interface por união discriminada: `{ semCache?: false; revalidate?: number } | { semCache: true; revalidate?: never }`
  - Ramificar: `semCache` → `{ cache: "no-store" }`; senão → `{ next: { revalidate: opts?.revalidate ?? 300 } }` (nunca os dois — é conflito no Next)
  - NÃO tocar em `DEFAULT_API_VERSION` nem na leitura de env (a versão continua vindo daqui — Req 10.4)
  - **Comentar no código** (obrigatório): o `next: { revalidate }` é **inerte** — Next 15+ não cacheia `fetch` por default e `storefrontFetch` faz POST sem `force-cache`; o ISR do catálogo vem do `export const revalidate` das rotas. **Nunca "consertar" com `force-cache` nem `export const fetchCache = "default-cache"`**: isso cachearia o carrinho (a doc do Next diz que `force-cache` cobre POST e requests com `cookie`)
  - Purpose: declarar no tipo que o carrinho nunca cacheia — defesa contra mudança de default do framework e contra o "conserto" errado
  - _Leverage: `lib/shopify/client.ts` (linha 54)_
  - _Requirements: 8.4, 8.4a, 10.4_

- [x] 2. Provar que o catálogo não regrediu — `tsc` **+ build + regime das rotas**
  - File: nenhum (verificação)
  - `npx tsc --noEmit` — as chamadas de `lib/shopify/products.ts` (`{ revalidate: CATALOG_REVALIDATE }`, 2 ocorrências) devem continuar compilando
  - Confirmar que `{ semCache: true, revalidate: 300 }` é **erro de compilação** (a união trava a combinação inválida)
  - **`npm run build` e conferir na saída:** `/catalogo` e `/produtos/[handle]` seguem com **ISR 300s**; `/` e `/sobre-nos` seguem `○ (Static)`
  - **Por que o `tsc` sozinho não bastava** (achado da auditoria): um ramo **invertido** na união compila perfeitamente. Tipo não prova regime de cache — só a saída do build e o teste manual (tarefa 30, item 2) pegam isso
  - Purpose: garantir que a fundação não regrediu o catálogo antes de construir sobre ela
  - _Leverage: `lib/shopify/products.ts`, `app/catalogo/page.tsx`_
  - _Requirements: 8.4, 9.1, 9.2, 9.3_

- [x] 3. Adicionar os tipos do carrinho em `lib/shopify/types.ts`
  - File: `lib/shopify/types.ts` (modificar)
  - `LinhaCarrinho`, `CupomAplicado`, `Carrinho`, `ResultadoCarrinho` conforme §Data Models
  - **`Carrinho` NÃO tem campo `id`** — é a garantia de tipo do Req 2.4 (ID só no cookie)
  - `precoUnitario` e `precoTotal` como `FormattedPrice`; `descontos` como `FormattedPrice[]` (lista, nunca somada)
  - Manter o arquivo **sem** `server-only` (o cliente importa via `import type`)
  - Purpose: contrato compartilhado cliente/servidor sem vazar o ID do carrinho
  - _Leverage: `lib/shopify/types.ts` (`Money`, `FormattedPrice`, `ProductImage`)_
  - _Requirements: 2.4, 3.3_

### Bloco 2 — Camada de dados (`server-only`)

- [x] 4. Criar os documentos GraphQL do carrinho em `lib/shopify/queriesCarrinho.ts`
  - File: `lib/shopify/queriesCarrinho.ts` (novo)
  - `import "server-only"` no topo
  - Fragmento `CamposDoCarrinho`: `id`, `checkoutUrl`, `totalQuantity`, `cost { subtotalAmount totalAmount }`, `discountCodes { code applicable }`, `lines(first: 100)` com `cost { amountPerQuantity totalAmount }`, `discountAllocations { discountedAmount }`, `merchandise { ... on ProductVariant { … } }`
  - `CARRINHO_QUERY` + 5 mutations (`cartCreate`, `cartLinesAdd`, `cartLinesUpdate`, `cartLinesRemove`, `cartDiscountCodesUpdate`)
  - **Toda mutation seleciona `warnings { code message target }`** além de `userErrors { field message code }`
  - **`$discountCodes: [String!]!`** — não-nulo (o schema 2026-01 rejeita `[String!]`)
  - Proibido: `Cart.estimatedCost`, `Cart.discountAllocations`, `BaseCartLine.estimatedCost`, `totalDutyAmount`, `totalTaxAmount`, `*Estimated`
  - Purpose: operações GraphQL válidas e não-cegas (sem `warnings` o estoque falha em silêncio)
  - _Leverage: `lib/shopify/queries.ts` (padrão dos documentos)_
  - _Requirements: 10.2, 10.3, 10.5_

- [x] 5. Adicionar `PRODUTO_PARA_CARRINHO_QUERY` em `lib/shopify/queries.ts`
  - File: `lib/shopify/queries.ts` (modificar)
  - **Usar `product(handle: $handle)` — NUNCA `productByHandle`**, que está depreciado na 2026-01 ("Use `product` instead", confirmado no Dev MCP). O `queries.ts` atual já usa a forma certa; o risco é escrever `productByHandle` por reflexo ao ler "produto por handle"
  - Query por handle com `variants(first: 2) { nodes { id title availableForSale quantityAvailable } }`
  - `quantityAvailable` pode vir `null` (depende do scope `unauthenticated_read_product_inventory`) — tratar como opcional (Req 10.7)
  - **`first: 2` é deliberado**: são necessárias 2 para detectar "mais de uma variante" (Req 1.8). Não trocar por `first: 1`
  - NÃO alterar `PRODUCTS_QUERY` nem `PRODUCT_BY_HANDLE_QUERY` (o catálogo não pode regredir)
  - Purpose: obter `merchandiseId` (hoje inexistente na camada) e alimentar a salvaguarda
  - _Leverage: `lib/shopify/queries.ts` (`PRODUCT_BY_HANDLE_QUERY` já usa `product(handle:)`)_
  - _Requirements: 1.7, 1.8, 9.1, 10.6, 10.7_

- [x] 6. Criar a normalização do carrinho em `lib/shopify/normalizeCarrinho.ts`
  - File: `lib/shopify/normalizeCarrinho.ts` (novo)
  - Raw → `Carrinho`/`LinhaCarrinho`; **descartar o `id` do carrinho** (não entra no tipo)
  - `precoUnitario` ← `cost.amountPerQuantity`; `precoTotal` ← `cost.totalAmount`. **Nunca dividir/multiplicar localmente**
  - **Filtrar `discountCodes` por `applicable: true`** — código inválido não pode aparecer como aplicado
  - Purpose: dinheiro e estado vindos da Shopify, sem aritmética local
  - _Leverage: `lib/shopify/normalize.ts` (`formatMoney`), `lib/shopify/types.ts`_
  - _Requirements: 3.7, 5.3, 5.4_

- [x] 7. Adicionar tradução de `warnings` para pt-BR em `lib/shopify/normalizeCarrinho.ts`
  - File: `lib/shopify/normalizeCarrinho.ts` (continuar da tarefa 6)
  - Mapear `MERCHANDISE_NOT_ENOUGH_STOCK` → "Ajustamos a quantidade ao estoque disponível."; `DISCOUNT_NOT_FOUND` → "Cupom inválido."
  - Código desconhecido → mensagem genérica em pt-BR; **nunca** exibir a string crua da Shopify (vem em inglês)
  - Purpose: o cliente entende o que aconteceu; sem isso o `+` trava mudo
  - _Leverage: `lib/shopify/normalizeCarrinho.ts`_
  - _Requirements: 1.5, 3.12, 5.4_

- [x] 8. Criar as operações de dados em `lib/shopify/carrinho.ts`
  - File: `lib/shopify/carrinho.ts` (novo)
  - `import "server-only"`; `lerCarrinhoPorId`, `criarCarrinhoCom`, `adicionarLinhas`, `atualizarLinhas`, `removerLinhas`, `definirCupons`
  - **Toda** chamada usa `storefrontFetch(..., { semCache: true })`
  - Retornar `ResultadoCarrinho` (carrinho + `aviso` derivado de `warnings`)
  - **`criarCarrinhoCom` devolve `{ id, resultado }` internamente** — a action precisa do `id` do `cartCreate` para gravar o cookie, mas o `id` **não** entra no tipo `Carrinho`. Só o `ResultadoCarrinho` cruza a fronteira
  - Sem versão de API hardcoded — vem de `storefrontFetch`
  - Purpose: única camada que fala GraphQL de carrinho
  - _Leverage: `lib/shopify/client.ts`, `lib/shopify/queriesCarrinho.ts`, `lib/shopify/normalizeCarrinho.ts`_
  - _Requirements: 8.3, 8.4, 10.4_

- [x] 9. Adicionar `buscarVarianteParaCarrinho` em `lib/shopify/carrinho.ts`
  - File: `lib/shopify/carrinho.ts` (continuar da tarefa 8)
  - Buscar produto por handle; escolher a **primeira variante `availableForSale: true`**
  - Nenhuma disponível → sinalizar indisponível (a action vira erro amigável)
  - **Contar variantes** para a salvaguarda; **nunca** usar presença de `options` como proxy (os produtos têm 1 variante mas mantêm a opção `Cor`)
  - Purpose: o servidor resolve a variante — o cliente nunca envia `merchandiseId`
  - _Leverage: `lib/shopify/queries.ts` (tarefa 5), `lib/shopify/client.ts`_
  - _Requirements: 1.6, 1.7, 1.8_

### Bloco 3 — Fronteira cliente/servidor (Server Actions + cookie)

- [ ] 10. Criar os helpers de cookie em `lib/carrinho/cookie.ts`
  - File: `lib/carrinho/cookie.ts` (novo)
  - `import "server-only"`; `lerIdDoCarrinho`, `gravarIdDoCarrinho`, `descartarIdDoCarrinho`
  - **`cookies()` é assíncrono no Next 15/16 — `await cookies()`**
  - Cookie `carrinho_id`: `httpOnly: true`, `secure` em produção, `sameSite: "lax"`, `maxAge` 7 dias, `path: "/"`
  - **Nunca logar o valor do cookie**
  - Comentar o que o `httpOnly` garante (a **persistência**: JS não lê, não forja, não apaga) e o que **não** garante (o sigilo do valor — ele vai no `checkoutUrl`; ver design §Fronteira honesta)
  - Purpose: ID do carrinho ilegível por JS do cliente (Req 2.4)
  - _Leverage: `next/headers` (`cookies()`)_
  - _Requirements: 2.1, 2.4_

- [ ] 11. Criar `lerCarrinho` e `adicionarItem` em `lib/carrinho/acoes.ts`
  - File: `lib/carrinho/acoes.ts` (novo)
  - `"use server"` no topo
  - `lerCarrinho()`: **curto-circuita sem cookie** (retorna `{ carrinho: null }` sem tocar a Shopify — toda visita à Home chama isto)
  - `adicionarItem(handle)`: resolve a variante no servidor → sem cookie: `cartCreate` **com `lines` no input** (1 round-trip) e grava cookie → com cookie: `cartLinesAdd`
  - `cart: null` (expirado/finalizado) → descartar cookie e recriar, **sem erro ao cliente**
  - **Assinatura recebe `handle`, nunca `merchandiseId`** (o cliente não escolhe variante)
  - Purpose: a fronteira — cliente dispara, servidor executa com o token
  - _Leverage: `lib/shopify/carrinho.ts`, `lib/carrinho/cookie.ts`_
  - _Requirements: 1.1, 1.2, 1.3, 2.2, 2.3, 2.6, 8.2_

- [ ] 12. Adicionar `atualizarQuantidade` e `removerLinha` em `lib/carrinho/acoes.ts`
  - File: `lib/carrinho/acoes.ts` (continuar da tarefa 11)
  - `atualizarQuantidade(lineId, quantidade)`; quantidade 0 → remover a linha
  - `removerLinha(lineId)`
  - Sem cookie → `{ carrinho: null }` (nada a atualizar), sem erro
  - Purpose: edição do carrinho pelo drawer
  - _Leverage: `lib/shopify/carrinho.ts`, `lib/carrinho/cookie.ts`_
  - _Requirements: 3.4, 3.5, 3.6_

- [ ] 13. Adicionar `aplicarCupom` e `removerCupom` em `lib/carrinho/acoes.ts`
  - File: `lib/carrinho/acoes.ts` (continuar da tarefa 12)
  - A mutation **substitui** a lista: aplicar → enviar `[...atuais, novo]`; remover → enviar a lista sem ele (vazia → `[]`, **nunca `null`**)
  - **Purga:** se o código voltar `applicable: false`, reenviar a lista sem ele para o carrinho não ficar sujo, e devolver o aviso "Cupom inválido"
  - **⚠️ O `aviso` devolvido pela purga é o da PRIMEIRA resposta, não o da segunda.** A purga faz 2 mutations e a segunda devolve `aviso: null` — propagar o último resultado (o caminho óbvio) **apaga o "Cupom inválido" antes de ele aparecer** e quebra o Req 5.4 em silêncio. A segunda resposta contribui só com o `carrinho` limpo
  - Nenhuma regra/lista de cupom no código — só repasse (Req 5.6)
  - Purpose: cupom validado pela Shopify, sem carrinho sujo
  - _Leverage: `lib/shopify/carrinho.ts`, `lib/carrinho/cookie.ts`_
  - _Requirements: 5.2, 5.3, 5.4, 5.5, 5.6_

- [ ] 14. Adicionar tratamento de erro nas actions em `lib/carrinho/acoes.ts`
  - File: `lib/carrinho/acoes.ts` (continuar da tarefa 13)
  - Envolver as chamadas: falha de rede/Shopify/env → `{ carrinho: null, erro: "<amigável>" }`
  - **Nenhuma mensagem interpola token ou endpoint** (Req 8.5)
  - Purpose: Shopify fora não derruba o site nem vaza credencial
  - _Leverage: `lib/shopify/client.ts` (padrão de erro sem token)_
  - _Requirements: 1.9, 3.11, 8.5, 8.6_

### Bloco 4 — Componentes de cliente

- [ ] 15. Criar `CarrinhoProvider` em `components/loja/CarrinhoProvider.tsx`
  - File: `components/loja/CarrinhoProvider.tsx` (novo)
  - `"use client"`; contexto com `{ carrinho, aviso, erro, carregando, aberto, abrir, fechar, adicionar, alterarQuantidade, remover, aplicarCupom, removerCupom }`
  - **Fila serial**: encadear as chamadas numa `Promise` — o Next serializa o dispatch, mas `runRemainingActions()` roda **antes** do `resolve/reject`, então a ordem do **nosso** estado precisa ser garantida aqui
  - `useEffect` no mount → `lerCarrinho()`. **Não receber dados de carrinho do servidor por props** (é o que mantém a Home estática)
  - Importar tipos com `import type` (nunca valor de `lib/shopify/`)
  - **⚠️ Listener de `pageshow` → se `event.persisted`, re-chamar `lerCarrinho()`** (Req 2.5). O `useEffect` de mount **NÃO** cobre a volta do checkout: voltar é tipicamente **Back**, e o **bfcache** restaura a página sem re-executar efeitos — exatamente o cenário do carrinho fantasma (Req 2.6). *A versão anterior deste design afirmava que o mount bastava; estava errada.*
  - **Política do `aviso`/`erro`:** substituídos **apenas quando o usuário inicia nova ação**. Nenhuma ação interna (ex.: a 2ª mutation da purga de cupom) limpa um aviso ainda não lido
  - Purpose: estado único do carrinho, sem tornar página alguma dinâmica
  - _Leverage: `lib/carrinho/acoes.ts`, `lib/shopify/types.ts` (`import type`)_
  - _Requirements: 2.5, 2.6, 3.10, 4.4, 4.5, 5.4_

- [ ] 16. Criar `IconeCarrinho` em `components/loja/IconeCarrinho.tsx`
  - File: `components/loja/IconeCarrinho.tsx` (novo)
  - `"use client"`; `ShoppingCart` (lucide) + badge com `totalItens`; clique → `abrir()`
  - **Sem badge** quando vazio **ou** quando `carrinho` é `null` (que é também o estado de falha/sem-env — mesmo visual, sem erro)
  - **Fora do provider → renderizar `null`** (a Navbar precisa continuar montável isolada)
  - Purpose: entrada do carrinho em toda navbar, sem quebrar página sem provider
  - _Leverage: `components/loja/CarrinhoProvider.tsx`, `lucide-react`_
  - _Requirements: 4.1, 4.2, 4.3, 4.7_

- [ ] 17. Criar `CarrinhoLinha` em `components/loja/CarrinhoLinha.tsx`
  - File: `components/loja/CarrinhoLinha.tsx` (novo)
  - `"use client"`; foto (`<img>` do CDN), título, `precoUnitario`, **a quantidade atual**, `−`/`+`, lixeira (`Trash2`)
  - `−` em quantidade 1 → remover; `+` desabilita ao atingir `estoqueMaximo` conhecido
  - Linha `disponivel: false` → marcação visual (Req 3.13)
  - Rótulos acessíveis nos botões (`aria-label`)
  - Purpose: edição por item
  - _Leverage: `components/loja/CarrinhoProvider.tsx`, `lucide-react`, `lib/shopify/types.ts` (`import type`)_
  - _Requirements: 3.3, 3.4, 3.5, 3.6, 3.13_

- [ ] 18. Criar `CupomForm` em `components/loja/CupomForm.tsx`
  - File: `components/loja/CupomForm.tsx` (novo)
  - `"use client"`; `Input` + botão aplicar; cupons aplicados via `HighlightBadge` (variante `suave`)
  - **O botão de remover é elemento IRMÃO do badge** — `HighlightBadge` não aceita `children`, só renderiza `text`
  - Rejeição → mensagem do `aviso`, totais intactos
  - Purpose: cupom no drawer, validado pela Shopify
  - _Leverage: `components/ui/Input.tsx`, `components/ui/HighlightBadge.tsx`, `components/loja/CarrinhoProvider.tsx`_
  - _Requirements: 5.1, 5.3, 5.4, 5.5_

- [ ] 19. Criar `SeloPagamento` em `components/loja/SeloPagamento.tsx`
  - File: `components/loja/SeloPagamento.tsx` (novo)
  - `Lock` (lucide) + "Pagamento seguro via Mercado Pago", cores via `--cor-*`
  - Copy **informativa** — não sugerir que o pagamento ocorre no site
  - Purpose: sinal de confiança no rodapé do drawer
  - _Leverage: `lucide-react`_
  - _Requirements: 6.1, 6.3, 6.4_

- [ ] 20a. Criar a casca do `CarrinhoDrawer` em `components/loja/CarrinhoDrawer.tsx`
  - File: `components/loja/CarrinhoDrawer.tsx` (novo)
  - `"use client"`; painel deslizante da direita (Framer Motion), overlay clicável, botão `X`
  - Fecha por `X`, clique no overlay e `Esc`; foco preso enquanto aberto; `role="dialog"` + `aria-modal`
  - **`MotionConfig reducedMotion="user"` PRÓPRIO** — o do `PreviewContent` não alcança o root layout (verificado por grep: existe só em `PreviewContent.tsx:112`)
  - **`paletaWrapperStyle(paleta)` no container** — sem isso o drawer sai dourado (`#D4A017`, fábrica) num site laranja (`#ff8903`)
  - **A `paleta` vem por PROP, resolvida no `app/layout.tsx` (Server Component)** — o drawer **não** importa `layouts/_home.json` direto: sendo `"use client"`, isso jogaria os 9 KB do JSON da Home no bundle de **toda** rota, inclusive `/catalogo`. A paleta são 9 strings serializáveis
  - Nesta tarefa o corpo pode ficar vazio (preenchido em 20b) — o objetivo é a casca correta
  - Purpose: painel acessível, no tema do site e respeitando reduced-motion
  - _Leverage: `components/loja/StoreShell.tsx` (padrão de paleta, linhas 18-19), `lib/paleta.ts`, `components/loja/CarrinhoProvider.tsx`, `lucide-react`_
  - _Requirements: 3.1, 3.2, 3.9, 6.3_

- [ ] 20b. Renderizar itens, cupom e estado vazio no `CarrinhoDrawer`
  - File: `components/loja/CarrinhoDrawer.tsx` (continuar de 20a)
  - **Renderizar `<CarrinhoLinha>` para cada `carrinho.linhas`** (é o que compõe as tarefas 17/18 no drawer — sem isto o drawer não tem itens)
  - **Renderizar `<CupomForm />`**
  - Carrinho vazio (`carrinho` nulo ou sem linhas) → "Seu carrinho está vazio", **sem** botão de checkout
  - Exibir `aviso`/`erro` do contexto quando existirem
  - Purpose: o conteúdo do drawer — itens e cupom
  - _Leverage: `components/loja/CarrinhoLinha.tsx`, `components/loja/CupomForm.tsx`, `components/loja/CarrinhoProvider.tsx`_
  - _Requirements: 3.3, 3.8, 3.11, 5.1_

- [ ] 20c. Adicionar o rodapé do `CarrinhoDrawer` (totais, selo, checkout)
  - File: `components/loja/CarrinhoDrawer.tsx` (continuar de 20b)
  - Subtotal e total via `PriceTag` (valores já formatados pela Shopify — **não calcular**)
  - `<SeloPagamento />`
  - `CtaButton href={carrinho.checkoutUrl}` — **link direto**, nunca URL montada, e o site **não** coleta pagamento
  - `checkoutUrl` ausente → não renderizar o link, mostrar erro amigável
  - Alguma linha `disponivel: false` → alertar antes de prosseguir ao checkout
  - Purpose: fechar a compra levando ao checkout da Shopify
  - _Leverage: `components/ui/PriceTag.tsx`, `components/ui/CtaButton.tsx`, `components/loja/SeloPagamento.tsx`_
  - _Requirements: 3.7, 7.1, 7.2, 7.3, 7.4, 7.5, 7.6_

- [ ] 21. Criar `BotaoAdicionar` em `components/loja/BotaoAdicionar.tsx`
  - File: `components/loja/BotaoAdicionar.tsx` (novo)
  - `"use client"`; recebe `handle` por prop
  - **Chamar `abrir()` do contexto ANTES do `await adicionar(handle)`** — a NFR exige drawer em <100ms, sem esperar a rede; o drawer mostra carregando e reconcilia quando a resposta chega. *Não é estado local do botão: o drawer é montado no root layout, então só o `abrir()` do provider o abre.*
  - Carregando → desabilita (sem clique duplo)
  - Reaproveitar o estilo do placeholder atual (`tokens.radius.btn`, `--cor-destaque`) — **copiar o estilo agora**: a tarefa 24 apaga o arquivo de origem
  - Purpose: o gesto de compra
  - _Leverage: `components/loja/AddToCartPlaceholder.tsx` (estilo — deletado na tarefa 24), `lib/tokens.ts`, `components/loja/CarrinhoProvider.tsx`_
  - _Requirements: 1.1, 1.10_

### Bloco 5 — Integração

- [ ] 22. Montar `CarrinhoProvider` + `CarrinhoDrawer` em `app/layout.tsx`
  - File: `app/layout.tsx` (modificar)
  - Envolver `{children}` com o provider; montar o drawer **uma vez**
  - Resolver a paleta aqui (server) — `globalSettings.paleta ?? getPaleta(estilo)` de `_home.json` — e passá-la ao drawer **por prop** (tarefa 20a)
  - **Não** ler `cookies()`/`headers()` nem chamar action no servidor aqui — isso tornaria a Home dinâmica
  - Purpose: carrinho disponível em todas as rotas, Home ainda estática
  - _Leverage: `components/loja/CarrinhoProvider.tsx`, `components/loja/CarrinhoDrawer.tsx`, `lib/estilos.ts`, `layouts/_home.json`_
  - _Requirements: 4.5, 9.2_

- [ ] 22b. **Verificar imediatamente que a Home continua `○ (Static)`** (o risco silencioso da 22)
  - File: nenhum (verificação) — roda **logo após a 22**, não no fim do plano
  - `npm run build` e conferir na saída: **`/` e `/sobre-nos` com `○ (Static)`**; `/catalogo` e `/produtos/[handle]` com ISR 300s
  - **Falha da verificação = `/` ou `/sobre-nos` aparecerem como `ƒ` (Dynamic).** Se isso acontecer, algo em `app/layout.tsx` ou no `CarrinhoProvider` está lendo `cookies()`/`headers()` no servidor — corrigir **antes** de seguir
  - **Por que aqui:** este é o modo de falha mais traiçoeiro da spec — não gera erro, não quebra o build, não aparece na tela. **Só some o `○` da saída do build.** Descobrir na tarefa 29, 7 tarefas depois, é caro
  - **⚠️ Escopo — não é invariante permanente:** o que se verifica é que **o carrinho** não mudou o regime de renderização da Home. A frente futura do **`ProductGrid` da Home por tag** VAI mover a Home de SSG para **ISR de propósito** — decisão consciente daquela spec, não violação desta. Regra: carrinho mexendo no regime da Home = bug; `ProductGrid` por tag mexendo = a feature (ver `tech.md` → "Home estática: o que é regra e o que NÃO é")
  - Purpose: pegar o vazamento de dinamismo no ponto onde ele nasce
  - _Leverage: `app/layout.tsx`, `app/page.tsx`_
  - _Requirements: 4.5, 9.2_

- [ ] 23. Adicionar `IconeCarrinho` na `components/sections/Navbar/Navbar.tsx`
  - File: `components/sections/Navbar/Navbar.tsx` (modificar)
  - Inserir no container de ações — o `div` com `marginLeft: "auto"` (`Navbar.tsx:183`) —, **sem prop nova obrigatória**
  - **Puramente aditivo:** preservar `NavbarProps` (`{ type?, accentColor?, content?, [key: string]: unknown }`), o contrato do `PreviewContent` e todos os links do JSON (`content.link1..6` + `linkCount`, inclusive "Catálogo" → `/catalogo`). Nenhum JSON precisa migrar (Req 9.4)
  - **⚠️ O ícone fica FORA do gate `!isMobile`.** No mobile a Navbar esconde o CTA e mostra só o hambúrguer (`Navbar.tsx:184–211`); se o ícone entrar dentro de `!isMobile && ctaVisible`, **o carrinho fica inacessível no celular** — Req 3.2 e 4.1 quebram **só no mobile** e o build não pega. Sempre visível, em qualquer viewport
  - **Não-regressão:** a Navbar é renderizada por **dois** caminhos — `PreviewContent` (Home, Sobre Nós) e `StoreShell` (`/catalogo`, `/produtos/[handle]`). Ambos estão sob o provider do root layout, e a guarda "fora do provider → `null`" (tarefa 16) mantém a Navbar montável isolada
  - Purpose: contador visível em todo o site sem migrar JSON
  - _Leverage: `components/loja/IconeCarrinho.tsx`, `components/sections/Navbar/Navbar.tsx`, `components/loja/StoreShell.tsx`_
  - _Requirements: 3.2, 4.1, 4.6, 9.1, 9.4, 9.5_

- [ ] 24. Trocar o placeholder por `BotaoAdicionar` e **remover** o arquivo antigo
  - Files: `app/produtos/[handle]/page.tsx` (modificar), `components/loja/AddToCartPlaceholder.tsx` (**deletar**)
  - Passar o `handle` da rota ao `BotaoAdicionar`
  - Conferir que nenhum import órfão do placeholder restou
  - Purpose: o botão inerte vira real; sem código morto
  - _Leverage: `app/produtos/[handle]/page.tsx`_
  - _Requirements: 1.1_

### Bloco 6 — Salvaguarda e documentação

- [ ] 25. Criar `scripts/verificar-variantes.mjs` e o script npm
  - Files: `scripts/verificar-variantes.mjs` (novo), `package.json` (modificar)
  - Consultar os produtos (paginando — não parar no primeiro lote) e **falhar (exit ≠ 0) se algum tiver > 1 variante**, nomeando os handles
  - **Contar variantes**, nunca `options` (hoje os produtos têm 1 variante e mantêm a opção `Cor` — checar `options` daria falso positivo imediato)
  - Script npm: `"verificar:variantes": "node --env-file=.env.local scripts/verificar-variantes.mjs"`
  - **⚠️ Não dá para reusar `lib/shopify/`** (achado da auditoria): é TypeScript e tem `import "server-only"` — um `.mjs` em Node puro não importa nem uma coisa nem outra, e não enxerga `.env.local` sozinho (quem carrega é o Next; daí o `--env-file`). O script **duplica** o fetch, a leitura de env e o default da versão
  - **Ler `SHOPIFY_STOREFRONT_API_VERSION` da env com o mesmo default (`2026-01`) e comentar a duplicação** — é a exceção declarada do Req 10.4, não uma violação por descuido
  - **NÃO acoplar ao `npm run build`** — o Req 8.6 exige build sem `.env.local`, e este check precisa de token
  - Purpose: a premissa "sem variantes" para a esteira se cair, em vez de vender a cor errada em silêncio
  - _Leverage: `.env.example` (nomes das envs), `lib/shopify/queries.ts` (forma da query — copiada, não importada)_
  - _Requirements: 1.8, 8.6, 10.4_

> **Tarefas 26–27b: JÁ EXECUTADAS na passada de auditoria.** As correções de
> steering foram aplicadas antes do Bloco 1 de propósito — o steering é lido por
> toda spec futura, e uma delas (`tech.md:54–59`) vetava esta arquitetura. Ficam
> registradas como concluídas para o histórico da spec.

- [x] 26. Corrigir `.claude/steering/tech.md` — build, cache, MotionConfig e paleta
  - File: `.claude/steering/tech.md` (reescrito)
  - **MotionConfig (era o escopo original):** *"envolve todo o site"* → **falso**, provado por grep. Corrigido: envolve o `PreviewContent` (Home, Sobre Nós); **root layout e `StoreShell` NÃO** — componentes fora dele precisam do próprio
  - **Modelo de build:** a tabela dizia "Build (atual): **Static export**" enquanto a nota 27 linhas abaixo dizia o contrário. Corrigido para Runtime SSR/ISR; seção reescrita no passado; "sem código de servidor, sem Route Handlers" movido para "Histórico" com a nota de que **caiu**
  - **Cache:** documentado que o ISR vem do `export const revalidate` das rotas e que o `next: { revalidate }` do `client.ts` é inerte; proibição explícita de `fetchCache = "default-cache"` / `force-cache`
  - **Paleta:** documentada a armadilha dos dois únicos wrappers (componente no root layout herda fábrica)
  - **Home estática:** nova seção separando mudança **acidental** (bug) de **deliberada** (feature), com o `ProductGrid` por tag registrado como mudança futura planejada
  - **Stack:** adicionada a linha da Shopify Storefront API 2026-01; Segurança do token e DoD atualizados
  - _Leverage: `next.config.ts`, `components/preview/PreviewContent.tsx`, `app/catalogo/page.tsx`, `lib/shopify/client.ts`_
  - _Requirements: 11.1, 11.2, 11.3, 11.4, 11.12_

- [x] 27. Atualizar `.claude/steering/product.md` — o site vende direto
  - File: `.claude/steering/product.md` (reescrito)
  - "Problema que resolve" / "Usuários": não "canaliza tráfego" nem "checkout nos marketplaces" — o site **vende direto** (Shopify + Mercado Pago), **sem** afirmar que os marketplaces deixaram de ser canal
  - **Nova seção "Como os dois canais se relacionam (RESOLVIDO)"** — ver Parte C abaixo
  - Removidas as afirmações de site estático (l.26–27, l.36); "Estado atual" agora lista `/catalogo` e `/produtos/[handle]`; URLs de marketplace marcadas como registradas (estavam "a registrar depois")
  - Linha 61 (`prefers-reduced-motion`) corrigida **incondicionalmente** — já era imprecisa
  - Adicionados: catálogo vem da Shopify (não de JSON), premissa "sem variantes", Shopify como fonte da verdade comercial
  - _Leverage: `layouts/_home.json`, `layouts/sobre-nos.json`, `next.config.ts`_
  - _Requirements: 11.5, 11.6, 11.7, 11.8, 11.9_

- [x] 27b. Atualizar `.claude/steering/structure.md` — a árvore não conhecia a loja
  - File: `.claude/steering/structure.md` (reescrito)
  - Árvore: adicionados `app/catalogo/`, `app/produtos/[handle]/`, `lib/shopify/*` (com o papel de cada arquivo), `components/loja/`, `.env.example`, e o regime de cada rota
  - **Novo §"Rota da loja"** — o §"Rota (page.tsx)" descrevia como universal um padrão que não vale para a loja
  - **Novo §"Fronteira cliente/servidor (loja)"** — `server-only`, `import type`, por que `types.ts` fica de fora
  - Contrato de props: registrado que `Navbar`/`Footer` são compartilhados entre `PreviewContent` e `StoreShell`, e que mudanças devem ser **aditivas**
  - Tabela "Onde as coisas moram": +5 linhas (query, dados, UI da loja, chrome, janela de ISR)
  - *Motivo: o `tasks.md` desta spec declarava conformidade com uma convenção (`lib/shopify/`, `components/loja/`) que o `structure.md` **não documentava**.*
  - _Leverage: árvore real do projeto_
  - _Requirements: 11.10, 11.11_

- [ ] 27c. Documentar `verificar:variantes` no `README.md`
  - File: `README.md` (modificar)
  - Adicionar o comando, o que ele prova (premissa "catálogo sem variantes") e quando rodar (**antes de publicar mudanças de catálogo**)
  - Registrar que ele **não** está no `npm run build` de propósito — o Req 8.6 exige build sem `.env.local`
  - *Lacuna achada na auditoria: o design dizia "documentado no README" e nenhuma tarefa tocava o README — e o precedente citado (`catalogo-loja` Req 4.7) atualizou o README.*
  - Purpose: uma salvaguarda que ninguém sabe que existe não é salvaguarda
  - _Leverage: `README.md`, `scripts/verificar-variantes.mjs` (tarefa 25)_
  - _Requirements: 1.8_

### Bloco 7 — Verificação (DoD: build + manual)

- [ ] 28. Revalidar TODAS as operações do carrinho via Dev MCP contra 2026-01
  - File: nenhum (verificação) — usar `lib/shopify/queriesCarrinho.ts` e `queries.ts` como fonte
  - Extrair as queries/mutations **como ficaram no código** e validar com `mcp__shopify-dev-mcp__validate_graphql_codeblocks` (`api: storefront-graphql`, `version: 2026-01`)
  - Conferir: `warnings` em toda mutation; `$discountCodes: [String!]!`; nenhum campo depreciado; `... on ProductVariant`; **`product(handle:)` e não `productByHandle`** (que gera aviso de depreciação)
  - **Tratar aviso de depreciação como falha**, não só erro de schema — `productByHandle` valida com `⚠️ INFORM`, não com `❌`
  - Purpose: DoD do Req 10 — o schema, não a memória, é a fonte da verdade
  - _Requirements: 10.1, 10.2, 10.3, 10.5, 10.6_

- [ ] 29. Verificar build (com e SEM `.env.local`), tipos, salvaguarda e não-vazamento
  - File: nenhum (verificação)
  - `npx tsc --noEmit` limpo; `npm run build` limpo
  - `npm run build` **sem `.env.local`** deve passar (fazer backup e restaurar; conferir checksum)
  - Buscar token, domínio e `SHOPIFY_STOREFRONT_TOKEN` em `.next/static` → **0 ocorrências**
  - Conferir na saída do build: `/` e `/sobre-nos` seguem `○ (Static)`; `/catalogo` e `/produtos/[handle]` seguem com ISR 5 min *(re-check do que a 22b já provou; escopo em Req 9.2 — não é invariante permanente)*
  - **`npm run verificar:variantes` → exit 0.** Sem este item o Req 1.8 fica insatisfeito: a salvaguarda existe (tarefa 25) mas nenhuma tarefa a executava — uma checagem que ninguém roda não bloqueia nada, e vira "o log que ninguém lê" que o próprio requisito proíbe
  - `grep` no projeto por `fetchCache` e `force-cache` → **0 ocorrências** (Req 8.4a)
  - Purpose: DoD — build limpo, token não vaza, regime das rotas intacto, salvaguarda de fato executada
  - _Requirements: 1.8, 8.1, 8.4a, 8.6, 9.1, 9.2, 9.3_

- [ ] 30. 🧑 **PORTÃO HUMANO** — verificação manual dos fluxos do drawer (`npm run dev`)
  - File: nenhum (verificação). **Não é tarefa de agente:** exige credenciais reais e olho humano
  - Adicionar produto → drawer abre; contador = 1
  - Adicionar o **mesmo** produto → **1 linha, quantidade 2** (a Shopify mescla)
  - `+` até o teto → quantidade limitada **com aviso visível** (o bug silencioso mais provável)
  - `−` até 0 → linha some; vazio **sem** botão de checkout
  - Cupom inválido → "Cupom inválido" **fica visível**, totais intactos, cupom **não** listado. *Este é o teste da armadilha da purga (tarefa 13): se o aviso piscar e sumir, a 2ª mutation está sobrescrevendo o `aviso` da 1ª*
  - Navegar entre páginas → carrinho persiste; aba anônima → carrinho vazio
  - **Em viewport MOBILE:** o ícone do carrinho aparece e abre o drawer. *Se ele sumir no mobile, ficou dentro do gate `!isMobile` (tarefa 23) — o build não pega isso*
  - **Drawer nas cores do site (laranja `#ff8903`), não dourado** — falha visível se a paleta faltar
  - **`prefers-reduced-motion` ativo → drawer sem animação**
  - Purpose: DoD — aceitação dos comportamentos que só aparecem em runtime
  - _Requirements: 1.4, 1.5, 3.2, 3.8, 3.12, 4.1, 5.4, 6.3_

- [ ] 31. 🧑 **PORTÃO HUMANO** — persistência, degradação e checkout real
  - File: nenhum (verificação). **Não é tarefa de agente:** o último item exige uma **compra real**
  - Fechar e reabrir o navegador → carrinho persiste (cookie 7 dias)
  - DevTools → `document.cookie` **não** mostra `carrinho_id` (prova de `httpOnly`, Req 2.4). *Escopo: isso prova que a **persistência** é ilegível por JS — **não** que o ID é secreto. O ID está no `checkoutUrl`, no DOM (`<a href>`), por design. Ver design §Fronteira honesta*
  - **Voltar do checkout com o botão Back do navegador** (não só recarregando) → o carrinho é revalidado. *Testa o `pageshow`/bfcache da tarefa 15: se o carrinho fantasma aparecer só no Back e não no reload, o listener não está funcionando*
  - Renomear `.env.local` temporariamente → site sobe, navbar **sem contador e sem erro**; Home e Sobre Nós intactas (restaurar depois)
  - "Finalizar compra" → chega ao checkout da Shopify com Mercado Pago
  - **Concluir uma compra e voltar ao site → confirmar a limitação do carrinho fantasma** (Req 2.6): o carrinho deve aparecer vazio. Este é o único item da spec que **não pôde ser verificado** durante o planejamento
  - Purpose: DoD — persistência, tolerância a falha e a única incógnita declarada da spec
  - _Requirements: 2.1, 2.4, 2.6, 4.7, 7.2, 8.6_

## Auditoria do plano — FEITA (resultado incorporado)

O plano passou por auditoria adversarial antes da execução (como em
`catalogo-loja`). O que ela mudou:

**Achados CRÍTICOS (dois — ambos "garantia declarada que não existe"):**

1. **A premissa de cache era falsa.** O `next: { revalidate }` do `client.ts:54`
   é **inerte** (Next 15+ não cacheia `fetch` por default; `storefrontFetch` faz
   POST sem `force-cache`). O ISR do catálogo vem do `export const revalidate`
   das rotas. → Corrigidos Req 8.4 + Introdução §4 + design + tarefa 1; **novo
   Req 8.4a** proibindo `fetchCache`/`force-cache`; tarefa 2 ampliada.
2. **"O ID do carrinho nunca chega ao cliente" era falso** — provado ao vivo: o
   `checkoutUrl` contém o token e a `key` do carrinho, e o design entrega o
   `checkoutUrl` ao cliente de propósito. A NFR de Security era **insatisfazível
   junto com o Req 7.2**. → Reescritas a NFR e a §Data Models com a fronteira
   honesta; alternativa (`redirect()` server-side) registrada e **não** adotada.

**Riscos que a auditoria confirmou como bem tratados:** ordem dos blocos
(fronteira antes dos clientes), `warnings` em toda mutation, `$discountCodes:
[String!]!` (re-testado adversarialmente — o schema **rejeita** o nulável), a
não-regressão aditiva da Navbar, e a análise de que o provider no root layout
**não** torna a Home dinâmica.

**Riscos vivos — onde o executor deve prestar atenção:**

1. **Tarefa 22 → 22b (Home estática)** — o modo de falha mais traiçoeiro: não
   gera erro, não quebra o build, não aparece na tela; **só some o `○`**. Por
   isso a verificação foi movida para **imediatamente após** a 22. *Escopo: prova
   que o **carrinho** não mudou o regime — o `ProductGrid` por tag mudará a Home
   para ISR de propósito, no futuro (Req 9.2).*
2. **Tarefa 23 (Navbar)** — compartilhada com a Home. Aditiva ✓, mas o ícone
   **não pode** cair dentro do gate `!isMobile`, senão o carrinho some no celular
   e o build não pega.
3. **Tarefa 20a/20b (drawer)** — três armadilhas: `MotionConfig` próprio, wrapper
   de paleta e a paleta vindo **por prop** (não importando `_home.json` no
   cliente).
4. **Tarefa 13 (purga do cupom)** — a 2ª mutation devolve `aviso: null` e apaga o
   "Cupom inválido" se o último resultado for propagado. Bug silencioso.
5. **Tarefa 15 (bfcache)** — o `useEffect` de mount **não** roda na volta do
   checkout via Back. Sem o `pageshow`, o Req 2.5 não é cumprido.
6. **Tarefas 6–9 vs. aritmética local** — qualquer `reduce`/divisão de dinheiro
   contraria a regra "o servidor é a fonte da verdade".
7. **Tarefa 1 vs. o "conserto" errado** — quem notar que o `revalidate` não faz
   nada pode adicionar `force-cache`. Isso **cachearia o carrinho**.
