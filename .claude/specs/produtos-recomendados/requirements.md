# Requirements Document — Produtos Recomendados (produtos-recomendados)

## Introduction

Uma seção **"Você também pode gostar"** na página de produto
(`/produtos/[handle]`) da loja **Ta Hora**. Quando o cliente está numa câmera,
a seção mostra **até 4 outras câmeras da mesma marca**, em **grade fixa** (não
carrossel), **abaixo** do layout de 2 colunas (galeria+compra / descrição),
centralizada e ocupando a largura toda. Os cards ficam **sempre centralizados**
na largura do container — seja 1, 2, 3 ou 4 câmeras, nunca alinhados à esquerda
com vazio à direita.

O objetivo é comercial: **manter o cliente navegando dentro da própria marca** —
quem está numa câmera EsseCloud vê outras EsseCloud, quem está numa iCSee vê
outras iCSee. É descoberta de catálogo no momento em que a intenção é maior.

A identificação é por **tag de marca da Shopify**: cada câmera tem `eseecloud`
**ou** `icsee` (as duas marcas da loja). Na página, o sistema lê a tag de marca
do produto atual e busca **outras** câmeras com a **mesma** tag — nenhuma relação
produto-a-produto é necessária.

Esta spec **reaproveita quase tudo** do que já existe:

- O **padrão exato** de busca por tag da `acessorios-sugeridos`
  (`products(query: "tag:...")`, `first`, filtro `availableForSale` em JS,
  `server-only`).
- O card do catálogo `ProductCardLink` (a peça clicável que leva à página).
- O `Heading` da loja (título).
- A grade responsiva do catálogo (`CatalogGrid`).
- A própria página `/produtos/[handle]` (reformada na spec
  `layout-pagina-produto`) — que **já é Server Component com ISR 300s**.

O que ela acrescenta é: **`tags` na query do produto**, uma busca por tag de
marca, e uma seção server-only abaixo das colunas.

### A diferença de arquitetura em relação à `acessorios-sugeridos` (fundamenta tudo)

A `acessorios-sugeridos` é **client-side**: vive no `CarrinhoDrawer`, é disparada
por estado do cliente (`CarrinhoProvider`), e por isso precisou de Server Action,
`useEffect`, `useMemo` e um componente `"use client"`.

**Esta spec não é nada disso.** A página de produto **já é um Server Component
async** (`app/produtos/[handle]/page.tsx`, `export const revalidate = 300`) que
já busca o produto no servidor. A recomendação é **mais uma busca no mesmo
render** — sem Server Action, sem `useEffect`, sem estado de cliente, **sem
componente `"use client"` novo**. Isso é o que torna a feature simples e alinhada
com a stack minimalista da loja, e é o motivo de a loja **não** ter (nem precisar
de) carrossel: é grade fixa, renderizada no servidor.

> ⚠️ **`useCarousel`/`NavArrow` são do outro projeto (o Builder) e NÃO serão
> portados.** A loja não tem carrossel. Grade fixa, ajustável no futuro.

### PRÉ-CONDIÇÃO DE DADOS — ATENDIDA (confirmada pelo usuário)

As câmeras **já têm** a tag de marca (`eseecloud`/`icsee`) e estão publicadas no
canal Headless. Diferente da `acessorios-sugeridos` (que começou com tags = 0),
aqui a premissa de dados já está satisfeita quando a spec é escrita.

> **Contagem por marca MEDIDA na loja real** (durante a validação do design,
> 2026-07): `tag:eseecloud` → **4** câmeras disponíveis
> (`camera-seguranca-es-p9`, `camera-de-seguranca-q6`, `camera-seguranca-q8`,
> `camera-seguranca-s8`); `tag:icsee` → **3** (`camera-seguranca-a31h`,
> `camera-seguranca-a38`, `camera-lampada`); 7 publicados no total, **0 sem
> marca**.
>
> 🔴 **A grafia real da marca EsseCloud é `eseecloud` (dois "e"), não
> `essecloud`.** `tag:essecloud` devolve **0** — exatamente a armadilha que a
> constante de tag existe para pegar. **Decisão do usuário: o código usa
> `eseecloud`, batendo com a loja** (a Shopify é a fonte da verdade). `icsee` está
> correto.

