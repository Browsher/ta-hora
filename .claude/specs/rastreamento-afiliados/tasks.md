# Implementation Plan

## Task Overview

Cinco blocos, na ordem em que cada um **deixa o site vendendo**. A propriedade
de ordem é deliberada e é a proteção do Req 4 (a venda nunca quebra):

| Bloco | O que entra | Estado do site ao fim |
|---|---|---|
| 1 — Módulos puros | `lib/afiliados/ref.ts`, `lib/afiliados/cookie.ts` | **Código morto.** Ninguém importa. Zero risco. |
| 2 — Captura | `proxy.ts` | Cookie `tahora_ref` sendo gravado, **ninguém lê**. Carrinho intocado. |
| 3 — Camada Shopify | `queriesCarrinho.ts`, `carrinho.ts` (+ call sites) | Attributes trafegando e mutation nova disponível, **ninguém carimba**. Comportamento idêntico ao atual. |
| 4 — Orquestração | `acoes.ts` | **A feature liga.** Bloco mais sensível: é o caminho da venda. |
| 5 — Auditoria | verificação + script | Prova de que carimba e de que nada regrediu. |

O corte entre 3 e 4 é o ponto crítico: o Bloco 3 muda **formas** (fragmento,
assinaturas, retornos) sem mudar **comportamento** — ele é um refactor puro,
verificável por `tsc` + build + clique manual. Só o Bloco 4 acende a feature.

## Steering Document Compliance

- **structure.md**: domínio em pt-BR (`lib/afiliados/`, `normalizarRef`,
  `lerRefDeAfiliado`, `atualizarAtributos`, `recarimbar`); GraphQL confinado a
  `lib/shopify/queriesCarrinho.ts`; HTTP só via `storefrontFetch`; cookie e
  orquestração em `lib/carrinho/`; nada novo em `components/`.
- **tech.md**: `server-only` nos módulos que tocam cookie/token; `semCache:
  true` em toda operação de carrinho; actions nunca lançam; mensagens sem
  token/endpoint; build passa sem `.env.local`; regimes ISR/SSG preservados.
- **DoD do projeto**: build + verificação manual. **Sem suíte de testes
  formal** — a verificação de `normalizarRef` é um script `node` descartável
  ou conferência em dev, não infraestrutura de teste nova.

## Atomic Task Requirements

Cada tarefa: 1-3 arquivos, 15-30 min, um resultado testável, arquivos
explícitos.

## Task Format Guidelines

- Checkbox numerado: `- [ ] N. Descrição`
- Caminhos de arquivo sempre explícitos
- `_Requirements: X.Y_` referencia o `requirements.md`;
  `_Leverage: caminho_` referencia código existente a reusar
- Tarefas marcadas **🧑 HUMANO** não são executáveis por agente (exigem
  pedido real, pagamento ou acesso ao admin da Shopify) — o executor deve
  parar e devolver ao usuário
- Tarefas "de verificação" (sem arquivos) são intencionais: o DoD deste
  projeto é **build + verificação manual**, sem suíte de testes formal

## Tasks

---

### Bloco 1 — Módulos puros (código morto, zero risco)

- [x] 1. Criar `normalizarRef` e as constantes do cookie em `lib/afiliados/ref.ts`
  - File: `lib/afiliados/ref.ts` (novo)
  - **SEM `server-only`** — é módulo puro, importado pelo `proxy.ts` (que roda
    no Edge/Node do middleware) e pelas Server Actions
  - Exportar `normalizarRef(bruto: string | null | undefined): string | null`:
    `trim()` → `toUpperCase()` → testa `/^[A-Z0-9]{8}$/` → devolve o valor
    normalizado ou `null`
  - Exportar `COOKIE_REF = "tahora_ref"` e
    `VALIDADE_REF_EM_SEGUNDOS = 60 * 60 * 24 * 30` (30 dias)
  - Exportar `CHAVE_ATRIBUTO = "afiliado_ref"` — a chave literal do contrato do
    webhook, em UM lugar só
  - Comentar o **porquê** do contrato: 8 chars maiúsculos, regex
    `^[A-Z0-9]{8}$` **case-sensitive** no webhook (minúsculo é ignorado), chave
    **sem prefixo `__`** (atributos ocultos com `__` têm histórico de não
    chegar ao webhook de pedido)
  - Purpose: fonte única da regra do código de afiliado, compartilhada por
    proxy e servidor
  - _Requirements: 1.1, 1.2, 3.4, 3.5_

