# Requirements Document

## Introduction

Duas mudanças ligadas, numa feature só:

1. **A Home passa a vender produtos de verdade.** Hoje a seção "Nossos Produtos"
   da Home mostra **placeholders do template** — `"Produto 01"`, `"Produto 02"`,
   `"Produto 03"`, sem imagem, sem preço e **sem link**. Ela passa a mostrar os
   produtos da coleção **`destaques`** da Shopify, na **ordem manual** que o
   lojista arrastou no admin, cada card levando à página do produto.
2. **As seções de produto viram carrossel no mobile.** "Nossos Produtos" (Home) e
   "Você também pode gostar" (página de produto) ganham, **abaixo de 768px**, um
   scroll horizontal com `scroll-snap` mostrando ~1,5 item (o próximo espiando na
   borda) e **setas `‹ ›`**.

As duas andam juntas por um motivo prático: a seção da Home só existe de verdade
depois da Parte 1, e o carrossel é o mesmo componente nas duas pontas — construí-lo
para uma seção e depois refazê-lo para a outra seria trabalho duplicado.

O princípio que amarra tudo: **o servidor decide e entrega o HTML pronto**. Os
produtos vêm todos no HTML do servidor (o Google vê todos); o carrossel é
**apresentação**, não filtro — ele muda como o mobile *exibe* o que já está lá.

> **Escopo do "no desktop nada muda".** Vale para **"Você também pode gostar"**,
> que hoje já é uma grade correta de produtos reais (Req 7.2). **Não vale para a
> Home:** o desktop dela muda por definição — três produtos reais no lugar de oito
> placeholders é o objetivo da feature. O que fica intacto na Home é **todo o
> resto** (Req 9.1) e o **chrome da seção** (posição, padding, efeitos, paleta —
> Req 2.4).

### Dados confirmados na loja (sondagem ao vivo, Storefront API 2026-01)

Feita **antes** de escrever esta spec, contra a loja real — a disciplina já
estabelecida no projeto: o Dev MCP valida o **schema**, só a loja diz o **valor**.

**Coleções visíveis no canal Storefront — exatamente 3:**

| Handle | Título | Uso |
|---|---|---|
| `frontpage` | "Home page" | não usada pelo código |
| `cameras` | "cameras" | **o `/catalogo`** (`CATALOGO_COLLECTION_HANDLE`) |
| `destaques` | "destaques" | **esta feature** |

**A coleção `destaques` existe, está publicada no canal Storefront e tem 3
produtos**, em `sortKey: MANUAL`:

| # (ordem manual) | Handle | Título | Preço | Imagem | À venda |
|---|---|---|---|---|---|
| 1 | `camera-de-seguranca-q6` | Camera de Segurança Q6 | BRL 158.00 | 1024×1024 | sim |
| 2 | `camera-seguranca-a31h` | Camera Segurança A31H | BRL 185.00 | 3543×3543 | sim |
| 3 | `camera-seguranca-a38` | Camera Segurança A38 | BRL 263.00 | 3543×3543 | sim |

**Três observações medidas nos dados** (não são objeções — são o que a
implementação tem de casar):

- **A ordem manual é `Q6 → A31H → A38`**, não a ordem em que o briefing citou as
  câmeras. Isso é o `sortKey: MANUAL` funcionando: quem manda é o arrasto do
  lojista no admin, não o código. A feature **não reordena** (Req 1.3).
- **`featuredImage.altText` é `null` nos 3 produtos.** O card precisa de fallback
  de `alt`, senão a Home ganha 3 imagens sem texto alternativo (Req 3.5).
- **A coleção tem 3 produtos hoje, mas o número não é fixo** — o lojista pode
  arrastar um quarto amanhã. A seção não pode assumir 3 (Req 1.4), e por isso
  precisa de um teto declarado (Req 1.5).

**A query foi validada no Dev MCP contra a 2026-01 (✅ VALID).** Ela é a forma da
`PRODUCTS_QUERY` **menos** os campos exclusivos do
catálogo (`tags` e os 5 metafields) e **mais `availableForSale`** — que o Req 1.6
precisa para filtrar esgotados.

Isso é reuso real, não coincidência, e tem **precedente exato** no projeto: a
`RECOMENDADOS_QUERY` já é comentada como *"Seleção = `RawProductCard` +
`availableForSale`"*, com `RawRecomendado extends RawProductCard` carregando o
campo extra e `normalizeProductCard` simplesmente ignorando-o. Do outro lado,
`tags?`, `resumo?`, `selo?`, `resolucao?`, `lentes?` e `alarme?` já são
**opcionais** em `RawProductCard`. As duas pontas somadas são o que permite ao
Req 1.9 exigir "sem adaptador e sem alterar a assinatura": o tipo cru **estende**
`RawProductCard`, o normalizador não muda.

