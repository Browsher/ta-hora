# Implementation Plan

## Task Overview

Execução em **5 blocos**, cada um terminando num estado **íntegro e verificável no
navegador**. A ordem não é arbitrária: ela mantém a Home funcionando o tempo todo e
**separa as duas metades da feature**, para que um problema numa não contamine o
diagnóstico da outra.

| Bloco | O que faz | Estado visível ao final |
|---|---|---|
| **1 — Dados** | query + busca no servidor | **nada muda na tela.** Os produtos chegam e ninguém os lê ainda |
| **2 — Seção da Home** | card → seção → costura → rota → CSS → JSON | a Home mostra **Q6/A31H/A38 de verdade**, em grade, no desktop e no mobile |
| **3 — Carrossel** | setas → faixa → plugar nas 2 seções → CSS | no mobile as duas seções viram carrossel; **o desktop não muda** |
| **4 — Salvaguarda** | `verificar-vitrine-home.mjs` + `package.json` | `npm run verificar:vitrine` funciona |
| **5 — Auditoria** | SEO, não-regressão, DoD, steering | feature validada e o `tech.md` deixa de mentir |

**Por que o Bloco 2 inteiro antes do 3:** o carrossel precisa de uma seção com
produtos reais para ser testado. Construir os dois juntos significaria depurar
"o carrossel está errado" e "os dados estão errados" ao mesmo tempo.

**Por que o Bloco 3 mexe nas duas seções de uma vez:** o `CarrosselMobile` é um
componente só (Req 5.1). Plugá-lo em uma seção agora e na outra depois deixaria a
prova do Req 7.2 (desktop dos recomendados intocado) para um bloco em que ninguém
mais estaria olhando para ela.

## Steering Document Compliance

- **`structure.md` — onde as coisas moram:** query → `lib/shopify/queries.ts`;
  dados → `products.ts`; seção nova → `components/sections/VitrineHome/` (+ barrel);
  primitivos compartilhados → `components/ui/`; UI da loja → `components/loja/`;
  conteúdo editorial → `layouts/_home.json`. Nenhuma tarefa cria arquivo fora disso.
- **`structure.md` — checklist "Nova seção":** a tarefa 2.3 cumpre os passos 1–3
  (arquivo, barrel, **import estático + `componentMap`**), e a 2.2 cumpre os 4–6
  (efeitos por contexto, primitivos de `ui/`, cores por `--cor-*`).
- **`structure.md` — pt-BR:** `VitrineHome`, `CarrosselMobile`, `SetasCarrossel`,
  `getVitrineHome`, `verificar:vitrine`.
- **`tech.md` — fronteira cliente/servidor:** nenhuma tarefa adiciona `server-only`
  a arquivo de UI nem importa **valor** da camada de dados no cliente.
- **`tech.md` — DoD:** o Bloco 5 é literalmente os 7 itens do "Definition of Done",
  incluindo o build **sem `.env.local`** e a atualização do próprio `tech.md`.

## Atomic Task Requirements

Cada tarefa: **1–3 arquivos**, **15–30 min**, **um resultado testável**, arquivos
nomeados explicitamente.

## Task Format Guidelines

- Checkbox numerado: `- [ ] N.M Descrição`
- **Arquivos sempre explícitos**, com `(novo)` ou `(modificar)`
- Detalhes de implementação como bullets; `🔴` marca armadilha que já custou caro
  antes ou que falha **em silêncio**
- `_Requirements: X.Y_` e `_Leverage: caminho/arquivo.ts_` ao final de cada tarefa
- Sem termos vagos ("sistema", "integração", "completo") nos títulos

> **Desvio declarado do template:** ele pede "apenas tarefas de código". Sete
> tarefas aqui são **verificação manual** (1.3, 2.7, 3.6, 5.1, 5.2a, 5.2b, 5.3).
> Não é descuido: `tech.md` define o Definition of Done deste projeto como
> **"build + verificação manual"**, sem suíte de testes formal. Essas tarefas *são*
> a rede de segurança, e por isso são tarefas — não lembretes.

---

## Tasks

### BLOCO 1 — Dados da vitrine (invisível na tela)