- [x] 2. Criar `lerRefDeAfiliado` em `lib/afiliados/cookie.ts`
  - File: `lib/afiliados/cookie.ts` (novo)
  - `import "server-only"` no topo (espelho de `lib/carrinho/cookie.ts`)
  - `lerRefDeAfiliado(): Promise<string | null>` — lê `cookies()` de
    `next/headers`, pega `COOKIE_REF` e passa o valor por `normalizarRef`
  - **Só leitura**: sem `gravar`/`descartar` — quem grava é o `proxy.ts`
    (Bloco 2). Comentar isso, senão a assimetria com `carrinho/cookie.ts`
    parece esquecimento
  - Comentar o porquê da revalidação: o cookie é **entrada do cliente**; um
    valor adulterado nunca pode virar attribute (anti-injeção)
  - Purpose: leitura confiável do ref nas Server Actions
  - _Leverage: lib/carrinho/cookie.ts (padrão), lib/afiliados/ref.ts_
  - _Requirements: 3.4_

- [x] 3. Conferir `normalizarRef` com um script descartável
  - File: nenhum no repositório — rodar com `node -e` colando a regra inline
    (**não** usar `npx tsx`: não é dependência do projeto e dispararia
    download; **não** criar arquivo permanente nem infra de teste)
  - Casos: `"abcd1234"` → `"ABCD1234"`; `"ABCD1234"` → igual;
    `" abcd1234 "` → `"ABCD1234"`; `"teste1234"` (9) → `null`;
    `"test123"` (7) → `null`; `"abcd-234"` → `null`; `""` → `null`;
    `null`/`undefined` → `null`
  - ⚠️ Atenção ao caso que já enganou esta spec: `"teste123"` tem **8** chars e
    é **válido** — o caso inválido é `"teste1234"`
  - Purpose: garantir a regra antes de ela virar dependência de 3 blocos
  - _Requirements: 1.1, 1.2_

- [x] 4. Rodar `npx tsc --noEmit` e confirmar o Bloco 1 inerte
  - Files: nenhum (verificação)
  - `npx tsc --noEmit` limpo
  - Confirmar por busca que **nada** importa `lib/afiliados/*` ainda — o site
    está byte a byte o de antes
  - Purpose: fechar o bloco com o site intocado
  - _Requirements: 4.3_

---

### Bloco 2 — Captura (`proxy.ts`): cookie gravado, ninguém lê

- [ ] 5. Criar `proxy.ts` na raiz com o guard e o `matcher`
  - File: `proxy.ts` (novo, raiz do projeto)
  - Next 16.2.9: a convenção é **`proxy.ts`** (rename oficial de
    `middleware.ts`), com `export function proxy(request: NextRequest)`
  - **Primeiro statement é o guard**: `if
    (!request.nextUrl.searchParams.has("ref")) return NextResponse.next()` —
    é o que mantém o caminho comum sem custo observável
  - `export const config = { matcher: ["/((?!api|_next/static|_next/image|.*\\..*).*)"] }`
    — exclui API, estáticos, otimizador de imagem e qualquer arquivo com
    extensão (uploads, favicon)
  - Nesta tarefa o corpo pode terminar em `NextResponse.next()` — a gravação
    entra na tarefa 6
  - Purpose: instalar a interceptação sem ainda mudar nada
  - _Requirements: 1.1, 2.1, 2.3_