### O que o código realmente é hoje (corrige a premissa do briefing)

Levantado antes desta spec, e muda o desenho:

- **A seção "Nossos Produtos" é `components/sections/ProductGrid/ProductGrid.tsx`**
  — uma seção do **template do Builder**, `"use client"`, renderizada pelo
  `PreviewContent` a partir de `layouts/_home.json` (4ª seção, índice 3,
  `type: "grid"`, `gridWidth: "centralizado"`). O rótulo "Nossos Produtos" nem
  está no JSON: vem do `DEFAULT_CONTENT` do componente.
- **O contrato de conteúdo dela é `product1Name…product8Name`** — 8 produtos
  achatados em campos numerados de JSON. Não é um contrato que aceite
  `ProductCard[]` da Shopify.
- **`ProductGrid` é compartilhado com o preview do Builder** e usa os mesmos hooks
  de efeito que `Hero` e `Testimonials`. Mexer nele é mexer no template.
- **`ProductGrid` já tem uma variante `type: "carrossel"`** — mas ela é carrossel
  **no desktop também**, com **autoplay** e **bolinhas**, e move um track por
  `transform` com larguras medidas em JS (`useCarousel`). É o oposto do que esta
  spec pede, e as três coisas estão explicitamente **fora do escopo**. Ela **não**
  é o caminho.
- **`CatalogGrid` está órfão** — nenhum arquivo o importa (o `catalogo-consultivo`
  substituiu a grade do `/catalogo`). Não é ponto de integração desta feature e
  não é tocado aqui.
- **`RecomendadosRelacionados` não usa grade compartilhada:** é um Server Component
  com a classe `.recomendados-grade` (flex-wrap centralizado, base
  `clamp(150px, 42vw, 240px)`), definida em `app/globals.css`.
- **`ProductCardLink` já existe** e já é o card de `.recomendados-grade`: imagem +
  título + preço, embrulhados num `next/link`. É o ponto de partida do card da
  Home (Req 3.8), não um componente a duplicar.
- **`useIsMobile` (`lib/useIsMobile.ts`) é JavaScript** — `useState` + `useEffect`
  + listener de `resize`, e devolve `false` no primeiro render. **Usá-lo para
  decidir carrossel-vs-grade violaria o SEO desta spec**: o HTML do servidor sairia
  sempre no ramo desktop e o mobile só mudaria depois da hidratação. A decisão
  mobile/desktop tem de ser **CSS puro** (Req 7.1).
- **`PreviewContent` é `"use client"`.** Tudo que ele renderiza pela
  `componentMap` entra no **bundle do cliente da Home** — client components são
  SSR'd, então o HTML sai completo, mas o custo de bundle é real. Ver a NFR de
  Performance: é o mesmo tipo de honestidade que a spec `catalogo-destaques`
  aplicou ao `CameraBloco`.

## Alignment with Product Vision

- **"Loja headless (e-commerce)" é a prioridade 1** de `product.md`, e a Home é
  descrita ali como **"dedicada à venda direta"**. Hoje ela não vende nada: a seção
  de produtos aponta para lugar nenhum. Esta feature liga a porta da frente ao
  catálogo.
- **"A Shopify é a fonte da verdade comercial"** — produtos, ordem, preço e imagem
  vêm da coleção `destaques`. O lojista muda a vitrine da Home **arrastando
  produtos no admin**, sem deploy.
- **"Os dados da loja NÃO moram em JSON"** (`structure.md`) — hoje a Home viola
  isso literalmente, com três produtos falsos escritos em `_home.json`. Esta
  feature corrige a violação, mantendo em JSON o que **é** editorial (a headline —
  Req 2.3).
- **Mudança de regime já prevista no steering.** `tech.md` → "Home estática: o que
  é regra e o que NÃO é" registra, textualmente, que *"a frente do `ProductGrid` da
  Home por tag (produtos em destaque vindos da Shopify) **vai** tirar a Home de SSG
  puro e colocá-la em **ISR**. É intencional e esperado."* Esta é essa feature. A
  única diferença é a fonte: **coleção `destaques`**, não tag.
- **Acessibilidade por padrão** — setas nomeadas, faixa rolável alcançável por
  teclado, `prefers-reduced-motion` respeitado, e nada escondido de leitor de tela
  (Reqs 6.4, 5.8, 6.6, 8.3).

## Requirements

### Requirement 1 — A Home mostra os produtos da coleção `destaques`

**User Story:** Como cliente que chega na Home, quero ver câmeras de verdade — com
foto, nome e preço — para entender o que a loja vende sem precisar caçar o catálogo.

#### Acceptance Criteria

