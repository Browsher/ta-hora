# Requirements Document

## Introduction

A marca tem um **sistema de afiliados** (projeto separado, já pronto) que credita
comissões lendo um webhook de pedido da Shopify: quando o pedido chega com o
`note_attribute` **`afiliado_ref`** contendo um código válido, a venda é
atribuída ao afiliado dono do código. No fluxo antigo (tema Shopify), um snippet
(`tahora-attribution.js`) fazia essa ponte. A loja agora é **headless**
(site-ta-hora, deployada em `https://ta-hora-loja.vercel.app/`), então essa
ponte não existe — **vendas indicadas por afiliados hoje não são creditadas**.

Esta feature replica o mecanismo na loja headless: capturar `?ref=CODIGO` da
URL, persistir num cookie de 30 dias (last-touch) e injetar o código como cart
attribute `afiliado_ref` via Storefront API, para que ele chegue ao pedido como
`note_attribute` e o webhook credite o afiliado.

### Contrato com o sistema de afiliados (fixo, confirmado por investigação)

Este contrato é **externo à spec** — o webhook já está em produção e não será
alterado. A loja DEVE se conformar a ele:

| Item | Valor |
|---|---|
| Chave do attribute | `afiliado_ref` — literal, minúsculo, underscore, **SEM prefixo `__`** (atributos ocultos com `__` têm histórico de não chegar ao webhook de pedido) |
| Valor | 8 caracteres alfanuméricos **MAIÚSCULOS** — regex do webhook: `^[A-Z0-9]{8}$`, **case-sensitive** (minúsculo é ignorado; a loja DEVE normalizar para maiúsculo antes de enviar) |
| Attribute opcional | `afiliado_ref_ts` (timestamp ms) — o webhook ignora; enviar é permitido, não obrigatório |
| Ref inválido/ausente no pedido | O webhook ignora silenciosamente (responde 200, sem atribuição) — **não quebra o pedido** |
| Transporte | Cart attribute via Storefront API → vira `note_attributes` no pedido automaticamente |

## Alignment with Product Vision

O `product.md` define a loja headless como **canal de venda direto** que a marca
vai crescer (prioridade 1: loja e-commerce). O programa de afiliados é um motor
de aquisição desse canal: afiliados divulgam links da loja e são comissionados
por venda. Sem este rastreamento, todo tráfego de afiliado que compra no site
próprio fica **sem crédito** — o que desincentiva os afiliados a divulgarem
justamente o canal que a marca quer crescer. A feature também respeita dois
princípios do produto: **a Shopify é a fonte da verdade comercial** (a atribuição
viaja dentro do pedido Shopify, o site não calcula comissão) e o **caminho da
compra é sagrado** (falha de rastreamento nunca pode impedir uma venda).

## Requirements

### Requirement 1 — Captura do `?ref=` na URL

**User Story:** Como afiliado, quero que meu link
`https://ta-hora-loja.vercel.app/?ref=MEUCOD01` marque a visita do cliente em
qualquer página da loja, para que a compra dele seja atribuída a mim mesmo que
ele navegue e só compre depois.

#### Acceptance Criteria

1. WHEN um visitante chega a **qualquer rota** do site com query param `ref`
   cujo valor, **após normalização para MAIÚSCULAS**, casa com `^[A-Z0-9]{8}$`
   THEN o sistema SHALL persistir o valor normalizado no cookie `tahora_ref`
   com `Max-Age` de 30 dias, `SameSite=Lax`, `Secure` (em produção) e
   `Path=/`.
2. WHEN o valor de `ref` (após normalização) NÃO casa com `^[A-Z0-9]{8}$`
   (vazio, tamanho errado, caracteres inválidos) THEN o sistema SHALL ignorar
   o param sem gravar cookie, sem erro visível e sem afetar a navegação.
3. WHEN um visitante que JÁ possui cookie `tahora_ref` chega com um novo
   `?ref=` válido THEN o sistema SHALL sobrescrever o cookie com o novo código
   (**last-touch**: o último afiliado a indicar leva a atribuição).
4. WHEN um visitante que já possui cookie `tahora_ref` chega com `?ref=`
   inválido ou sem `?ref=` THEN o sistema SHALL preservar o cookie existente
   intacto (valor e expiração vigentes).
5. WHEN o `ref` é capturado THEN o sistema SHALL remover o param `ref` da URL
   vista pelo usuário (barra de endereço e histórico), preservando o path e os
   demais query params.
6. IF o visitante recusa/bloqueia cookies ou o cookie expira antes da compra
   THEN o sistema SHALL seguir funcionando normalmente sem atribuição (venda
   sem crédito, nunca venda quebrada).
