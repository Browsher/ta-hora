# Requirements Document — Catálogo Consultivo

## Introduction

Reformular a rota `/catalogo` da loja **Ta Hora** (câmeras de segurança; Next.js 16 App Router + Shopify Storefront API 2026-01), passando de uma **grade simples de cards** (`CatalogGrid` → `ProductCardLink`) para **blocos largos horizontais**, um por câmera, com um viés **consultivo**: cada bloco mostra foto, nome, **selo de marca** (EseeCloud/iCSee), um **resumo curto "pra quem é"** (metafield `custom.resumo`), preço e um botão "ver detalhes" que leva à página do produto.

Acrescenta um **filtro que REORDENA** (nunca esconde): "Todas" (padrão), "Melhor preço", "Mais recursos", "EseeCloud" e "iCSee". Ao clicar, os blocos correspondentes **sobem para o topo**; todos continuam visíveis. Isto preserva o SEO (o HTML do servidor lista todas as câmeras) e ainda dá interatividade útil ao comprador.

É o **primeiro componente de cliente de UI da loja além do carrinho**. A diretriz central é **mantê-lo leve**: a página busca TODAS as câmeras no servidor (com `custom.resumo` e as tags) e renderiza todas; o componente de cliente só guarda o estado do filtro e **reordena a lista já carregada** — sem re-busca, sem esconder, sem tocar no token.

## Alignment with Product Vision

- **Segmento correto (câmeras, não iluminação):** o resumo consultivo e o filtro por marca (EseeCloud/iCSee) refletem o vocabulário de segurança/vigilância — ver `.claude/steering/product.md` e a memória `ta-hora-categoria-e-build`.
- **SEO como requisito de produto:** o catálogo é a vitrine indexável; por isso o filtro reordena e **não** remove itens do DOM — o robô continua vendo as 7 câmeras.
- **Reuso sobre reinvenção (structure.md):** aproveita a camada `lib/shopify/*` (`getProducts`, `normalize`, `storefrontFetch`), as constantes de marca de `lib/shopify/tags.ts` (`eseecloud`/`icsee`, grafia já verificada — memória `ta-hora-tags-marca`), os primitivos `components/ui/*` e o `StoreShell` (chrome + paleta do site).
- **Regime de renderização preservado (tech.md):** `/catalogo` permanece **ISR 300s**; a Home e `/sobre-nos` permanecem `○ Static`; o token permanece **server-only**.

## Requirements

### Requirement 1 — Blocos largos horizontais por câmera

**User Story:** Como comprador de câmera, quero ver cada modelo num bloco largo com foto, nome, marca, um resumo "pra quem é" e o preço, para entender rapidamente se aquela câmera serve para o meu caso sem abrir a página de cada uma.

#### Acceptance Criteria

1. WHEN a página `/catalogo` renderiza no servidor THEN o sistema SHALL exibir **um bloco largo horizontal por câmera** contendo, nesta ordem de leitura: imagem, nome, selo de marca, resumo, preço e botão "ver detalhes".
2. WHEN o bloco é exibido em desktop (largura ≥ ~768px) THEN o sistema SHALL dispor imagem à esquerda e conteúdo textual à direita (layout horizontal), dentro do container de 1200px centralizado.
3. WHEN o bloco é exibido em telas estreitas (mobile) THEN o sistema SHALL colapsar para uma coluna (imagem no topo, conteúdo abaixo) sem scroll horizontal da página.
4. WHEN o botão "ver detalhes" é acionado THEN o sistema SHALL navegar para `/produtos/{handle}` da câmera correspondente.
5. IF uma câmera não possui `custom.resumo` preenchido THEN o sistema SHALL renderizar o bloco **sem a linha de resumo** (sem placeholder, sem espaço órfão), mantendo os demais elementos.
6. IF uma câmera não possui imagem (`featuredImage` nulo) THEN o sistema SHALL usar o mesmo fallback de imagem já adotado pela loja (`ImageSlot` sem `src`), sem quebrar o layout do bloco.
7. WHEN o bloco exibe o preço THEN o sistema SHALL usar o `PriceTag` com o preço **formatado pela Shopify/`formatMoney`** (pt-BR), nunca recalculado na UI.