1. WHEN a Home é renderizada THEN a seção de produtos SHALL exibir os produtos da
   coleção **`destaques`** da Shopify, buscados **no servidor**.
2. WHEN os produtos são buscados THEN a busca SHALL usar
   **`collection(handle: "destaques")` com `products(sortKey: MANUAL)`** — o mesmo
   padrão de `getProducts()` para a coleção `cameras`.
3. WHEN a seção é renderizada THEN a ordem dos cards SHALL ser **exatamente a ordem
   devolvida pela API** (hoje `Q6 → A31H → A38`), sem reordenar, ordenar por preço
   nem embaralhar no código.
4. WHEN a coleção tem N produtos THEN a seção SHALL renderizar **os N até o teto do
   Req 1.5**, sem número mágico — se o lojista arrastar um quarto produto no admin,
   ele aparece sem mudança de código.
5. WHEN a query é escrita THEN ela SHALL declarar um **`first:` explícito de 12**,
   e a seção SHALL renderizar no máximo esses 12. *Justificativa: a loja inteira
   tem 7 câmeras; 12 é folga confortável para qualquer curadoria plausível de
   destaques e ainda assim **limita o HTML** que o Req 8.1 obriga a entregar
   inteiro. Sem teto, arrastar 50 produtos no admin transformaria a Home num
   catálogo e a faixa mobile numa rolagem sem fim.*
6. IF um produto da coleção tiver **`availableForSale: false`** THEN ele SHALL ser
   **filtrado** e não aparecer na Home — mesmo precedente de `recomendados.ts`, que
   já filtra indisponíveis em JS, sobre o mesmo campo pedido na mesma requisição.
   *Duas consequências aceitas: (a) o teto do Req 1.5 se aplica **antes** do filtro
   — 12 produtos pedidos com 2 esgotados resultam em 10 na tela, não em 12; (b) uma
   coleção populada só de esgotados cai no caso de lista vazia do Req 1.8.*
7. IF `collection` vier `null` (coleção despublicada do canal Storefront ou handle
   trocado) OR a Shopify estiver fora do ar OR a busca lançar THEN a busca SHALL
   degradar para **lista vazia**, e a Home SHALL continuar renderizando todas as
   demais seções normalmente — **a Home nunca cai por causa da loja**.
8. IF a lista de produtos estiver vazia THEN a seção de produtos SHALL **não
   renderizar** — sem título órfão, sem container vazio, sem espaço reservado
   (mesma disciplina de `RecomendadosRelacionados`:
   `if (produtos.length === 0) return null`).
9. WHEN os dados brutos são convertidos THEN a conversão SHALL reusar
   **`normalizeProductCard`** (`lib/shopify/normalize.ts`), o único construtor de
   `ProductCard` do projeto, **sem adaptador e sem alterar a assinatura dele**, e o
   preço SHALL vir de **`formatMoney`** — o site **não formata nem calcula
   dinheiro**.
10. WHEN os produtos são buscados THEN eles SHALL vir em **uma única requisição** à
    Storefront API, sem N+1.

### Requirement 2 — Onde a seção nova mora e como se registra

**User Story:** Como desenvolvedor, quero saber exatamente o que passa a existir no
lugar dos placeholders, para não descobrir na implementação que o template do
Builder quebrou.

#### Acceptance Criteria

1. WHEN a feature é implementada THEN SHALL existir uma **seção nova**, dedicada
   aos produtos da Home, **distinta de `ProductGrid`** — e
   `components/sections/ProductGrid/ProductGrid.tsx` SHALL permanecer **sem
   nenhuma modificação** (é do template do Builder, compartilhado com o preview).
2. IF a seção nova for renderizada pelo `PreviewContent` THEN ela SHALL ser
   registrada segundo o checklist de `structure.md` → "Nova seção": **import
   estático** (o Turbopack não faz import dinâmico) **E** entrada no
   **`componentMap`**. IF a seção nova for entregue por outro mecanismo THEN esse
   mecanismo SHALL preservar integralmente os Reqs **2.4** (chrome da seção),
   **2.6** (`/sobre-nos` intacto), **8.1** (produtos no HTML do servidor), **9.1**
   (demais seções da Home idênticas) e **9.2** (`PreviewContent` funcionalmente
   intacto) — a porta alternativa não pode ser um atalho para escapar deles.
3. WHEN a entrada de índice 3 do `layouts/_home.json` é editada THEN ela SHALL
   **manter a posição, o `id`, os `paddingTop`/`paddingBottom` e os `effects`**, e
   SHALL **perder os 8 campos falsos `product1Name…product8Name`** (é exatamente o
   dado mentiroso que esta feature remove). A **`headline` permanece no JSON** —
   copy editorial é JSON (`product.md`), produto é Shopify.
