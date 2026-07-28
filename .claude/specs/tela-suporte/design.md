# Design Document

## Overview

A `/suporte` é uma **rota de conteúdo**, igual à `/sobre-nos`: um Server Component
de ~15 linhas que importa um JSON de layout e delega ao `PreviewContent`. Todo o
texto vive em `layouts/suporte.json`; o React só sabe desenhar.

A página é montada com **4 seções**, das quais **apenas uma é nova**:

| Ordem | Seção | Origem |
|---|---|---|
| 1 | `Navbar` | existente, sem alteração |
| 2 | `CanaisSuporte` | **NOVA** — cabeçalho + WhatsApp + 2 cards + horário |
| 3 | `FAQ` (`type: "grid"`) | existente, **sem alteração** |
| 4 | `Footer` | existente, sem alteração |

As duas decisões que esta spec pediu para resolver estão em **Decisões-chave**
abaixo: como o FAQ passa a ter as respostas no HTML (§D1) e como o esqueleto
reusa o padrão do `/sobre-nos` (§D2).

## Decisões-chave

### D1 — FAQ com as respostas no HTML: usar `type: "grid"`, sem tocar no componente

**O problema (R2.2).** O `FAQ` renderiza a resposta dentro de
`<AnimatePresence>{isOpen && <motion.div>…}` (`FAQ.tsx:129-144`). Fechada, a
resposta **não existe no DOM** — não é escondida por CSS. `defaultOpen`
(`FAQ.tsx:402`, default `false`) abriria no máximo o item 0. Um accordion padrão
entregaria a `/suporte` com 3 ou 4 respostas invisíveis ao Googlebot, que é
exatamente o que a spec existe para evitar.

**A restrição que estreita as opções.** O `FAQ` **não é código morto de
template**: `layouts/_home.json:180` o usa, em `type` accordion. Alterar o
comportamento do accordion mexeria na Home — e a R9.2 exige mudanças aditivas.

**A saída — o componente já tem o modo certo.** `FAQ` aceita
`type: "accordion" | "grid" | "por-categoria"` (`FAQ.tsx:381`). O **`FAQGrid`**
(`FAQ.tsx:238-284`) renderiza pergunta **e resposta sempre**, em cards, sem
estado, sem `AnimatePresence`, sem `useState`. As 4 respostas ficam no HTML
pré-renderizado por construção.

Opções consideradas:

| Opção | Custo | Risco p/ o que existe | Veredito |
|---|---|---|---|
| Alterar o accordion p/ render+`hidden` | médio | **muda a Home** (R9.2) | descartada |
| Prop opt-in (`sempreNoDom`) no `FAQ` | médio | baixo, mas engorda um componente compartilhado | descartada |
| Componente novo `SuporteFAQ` | alto (~150 linhas duplicadas) | nenhum | descartada |
| **`type: "grid"` no JSON** | **zero código** | **nenhum** | **ESCOLHIDA** |

Consequências, explicitamente:

