# Implementation Plan — Acessórios Sugeridos (acessorios-sugeridos)

## Task Overview

A ordem é ditada por **um** fato: o carrinho **já vende**, e esta spec toca o
fragmento GraphQL compartilhado pelas **6 operações** dele.

Por isso o plano é **fragmento primeiro, e provado antes de qualquer coisa ser
construída em cima**. Os Blocos 1 e 2 não entregam feature alguma — entregam a
certeza de que o carrinho continua inteiro. Se o risco se materializar, ele
aparece na tarefa 4, com 4 arquivos mexidos, e não no fim, com 12.

Depois: dados por tag → fronteira (action) → estado (provider, onde mora a
armadilha do memo) → UI → salvaguarda e verificação.

**Nada aqui é "integração" no fim.** A tarefa 12 pluga uma linha no drawer; tudo
antes dela é isolado e verificável.

## Steering Document Compliance

- **`structure.md`** — pt-BR no domínio (`acessorios`, `sugestoes`, `gatilho`);
  dados em `lib/shopify/`; componente em `components/loja/` (um arquivo por
  componente); action na fronteira existente (`lib/carrinho/acoes.ts`).
- **`tech.md`** — runtime SSR/ISR já vigente; **DoD = build limpo (com e sem
  `.env.local`) + `tsc --noEmit` limpo + verificação manual**; **sem suíte de
  testes formal**; **proibido `force-cache`/`fetchCache`**; a Home continua `○`.
- **Precedentes herdados:** `verificar-variantes.mjs` (salvaguarda fora do build,
  `process.exitCode`), a tarefa 28 da `carrinho-loja` (revalidação MCP) e o padrão
  "verificação onde o risco nasce" (tarefa 22b).
  *O **extrator** de documentos GraphQL não é herdado — ele **nasce aqui**, na
  tarefa 4a. Uma versão anterior deste cabeçalho o citava como precedente; era
  falso (`scripts/` só tinha `verificar-variantes.mjs`).*

## Atomic Task Requirements

Cada tarefa: **1–3 arquivos**, **15–30 min**, **um resultado testável**, caminhos
de arquivo explícitos.

## Task Format Guidelines

- Checkbox: `- [ ] Número. Descrição`
- **Sempre especificar arquivos**: caminho exato a criar/modificar
- Detalhes de implementação como bullets
- Requisitos como `_Requirements: X.Y_`; reuso como `_Leverage: caminho_`
- Só tarefas de código (as exceções estão marcadas: 🧑 **PORTÃO HUMANO**)
- Evitar termos amplos ("sistema", "integração", "completo") em títulos

## Tasks

### Bloco 1 — O fragmento (o único risco real) e sua prova

- [x] 1. Adicionar `tags` ao fragmento em `lib/shopify/queriesCarrinho.ts`
  - File: `lib/shopify/queriesCarrinho.ts` (modificar — **linha 78**)
  - Trocar `product { title handle }` por `product { title handle tags }`
  - **É só isto.** Nenhum argumento novo, nenhum tipo novo, nenhuma conexão nova
    — um campo escalar num `product` já selecionado. É o que torna o risco
    gerenciável
  - Comentar **por que** `tags` está aqui: é o que permite avaliar o gatilho da
    sugestão **sem rede** (o cliente já recebe a linha)
  - **NÃO tocar em mais nada do fragmento** — ele é compartilhado pela
    `CARRINHO_QUERY` e pelas 5 mutations
  - Purpose: o gatilho de graça; e isolar o risco numa tarefa de uma linha
  - _Leverage: `lib/shopify/queriesCarrinho.ts`_
  - _Requirements: 1.4, 9.5_