### Requirement 2 — Selo de marca (EseeCloud / iCSee)

**User Story:** Como comprador, quero identificar a marca de cada câmera por um selo visível, para reconhecer o ecossistema/app (EseeCloud ou iCSee) a que ela pertence.

#### Acceptance Criteria

1. WHEN a marca da câmera é resolvida a partir das tags THEN o sistema SHALL usar **exclusivamente** a função `marcaDoProduto()` e as constantes de `lib/shopify/tags.ts` (`eseecloud` com dois "e", `icsee`) — nunca inferir por título, handle ou coleção.
2. WHEN a marca é `eseecloud` THEN o sistema SHALL exibir o rótulo **"EseeCloud"**; WHEN a marca é `icsee` THEN o sistema SHALL exibir **"iCSee"** (rótulos de exibição desacoplados da grafia da tag).
3. IF uma câmera não possui nenhuma tag de marca conhecida THEN o sistema SHALL renderizar o bloco **sem selo de marca**, sem erro e sem afetar o filtro por marca.
4. WHEN o selo é estilizado THEN o sistema SHALL usar as variáveis de tema `--cor-*` (destaque dourado `#D4A017`), sem hex hard-coded que ignore a paleta.

### Requirement 3 — Filtro que REORDENA (não esconde)

**User Story:** Como comprador, quero clicar em um filtro e ver as câmeras mais relevantes subirem para o topo, sem que nenhuma câmera desapareça, para comparar por preço ou marca sem perder as demais opções de vista.

#### Acceptance Criteria

1. WHEN a página carrega THEN o sistema SHALL exibir o filtro **"Todas"** selecionado por padrão, com os blocos na ordem retornada pelo servidor.
2. WHEN o usuário seleciona um filtro THEN o sistema SHALL **reordenar** a lista já carregada de modo que os blocos correspondentes fiquem no topo, **mantendo todos os demais blocos visíveis abaixo** (nenhum bloco é removido do DOM).
3. WHEN o filtro **"Melhor preço"** é selecionado THEN o sistema SHALL ordenar todos os blocos por **preço real crescente** (menor primeiro), usando o valor numérico do preço da Shopify — **sem depender de tag**; em caso de **empate de preço**, SHALL manter a ordem original do servidor (ordenação estável).
4. WHEN o filtro **"Mais recursos"** é selecionado THEN o sistema SHALL trazer para o topo as câmeras com a tag `mais-recursos`, preservando as demais abaixo.
5. WHEN o filtro **"EseeCloud"** é selecionado THEN o sistema SHALL trazer para o topo as câmeras da marca `eseecloud`; WHEN **"iCSee"** é selecionado THEN o sistema SHALL trazer para o topo as câmeras da marca `icsee`.
6. WHEN um filtro que particiona por tag/marca é aplicado ("Mais recursos", "EseeCloud", "iCSee") THEN o sistema SHALL manter a **ordem original relativa** dentro de cada grupo (ordenação estável — primeiro os que casam, depois os que não casam, cada grupo na ordem do servidor).
7. WHEN o usuário volta para **"Todas"** THEN o sistema SHALL restaurar a **ordem original** entregue pelo servidor.
8. WHEN qualquer filtro é aplicado THEN o sistema SHALL indicar visualmente qual filtro está ativo (estado selecionado no controle).
9. WHEN a reordenação ocorre THEN o sistema SHALL fazê-la **sem nova requisição de rede** (nenhuma chamada à Shopify no clique) e **sem re-montar** os blocos de imagem de forma a recarregá-las.
10. WHEN a barra de filtros é navegada por teclado THEN o sistema SHALL permitir **foco e ativação** de cada opção via Tab/Enter/Space, com o filtro ativo anunciado a leitores de tela (ex.: `aria-pressed`/estado selecionado).

### Requirement 4 — SEO: todas as câmeras no HTML do servidor

**User Story:** Como responsável pelo SEO da loja, quero que todas as câmeras apareçam no HTML renderizado no servidor, para que os buscadores indexem o catálogo inteiro independentemente de interação do usuário.

#### Acceptance Criteria