7. WHEN a URL contém o param `ref` repetido (ex.: `?ref=AAAA0001&ref=BBBB0002`)
   THEN o sistema SHALL considerar apenas a **primeira** ocorrência (semântica
   padrão de `URLSearchParams.get`) e ignorar as demais.

### Requirement 2 — Preservação dos regimes de renderização

**User Story:** Como dono da loja, quero que o rastreamento não altere o regime
de renderização das páginas (ISR/SSG), para que a performance e o
comportamento de cache do site continuem exatamente como estão.

#### Acceptance Criteria

1. WHEN a captura do `ref` é implementada THEN nenhuma `page.tsx` nem
   `app/layout.tsx` SHALL passar a ler `cookies()`/`headers()` no render — a
   captura acontece fora do render das rotas (ex.: middleware ou cliente
   pós-montagem, a decidir no design).
2. WHEN `npm run build` roda após a implementação THEN a saída SHALL mostrar
   `/`, `/catalogo` e `/produtos/[handle]` com ISR (coluna `Revalidate` = `5m`)
   e `/sobre-nos` como `○ Static` (coluna `Revalidate` vazia) — sem regressão
   silenciosa de regime.
3. IF a solução usar middleware THEN ele SHALL interferir apenas quando o
   param `ref` está presente na URL, sem adicionar processamento observável às
   demais requisições e sem quebrar o serving de assets/ISR.

### Requirement 3 — Injeção do `afiliado_ref` no carrinho

**User Story:** Como operador do programa de afiliados, quero que o código do
afiliado entre no carrinho Shopify como cart attribute `afiliado_ref`, para que
ele chegue ao pedido como `note_attribute` e o webhook credite a venda.

#### Acceptance Criteria

1. WHEN um visitante com cookie `tahora_ref` válido adiciona um item e NÃO há
   carrinho THEN o sistema SHALL criar o carrinho já com o attribute
   `afiliado_ref` = código (na própria mutation `cartCreate`, campo
   `attributes` do `CartInput`).
2. WHEN um visitante com cookie `tahora_ref` válido adiciona um item a um
   carrinho **preexistente** que não tem o attribute (ou o tem com valor
   diferente) THEN o sistema SHALL atualizar o carrinho via
   `cartAttributesUpdate` para refletir o código atual do cookie.
3. WHEN o carrinho expirado/finalizado é **recriado silenciosamente** durante
   um `adicionarItem` (fluxo existente em `lib/carrinho/acoes.ts:134-137`)
   THEN o novo carrinho SHALL nascer com o attribute `afiliado_ref` do cookie
   vigente (recarimbar — a atribuição não se perde na recriação).
4. WHEN o servidor vai injetar o attribute THEN ele SHALL revalidar o valor do
   cookie contra `^[A-Z0-9]{8}$` (após normalizar para maiúsculas) e SHALL
   descartar valores que não casam — o cookie é entrada do cliente e não é
   confiável (anti-injeção de atributo).
5. WHEN o attribute é enviado THEN a chave SHALL ser exatamente `afiliado_ref`
   (sem prefixo `__`) e o valor SHALL estar em MAIÚSCULAS, conforme o contrato
   do webhook.
6. IF o visitante NÃO tem cookie `tahora_ref` (ou o valor é inválido) THEN o
   fluxo de carrinho SHALL se comportar exatamente como hoje — sem attribute,
   sem mutation extra, sem mudança observável.
7. WHEN o attribute já está presente no carrinho com o MESMO valor do cookie
   THEN o sistema SHALL NOT disparar `cartAttributesUpdate` redundante (sem
   round-trip extra por operação de carrinho).
8. WHEN um visitante com carrinho **preexistente** recebe um novo `?ref=`
   válido e segue ao checkout **sem adicionar item novo** THEN o attribute do
   carrinho SHALL refletir o código mais recente antes do checkout
   (last-touch não pode depender só do evento "adicionar item" — o ponto
   exato de sincronização, ex.: na leitura do carrinho ao abrir o drawer, é
   decisão do design).
9. WHEN o attribute é enviado THEN o sistema SHALL NOT enviar o attribute
   opcional `afiliado_ref_ts` — o webhook o ignora, e omiti-lo reduz
   superfície e ruído no pedido (decisão desta spec; reversível).

### Requirement 4 — A venda nunca quebra por causa do rastreamento

**User Story:** Como dono da loja, quero que qualquer falha do rastreamento de
afiliados seja silenciosa, para que o caminho da compra (adicionar ao carrinho
→ checkout) nunca seja bloqueado por uma feature acessória.