- [x] 2. Propagar `tags` nos tipos e na normalização
  - Files: `lib/shopify/types.ts` (modificar), `lib/shopify/normalizeCarrinho.ts` (modificar)
  - `types.ts`: `LinhaCarrinho` ganha `tags: string[]` — documentar que é o que
    permite o gatilho sem rede
  - `normalizeCarrinho.ts` **linha ~36**: `RawVariante.product` ganha `tags: string[]`
  - `normalizeCarrinho.ts` **linha ~138** (`normalizeLinha`): mapear
    `tags: v.product?.tags ?? []` — **seguir o padrão defensivo das linhas
    vizinhas** (`titulo: v.product?.title ?? "Produto"`)
  - Purpose: o cliente passa a saber o que é câmera
  - _Leverage: `lib/shopify/normalizeCarrinho.ts` (padrão de `normalizeLinha`)_
  - _Requirements: 1.4_

- [x] 3. Criar as constantes de tag em `lib/shopify/tags.ts`
  - File: `lib/shopify/tags.ts` (novo)
  - `export const TAG_CAMERA = "camera"` e `export const TAG_ACESSORIO = "acessorio"`
  - **SEM `server-only`** — o servidor usa na query, o cliente no gatilho.
    Precedente: `types.ts` (mesmo motivo)
  - Comentar: minúsculas, sem acento, **como cadastrado na Shopify**; divergência
    de grafia faz a seção sumir **em silêncio**
  - Purpose: uma grafia só; um typo não pode divergir entre cliente e servidor
  - _Leverage: `lib/shopify/types.ts` (precedente de módulo compartilhado)_
  - _Requirements: 1.4, 2.1_

- [x] 4a. Criar `scripts/extrair-graphql.mjs` — montar os documentos como o runtime monta
  - File: `scripts/extrair-graphql.mjs` (novo)
  - Ler `lib/shopify/queriesCarrinho.ts` e `queries.ts`; extrair os template
    literals `/* GraphQL */` e **resolver as DUAS interpolações**:
    `${CAMPOS_DO_CARRINHO}` **e** `${RETORNO_DA_MUTATION}`
  - Emitir JSON com os documentos prontos para colar no Dev MCP; conferir que
    nenhum contém `${` residual e que **toda mutation seleciona `warnings`**
  - Parse do fonte, **não `import`**: os módulos são TS com imports extensionless
    e `server-only` — o Node ESM não os carrega
  - ⚠️ **Esta tarefa existe porque a auditoria pegou uma mentira minha:** o plano
    dizia `_Leverage:_` "o extrator da tarefa 28 da `carrinho-loja`", e o design
    dizia que ela "já tem um extrator pronto". **Não tem.** Aquele extrator viveu
    num scratchpad temporário e nunca entrou no repo (`scripts/` só tem
    `verificar-variantes.mjs`). A tarefa 4 escondia horas de trabalho manual
    dentro de uma linha de reuso fictício
  - Purpose: tornar a revalidação das 6 operações repetível — não um ritual manual
  - _Leverage: `lib/shopify/queriesCarrinho.ts` (estrutura dos literais)_
  - _Requirements: 10.1_

- [x] 4b. 🔴 **PROVAR QUE O CARRINHO NÃO QUEBROU** — revalidar as 6 operações
  - File: nenhum (verificação) — **a tarefa mais importante do plano**
  - Rodar o extrator (4a) e validar as **6** operações com
    `mcp__shopify-dev-mcp__validate_graphql_codeblocks`
    (`api: storefront-graphql`, `version: 2026-01`)
  - **Tratar aviso de depreciação como FALHA**, não só erro de schema (Req 10.2)
  - `npx tsc --noEmit` limpo; `npm run build` limpo
  - **Executar contra a loja real:** criar carrinho, adicionar linha e conferir
    que `merchandise.product.tags` chega **como array** (`Array.isArray`), sem
    `userErrors`
  - ⚠️ **Verificar que é ARRAY, não que vale `["camera"]`.** O conteúdo é dado de
    catálogo: se alguém tirar a tag no admin, uma asserção de conteúdo falharia
    **sem defeito nenhum no código**, e o executor caçaria um bug inexistente no
    fragmento. Quem vigia o conteúdo é o `verificar:tags` (tarefa 14); esta tarefa
    vigia o **fragmento**
  - **Se qualquer uma das 6 falhar, PARAR.** Nada depois disto vale se o carrinho
    quebrou
  - *Referência: na auditoria as 6 operações rodaram ao vivo com este fragmento —
    todas ok, `userErrors: []`, `tags` correta em todas. O executor deve
    reproduzir, não confiar nisto*
  - Purpose: o risco do fragmento morre aqui, com 4 arquivos mexidos — não no fim
  - _Leverage: `scripts/extrair-graphql.mjs` (tarefa 4a)_
  - _Requirements: 9.1, 9.5, 9.6, 10.1, 10.2, 10.4_