> **Ainda assim, é estado de catálogo — mutável pelo admin sem aviso ao código.**
> Se a grafia divergir (`EsseCloud` vs `eseecloud`, acento, espaço) a seção some
> **em silêncio**. Por isso as tags de marca viram **constantes** num único lugar
> (como `TAG_CAMERA`/`TAG_ACESSORIO` já são), e a spec avalia uma **salvaguarda**
> opcional (Req 8) para a premissa falhar com barulho.

### Fatos verificados (fundamentam o design, medidos no código)

Medidos lendo o código real, não supostos:

| # | Fato verificado | Consequência |
|---|---|---|
| 1 | **`PRODUCT_BY_HANDLE_QUERY` NÃO pede `tags`** hoje (`lib/shopify/queries.ts`). Busca `id, handle, title, descriptionHtml, images, priceRange, metafields` | Para saber a marca do produto atual, **é preciso adicionar `tags`** à query, ao `RawProduct` e ao tipo `Product` — e validar no Dev MCP 2026-01 |
| 2 | Essa query é usada **só** por `getProductByHandle` (não pelo carrinho) | Adicionar `tags` é um **escalar de baixo risco** — não toca o fragmento compartilhado do carrinho. Bem menos arriscado que a `acessorios-sugeridos` |
| 3 | O padrão `products(first, query:"tag:...")` **existe e funciona** (`ACESSORIOS_QUERY` + `buscarAcessoriosPorTag`), com filtro `availableForSale` em JS | A busca de marca **copia** esse padrão — sem inventar mecanismo novo |
| 4 | `ProductCard = {id, handle, title, image, price}` e `normalizeProductCard` já existem; `ProductCardLink` já renderiza o card clicável | O card recomendado **não precisa de tipo nem componente novo** |
| 5 | A página é **Server Component async, ISR 300s** e o `<article>` de 2 colunas é seguido apenas por `</article>` dentro do `StoreShell` | A seção é um **irmão server-only depois do `</article>`** — sem client, sem estado |
| 6 | `tags.ts` tem hoje só `TAG_CAMERA`/`TAG_ACESSORIO` — **não** tem as marcas | Ganha `eseecloud`/`icsee` como constantes, no mesmo arquivo compartilhado |
| 7 | `CatalogGrid` usa `grid-cols-2 sm:grid-cols-3 lg:grid-cols-4`; a seção quer **até 4 no desktop, sempre centralizados** | A grade reusa o padrão do catálogo, ajustada para até 4 colunas e com centralização em qualquer quantidade (1–4 cards) |

## Alignment with Product Vision

- **Objetivo #1 do `product.md`** ("Loja headless — catálogo, carrinho e
  checkout"): a seção **aprofunda a navegação do catálogo** na página de produto,
  aumentando a chance de o cliente encontrar outra câmera para comprar.
- **"A Shopify é a fonte da verdade comercial"**: qual é a marca de cada câmera é
  decisão **de catálogo**, feita por **tag** na Shopify — não uma lista no código.
- **Segmento correto** (`product.md`): a loja vende **câmeras de segurança**
  (EsseCloud e iCSee são marcas do segmento), não iluminação.
- **Compatibilidade retroativa**: a página de produto acabou de ser reformada
  (`layout-pagina-produto`) e vende ponta a ponta; esta spec é **aditiva** e não
  pode regredir o layout de 2 colunas, o botão adicionar, os acessórios sugeridos,
  o sticky nem a descrição (Req 7).

## Requirements

### Requirement 1 — Identificar a marca do produto atual

**User Story:** Como cliente numa página de câmera, quero ver outras câmeras da
mesma marca, para comparar dentro do que já me interessou.

#### Acceptance Criteria

1. THE sistema SHALL obter as **tags** do produto atual pela mesma busca que já
   carrega o produto na página (`getProductByHandle`), adicionando o campo `tags`
   — e SHALL NOT fazer uma segunda busca só para descobrir a marca.
