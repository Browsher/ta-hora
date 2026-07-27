# Requirements Document — Ficha Técnica (Especificações do produto)

## Introduction

Adicionar uma seção **"Especificações técnicas"** à página de produto
(`/produtos/[handle]`) da loja **Ta Hora** (câmeras de segurança; Next.js 16 App
Router + Shopify Storefront API 2026-01). A seção aparece em **largura total,
centralizada**, **entre** o bloco de duas colunas (galeria+compra / descrição) e
a seção **"Você também pode gostar"** (recomendados) — mesmo nível de irmã do
`<article>`, nunca um terceiro filho do grid.

A ficha tem **dois níveis de leitura**:

- **Principais** — as specs decisivas de uma câmera (resolução, visão noturna,
  resistência, áudio, conexão, detecção, etc.) em **cards com ícone** (grid ~3
  colunas no desktop, gradiente da loja, ícone dourado + rótulo + valor).
- **Secundárias** — o restante numa lista discreta **"Mais detalhes"** (2 colunas,
  texto menor/apagado, sem ícone, no formato `rótulo → valor`).

Os dados vêm de **~21 metafields `custom.*`** já preenchidos nas 7 câmeras. A
loja **já tem a fundação**: o tipo `Spec`, a query com `metafields(identifiers:)`
e a normalização que **omite metafields ausentes/nulos** existem
(`lib/shopify/specs.ts`, `queries.ts`, `normalize.ts`). Esta feature (a) descobre
e confirma as **chaves reais** na loja, (b) **expande** o mapa de specs de 3
placeholders para as ~21 reais **com tier (principal/secundária), rótulo e
ícone**, e (c) **renderiza** a seção — que hoje não é montada na página (o
`ProductSpecs.tsx` existente está órfão).

## Alignment with Product Vision

- **Segmento correto (câmeras — product.md):** as specs em destaque são as que
  decidem a compra de uma câmera de segurança (resolução, visão noturna, conexão,
  resistência), refletindo o vocabulário de vigilância — não iluminação.
- **Reuso sobre reinvenção (structure.md):** aproveita a camada existente
  `lib/shopify/*` (`Spec`, `SPEC_METAFIELDS`, `metafields(identifiers:)`,
  `normalizeProduct` que já descarta ausentes), os primitivos `components/ui/*`, o
  ícone **`lucide-react`** (dependência já instalada) e o padrão de seção-irmã
  server-only de `RecomendadosRelacionados`.
- **Regime de renderização preservado (tech.md):** `/produtos/[handle]` permanece
  **ISR 300s**; a Home e `/sobre-nos` permanecem `○ Static`; o token permanece
  **server-only**. A seção é **Server Component** (sem componente de cliente novo).
- **A Shopify é a fonte da verdade:** os valores exibidos são os textos crus dos
  metafields — a UI não interpreta, converte nem calcula nada.

## Requirements

### Requirement 1 — Posição e envelope da seção

**User Story:** Como comprador de câmera, quero ver as especificações técnicas
logo abaixo da área de compra e da descrição, para conferir os detalhes decisivos
antes de olhar produtos relacionados.

#### Acceptance Criteria

1. WHEN a página `/produtos/[handle]` renderiza no servidor E o produto tem ao
   menos uma spec preenchida THEN o sistema SHALL exibir a seção "Especificações
   técnicas" **entre** o `<article>` de compra/descrição e a seção
   `RecomendadosRelacionados`, como **irmã** de ambos (nunca dentro do grid de 2
   colunas).
2. WHEN a seção é exibida THEN o sistema SHALL usar **largura total centralizada**
   no mesmo container da loja (max-width ~1200px, padding lateral responsivo),
   no padrão das demais seções-irmãs (`recomendados-secao`).
3. WHEN a seção é exibida THEN o sistema SHALL apresentar um cabeçalho `<h2>`
   "Especificações técnicas" com o mesmo `Heading` (`--cor-*`/`accentColor`) das
   outras seções da página de produto.
4. WHEN o produto tem descrição E quando não tem THEN o sistema SHALL posicionar a
   seção corretamente em **ambos** os layouts (`produto-grid` e `produto-unico`),
   pois ela é irmã do `<article>` — não depende do número de colunas do grid.