### Bloco 2 — Não-regressão do carrinho em produção

- [ ] 5. 🧑 **PORTÃO HUMANO** — o carrinho ainda vende? (`npm run dev`)
  - File: nenhum (verificação). **Não é tarefa de agente:** exige olho humano
  - Adicionar produto → drawer abre, contador = 1
  - Adicionar o mesmo → 1 linha, quantidade 2
  - `+` até o teto → aviso "Ajustamos a quantidade ao estoque disponível."
  - Cupom `TESTE10` → aplica; **subtotal − desconto = total** fecha
  - `−` até 0 → linha some; vazio **sem** botão de checkout
  - Contador persiste entre páginas; "Finalizar compra" chega ao checkout
  - Conferir na saída do build: `/` e `/sobre-nos` seguem **`○ (Static)`**
  - Purpose: o fragmento mexeu nas 6 operações — provar **em runtime**, não só no
    schema, antes de construir a feature em cima
  - _Requirements: 9.1, 9.2, 9.3, 9.4_

### Bloco 3 — Dados por tag (`server-only`)

> 🛑 **NÃO INICIAR ESTE BLOCO antes de as tarefas 4b e 5 terem PASSADO.**
>
> Tudo daqui para baixo é construído **em cima** do carrinho. Se o fragmento o
> quebrou, cada tarefa a partir daqui só aumenta a pilha de arquivos entre você e
> o defeito.
>
> *Isto é uma trava, não uma sugestão de ordem. A auditoria pegou o furo: nas
> specs anteriores os portões humanos eram as tarefas finais, então chegar neles
> era natural. Aqui o portão está no MEIO — quem rodar as tarefas 6–19 em lote, ou
> um agente varrendo a lista, passaria reto pela 5 (a única sem artefato), e a
> promessa "impossível empilhar 12 arquivos sobre um carrinho quebrado" viraria
> só honra.*

- [x] 6. Adicionar `ACESSORIOS_QUERY` em `lib/shopify/queries.ts`
  - **🛑 PRÉ-REQUISITO: as tarefas 4b (6 operações revalidadas) e 5 (portão
    humano: o carrinho ainda vende) precisam ter PASSADO.** Se não passaram, pare
    aqui — o problema é no fragmento, e ele não fica mais fácil de achar com mais
    7 arquivos por cima
  - File: `lib/shopify/queries.ts` (modificar)
  - `query Acessorios($query: String!, $first: Int!)` com
    `products(first: $first, query: $query)` → `nodes { id handle title
    availableForSale featuredImage {...} priceRange { minVariantPrice {...} } }`
  - **Seleção = `RawProductCard` + `availableForSale`** — para
    `normalizeProductCard` funcionar sem adaptador
  - **`availableForSale` NÃO entra na string de busca** — filtro em JS (tarefa 7).
    *`tag:x AND available_for_sale:true` é aceito, mas não é verificável: com 2
    disponíveis e 0 esgotados, "filtra" e "não filtra" dão o mesmo resultado*
  - NÃO alterar `PRODUCTS_QUERY`, `PRODUCT_BY_HANDLE_QUERY` nem
    `PRODUTO_PARA_CARRINHO_QUERY`
  - Purpose: a busca por tag, validada
  - _Leverage: `lib/shopify/queries.ts` (padrão dos documentos)_
  - _Requirements: 2.1, 2.5, 2.6_