- **Zero alteração** em `FAQ.tsx`. A Home segue com o accordion que tem hoje.
- **R7.6 não dispara**: ela é condicional (*"IF o FAQ for apresentado como
  accordion"*). No grid não há gatilho, não há estado, não há `aria-expanded` a
  cumprir. A acessibilidade sai de graça — não existe conteúdo colapsado.
- A escolha é **reversível**: é uma string no JSON. Se depois quiserem accordion,
  aí sim entra a prop opt-in, e a decisão volta à mesa com o custo real medido.

> **Achado colateral, FORA do escopo desta spec:** a Home tem o mesmo buraco de
> SEO no FAQ dela (`_home.json:180` usa accordion → respostas fora do DOM).
> Registrado aqui porque foi descoberto agora; corrigir é outra spec, e a decisão
> é do dono.

### D2 — Esqueleto: o padrão de rota de conteúdo do `/sobre-nos`, copiado

`app/suporte/page.tsx` é o gêmeo de `app/sobre-nos/page.tsx` (19 linhas), com uma
única adição: o `export const metadata` que a R2.5 exige. Metadata **estática** não
torna a rota dinâmica — o regime `○ Static` é preservado.

O que **não** entra na página, de propósito, porque mudaria o regime de build ou
o contrato da rota: `cookies()`, `headers()`, `export const revalidate`, qualquer
`fetch`, qualquer import de `lib/shopify/`.

### D3 — Cor do texto sobre o bloco laranja

A R4.5 exige ≥ 4.5:1 sobre `#ff8903`. Medido (fórmula WCAG, luminância relativa
do accent = `0.3916`):

| Cor do texto | Razão | |
|---|---|---|
| `#ffffff` — o que a paleta declara em `destaqueTexto` | **2.38:1** | ✗ reprova |
| `#000000` — o que `contrastColor()` devolve | **8.83:1** | ✓ |
| `#000000` — o `fundo` da paleta (`sobre-nos.json:165`) | **8.83:1** | ✓ |
| `#0D0A08` — o fallback de `page.tsx`, se a paleta faltar | **8.30:1** | ✓ |

Ou seja: **usar `var(--cor-destaque-texto)` no bloco laranja seria um bug de
acessibilidade**, porque a paleta do site carimba `#ffffff` nesse token
(`sobre-nos.json:173`). O `CanaisSuporte` resolve a cor por conta própria:

```ts
// Texto sobre o accent SÓLIDO. Não usa var(--cor-destaque-texto): a paleta do
// site carimba #ffffff ali, e branco sobre #ff8903 dá 2.38:1 (reprova AA).
const corSobreAccent = accentColor.startsWith("#")
  ? contrastColor(accentColor)   // #ff8903 → #000000 (8.83:1)
  : "var(--cor-fundo)"           // accent é var() → cai no fundo escuro (8.30:1)
```

> Nota: `startsWith("#")` também aceita hex de 3 dígitos (`#f80`), e aí
> `contrastColor` faz `slice(1,3)` e devolve `NaN`. A mesma fragilidade já existe
> no `PreviewContent.tsx:150`, então o comportamento é **consistente com o
> projeto**; a paleta do site usa 6 dígitos. Não corrigir aqui — só não introduzir
> hex de 3 dígitos no JSON.

O ramo `var(--cor-fundo)` é o caminho normal (o `PreviewContent` passa
`var(--cor-destaque)` quando o JSON não fixa um hex). Ele **assume um `fundo`
escuro na paleta** — verdade em todas as paletas do site hoje. Se alguém trocar
para uma paleta de fundo claro, este bloco precisa ser reavaliado; por isso o
comentário fica no código.

### D4 — Ícones de marca: SVG inline, porque a `lucide` não os tem mais

**A armadilha.** A `lucide-react` instalada é a **1.24.0**, que **removeu os
ícones de marca**. Verificado no pacote instalado:

```
Instagram → undefined      Mail  → object ✓
                           Clock → object ✓
```

E o `IconSlot` **não falha** quando o nome não resolve: `getLucideIcon`
(`IconSlot.tsx`) devolve `null` e o componente cai no ramo de emoji/texto, que
renderiza **a string literal `"instagram"`** dentro do quadrado do ícone. Sem
erro, sem warning, sem quebrar o build — exatamente a classe de defeito silencioso
que esta spec vem tentando eliminar. Nenhum layout do repo usa `social*Icon`
hoje, então não há precedente para copiar.

**Decisão:**

| Ícone | Como | Por quê |
|---|---|---|
| WhatsApp | **SVG inline** | marca, não existe na lucide |
| Instagram | **SVG inline** | marca, não existe na lucide **1.24.0** |
| E-mail | `IconSlot icon="mail"` | existe ✓ |
| Relógio | `IconSlot icon="clock"` | existe ✓ |

Os dois SVGs inline usam `fill="currentColor"` (herdam a cor do contexto: o
`corSobreAccent` no bloco laranja, o accent no card) e levam `aria-hidden="true"`,
já que o texto ao lado nomeia o canal. Zero dependência nova (R Performance).

## Steering Document Alignment

### Technical Standards (tech.md)

- **Modelo de build:** `/suporte` nasce `○ Static`. Não declara `revalidate`, não
  lê `cookies()`/`headers()`, não chama a Shopify. É a mesma classe de rota que a
  `/sobre-nos` — a única que hoje é estática pura.
- **Conteúdo dirigido por JSON:** o `CanaisSuporte` entra com **import estático +
  registro no `componentMap`** de `PreviewContent.tsx`, manualmente, conforme a
  restrição do Turbopack.
- **`"use client"`:** a seção usa `useSectionEffects()`, então é client — como
  todas as outras seções. A `page.tsx` continua Server Component. O
  pré-render do SSG resolve o SEO: client component prerenderizado **emite HTML**.
- **Sem dependência nova:** o ícone do WhatsApp é SVG inline (a `lucide-react` não
  tem ícone de marca do WhatsApp); o relógio é `lucide` via `IconSlot`, já no
  bundle.
- **Tema:** cores por `var(--cor-*)` e `accentColor`; **nenhum hex hard-coded**.
  Os SVGs de marca usam `currentColor` (herdam, não fixam) e a única cor
  calculada é o `corSobreAccent` do §D3, derivado do accent em runtime. O
  gradiente dos cards vem de `var(--cor-card)`, já derivado pelo tema — ver
  `CardsCanais`.
- **Movimento:** o `MotionConfig reducedMotion="user"` do `PreviewContent` cobre a
  página inteira, porque tudo é renderizado por ele. Nada é montado fora.

### Project Structure (structure.md)

- Seção nova em `components/sections/CanaisSuporte/` com `CanaisSuporte.tsx` +
  `index.ts` (barrel) — pasta = nome do componente, **PascalCase**.
- Layout em `layouts/suporte.json` — nome de arquivo = slug.
- Rota em `app/suporte/page.tsx`.
- **Nomenclatura de domínio em pt-BR** (`rotulo`, `titulo`, `horarioTexto`,
  `corSobreAccent`); nomes de API do React/Next seguem em inglês (`metadata`,
  `content`).
- Ao editar os JSONs existentes, **preservar todo campo legado** — a edição é
  aditiva, só acrescenta `href`.

## Code Reuse Analysis

O peso desta spec está em **configuração**, não em código: 1 componente novo, 4
arquivos existentes tocados de forma aditiva.

### Existing Components to Leverage

- **`PreviewContent`** (`components/preview/PreviewContent.tsx`): renderiza a
  página inteira. Fornece de graça o wrapper de paleta, o `MotionConfig`, o
  `AnimatedBackground`, o parallax e o `disableEntry` da primeira dobra. Só
  precisa ganhar o import + a entrada no `componentMap`.
- **`FAQ`** (`components/sections/FAQ`): reusado **como está**, em `type: "grid"`
  — ver §D1. Já registrado no `componentMap`.
- **`Navbar` / `Footer`**: reusados sem alteração de código. Ambos já aceitam
  `link4Href` (`Navbar.tsx:20`) e `column1Link4Href` (`Footer.tsx:27`) vindos do
  JSON — ligar o link é **edição de dados**, não de componente (R8.3).
- **`SectionLabel`** (`components/ui/`): o rótulo "SUPORTE" — já é
  `uppercase`, `700`, `letter-spacing .14em`, na cor accent. É literalmente o
  átomo pedido pela R3.1.
- **`Heading`**: `as="h1" size="grande"` para "Como podemos ajudar?" (R3.2).
  Suporta o parser `%%destaque%%` caso queiram grifar parte do título depois.
- **`Text`**: subtítulo e descrições, com `color="var(--cor-texto-secundario)"`
  (alpha `0.7`) — atende o piso de contraste sem inventar cor nova.
- **`IconSlot`**: ícones de e-mail (`mail`) e relógio (`clock`), resolvidos por
  nome via lucide. Suporta `bgColor`/`borderColor` para o quadrado do ícone nos
  cards. **Não serve para WhatsApp nem Instagram** — ver §D4.
- **`contrastColor`** (`lib/utils.ts`): a cor do texto sobre o laranja (§D3).
- **`buildSectionContainerProps` / `buildSectionItemProps`**
  (`lib/sectionEffectHelpers.ts`): stagger de entrada, no mesmo padrão de toda
  seção.

### Deliberadamente NÃO reusado

- **`CtaButton`** para o botão do WhatsApp. O tipo é
  `Omit<MotionProps, "ref"> & {...}` (`CtaButton.tsx:13`) e **não inclui `target`
  nem `rel`** — passá-los seria erro de TS. Como a R4.4 exige `target="_blank"` +
  `rel="noopener noreferrer"`, o bloco de destaque renderiza o **seu próprio
  `<a>`**. Alternativa descartada: alargar o tipo do `CtaButton`, que é um
  primitivo usado pela Navbar e por várias seções — mexer nele para uma tela só é
  risco desproporcional.
- **`Hero`** para o cabeçalho. O `Hero` tem `badgeText` via `HighlightBadge`
  (uma pílula), não o rótulo uppercase da R3.1, e traz ~600 linhas de knobs que a
  página não usa. O cabeçalho mora no `CanaisSuporte`, que assim detém **o único
  `<h1>`** da página (R2.3) — não há `Hero` competindo por ele.

### Integration Points

- **`componentMap`** (`PreviewContent.tsx:37-54`): +1 entrada, `CanaisSuporte`.
  Esquecer este passo faz a seção sumir com um `console.warn`, sem quebrar o
  build — é a armadilha nº 1 deste projeto.
- **`layouts/_home.json`**: recebe `link4Href` e `column1Link4Href`.
  **Alcance maior do que parece:** o `StoreShell` (`components/loja/StoreShell.tsx:7,19-22`)
  monta Navbar/Footer **a partir do `_home.json`**. Logo, esta única edição liga o
  link "Suporte" também em `/catalogo` e `/produtos/[handle]`.
- **`layouts/sobre-nos.json`**: recebe os mesmos dois campos.
- **`layouts/suporte.json`**: nasce **já com** os dois campos — ver Data Models.
- **R2.4 (links funcionam sem JS):** satisfeita **por construção**, sem trabalho
  extra — `Navbar.tsx:176,245` e `Footer.tsx:162` renderizam `<a href>` reais, e o
  `CanaisSuporte` idem. Não há handler de clique em nenhum link da página.
- **`app/layout.tsx`**: nenhuma alteração. O `metadata` da rota é sobreposto pelo
  Next automaticamente.

## Architecture

Padrão: **renderizador genérico dirigido por dados**. A rota não conhece seções;
o `PreviewContent` mapeia `section.component` → componente React e espalha
`section.content` como props. O conteúdo é dado; o componente é forma.

```mermaid
graph TD
    A["app/suporte/page.tsx<br/>Server Component + metadata"] -->|importa| B["layouts/suporte.json"]
    A -->|delega| C["PreviewContent<br/>(use client)"]
    B -->|sections[]| C
    C -->|componentMap| D["Navbar"]
    C -->|componentMap| E["CanaisSuporte ★ NOVA"]
    C -->|componentMap| F["FAQ type=grid<br/>(reuso, sem alteração)"]
    C -->|componentMap| G["Footer"]
    E --> E1["Cabecalho<br/>SectionLabel + h1 + Text"]
    E --> E2["DestaqueWhatsApp<br/>&lt;a&gt; proprio, fundo accent"]
    E --> E3["CardsCanais<br/>mailto + instagram"]
    E --> E4["FaixaHorario<br/>IconSlot clock + Text"]
    style E fill:#ff8903,stroke:#111,color:#000
    style F fill:#1c1508,stroke:#ff8903,color:#E8DCC8
```

Fluxo de build: `next build` pré-renderiza a rota → o HTML sai com todo o texto
(cabeçalho, 3 canais, horário, 4 perguntas **e** 4 respostas) → `○ Static`,
coluna `Revalidate` vazia.

## Components and Interfaces

### CanaisSuporte (NOVO)

- **Purpose:** cabeçalho da página + os 3 canais de atendimento + a faixa de
  horário. Cobre R3, R4, R5 e R6.
- **Arquivos:** `components/sections/CanaisSuporte/CanaisSuporte.tsx` +
  `components/sections/CanaisSuporte/index.ts`
- **Interfaces:** segue o contrato de props do `PreviewContent` — recebe `type`,
  `variation`, `effect`, `...content` espalhado, `content` inteiro e
  `accentColor`. **Nenhuma prop nova obrigatória.**
- **Dependencies:** `SectionLabel`, `Heading`, `Text`, `IconSlot`,
  `contrastColor`, `sectionEffectHelpers`, `useSectionEffects`, `useEffectsMode`.
- **Reuses:** todos os átomos de `components/ui/`; o container 1200px e o padding
  `clamp(20px, 5vw, 64px)` copiados do padrão das seções existentes
  (`FAQ.tsx:211`).
- **Sub-blocos internos** (funções no mesmo arquivo, como o `FAQ` faz):
  - `Cabecalho` — `SectionLabel` + `Heading as="h1"` + `Text`
  - `DestaqueWhatsApp` — `<a>` próprio, fundo `accentColor` sólido, radius 24,
    SVG do WhatsApp `aria-hidden`, texto em `corSobreAccent` (§D3)
  - `CardsCanais` — grid de 2, `minmax(260px, 1fr)` → empilha no mobile (R5.4),
    `background: "var(--cor-card)"`, borda accent, radius 12.
    > **Não hard-codear o gradiente.** `var(--cor-card)` **já é o gradiente**:
    > `paletaToVars` (`lib/paleta.ts:65`) passa o slot `card` por `cardGradient()`,
    > que produz `linear-gradient(160deg, #1c1508 0%, color-mix(…92%, black) 100%)`.
    > Escrever os hexes na mão duplicaria o que o tema já faz, violaria o
    > "gradiente derivado na renderização, nunca salvo montado" do `tech.md`, e
    > dessincronizaria dos cards do FAQ logo abaixo (`FAQ.tsx:259` usa
    > `var(--cor-card)`) no dia em que alguém editar a paleta.
  - `FaixaHorario` — `IconSlot icon="clock"` `aria-hidden` + `Text`

**Construção do link do WhatsApp:**

```ts
const hrefWhatsApp =
  `https://wa.me/${numero}?text=${encodeURIComponent(mensagem)}`
```

`encodeURIComponent` é determinístico → mesmo resultado no pré-render e na
hidratação, sem risco de mismatch. A mensagem confirmada pelo dono
("Olá, sou cliente do Ta Hora, preciso de um suporte") tem acentos e vírgula, que
é justamente por que ela **precisa** ser encodada (R Reliability).

**Acessibilidade:** o `<a>` do WhatsApp tem texto visível ("Falar no WhatsApp"),
então **não** leva `aria-label` — seria redundante e um leitor de tela anunciaria
duas vezes. `aria-label` fica reservado aos links dos cards, se o alvo do clique
for o card inteiro. Todo ícone é `aria-hidden` (R6.2).

### FAQ (REUSO — nenhuma alteração de código)

- **Purpose:** as 4 perguntas (R7).
- **Configuração:** `"component": "FAQ"`, `"type": "grid"`, `faqCount: 4`, e os 4
  pares `faqNQuestion`/`faqNAnswer` no JSON.
- **Interfaces:** inalteradas.
- **Reuses:** ele próprio — `FAQGrid`, `FAQHeader`, `Text`.
- **O guard da R7.2:** `FAQ.tsx:392` faz `{ ...DEFAULT_CONTENT, ...content }`. Os
  4 primeiros pares **precisam** estar no JSON; se faltar um, entra boilerplate
  de SaaS ("Existe algum período de teste gratuito?"). Como `faqCount` é 4, os
  pares 5–10 do default são cortados pelo `.slice(0, 4)` (`FAQ.tsx:417`) e nunca
  renderizam. O `faqNCategory` não é usado pelo grid — omitir é seguro.
- **R7.5 — `faqCount` é editável?** **Sim, mas com regra:** o dono pode subir até
  10, **desde que adicione o par pergunta/resposta correspondente no JSON**.
  Subir `faqCount` sem adicionar o par faz vazar o texto de SaaS do
  `DEFAULT_CONTENT`.
  > **Como registrar isso, já que JSON não tem comentário.** `//` em
  > `layouts/suporte.json` é erro de parse — o import é estático e o build
  > quebra. A regra vai numa **chave `"_nota"` dentro do `content`** da seção.
  > É inerte: `content` é `Record<string, unknown>`, a chave é espalhada como
  > prop, o `FAQ` só destrutura o que conhece e nada é repassado ao DOM.
- **`sectionLabel` e `headline` também vão no JSON.** Omitidos, o
  `DEFAULT_CONTENT` entrega "Perguntas frequentes" e
  `"%%Tudo que você%% precisa saber"` — boilerplate de template renderizado como
  `<h2>` pelo `FAQHeader`. Não é violação estrita da R7.2 (não são pares Q/A),
  mas é texto de template em produção. Definir os dois.
- **`type: "grid"` não é usado por nenhum layout do repo hoje** (`_home.json` usa
  accordion, `sobre-nos.json` não tem FAQ). É código real, tipado e alcançável,
  mas a `/suporte` será seu primeiro uso em produção — logo, o **visual é
  inédito** e entra como item explícito na verificação manual.

#### As 4 perguntas e respostas (R7.1 + R7.3)

> 🔴 **NÃO copiar o FAQ da Home.** Os 4 tópicos da R7.1 são quase os mesmos do
> `_home.json`, e copiar é o movimento óbvio — mas `_home.json:186-192` contém
> *"3 a 10 dias úteis"*, *"até 7 dias"* e *"em até 12x"*. Isso **viola a R7.3 em
> 3 das 4 respostas**: são compromissos concretos da loja, num texto que a spec
> definiu como placeholder a ser revisado pelo dono.

Redigidos para a R7.3 — 1–2 frases, sem prazos, valores, percentuais ou
transportadora:

| # | Pergunta | Resposta |
|---|---|---|
| 1 | Qual é o prazo de entrega? | O prazo varia conforme a sua região e a forma de envio escolhida no checkout. Assim que o pedido é despachado, você recebe a confirmação com os dados de acompanhamento. |
| 2 | Os produtos têm garantia? | Sim, todos os produtos têm garantia. Se algo chegar com defeito, fale com a gente pelo WhatsApp que a gente te orienta no próximo passo. |
| 3 | Quais são as formas de pagamento? | As formas de pagamento disponíveis aparecem na hora de finalizar a compra, no checkout. |
| 4 | Como acompanho meu pedido? | Assim que o pedido é enviado, você recebe os dados de acompanhamento no e-mail cadastrado. Qualquer dúvida, fale com a gente pelo WhatsApp. |

São **placeholder**: dizem o que é verdade sem prometer número. O dono troca
depois editando só o JSON.

### app/suporte/page.tsx (NOVO)

- **Purpose:** a rota.
- **Interfaces:** `export const metadata: Metadata` (R2.5) + `default function Page()`.
- **Reuses:** cópia estrutural de `app/sobre-nos/page.tsx` — `getPaleta`,
  `PreviewContent`, o `<main>` com `background: fundo` e `minHeight: 100vh`.
- **Dependencies:** `layouts/suporte.json`.

## Data Models

### `layouts/suporte.json` — Layout

Mesma forma dos layouts existentes. Campos multipágina no molde do
`sobre-nos.json` (`kind: "site-page"`, mesmo `siteId`, `slug: "suporte"`,
`isHome: false`) — mas **`order: 2`, que NÃO é cópia**: o `sobre-nos.json` tem
`order: 1` (linha 161), e duas páginas com a mesma ordem seria ambíguo. E **a
mesma `globalSettings.paleta` de 9 cores**,
carimbada — é ela que garante que a página bate visualmente com o resto do site.

```
Layout
- id: string (uuid novo)
- name: "Suporte"
- slug: "suporte"
- sections: [ Navbar, CanaisSuporte, FAQ, Footer ]   // cada uma com id ÚNICO
- globalSettings.paleta: as 9 cores (cópia de sobre-nos.json)
```

Três detalhes que o `PreviewContent` exige e que é fácil esquecer ao copiar:

1. **Cada seção precisa do seu próprio `id` único** — o renderizador usa
   `key={section.id}` e `id={"section-" + section.id}` (`PreviewContent.tsx:180,187`).
   Copiar o `sobre-nos.json` e deixar os ids repetidos gera colisão de `key` no
   React e ids de DOM duplicados.
2. **A Navbar e o Footer DESTE arquivo também precisam de `link4Href` e
   `column1Link4Href`** apontando para `/suporte`. A `/suporte` é uma das páginas
   que exibe o link "Suporte" (R8.1) — se a cópia for feita antes das edições
   irmãs, a página nasce com o link morto que a spec existe para consertar.
3. **`paddingTop`/`paddingBottom`** default para 80 por seção
   (`PreviewContent.tsx:190-191`) e **somam** com o padding interno da própria
   seção (o FAQ já traz `clamp(64px, 8vw, 96px)`). Seguir o `sobre-nos.json`:
   Navbar `0/0`, Footer `paddingTop: 40, paddingBottom: 0`, seções de conteúdo no
   default.

### `CanaisSuporteContent` — o contrato editável pelo dono

Todos os campos opcionais, com default no componente (padrão de toda seção do
projeto). **Todos os valores reais moram no JSON** (R1.5).

```
CanaisSuporteContent
- rotulo:              string   "SUPORTE"
- titulo:              string   "Como podemos ajudar?"
- subtitulo:           string   "Estamos aqui pra tirar suas dúvidas antes e depois da compra"
- whatsappNumero:      string   "5511984188541"        (só dígitos, com DDI)
- whatsappMensagem:    string   "Olá, sou cliente do Ta Hora, preciso de um suporte"
- whatsappTitulo:      string   "Fale com a gente pelo WhatsApp"
- whatsappDescricao:   string   "É o jeito mais rápido de resolver. Chame que a
                                 gente responde no horário de atendimento."
- whatsappBotaoLabel:  string   "Falar no WhatsApp"
- emailTitulo:         string   "E-mail"
- emailEndereco:       string   "icamera6688@gmail.com"
- instagramTitulo:     string   "Instagram"
- instagramUsuario:    string   "@tahora.com.br"
- instagramUrl:        string   "https://instagram.com/tahora.com.br"
- horarioTexto:        string   "Atendimento: Segunda a Sexta, 9h às 18h"
```

`whatsappNumero` guarda **só dígitos** e `whatsappMensagem` guarda o texto
**cru** — o encode acontece na renderização. Mesmo princípio do `card` da paleta,
que guarda a cor base e deriva o gradiente na hora (tech.md): nunca salvar o
valor já montado, senão editar vira armadilha.

### Dados de contato — confirmados pelo dono

WhatsApp `5511984188541` · e-mail `icamera6688@gmail.com` · Instagram
`@tahora.com.br`. Confirmados explicitamente, resolvendo a pendência registrada
nas requirements.

## Error Handling

Esta página **não tem caminho de falha em runtime**: sem `fetch`, sem env vars,
sem backend, sem estado. Os riscos são todos de *build* ou de *conteúdo* — e
**todos os quatro primeiros falham em silêncio, com o build passando**. É por isso
que a verificação manual é a rede de segurança real aqui.

### Error Scenarios

1. **`CanaisSuporte` fora do `componentMap`**
   - **Handling:** `PreviewContent.tsx:138` faz `console.warn` e retorna `null`.
   - **User Impact:** a seção **some silenciosamente** e o build **passa**. É o
     modo de falha mais perigoso da spec — vira item de verificação explícito.

2. **Um par `faqNQuestion/faqNAnswer` faltando no JSON**
   - **Handling:** nenhum — o merge com `DEFAULT_CONTENT` preenche.
   - **User Impact:** uma pergunta de SaaS aparece na página de uma loja de
     câmeras. Também silencioso. Coberto pela R7.2 e pela verificação de conteúdo.

3. **Nome de ícone que a lucide não resolve** (ex.: `"instagram"` na 1.24.0)
   - **Handling:** `IconSlot` devolve `null` no lookup e cai no ramo de texto.
   - **User Impact:** a **palavra** `instagram` renderiza no lugar do ícone. Sem
     erro, sem warning. Prevenido pelo §D4 (SVG inline para marcas).

4. **JSON malformado**
   - **Handling:** o import é estático e tipado; TypeScript/Turbopack quebram o
     build.
   - **User Impact:** falha ruidosa em build. É o comportamento desejado.

5. **`whatsappNumero` com máscara (`+55 (11) 98418-8541`)**
   - **Handling:** o campo é documentado como "só dígitos"; o `wa.me` não aceita
     máscara.
   - **User Impact:** link quebra ao abrir. Mitigação: chave `"_nota"` no
     `content` da seção (JSON não aceita comentário) + verificação manual do link.

6. **Paleta de fundo claro no futuro**
   - **Handling:** ver §D3 — `corSobreAccent` cairia em `var(--cor-fundo)` claro
     sobre laranja.
   - **User Impact:** contraste ruim no bloco de destaque. Documentado em
     comentário no ponto exato do código.

## Testing Strategy

O `tech.md` fixa o Definition of Done deste projeto: **build + verificação
manual**, sem suíte de testes formal. Esta spec **não** introduz infraestrutura
de teste. A rede de segurança é estrutural (tipos, `componentMap`) mais os checks
abaixo.

### Unit Testing

Não se aplica — não há suíte. A garantia de tipo vem de `npx tsc --noEmit`.

### Integration Testing (checks de build)

1. `rm -rf .next && npm run build` — o `rm -rf` **não é opcional**: build sobre
   `.next` morno reaproveita prerender antigo neste projeto e a verificação passa
   sem provar nada.
2. Na saída: `/suporte` = **`○`** com `Revalidate` **vazia** (R1.2).
3. Na mesma saída, **sem regressão** (R9.1): `/sobre-nos` segue `○` vazio; `/`,
   `/catalogo` e `/produtos/[handle]` seguem com `5m`.
4. `npx tsc --noEmit` limpo (R9.4).
5. Build **sem `.env.local`** continua passando (R1.3).

### End-to-End Testing (verificação manual em `npm run dev`)

Cenários derivados dos requisitos:

- **SEO (R2.1/R2.2):** no **HTML bruto** (`view-source:` ou `curl`, não o
  DevTools — o inspector mostra o DOM já hidratado e mascara justamente o bug que
  procuramos), confirmar o título, os 3 canais, o horário, as 4 perguntas **e as
  4 respostas**. Confirmar também **um único `<h1>`**.
- **Vazamento do default (R7.2):** buscar `"teste gratuito"` e `"limite de
  usuários"` no HTML → **0 ocorrências**.
- **WhatsApp (R4.3/R4.4):** clicar → abre em nova aba, no chat de
  `5511984188541`, com a mensagem **acentuada corretamente** ("Olá", não `Ol%C3%A1`
  nem `Olá`).
- **Canais (R5.2/R5.3):** `mailto:` abre o cliente de e-mail; Instagram abre em
  nova aba.
- **Menu (R8):** clicar "Suporte" na Navbar e no rodapé em `/`, `/sobre-nos` **e
  em `/catalogo`** (que herda o chrome do `_home.json`) → chega em `/suporte`.
  Conferir que Catálogo e Sobre Nós continuam funcionando.
- **Contraste (R4.5):** amostrar a cor do texto sobre o laranja — deve ser
  escura, não branca.
- **Ícones (R5.5, §D4):** confirmar que os quadrados de ícone mostram **desenhos**,
  não a palavra `instagram` escrita. É o defeito silencioso mais provável da spec.
- **FAQ em grid:** `type: "grid"` estreia aqui — conferir o visual dos 4 cards no
  desktop e no mobile, já que nenhum layout do repo exercitava esse modo.
- **Texto de template:** buscar no HTML `"Perguntas frequentes"` e `"precisa
  saber"` — se aparecerem, o `sectionLabel`/`headline` faltaram no JSON.
- **Responsivo (R5.4):** em ~360px, os 2 cards empilham e não há scroll
  horizontal.
- **Reduced motion:** com `prefers-reduced-motion: reduce`, a página não anima.