2. THE marca do produto SHALL ser determinada procurando, entre as tags do
   produto, uma das tags de marca conhecidas — **`eseecloud`** ou **`icsee`**.
3. IF o produto atual **não** tem nenhuma tag de marca conhecida THEN o sistema
   SHALL NOT exibir a seção — sem erro, sem espaço vazio.
4. THE identificação de marca SHALL usar **apenas a tag**, e SHALL NOT usar
   título, handle, `productType` ou coleção como proxy. *Adivinhar por título
   quebraria no primeiro produto renomeado.*
5. IF (caso não esperado) o produto tiver **as duas** tags de marca THEN o
   sistema SHALL escolher uma de forma **determinística** (a primeira numa ordem
   fixa definida no design), para o comportamento ser **definido** e não
   acidental. *Não é o caso hoje — cada câmera tem uma marca — mas a regra
   existe para o resultado ser previsível.*

### Requirement 2 — Buscar outras câmeras da mesma marca

**User Story:** Como dono da loja, quero que as recomendações venham da tag de
marca na Shopify, para mudar o que aparece sem tocar no código.

#### Acceptance Criteria

1. THE sistema SHALL buscar os produtos recomendados consultando a Storefront API
   pela tag de marca do produto atual (`products(query: "tag:<marca>")`), e SHALL
   NOT manter lista de handles, IDs ou nomes no código.
2. THE busca SHALL **excluir o produto atual** da lista, comparando pelo
   **handle**. *É o identificador estável que a rota já usa.*
3. THE lista final SHALL ser limitada a **no máximo 4** produtos: se a marca tem
   mais que 4 (após excluir o atual), mostra os **4 primeiros**; se tem 1, 2 ou 3,
   mostra os que tem; se tem 0, a seção **não aparece** (Req 5). *Se no futuro a
   quantidade útil passar de 4, a seção deve virar carrossel — ver Out of Scope.*
4. THE sistema SHALL NOT recomendar produto indisponível
   (`availableForSale: false`) — o filtro de disponibilidade SHALL ser feito em
   JS, **antes** de limitar a 4, seguindo o padrão da `acessorios-sugeridos`.
5. THE busca SHALL ser executada **no servidor**, no render da página, com o
   token (Req 6) — e SHALL NOT expor a marca, a query, o endpoint ou a versão da
   API ao cliente.
6. THE ordem dos recomendados SHALL ser a **ordem devolvida pela Storefront API**
   (sem curadoria própria); "os 4 primeiros" SHALL significar os 4 primeiros
   dessa ordem, após excluir o atual e os indisponíveis. *Controle de ordem está
   fora de escopo — declarado.*
7. THE busca SHALL usar `first: 250` explícito (o teto da API, como na
   `acessorios-sugeridos`) e SHALL NOT paginar. *Uma marca com centenas de
   câmeras não muda o que a seção mostra — ela sempre mostra até 4; buscar o teto
   e cortar em JS é mais simples e verificável que paginar.*

### Requirement 3 — A seção na página de produto

**User Story:** Como cliente, quero ver as recomendações num lugar óbvio, abaixo
do produto, para continuar navegando sem procurar.

#### Acceptance Criteria

1. WHERE a seção é exibida, ela SHALL aparecer **abaixo** do bloco de 2 colunas
   (galeria+compra / descrição), como **irmão depois do `</article>`**, dentro do
   `StoreShell` — e SHALL NOT ficar presa a nenhuma das duas colunas.
2. THE seção SHALL ocupar a **largura total** do container da página e SHALL ser
   **centralizada**, coerente com o container da página de produto/catálogo.
3. THE seção SHALL ter um cabeçalho com o título **"Você também pode gostar"**,
   usando o `Heading` da loja, num tamanho **grande** (estilo de título de seção).
4. THE seção SHALL exibir os recomendados numa **grade fixa** (não carrossel):
   **até 4 lado a lado no desktop**, empilhando no mobile — reusando o **padrão**
   de grade responsiva do catálogo (as classes Tailwind do `CatalogGrid`),
   **ajustado para no máximo 4 colunas no desktop**. *O `CatalogGrid` como está é
   `lg:grid-cols-4` (Fato 7); esta seção usa o mesmo padrão limitado a 4 — reuso
   do padrão, não do componente sem mudança.*