### Requirement 2 — Nível PRINCIPAL: cards com ícone

**User Story:** Como comprador, quero ver as specs mais importantes em cards com
ícone, para bater o olho e entender rapidamente as capacidades da câmera.

#### Acceptance Criteria

1. WHEN a seção renderiza as specs **principais** presentes THEN o sistema SHALL
   exibi-las como **cards** em grade (~3 colunas no desktop, colapsando para
   1–2 no mobile sem scroll horizontal).
2. WHEN um card é exibido THEN o sistema SHALL conter, nesta ordem: **ícone**
   (dourado `--cor-destaque`), **rótulo** da spec e **valor** da spec.
3. WHEN o card é estilizado THEN o sistema SHALL usar o gradiente de card da loja
   (`--cor-card` = `linear-gradient(160deg,#1c1508,#110e06)`) e a paleta `--cor-*`,
   sem hex hard-coded que ignore o tema.
4. WHEN uma spec principal está **ausente/vazia** para a câmera THEN o sistema
   SHALL **não renderizar** o card dela (sem card vazio, sem placeholder `—`).
5. WHEN a ordem dos cards é definida THEN o sistema SHALL seguir a **ordem
   declarada no mapa de specs** (não a ordem de chegada da API), para que a
   hierarquia visual seja estável entre produtos.
6. IF nenhuma spec **principal** está presente mas há specs secundárias THEN o
   sistema SHALL **omitir a grade de cards** e ainda assim renderizar a seção com
   a lista "Mais detalhes" (sem grade órfã nem título de subseção vazio).

### Requirement 3 — Nível SECUNDÁRIO: lista "Mais detalhes"

**User Story:** Como comprador técnico, quero ver o restante das especificações
numa lista compacta, para consultar detalhes finos sem que eles poluam os cards
principais.

#### Acceptance Criteria

1. WHEN há specs **secundárias** presentes THEN o sistema SHALL exibi-las numa
   lista sob um rótulo **"Mais detalhes"**, em **2 colunas** no desktop
   (colapsando para 1 no mobile), texto **menor e mais apagado**
   (`--cor-texto-secundario`/`--cor-texto-fraco`), **sem ícone**, no formato
   `rótulo → valor`.
2. WHEN uma spec secundária está **ausente/vazia** THEN o sistema SHALL **não
   renderizar** a linha dela (sem linha vazia, sem `—`).
3. WHEN a lista secundária é montada THEN o sistema SHALL usar marcação semântica
   de pares (ex.: `<dl>/<dt>/<dd>`), preservando acessibilidade.
4. WHEN a ordem das linhas é definida THEN o sistema SHALL seguir a **ordem
   declarada no mapa de specs**.
5. IF há specs principais mas **nenhuma** secundária THEN o sistema SHALL **omitir
   a subseção "Mais detalhes"** por completo (sem título órfão).