1. WHEN a página é renderizada no servidor (ISR) THEN o sistema SHALL incluir **todos** os blocos de câmera no HTML inicial, com seus links `/produtos/{handle}`, resumos e marcas — antes de qualquer hidratação de cliente.
2. WHEN o JavaScript de cliente está desabilitado THEN o sistema SHALL ainda exibir todas as câmeras (a interatividade do filtro é um aprimoramento progressivo; a lista permanece completa e navegável).
3. WHEN o filtro reordena THEN o sistema SHALL **nunca** aplicar `display:none`/desmontagem que remova câmeras do documento — apenas reordenar.
4. WHEN a marcação semântica é gerada THEN o sistema SHALL usar um `<h1>` para o título do catálogo e cabeçalho apropriado por bloco (nome do produto como link), preservando a hierarquia acessível.

### Requirement 5 — Dados: query aditiva com `custom.resumo` e tags

**User Story:** Como desenvolvedor, quero adicionar `custom.resumo` e `tags` à query do catálogo de forma aditiva, para alimentar o resumo, o selo de marca e o filtro sem quebrar o catálogo atual nem outras páginas.

#### Acceptance Criteria

1. WHEN a query do catálogo (`PRODUCTS_QUERY`) é estendida THEN o sistema SHALL adicionar os campos `tags` e o metafield `custom.resumo` de forma **aditiva**, preservando os campos existentes (`id`, `handle`, `title`, `featuredImage`, `priceRange`).
2. WHEN a query estendida é escrita THEN o sistema SHALL validá-la contra o schema **Storefront API 2026-01** via Dev MCP antes de considerar a tarefa concluída.
3. WHEN a chave do metafield de resumo é usada THEN o sistema SHALL confirmar a chave exata (`namespace: "custom"`, `key: "resumo"`) contra a **loja real** antes de depender dela — mesma lição do `eseecloud` (uma divergência de chave faz o resumo sumir em silêncio).
4. WHEN o metafield vem ausente ou vazio para uma câmera THEN o sistema SHALL normalizá-lo para "sem resumo" (string vazia ou `null`), sem lançar erro.
5. WHEN o `ProductCard` é estendido THEN o sistema SHALL adicionar os campos novos (`resumo`, `tags` — ou uma marca já resolvida) ao tipo, mantendo os consumidores existentes de `ProductCard` (ex.: `ProductCardLink`, acessórios, recomendados) **compilando e funcionando sem alteração obrigatória**.
6. WHEN a query é alterada THEN o sistema SHALL manter o custo em **uma única requisição** para o catálogo inteiro (sem N+1; sem busca por câmera).

### Requirement 6 — Componente de cliente leve (fronteira servidor/cliente)

**User Story:** Como desenvolvedor, quero que a interatividade do filtro seja um componente de cliente mínimo, para não arrastar a camada de dados server-only para o bundle nem inflar a página.

#### Acceptance Criteria

1. WHEN o componente de filtro é criado THEN o sistema SHALL torná-lo `"use client"` recebendo a **lista já normalizada** via props (`ProductCard[]`), importando de `lib/shopify/*` **apenas tipos** (`import type`).
2. WHEN o componente de cliente é implementado THEN o sistema SHALL restringir seu estado ao **filtro ativo** e derivar a ordem por uma função pura de ordenação — **sem** efeitos de rede, sem `fetch`, sem acesso a token/endpoint.
3. WHEN os módulos server-only são considerados THEN o sistema SHALL garantir que nenhum deles (`client.ts`, `queries.ts`, `products.ts`) seja importado pelo componente de cliente (o build falha se ocorrer).
4. WHEN o filtro reordena a lista THEN o sistema SHALL usar `key` estável por produto (`product.id`) para que o React reordene os nós existentes em vez de recriá-los.
5. WHEN a marca é necessária para filtrar/selo no cliente THEN o sistema SHALL usar `marcaDoProduto()`/constantes de `lib/shopify/tags.ts` (arquivo **sem** `server-only`, já compartilhado) ou uma marca pré-resolvida no servidor — nunca duplicando as grafias de marca no componente.

### Requirement 7 — Não quebrar o existente (regressão)