4. WHEN a seção nova é renderizada THEN ela SHALL receber o mesmo **chrome de seção**
   que qualquer outra da Home: posição na ordem, `ParallaxWrapper`,
   `SectionEffectsContext`, `AnimatedBackground`, paddings, as variáveis de accent
   **e o wrapper de paleta** — a Home não pode ganhar um "buraco" sem tema no meio.
   🔴 *Armadilha textual de `tech.md`: **só existem dois wrappers de paleta** —
   `PreviewContent` e `StoreShell`. Uma seção montada fora dos dois herda a paleta
   de **fábrica** (`--cor-destaque` dourado `#D4A017`) em vez do laranja `#ff8903`
   do site, e precisa aplicar `paletaWrapperStyle()` por conta própria. Isso vale
   em cheio para a porta alternativa admitida no Req 2.2, e a falha é **visual e
   silenciosa** — nada quebra, a cor só sai errada.*
5. WHEN a feature é implementada THEN **`ProductGrid` SHALL continuar registrado**
   no `componentMap` do `PreviewContent` — outros JSONs e o preview do Builder
   dependem dele. Removê-lo do mapa é regressão, mesmo sem tocar no arquivo dele.
6. WHEN os produtos são buscados no servidor e entregues à seção THEN
   **`/sobre-nos` SHALL continuar renderizando sem alteração** — o `PreviewContent`
   é compartilhado pelas duas rotas de conteúdo, e o Sobre Nós não tem produto
   nenhum para receber.

### Requirement 3 — O card da Home é uma vitrine simples

**User Story:** Como cliente, quero um card limpo — foto, nome, preço e um jeito
óbvio de ver mais — para decidir se clico, sem ser soterrado de informação na
primeira tela.

#### Acceptance Criteria

1. WHEN um card é renderizado THEN ele SHALL exibir **foto, nome, preço e uma
   chamada "Ver detalhes"**, nesta ordem de leitura.
2. WHEN o card é renderizado THEN o **card inteiro SHALL ser um único `<a>`** para
   `/produtos/{handle}` (via `next/link`), e a chamada "Ver detalhes" SHALL ser um
   elemento **visual dentro dele — nunca um `<button>` ou um segundo `<a>`
   aninhado**. *Um controle dentro de um link é DOM inválido e quebra teclado e
   leitor de tela; e dois alvos para o mesmo destino dobram a navegação por Tab
   sem ganho nenhum.*
3. WHEN o card é renderizado THEN ele **NÃO** SHALL exibir selo de posicionamento,
   resumo consultivo, linha de destaques de spec, nem botão de compra direta — a
   Home é vitrine simples (esses elementos são do `/catalogo` e da página de
   produto).
4. WHEN o preço é exibido THEN ele SHALL ser o valor **formatado pela Shopify** via
   `formatMoney`, com a moeda vinda da API (BRL) — nunca um número montado no
   componente.
5. WHEN a imagem do produto é renderizada THEN o `alt` SHALL usar
   `featuredImage.altText` **quando houver** e, quando for `null` — que é o caso dos
   **3 produtos de hoje** —, SHALL cair para o **título do produto**. Nenhum card
   pode sair com `alt` vazio.
6. IF um produto não tiver `featuredImage` THEN o card SHALL renderizar o
   **placeholder de imagem já usado na loja** (`ImageSlot` sem `src`), sem quebrar o
   layout nem exibir imagem quebrada.
7. WHEN os cards são renderizados THEN eles SHALL usar as variáveis `--cor-*` da
   paleta do site, sem hex hard-coded (o `#D4A017` é a paleta de **fábrica**; o site
   usa laranja `#ff8903`).
8. WHEN o card da Home é construído THEN ele SHALL **reusar `ProductCardLink`** em
   vez de duplicar um card equivalente. IF `ProductCardLink` precisar da chamada
   "Ver detalhes" THEN a mudança SHALL ser **aditiva e opt-in** (desligada por
   padrão), de modo que **`.recomendados-grade` continue renderizando exatamente
   como hoje** (Req 7.2).
9. WHEN a viewport tem **768px ou mais** THEN a seção da Home SHALL exibir os
   produtos numa **grade centralizada**, íntegra de **1 até 12 cards** (o teto do
   Req 1.5), sem estouro horizontal e sem card solto esticado — o mesmo problema
   que `.recomendados-grade` já resolve com `flex-wrap` + `justify-content: center`
   + base flexível. *Este critério existe porque o desktop da Home **muda** nesta
   feature (Req 7 protege só "Você também pode gostar"); sem ele, o layout de
   desktop da Home não teria dono e nenhuma regressão ali poderia ser chamada de
   regressão.*

### Requirement 4 — A Home muda de regime: `○ Static` → ISR (deliberado)