- [ ] 1.1 Adicionar `VITRINE_HOME_QUERY` em `lib/shopify/queries.ts`
  - File: `lib/shopify/queries.ts` (modificar)
  - Novo export, **na forma exata já validada no Dev MCP contra a 2026-01 (✅ VALID)**:
    ```graphql
    query ProdutosDestaque($handle: String!, $first: Int!) {
      collection(handle: $handle) {
        products(first: $first, sortKey: MANUAL) {
          nodes {
            id handle title availableForSale
            featuredImage { url altText width height }
            priceRange { minVariantPrice { amount currencyCode } }
          }
        }
      }
    }
    ```
  - 🔴 **`availableForSale` é obrigatório** — o filtro do Req 1.6 depende dele.
    Seguir o precedente da `RECOMENDADOS_QUERY`: o campo entra na **seleção**,
    **nunca** na string de busca
  - 🔴 **SEM `tags` e SEM os 5 metafields** — a Home é vitrine simples (Req 3.3).
    Não copiar a `PRODUCTS_QUERY` inteira "por garantia"
  - **Não** tocar em `PRODUCTS_QUERY`, `PRODUCT_BY_HANDLE_QUERY`,
    `ACESSORIOS_QUERY`, `RECOMENDADOS_QUERY` nem `PRODUTO_PARA_CARRINHO_QUERY`
  - Comentar: qual seção consome, por que `sortKey: MANUAL` (ordem do lojista) e
    por que a seleção é mais magra que a do catálogo
  - Purpose: trazer a vitrine em UMA requisição, sem N+1
  - _Leverage: lib/shopify/queries.ts (PRODUCTS_QUERY como forma, RECOMENDADOS_QUERY como precedente do availableForSale)_
  - _Requirements: 1.1, 1.2, 1.10, 3.3_

- [ ] 1.2 Adicionar `getVitrineHome()` e `RawVitrineProduto` em `lib/shopify/products.ts`
  - File: `lib/shopify/products.ts` (modificar)
  - Constantes no topo, junto de `CATALOGO_COLLECTION_HANDLE`:
    `const HOME_COLLECTION_HANDLE = "destaques"` e `const HOME_VITRINE_TETO = 12`
  - Tipo cru local: `interface RawVitrineProduto extends RawProductCard { availableForSale: boolean }`
  - `export async function getVitrineHome(): Promise<ProductCard[]>` — molde literal
    do `getProducts()`: mesmo `storefrontFetch`, mesmo `{ revalidate }`, mesmo
    `collection?.products?.nodes ?? []`
  - 🔴 **Filtrar `availableForSale === false` ANTES de normalizar**, e **não**
    reordenar depois — a ordem da API é a ordem manual (Req 1.3)
  - 🔴 **`normalize.ts` NÃO muda.** O campo extra é ignorado por
    `normalizeProductCard` — é exatamente o que `RawRecomendado` já faz
  - Comentar: por que o teto existe (Req 1.5) e que ele se aplica **antes** do
    filtro (12 pedidos, 2 esgotados → 10 na tela)
  - Purpose: a busca de alto nível, com o esgotado morrendo no servidor
  - _Leverage: lib/shopify/products.ts (getProducts), lib/shopify/recomendados.ts (RawRecomendado + filtro em JS)_
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7, 1.9_

- [ ] 1.3 Fechar o Bloco 1 com `npx tsc --noEmit`
  - File: nenhum (verificação)
  - `npx tsc --noEmit` **limpo**
  - Confirmar que `normalize.ts`, `types.ts`, `acessorios.ts` e `recomendados.ts`
    **compilam sem alteração** — é a prova de que `RawVitrineProduto extends`
    funcionou e que o normalizador não precisou mudar
  - Confirmar que **nada mudou na tela** — o Bloco 1 é invisível por construção
  - Purpose: provar que a fundação é aditiva antes de a UI depender dela
  - _Requirements: 1.9_

---

### BLOCO 2 — A seção da Home (troca os placeholders por produtos reais)

- [ ] 2.1 Adicionar a prop opt-in `verDetalhes` em `components/loja/ProductCardLink.tsx`
  - File: `components/loja/ProductCardLink.tsx` (modificar)
  - Assinatura: `{ product, verDetalhes = false }` — 🔴 **default `false`**
  - Quando `true`, renderizar a chamada "Ver detalhes" **dentro do `<Link>` que já
    existe**, como `<span className="vitrine-home__ver-detalhes">`
  - 🔴 **O nome da classe é `vitrine-home__ver-detalhes`, fixado aqui** — a tarefa
    2.5 estiliza exatamente esta classe. Deixá-la "a definir" faria os dois lados
    divergirem
  - 🔴 **NUNCA um `<button>` nem um segundo `<a>`** — o card inteiro já é o link;
    um controle aninhado é DOM inválido e quebra teclado e leitor de tela (Req 3.2)
  - **Não** alterar nada mais — e três coisas que os Reqs 3.4/3.5/3.6 exigem **já
    estão** neste arquivo e têm de continuar intactas:
    - `alt={product.image?.altText ?? product.title}` — 🔴 **é o que salva os 3
      produtos de hoje**, todos com `altText` nulo na loja (Req 3.5)
    - `<PriceTag>` com o valor já formatado pela Shopify (Req 3.4)
    - `<ImageSlot src={… || undefined}>`, que cai no placeholder sozinho (Req 3.6)
    - o clamp de 2 linhas do título, as cores e o hover
  - Verificar que `RecomendadosRelacionados` **continua compilando sem mudança** —
    é o teste de que a prop é mesmo opt-in (Req 7.2)
  - Purpose: o card da Home sem duplicar componente nem tocar nos recomendados
  - _Leverage: components/loja/ProductCardLink.tsx_
  - _Requirements: 3.1, 3.2, 3.4, 3.5, 3.6, 3.8_