5. THE grade SHALL manter os cards **centralizados na largura do container em
   QUALQUER quantidade** (1, 2, 3 ou 4 cards), e SHALL NOT alinhá-los à esquerda
   deixando vazio à direita. *Um único card fica no **meio**; dois ficam
   centralizados lado a lado; quatro preenchem. A técnica é decisão de design
   (ex.: flex com `justify-center`, ou grid com colunas de largura fixa
   centralizadas) — o requisito é a **propriedade observável**: nunca há buraco só
   de um lado.*
6. THE seção SHALL NOT ter setas, deslize, carrossel ou qualquer controle de
   navegação horizontal. *`useCarousel`/`NavArrow` são de outro projeto e não
   entram aqui.*
7. THE mudança na página SHALL ser **aditiva** — quando a seção não aparece, a
   página SHALL renderizar **exatamente** como hoje (2 colunas / 1 coluna, botão,
   descrição, acessórios, sticky).

### Requirement 4 — Cards clicáveis (sem comprar)

**User Story:** Como cliente, quero clicar num card recomendado e ir para a página
daquele produto, sem adicionar nada ao carrinho por engano.

#### Acceptance Criteria

1. WHILE a seção é exibida, cada card SHALL mostrar **foto, nome e preço** do
   produto recomendado, reusando o card do catálogo (`ProductCardLink`).
2. WHEN o cliente clica em **qualquer** parte de um card THEN o sistema SHALL
   navegar para a **página** daquele produto (`/produtos/<handle>`).
3. THE card SHALL NOT ter botão de comprar e SHALL NOT adicionar o produto ao
   carrinho. *Recomendação é descoberta, não conversão direta — o cliente decide
   na página de destino.*
4. THE preço exibido SHALL vir da Shopify já formatado em pt-BR (via o mesmo
   `PriceTag`/`formatMoney` que o card já usa), e SHALL NOT ser calculado,
   somado ou convertido localmente.
5. THE seção SHALL usar as cores da paleta via as CSS custom properties `--cor-*`
   (herdadas do `StoreShell`), e SHALL NOT introduzir cor fixa fora da paleta.

### Requirement 5 — Nunca uma seção vazia

**User Story:** Como cliente, não quero ver um título sem conteúdo nem um espaço
vazio, para a página não parecer quebrada.

#### Acceptance Criteria

1. IF não há nenhuma outra câmera da mesma marca a recomendar — por qualquer
   motivo: produto sem tag de marca (Req 1.3), só o produto atual naquela marca,
   todos os outros indisponíveis, ou falha na busca — THEN o sistema SHALL NOT
   renderizar o título nem o contêiner da seção.
2. IF a busca dos recomendados falhar (rede, Shopify fora, env ausente) THEN a
   página de produto SHALL continuar **plenamente funcional** e a seção SHALL
   simplesmente não aparecer, **sem erro visível**. *Disciplina da
   `acessorios-sugeridos`: um extra não pode derrubar a página que vende.*
3. THE ausência da seção SHALL NOT deixar espaço vazio, borda, margem órfã ou
   qualquer resíduo visual abaixo do produto.

### Requirement 6 — Fronteira cliente/servidor

**User Story:** Como dono da loja, quero que a busca de recomendados não exponha o
token, para não abrir brecha por causa de um extra.

#### Acceptance Criteria

1. THE busca por tag de marca SHALL ser executada **apenas no servidor**, e o
   token SHALL NOT aparecer no bundle do cliente — verificável por busca no
   `.next/static` após o build (**0 ocorrências**), o mesmo critério das specs
   anteriores.
2. THE módulo que toca o token SHALL manter `import "server-only"`, e qualquer
   componente de cliente SHALL importar apenas **tipos** (`import type`) da camada
   de dados.
3. THE seção SHALL ser renderizada **no servidor** (sem `"use client"` novo). O
   `ProductCardLink` reusado já é client, mas é folha — a seção que o monta é
   server. *Nenhum estado, efeito ou hook de cliente é introduzido por esta spec.*
