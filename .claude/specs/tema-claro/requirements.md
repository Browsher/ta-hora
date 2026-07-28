# Requirements Document

## Introduction

Migrar o site inteiro (loja **Ta Hora**) do tema **ESCURO** (fundo `#000000`,
texto creme `#E8DCC8`) para um tema **CLARO** (fundo `#FAFAF8`, texto `#1A1A1A`),
mantendo o laranja da marca (`#ff8903`) como cor de destaque.

A investigação prévia confirmou que a arquitetura de cor do projeto é
**centralizada**: a paleta vive em variáveis CSS `--cor-*`, os componentes as
consomem (direta ou via prop `accentColor`), `globals.css` não tem hex fora do
`:root`, e a paleta é injetada por `paletaWrapperStyle` em **três** pontos.

> **Nota para o leitor futuro:** `structure.md` e `tech.md` dizem "só existem
> **dois** wrappers de paleta". Isso está **desatualizado**. `grep
> paletaWrapperStyle` devolve três chamadas: `PreviewContent.tsx:136`,
> `StoreShell.tsx:28` e `CarrinhoDrawer.tsx:109` — o drawer ganhou o seu próprio
> wrapper porque é montado no root layout, fora dos outros dois. Esta spec usa
> **três**; não "corrija" para dois.

Portanto esta é uma mudança de **troca de paleta com consertos nomeados**, não
uma caçada a cor hardcoded.

O risco real desta spec **não é quebrar o build** — é produzir **texto
ilegível**. O laranja `#ff8903` sobre `#FAFAF8` dá **2.28:1** (reprova WCAG AA),
e ele é usado como cor de TEXTO e como cor de **anel de foco** em ~25 pontos. Por
isso a spec introduz uma variável de accent **para texto/foco** (laranja fechado)
separada do accent **para superfície** (laranja vibrante), e exige verificação de
contraste tela a tela.

**Escopo estrito: SÓ COR.** Nenhuma mudança de layout, conteúdo, estrutura ou
funcionalidade.

### Medições de referência (WCAG 2.x, recalculadas)

| Par | Razão | Veredito |
|---|---|---|
| `#1A1A1A` sobre `#FAFAF8` | 16.65:1 | passa AAA |
| `#5A5A57` sobre `#FAFAF8` | 6.62:1 | passa AA |
| `#995202` sobre `#FAFAF8` | **5.64:1** | passa AA |
| `#995202` sobre `#F0EFEB` (superfície) | 5.12:1 | passa AA |
| `#000000` sobre `#ff8903` | 8.83:1 | passa AAA |
| `#8E8B85` sobre `#FAFAF8` | **3.25:1** | reprova AA texto normal |
| `#8E8B85` sobre `#F0EFEB` (superfície) | **2.95:1** | reprova AA texto normal |
| `#ff8903` sobre `#FAFAF8` | **2.28:1** | reprova (texto e foco) |
| `#ffffff` sobre `#ff8903` (valor de HOJE) | **2.38:1** | reprova |
| `#E2E0DA` sobre `#FFFFFF` (borda em card) | **1.32:1** | separador decorativo |
| `#FFFFFF` sobre `#FAFAF8` (card em fundo) | **1.05:1** | separador decorativo |

## Alignment with Product Vision

Segundo `product.md`, o Ta Hora é uma **"loja de verdade que vamos crescer"**,
cujo propósito é dar à marca uma **"vitrine rápida e bonita onde o cliente compra
no próprio site"**. A identidade visual é um ativo comercial: preço, botão de
compra e prova social precisam ser **legíveis e confiáveis** para converter.

- **Venda direta:** um tema claro com contraste verificado protege a leitura de
  preço, parcelamento e CTA — os elementos que fecham a venda.
- **Identidade da marca preservada:** o laranja `#ff8903` continua sendo a cor de
  destaque do site; o que muda é o *fundo*, não a marca.
- **Compatibilidade retroativa (`product.md`):** "JSONs exportados por versões
  antigas do Builder devem continuar abrindo sem migração manual". Por isso a
  variável nova de accent-texto entra como campo **opcional** (Req 2.7–2.9).
