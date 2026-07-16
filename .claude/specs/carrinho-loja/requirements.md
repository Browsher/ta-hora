# Requirements Document

## Introduction

Carrinho de compras e checkout headless para a loja **Ta Hora** (câmeras de
segurança e acessórios), conectado à **Shopify Cart API** (Storefront API
GraphQL, versão **2026-01**).

Esta spec transforma o botão placeholder inerte `AddToCartPlaceholder`
(entregue pela spec `catalogo-loja`, Req 3.5) em funcionalidade real: adicionar
ao carrinho, revisar/editar itens num drawer lateral, aplicar cupom e ser
redirecionado ao **checkout hospedado da Shopify** (com Mercado Pago como
gateway). O site nunca processa pagamento.

É o passo que fecha o funil: hoje o catálogo mostra produtos, mas não vende.

### Verificações feitas contra a loja REAL antes desta spec

Estes fatos foram apurados ao vivo (Storefront API 2026-01, token de
`.env.local`) e não são suposições:

1. **Escrita liberada:** `cartCreate`, `cartLinesAdd`, `cartLinesUpdate` e
   `cartLinesRemove` reais executaram com sucesso com o token atual, devolvendo
   `id` + `checkoutUrl`. Os scopes atuais **bastam** — não é preciso token novo.
2. **Premissa "sem variantes" CONFIRMADA na loja (re-verificado após a limpeza
   do usuário):** cada produto publicado tem **exatamente 1 variante**, ambas
   disponíveis e com estoque 999:
   - `camera-seguranca-mini-copia` → 1 variante (`Cor: White`)
   - `camera-lampada-copia` → 1 variante (`Cor: Preto`)

   *(Antes da limpeza os dois tinham 3 variantes de cor — Preto/Gray/White. O
   usuário removeu as variações; a premissa da spec agora vale de fato.)*

   **⚠️ Detalhe que importa para o design:** a opção **`Cor` continua existindo**,
   com **um único valor** em cada produto. Os produtos NÃO ficaram sem `options`.
   Portanto a salvaguarda (Req 1.8) SHALL contar **variantes**, nunca a presença
   de `options` — checar `options` daria falso positivo hoje mesmo. Para detectar
   a condição ">1 variante" é preciso buscar ao menos 2 variantes na query.

   A spec segue sem seletor de variante, e a **salvaguarda dos Req 1.7 e 1.8**
   permanece como seguro: hoje ela passa silenciosamente; se variantes voltarem
   ao catálogo, ela bloqueia em vez de vender a cor errada.
3. **Lacuna de dados:** o tipo `Product` e a `PRODUCT_BY_HANDLE_QUERY` atuais
   **não trazem variante alguma** — não existe `merchandiseId` hoje. Adicionar
   é pré-requisito do Req 1.
4. **Cache — a premissa anterior desta spec era FALSA (corrigido na auditoria):**
   o `storefrontFetch` passa `next: { revalidate: opts?.revalidate ?? 300 }`
   (`client.ts:54`), mas **isso é inerte hoje**. A partir do Next 15 (o projeto
   roda **16.2.9**) o `fetch` **não é mais cacheado por default**; a doc oficial é
   explícita: *"Caching is opt-in. Set `cache: 'force-cache'` to cache any
   request, including `POST` and requests that send `authorization` or `cookie`
   headers."* Como `storefrontFetch` faz **POST** e nunca passa `force-cache`,
   **nada ali é cacheado**. O ISR do catálogo vem exclusivamente de
   `export const revalidate = 300` em `app/catalogo/page.tsx:8` e
   `app/produtos/[handle]/page.tsx:13`.

   Consequências: (a) a versão anterior dizia que `client.ts:54` era um "default
   sobrescrevível" que cacheava — **errado**; (b) o risco de regredir o catálogo
   ao mexer no `client.ts` é bem menor do que se supunha, pois o parâmetro é
   inerte; (c) o risco REAL é o inverso — se alguém "consertar" o `revalidate`
   com `force-cache` ou `export const fetchCache = "default-cache"`, o carrinho
   **passa a ser cacheado**. Ver Req 8.4.
5. **Re-adição MESCLA (verificado):** adicionar o mesmo `merchandiseId` duas
   vezes resulta em **1 linha com `quantity: 2`** — a Shopify não duplica linha.
   Fixa o Req 1.4.
6. **⚠️ Limite de estoque é SILENCIOSO (verificado):** um `cartLinesUpdate`
   pedindo `quantity: 9999` retornou `userErrors: []` (nenhum erro), limitou a
   quantidade e reportou **apenas** em `warnings`:
   `MERCHANDISE_NOT_ENOUGH_STOCK` — *"Only 50 items were added to your cart due
   to availability."* Uma implementação que só cheque `userErrors` exibirá
   "sucesso" enquanto o cliente clica + e o número trava sem explicação. Fixa os
   Req 1.5, 3.12 e 10.5.
7. **Não existe campo de "carrinho finalizado":** a lista de campos do `Cart` na
   2026-01 não tem flag de conclusão. A detecção viável é o `cart` retornar
   `null` — ver Req 2.3.
8. **Depreciação por TIPO, não por nome (verificado):** `Cart.discountAllocations`
   é depreciado, mas **`BaseCartLine.discountAllocations` NÃO é** — é campo vivo
   e é o que mostra o efeito do cupom por linha (Req 5.3). Já
   `estimatedCost` é depreciado nos **dois** níveis (`Cart` e `BaseCartLine`).
   Ver Req 10.3.