4. **THE busca de recomendados SHALL NOT usar `cache: "force-cache"` nem
   `export const fetchCache = "default-cache"`.** *A proibição do projeto vale
   inclusive para dado de catálogo. Como a busca roda no render da página, o
   cache "leve" desejado vem **do ISR 300s da própria página**
   (`export const revalidate`), não de `force-cache` — exatamente como o
   `getProductByHandle` que roda ao lado.*
5. THE mensagens de erro SHALL NOT interpolar token nem endpoint.

### Requirement 7 — Não-regressão

**User Story:** Como dono do site, quero que a página de produto que acabou de ser
reformada continue funcionando, para não trocar receita por receita.

#### Acceptance Criteria

1. WHEN a feature é introduzida THEN a página de produto SHALL continuar
   funcionando em tudo que já vale: layout de 2 colunas (e o de 1 coluna sem
   descrição), botão **Adicionar ao carrinho**, drawer, **acessórios sugeridos**,
   **sticky** da coluna esquerda e a **descrição** rica.
2. THE Home (`/`) e Sobre Nós (`/sobre-nos`) SHALL continuar `○ (Static)` na
   saída do build — esta spec não toca `app/layout.tsx` nem lê
   `cookies()`/`headers()`.
3. THE `/catalogo` e `/produtos/[handle]` SHALL manter o **ISR de 300s** e o
   `dynamicParams`. A adição de `tags` e da busca SHALL acontecer **dentro** do
   regime de render existente, sem torná-lo dinâmico (`ƒ`).
4. THE `npm run build` SHALL passar **com e sem `.env.local`**, e
   `npx tsc --noEmit` SHALL ficar limpo.
5. WHEN `tags` é adicionado ao `PRODUCT_BY_HANDLE_QUERY` THEN a página de produto
   SHALL continuar renderizando o produto corretamente (nome, preço, galeria,
   descrição, acessórios) — o campo novo é aditivo e não altera os existentes.

### Requirement 8 — Salvaguarda da pré-condição de dados (marca)

**User Story:** Como mantenedor, quero que a ausência das tags de marca falhe com
barulho, para não descobrir semanas depois que a seção nunca aparece.

#### Acceptance Criteria

1. THE sistema SHALL prover um check dedicado, executável por comando npm, que
   **falha (exit ≠ 0)** se **nenhum** produto publicado tiver uma tag de marca
   conhecida (`eseecloud` ou `icsee`). *Sem nenhuma marca, a seção é código morto
   — indistinguível de bug.*
2. THE check SHALL reportar quantos produtos encontrou de cada marca
   (`eseecloud`, `icsee`) e avisar (**sem falhar**) sobre produtos publicados
   **sem nenhuma tag de marca**, nomeando os handles.
3. THE check SHALL NOT ser acoplado ao `npm run build` (o build passa sem
   `.env.local`, e o check precisa do token), e SHALL usar `process.exitCode`,
   **nunca** `process.exit()`. *Verificado nas specs anteriores: `process.exit()`
   após `fetch` derruba handles do libuv no Windows e o exit code sai 127 em
   qualquer caso.*
4. THE check SHALL seguir o padrão dos scripts existentes
   (`scripts/verificar-tags.mjs`, `verificar-variantes.mjs`) e ser documentado no
   README.

> **Nota de escopo:** o Req 8 é **desejável, não bloqueante** — a pré-condição de
> dados já está atendida (usuário confirmou). Fica como salvaguarda no mesmo
> espírito das specs anteriores; se o design/tarefas o classificarem como
> opcional, é decisão consciente, não omissão.

### Requirement 9 — Definition of Done das operações GraphQL

**User Story:** Como desenvolvedor, quero a query validada contra o schema 2026-01
**e** exercitada na loja, para não descobrir em produção que era válida mas não
fazia o que eu achava.

> Checklist de DoD, não comportamento de produto.

#### Acceptance Criteria