- **`structure.md` — sistema de paleta:** a mudança respeita o desenho existente
  ("uma paleta sobrescreve as `--cor-*` num WRAPPER, NUNCA no `:root`"), usando
  os slots de `globalSettings.paleta` como fonte da verdade.
- **`tech.md` — regime de build:** nenhuma rota muda de regime. `/` e
  `/catalogo` seguem ISR 300s, `/sobre-nos` e `/suporte` seguem `○ Static`.

## Requirements

### Requirement 1 — Paleta clara carimbada nos layouts

**User Story:** Como visitante da loja, quero ver o site com fundo claro e texto
escuro, para ter uma leitura confortável e uma vitrine moderna.

#### Acceptance Criteria

1. WHEN qualquer uma das três rotas dirigidas por JSON (`/`, `/sobre-nos`,
   `/suporte`) é renderizada THEN o wrapper de paleta SHALL expor
   `--cor-fundo: #FAFAF8`, `--cor-superficie: #F0EFEB`, `--cor-card: #FFFFFF`,
   `--cor-borda: #E2E0DA`, `--cor-texto: #1A1A1A`,
   `--cor-texto-secundario: #5A5A57`, `--cor-texto-fraco: #8E8B85`,
   `--cor-destaque: #ff8903` e `--cor-destaque-texto: #000000`.
2. WHEN a paleta é aplicada THEN ela SHALL ser gravada em
   `globalSettings.paleta` de `layouts/_home.json`, `layouts/sobre-nos.json` e
   `layouts/suporte.json` — os três valores idênticos entre si.
3. WHEN `--cor-destaque-texto` passa de `#ffffff` (valor de hoje, 2.38:1 sobre o
   accent) para `#000000` (8.83:1) THEN todo texto/ícone sobre superfície accent
   SHALL ficar legível sem nenhuma outra alteração naqueles componentes.
4. WHEN as rotas da loja (`/catalogo`, `/produtos/[handle]`) são renderizadas
   THEN elas SHALL herdar a mesma paleta clara, sem alteração própria, porque
   `StoreShell` lê `globalSettings.paleta` de `_home.json`.
5. WHEN o `CarrinhoDrawer` abre em qualquer rota THEN ele SHALL exibir a paleta
   clara, porque `app/layout.tsx` resolve a paleta a partir do mesmo
   `_home.json`.
6. IF um slot de paleta é omitido em algum JSON THEN o sistema SHALL cair no
   `:root` de fábrica (escuro) naquele slot — comportamento a ser evitado; os
   três JSONs SHALL carimbar todos os slots explicitamente.

### Requirement 2 — Accent legível como TEXTO e como FOCO

**User Story:** Como visitante, quero ler rótulos, preços e destaques em laranja
sem esforço sobre o fundo claro, e enxergar onde está o foco do teclado, para não
perder informação de compra nem me perder navegando.

#### Acceptance Criteria

1. WHEN o sistema de paleta é estendido THEN ele SHALL passar a expor uma
   variável adicional `--cor-destaque-texto-forte` com o valor `#995202`
   (5.64:1 sobre `#FAFAF8`; 5.12:1 sobre `#F0EFEB` — passa AA nos dois).
2. WHEN o accent é usado como **cor de texto, ícone ou glifo** (SectionLabel,
   spans `%%destaque%%` do `Heading`, `PriceTag`, números "outline"/"plain" do
   `HowItWorks`, chevron/ícone do `FAQ`, preço e badges do carrinho, hover de
   link do rodapé) THEN o sistema SHALL usar `--cor-destaque-texto-forte`.
3. WHEN um **indicador de foco** é desenhado (hoje
   `outline: 2px solid var(--cor-destaque)` em `globals.css:529` e `:626`) THEN
   ele SHALL usar `--cor-destaque-texto-forte`, porque `#ff8903` dá 2.28:1 —
   abaixo do mínimo de 3:1 exigido pelo WCAG 1.4.11 para indicador de foco. Um
   anel de foco NÃO conta como "superfície decorativa" e portanto **não** é
   coberto pela regra 2.4.