- [ ] 2.2 Criar `components/sections/VitrineHome/VitrineHome.tsx` e o barrel
  - Files: `components/sections/VitrineHome/VitrineHome.tsx` (novo),
    `components/sections/VitrineHome/index.ts` (novo)
  - `"use client"`. Props: `{ produtos, idSecao, sectionLabel?, headline?, accentColor? }`
  - 🔴 **`produtos.length === 0` → `return null`** — sem título órfão, sem container
    vazio (Req 1.8)
  - 🔴 **Contêiner externo: cópia literal do `ProductGridGrid`** — `<section>` com
    `padding: "clamp(64px, 8vw, 96px) 0"`, div interna com `maxWidth: 1200`,
    `margin: "0 auto"`, `padding: "0 clamp(20px, 5vw, 64px)"`. **A conta dos 72% do
    carrossel depende deste padding horizontal**; mudá-lo invalida o Bloco 3
  - Cabeçalho no padrão do `GridHeader`: `SectionLabel` + `Heading` (`as="h2"`,
    `size="medio"`) centralizados — o `Heading` preserva o realce `%%…%%` da headline
  - Efeitos como as seções irmãs: `useSectionEffects()`, **`useEffectsMode()`** e
    `buildSectionContainerProps(se?.sectionEntry, mode)` + `buildSectionItemProps(...)`
    - 🔴 **o `mode` não é opcional** — sem ele a animação de entrada é construída
      errada e a seção destoa das vizinhas, sem erro nenhum
  - Corpo: `<div className="vitrine-home__grade">` com um `<ProductCardLink verDetalhes />`
    por produto — **grade simples por enquanto**; o carrossel entra na tarefa 3.3
  - `import type { ProductCard }` — **tipo apenas** (fronteira cliente/servidor)
  - Purpose: a seção nova, sem tocar no `ProductGrid` do template
  - _Leverage: components/sections/ProductGrid/ProductGrid.tsx (GridHeader e o contêiner como PADRÃO, não import), components/loja/ProductCardLink.tsx, components/ui/Heading.tsx, components/ui/SectionLabel.tsx_
  - _Requirements: 1.8, 2.1, 2.4, 3.1, 3.9_

- [ ] 2.3 Costurar a vitrine no `components/preview/PreviewContent.tsx`
  - File: `components/preview/PreviewContent.tsx` (modificar)
  - **Import estático** de `VitrineHome` + **entrada no `componentMap`** (checklist
    do `structure.md`; o Turbopack não faz import dinâmico)
  - 🔴 **`ProductGrid` CONTINUA importado e registrado** — outros JSONs e o preview
    do Builder dependem dele. Removê-lo do mapa é regressão mesmo sem tocar no
    arquivo dele (Req 2.5)
  - `PreviewContentProps` ganha **um opcional**: `produtosVitrine?: ProductCard[]`
    (`import type` — o arquivo é `"use client"`)
  - Dentro do `map`, a injeção nomeada:
    ```tsx
    const propsDaVitrine =
      section.component === "VitrineHome"
        ? { produtos: produtosVitrine ?? [], idSecao: section.id }
        : null
    ```
    e no JSX, **depois** de `{...section.content}`: `{...propsDaVitrine}`
  - 🔴 **A ordem do spread importa** — `{...propsDaVitrine}` por último garante que
    uma chave `produtos` perdida em algum JSON não vença o servidor
  - 🔴 **NÃO tocar** em `MotionConfig`, no wrapper de paleta, no `ParallaxWrapper`,
    no `AnimatedBackground`, no `disableEntry`, no `firstContentIdx` nem no
    `OWN_ENTRY` (Req 9.2)
  - Comentar **por que** o renderizador genérico ganhou uma exceção nomeada: é a
    primeira seção cujo conteúdo não vem do JSON, e buscar aqui é impossível
    (`"use client"`)
  - Purpose: a costura entre o mundo JSON e o mundo Shopify, num lugar só
  - _Leverage: components/preview/PreviewContent.tsx_
  - _Requirements: 2.1, 2.2, 2.5, 2.6, 9.2_