- [ ] 6. Gravar `tahora_ref` e redirecionar 307 para a URL limpa em `proxy.ts`
  - File: `proxy.ts` (continuação da tarefa 5)
  - `normalizarRef(searchParams.get("ref"))` — `get` devolve a **primeira**
    ocorrência (Req 1.7); inválido → `NextResponse.next()` **sem** cookie e
    **sem** redirect (Req 1.2, o cookie anterior fica intacto por Req 1.4)
  - Válido: clonar `request.nextUrl`, `searchParams.delete("ref")` (remove
    **todas** as ocorrências), `NextResponse.redirect(urlLimpa)` e
    `resposta.cookies.set(COOKIE_REF, ref, { httpOnly: true, secure:
    process.env.NODE_ENV === "production", sameSite: "lax", maxAge:
    VALIDADE_REF_EM_SEGUNDOS, path: "/" })`
  - ⚠️ **307, NUNCA 308** — comentar o porquê no código: 308 é permanente e
    **cacheável pelo navegador**; a 2ª visita ao mesmo link `?ref=` pularia o
    servidor e o `Set-Cookie` não aconteceria, quebrando o last-touch **em
    silêncio**. (307 é o default do `NextResponse.redirect` — o comentário
    existe para ninguém "otimizar" isso depois.)
  - Envolver o corpo inteiro em `try/catch` → `NextResponse.next()`: exceção
    na captura nunca derruba a página
  - Purpose: last-touch persistido com URL limpa, sem JS e sem corrida
  - Cookie bloqueado/recusado pelo navegador não é tratado como erro: o
    `Set-Cookie` simplesmente não pega e a navegação segue (Req 1.6)
  - _Leverage: lib/afiliados/ref.ts, lib/carrinho/cookie.ts (opções do cookie)_
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7, 4.1_

- [ ] 7. Verificar a captura em `npm run dev` e o regime das rotas no build
  - Files: nenhum (verificação)
  - Em dev: `/?ref=abcd1234` → redirect para `/`, cookie `tahora_ref` com
    valor `ABCD1234` (nome minúsculo, valor maiúsculo) em DevTools →
    Application → Cookies; `/?ref=teste1234` (9 chars) → **sem** cookie e
    **sem** redirect; `/catalogo?pagina=2&ref=abcd1234` → `/catalogo?pagina=2`
    (demais params preservados); last-touch: segundo ref válido sobrescreve
  - `rm -rf .next && npm run build` (o `.next` morno serve HTML antigo e
    mascara regressão): confirmar `/`, `/catalogo`, `/produtos/[handle]` com
    Revalidate **`5m`**, `/sobre-nos` `○` com coluna Revalidate **vazia**, e a
    linha `ƒ Proxy` na saída
  - Purpose: provar que a captura funciona e que o ISR **não** mudou
  - _Requirements: 1.1, 1.2, 1.3, 1.5, 1.7, 2.2, 2.3_

---

### Bloco 3 — Camada Shopify: formas novas, comportamento idêntico

- [ ] 8. Adicionar `attributes { key value }` ao fragmento e a mutation nova em `queriesCarrinho.ts`
  - File: `lib/shopify/queriesCarrinho.ts`
  - `CAMPOS_DO_CARRINHO` ganha `attributes { key value }` — comentar que é o
    que torna a comparação do read-repair **grátis em rede** (toda resposta já
    diz o ref atual)
  - ⚠️ O comentário do próprio fragmento avisa: ele é compartilhado pelas **6
    operações**, e este campo **não é escalar** — a revalidação das 6 na
    tarefa 10 é obrigatória, não opcional
  - `CRIAR_CARRINHO_MUTATION`: assinatura vira
    `($lines: [CartLineInput!], $attributes: [AttributeInput!])` e
    `cartCreate(input: { lines: $lines, attributes: $attributes })` — variável
    **nullable**: omitir = mutation idêntica à de hoje
  - Nova `ATUALIZAR_ATRIBUTOS_MUTATION`:
    `cartAttributesUpdate(cartId: $cartId, attributes: $attributes)` com
    `$attributes: [AttributeInput!]!` e o `RETORNO_DA_MUTATION` padrão
  - Purpose: expor os attributes e a mutation de carimbo
  - _Leverage: lib/shopify/queriesCarrinho.ts (RETORNO_DA_MUTATION, CAMPOS_DO_CARRINHO)_
  - _Requirements: 3.1, 3.2, 3.5, 3.7_