6. WHEN a lista aparece THEN o sistema SHALL exibi-la **direto** (sem "ver
   mais/ver menos" interativo — fora de escopo).

### Requirement 4 — Specs vazias somem; seção some quando não há nenhuma

**User Story:** Como comprador, quero nunca ver um campo de especificação vazio ou
com "—", para que a ficha pareça sempre completa e confiável.

#### Acceptance Criteria

1. WHEN um metafield vem ausente, `null` ou string vazia/só espaços THEN o sistema
   SHALL tratá-lo como **ausente** e **não** gerar card nem linha para ele.
2. IF o produto **não tem nenhuma** spec preenchida (principal ou secundária) THEN
   o sistema SHALL **não renderizar a seção inteira** — nem título, nem
   container, nem espaço — exatamente como `RecomendadosRelacionados` some com
   lista vazia.
3. WHEN diferentes câmeras têm subconjuntos diferentes de specs THEN o sistema
   SHALL renderizar **apenas as presentes** em cada uma, sem quebra de layout
   (grade e lista se adaptam à quantidade real).

### Requirement 5 — Dados: ler ~21 metafields de forma aditiva e validada

**User Story:** Como desenvolvedor, quero ler todos os metafields de spec numa
única query aditiva, para alimentar a ficha sem quebrar a página de produto nem
adicionar requisições.

#### Acceptance Criteria

1. WHEN a query `PRODUCT_BY_HANDLE_QUERY` é usada THEN o sistema SHALL buscar os
   ~21 metafields via `metafields(identifiers: [...])` de forma **aditiva**,
   preservando os campos existentes (`id`, `handle`, `title`, `descriptionHtml`,
   `tags`, `images`, `priceRange`, specs atuais) e mantendo **uma única
   requisição** por página (sem N+1).
2. WHEN os identifiers são montados THEN o sistema SHALL derivá-los do **mapa
   único de specs** (`lib/shopify/specs.ts`), como já faz `SPEC_METAFIELD_IDENTIFIERS`
   — adicionar uma spec ao mapa a inclui automaticamente na query.
3. WHEN a query alterada é escrita THEN o sistema SHALL validá-la contra o schema
   **Storefront API 2026-01** via Dev MCP antes de considerar a tarefa concluída,
   e confirmar que a contagem de identifiers está dentro do limite da API.
4. WHEN as chaves dos metafields são usadas THEN o sistema SHALL **confirmar as
   chaves reais contra a loja** (namespace `custom`, keys no padrão
   `<nome_com_underscores>`, sem acento, `ç`→`c`) antes de depender delas — mesma
   lição de `eseecloud`/`custom.resumo` (uma chave divergente faz a spec sumir em
   silêncio). O namespace placeholder atual (`"specs"`) **será corrigido** para o
   real.
5. WHEN um metafield vem ausente/vazio THEN o sistema SHALL normalizá-lo como
   ausente (a `Spec` não é gerada), sem lançar erro — comportamento já existente
   em `normalizeProduct` a ser preservado.
6. WHEN os valores são exibidos THEN o sistema SHALL usar o **texto cru** do
   metafield (a Shopify é a fonte), sem conversão de unidade nem cálculo na UI.

### Requirement 6 — Mapa de specs organizado (tier + rótulo + ícone), proposto e aprovado

**User Story:** Como mantenedor, quero um único lugar declarando cada spec com seu
tier, rótulo e ícone, para que a divisão principal/secundária e os ícones vivam
organizados e não espalhados pela UI.

#### Acceptance Criteria

1. WHEN o mapa de specs é definido THEN o sistema SHALL declarar, para cada spec,
   ao menos: `namespace`, `key`, `label` (pt-BR), `tier` (`principal` |
   `secundaria`) e, para as principais, um `icon` (`lucide-react`).
2. WHEN uma spec principal não tem um ícone óbvio THEN o sistema SHALL usar um
   **ícone genérico de fallback** declarado (nunca card principal sem ícone).
3. WHEN o mapa é a fonte da verdade THEN o sistema SHALL derivar dele **tanto** os
   identifiers da query **quanto** a ordem/agrupamento da UI, sem duplicar a lista
   de specs em outro arquivo.
4. WHEN os rótulos de exibição são definidos THEN o sistema SHALL mantê-los
   **desacoplados** da key do metafield (a key é `custom.visao_noturna`; o rótulo
   é "Visão noturna") — precedente de `ROTULO_MARCA`.

> **Nota de processo (não é critério de sistema):** a divisão
> principal/secundária e o ícone de cada spec principal são **propostos pelo
> Claude Code e revisados/aprovados pelo usuário** antes de serem fixados. A
> proposta e a decisão aprovada ficam registradas no `design.md`.

### Requirement 7 — Server-side, sem componente de cliente novo

**User Story:** Como desenvolvedor, quero a ficha renderizada no servidor sem
arrastar a camada de dados para o cliente, para manter o token server-only e o
bundle enxuto.

#### Acceptance Criteria

1. WHEN a seção é implementada THEN o sistema SHALL fazê-la como **Server
   Component** (sem `"use client"`), no padrão de `RecomendadosRelacionados`
   (server, folha, sem estado/efeito/hook).
2. WHEN os ícones são usados THEN o sistema SHALL importar do `lucide-react`
   componentes que renderizam em Server Component (SVG sem hooks), sem introduzir
   fronteira de cliente.
3. WHEN a UI consome tipos da camada Shopify THEN o sistema SHALL usar **apenas
   tipos** onde aplicável e **nunca** importar módulos `server-only` fora do
   servidor — o build falha se ocorrer.
4. WHEN a página é renderizada no servidor (ISR) THEN o sistema SHALL incluir a
   ficha completa no **HTML inicial** (indexável, sem depender de JS de cliente).

### Requirement 8 — Não quebrar a página de produto (regressão)

**User Story:** Como mantenedor, quero que a ficha não afete o layout de compra, o
botão, os acessórios, os recomendados, o sticky, a descrição nem o regime de
build, para evitar regressões silenciosas.

#### Acceptance Criteria

1. WHEN a feature é concluída THEN o sistema SHALL preservar o layout de compra
   (`produto-grid`/`produto-unico`), a coluna esquerda **sticky**, a galeria, o
   `PriceTag`, o `BotaoAdicionar` (drawer + acessórios sugeridos) e a descrição —
   sem alteração de comportamento.
2. WHEN a feature é concluída THEN o sistema SHALL manter a seção
   `RecomendadosRelacionados` funcionando **abaixo** da ficha (ordem: compra →
   ficha → recomendados).
3. WHEN a query e os tipos mudam THEN o sistema SHALL preservar o **catálogo**, os
   **acessórios** e os **recomendados**, que compartilham a camada Shopify
   (mudanças aditivas; `normalizeProduct` continua o único caminho).
4. WHEN `npm run build` roda **sem `.env.local`** THEN o sistema SHALL continuar
   concluindo o build (a página degrada para erro amigável em runtime).
5. WHEN o build é executado THEN o sistema SHALL manter `/` e `/sobre-nos` como
   **`○ Static`** e `/catalogo` e `/produtos/[handle]` em **ISR** (nenhuma
   migração acidental de regime); `npx tsc --noEmit` limpo.
6. WHEN a Shopify falha ou os metafields não vêm THEN o sistema SHALL degradar
   graciosamente (seção some / cards ausentes), sem vazar token/endpoint e sem
   derrubar a página que vende.

## Non-Functional Requirements

### Performance
- **Uma requisição** por página de produto (os metafields entram nos
  `identifiers` da query existente — sem N+1, sem busca por spec).
- Sem componente de cliente novo → **zero JS adicional** no bundle além dos SVGs
  de ícone (que são markup estático no HTML server-rendered).

### Security
- Token **server-only** (`SHOPIFY_STOREFRONT_TOKEN`), nunca `NEXT_PUBLIC_`.
  Nenhuma mensagem de erro interpola token/endpoint. Após o build, token/domínio
  não aparecem em `.next/static`.

### Reliability
- Degradação graciosa: metafield ausente → sem card/linha; nenhuma spec → sem
  seção; Shopify offline → página de erro amigável já existente.
- A chave dos metafields é **confirmada contra a loja real** por um check dedicado
  no padrão `verificar:*` (fora do `npm run build`, que passa sem `.env.local`) —
  mesma disciplina de `verificar:marcas`/`verificar:resumo`.

### Usability
- pt-BR em todo texto de UI, rótulos, comentários e nomes de domínio.
- Cards com alvos/leitura confortáveis no mobile; **sem scroll horizontal** em
  nenhuma largura; grade e lista se adaptam à quantidade real de specs.
- Hierarquia acessível: `<h2>` da seção, subrótulo "Mais detalhes", pares
  semânticos na lista; ícones **decorativos** (não anunciados como conteúdo a
  leitores de tela — o rótulo textual carrega o significado).

## Fora de escopo (desta spec)
- Os **iconezinhos de destaque no CATÁLOGO** (`/catalogo`) — spec futura separada.
- **Editar/preencher** os metafields no admin (já preenchidos; é trabalho de
  admin, não de código).
- **"Ver mais / ver menos"** interativo na lista secundária (ela aparece direto).
- Conversão/normalização de **unidades** ou parsing dos valores (exibe o texto cru
  da Shopify).
- Ícones **por câmera** ou por valor (o ícone é por **tipo de spec**, do mapa).