- [ ] 2.4 Ligar a busca em `app/page.tsx` e declarar o ISR
  - File: `app/page.tsx` (modificar)
  - Adicionar `export const revalidate = 300` (Reqs 4.1/4.2 — **é daqui que vem o
    ISR**, não do `fetch`)
  - Tornar o componente `async`; buscar com `getVitrineHome()` dentro de
    `try/catch`; no `catch`, deixar `[]` e comentar que a Home renderiza sem a
    vitrine
  - Passar `produtosVitrine={produtos}` ao `PreviewContent`
  - 🔴 **NÃO** adicionar `cookies()` nem `headers()` — tirariam a rota de ISR para
    `ƒ` (dynamic), um regime diferente e mais caro (Req 4.4)
  - Manter os `const` de módulo (`layout`, `paleta`, `fundo`) como estão
  - **Não** tocar em `app/sobre-nos/page.tsx` — ele continua `○ Static` (Req 4.3)
  - Purpose: a mudança de regime deliberada, com a busca protegida
  - _Leverage: app/catalogo/page.tsx (try/catch + revalidate), lib/shopify/products.ts_
  - _Requirements: 1.7, 4.1, 4.2, 4.3, 4.4_

- [ ] 2.5 Estilizar a grade da Home em `app/globals.css`
  - File: `app/globals.css` (modificar — bloco novo `/* Vitrine da Home */`)
  - **Fora de qualquer media query** (é a grade de desktop — Req 3.9):
    - `.vitrine-home__grade`: `display:flex`, `flex-wrap:wrap`,
      `justify-content:center`, **`align-items:stretch`** (cards da mesma linha com
      a mesma altura), `gap:20px`
    - `.vitrine-home__grade > *`: `flex: 0 1 clamp(150px, 42vw, 240px)`,
      `max-width: 260px`
  - `.vitrine-home__ver-detalhes`: a chamada do card (classe fixada na tarefa 2.1)
  - 🔴 **Espelhar `.recomendados-grade`, NÃO reusá-la** — o Req 7.2 congela aquela
    classe; acoplar a Home a ela impediria qualquer ajuste futuro (Decisão 6)
  - 🔴 **Zero hex hard-coded** — só variáveis `--cor-*`
  - **Não** alterar `.recomendados-grade`, `.recomendados-secao`, `.catalogo-*` nem
    `.ficha-*`
  - **Vem ANTES da troca no JSON de propósito:** com o CSS já no lugar, a seção nova
    nasce estilizada na tarefa 2.6, em vez de passar por um estado intermediário de
    cards empilhados sem grade
  - Purpose: a grade centralizada e íntegra de 1 a 12 cards
  - _Leverage: app/globals.css (.recomendados-grade como referência visual)_
  - _Requirements: 3.7, 3.9_

- [ ] 2.6 Trocar a seção de produtos em `layouts/_home.json`
  - File: `layouts/_home.json` (modificar — **só a entrada de índice 3**)
  - `"component": "ProductGrid"` → `"VitrineHome"`
  - 🔴 **ADICIONAR `content.sectionLabel: "Nossos Produtos"`.** Hoje esse rótulo
    **não está no JSON** — vem do `DEFAULT_CONTENT` do `ProductGrid`. Ao trocar o
    componente ele **sumiria da tela em silêncio**. Escrever em **caixa normal**: o
    `SectionLabel` já aplica `text-transform: uppercase`
  - **REMOVER** todas as chaves `product*` (hoje: `product1Name`, `product2Name`,
    `product3Name`) — é o dado falso que a feature elimina
  - **PRESERVAR** `id`, `type`, `variation`, `effect`, `effects`,
    `content.headline` (com o `%%Escolha%%`), `content.gridWidth` e **qualquer campo
    desconhecido** (Req 9.7)
  - 🔴 **NÃO tocar nas outras 8 entradas** nem na ordem da lista
  - Purpose: o conteúdo editorial fica no JSON; o produto passa a vir da Shopify
  - _Leverage: layouts/_home.json_
  - _Requirements: 2.3, 9.7_

- [ ] 2.7 Verificar o Bloco 2 no navegador
  - File: nenhum (verificação em `npm run dev`)
  - **Home:** `Q6 → A31H → A38` **nesta ordem** (a ordem manual do admin), com foto,
    preço e "Ver detalhes" levando a `/produtos/{handle}`
  - 🔴 **O rótulo "NOSSOS PRODUTOS" está na tela?** É a prova da tarefa 2.6 — se
    sumiu, o `sectionLabel` não foi para o JSON e o default do `ProductGrid` já não
    existe para cobrir
  - **A headline mantém o realce** de `%%Escolha%%` na palavra "Escolha"
  - **`alt` das imagens:** inspecionar uma no DevTools — como os 3 produtos têm
    `altText` nulo na loja, o `alt` tem de trazer o **título do produto** (Req 3.5)
  - **As outras 8 seções idênticas:** `Hero` visível na primeira dobra (a lógica
    `disableEntry` intacta), `Features`, `HowItWorks`, `Testimonials`, `FAQ`,
    `CTAFinal`, `Navbar`, `Footer` — mesma ordem, mesmos espaçamentos, parallax e
    fundo animado funcionando
  - **`/sobre-nos` renderiza igual** — o `PreviewContent` é compartilhado
  - **Grade íntegra** em desktop e mobile (ainda sem carrossel), sem estouro
  - **Portão do bloco:** `npx tsc --noEmit` **limpo** antes de seguir para o Bloco 3
  - Purpose: provar a metade "produtos reais" antes de mexer na apresentação
  - _Requirements: 1.3, 2.3, 2.4, 2.6, 3.1, 3.4, 3.5, 3.9, 9.1_