4. WHEN o accent é usado como **fundo, preenchimento ou borda decorativa**
   (`CtaButton` sólido, `BotaoAdicionar`, badge sólido do `HighlightBadge`,
   `NumberBadge` "filled", pill da navbar, `IconeCarrinho`, faixas, dots da
   galeria, `color-mix` de borda/glow) THEN o sistema SHALL manter
   `--cor-destaque` (`#ff8903`) vibrante, inalterado.
5. WHEN um consumidor não define `--cor-destaque-texto-forte` THEN cada ponto de
   uso SHALL degradar para o `accentColor` vigente
   (`var(--cor-destaque-texto-forte, <accentColor>)`), preservando o
   comportamento atual e a possibilidade de override por seção.
6. WHEN o valor `#995202` é revisado visualmente THEN ele SHALL poder ser
   ajustado alterando **um único ponto** (o slot da paleta), sem tocar nos
   pontos de uso.
7. WHEN o novo campo é adicionado à interface `Paleta` (`lib/paleta.ts`) THEN
   ele SHALL ser **opcional** (`destaqueTextoForte?: string`), como todos os
   demais slots.
8. WHEN `paletaWrapperStyle` recebe uma paleta **sem** o campo novo THEN ela
   SHALL simplesmente não emitir a variável — sem valor vazio, sem `undefined`
   em CSS, sem erro.
9. WHEN um JSON de layout antigo (sem o campo) é carregado THEN ele SHALL
   continuar tipando e renderizando sem migração manual, caindo no fallback de
   2.5.
10. WHEN a triagem texto/foco-vs-superfície é feita THEN cada ponto SHALL ser
    classificado individualmente — um mesmo componente pode ter os dois usos
    (ex.: `NumberBadge` usa accent como borda **e** como texto na mesma
    variante).
11. WHEN o `design.md` for escrito THEN ele SHALL conter o **inventário
    exaustivo e enumerado** dos pontos de uso do accent, cada um marcado como
    TEXTO/FOCO ou SUPERFÍCIE, substituindo a estimativa "~25" por uma contagem
    fixa com arquivo e linha.

### Requirement 3 — Consertos nomeados de fundo escuro remanescente

**User Story:** Como visitante, quero que nenhuma faixa preta ou marrom apareça
sobre o fundo claro, para que o site pareça um tema coerente e não um tema
quebrado.

#### Acceptance Criteria

1. WHEN qualquer rota é renderizada THEN `app/layout.tsx` SHALL aplicar no
   `<body>` um fundo claro em vez do `#000000` fixo de hoje (linha 33), de modo
   que nenhuma faixa preta apareça fora dos wrappers de paleta (overscroll,
   `min-height` não preenchida, área abaixo do rodapé).
2. WHEN o documento é renderizado THEN o projeto SHALL declarar
   `color-scheme: light` (hoje **ausente** em todo o código-fonte — `grep
   color-scheme` devolve zero). Sem isso, barras de rolagem nativas, controles
   de formulário, seletores e o fundo de autofill continuam desenhados no
   esquema escuro do navegador sobre uma página agora clara.
3. WHEN a seção `CanaisSuporte` (rota `/suporte`) renderiza o bloco de destaque
   do WhatsApp sobre o accent sólido THEN o texto SHALL usar
   `var(--cor-destaque-texto)` — que a Req 1.1 define como `#000000` (8.83:1
   sobre o accent) — em vez do atual ramo `var(--cor-fundo)` (`#FAFAF8` sobre
   `#ff8903` = 2.38:1, reprova). Nenhum token novo SHALL ser inventado para
   isso: o par accent/accent-texto já existe exatamente para este caso.