**User Story:** Como desenvolvedor, quero que a mudança de regime da Home seja uma
decisão registrada e verificada, não um efeito colateral que ninguém percebeu.

#### Acceptance Criteria

1. WHEN a Home passa a buscar dados da Shopify THEN a rota `/` SHALL declarar
   **`export const revalidate`** e passar a operar em **ISR** — mudança
   **deliberada**, pré-autorizada por `tech.md` → "Home estática: o que é regra e o
   que NÃO é".
2. WHEN a janela de ISR é escolhida THEN ela SHALL ser **300 segundos**, alinhada
   com `/catalogo` e `/produtos/[handle]` — a Home não tem motivo para ser mais
   fresca que o próprio catálogo.
3. WHEN o build é executado THEN a saída SHALL mostrar `/` **com ISR** e
   `/sobre-nos` **ainda `○ (Static)`** — o Sobre Nós não muda de regime, e uma
   mudança nele é regressão.
4. WHEN a Home busca dados THEN ela **NÃO** SHALL usar `cookies()` nem `headers()`
   — o que a tiraria de ISR para **`ƒ` (dynamic)**, um regime diferente do
   pretendido e mais caro.
5. WHEN o build roda **sem `.env.local`** THEN ele SHALL continuar passando — a Home
   degrada para a seção ausente (Reqs 1.7/1.8), o build **nunca** quebra por env
   ausente.

### Requirement 5 — Carrossel no mobile: comportamento

**User Story:** Como cliente no celular, quero arrastar os produtos lado a lado e
perceber que há mais adiante, em vez de rolar uma pilha vertical infinita.

#### Acceptance Criteria

1. WHEN a viewport tem **menos de 768px** THEN a seção de produtos da Home e "Você
   também pode gostar" SHALL exibir os produtos numa **faixa de scroll horizontal**,
   não em grade empilhada.
2. WHEN a faixa tem **mais de um produto** AND a viewport está entre **360px e
   414px** THEN o card seguinte SHALL ter **pelo menos 24px visíveis** e o card
   ativo SHALL ocupar **no máximo 80% da largura da faixa** — é a forma mensurável
   de "~1,5 item com o próximo espiando". *A condição "mais de um produto" não é
   decorativa: sem ela este critério forçaria 20% de vão morto exatamente no caso
   que o Req 5.6 manda renderizar sem sinal de carrossel.*
3. WHEN o cliente arrasta a faixa THEN o scroll SHALL **encaixar (`scroll-snap`)**
   no item mais próximo, parando alinhado — nunca no meio de dois cards.
4. WHEN o snap é implementado THEN ele SHALL ser **CSS puro** (`overflow-x` +
   `scroll-snap-type` + `scroll-snap-align`) — **sem** JavaScript de arrasto, **sem**
   biblioteca de carrossel e **sem** track transladado por `transform`.
5. WHEN a faixa é rolada THEN **não** SHALL haver rolagem horizontal da **página** —
   só o container do carrossel rola; o `<body>` permanece sem overflow-x.
6. IF a seção tiver **um único produto** THEN ela SHALL renderizar sem sinal de
   carrossel — **sem setas** e sem espiada de "próximo item", porque não há próximo.
7. WHEN os cards estão na faixa THEN todos SHALL ter a **mesma largura e a mesma
   altura**, para o snap parar sempre no mesmo enquadramento.
8. WHEN a faixa é renderizada THEN **todos os seus itens SHALL ser alcançáveis por
   teclado**, e o item que recebe foco SHALL **entrar na vista** (WCAG 2.1.1). A
   faixa SHALL ter **nome acessível**. IF a faixa não rola (desktop, ou um único
   produto) THEN ela **NÃO** SHALL criar um tab stop — uma parada de Tab que não faz
   nada é ruído para quem navega por teclado.

   > **Emenda registrada (aprovada na revisão do design).** A redação original
   > exigia um **container focável rolando pelas setas do teclado**. Ela foi
   > substituída porque as duas cláusulas eram **inconciliáveis sem JavaScript** — e
   > o Req 6.3 proíbe o `useEffect` com media query que as conciliaria. Como a faixa
   > contém **apenas `<a>`**, Tab já percorre todos os itens e o navegador rola cada
   > um para a vista: a WCAG 2.1.1 é cumprida sem `tabindex` no container, que seria
   > redundante no mobile e uma parada morta no desktop. Ver `design.md` → Decisão 8.
9. WHEN um card recebe foco dentro da faixa THEN ele **NÃO** SHALL ficar cortado na
   borda — o scroll de foco SHALL respeitar um respiro (`scroll-padding-inline`).

### Requirement 6 — As setas `‹ ›` são o único JavaScript

**User Story:** Como cliente que não percebeu que dá para arrastar, quero clicar
numa seta e ver o próximo produto.