---

### BLOCO 3 — Carrossel no mobile (as duas seções)

- [ ] 3.1 Criar `components/ui/SetasCarrossel.tsx`
  - File: `components/ui/SetasCarrossel.tsx` (novo)
  - `"use client"` — **é o único JavaScript novo da feature**
  - `{ alvo }: { alvo: string }`. Renderiza **o wrapper `.carrossel__setas`** com
    dois `<button type="button">`, glifos `‹` e `›`, `aria-label` "Anterior" /
    "Próximo" e `aria-controls={alvo}`
  - Handler, **tudo dentro do clique**:
    ```
    faixa = document.getElementById(alvo); if (!faixa) return
    primeiro = faixa.firstElementChild
    larguraCard = primeiro ? primeiro.getBoundingClientRect().width : faixa.clientWidth * 0.8
    gap = parseFloat(getComputedStyle(faixa).columnGap) || 0
    suave = !matchMedia("(prefers-reduced-motion: reduce)").matches
    faixa.scrollBy({ left: ±(larguraCard + gap), behavior: suave ? "smooth" : "auto" })
    ```
  - 🔴 **`parseFloat(...) || 0` não é decoração:** `columnGap` devolve string, e
    `"normal"` quando não há gap → `NaN` → `scrollBy` **silenciosamente não faz
    nada**, sem erro no console
  - 🔴 **PROIBIDO aqui:** `useState`, `useEffect`, `useRef`, `addEventListener`,
    autoplay, bolinhas, estado de índice (Req 6.3)
  - 🔴 **NÃO reusar `NavArrow`** — é Framer Motion, e o `MotionConfig reducedMotion`
    existe **só** no `PreviewContent`: na página de produto (sob o `StoreShell`) ela
    ficaria descoberta (Decisão 5)
  - Nos extremos o `scrollBy` é no-op do próprio navegador — o Req 6.7 sai de graça
  - Purpose: a comodidade de clicar, sem carregar estado nenhum
  - _Leverage: components/ui/NavArrow.tsx (só os glifos e os rótulos, como referência)_
  - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.6, 6.7_

- [ ] 3.2 Criar `components/ui/CarrosselMobile.tsx`
  - File: `components/ui/CarrosselMobile.tsx` (novo)
  - 🔴 **SEM `"use client"`** — nenhum hook. É isso que permite a faixa ser
    servidor de verdade dentro do `RecomendadosRelacionados`
  - Props: `{ id, rotulo, quantidade, classeFaixa, children }`
  - Estrutura:
    ```tsx
    <div className="carrossel">
      <div id={id} role="group" aria-label={rotulo}
           data-ativo={quantidade > 1}
           className={`${classeFaixa} carrossel__faixa`}>
        {children}
      </div>
      {quantidade > 1 && <SetasCarrossel alvo={id} />}
    </div>
    ```
  - 🔴 **`data-ativo` é o interruptor, decidido no SERVIDOR** — com 1 item vira
    `"false"`, o CSS não liga o carrossel e as setas nem existem no HTML (Req 5.6)
  - 🔴 **SEM `tabindex`** — a faixa só contém `<a>`; Tab já alcança todos os itens e
    o navegador rola o focado para a vista. Um `tabindex` aqui criaria a parada
    morta que o Req 5.8 proíbe (Decisão 8, emenda aprovada)
  - A faixa acumula **duas classes**: a do consumidor governa o desktop; a
    `.carrossel__faixa` só é lida dentro da media query
  - Purpose: a faixa compartilhada pelas duas seções, sem JavaScript
  - _Leverage: components/ui/SetasCarrossel.tsx_
  - _Requirements: 5.1, 5.6, 5.8, 8.3_

- [ ] 3.3 Plugar o carrossel em `components/sections/VitrineHome/VitrineHome.tsx`
  - File: `components/sections/VitrineHome/VitrineHome.tsx` (modificar — continua da 2.2)
  - Trocar o `<div className="vitrine-home__grade">` por
    `<CarrosselMobile id={idSecao} rotulo="Nossos produtos" quantidade={produtos.length} classeFaixa="vitrine-home__grade">`,
    com os mesmos filhos
  - 🔴 **O `id` vem de `idSecao`, nunca de uma constante** — dois `VitrineHome` no
    mesmo layout gerariam ids duplicados e os dois pares de setas rolariam a
    primeira faixa
  - Purpose: a Home ganha o carrossel sem mudar o que já foi validado no Bloco 2
  - _Leverage: components/ui/CarrosselMobile.tsx_
  - _Requirements: 5.1, 5.6_