4. WHEN o item 3 é implementado THEN o comentário do código que documenta a
   premissa antiga ("ASSUME uma paleta de fundo escuro… numa paleta de fundo
   claro este bloco precisa ser reavaliado") SHALL ser atualizado para descrever
   o novo comportamento, e não deixado mentindo.
5. WHEN as seções `Features` e `CTAFinal` da Home renderizam THEN o `sectionBg`
   chumbado no JSON (`layouts/_home.json:90` e `:212`, ambos
   `linear-gradient(to top, #e59701, #834506)` — marrom escuro) SHALL ser
   substituído por um fundo **claro** coerente com o tema, e o texto dentro
   dessas faixas SHALL ser escuro, atingindo ≥ 4.5:1 contra o ponto mais claro
   **e** o mais escuro do gradiente.
6. WHEN a mudança do item 5 é feita THEN ela SHALL alterar apenas o valor
   `sectionBg` — sem tocar na lista de seções, sua ordem, seu conteúdo ou seu
   `padding`.

### Requirement 4 — Beam do Hero visível no fundo claro

**User Story:** Como visitante da Home, quero continuar vendo o efeito de luz
laranja no Hero, para o site manter a personalidade que tinha no tema escuro.

#### Acceptance Criteria

1. WHEN o `AnimatedBackground` desenha os beams THEN os valores de alpha hoje
   calibrados para fundo preto (`0.06`, `0.11`, `0.09` em
   `AnimatedBackground.tsx:372-374,391`) SHALL ser elevados para uma faixa
   inicial de **0.16–0.28**, e o valor final SHALL ficar registrado no relatório
   de auditoria (Req 5.7).
2. WHEN o beam é desenhado sobre `#FAFAF8` THEN a diferença de luminância entre
   o pixel mais intenso do beam e o fundo puro SHALL ser **perceptível a olho
   nu numa captura de tela da Home** — o critério de aceite é a captura anexada
   ao relatório, não a impressão de quem implementa.
3. WHEN o beam está ativo THEN o headline do Hero SHALL medir **≥ 4.5:1**
   contra o fundo no ponto **mais intenso** do beam que passa atrás dele. Este é
   o critério **vinculante**: se 4.1 e 4.3 conflitarem, 4.3 vence e o alpha cai.
4. IF, na revisão visual, o beam ficar manchado, sujo ou agressivo THEN a
   intensidade SHALL ser reduzida dentro da faixa, ou o efeito desligado na
   Home; a decisão e o motivo SHALL ser registrados no relatório.
5. IF o efeito for desligado THEN isso SHALL ser feito por valor/configuração, e
   NÃO removendo o componente `AnimatedBackground` da árvore.

### Requirement 5 — Auditoria visual e de contraste tela a tela

**User Story:** Como dono da loja, quero que cada tela seja conferida depois da
troca, para descobrir a ilegibilidade antes do cliente descobrir.

#### Acceptance Criteria

1. WHEN a migração é concluída THEN as seis telas principais SHALL ser
   auditadas: **Home (`/`)**, **Catálogo (`/catalogo`)**, **Produto
   (`/produtos/[handle]`)**, **Carrinho (drawer)**, **Sobre Nós
   (`/sobre-nos`)** e **Suporte (`/suporte`)**.
2. WHEN a auditoria roda THEN ela SHALL cobrir também os estados **não-felizes**,
   onde cor hardcoded costuma sobreviver a uma troca de paleta: **estado de erro
   da Shopify** (o "estado de erro amigável" garantido por `structure.md`),
   **catálogo vazio / sem resultado de filtro**, **carrinho vazio**,
   **esqueletos de carregamento** e **`not-found`**.
3. WHEN uma tela é auditada THEN todo texto **de corpo e de título** SHALL
   atingir ≥ 4.5:1 contra o seu fundo efetivo, e todo texto grande (≥ 24px ou
   ≥ 19px bold) SHALL atingir ≥ 3:1.
4. WHEN um elemento de **interface** é auditado THEN a regra aplicada SHALL ser
   a do WCAG 1.4.11: ≥ 3:1 para o que é necessário **identificar o controle**
   (contorno de botão, borda de campo de formulário, estado ativo/selecionado) e
   para **indicadores de foco**. Separadores puramente decorativos — borda de
   card, degrau card/fundo — estão **fora** desta regra e são tratados na Req
   6.2.
5. WHEN cada imagem/asset raster renderizada sobre superfície clara é auditada
   THEN ela SHALL ser verificada visualmente. Os assets vivos hoje são os dois
   logos de marketplace de `layouts/sobre-nos.json:109,111`
   (`mercado-libre-thumbnail…webp` e `images.png`). IF um asset tiver fundo
   preto embutido ou glifo branco e ficar invisível/emoldurado no claro THEN o
   problema SHALL ser **registrado** no relatório; a **substituição** do arquivo
   fica **FORA** do escopo "SÓ COR" desta spec e vira item de follow-up.
6. WHEN a auditoria encontra uma reprovação THEN ela SHALL ser corrigida por
   **cor** (slot de paleta ou ponto de uso), nunca alterando estrutura,
   conteúdo, tamanho ou peso de fonte.
7. WHEN a auditoria termina THEN o resultado SHALL ser gravado em
   **`.claude/specs/tema-claro/auditoria.md`**, com uma seção por tela contendo:
   veredito (aprovado/reprovado), pares medidos com sua razão, o que foi
   corrigido, e as exceções aceitas.
8. IF um ponto reprovar e a correção for julgada fora de escopo THEN ele SHALL
   ser registrado nesse mesmo arquivo como exceção aceita, com o valor medido e
   a justificativa.

### Requirement 6 — Exceções conhecidas registradas, e o que NÃO mexer

**User Story:** Como mantenedor, quero que os pontos limítrofes e os falsos
positivos fiquem escritos, para não os reabrir a cada revisão futura.

#### Acceptance Criteria

1. WHEN `--cor-texto-fraco: #8E8B85` é avaliado THEN o sistema SHALL registrar
   que ele dá **3.25:1** sobre `#FAFAF8` e apenas **2.95:1** sobre a superfície
   `#F0EFEB` (ambos abaixo de AA para texto normal), e que seu uso é aceito
   **apenas** para placeholder e legenda decorativa; IF ele for encontrado em
   texto informativo de corpo THEN aquele ponto SHALL migrar para
   `--cor-texto-secundario` (6.62:1).
2. WHEN os separadores de superfície são avaliados THEN eles SHALL ser
   **pré-registrados como exceções aceitas**, e não tratados como reprovação da
   Req 5: `--cor-borda #E2E0DA` sobre `--cor-card #FFFFFF` = **1.32:1**, e
   `--cor-card #FFFFFF` sobre `--cor-fundo #FAFAF8` = **1.05:1**. São divisórias
   decorativas, não contornos necessários para identificar um controle — o WCAG
   1.4.11 não se aplica a elas. IF, na revisão visual, o degrau card/fundo ficar
   imperceptível a ponto de o card sumir THEN a correção SHALL ser feita
   escurecendo `--cor-borda`, não alterando estrutura.
3. WHEN o `textShadow: rgba(0,0,0,.45)` do `NavArrow` é avaliado THEN ele SHALL
   ser tratado como defeito **cosmético** (halo escuro no claro) — corrigível,
   não bloqueante.
4. WHEN o `cardHoverGlass rgba(255,255,255,.06)` é avaliado THEN ele SHALL ser
   tratado como efeito **opcional** que degrada silenciosamente no claro —
   corrigível, não bloqueante.
5. WHEN o código é varrido THEN os ~30 literais `#D4A017` SHALL ser deixados
   **intactos**: são valores default de prop, sempre sobrescritos pelo
   `accentColor` real vindo do wrapper de paleta.
6. WHEN `lib/tokens.ts` é encontrado THEN seu bloco `colors` SHALL ser deixado
   **intacto**: é código morto, sem consumidor.
7. WHEN overlays de modal `rgba(0,0,0,…)` são encontrados THEN eles SHALL ser
   deixados **intactos**: um backdrop de modal deve escurecer mesmo em tema
   claro.
8. WHEN o `:root` de `app/globals.css` é considerado THEN ele SHALL permanecer
   **ESCURO** (a paleta de fábrica). Ele é o fallback do builder, não o tema do
   site; clareá-lo mascararia o modo de falha descrito em Req 1.6 e na seção
   Reliability. A ÚNICA alteração permitida ali é acrescentar o novo slot
   `--cor-destaque-texto-forte` com o valor de fábrica correspondente ao accent
   escuro, e a declaração de `color-scheme` da Req 3.2.
9. WHEN `lib/estilos.ts` é considerado THEN as oito paletas nomeadas SHALL ser
   deixadas **intactas** — inclusive `minimalista`, cujos valores coincidem com
   a paleta desta spec. Esta spec carimba cores em `globalSettings.paleta`; ela
   não troca o estilo nomeado do site.
10. WHEN `public/uploads/tik-tok-ecommerce-fundo-preto.png` é encontrado THEN ele
    SHALL ser ignorado: nenhum layout o referencia (o TikTok saiu de
    `Marketplaces` no commit `4b84058`). Não é risco e não é para remover nesta
    spec.

### Requirement 7 — Zero regressão funcional e estrutural

**User Story:** Como dono da loja, quero que a troca de tema não mexa em nada
além de cor, para que o site continue vendendo exatamente como vende hoje.

#### Acceptance Criteria

1. WHEN `npx tsc --noEmit` roda THEN ele SHALL terminar sem erros.
2. WHEN `npm run build` roda **após `rm -rf .next`** (obrigatório: um `.next`
   morno reaproveita o prerender ISR e serve HTML antigo, fazendo a auditoria
   mentir) THEN ele SHALL terminar sem erros e sem novos warnings.
3. WHEN a saída do build é comparada com a de antes THEN o **regime de cada
   rota** SHALL permanecer igual: `/` ISR 300s, `/catalogo` ISR 300s,
   `/produtos/[handle]` ISR 300s + `dynamicParams`, `/sobre-nos` `○ Static`,
   `/suporte` `○ Static`.
4. WHEN os JSONs de layout são comparados com a versão anterior THEN o diff
   SHALL conter **apenas** valores de cor (`globalSettings.paleta` e
   `content.sectionBg`) — nenhuma seção adicionada, removida ou reordenada, nem
   texto de conteúdo alterado.
5. WHEN o site é navegado THEN carrinho (adicionar, alterar quantidade, cupom,
   checkout), navegação, carrosséis, FAQ e formulários SHALL funcionar
   exatamente como antes.
6. WHEN a auditoria de SEO é feita THEN o HTML servido SHALL manter o mesmo
   conteúdo textual e a mesma metadata de antes da mudança.

## Non-Functional Requirements

### Performance
- A mudança SHALL ser puramente de valor de cor: nenhum componente,
  dependência, hook ou requisição nova. O tamanho do bundle não deve crescer de
  forma mensurável.
- Se a intensidade do beam do `AnimatedBackground` for aumentada (Req 4), o
  custo de desenho SHALL permanecer o mesmo — muda o alpha, não o número de
  beams nem a taxa de quadros.

### Security
- Sem superfície nova. Nenhuma variável de ambiente, token da Shopify ou rota
  de dados é tocada por esta spec.

### Reliability
- A troca SHALL ser feita pelos slots de paleta e por pontos de uso nomeados,
  de forma que um ajuste de valor futuro (ex.: afinar `#995202`) seja feito em
  um lugar só.
- Nenhum slot de paleta pode ficar ausente nos três JSONs: um slot ausente cai
  silenciosamente no `:root` escuro de fábrica — modo de falha invisível no
  build e visível só na tela.
- O campo novo `destaqueTextoForte` SHALL ser opcional e degradar por fallback
  CSS, de modo que layouts antigos continuem abrindo sem migração
  (`product.md` → compatibilidade retroativa).
- Nenhuma chamada a `cookies()`/`headers()` SHALL ser introduzida em
  `app/layout.tsx` ao consertar o fundo do `<body>` — isso tornaria `/` e
  `/sobre-nos` dinâmicas sem erro nenhum.

### Usability
- **Meta de contraste: WCAG 2.1 AA.** Texto normal ≥ 4.5:1, texto grande ≥ 3:1,
  identificação de controle e indicador de foco ≥ 3:1 (WCAG 1.4.11).
- Exceções abaixo da meta SHALL ser listadas em
  `.claude/specs/tema-claro/auditoria.md` com o valor medido e a justificativa.
  Já conhecidas e pré-aceitas: `--cor-texto-fraco` (3.25:1 / 2.95:1, uso
  restrito a placeholder e legenda) e os separadores de superfície da Req 6.2
  (1.32:1 e 1.05:1, decorativos).
- A identidade laranja da marca SHALL permanecer reconhecível: o accent
  vibrante `#ff8903` continua em botões e faixas; o tom fechado `#995202` é
  usado só onde o laranja precisa ser **lido** (texto) ou **percebido como
  estado** (foco).