#### Acceptance Criteria

1. IF a mutation `cartAttributesUpdate` falha (rede, Shopify fora, userError)
   THEN o sistema SHALL prosseguir com a operação de carrinho normalmente,
   sem erro visível ao cliente — o pior caso é "venda sem crédito", nunca
   "venda perdida".
2. IF a inclusão de `attributes` no `cartCreate` falhar por qualquer motivo de
   validação THEN a criação do carrinho SHALL continuar funcionando (fallback:
   criar sem attribute em vez de não criar).
3. WHEN o rastreamento está implementado THEN todos os fluxos existentes do
   carrinho (adicionar, atualizar quantidade, remover, cupom, checkout) SHALL
   continuar passando sem regressão — nenhuma action existente passa a lançar
   ou a devolver erro novo.
4. WHEN mensagens de erro/log são produzidas pelo código novo THEN elas SHALL
   seguir o padrão existente: nunca interpolar token, endpoint ou strings
   cruas da Shopify.

### Requirement 5 — Verificação de ponta a ponta (pedido real)

**User Story:** Como operador do programa de afiliados, quero prova de que o
código chega ao pedido na Shopify, para ter certeza de que o webhook vai
creditar as vendas reais.

#### Acceptance Criteria

1. WHEN um pedido de teste é concluído a partir de uma visita com
   `?ref=CODIGO` válido THEN o pedido na Shopify SHALL exibir
   `afiliado_ref` = `CODIGO` em `note_attributes` (verificável no admin da
   Shopify ou via API).
2. WHEN as queries/mutations novas ou alteradas são escritas THEN elas SHALL
   ser validadas contra o schema da Storefront API **2026-01** via Shopify Dev
   MCP (forma do `attributes: [AttributeInput!]` no `CartInput` e da mutation
   `cartAttributesUpdate`).
3. WHEN o carrinho é criado/atualizado com o attribute em dev THEN a resposta
   da Storefront API SHALL confirmar o attribute presente no objeto `cart`
   (verificação intermediária antes do teste de pedido completo).

## Fora do escopo (registrado como dependência)

- **Link do dashboard de afiliados** (projeto Afiliados, separado): hoje o
  dashboard gera links apontando para o domínio Shopify. Precisa passar a
  gerar `https://ta-hora-loja.vercel.app/?ref=` (futuramente
  `tahora.com.br`). Sem isso, os links novos continuam caindo fora da loja
  headless. **Ação registrada para o projeto Afiliados — não é tarefa desta
  spec.**
- **Webhook / crédito da comissão**: já pronto no projeto Afiliados; não se
  altera aqui.
- **Polling de re-sincronização** (o snippet original re-aplicava o attribute
  10x porque temas Shopify o limpavam): na headless o carrinho é controlado
  exclusivamente pela Storefront API da própria loja — a premissa é que o
  attribute persiste. O design deve confirmar essa premissa; polling só entra
  se ela cair.

## Non-Functional Requirements

### Performance

- A captura do `ref` não adiciona latência perceptível às rotas sem `?ref=`
  (o caminho comum é intocado).
- A injeção do attribute não adiciona round-trip à Shopify quando não há ref
  (Req 3.6) nem quando o attribute já está correto (Req 3.7). Quando há
  atualização a fazer, no máximo **1** mutation extra por operação de
  carrinho.
- Os regimes ISR/SSG existentes são preservados (Req 2.2) — a feature não
  muda o modelo de build.

### Security

- O valor do cookie `tahora_ref` é tratado como **entrada não confiável**:
  validação server-side `^[A-Z0-9]{8}$` antes de qualquer injeção (Req 3.4).
- Nenhum código novo expõe `SHOPIFY_STOREFRONT_TOKEN` nem importa módulos
  `server-only` em componentes de cliente (padrão vigente mantido).
- O cookie `tahora_ref` não carrega dado pessoal — apenas o código público do
  afiliado.

### Reliability

- Falha de rastreamento é sempre silenciosa e não-bloqueante (Req 4.1, 4.2);
  o fluxo de compra tem prioridade absoluta.
- Sem cookie/ref, o comportamento do site é **byte a byte** o atual (Req 3.6).
- `npm run build` continua passando sem `.env.local` (padrão do projeto).

### Usability

- A URL fica limpa após a captura (Req 1.5) — o cliente não vê nem compartilha
  o `?ref=` de outra pessoa (compartilhar a URL limpa não propaga a atribuição
  do afiliado original para terceiros, o que também protege o last-touch).
- Nada da mecânica de afiliados aparece na UI do cliente — a feature é
  invisível para quem compra.