#### Acceptance Criteria

1. WHEN a viewport tem menos de 768px E a seção tem **mais de um produto** THEN
   SHALL ser exibido um par de setas **`‹` e `›`**.
2. WHEN uma seta é clicada THEN o container SHALL rolar horizontalmente na direção
   correspondente por um deslocamento de **no mínimo a largura de um card**, e o
   `scroll-snap` SHALL alinhar o resultado num card. *O piso importa: sem ele, um
   `scrollBy(50px)` satisfaria o critério e a seta pareceria quebrada. O handler
   pode calcular essa largura no clique — permitido pelo Req 6.3.*
3. WHEN o JavaScript das setas é escrito THEN ele SHALL ser o **mínimo necessário
   para rolar o container**: **sem** estado de índice, **sem** `useEffect`, **sem**
   listener de `resize`, **sem** autoplay e **sem** bolinhas. *Ler uma dimensão do
   container **dentro do handler de clique** é permitido e necessário — o que está
   vedado é o padrão `useCarousel` de medir em efeito e guardar em estado.*
4. WHEN as setas são renderizadas THEN cada uma SHALL ter **nome acessível**
   ("Anterior" / "Próximo") e ser alcançável por **teclado**, com alvo de toque
   **≥ 40px**.
5. IF o JavaScript não carregar ou falhar THEN o carrossel SHALL **continuar
   funcional por arrasto** (o `scroll-snap` é CSS) — as setas são comodidade, não a
   única forma de navegar.
6. WHEN a rolagem por seta é animada THEN a animação SHALL ser **desativada sob
   `@media (prefers-reduced-motion: reduce)`** — tanto no `scroll-behavior` do CSS
   quanto no `behavior` do `scrollBy`. *O risco aqui é o scroll suave, **não** o
   Framer Motion: pelo Req 6.3 as setas não usam animação de biblioteca.*
7. WHEN as setas são exibidas THEN elas SHALL permanecer **sempre habilitadas** —
   clicar em `‹` no início ou em `›` no fim SHALL ser **no-op**, sem erro. *Decisão
   consciente: desabilitar nos extremos exigiria estado de índice e listener de
   scroll, proibidos pelo Req 6.3.*

### Requirement 7 — O que NÃO muda de layout

**User Story:** Como dono da loja, quero adicionar o carrossel mobile sem arriscar
uma vírgula do layout de desktop que já está aprovado.

#### Acceptance Criteria

1. WHEN a distinção mobile/desktop é implementada THEN ela SHALL ser feita por
   **media query CSS**, **nunca** por JavaScript — nem para o layout, nem para a
   presença das setas. As setas **existem no HTML** e são ocultadas por CSS no
   desktop. *Esta é a formulação canônica de "a decisão é CSS". Os Reqs 5.4 (o
   mecanismo do snap) e 6.3 (o mínimo de JS das setas) são **irmãos** deste, não
   consequências dele — cada um veda uma coisa diferente, e nenhum é redundante.*
2. WHEN "Você também pode gostar" é renderizado com **768px ou mais** THEN ele SHALL
   manter **exatamente** o comportamento atual de `.recomendados-grade`: flex-wrap
   centralizado, base `clamp(150px, 42vw, 240px)`, `max-width: 260px` por card,
   `gap: 20px` — cards centralizados em qualquer quantidade (1 a 4).
3. WHEN a viewport tem 768px ou mais THEN as **setas NÃO** SHALL ser visíveis em
   nenhuma das duas seções.
4. WHEN o CSS do carrossel é escrito THEN as regras do carrossel SHALL viver
   **dentro de uma media query de mobile**, de modo que **remover a media query
   devolva exatamente o CSS de hoje** — a prova, verificável por diff, de que o
   desktop não foi tocado.

### Requirement 8 — SEO: o HTML do servidor traz todos os produtos

**User Story:** Como dono da loja, quero que o Google veja todos os produtos das
duas seções, independentemente de o visitante estar no celular.

#### Acceptance Criteria

1. WHEN a Home é servida THEN **todos** os produtos exibidos — nome, preço e link —
   SHALL estar presentes no **HTML inicial**, verificável com `curl` /
   `view-source`, sem depender de hidratação.
2. WHEN a página de produto é servida THEN **todos** os produtos de "Você também
   pode gostar" SHALL continuar presentes no HTML inicial, como já ocorre hoje.
3. WHEN o carrossel está ativo no mobile THEN **nenhum produto** SHALL ser removido
   do DOM, ocultado com `display: none`, `hidden` ou `aria-hidden` — o carrossel
   controla **rolagem**, não presença. Todos os itens continuam acessíveis a leitor
   de tela e a rastreador.