- [x] 7. Criar `lib/shopify/acessorios.ts` (`server-only`)
  - File: `lib/shopify/acessorios.ts` (novo)
  - `import "server-only"`; `buscarAcessoriosPorTag(): Promise<ProductCard[]>`
  - Monta `query: \`tag:${TAG_ACESSORIO}\`` **no servidor** — o cliente nunca
    escolhe a busca
  - **`first: 250`** (máximo da API), **sem paginar** — teto declarado (Req 2.6)
  - **Filtrar `availableForSale === false` ANTES de normalizar** (Req 2.4)
  - `storefrontFetch(..., { semCache: true })` — **nunca** `force-cache`
  - Reusar `normalizeProductCard`
  - Purpose: única camada que fala GraphQL de acessórios
  - _Leverage: `lib/shopify/client.ts`, `lib/shopify/normalize.ts` (`normalizeProductCard`), `lib/shopify/tags.ts`_
  - _Requirements: 2.1, 2.2, 2.4, 2.5, 2.6, 8.1, 8.5_

- [x] 8. Validar `ACESSORIOS_QUERY` no Dev MCP e executá-la na loja
  - File: nenhum (verificação)
  - Validar contra 2026-01 — **aviso de depreciação conta como falha**
  - **Executar de fato:** `tag:acessorio` deve devolver **2** produtos
    (`camera-seguranca-q8`, `camera-seguranca-s8`), ambos disponíveis
  - *Validar no schema **não** é prova de funcionamento — foi por isto que a spec
    passou a fase 1 inteira sem saber se `tag:` funcionava (Req 10.4)*
  - Purpose: DoD do Req 10 — schema **e** loja
  - _Requirements: 10.1, 10.2, 10.4_

### Bloco 4 — Fronteira (Server Action)

- [x] 9. Adicionar `buscarAcessorios()` em `lib/carrinho/acoes.ts`
  - File: `lib/carrinho/acoes.ts` (modificar)
  - `"use server"` já está no topo; **sem argumentos** — o cliente não escolhe
    tag, query, endpoint nem versão (Req 8.3)
  - **NUNCA lança:** `try/catch` → `[]`. Um extra comercial não pode derrubar a
    compra (Req 6.2)
  - **Sem `console.error(e)`** — a mensagem de `storefrontFetch` contém o endpoint
  - **Não lê cookie e não toca o carrinho** — é leitura de catálogo; mora aqui
    porque **esta é a fronteira do cliente**
  - Purpose: o cliente dispara, o servidor executa com o token
  - _Leverage: `lib/shopify/acessorios.ts`, `lib/carrinho/acoes.ts` (padrão de erro sem token)_
  - _Requirements: 6.2, 8.1, 8.3, 8.4_

### Bloco 5 — Estado (onde mora a armadilha)

- [ ] 10. Adicionar `acessorios` e a busca 1x em `components/loja/CarrinhoProvider.tsx`
  - File: `components/loja/CarrinhoProvider.tsx` (modificar)
  - Estado `acessorios: ProductCard[]` + `buscou` (`useRef`)
  - `temCamera` = `(carrinho?.linhas ?? []).some(l => l.tags.includes(TAG_CAMERA))`
    — **`carrinho` é `Carrinho | null`**
  - Efeito: `if (temCamera && !buscou.current) { buscou.current = true; buscarAcessorios().then(setAcessorios) }`
  - **`buscou.current = true` SÍNCRONO, antes do `await`** — se virasse só após
    sucesso, uma Shopify degradada + carrinho conversador refariam a busca a cada
    mudança, justo quando ela está mal. Consequência aceita: falha não é repetida
    até a próxima carga
  - **Dependências do `useEffect`: `[temCamera]`** — é o que torna "1x por carga"
    real. Com `[carrinho]` o efeito reavaliaria a cada mudança (o `buscou.current`
    seguraria, mas o intento ficaria escondido num guard em vez de explícito)
  - ⚠️ **NENHUMA FERRAMENTA VALIDA ESTE ARRAY.** O projeto não tem config de
    ESLint (verificado), então o `next build` **não roda lint** e a regra
    `exhaustive-deps` **não existe aqui**. Errar a dependência não gera erro,
    aviso ou falha de build — o sintoma é a busca refazendo (ou nunca
    acontecendo). É revisão humana, não ferramenta
  - Importar tipos com `import type`; **nunca** `lib/shopify/acessorios` (é
    `server-only` — o build falharia)
  - Purpose: uma busca por carga, só com gatilho
  - _Leverage: `lib/carrinho/acoes.ts`, `lib/shopify/tags.ts`, `lib/shopify/types.ts` (`import type`)_
  - _Requirements: 1.1, 2.5, 6.2_