9. **⚠️ O `checkoutUrl` CONTÉM o ID do carrinho (verificado ao vivo na auditoria):**
   um `cartCreate` real devolveu (valores mascarados):

   ```
   cart.id     = gid://shopify/Cart/hWNEY0…<24 ch>?key=76124a…<32 ch>
   checkoutUrl = https://ta-hora.myshopify.com/cart/c/hWNEY0…<24 ch>?key=76124a…<32 ch>&_s=…
   ```

   O token e a `key` do carrinho aparecem **inteiros** no `checkoutUrl` — o
   `cart.id` é reconstruível a partir dele. Como o Req 7.2 exige levar o cliente
   ao `checkoutUrl`, **o ID do carrinho necessariamente chega ao navegador**.
   Isso invalida a formulação anterior da NFR de Security ("o ID do carrinho não
   pode ser legível por JavaScript do cliente"), que era **insatisfazível junto
   com o Req 7.2**. Ver a NFR de Security corrigida e o Req 2.4 (que fala do
   **mecanismo de persistência** — esse sim, `httpOnly`, e continua válido).

### Limitação conhecida (declarada, não resolvida)

**Carrinho fantasma pós-checkout:** não é possível, sem concluir uma compra real,
verificar se o ID persistido continua retornando carrinho depois do checkout
concluído. O Req 2.6 exige a mitigação (descartar o ID no retorno do checkout); a
confirmação do comportamento real fica para a verificação manual da
implementação.

## Alignment with Product Vision

- **Objetivo #1 do `product.md`** ("Loja headless — catálogo, carrinho e
  checkout com dados da Shopify"): esta spec entrega o **carrinho e o checkout**,
  os dois itens que faltavam do objetivo.
- **Modelo de build (`tech.md`)**: o carrinho é exatamente o caso que exige
  runtime (Server Actions / Route Handlers). A migração para runtime já foi feita
  em `catalogo-loja`; esta spec a consome.
- **Presença própria fora dos marketplaces**: com carrinho e checkout próprios, a
  marca passa a vender direto — o motivo de existir da loja headless. Os
  marketplaces seguem como canal, e sua reputação aparece no Sobre Nós como prova
  social **a favor** da venda direta (ver a nota "conflito de CTAs: RESOLVIDO").
- **Compatibilidade retroativa**: as páginas dirigidas por JSON (Home, Sobre Nós)
  não podem regredir (Req 9).

## Requirements

### Requirement 1 — Adicionar ao carrinho

**User Story:** Como cliente vendo um produto, quero adicionar ao carrinho com
um clique, para iniciar a compra sem sair da página.

#### Acceptance Criteria

1. WHEN o cliente clica "Adicionar ao carrinho" na página do produto THEN o
   sistema SHALL adicionar 1 unidade da variante do produto ao carrinho da
   Shopify e abrir o drawer com o item visível.
2. IF ainda não existe carrinho na sessão THEN o sistema SHALL criar o carrinho
   com o item já incluso em **um único round-trip** à Shopify.
3. IF já existe carrinho na sessão THEN o sistema SHALL adicionar o item ao
   carrinho existente.
4. WHEN o mesmo produto é adicionado novamente THEN o drawer SHALL exibir **uma
   única linha com a quantidade somada** (ex.: adicionar duas vezes → 1 linha,
   quantidade 2). *Comportamento verificado ao vivo: a Shopify mescla linhas do
   mesmo `merchandiseId`.*
5. **(Estoque no caminho de adição — comportamento verificado)** IF a Shopify
   limitar a quantidade resultante e retornar `MERCHANDISE_NOT_ENOUGH_STOCK`
   THEN o sistema SHALL informar ao cliente que a quantidade foi limitada por
   disponibilidade. *Como a re-adição MESCLA (AC 4), clicar "Adicionar" várias
   vezes empurra a quantidade até o teto — e a Shopify limita com `userErrors`
   VAZIO, sinalizando só em `warnings`. O caminho de adição precisa deste
   tratamento tanto quanto o − / + do drawer (Req 3.12).*
6. IF a variante a ser adicionada estiver indisponível (`availableForSale:
   false`) THEN o sistema SHALL informar o cliente e SHALL NOT adicionar o item.
7. **(Salvaguarda — premissa "sem variantes")** IF um produto tiver **mais de
   uma variante** THEN o sistema SHALL adicionar a **primeira variante
   disponível** na ordem em que a Shopify retorna `variants` (ordem definida na
   loja), e SHALL NOT bloquear a compra de um produto que tenha alguma variante
   comprável. *Substitui a regra ingênua "sempre a primeira": se a primeira
   estiver esgotada e a segunda disponível, vender a segunda é o comportamento
   correto. Caminho hoje inativo (todo produto tem 1 variante) — é seguro contra
   regressão do catálogo, não o fluxo principal.*
8. **(Visibilidade da salvaguarda)** IF um produto tiver **mais de uma variante**
   THEN o sistema SHALL emitir um sinal **que bloqueie a verificação de
   qualidade** (falha de build ou de check dedicado), e SHALL NOT depender de log
   de runtime. THE condição SHALL ser avaliada pela **contagem de variantes**, e
   SHALL NOT usar a presença de `options` como proxy. *Razão: a premissa
   "catálogo sem variantes" é decisão de produto e pode deixar de valer sem
   aviso; se voltar variante, isso precisa parar a esteira, não virar log que
   ninguém lê. E a checagem por `options` daria falso positivo AGORA: os produtos
   têm 1 variante mas mantêm a opção `Cor` com um valor. A forma de renderizar o
   sinal é design; a classe do sinal (bloqueante) é requisito.*
9. WHEN a adição falha (rede/Shopify) THEN o sistema SHALL exibir mensagem de
   erro amigável e SHALL manter o carrinho anterior intacto.
10. WHILE a adição está em andamento THE sistema SHALL indicar carregamento e
    SHALL impedir cliques duplicados.

### Requirement 2 — Persistência do carrinho

**User Story:** Como cliente, quero que meus itens continuem no carrinho ao
navegar e ao voltar depois, para não perder a seleção.

#### Acceptance Criteria

1. WHEN um carrinho é criado THEN o sistema SHALL persistir o ID do carrinho por
   uma janela de **pelo menos 7 dias**, sobrevivendo à navegação entre páginas e
   ao fechamento do navegador.
2. WHEN o cliente retorna com carrinho persistido THEN o sistema SHALL recarregar
   o carrinho pela Shopify (query `cart`) e SHALL exibir os itens e totais atuais
   — **preço e disponibilidade vindos da Shopify, nunca de cópia local**.
3. IF a Shopify retorna `cart: null` para o ID persistido (inexistente, expirado
   **ou já finalizado em checkout**) THEN o sistema SHALL descartar o ID, tratar
   como carrinho vazio e SHALL NOT exibir erro. *A 2026-01 não expõe flag de
   "carrinho finalizado" (verificado); `cart: null` é o único sinal disponível.*
4. WHERE o ID do carrinho é persistido, **o mecanismo de persistência** SHALL ser
   legível pelo servidor (que detém o token) e SHALL NOT ser legível por
   JavaScript do cliente (cookie `httpOnly`). *Escopo exato, corrigido na
   auditoria: este AC é sobre o **mecanismo**, não sobre o sigilo do **valor** do
   ID — o valor chega ao navegador de qualquer forma, dentro do `checkoutUrl`
   (fato verificado 9). O que o `httpOnly` garante é que a persistência não pode
   ser lida, forjada ou apagada por JS, e que o servidor é a fonte da verdade de
   qual carrinho é o da sessão.*
5. WHEN o cliente é enviado ao checkout (Req 7.2) THEN o sistema SHALL, no
   retorno dele ao site, revalidar o carrinho contra a Shopify antes de exibi-lo
   — SHALL NOT assumir que o carrinho pré-checkout continua válido.
6. **(Mitigação do carrinho fantasma)** IF o carrinho persistido corresponder a
   um checkout já concluído THEN o sistema SHALL descartar o ID e apresentar
   carrinho vazio. *A 2026-01 não expõe flag de conclusão (verificado), então a
   detecção depende do sinal disponível (`cart: null`, Req 2.3). Ver "Limitação
   conhecida" na Introdução.*

### Requirement 3 — Drawer do carrinho

**User Story:** Como cliente, quero revisar e ajustar meu carrinho num painel
lateral, sem perder a navegação.

#### Acceptance Criteria

1. WHEN um item é adicionado THEN o drawer SHALL deslizar da direita.
2. WHEN o cliente clica no ícone do carrinho na navbar THEN o drawer SHALL abrir
   com o conteúdo atual.
3. WHILE o drawer está aberto THE sistema SHALL exibir, por item: foto, nome,
   preço, a quantidade, os controles **− / +** e um controle de remoção
   (lixeira).
4. WHEN o cliente usa − / + THEN o sistema SHALL atualizar a quantidade e SHALL
   reexibir os totais retornados pela Shopify.
5. IF a quantidade chega a 0 via − THEN o sistema SHALL remover a linha.
6. WHEN o cliente clica na lixeira THEN o sistema SHALL remover a linha.
7. WHILE o drawer está aberto THE sistema SHALL exibir **subtotal** e **total**.
8. IF o carrinho está vazio THEN o drawer SHALL exibir "Seu carrinho está vazio"
   e SHALL NOT exibir o botão de finalizar compra.
9. WHEN o cliente clica no X, na área externa (overlay), ou pressiona `Esc` THEN
   o drawer SHALL fechar.
10. WHILE uma operação está em andamento THE drawer SHALL indicar carregamento e
    SHALL serializar as operações **do mesmo carrinho** (não apenas da mesma
    linha), evitando mutations concorrentes no mesmo `cartId`.
11. IF uma operação falha THEN o drawer SHALL exibir erro e SHALL reexibir o
    estado real do carrinho (sem divergir da Shopify).
12. **(Estoque — comportamento verificado)** IF a Shopify limitar a quantidade
    solicitada e retornar o aviso `MERCHANDISE_NOT_ENOUGH_STOCK` THEN o drawer
    SHALL exibir a quantidade efetivamente aplicada E SHALL informar ao cliente
    que a quantidade foi limitada por disponibilidade. *A Shopify limita com
    `userErrors` VAZIO, sinalizando só em `warnings` — sem este AC, o cliente
    clica + e o número trava sem explicação.*
13. IF um item no carrinho ficar indisponível após ter sido adicionado THEN o
    drawer SHALL sinalizar essa linha ao cliente (ver Req 7.6).

### Requirement 4 — Contador de itens na navbar

**User Story:** Como cliente, quero ver quantos itens tenho no carrinho, para
saber meu estado de compra em qualquer página.

#### Acceptance Criteria

1. WHERE a navbar é exibida, o sistema SHALL apresentar um ícone de carrinho.
2. WHEN o carrinho tem itens THEN o contador SHALL exibir o `totalQuantity`
   retornado pela Shopify.
3. WHEN o carrinho está vazio THEN o sistema SHALL NOT exibir contador (sem "0").
4. WHEN qualquer operação altera o carrinho **na aba atual** THEN o contador
   SHALL refletir o novo valor sem exigir recarga da página. *Sincronizar entre
   abas está fora do escopo.*
5. **(Resolve a tensão com o Req 9.2)** THE contador SHALL ser obtido **após a
   montagem no cliente**, e o HTML pré-renderizado SHALL conter a navbar **sem
   contador**. *Motivo: ler o ID do carrinho no servidor dentro de `app/page.tsx`
   tornaria a rota dinâmica e quebraria a pré-renderização estática da Home e do
   Sobre Nós (Req 9.2). O contador é estado por-visitante e não pode fazer parte
   do HTML estático.*
6. IF a navbar é compartilhada com páginas fora da loja THEN a introdução do
   ícone SHALL NOT quebrar o layout, o contrato de props dirigido por JSON, nem
   os links existentes dessas páginas (ver Req 9).
7. **(Falha do contador — resolve a tensão com o Req 8.6)** IF a busca do
   contador falhar, ou as variáveis de ambiente da Shopify estiverem ausentes,
   THEN a navbar SHALL renderizar o ícone **sem contador e sem erro visível**,
   exatamente como no carrinho vazio (AC 3). *Motivo: depois do AC 5, TODA página
   com navbar — inclusive a Home estática — dispara uma chamada de carrinho. Essa
   chamada não pode transformar uma falha da Shopify em erro na Home.*

### Requirement 5 — Cupom de desconto

**User Story:** Como cliente com cupom, quero aplicá-lo no carrinho, para ver o
desconto antes de finalizar.

#### Acceptance Criteria

1. WHERE o drawer é exibido, o sistema SHALL oferecer um campo para código de
   cupom.
2. WHEN o cliente envia um código THEN o sistema SHALL enviá-lo à Shopify
   (`cartDiscountCodesUpdate`) — a **Shopify valida**, o site não.
3. IF a Shopify aceita o código THEN o sistema SHALL exibir o cupom como aplicado
   e SHALL reexibir os totais atualizados.
4. IF a Shopify rejeita o código (`applicable: false`) THEN o sistema SHALL
   informar que o cupom é inválido e SHALL manter os totais anteriores.
5. WHEN um cupom aplicado é removido THEN o sistema SHALL atualizar o carrinho e
   os totais.
6. THE sistema SHALL NOT manter lista, regra ou validação de cupons no código —
   cupons são geridos exclusivamente na Shopify.

### Requirement 6 — Selo de confiança

**User Story:** Como cliente, quero ver que o pagamento é seguro, para confiar em
concluir a compra.

#### Acceptance Criteria

1. WHERE o rodapé do drawer é exibido, o sistema SHALL apresentar o texto
   "Pagamento seguro via Mercado Pago" acompanhado de um ícone de cadeado.
2. **CONFIRMADO:** a afirmação "via Mercado Pago" é verdadeira — o usuário
   verificou em Configurações → Pagamentos que o **Mercado Pago é o único meio
   de pagamento ativo** no checkout da loja. IF outro gateway for adicionado à
   loja THEN o selo SHALL ser revisto, pois passaria a afirmar algo incompleto ao
   cliente. *Não é verificável pela Storefront API; a confirmação é do operador
   da loja e vale para a configuração atual.*
3. THE selo SHALL usar as cores da paleta via as CSS custom properties `--cor-*`
   do site, e SHALL NOT introduzir cor fixa fora da paleta.
4. THE selo SHALL ser informativo e SHALL NOT sugerir que o pagamento ocorre no
   site (ele ocorre no checkout da Shopify).
5. WHERE a copy do selo é fixa no código (o drawer não é uma seção dirigida por
   JSON), isso SHALL ser uma exceção consciente ao princípio "mudar conteúdo =
   editar JSON" do `product.md`.

### Requirement 7 — Finalizar compra

**User Story:** Como cliente, quero ir ao checkout, para pagar e concluir o
pedido.

#### Acceptance Criteria

1. WHERE o carrinho tem itens, o drawer SHALL exibir o botão "Finalizar compra".
2. WHEN o cliente clica em "Finalizar compra" THEN o sistema SHALL redirecionar
   para o `checkoutUrl` **retornado pela Shopify para aquele carrinho**.
3. THE sistema SHALL NOT construir, adivinhar ou montar a URL de checkout — ela
   vem sempre da resposta da API.
4. THE sistema SHALL NOT coletar dados de pagamento nem processar pagamento —
   isso é responsabilidade do checkout hospedado da Shopify (Mercado Pago como
   gateway).
5. IF o `checkoutUrl` estiver ausente THEN o sistema SHALL exibir erro amigável e
   SHALL NOT redirecionar.
6. IF alguma linha do carrinho estiver indisponível THEN o sistema SHALL alertar
   o cliente antes de prosseguir ao checkout, e SHALL NOT apresentar "Finalizar
   compra" como caminho normal sem sinalização. *Sem isto, o cliente vai ao
   checkout e descobre lá que um item esgotou.*

### Requirement 8 — Fronteira cliente/servidor e sigilo do token

**User Story:** Como dono da loja, quero que o token da Storefront API nunca
chegue ao navegador, para não expor credencial da loja.

#### Acceptance Criteria

1. THE token SHALL ser lido apenas no servidor e SHALL NOT aparecer no bundle do
   cliente, sob nenhuma rota — verificável por busca no `.next/static` após o
   build (mesmo critério provado em `catalogo-loja`).
2. WHERE o drawer é um componente de cliente, ele SHALL disparar as operações e o
   **servidor** SHALL executá-las com o token.
3. THE módulos que tocam o token SHALL manter `import "server-only"`, e os
   componentes de cliente SHALL importar apenas **tipos** (`import type`) da
   camada de dados.
4. **THE operações de carrinho SHALL NOT ser cacheadas** — cada operação lê e
   escreve dados frescos, e o carrinho de um visitante SHALL NOT poder ser
   servido a outro. THE `StorefrontFetchOptions` SHALL passar a expressar "sem
   cache" (`cache: "no-store"`), e a combinação com `revalidate` SHALL ser
   impossível de compilar. *Nota factual (ver Introdução §4): hoje o `fetch` do
   Next **já não cacheia por default**, então o `no-store` é redundante na
   prática — ele é **defesa declarada**, para que a intenção fique no tipo e no
   código, e não dependa de um default do framework poder mudar.*
4a. **THE projeto SHALL NOT usar `export const fetchCache = "default-cache"` nem
   `cache: "force-cache"` em qualquer chamada de carrinho.** *É o único caminho
   conhecido para o carrinho de um visitante ser servido a outro: a doc do Next
   diz que `force-cache` cacheia inclusive POST e requests com `cookie`.*
5. THE mensagens de erro SHALL NOT interpolar o token nem o endpoint com
   credencial.
6. IF as variáveis de ambiente da Shopify estiverem ausentes THEN o build SHALL
   continuar passando (mesmo critério do catálogo), E em runtime as páginas sem
   carrinho SHALL continuar funcionando enquanto as operações de carrinho SHALL
   falhar com mensagem amigável, sem quebrar a página.

### Requirement 9 — Não-regressão

**User Story:** Como dono do site, quero que nada que já funciona quebre, para
não perder o que foi construído.

#### Acceptance Criteria

1. WHEN o carrinho é introduzido THEN Home (`/`), Sobre Nós (`/sobre-nos`),
   `/catalogo` e `/produtos/[handle]` SHALL continuar funcionando.
2. **THE carrinho SHALL NOT alterar o modo de renderização da Home nem do Sobre
   Nós** — as duas SHALL continuar `○ (Static)` na saída do build **depois desta
   spec**, como hoje.

   > **Escopo — isto é uma não-regressão DESTA spec, não um invariante
   > permanente do projeto.** O que o AC proíbe é o carrinho tornar a Home
   > dinâmica **por acidente** (o modo silencioso: algo em `app/layout.tsx` ou no
   > `CarrinhoProvider` lendo `cookies()`/`headers()` no servidor — a Home vira
   > `ƒ` sem erro nenhum, só some o `○` da saída do build). É por isso que o
   > contador é obtido após a montagem no cliente (Req 4.5).
   >
   > **Uma frente futura VAI mudar a Home para ISR de propósito:** o
   > `ProductGrid` da Home por tag (produtos em destaque vindos da Shopify) tira
   > a Home de SSG puro e a coloca em ISR (`revalidate`). Isso é **esperado e
   > planejado** — decisão consciente daquela spec, não violação desta. Se o `○`
   > da Home sumir **junto com a implementação do carrinho**, é bug; se sumir
   > junto com o `ProductGrid` por tag, é a mudança pretendida.
3. THE `npm run build` SHALL passar sem erros de TypeScript, e `npx tsc --noEmit`
   SHALL ficar limpo (Definition of Done do `tech.md`).
4. THE conteúdo dirigido por JSON (`layouts/*.json`) SHALL continuar válido sem
   migração manual.
5. THE alteração da navbar para o ícone do carrinho SHALL preservar os links
   existentes vindos do JSON (incluindo "Catálogo" → `/catalogo`) e o contrato de
   props usado pelo `PreviewContent`.

### Requirement 10 — Definition of Done técnico das operações GraphQL

**User Story:** Como desenvolvedor, quero as operações GraphQL validadas contra o
schema 2026-01, para não descobrir campo inválido em produção.

> Este requisito é um **checklist de DoD** (critérios de conclusão), não um
> comportamento de produto — está aqui para ser verificável, não implementável.

#### Acceptance Criteria

1. THE todas as queries/mutations do carrinho SHALL ser validadas contra o schema
   **2026-01** via Dev MCP (`validate_graphql_codeblocks`) antes de a spec ser
   considerada concluída.
2. THE operações SHALL usar `subtotalAmount` e `totalAmount` do `CartCost` e
   SHALL NOT usar os depreciados `totalDutyAmount`, `totalTaxAmount`,
   `totalDutyAmountEstimated`, `totalTaxAmountEstimated`.
3. THE operações SHALL NOT usar `Cart.estimatedCost`, `Cart.discountAllocations`
   nem `BaseCartLine.estimatedCost` — todos depreciados na 2026-01. **A proibição
   NÃO se estende a `BaseCartLine.discountAllocations`**, que é campo vivo e é
   como se exibe o efeito do cupom por linha (Req 5.3). *A depreciação aqui é por
   TIPO, não por nome de campo: o mesmo nome é depreciado no `Cart` e válido na
   linha. Verificado no schema via Dev MCP.*
4. THE versão da API SHALL vir da configuração existente
   (`SHOPIFY_STOREFRONT_API_VERSION`, default `2026-01`) e SHALL NOT ser
   hardcoded numa nova camada. IF a env apontar para outra versão THEN a garantia
   do AC 1 valerá apenas para a versão validada — a validação SHALL ser refeita
   ao mudar de versão. **Exceção declarada:** o script
   `scripts/verificar-variantes.mjs` roda **fora do Next** (Node puro, sem
   `lib/shopify/`, que é TS + `server-only`), então ele necessariamente duplica a
   leitura de env e o default da versão. SHALL ler `SHOPIFY_STOREFRONT_API_VERSION`
   com o mesmo default e SHALL comentar a duplicação no arquivo.
5. **THE toda mutation de carrinho SHALL selecionar `warnings`** além de
   `userErrors`. *Verificado ao vivo: o limite de estoque chega com `userErrors`
   vazio e aparece SÓ em `warnings` — sem isso, o sistema fica cego para
   limitação silenciosa de quantidade (Req 1.5, 3.12).*
6. **THE operações SHALL usar `product(handle:)`, e SHALL NOT usar
   `productByHandle`** — depreciado na 2026-01 ("Use `product` instead",
   confirmado no Dev MCP). *Está aqui porque é o campo que a memória escreve por
   reflexo ao ler "produto por handle"; o `queries.ts` atual já usa a forma
   correta.*
7. **THE `quantityAvailable` SHALL ser tratado como opcional.** Ele só vem
   preenchido se o app tiver o scope `unauthenticated_read_product_inventory`
   (hoje tem — ver `.env.example`); sem ele vem `null`. `estoqueMaximo: null` →
   o `+` não desabilita e o `aviso` de `warnings` cobre o limite (Req 3.12).

### Requirement 11 — Atualização da documentação de direção

**User Story:** Como mantenedor, quero o steering refletindo a realidade do
produto, para que decisões futuras não partam de premissa vencida.

#### Acceptance Criteria

> **Escopo ampliado pela auditoria.** A versão anterior deste requisito escopava
> duas frases (marketplace no `product.md`, MotionConfig no `tech.md`). A
> auditoria varreu os três arquivos contra o código e achou **muito mais** — a
> pior delas capaz de matar esta spec inteira. Os ACs abaixo cobrem tudo.
> *Precedente: `catalogo-loja` (Req 4.7) exigiu atualizar README e `tech.md`
> quando o modelo de build mudou.*

1. **THE `tech.md` SHALL parar de descrever o projeto como static export.** Era
   **falso e auto-contraditório**: a tabela (l.8) dizia "Build (atual): **Static
   export** — `output: "export"` → gera `out/`" enquanto a nota 27 linhas abaixo,
   no mesmo arquivo, dizia que fora removido. `next.config.ts` não tem
   `output: "export"` desde `catalogo-loja`. Idem l.38–41 ("Roda como static
   export"), l.48–50 ("ao implementar a loja, **remover** `output: export`" —
   escrito no futuro, já feito) e l.54–59.
   *⚠️ A l.54–59 era a afirmação mais perigosa do steering: **"Export estático:
   sem código de servidor, sem Route Handlers … Vale para Home/Sobre Nós hoje"**.
   Quem acreditasse nela concluiria que Server Actions estão proibidas — ou seja,
   que **esta spec é impossível**. É o mesmo mecanismo do MotionConfig, com
   consequência maior.*
2. **THE `tech.md` SHALL registrar de onde vem o ISR de verdade** — do
   `export const revalidate` das rotas, **não** do `next: { revalidate }` do
   `storefrontFetch`, que é inerte (Introdução §4) — e SHALL proibir
   `fetchCache = "default-cache"` / `force-cache` (Req 8.4a).
3. **THE `tech.md` SHALL ser corrigido onde afirma que o `MotionConfig
   reducedMotion="user"` "envolve todo o site"** (l.87) — **falso, provado por
   grep**: existe só em `components/preview/PreviewContent.tsx`, cobrindo Home e
   Sobre Nós, mas **não** o root layout nem o `StoreShell`. *Este AC existe
   porque a frase induziu um erro real: o design desta spec chegou a afirmar que
   "o MotionConfig global já cobre o drawer", o que teria entregue um drawer sem
   `prefers-reduced-motion`. Documentação falsa produz defeito.*
4. **THE `tech.md` SHALL registrar a armadilha equivalente da paleta:** só
   existem dois wrappers `paletaWrapperStyle` (`PreviewContent`, `StoreShell`);
   componente montado no root layout herda a paleta de **fábrica**. *Mesma classe
   de defeito, descoberta pelo design (drawer dourado num site laranja).*
5. **THE `product.md` SHALL registrar que o site VENDE DIRETO** — "Problema que
   resolve" e "Usuários" diziam que ele "canaliza tráfego para os canais de
   venda" e que os clientes "vão para o checkout nos marketplaces", o que esta
   spec invalida ao dar checkout próprio à marca.
6. THE atualização SHALL NOT afirmar que os marketplaces deixaram de existir como
   canal — eles continuam, e sua reputação aparece no **Sobre Nós** como prova
   social a favor da venda direta (ver a nota "conflito de CTAs: RESOLVIDO").
7. **THE `product.md` SHALL parar de descrever o site como estático** — l.26–27
   ("hospedável em qualquer lugar") e l.36 ("publica o site **estático**") eram
   falsas desde `catalogo-loja`. *Risco concreto: induzir alguém a re-adicionar
   `output: "export"`, o que quebraria catálogo **e** carrinho.*
8. **THE `product.md` "Estado atual" SHALL listar as rotas da loja** —
   `/catalogo` e `/produtos/[handle]` existem e faltavam; e o objetivo #1 listava
   o catálogo como futuro, sendo que já está em produção. Idem l.20–21 ("URLs dos
   marketplaces: *a registrar depois*"), sendo que já estão registradas em
   `sobre-nos.json` (`marketplace1Href`).
9. **THE `product.md` l.61 SHALL ser corrigida** (`prefers-reduced-motion`):
   mesma imprecisão do AC 3, **incondicionalmente** — a frase já é imprecisa
   hoje, não "caso fique".
10. **THE `structure.md` SHALL refletir a árvore real**: faltavam
    `app/catalogo/`, `app/produtos/[handle]/`, `lib/shopify/` e
    `components/loja/`, todos existentes; e a tabela "Onde as coisas moram" não
    tinha linha para dados da Shopify. *O `tasks.md` desta spec declarava
    conformidade com uma convenção (`lib/shopify/`, `components/loja/`) que o
    `structure.md` **não documentava**.*
11. **THE `structure.md` SHALL documentar o padrão de rota da loja** — a §"Rota
    (page.tsx)" descrevia como universal ("Server Component minimalista: importa
    o JSON do layout") um padrão que não vale para `/catalogo` nem
    `/produtos/[handle]` (fetch da Shopify, `revalidate`, try/catch).
12. **THE steering SHALL registrar que "Home é `○ Static`" NÃO é invariante
    permanente** — é não-regressão **desta** spec (Req 9.2). A frente futura do
    `ProductGrid` da Home por tag moverá a Home para ISR **de propósito**; a
    documentação SHALL deixar isso explícito para que aquela spec não leia a
    verificação como proibição.

## Non-Functional Requirements

### Performance

- As operações de carrinho não podem ser cacheadas (Req 8.4), mas devem evitar
  round-trips desnecessários: criar carrinho + primeiro item em **uma única
  mutation** (`cartCreate` com `lines` no input — Req 1.2), nunca `cartCreate`
  seguido de `cartLinesAdd`.
- O drawer abre em **menos de 100ms** (estado local, sem esperar a rede); o
  conteúdo reconcilia com a resposta do servidor quando ela chega.
- **Uma operação de carrinho custa no máximo UMA mutation**, e nenhuma releitura
  extra para obter o estado resultante (as mutations já retornam o `cart`
  atualizado). O indicador de carregamento cobre a espera (Req 1.10, 3.10).
  *Corrigido na auditoria: a formulação anterior dizia "um único **round-trip** à
  Shopify" para toda operação, o que era **impossível** — `adicionarItem(handle)`
  faz obrigatoriamente 2 chamadas (resolver a variante pelo handle + a mutation),
  consequência direta e desejada da decisão de segurança "o cliente manda
  `handle`, não `merchandiseId`". `alterarQuantidade` e `remover` seguem com 1.*
- **Exceção declarada:** a resolução de variante do `adicionarItem` também não é
  cacheada. É dado de catálogo (seria cacheável), mas cachear traria
  `availableForSale` velho justamente no momento da compra — o custo de 1
  round-trip extra é preferível a vender item esgotado.
- O catálogo (`/catalogo`, `/produtos/[handle]`) mantém o ISR de 300s existente,
  que vem do `export const revalidate` das rotas (ver Introdução §4) — o carrinho
  não pode forçar essas páginas a dinâmico sem necessidade.
- **Custo aceito e declarado:** depois do Req 4.5, **toda** página com navbar —
  inclusive a Home estática — dispara um POST de Server Action (`lerCarrinho`) na
  montagem. A Home continua `○ (Static)` no build, mas deixa de ser servida
  puramente do CDN sem tocar o servidor. O curto-circuito sem cookie economiza a
  chamada à **Shopify**, não o round-trip ao próprio servidor.
- Cada linha do drawer deve refletir a resposta da Shopify; sem polling.

### Security

- Token da Storefront API **exclusivamente server-side** (Req 8) — sem
  `NEXT_PUBLIC_`, sem exposição em bundle, log ou mensagem de erro. **Esta é a
  credencial que a spec realmente protege**, e a proteção é estrutural
  (`server-only` + `import type`), verificável no `.next/static` (Req 8.1).
- **O ID do carrinho é uma capability que NECESSARIAMENTE chega ao navegador** —
  ele vai dentro do `checkoutUrl` (fato verificado 9), que o Req 7.2 exige
  entregar ao cliente. Fronteira honesta do que se garante e do que não:
  - **Garantido:** o ID **persistido** vive em cookie `httpOnly` (Req 2.4) — JS
    não lê, não forja e não apaga a sessão de carrinho; o servidor decide qual
    carrinho é o da sessão. O ID nunca é logado. O cliente nunca escolhe
    `merchandiseId`, endpoint, versão de API nem query (Server Actions fechadas).
  - **NÃO garantido:** sigilo do **valor** do ID. Quem lê o DOM (inclusive um
    XSS) obtém o `checkoutUrl` e com ele o carrinho. Isso é inerente ao checkout
    hospedado da Shopify, não uma falha desta implementação — e o carrinho em
    questão é o do próprio visitante.
  - **DECIDIDO (usuário):** fica o **link direto** (`CtaButton href={checkoutUrl}`)
    — o ID visível não é risco real (é o carrinho do próprio visitante; a
    credencial da loja, o token, segue server-only), é o padrão do mercado
    headless e é mais simples. A alternativa (Server Action com `redirect()`
    server-side, tirando a URL do DOM) foi avaliada e **descartada**. Não reabrir
    sem requisito novo. Ver design → "Decisão: link direto".
- Nenhum dado de pagamento trafega ou é armazenado pelo site (Req 7.4).
- O cliente não pode escolher endpoint, versão de API ou query arbitrária: o
  servidor expõe operações fechadas, não um proxy GraphQL genérico.

### Reliability

- Shopify indisponível não pode derrubar o site: erro no carrinho degrada
  graciosamente (mensagem amigável), como já faz `/catalogo` (Req 1.9, 3.11).
- ID de carrinho inválido/expirado se autocorrige para carrinho vazio, sem erro
  ao cliente (Req 2.3).
- O servidor é a fonte da verdade de quantidade, preço e totais — a UI nunca
  calcula totais por conta própria (evita divergir do valor cobrado).
- O build passa sem `.env.local` (Req 8.6).

### Usability

- Idioma **pt-BR** em toda a UI e no código de domínio (padrão do `structure.md`).
- Reúso dos primitivos existentes: `CtaButton`, `PriceTag`, `Input`,
  `HighlightBadge`; paleta/tema e chrome (navbar/footer) preservados.
- Preços exibidos em pt-BR via o `formatMoney()` já existente em `normalize.ts`
  (respeita `currencyCode`).
- Acessibilidade: drawer fechável por `Esc`, foco gerenciado, controles com rótulo
  acessível; respeitar `prefers-reduced-motion` na animação (padrão do projeto:
  `MotionConfig reducedMotion="user"`).
- Estados de carregamento e erro visíveis — nunca falha silenciosa.

## Out of Scope

Explicitamente **fora** desta spec (combinado com o usuário, para depois):

- Acessórios sugeridos (câmera → acessórios por tag).
- Barra de progresso de frete grátis.
- Produtos sugeridos genéricos.
- Seletor de variante (dispensado pela decisão "produtos sem variantes" — mas ver
  as salvaguardas dos Req 1.7 e 1.8, que existem justamente para sinalizar se
  essa premissa deixar de valer).
- Contas de cliente / login (`cartBuyerIdentityUpdate` com token de cliente).
- Cálculo de frete no site (ocorre no checkout da Shopify).
- Sincronização do carrinho entre abas abertas (Req 4.4).

## Nota — "conflito de CTAs": RESOLVIDO, não é conflito

Uma versão anterior desta spec declarava, no Out of Scope, um *"conflito de CTAs
concorrentes (reconhecido, não resolvido): a seção `Marketplaces` **da Home**
continua empurrando o cliente para o Mercado Livre"*. **Essa afirmação era
factualmente falsa** — foi escrita sem verificar os JSONs. Mesma classe de erro
que esta spec corrige no steering, agora contra a própria spec.

Verificado nos layouts:

| Afirmação anterior | Realidade verificada |
|---|---|
| A seção `Marketplaces` está na Home | **Falso.** `Marketplaces` existe **só** em `layouts/sobre-nos.json` (índice 4). `_home.json` tem Navbar, Hero, Features, ProductGrid, HowItWorks, Testimonials, FAQ, CTAFinal, Footer — **nenhum** `Marketplaces` |
| A Home tem destinos concorrentes | **Falso.** Nenhum link de marketplace na Home: todos os hrefs de navbar/footer apontam para `/catalogo` e `/sobre-nos` |

**Os dois canais não competem — cooperam.** A Home é dedicada à venda direta
(`Hero` → `ProductGrid` → `CTAFinal` → `/catalogo`). O `Marketplaces` mora no
Sobre Nós e seu propósito é **prova social / confiança**: mostrar a reputação da
marca. O próprio conteúdo da seção diz isso — `descriptionText`: *"Mais de 10 mil
vendas em marketplaces e agora com site próprio!"*. Ou seja, a reputação do
Mercado Livre **trabalha a favor** da venda direta, dando credibilidade ao site
novo para quem está decidindo se compra aqui.

**Nada a fazer.** Não há decisão de produto pendente, e o Req 9 (preservar Home e
Sobre Nós sem regressão) continua correto e suficiente — nenhuma mudança de
layout é necessária. Registrado também em `product.md` → "Como os dois canais se
relacionam".