4. WHEN os links dos cards são renderizados THEN eles SHALL ser **`<a href>` reais**
   para `/produtos/{handle}`, rastreáveis sem execução de JavaScript.

### Requirement 9 — Não quebrar nada do que já funciona

**User Story:** Como dono da loja, quero a Home nova e o carrossel sem arriscar o
template, o preview do Builder, o catálogo, a página de produto ou o carrinho.

#### Acceptance Criteria

1. WHEN a seção de produtos da Home é substituída THEN **todas as demais seções da
   Home** (`Navbar`, `Hero`, `Features`, `HowItWorks`, `Testimonials`, `FAQ`,
   `CTAFinal`, `Footer`) SHALL permanecer **visual e funcionalmente idênticas**, na
   mesma ordem, com os mesmos efeitos, paddings e paleta.
2. WHEN a mudança toca o `PreviewContent` THEN ela SHALL ser **aditiva**, e o
   `MotionConfig reducedMotion="user"`, o wrapper de paleta, o `ParallaxWrapper`, o
   `AnimatedBackground` e a lógica de `disableEntry` da primeira dobra SHALL
   permanecer **funcionalmente intactos**.
3. WHEN a feature é implementada THEN `ProductGrid.tsx` e `lib/useCarousel.ts`
   **NÃO** SHALL ser modificados.
4. WHEN a feature é implementada THEN SHALL permanecer **inalterados**:
   `app/catalogo/page.tsx`, `CatalogoConsultivo`, `ordenarCatalogo`, `CameraBloco`,
   `DestaquesCamera`, `FichaTecnica`, `lib/shopify/specs.ts`, `acessorios.ts`,
   `recomendados.ts`, `client.ts` e a coleção `cameras` do catálogo.
5. WHEN `RecomendadosRelacionados` ganha o carrossel THEN ele SHALL continuar
   **Server Component** (sem `"use client"` próprio) e continuar devolvendo `null`
   quando não há recomendados.
6. WHEN a feature é implementada THEN o **token da Shopify** SHALL continuar
   `server-only`: os componentes de UI importam da camada de dados **apenas tipos**
   (`import type`), e após o build o token e o domínio SHALL ter **0 ocorrências**
   em `.next/static`.
7. WHEN o `_home.json` é editado THEN os campos **legados desconhecidos** SHALL ser
   preservados (`structure.md` → "não 'limpar' o arquivo") e o JSON SHALL continuar
   válido para o `Layout`. *Isto **não** protege os 8 `product1Name…product8Name`:
   o Req 2.3 manda removê-los, e são justamente o dado falso que a feature elimina.*

### Requirement 10 — Salvaguarda: a coleção `destaques` sumindo faz barulho