- [ ] 11. Derivar `sugestoes` **com o gatilho embutido** no `CarrinhoProvider`
  - File: `components/loja/CarrinhoProvider.tsx` (continuar da tarefa 10)
  - `useMemo`: **`if (!temCamera) return []`**, depois `acessorios.filter(a => !noCarrinho.has(a.handle))`
    com `noCarrinho = new Set(linhas.map(l => l.handle))`
  - **Chavear o `useMemo` em `[temCamera, acessorios, carrinho?.linhas]`** — não
    em `linhas`. *`linhas = carrinho?.linhas ?? []` cria um array novo a cada
    render, então memoizar nele recomputa sempre e o "memo" vira decoração. O
    filtro é barato e a corretude não muda — mas o plano vende o memo como o
    mecanismo, então ele precisa memoizar de fato*
  - ⚠️ **Sem ESLint no build, o array de dependências é revisão humana** (ver
    tarefa 10). Aqui o erro é ainda mais silencioso que no efeito: um memo que
    recomputa sempre **funciona** — só não memoiza. Nada acusa, nunca
  - Expor `acessorios` e `sugestoes` no contexto
  - 🔴 **O GATILHO ENTRA AQUI, NÃO NO RENDER.** O `acessorios` **sobrevive ao
    gatilho** (é o memo). Sem esta linha: câmera adicionada → gatilho dispara →
    cliente **remove a câmera** → `sugestoes` continua cheio → **a seção
    renderiza sem câmera** (Req 1.2 violado), ou embaixo de "Seu carrinho está
    vazio" (Req 1.3). Pior: **qualquer falha de `adicionarItem`** devolve
    `{carrinho: null}` (`acoes.ts:48-49`) e a lista brota ao lado do banner de
    erro. **Nem `tsc` nem `build` pegam isso**
  - Purpose: estado que sobrevive ao gatilho não pode ser validado por `length`
  - _Leverage: `components/loja/CarrinhoProvider.tsx`_
  - _Requirements: 1.1, 1.2, 1.3, 1.5, 3.1, 3.2, 3.3, 3.4, 3.5_

### Bloco 6 — UI

- [ ] 12. Criar `AcessoriosSugeridos` em `components/loja/AcessoriosSugeridos.tsx`
  - File: `components/loja/AcessoriosSugeridos.tsx` (novo)
  - `"use client"`; sem props — lê `useCarrinho()`
  - **Guarda única:** `if (!ctx || ctx.sugestoes.length === 0) return null` —
    cobre os 5 casos **porque** a tarefa 11 gateou a derivação
  - Título **"Você também vai precisar"** — copy fixa, **exceção declarada** ao
    "conteúdo em JSON" (Req 4.7); comentar, como o `SeloPagamento` faz
  - Por item: `<img>` do CDN, nome, **preço via `<PriceTag price={a.price.price}
    currency={a.price.currency} size="medio" />`**, botão "+ Add" com `aria-label`
    **nomeando o acessório**
  - ⚠️ **O campo é `price`, NÃO `precoUnitario`.** A sugestão é um `ProductCard`
    (`{id, handle, title, image, price}`) — `precoUnitario` é de `LinhaCarrinho`,
    outro tipo. *O `tsc` pegaria, mas a tarefa mandaria o executor para o caminho
    errado na sua única função. `ProductCardLink.tsx` é o precedente de `PriceTag`
    com `ProductCard`*
  - Botão → `adicionar(handle)`; **não** chamar `abrir()` (o drawer já está
    aberto); `disabled={carregando}`
  - **Comentar** que `carregando` é global do provider: desabilita todos os "+
    Add" durante qualquer operação. É aceito — a fila é serial de qualquer forma
  - Cores só via `--cor-*`
  - Purpose: a seção
  - _Leverage: `components/loja/CarrinhoProvider.tsx`, `components/loja/SeloPagamento.tsx` (precedente de copy fixa), `components/loja/ProductCardLink.tsx` (PriceTag com ProductCard), `components/ui/PriceTag.tsx`, `lib/tokens.ts`_
  - _Requirements: 4.2, 4.3, 4.4, 4.5, 4.7, 5.1, 5.2, 5.3, 5.4, 5.5, 6.1_