**User Story:** Como mantenedor, quero que a reforma do catálogo não afete o carrinho, a página de produto, a Home nem o regime de build, para evitar regressões silenciosas.

#### Acceptance Criteria

1. WHEN a feature é concluída THEN o sistema SHALL manter `/catalogo` em **ISR 300s** (`export const revalidate = 300` presente).
2. WHEN o build é executado THEN o sistema SHALL manter `/` e `/sobre-nos` como **`○ Static`** e `/produtos/[handle]` em **ISR** (nenhuma migração acidental de regime).
3. WHEN a query e os tipos são alterados THEN o sistema SHALL preservar o funcionamento de **acessórios sugeridos**, **produtos recomendados** e da **página de produto**, que também consomem `ProductCard`/camada Shopify.
4. WHEN `npm run build` roda **sem `.env.local`** THEN o sistema SHALL continuar concluindo o build (o catálogo degrada para estado de erro amigável em runtime, nunca quebra o build).
5. WHEN a Shopify está offline ou a busca falha em runtime THEN o sistema SHALL exibir o **mesmo estado de erro amigável** já usado hoje em `/catalogo`, sem vazar token/endpoint em mensagem.

### Requirement 8 — Estados de borda do catálogo

**User Story:** Como comprador, quero que a página se comporte de forma previsível quando há poucas ou nenhuma câmera, para nunca ver uma tela quebrada.

#### Acceptance Criteria

1. IF `getProducts()` retorna zero câmeras THEN o sistema SHALL exibir o estado "Nenhum produto disponível no momento." (equivalente ao atual) e **não** renderizar a barra de filtros.
2. IF existe apenas uma câmera THEN o sistema SHALL renderizar o bloco normalmente; a barra de filtros PODE aparecer, mas reordenar uma lista de 1 é no-op (sem erro).
3. IF nenhuma câmera tem a tag `mais-recursos` (ou nenhuma tem certa marca) THEN o sistema SHALL manter o filtro clicável, resultando em ordem inalterada (nenhum item sobe), sem estado de erro.

## Non-Functional Requirements

### Performance
- **Uma requisição** à Shopify para montar o catálogo inteiro (sem N+1). A reordenação no cliente é **O(n log n)** sobre ≤ ~100 itens (7 hoje) e não dispara rede.
- O componente de cliente deve ser **mínimo** (apenas estado do filtro + ordenação), sem bibliotecas novas; imagens não devem recarregar ao reordenar (`key` estável por `id`).
- Manter o payload de cliente enxuto: passar somente os campos que o bloco usa (o `ProductCard` estendido), não a resposta crua da Shopify.

### Security
- Token **server-only** em `process.env` (`SHOPIFY_STOREFRONT_TOKEN`), nunca `NEXT_PUBLIC_`. Componentes de cliente importam **apenas tipos**. Após o build, o token/domínio não aparecem em `.next/static` (critério herdado de `catalogo-loja`).
- Nenhuma mensagem de erro interpola token ou endpoint.

### Reliability
- Degradação graciosa: Shopify offline → estado de erro amigável; metafield/marca/imagem ausentes → o bloco renderiza o que tem, sem lançar. O build passa sem `.env.local`.
- A grafia de marca vive num único lugar (`lib/shopify/tags.ts`); a chave do metafield é confirmada contra a loja real (mesma disciplina do `verificar:marcas`).

### Usability
- pt-BR em todo texto de UI, comentários e nomes de domínio (structure.md).
- Filtro com estado ativo visível e alvos de toque adequados no mobile; a lista permanece completa e rolável em qualquer filtro.
- Acessibilidade: barra de filtros operável por teclado; se houver animação de reordenação, respeitar `prefers-reduced-motion` (o `StoreShell` **não** é coberto pelo `MotionConfig` do `PreviewContent` — ver tech.md).

## Fora de escopo (desta spec)
- Iconezinhos de spec no bloco (os metafields de spec já existem, mas ficam para uma spec futura).
- Ficha técnica completa na página de produto.
- Esconder/remover produtos no filtro (aqui o filtro **só reordena**).
- Guia por pergunta / quiz de recomendação.
- Paginação/scroll infinito (7 câmeras; `first: 100` já cobre).