- [ ] 3.4 Plugar o carrossel em `components/loja/RecomendadosRelacionados.tsx`
  - File: `components/loja/RecomendadosRelacionados.tsx` (modificar)
  - Trocar o `<div className="recomendados-grade">` por
    `<CarrosselMobile id="carrossel-recomendados" rotulo="Você também pode gostar" quantidade={produtos.length} classeFaixa="recomendados-grade">`,
    com os mesmos filhos
  - 🔴 **Continua Server Component** — não adicionar `"use client"` (Req 9.5)
  - 🔴 **NÃO passar `verDetalhes`** — os cards de recomendados seguem como hoje
  - Manter a guarda `if (produtos.length === 0) return null` e o `Heading` intactos
  - Purpose: a segunda ponta do mesmo componente
  - _Leverage: components/ui/CarrosselMobile.tsx, components/loja/RecomendadosRelacionados.tsx_
  - _Requirements: 5.1, 9.5_

- [ ] 3.5 Estilizar o carrossel em `app/globals.css`
  - File: `app/globals.css` (modificar)
  - **Base (FORA de media query):**
    - 🔴 **`.carrossel__setas { display: none }`** — as setas **existem no HTML** e
      são reveladas só no mobile (Reqs 7.1/7.3). Por isso esta regra é base
    - `.carrossel__setas button`: **`min-width:40px; min-height:40px`** (Req 6.4),
      cores derivadas de `var(--cor-destaque)` por `color-mix` (padrão do
      `.catalogo-filtro`)
  - **Dentro de `@media (max-width: 767.98px)`** — 🔴 **TODO o resto**, para que
    remover o bloco devolva exatamente o CSS de hoje (Req 7.4):
    ```css
    .carrossel__faixa[data-ativo="true"] {
      flex-wrap: nowrap; overflow-x: auto; overflow-y: hidden;
      gap: 12px; padding-block: 6px;
      scroll-snap-type: x mandatory; scroll-padding-inline: 16px;
      justify-content: flex-start; overscroll-behavior-inline: contain;
    }
    .carrossel__faixa[data-ativo="true"] > * {
      flex: 0 0 72%; max-width: none; scroll-snap-align: start;
    }
    .carrossel__setas { display: flex; gap: 8px; justify-content: center; }
    ```
  - 🔴 **`overflow-y: hidden` é obrigatório:** com um eixo em `auto` o outro não pode
    continuar `visible` — sem isso a faixa vira container de rolagem vertical e o
    `hover:-translate-y-1` do card é **clipado** no mobile. O `padding-block: 6px` dá
    o respiro para o card levantar
  - 🔴 **`gap: 12px` é premissa da conta dos 72%** (77,6px de espiada em 360px;
    92,3px em 414px). O `.recomendados-grade` usa 20px no desktop; mudar este valor
    **exige refazer a conta do design**
  - 🔴 **`767.98px`, não `767px`** — cobre viewports fracionários sem deixar 1px de
    vão onde nem carrossel nem grade se aplicariam
  - Adicionar `scroll-behavior: auto` sob `@media (prefers-reduced-motion: reduce)`
    — o par CSS do que o handler já faz em JS (Req 6.6)
  - **Não** alterar nenhuma regra existente de `.recomendados-*`
  - Purpose: o carrossel inteiro em CSS, provadamente isolado do desktop
  - _Leverage: app/globals.css (.recomendados-grade, .catalogo-filtro para o alvo de toque)_
  - _Requirements: 5.2, 5.3, 5.4, 5.5, 5.7, 5.9, 6.4, 6.6, 7.1, 7.3, 7.4_