> ⚠️ **Este requisito vai além do briefing.** Não foi pedido — é o padrão da casa
> (`verificar:resumo`, `verificar:especificacoes`, `verificar:destaques`, e a linha
> de `tech.md`: *"a rede de segurança é estrutural: tipos, `server-only` e checks
> dedicados"*). Se preferir cortar, corte na aprovação: nada nos Reqs 1–9 depende
> dele.

**User Story:** Como desenvolvedor, quero que a coleção `destaques` despublicada ou
renomeada **falhe visivelmente no terminal**, em vez de esvaziar a Home em silêncio.

#### Acceptance Criteria

1. WHEN o check é executado THEN ele SHALL reportar **quantos produtos** a coleção
   `destaques` devolve, **em que ordem manual** e **quantos estão indisponíveis**
   (que o Req 1.6 filtra da tela).
2. IF `collection` vier `null` OR a coleção vier **sem produtos** OR **todos** os
   produtos estiverem indisponíveis THEN o check SHALL sair com **exit code 1**,
   com mensagem apontando as causas prováveis: coleção não publicada no canal
   Storefront, handle trocado, coleção esvaziada, ou estoque zerado.
3. WHEN o check é escrito THEN ele SHALL seguir as convenções dos scripts irmãos:
   Node puro, `process.exitCode` (**nunca** `process.exit()`), mensagem de erro
   **sem interpolar o token**, e `--env-file=.env.local` via script npm.
4. WHEN o check é adicionado THEN ele **NÃO** SHALL ser acoplado ao `npm run build`.
5. IF a coleção `destaques` tiver **mais produtos que o teto do Req 1.5** THEN o
   check SHALL **avisar explicitamente**, nomeando quantos ficaram de fora — e para
   isso ele SHALL buscar **acima** do teto da feature (o precedente da casa é o
   `TETO_DA_API = 250` de `recomendados.ts`). 🔴 *Se o check espelhasse o
   `first: 12`, ele não conseguiria distinguir "exatamente 12" de "13 ou mais" — e
   o aviso nunca dispararia, justamente no caso para o qual existe.* *É o
   silêncio que o próprio teto criou: arrastar o 13º produto no admin não produz
   erro nenhum — ele simplesmente nunca aparece na Home. **Aviso, não exit 1:** ao
   contrário dos casos do Req 10.2, aqui a Home continua correta e vendendo; o
   lojista só precisa saber que o teto foi atingido. Um exit 1 aqui viraria ruído
   permanente numa loja que cresceu — o destino de alarme que a spec
   `catalogo-destaques` já registrou como o pior.*

## Non-Functional Requirements

### Performance

- **Uma requisição a mais no total, não por produto.** A Home passa de 0 para **1**
  chamada à Storefront API por revalidação de ISR (300s). A página de produto **não
  ganha nenhuma** — "Você também pode gostar" já busca hoje.
- **Zero JavaScript de carrossel além das setas.** Sem biblioteca, sem
  `useCarousel`, sem medição em efeito, sem listener de `resize`, sem autoplay. O
  arrasto e o encaixe são **CSS**.
- **Custo de bundle — declarado, não escondido.** Não é "zero JS":
  **`PreviewContent` é `"use client"`**, então tudo que ele renderiza pela
  `componentMap` entra no bundle da Home. O HTML continua completo (client
  components são SSR'd) e o SEO está preservado, mas o custo existe. **Se o design
  escolher entregar a seção como conteúdo já renderizado no servidor**, esse custo
  cai para só o das setas — e essa diferença SHALL ser declarada no design, não
  descoberta depois. Mesma honestidade que `catalogo-destaques` aplicou ao
  `CameraBloco`.
- **O carrossel não pode custar layout shift:** cards com largura e altura estáveis
  (Req 5.7) e imagens no `ImageSlot` existente, com proporção reservada.

### Security

- Token **server-only**: `client.ts` / `queries.ts` / `products.ts` mantêm
  `import "server-only"`. Os componentes novos de UI importam **apenas tipos**.
- A nova busca roda **no servidor**, no mesmo `storefrontFetch` — nenhum caminho
  novo de saída HTTP, nenhuma variável nova de ambiente.
- Após o build, token e domínio em `.next/static` → **0 ocorrências** (critério
  herdado de `catalogo-loja`).
- Nomes, preços e URLs de imagem são **texto renderizado como texto** pelo JSX
  (escapado por padrão) — nada de `dangerouslySetInnerHTML`.

### Reliability

- **A Home nunca cai por causa da Shopify.** Coleção nula, coleção vazia, tudo
  esgotado, API fora do ar ou env ausente convergem todos para "a seção de produtos
  não aparece" — as outras 8 seções seguem renderizando.
- **O build continua passando sem `.env.local`.**
- **Fail-closed na UI:** produto sem imagem cai no placeholder; seção sem produto
  não renderiza título órfão.
- O regime de `/sobre-nos` e das rotas da loja **não muda**.

### Usability

- **pt-BR** em toda a interface e em todo o código de domínio (`structure.md`).
- O carrossel **não captura o scroll vertical** da página: arrastar na diagonal não
  pode prender o dedo do usuário na faixa horizontal.
- Contraste do texto do card e das setas adequado sobre `--cor-card`, usando os
  pares de cor do tema.
- Foco visível ao navegar por teclado, com o respiro do Req 5.9.

### Definition of Done (`tech.md`)

1. `npm run build` passa sem erro de TypeScript; `npx tsc --noEmit` limpo.
2. Saída do build: **`/` com ISR** (mudança esperada — Req 4.1) e **`/sobre-nos`
   ainda `○ (Static)`**; `/catalogo` e `/produtos/[handle]` seguem com ISR.
3. `npm run build` **sem `.env.local`** continua passando.
4. Verificação visual em `npm run dev`:
   - Home com `Q6 → A31H → A38` na ordem manual, com foto, preço e link funcionando;
   - carrossel em 360–414px com o próximo card espiando (Req 5.2) e setas rolando;
   - **grade da Home em ≥768px** centralizada e íntegra (Req 3.9);
   - **"Você também pode gostar" idêntico ao de hoje em ≥768px** (Req 7.2);
   - as outras 8 seções da Home e o `/sobre-nos` inalterados.
5. `rm -rf .next` **antes** de auditar o HTML de um build — lição registrada na spec
   `catalogo-destaques`: um `.next` morno reaproveita o prerender ISR antigo e a
   auditoria de SEO dá falso negativo.
6. `tech.md` atualizado: a linha de `/` na tabela "Modelo de build" passa a ISR, e a
   nota "já planejado" passa a registrar que **esta spec** fez a mudança — senão o
   steering passa a mentir sobre o estado real.
7. Sem suíte de testes formal — a rede de segurança é estrutural (tipos,
   `server-only`, o check do Req 10).