- [ ] 9. Registrar a mutation nova em `scripts/extrair-graphql.mjs`
  - File: `scripts/extrair-graphql.mjs`
  - Adicionar `"ATUALIZAR_ATRIBUTOS_MUTATION"` ao array
    `OPERACOES_DO_CARRINHO` — o script monta as operações com as interpolações
    resolvidas para o Dev MCP validar **o que o runtime monta**
  - Rodar `node scripts/extrair-graphql.mjs` e conferir que as **7 operações
    do carrinho** saem com `attributes { key value }` presente em todas (o
    script também emite as queries de catálogo, que **não** têm attributes —
    isso é esperado, não é falha)
  - Purpose: a auditoria da tarefa 10 valida o código real, não a memória
  - _Leverage: scripts/extrair-graphql.mjs_
  - _Requirements: 5.2_

- [ ] 10. Validar as 7 operações no Dev MCP (Storefront 2026-01)
  - Files: nenhum (verificação) — entrada é a saída da tarefa 9
  - `validate_graphql_codeblocks`, `api: storefront-graphql`,
    `version: 2026-01`, para as 7 operações
  - **Aviso de depreciação conta como falha** (regra herdada da spec
    `carrinho-loja`)
  - Purpose: garantir que o fragmento alterado não quebrou nenhuma das 6
    operações existentes
  - _Requirements: 5.2, 4.3_

- [ ] 11. Adicionar `atributos` opcional ao `criarCarrinhoCom` e criar `atualizarAtributos`
  - File: `lib/shopify/carrinho.ts`
  - `criarCarrinhoCom(merchandiseId, quantidade = 1, atributos?: { key:
    string; value: string }[])` — quando ausente, **omitir a variável**
    `attributes` do payload (mutation idêntica à atual; retrocompatível)
  - Nova `atualizarAtributos(cartId, atributos): Promise<ResultadoCarrinho>`
    via `executarMutation(ATUALIZAR_ATRIBUTOS_MUTATION,
    "cartAttributesUpdate", { cartId, attributes: atributos })` com
    `{ semCache: true }` herdado do `storefrontFetch` do módulo
  - Purpose: dar à camada de dados a capacidade de carimbar (ainda sem
    ninguém chamando)
  - _Leverage: lib/shopify/carrinho.ts (executarMutation, paraResultado)_
  - _Requirements: 3.1, 3.2_

- [ ] 12. Expor `afiliadoRef` no retorno de `lerCarrinhoPorId` e `adicionarLinhas` (refactor mecânico)
  - Files: `lib/shopify/carrinho.ts`, `lib/carrinho/acoes.ts`
  - Adicionar `attributes` ao tipo `RawCarrinho` em
    `lib/shopify/normalizeCarrinho.ts` (linha ~70 — é onde o tipo mora, e ele
    hoje não tem o campo)
  - Extrair do payload cru:
    `attributes?.find(a => a.key === CHAVE_ATRIBUTO)?.value ?? null`
  - 🚨 **COMO chegar ao payload cru no `adicionarLinhas`**: ele hoje usa
    `executarMutation`, que **descarta** o payload após o `paraResultado`.
    → **`adicionarLinhas` deixa de usar `executarMutation` e passa a chamar
    `storefrontFetch` direto** (o padrão do `criarCarrinhoCom`,
    `lib/shopify/carrinho.ts:138-149`).
    → **NÃO alterar `executarMutation`**: ele é compartilhado por outras 3
    mutations (`cartLinesUpdate`, `cartLinesRemove`,
    `cartDiscountCodesUpdate`) e mexer nele transforma esta tarefa num
    refactor de 4 call sites.
  - Novo shape: `{ resultado: ResultadoCarrinho; afiliadoRef: string | null }`
    — **interno da camada `server-only`**; o tipo `Carrinho` de
    `lib/shopify/types.ts` **NÃO** muda (a UI não vê attributes)
  - ⚠️ **Atualizar os TRÊS call sites** em `lib/carrinho/acoes.ts`:
    `lerCarrinho()`, `adicionarItem()` **e `cuponsAtuais()` (linhas
    ~236-239)** — este último lê `r.carrinho` direto e quebra o fluxo de
    cupom se ficar para trás
  - **Sem mudança de comportamento nesta tarefa**: só desempacotar o novo
    shape e ignorar o `afiliadoRef`
  - Purpose: entregar o dado ao orquestrador sem ainda usá-lo
  - _Leverage: lib/shopify/carrinho.ts (padrão do `{ id, resultado }` do criarCarrinhoCom)_
  - _Requirements: 3.2, 3.7, 4.3_