- [ ] 3.6 Verificar o Bloco 3 no navegador (mobile e desktop)
  - File: nenhum (verificação em `npm run dev`)
  - **Mobile 360px e 414px, nas DUAS seções:** ~1,5 card com o próximo espiando,
    snap encaixando ao arrastar, setas rolando **um card**, **sem rolagem
    horizontal da página**
  - **Hover não cortado:** o card levanta dentro da faixa sem ser clipado
  - **Scroll vertical passa:** arrastar na diagonal rola a página, não prende o dedo
  - 🔴 **Desktop ≥768px:** "Você também pode gostar" **idêntico ao de hoje** —
    comparar lado a lado com `git stash` se preciso (Req 7.2). **Setas invisíveis**
    nas duas seções
  - **Teclado:** Tab percorre os cards; o card focado entra na vista sem encostar na
    borda; as setas têm nome acessível e alvo ≥40px
  - **`prefers-reduced-motion`:** ligar no SO/DevTools e confirmar que a seta pula
    sem deslizar
  - 🔴 **Sem JavaScript:** desabilitar o JS no DevTools e confirmar que a faixa
    **ainda arrasta e encaixa** — o snap é CSS, e as setas são comodidade, não a
    única forma de navegar (Req 6.5). Este passo é o que prova que o carrossel não
    virou dependente de JS sem ninguém notar
  - **Portão do bloco:** `npx tsc --noEmit` **limpo** antes de seguir para o Bloco 4
  - Purpose: provar as duas pontas contra dados reais, antes da auditoria
  - _Requirements: 5.2, 5.3, 5.5, 5.8, 5.9, 6.2, 6.4, 6.5, 6.6, 7.1, 7.2, 7.3_

---

### BLOCO 4 — Salvaguarda de dados (Req 10)

- [ ] 4.1 Criar `scripts/verificar-vitrine-home.mjs`
  - File: `scripts/verificar-vitrine-home.mjs` (novo)
  - Consultar `collection(handle: "destaques")` com `sortKey: MANUAL`
  - 🔴 **Pedir `first: 250`, NÃO 12** — espelhar o teto da feature impediria o script
    de distinguir "exatamente 12" de "13 ou mais", e o aviso do Req 10.5 nunca
    dispararia. `250` é o teto da API, o mesmo valor já usado em `recomendados.ts`
  - **Saída:** quantos produtos, a **ordem manual** (handle a handle), quantos
    indisponíveis (que o Req 1.6 filtra da tela) e quantos excedem o teto de 12
  - **Exit 1** (Req 10.2): `collection` nula, coleção sem produtos, **ou todos
    indisponíveis** — os três casos em que a Home fica **errada**
  - **Aviso sem exit 1** (Req 10.5): mais de 12 produtos. A Home continua correta;
    exit 1 aqui viraria ruído permanente numa loja que cresceu
  - 🔴 **`process.exitCode`, NUNCA `process.exit()`** — o script faz `fetch`, e
    `process.exit()` derruba o processo com handles libuv abertos: no Windows vira
    exit **127** tanto no sucesso quanto na falha
  - **Duplicação declarada** no cabeçalho: Node puro, fora do Next, não pode importar
    `lib/shopify/` (TypeScript + `server-only`); apontar `products.ts` como fonte do
    handle e do teto
  - Mensagem de erro **nunca** interpola o token
  - Purpose: a coleção sumindo faz barulho no terminal, não silêncio na Home
  - _Leverage: scripts/verificar-destaques.mjs (molde completo), lib/shopify/recomendados.ts (TETO_DA_API)_
  - _Requirements: 10.1, 10.2, 10.3, 10.5_

- [ ] 4.2 Registrar o script em `package.json` e rodá-lo
  - File: `package.json` (modificar)
  - Adicionar, no padrão exato dos 7 irmãos:
    `"verificar:vitrine": "node --env-file=.env.local scripts/verificar-vitrine-home.mjs"`
  - 🔴 **Nome `verificar:vitrine`, arquivo `verificar-vitrine-home.mjs`** — **não**
    "destaques": `scripts/verificar-destaques.mjs` **já existe** e é de outra feature
  - 🔴 **NÃO acoplar ao `npm run build`** — o build tem de passar sem `.env.local`
  - Rodar `npm run verificar:vitrine` → deve sair **0**, listando 3 produtos na ordem
    `Q6 → A31H → A38`, 0 indisponíveis e 0 excedentes
  - Purpose: sem esta entrada o `.mjs` existiria mas ninguém o rodaria com o env
  - _Leverage: package.json (scripts verificar:*)_
  - _Requirements: 10.3, 10.4_

---

### BLOCO 5 — Auditoria (DoD do `tech.md`)

- [ ] 5.1 Auditar SEO: os produtos no HTML do servidor
  - File: nenhum (verificação)
  - 🔴 **`rm -rf .next` ANTES de auditar o HTML de um build.** Lição registrada na
    spec `catalogo-destaques`: um `.next` morno **reaproveita o prerender ISR
    antigo**, e a auditoria dá falso negativo sem que o build avise
  - `npm run build && npm start`, depois `curl` em `/` e em
    `/produtos/camera-seguranca-a38`
  - Confirmar no HTML bruto: os **3 produtos da Home** com nome, preço e
    `<a href="/produtos/…">` real; os recomendados idem
  - 🔴 Confirmar que **nenhum produto** tem `display:none`, `hidden` ou `aria-hidden`
    — o carrossel controla rolagem, não presença (Req 8.3)
  - Purpose: o SEO é a razão de a decisão ser server-side; provar, não supor
  - _Requirements: 8.1, 8.2, 8.3, 8.4_