- [ ] 13. Renderizar a seção no `CarrinhoDrawer`
  - File: `components/loja/CarrinhoDrawer.tsx` (modificar)
  - `<AcessoriosSugeridos />` **depois do `)}` que fecha o ternário (linha 180)**
    e **antes do `</div>` do corpo (linha 181)**
  - ⚠️ **Não é "depois do `</ul>`".** O `</ul>` (linha 179) está **dentro** do
    ternário `{vazio ? (…) : (<ul>…</ul>)}` — colocar a seção ali criaria dois
    elementos JSX adjacentes no mesmo branch: **erro de compilação**. O alvo é
    após o ternário inteiro
  - **NÃO colocar dentro do `<footer>`** nem mexer no `flex`: o rodapé é
    `flexShrink: 0` (**:187**) e **irmão** do corpo `flex:1; overflowY:auto`
    (**:138**). É essa separação que garante o Req 6.3 (os totais não pulam) e o
    Req 4.8 (totais sempre visíveis) — **de graça, e invisivelmente**. Quem mover
    a seção para o rodapé quebra os dois sem que nada acuse
  - **Aditivo:** quando `sugestoes` está vazio, o drawer renderiza **exatamente**
    como hoje
  - Purpose: a seção no lugar certo, sem mexer no rodapé
  - _Leverage: `components/loja/CarrinhoDrawer.tsx`, `components/loja/AcessoriosSugeridos.tsx`_
  - _Requirements: 4.1, 4.6, 4.8, 6.3_

### Bloco 7 — Salvaguarda e documentação

- [ ] 14. Criar `scripts/verificar-tags.mjs` e o script npm
  - Files: `scripts/verificar-tags.mjs` (novo), `package.json` (modificar)
  - **Falha (exit ≠ 0)** se não houver nenhum produto **sugerível** (`acessorio`
    **e** `availableForSale: true`) **ou** nenhum com `camera`
  - 🔴 **Contar SUGERÍVEL, não etiquetado.** Com os acessórios etiquetados mas
    **esgotados**, um check que só olha a tag fica **verde** enquanto o Req 2.4 os
    remove das sugestões e a seção nunca aparece — a salvaguarda aprovando o
    exato estado que existe para impedir
  - Reportar `etiquetados` × `sugeríveis` nos dois lados
  - **Avisar (sem falhar)** se houver produto **sem tag alguma**, nomeando handles
  - **`process.exitCode`, NUNCA `process.exit()`** — após `fetch` ele derruba
    handles do libuv no Windows e o exit code sai **127 em qualquer caso**
  - `"verificar:tags": "node --env-file=.env.local scripts/verificar-tags.mjs"`
  - **NÃO acoplar ao `npm run build`** (o build passa sem `.env.local`)
  - Duplica env + default da versão — **exceção declarada do Req 10.3**, comentada
  - Purpose: a premissa (que já caiu uma vez) falhar com barulho
  - _Leverage: `scripts/verificar-variantes.mjs` (copiar a estrutura e o comentário do exitCode), `lib/shopify/tags.ts` (grafia)_
  - _Requirements: 7.1, 7.2, 7.3, 7.4, 10.3_