- [ ] 13. Fechar o Bloco 3 com `tsc`, build e clique manual no carrinho
  - Files: nenhum (verificação)
  - `npx tsc --noEmit` limpo; `rm -rf .next && npm run build` passando
  - Em dev, o fluxo inteiro **sem `?ref=`**: adicionar, alterar quantidade,
    remover, aplicar cupom válido, aplicar cupom inválido (o aviso "Cupom
    inválido" precisa aparecer — é o call site da tarefa 12), abrir o checkout
  - Purpose: provar que o refactor de formas não mexeu em comportamento
  - _Requirements: 4.3_

---

### Bloco 4 — Orquestração (o caminho da venda): a feature liga

- [ ] 14. Criar o helper `recarimbar` em `lib/carrinho/acoes.ts`
  - File: `lib/carrinho/acoes.ts`
  - `async function recarimbar(cartId, resultado, afiliadoRefAtual):
    Promise<ResultadoCarrinho>` — lê `lerRefDeAfiliado()`; devolve o
    `resultado` **intacto** quando: não há ref válido (Req 3.6) **ou**
    `afiliadoRefAtual === ref` (Req 3.7, sem round-trip)
  - Divergente → `atualizarAtributos(cartId, [{ key: CHAVE_ATRIBUTO, value:
    ref }])`
  - 🚨 **`try/catch` NÃO BASTA — a condição de aceite é explícita.**
    `atualizarAtributos` roda sobre `executarMutation`, que **não lança** em
    `userErrors`: ele devolve `ResultadoCarrinho` com `erro:
    ERRO_DA_SHOPIFY` (e possivelmente `carrinho: null`). Um `catch` nunca vê
    isso, e o `erro` subiria pelo `comTratamentoDeErro` virando
    "Não foi possível atualizar seu carrinho" **em toda carga de página**
    (o `lerCarrinho` roda no mount de todas) — ou pior, um `carrinho: null`
    esvaziaria o drawer.
    → **Usar o retorno de `atualizarAtributos` SOMENTE se
    `r.erro === null && r.carrinho !== null`. Em qualquer outro caso
    (exceção, `userError`, carrinho nulo) devolver o `resultado` original
    INTACTO.**
  - `try/catch` por cima disso, também devolvendo o `resultado` original. Sem
    `console.error` (a mensagem do `storefrontFetch` contém o endpoint)
  - **Cookie ausente + carrinho já carimbado → NÃO remover o attribute**:
    comentar a decisão (o carimbo valeu na janela em que aconteceu)
  - Purpose: o carimbo idempotente e não-bloqueante, num lugar só
  - Montar o array de attributes com **apenas** `afiliado_ref` — **não**
    incluir `afiliado_ref_ts` (Req 3.9: o webhook ignora; menos ruído)
  - _Leverage: lib/afiliados/cookie.ts, lib/shopify/carrinho.ts (atualizarAtributos)_
  - _Requirements: 3.2, 3.4, 3.6, 3.7, 3.8, 3.9, 4.1, 4.4_

- [ ] 15. Ligar o read-repair no `lerCarrinho()`
  - File: `lib/carrinho/acoes.ts`
  - Após a leitura bem-sucedida, chamar `recarimbar(cartId, resultado,
    afiliadoRef)` e devolver o resultado dele
  - Comentar o **porquê deste ser o ponto de sincronização**: o
    `CarrinhoProvider` dispara `lerCarrinho()` no mount de **toda** página, e
    chegar com `?ref=` é sempre navegação completa pelo proxy — então o
    recarimbo acontece antes de qualquer clique, inclusive no cenário "novo
    ref + checkout direto sem adicionar item" (Req 3.8). Sem isso, o próximo
    leitor não entende por que o repair mora numa função de leitura
  - Não mexer no ramo `!r.carrinho` (descarte do cookie) — segue igual
  - Purpose: cobrir o carrinho preexistente sem tocar no cliente
  - _Leverage: components/loja/CarrinhoProvider.tsx (sincronizar/mount — apenas como justificativa, NÃO alterar)_
  - _Requirements: 3.2, 3.8, 4.1_

- [ ] 16. Carimbar na criação do carrinho com fallback sem attributes em `criarEGravar`
  - File: `lib/carrinho/acoes.ts`
  - `criarEGravar(merchandiseId)`: lê `lerRefDeAfiliado()`; com ref válido →
    `criarCarrinhoCom(merchandiseId, 1, [{ key: CHAVE_ATRIBUTO, value: ref }])`
  - **Fallback (Req 4.2)**: se a criação COM attributes voltar sem `cart`,
    retentar **uma vez** `criarCarrinhoCom(merchandiseId)` sem attributes.
    Comentar o trade honesto: o retry também dispara em falhas alheias ao
    attribute (ex.: erro de merchandise), gastando 1 round-trip num caminho já
    raro — aceito para não perder a venda por causa do carimbo
  - Isto cobre **os dois** caminhos de criação: carrinho novo (Req 3.1) e a
    recriação silenciosa do carrinho expirado (Req 3.3), que passam ambos por
    aqui
  - Attributes com **apenas** `afiliado_ref` — sem `afiliado_ref_ts` (Req 3.9)
  - Purpose: carrinho nasce carimbado, e a venda sobrevive se o carimbo falhar
  - _Leverage: lib/shopify/carrinho.ts (criarCarrinhoCom)_
  - _Requirements: 3.1, 3.3, 3.5, 3.9, 4.2_

- [ ] 17. Adicionar o recarimbo defensivo no ramo de carrinho preexistente do `adicionarItem`
  - File: `lib/carrinho/acoes.ts`
  - No ramo em que `adicionarLinhas` devolveu carrinho, chamar `recarimbar`
    com o `afiliadoRef` **da própria resposta** — custo zero quando já
    sincronizado
  - Comentar que é cinto-e-suspensório: cobre o caso raro de o repair do mount
    ter falhado por rede; a fonte principal é o `lerCarrinho()` (tarefa 15)
  - **Não** alterar o ramo de recriação (`!r.carrinho && !r.erro`) — ele já
    passa pelo `criarEGravar` carimbado da tarefa 16
  - Purpose: cumprir o Req 3.2 literal sem custo no caminho comum
  - _Requirements: 3.2, 3.7_

- [ ] 18. Verificar o Bloco 4 em dev: carimbo, idempotência e ausência de ref
  - Files: nenhum (verificação)
  - **Sem cookie**: adicionar item → nenhuma chamada nova, comportamento
    idêntico ao atual (Req 3.6)
  - **Com `?ref=abcd1234`, carrinho novo**: `cartCreate` sai com
    `attributes: [{ key: "afiliado_ref", value: "ABCD1234" }]` e a resposta
    confirma o attribute no `cart` (Req 5.3)
  - **Carrinho preexistente + novo ref, recarregando a página sem adicionar
    nada**: `cartAttributesUpdate` dispara (Req 3.8); recarregar de novo →
    **nenhuma** mutation de attributes (Req 3.7)
  - Purpose: provar os três carimbos e a idempotência
  - _Requirements: 3.1, 3.2, 3.3, 3.6, 3.7, 3.8, 5.3_

---

### Bloco 5 — Auditoria: prova de que carimba e de que nada regrediu

- [ ] 19. Criar `scripts/verificar-afiliado.mjs` (inspeção do carrinho por ID)
  - Files: `scripts/verificar-afiliado.mjs` (novo), `package.json`
  - Segue o padrão dos `verificar-*.mjs` existentes: lê env com
    `node --env-file=.env.local`, consulta a Storefront API e imprime
    `attributes` do carrinho passado por argumento (`cart(id:)`)
  - Registrar `"verificar:afiliado": "node --env-file=.env.local
    scripts/verificar-afiliado.mjs"` em `package.json`
  - Escopo honesto: verifica o **carrinho** (Storefront API, token que temos).
    O **pedido** é conferido no admin da Shopify (tarefa 21) — a Storefront
    API não lê pedidos
  - Purpose: inspecionar o carimbo sem depender de DevTools
  - _Leverage: scripts/verificar-tags.mjs (padrão de script de verificação)_
  - _Requirements: 5.3_

- [ ] 20. Auditar regimes de renderização e build limpo
  - Files: nenhum (verificação)
  - `rm -rf .next && npm run build`: `/`, `/catalogo`, `/produtos/[handle]`
    com Revalidate `5m`; `/sobre-nos` `○` sem Revalidate; linha `ƒ Proxy`
    presente
  - `npx tsc --noEmit` limpo
  - Build **sem `.env.local`** (renomear temporariamente) deve passar
  - Purpose: fechar as portas de regressão silenciosa do projeto
  - _Requirements: 2.1, 2.2, 2.3_

- [ ] 21. 🧑 **HUMANO** — Teste E2E real: pedido com `?ref=` → `afiliado_ref` no pedido Shopify
  - Files: nenhum (verificação em produção/preview)
  - ⚠️ **Não executável por agente**: exige pedido real com pagamento e acesso
    ao admin da Shopify. Um executor automático deve **parar aqui e pedir ao
    usuário** — nunca preencher a evidência sem o pedido ter existido
  - Visitar `https://ta-hora-loja.vercel.app/?ref=<CODIGO_REAL_8_CHARS>`,
    adicionar item, concluir um **pedido de teste** no checkout
  - No admin da Shopify, abrir o pedido e confirmar
    `afiliado_ref = <CODIGO_REAL>` nos **note_attributes** (seção de
    informações adicionais do pedido)
  - Registrar o número do pedido usado como evidência no fim deste
    `tasks.md`
  - Purpose: a prova de que o webhook de afiliados vai creditar — o objetivo
    da spec
  - _Requirements: 5.1_

- [ ] 22. Auditar regressão do fluxo de compra sem `?ref=`
  - Files: nenhum (verificação)
  - Sessão limpa (sem cookie `tahora_ref`): adicionar, alterar quantidade,
    remover, cupom válido, cupom inválido (aviso aparece), carrinho expirado
    (recriação silenciosa), voltar do checkout pelo botão Back (bfcache),
    finalizar
  - Nenhuma mutation de attributes deve aparecer em nenhum desses passos
  - Purpose: a garantia do Req 4.3 — a venda ficou intocada
  - _Requirements: 3.6, 4.3_

- [ ] 23. Registrar a dependência do dashboard de afiliados
  - File: `.claude/specs/rastreamento-afiliados/DEPENDENCIA-DASHBOARD.md` (novo)
  - Documentar: o dashboard do **projeto Afiliados** (separado) gera links
    para o domínio Shopify; precisa passar a gerar
    `https://ta-hora-loja.vercel.app/?ref=<CODIGO>` (depois `tahora.com.br`)
  - Sem isso, os links distribuídos hoje **não passam pelo `proxy.ts`** e a
    atribuição não acontece, por mais correta que esteja a loja
  - Incluir o formato exato do link e o contrato do código (8 chars
    maiúsculos)
  - Purpose: fechar o loop com o único pedaço que não está nesta spec
  - _Requirements: (fora de escopo — dependência registrada)_

---

## Evidências (preencher durante a execução)

- Operações validadas no Dev MCP (2026-01): _(tarefa 10)_
- Pedido de teste com `afiliado_ref`: _(tarefa 21 — nº do pedido)_
- Saída do build com os regimes: _(tarefa 20)_