- [ ] 5.2a Auditar não-regressão: o diff dos arquivos tocados
  - File: nenhum (verificação)
  - 🔴 Usar **`git status --short`**, NÃO `git diff --stat`: **5** arquivos são
    **novos** (`VitrineHome.tsx`, `index.ts`, `CarrosselMobile.tsx`,
    `SetasCarrossel.tsx`, `verificar-vitrine-home.mjs`) e ficam untracked —
    `git diff --stat` **não os mostra**, e a auditoria concluiria que faltou
    implementar um quarto da feature
  - Devem aparecer **exatamente** os arquivos das tarefas dos Blocos 1–4, e
    **nenhum outro**. ⚠️ O `.claude/steering/tech.md` **ainda não** aparece aqui: a
    5.4 é que o toca, e roda depois desta tarefa
  - Confirmar **intactos** por diff contra o commit base:
    `components/sections/ProductGrid/ProductGrid.tsx`, `lib/useCarousel.ts`,
    `components/ui/NavArrow.tsx`, `CarouselDots.tsx`, as 8 outras seções da Home,
    `app/sobre-nos/page.tsx`, `layouts/sobre-nos.json`, `lib/shopify/normalize.ts`,
    `types.ts`, `client.ts`, `specs.ts`, `acessorios.ts`, `recomendados.ts`,
    `app/catalogo/page.tsx`, `CatalogoConsultivo`, `ordenarCatalogo`, `CameraBloco`,
    `DestaquesCamera`, `FichaTecnica`, `lib/shopify/destaques.ts`
  - Purpose: provar por diff o que a prosa promete — Reqs 9.3, 9.4 e 9.7
  - _Requirements: 9.3, 9.4, 9.7_

- [ ] 5.2b Auditar não-regressão: as rotas no navegador
  - File: nenhum (verificação)
  - **`/sobre-nos`:** idêntico ao de antes — é a prova de que a costura do
    `PreviewContent` foi mesmo aditiva (Reqs 2.6/9.2)
  - **Home:** as 8 outras seções na mesma ordem, com `Hero` visível na primeira
    dobra (`disableEntry` intacto), parallax e fundo animado (Reqs 9.1/9.2)
  - **`/catalogo`:** os 5 filtros reordenando as 7 câmeras, ordem manual e blocos
    com tarja e destaques intactos
  - **`/produtos/camera-seguranca-a38`:** ficha técnica com os 9 cards, acessórios e
    "Você também pode gostar"; abrir o carrinho e confirmar que funciona
  - Purpose: o que o diff não pega — comportamento em runtime
  - _Requirements: 2.6, 9.1, 9.2, 9.5_

- [ ] 5.3 Fechar o DoD: build, regime de rotas e auditoria de token
  - File: nenhum (verificação)
  - `npx tsc --noEmit` **limpo**
  - `npm run build` passa — 🔴 precedido de `rm -rf .next`
  - 🔴 Na saída do build: **`/` agora com ISR** (a mudança esperada) e
    **`/sobre-nos` ainda `○ (Static)`**; `/catalogo` e `/produtos/[handle]` seguem
    com ISR. Regressão aqui é silenciosa
  - `npm run build` **sem `.env.local`** continua passando (renomear e restaurar) —
    a Home deve renderizar sem a vitrine, não quebrar
  - **Token:** buscar token e domínio em `.next/static` → **0 ocorrências**
  - Purpose: os itens 1–5 do "Definition of Done" de `tech.md`
  - _Requirements: 4.3, 4.5, 9.6_

- [ ] 5.4 Atualizar `.claude/steering/tech.md` para o regime novo da Home
  - File: `.claude/steering/tech.md` (modificar)
  - **Tabela "Modelo de build":** separar a linha que hoje junta `/` e `/sobre-nos`
    em `○ Static` — `/sobre-nos` continua `○ Static`; **`/` passa a ISR 300s**, com a
    origem do regime (`export const revalidate = 300` em `app/page.tsx`)
  - **Bloco "Home estática: o que é regra e o que NÃO é":** a nota que hoje começa
    com *"**Já planejado:** a frente do `ProductGrid` da Home por tag…"* passa a
    registrar que **esta spec fez a mudança**, e que a fonte é a **coleção
    `destaques`**, não uma tag. A verificação "`/` é `○ (Static)`" é substituída por
    "`/` é ISR" — o próprio arquivo já antecipa essa substituição
  - 🔴 **Não mexer em mais nada do arquivo.** O item 2 do DoD continua valendo para
    `/sobre-nos`, `/catalogo` e `/produtos/[handle]`
  - Purpose: sem isto o steering passa a mentir sobre o estado real do projeto
  - _Leverage: .claude/steering/tech.md_
  - _Requirements: 4.1, 4.3_