1. THE `PRODUCT_BY_HANDLE_QUERY` **com `tags`** e a query de recomendados SHALL
   ser validadas contra o schema **2026-01** via Dev MCP
   (`validate_graphql_codeblocks`) antes de a spec ser considerada concluída.
2. THE validação SHALL tratar **aviso de depreciação como falha**, não só erro de
   schema.
3. THE versão da API SHALL vir de `SHOPIFY_STOREFRONT_API_VERSION` (default
   `2026-01`) via `storefrontFetch`, e SHALL NOT ser hardcoded numa nova camada.
4. THE busca por tag de marca SHALL ser **exercitada contra a loja real** (não só
   validada no schema): `tag:eseecloud` e `tag:icsee` SHALL devolver as câmeras
   esperadas. *Validar no schema não prova que há dados — só a execução
   distingue "sintaxe errada" de "não há dados". **Feito** na validação do design:
   4 e 3 respectivamente (ver a nota de pré-condição).*

## Non-Functional Requirements

### Performance

- A busca de recomendados SHALL acontecer **no mesmo render** que já busca o
  produto (Server Component), custando **no máximo uma chamada** extra à Shopify
  por render da página — e essa chamada é **absorvida pelo ISR 300s** da página
  (não refeita a cada visita).
- A seção SHALL NOT bloquear nem atrasar o conteúdo principal do produto além do
  custo dessa única busca no servidor (o cliente recebe HTML pronto).
- A busca SHALL NOT acontecer quando o produto **não tem** tag de marca (Req 1.3):
  sem marca, não há o que buscar.

### Security

- Token da Storefront API **exclusivamente server-side** (Req 6) — sem
  `NEXT_PUBLIC_`, sem exposição em bundle, log ou mensagem de erro.
- O cliente não escolhe marca nem query: a busca é montada no servidor a partir
  das constantes de marca.
- Nada nesta spec lê `cookies()`/`headers()` nem altera o regime de render da
  Home.

### Reliability

- Falha na busca de recomendados **degrada para "sem seção"**, nunca para erro —
  a página de produto é o caminho da receita (Req 5.2).
- A Shopify é a fonte da verdade de quais produtos existem, de suas marcas, preços
  e disponibilidade.
- A ausência das tags de marca é um estado **sinalizado** pelo check do Req 8, não
  um erro ao cliente.

### Usability

- Idioma **pt-BR** na UI e no código de domínio (`recomendados`, `marca`) —
  padrão do `structure.md`.
- Reúso dos primitivos existentes (`ProductCardLink`, `Heading`, grade do
  catálogo); paleta e chrome preservados.
- A seção SHALL ser navegável por teclado (os cards são `<Link>`, já focáveis).
- WHERE a seção usa animação, ela SHALL respeitar `prefers-reduced-motion`. *Como
  é server-only e reusa componentes existentes, não introduz animação nova; se
  reusar componente com Framer Motion, herda a regra do `tech.md`.*

## Out of Scope

Explicitamente **fora** desta spec (combinado com o usuário):

- **Carrossel / setas / deslize.** A loja não tem carrossel; `useCarousel` e
  `NavArrow` são do Builder e não serão portados. Grade fixa de **até 4**.
  *Gatilho de futuro declarado: **se a quantidade útil de recomendados passar de
  4**, a seção deve deixar de ser grade fixa e virar carrossel — é o ponto em que
  esta decisão de "grade fixa" expira. Até lá, o excedente é simplesmente cortado
  (Req 2.3).*
- Recomendação por **preço, categoria ou popularidade** — a regra é **marca**.
- **Mistura de marcas** — só a mesma marca; sem fallback para outra marca quando
  a atual tem poucas (Req 2.3: mostra 1, 2 ou 3, ou some).
- **Fallback para outra marca** quando a marca atual esgota.
- **Adicionar ao carrinho** pelo card — o card só leva à página (Req 4.3).
- **Controle de ordem** dos recomendados — usa a ordem da API (Req 2.6).
- Cadastro dos produtos e das tags de marca na Shopify — é trabalho do operador
  no admin (pré-condição atendida), sinalizado pelo Req 8.
- Recomendação em **outras superfícies** (catálogo, carrinho, home) — só na
  página de produto.