- [ ] 15. Provar os 3 caminhos do `verificar:tags`
  - File: nenhum (verificação)
  - **Estado real** (2 `camera`, 2 `acessorio` disponíveis) → `npm run
    verificar:tags` → **exit 0**
  - **Premissa caída** (inverter o critério numa cópia no scratchpad) → **exit 1**
  - **Env ausente** → rodar **`node scripts/verificar-tags.mjs` DIRETO** (sem
    `--env-file`) → **exit 1** com a mensagem do script, **sem crash do libuv**
  - ⚠️ **Não teste isso com `npm run verificar:tags` e o `.env.local` renomeado:**
    o Node **aborta no bootstrap** ao não achar o `--env-file`, e o ramo
    `ENV_AUSENTE` do script **nunca executa** — o exit code seria do Node, não do
    check. Seria um teste que passa sem testar nada
  - *(Achado da auditoria: o `verificar-variantes.mjs` **já tem essa falha
    latente** — a mensagem dele manda usar um npm script que não consegue
    alcançá-la. Fora do escopo desta spec; anotado.)*
  - Purpose: a salvaguarda de fato sinaliza — nos três caminhos
  - _Requirements: 7.1, 7.4_

- [ ] 16. Documentar a feature e o `verificar:tags` no `README.md`
  - File: `README.md` (modificar)
  - Como funciona (tag `camera` = gatilho, `acessorio` = sugerido), que **muda
    pelo admin, sem código**
  - `npm run verificar:tags`: o que prova, quando rodar, por que **não** está no
    build
  - **Registrar que os produtos `acessorio` de hoje são câmeras disfarçadas
    (dados de teste)** — quem vir câmeras nas sugestões precisa saber que é
    esperado, não bug
  - Purpose: uma salvaguarda que ninguém conhece não é salvaguarda
  - _Leverage: `README.md` (seção do `verificar:variantes` como modelo)_
  - _Requirements: 7.5_

### Bloco 8 — Verificação (DoD: build + manual)

- [ ] 17. Verificar build, tipos, fronteira e não-vazamento
  - File: nenhum (verificação)
  - `npx tsc --noEmit` limpo; `npm run build` limpo; **e sem `.env.local`** (fazer
    backup, conferir checksum ao restaurar)
  - Token, domínio e `SHOPIFY_STOREFRONT_TOKEN` em `.next/static` → **0**
  - Nenhum componente importa `lib/shopify/acessorios` como valor (só a action)
  - `grep` por `fetchCache`/`force-cache` → **0** (Req 8.5)
  - Saída do build: `/` e `/sobre-nos` **`○ (Static)`**; `/catalogo` e
    `/produtos/[handle]` em ISR 5m
  - `npm run verificar:tags` → exit 0; `npm run verificar:variantes` → exit 0
  - Purpose: DoD
  - _Requirements: 8.1, 8.2, 8.5, 9.2, 9.3, 9.4, 9.6_

- [ ] 18. 🧑 **PORTÃO HUMANO** — os fluxos da seção (`npm run dev`)
  - File: nenhum (verificação). **Não é tarefa de agente**
  - Carrinho com `camera-seguranca-es-p9` → seção **"Você também vai precisar"**
    com os 2 acessórios. *Vão aparecer **câmeras** — são os dados de teste
    (`camera-seguranca-q8`, `camera-seguranca-s8`). **Esperado, não bug***
  - 🔴 **O TESTE DA ARMADILHA DO MEMO: adicionar a câmera → ver a seção →
    REMOVER a câmera → a seção SOME.** Repetir pela lixeira **e** pelo `−` até 0
  - "+ Add" num acessório → entra no carrinho, **some das sugestões**, drawer
    **continua aberto**
  - Adicionar **os 2** → a seção **desaparece** (Req 3.2)
  - Remover um → **volta** a ser sugerido
  - **Carrinho só com acessório (sem câmera) → sem seção E, na aba Network,
    ZERO chamadas de `buscarAcessorios`.** *A asserção de rede é o teste; sem ela
    o check passa pelo motivo errado — a tarefa 11 esconde a seção **haja ou não**
    busca, então "sem seção" não prova a NFR "carrinho sem câmera não gera chamada
    à Shopify". É o mesmo defeito que o design diagnosticou no teste antigo,
    reaparecendo um passo adiante*
  - Fechar/reabrir o drawer → seção aparece **sem nova chamada** (Network)
  - Os totais **não pulam** quando a seção aparece
  - Teclado: navegável; o rótulo do botão **diz qual** acessório
  - **Req 2.3 (produto com as duas tags) NÃO é exercitável hoje** — a loja tem 0
    deles (medido). O comportamento é **emergente e definido** (dispara o gatilho,
    é acessório, é excluído por já estar no carrinho → seção vazia → Req 6.1
    esconde), mas **não verificado**. Declarado, não silenciado
  - Purpose: DoD — o que só aparece em runtime
  - _Requirements: 1.1, 1.2, 1.3, 1.5, 2.3, 3.1, 3.2, 3.3, 3.4, 4.1, 4.8, 5.1, 6.1, 6.3_

- [ ] 19. 🧑 **PORTÃO HUMANO** — degradação e não-regressão final
  - File: nenhum (verificação). **Não é tarefa de agente**
  - Renomear `.env.local` → site sobe, **sem seção e sem erro**; carrinho degrada
    como já degradava; Home e Sobre Nós intactas (restaurar depois)
  - **Remover a tag `acessorio` de um produto no admin** → após recarregar, ele
    some das sugestões **sem tocar em código** (prova o Req 2.1)
  - **Regressão do carrinho (o fragmento foi tocado):** adicionar, quantidade,
    cupom `TESTE10` (subtotal − desconto = total), remover, contador, checkout
  - Purpose: DoD — a promessa central ("muda pelo admin") e o que o fragmento pôs
    em risco
  - _Requirements: 2.1, 6.2, 8.1, 9.1_

## Preparação para a auditoria do plano

Antes de executar, este plano deve passar por **auditoria adversarial** — como em
`catalogo-loja` e `carrinho-loja`, onde ela achou defeitos que nenhum build
pegaria. Os pontos para o auditor focar, em ordem de dano:

1. 🔴 **O RISCO DO FRAGMENTO (tarefas 1–5) — o único que pode quebrar o que já
   vende.** `CAMPOS_DO_CARRINHO` é interpolado na `CARRINHO_QUERY` **e nas 5
   mutations**. Perguntas: a mudança é mesmo só um escalar num `product` já
   selecionado? A tarefa 4 prova as **6** operações, ou só valida schema? O
   portão 5 vem **antes** de construir qualquer coisa em cima — ou o plano
   permite empilhar 12 arquivos sobre um carrinho quebrado? Há algum caminho em
   que `tags` chegue `undefined` e o `.includes()` exploda em runtime?
2. **Tarefa 11 (o gatilho na derivação)** — se ele acabar no render em vez do
   `useMemo`, a seção sobrevive à remoção da câmera. **Bug de runtime que o build
   não pega**, já cometido uma vez neste design.
3. **Tarefa 13 (posição no drawer)** — a seção **fora** do `<footer>` é o que
   garante Req 6.3 e 4.8. Invisível: quem a move para o rodapé quebra os dois em
   silêncio.
4. **Tarefa 14 (contar sugerível, não etiquetado)** — o buraco em que a
   salvaguarda aprova o estado que existe para impedir.
5. **Tarefa 10 (`buscou` antes do `await`)** — se depender de sucesso, martela a
   Shopify justo quando ela está caindo.
6. **Dados de teste** — os "acessórios" são câmeras disfarçadas. Alguma tarefa
   depende de eles serem acessórios de verdade?
7. **Lacunas/ordem** — alguma tarefa depende de outra posterior? Algum requisito
   sem tarefa, ou tarefa sem requisito? A NFR "os totais não pulam" tem
   verificação?
