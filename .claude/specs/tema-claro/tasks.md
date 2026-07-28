# Implementation Plan

## Task Overview

Execução em **8 blocos**, na ordem de dependência do design. Cada bloco é uma
unidade coerente de commit; dentro dele as tarefas são atômicas (1–3 arquivos,
15–30 min).

A ordem tem uma propriedade deliberada: **ao fim do Bloco 2 o site já está
claro** — feio, com o laranja ilegível em 46 pontos, mas claro e navegável.
Isso torna cada bloco seguinte uma melhoria *visível e verificável*, em vez de
um salto cego no fim.

| Bloco | O que entrega | Estado do site ao fim |
|---|---|---|
| 1 | Contrato de paleta (slot novo + `:root` + `color-scheme`) | Inalterado (escuro) |
| 2 | Paleta clara carimbada + `<body>` | **Claro**, accent ilegível |
| 3 | Migração T/TC nos primitivos `ui/` (10 pontos) | Rótulos/preços/foco legíveis |
| 4 | Migração T/TC nas seções (17 pontos) | Home e /suporte legíveis |
| 5 | Migração T/TC na loja + `globals.css` (19 pontos) | Catálogo/carrinho legíveis |
| 6 | Consertos nomeados (WhatsApp, faixas creme, beam) | Tema visualmente completo |
| 7 | Auditoria de contraste tela a tela + `auditoria.md` | Acessibilidade provada |
| 8 | Verificação final (tsc, build limpo, regimes, diff) | Zero regressão provada |

**Blocos 1–6 são mecânicos.** O esforço real está nos **Blocos 7 e 8** — esta é
uma spec de **acessibilidade**, não de estética: o entregável não é "ficou
claro", é "está legível e provado".

## Steering Document Compliance

- **`structure.md` — pt-BR nos nomes de domínio:** o slot novo é
  `destaqueTextoForte` / `--cor-destaque-texto-forte`.
- **`structure.md` — paleta no WRAPPER, nunca no `:root`:** o `:root` continua
  escuro (Req 6.8); só ganha o slot novo e o `color-scheme`.
- **`structure.md` — conteúdo em JSON:** as únicas chaves de JSON tocadas são
  `globalSettings.paleta` e `content.sectionBg`.
- **`tech.md` — regime de rota:** nenhuma tarefa introduz `cookies()`,
  `headers()` ou Server Action. A tarefa 2.4 verifica os regimes explicitamente.
- **`tech.md` — prerender ISR morno:** todo build de verificação é precedido de
  `rm -rf .next` (tarefas 2.4, 7.1 e 8.2).

## Atomic Task Requirements

Cada tarefa: **1–3 arquivos**, **15–30 min**, **um resultado testável**,
caminhos de arquivo explícitos, e referência ao inventário do `design.md`
(§1–§6) quando aplicável.

## Tasks

### Bloco 1 — Contrato de paleta

- [ ] 1.1 Adicionar o slot `destaqueTextoForte` à interface `Paleta` e ao mapa de variáveis
  - File: `lib/paleta.ts`
  - Em `interface Paleta`, adicionar `destaqueTextoForte?: string` **opcional**, após `destaqueTexto`
  - Em `PALETA_VARS`, adicionar `destaqueTextoForte: "--cor-destaque-texto-forte"`
  - **NÃO alterar** `paletaToVars` nem `paletaWrapperStyle`: o laço já percorre `Object.keys(PALETA_VARS)` e já pula slots ausentes via `if (valor)`
  - Purpose: expor o décimo slot sem quebrar layouts antigos
  - _Leverage: `lib/paleta.ts` (`PALETA_VARS`, `paletaToVars`)_
  - _Requirements: 2.1, 2.7, 2.8, 2.9_

- [ ] 1.2 Declarar o slot novo e `color-scheme: light` em `app/globals.css`
  - File: `app/globals.css`
  - No `:root`, adicionar `--cor-destaque-texto-forte: #D4A017` (valor de fábrica; o dourado dá 8.31:1 sobre o fundo escuro `#0D0A08` — a fábrica não precisa de tom fechado)
  - Adicionar `color-scheme: light` no `:root`
  - **O `:root` continua ESCURO** — nenhuma outra cor muda ali
  - Purpose: fallback não-vazio para o slot e esquema de cor nativo correto (barra de rolagem, autofill, controles)
  - _Leverage: `app/globals.css` (`:root`, linhas 25–35)_
  - _Requirements: 3.2, 6.8_

- [ ] 1.3 Verificar que o contrato compila e nada mudou visualmente
  - Rodar `npx tsc --noEmit` — deve passar limpo
  - Confirmar que o site continua **escuro e idêntico** (os JSONs ainda não têm o slot; o fallback do `:root` cobre)
  - Purpose: provar que o Bloco 1 é puramente aditivo
  - _Requirements: 2.9, 7.1_

### Bloco 2 — Paleta clara carimbada

- [ ] 2.1 Carimbar a paleta clara em `layouts/_home.json`
  - File: `layouts/_home.json`
  - Substituir `globalSettings.paleta` pelos 10 slots: `fundo #FAFAF8`, `superficie #F0EFEB`, `card #FFFFFF`, `borda #E2E0DA`, `texto #1A1A1A`, `textoSecundario #5A5A57`, `textoFraco #8E8B85`, `destaque #ff8903`, `destaqueTexto #000000`, `destaqueTextoForte #995202`
  - **`card` é COR BASE (`#FFFFFF`), NÃO gradiente** — `cardGradient()` deriva o degradê na renderização; carimbar gradiente pronto quebraria isso
  - Manter `estilo: "elegante"` (é só fallback caso `paleta` suma)
  - **Não tocar** em `sections` — apenas `globalSettings.paleta`
  - Purpose: fonte da verdade do tema; `/catalogo`, `/produtos` e o drawer herdam deste arquivo
  - _Leverage: `lib/paleta.ts` (`cardGradient`), `lib/estilos.ts` (preset `minimalista` como referência)_
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5_

- [ ] 2.2 Carimbar a mesma paleta em `sobre-nos.json` e `suporte.json`
  - Files: `layouts/sobre-nos.json`, `layouts/suporte.json`
  - Copiar **exatamente** o bloco `globalSettings.paleta` da tarefa 2.1 — os três devem ser byte-idênticos
  - Purpose: um slot divergente cai no `:root` escuro — falha invisível no build, visível só na tela
  - _Requirements: 1.2, 1.6_

- [ ] 2.3 Trocar o fundo preto do `<body>` em `app/layout.tsx`
  - File: `app/layout.tsx` (linha 33)
  - `<body style={{ background: "#000000" }}>` → `#FAFAF8`
  - **NÃO** adicionar `cookies()`, `headers()` nem Server Action neste arquivo — isso tornaria `/` e `/sobre-nos` dinâmicas sem erro nenhum
  - **Deixar um comentário no código** avisando que este hex é o **segundo lugar** onde o fundo vive: o `<body>` está fora dos três wrappers e o `:root` é deliberadamente escuro, então trocar `paleta.fundo` nos JSONs **exige** editar aqui também. É a única exceção ao princípio "o ajuste acontece em um lugar"
  - Purpose: eliminar a faixa preta fora dos wrappers (overscroll, área abaixo do rodapé)
  - _Leverage: `app/layout.tsx`_
  - _Requirements: 3.1_

- [ ] 2.4 Verificar os três wrappers e os regimes de rota
  - Rodar `rm -rf .next && npm run build`
  - Confirmar os regimes **inalterados**: `/` ISR 300s, `/catalogo` ISR 300s, `/produtos/[handle]` ISR 300s + `dynamicParams`, `/sobre-nos` `○`, `/suporte` `○`
  - No navegador, inspecionar o estilo inline dos três wrappers (`PreviewContent`, `StoreShell`, drawer aberto) e confirmar que os 10 `--cor-*` estão presentes nos três
  - Purpose: provar que a paleta chega aos três pontos de injeção e que nenhuma rota mudou de regime
  - _Leverage: `components/preview/PreviewContent.tsx:136`, `components/loja/StoreShell.tsx:28`, `components/loja/CarrinhoDrawer.tsx:109`_
  - _Requirements: 1.3, 1.4, 7.2, 7.3_

### Bloco 3 — Migração T/TC nos primitivos `ui/` (10 pontos)

> Padrão único de todo bloco de migração: nos pontos **T/TC**, trocar
> `accentColor` por `` `var(--cor-destaque-texto-forte, ${accentColor})` ``. Nos
> pontos **S**, não tocar. Inventário: `design.md` §1–§6.

- [ ] 3.1 Migrar os spans `%%destaque%%` de `Heading` e `Text`
  - Files: `components/ui/Heading.tsx` (linha 66), `components/ui/Text.tsx` (linha 67)
  - Em ambos, `resolvedHL` passa a resolver para o tom forte quando `highlightColor` não é passado
  - A prop `highlightColor` continua vencendo quando fornecida
  - Purpose: headlines com destaque legíveis (itens 1 e 2 do inventário)
  - _Leverage: prop `highlightColor` já existente nos dois componentes_
  - _Requirements: 2.2, 2.5_

- [ ] 3.2 Migrar `SectionLabel` e `StatNumber`
  - Files: `components/ui/SectionLabel.tsx` (linha 34), `components/ui/StatNumber.tsx` (linha 50)
  - Em ambos, `resolvedColor` passa a resolver para o tom forte quando a prop `color` não é passada
  - **`SectionLabel:59` (o tracinho decorativo) usa a MESMA variável e vai junto — é intencional** (item 4 do inventário): traço e rótulo são a mesma unidade visual
  - Purpose: rótulos de seção e números de estatística legíveis (itens 3, 4, 5)
  - _Leverage: prop `color` já existente nos dois_
  - _Requirements: 2.2, 2.10_

- [ ] 3.3 Migrar os glifos de `StarRating` e `NavArrow`
  - Files: `components/ui/StarRating.tsx` (linha 18), `components/ui/NavArrow.tsx` (linha 76)
  - `StarRating:18` — `color` das estrelas preenchidas → tom forte
  - `NavArrow:76` — `color` do glifo da seta → tom forte
  - **NÃO tocar** `NavArrow:40,41,52,53` (background/border color-mix — superfície, itens 8–11)
  - Purpose: glifos legíveis sem alterar as superfícies das setas (itens 6, 7)
  - _Requirements: 2.2, 2.4_

- [ ] 3.4 Migrar `HighlightBadge` (variante outline) e `CtaButton` (shape link)
  - Files: `components/ui/HighlightBadge.tsx` (linha 36), `components/ui/CtaButton.tsx` (linha 37)
  - `HighlightBadge:36` — só o ramo **outline** (`textColor`); o ramo sólido usa `--cor-destaque-texto` e **já está correto**
  - `CtaButton:37` — `borderBottom 2px` do shape "link": é o sublinhado do rótulo, acompanha o texto
  - **NÃO tocar** `HighlightBadge:39,40` nem `CtaButton:47,48` (superfície, itens 14, 15, 17)
  - Purpose: badges outline e botões-link legíveis (itens 12, 16)
  - _Requirements: 2.2, 2.4_

- [ ] 3.5 Migrar a borda de foco de `Input`
  - File: `components/ui/Input.tsx` (linha 63)
  - O ramo `focused ? accentColor : …` → tom forte (WCAG 1.4.11 exige ≥ 3:1; `#ff8903` dá 2.28:1)
  - **Registrar para a auditoria:** a borda em repouso é `color-mix(var(--cor-texto) 10%, transparent)` — quase invisível no tema claro. Não é ponto de accent, mas é ponto 1.4.11 e entra na tarefa 7.6
  - Purpose: foco de campo visível (item 21)
  - _Requirements: 2.3_

- [ ] 3.6 Conferir os 10 pontos do Bloco 3 contra o inventário
  - Rodar `npx tsc --noEmit`
  - Conferir linha a linha contra `design.md` §1 (rows 1–18) + item 21: **10 migrados** (9 T + 1 TC) · **7 S intactos** · **2 P intactos**
  - Lembrar que o item 4 (`SectionLabel:59`) migra **automaticamente** junto com o item 3 — conta como ponto migrado, mas não é uma edição separada
  - Purpose: garantir que nenhuma superfície foi migrada por engano
  - _Requirements: 2.4, 2.6, 2.10, 7.1_

### Bloco 4 — Migração T/TC nas seções (17 pontos + 1 adiado)

- [ ] 4.1 Migrar o contador do `CTAFinal` — **prioridade máxima**
  - File: `components/sections/CTAFinal/CTAFinal.tsx` (linhas 108, 130)
  - `:108` — dígitos do contador (`color`) → tom forte
  - `:130` — separador `:` do contador (`color`) → tom forte
  - **Por que é o mais grave do inventário:** o `CTAFinal` recebe a faixa creme do Bloco 6; `#ff8903` sobre `#FFF8EF` = **2.26:1**, ilegível na seção de fechamento de venda
  - Purpose: o texto mais proeminente da seção de conversão fica legível (itens 26, 27)
  - _Requirements: 2.2, 3.5_

- [ ] 4.2 Migrar os números do `HowItWorks` e os ícones do `FAQ`
  - Files: `components/sections/HowItWorks/HowItWorks.tsx` (linhas 90, 97), `components/sections/FAQ/FAQ.tsx` (linhas 118, 356)
  - `HowItWorks:97` — número "plain" (`color`) → tom forte
  - `HowItWorks:90` — **só o `color`** do dígito "outline"; o `border 2px solid` na MESMA linha é superfície e **fica** (item 30 — o exemplo canônico de duplo uso)
  - `FAQ:118` — chevron do acordeão; `FAQ:356` — rótulo de categoria
  - **NÃO tocar** `HowItWorks:104,195,227,331,348` nem `FAQ:91,266,349`
  - Purpose: números e ícones legíveis sem achatar as superfícies (itens 28, 29, 36, 37)
  - _Requirements: 2.2, 2.4, 2.10_

- [ ] 4.3 Migrar o logo, o hambúrguer e o hover do rodapé
  - Files: `components/sections/Navbar/Navbar.tsx` (linhas 48, 216, 219), `components/sections/Footer/Footer.tsx` (linha 171)
  - `Navbar:48` — span `%%destaque%%` do logo (T)
  - `Navbar:219` — glifo do hambúrguer (T)
  - `Navbar:216` — `border` color-mix 20.78%: é o **único** contorno do botão hambúrguer → **TC**, migra (não é decoração)
  - `Footer:171` — `color` do link no hover
  - **NÃO tocar** `Navbar:113,120,130` (bordas estruturais, itens 42–44)
  - Purpose: chrome do site legível em toda rota, inclusive mobile (itens 22, 40, 41, 45)
  - _Requirements: 2.2, 2.3_

- [ ] 4.4 Migrar os quatro pontos de texto do `CanaisSuporte`
  - File: `components/sections/CanaisSuporte/CanaisSuporte.tsx` (linhas 199, 249, 258, 336)
  - `:249` ícone do card · `:258` rótulo do card · `:336` ícone de relógio → tom forte
  - `:199` — **caso especial** (item 48): o `<a>` do CTA WhatsApp tem `background: corSobreAccent` e `color: accentColor`; é o *negativo* do bloco. Deixar como está **nesta tarefa** — depende do conserto da 6.1 e será avaliado a olho na 7.5
  - **NÃO tocar** `:159` (background accent do bloco) nem `:240` (border color-mix)
  - Purpose: cards de canal legíveis (itens 46, 47, 49)
  - _Requirements: 2.2, 2.4_

- [ ] 4.5 Migrar os glifos e ícones de `BenefitsCard` e `Features`
  - Files: `components/sections/BenefitsCard/BenefitsCard.tsx` (linhas 60, 100, 110), `components/sections/Features/Features.tsx` (linha 140)
  - `BenefitsCard:60` — glifo `✓`; `:100` — `color` do ícone outline; `:110` — `color` do ícone ghost
  - `BenefitsCard:100` **`borderColor`** na mesma chamada é superfície e **fica** (item 54)
  - `Features:140` — o `color={accentColor}` de `renderIcon` (a **declaração**, não as chamadas em `:192,237,305`)
  - **NÃO tocar** `BenefitsCard:121` (P), `Features:142,184,334,339` (S)
  - Purpose: ícones de benefício e de feature legíveis (itens 52, 53, 55, 57)
  - _Requirements: 2.2, 2.4_

- [ ] 4.6 Conferir os 17 pontos do Bloco 4 contra o inventário
  - Rodar `npx tsc --noEmit`
  - Conferir contra `design.md` §3 (rows 26–58) + item 22: **17 migrados** (16 T + 1 TC) · **14 S intactos** · **2 P intactos** · **1 adiado** (item 48, `CanaisSuporte:199` → tarefa 7.5)
  - Purpose: nenhuma superfície de seção migrada por engano
  - _Requirements: 2.4, 7.1_

### Bloco 5 — Migração T/TC na loja e no CSS (19 pontos)

- [ ] 5.1 Migrar preços e alertas do carrinho
  - Files: `components/loja/CarrinhoDrawer.tsx` (linhas 230, 254), `components/loja/CarrinhoLinha.tsx` (linhas 78, 90)
  - `CarrinhoDrawer:230` preço da linha · `:254` mensagem `role="alert"`
  - `CarrinhoLinha:78` badge de preço · `:90` marcador de atributo
  - **NÃO tocar** `CarrinhoDrawer:150,151` (background/border color-mix)
  - Purpose: preço no carrinho é informação de compra — precisa ser lido (itens 59, 60, 62, 63)
  - _Requirements: 2.2_

- [ ] 5.2 Migrar os botões de acessório e de cupom
  - Files: `components/loja/AcessoriosSugeridos.tsx` (linhas 117, 119), `components/loja/CupomForm.tsx` (linhas 50, 52)
  - `AcessoriosSugeridos:119` e `CupomForm:52` — `color` do rótulo (T)
  - `AcessoriosSugeridos:117` e `CupomForm:50` — `border 1px solid ${accentColor}`: é o **único** contorno de cada botão → **TC**, migra
  - Purpose: dois botões que, sem isso, ficariam sem contorno visível no claro (itens 23, 24, 64, 65)
  - _Requirements: 2.2, 2.3_

- [ ] 5.3 Migrar os 8 pontos de texto de `app/globals.css`
  - File: `app/globals.css` (linhas 294, 491, 518, 722, 733, 747, 762, 828)
  - Cada `color: var(--cor-destaque)` → `var(--cor-destaque-texto-forte, var(--cor-destaque))`
  - `:294` é `.footer-links-cor a:hover` — preservar a cadeia `var(--footer-accent, …)` existente
  - **NÃO tocar** `:516,525,526,607,616,621,622,643,694,732,734,769,823` (superfície) nem `:623,695,770` (P)
  - Purpose: rótulos, selos e ícones do catálogo/ficha legíveis (itens 71, 72, 84, 85, 88, 89, 92, 94)
  - _Leverage: `app/globals.css`_
  - _Requirements: 2.2, 2.4_

- [ ] 5.4 Migrar os três anéis de foco e a borda do botão do catálogo
  - File: `app/globals.css` (linhas 529, 626, 760)
  - `:529` `outline` da seta do carrossel · `:626` `outline` do filtro do catálogo → tom forte
  - **`:626`, não `:627`** — `:627` é `outline-offset`
  - `:760` `border 1px solid` do `.catalogo-bloco__botao` — único contorno do botão → **TC**
  - Purpose: navegação por teclado visível (WCAG 1.4.11; hoje 2.28:1) — itens 19, 20, 25
  - _Requirements: 2.3_

- [ ] 5.5 Conferir os 19 pontos do Bloco 5 e o total de 46
  - Rodar `npx tsc --noEmit`
  - Conferir contra `design.md` §4 (rows 59–70) + §5 (rows 71–94) + itens 19, 20, 23, 24, 25: **19 migrados** (14 T + 5 TC) · **17 S intactos** · **5 P intactos**
  - **Conferência final do inventário:** 10 (Bloco 3) + 17 (Bloco 4) + 19 (Bloco 5) = **46 pontos migrados** (39 T + 7 TC); **44 S** e **10 P** intactos; o item 48 pendente para a 7.5. Total de 101 linhas de tabela.
  - Purpose: fechar a migração com a contagem batendo contra o `Tally` do design
  - _Requirements: 2.2, 2.3, 2.4, 2.6, 2.11, 7.1_

### Bloco 6 — Consertos nomeados

- [ ] 6.1 Consertar o texto sobre o accent no `CanaisSuporte`
  - File: `components/sections/CanaisSuporte/CanaisSuporte.tsx` (linhas ~363–373)
  - No ramo não-hex de `corSobreAccent`: `"var(--cor-fundo)"` → `"var(--cor-destaque-texto)"` (a paleta define `#000000` → 8.83:1 sobre o accent; hoje `#FAFAF8` sobre `#ff8903` = 2.38:1)
  - O ramo `contrastColor(accentColor)` do hex fica **intacto**
  - **Reescrever o comentário de 6 linhas acima** que documenta a premissa antiga ("ASSUME uma paleta de fundo escuro… precisa ser reavaliado") — deixá-lo é deixar o arquivo mentindo sobre o próprio código
  - Purpose: o bloco WhatsApp que o próprio código sinalizou como quebrado no claro
  - _Leverage: par `--cor-destaque` / `--cor-destaque-texto` já existente — nenhum token novo_
  - _Requirements: 3.3, 3.4_

- [ ] 6.2 Trocar o `sectionBg` das faixas Features e CTAFinal para o creme alaranjado
  - File: `layouts/_home.json` (linhas 90 e 212 — **reconferir antes de editar**: o arquivo está sujo na árvore de trabalho e a tarefa 2.1 já o altera; localizar por `grep -n "linear-gradient(to top, #e59701"` em vez de confiar no número)
  - `"linear-gradient(to top, #e59701, #834506)"` → `"linear-gradient(to top, #FFF8EF, #FBE8D2)"` nas duas
  - Alterar **apenas** o valor `sectionBg` — não tocar em seções, ordem, conteúdo ou `padding`
  - Contraste já verificado nos dois extremos: `#1A1A1A` 16.51/14.57 · `#995202` 5.59/**4.93** (a base é a folga mais apertada — se escurecer o creme na revisão, é este número que estoura primeiro)
  - Purpose: faixas quentes que mantêm a identidade laranja sem fundo marrom escuro
  - _Requirements: 3.5, 3.6_

- [ ] 6.3 Elevar a intensidade do beam nas duas escalas
  - File: `components/efeitos/AnimatedBackground.tsx` (linhas 372–374 e 391)
  - **Ramo animado** (multiplicadores, escalados por `BEAM_ALPHAS = [1.0, 0.6, 0.4]` em `:338`): `:372` `0.06`→`0.16` · `:373` `0.11`→`0.28` · `:374` `0.06`→`0.16`
  - **Ramo `prefers-reduced-motion`** (`:391`): o `0.09` é **literal puro**, não multiplicado — `0.09`→`0.20`. Escala independente; ajustar só o ramo animado deixaria usuários de movimento reduzido sem beam
  - **NÃO alterar** número de beams, ângulo ou taxa de quadros — só alpha
  - Purpose: beam laranja perceptível sobre `#FAFAF8` (itens (a) e (b) da §6 do design)
  - _Requirements: 4.1, 4.5_

- [ ] 6.4 Avaliar o beam a olho e medir a trava do headline
  - Files: `components/efeitos/AnimatedBackground.tsx`, `.claude/specs/tema-claro/beam-home.png` (criar)
  - Capturar a Home em `.claude/specs/tema-claro/beam-home.png` e referenciá-la no relatório — a captura **é** a evidência de aceite da Req 4.2, não um extra
  - **Medir o headline do Hero no ponto MAIS INTENSO do beam que passa atrás dele** — precisa dar ≥ 4.5:1. Este critério **vence** o de visibilidade: se conflitar, o alpha cai dentro da faixa 0.16–0.28
  - Simular `prefers-reduced-motion: reduce` no DevTools e avaliar o ramo (b) **separadamente**
  - Se ficar manchado/sujo/agressivo: reduzir, ou desligar por **valor** — nunca removendo o componente da árvore
  - Registrar o valor final e o motivo
  - Purpose: o beam não pode custar a legibilidade da primeira dobra
  - _Requirements: 4.2, 4.3, 4.4, 4.5_

### Bloco 7 — Auditoria de contraste (o coração da spec)

> Esta é uma spec de **acessibilidade**. As tarefas abaixo são o entregável, não
> a formalidade final. Resultado em `.claude/specs/tema-claro/auditoria.md`.

- [ ] 7.1 Criar `auditoria.md` e auditar Home e Sobre Nós
  - Files: `.claude/specs/tema-claro/auditoria.md` (criar), rodar sobre `rm -rf .next && npm run build && npm start`
  - Estrutura do arquivo: uma seção por tela → veredito (aprovado/reprovado), pares medidos com a razão, o que foi corrigido, exceções aceitas
  - Medir em `/` e `/sobre-nos`: texto de corpo/título ≥ 4.5:1 · texto grande ≥ 3:1
  - **Olhar obrigatório:** contador do `CTAFinal` sobre a faixa creme; traço do `SectionLabel` no tom fechado; beam atrás do headline
  - **Verificar os 2 assets vivos** de `sobre-nos.json:109,111` (logos Mercado Livre e Shopee) sobre superfície clara — se tiverem fundo preto embutido ou glifo branco, **registrar**; trocar arquivo é follow-up fora do escopo "SÓ COR"
  - Purpose: as duas telas dirigidas por JSON, incluindo as faixas creme novas
  - _Requirements: 5.1, 5.3, 5.5, 5.6, 5.7, 7.2_

- [ ] 7.2 Auditar o Catálogo
  - File: `.claude/specs/tema-claro/auditoria.md` (continuar)
  - `/catalogo`: selos (`.catalogo-bloco__selo`), filtros (normal / hover / `data-ativo`), títulos de bloco e seus links de hover, tarja, botões, destaques
  - Purpose: a vitrine — primeira tela de compra
  - _Requirements: 5.1, 5.3, 5.6, 5.7_

- [ ] 7.3 Auditar a página de Produto
  - File: `.claude/specs/tema-claro/auditoria.md` (continuar)
  - `/produtos/[handle]`: **preço** (o par mais crítico da spec), ficha técnica, galeria e dots, acessórios sugeridos, recomendados, botão adicionar
  - Purpose: a tela onde o preço decide a venda
  - _Requirements: 5.1, 5.3, 5.6, 5.7_

- [ ] 7.4 Auditar o Carrinho (drawer)
  - File: `.claude/specs/tema-claro/auditoria.md` (continuar)
  - Drawer aberto: preço da linha, badges de atributo, mensagem `role="alert"`, form de cupom, botão de checkout
  - Confirmar que o drawer recebe a paleta pela prop de `app/layout.tsx` (é o terceiro wrapper, o mais fácil de esquecer)
  - Purpose: o último passo antes do checkout
  - _Requirements: 5.1, 5.3, 5.6, 5.7_

- [ ] 7.5 Auditar Suporte e resolver o caso especial do pill do WhatsApp
  - File: `.claude/specs/tema-claro/auditoria.md` (continuar)
  - `/suporte`: cabeçalho, cards de canal, faixa de horário, FAQ grid
  - **Item 48 do inventário:** com o conserto da 6.1, o pill do CTA WhatsApp vira **laranja sobre preto** (8.83:1 — passa). Legível, mas é mudança visual real. Avaliar a olho; se ficar pesado, trocar o par do próprio pill — **não** o token
  - Purpose: a tela cujo código já avisava que quebraria no claro
  - _Requirements: 5.1, 5.3, 5.6, 5.7_

- [ ] 7.6 Auditar foco por teclado e identificação de controle
  - File: `.claude/specs/tema-claro/auditoria.md` (continuar)
  - Percorrer cada tela **só com `Tab`** e confirmar anel visível ≥ 3:1
  - Alvos nomeados: seta do carrossel · filtro do catálogo · botão hambúrguer · botão de cupom · botão de acessório · `.catalogo-bloco__botao` · campo `Input` **em repouso** (borda `color-mix(--cor-texto 10%)`, quase invisível no claro — item 21)
  - Purpose: WCAG 1.4.11 — o grupo TC inteiro existe por causa disto
  - _Requirements: 5.4, 5.7_

- [ ] 7.7 Auditar o estado de erro da Shopify (com restauração da env)
  - File: `.claude/specs/tema-claro/auditoria.md` (continuar)
  - **Antes de qualquer coisa:** copiar `.env.local` para `.env.local.bak`
  - Invalidar o token da Shopify na env e reiniciar o servidor; conferir o estado de erro amigável de `/catalogo` e `/produtos/[handle]`
  - **Ao terminar, RESTAURAR:** `mv .env.local.bak .env.local`, reiniciar e confirmar que o catálogo voltou a carregar. Não deixar a env quebrada — este é o único passo da spec que mexe em configuração de ambiente
  - Purpose: o estado de erro é renderizado por caminho de código que a auditoria feliz nunca visita
  - _Leverage: `try/catch` já existente nas rotas da loja (`structure.md` → "Rota da loja")_
  - _Requirements: 5.2, 5.7_

- [ ] 7.8 Auditar os estados vazios e transitórios
  - File: `.claude/specs/tema-claro/auditoria.md` (continuar)
  - **Catálogo vazio / filtro sem resultado** (aplicar um filtro que não casa com nada)
  - **Carrinho vazio** (abrir o drawer sem itens)
  - **Esqueletos de carregamento** (throttling de rede no DevTools)
  - **`not-found`** (navegar para `/produtos/handle-inexistente`)
  - Purpose: é exatamente onde cor hardcoded sobrevive a uma troca de paleta
  - _Requirements: 5.2, 5.7_

- [ ] 7.9 Fechar o registro de exceções aceitas
  - File: `.claude/specs/tema-claro/auditoria.md` (seção final)
  - Confirmar e **não reabrir**: `--cor-texto-fraco` 3.25:1 sobre o fundo / 2.95:1 sobre a superfície — aceito só para placeholder e legenda; se aparecer em texto de corpo, migrar aquele ponto para `--cor-texto-secundario` (6.62:1)
  - Confirmar os separadores decorativos: borda em card 1.32:1 · card sobre fundo 1.05:1 · faixa creme sobre fundo 1.07:1 (distinção por temperatura, não luminância)
  - Registrar `NavArrow` textShadow (halo escuro, cosmético) e `cardHoverGlass` (efeito que degrada silencioso) — corrigíveis, não bloqueantes
  - Registrar qualquer reprovação corrigida e qualquer exceção nova com valor medido
  - Purpose: o registro é o que impede a próxima revisão de reabrir tudo
  - _Requirements: 5.8, 6.1, 6.2, 6.3, 6.4_

### Bloco 8 — Verificação final de zero regressão

- [ ] 8.1 Conferir o diff dos JSONs
  - Files: `layouts/_home.json`, `layouts/sobre-nos.json`, `layouts/suporte.json`
  - `git diff` deve conter **apenas** `globalSettings.paleta` (3 arquivos) e `content.sectionBg` (2 seções de `_home.json`)
  - Nenhuma seção adicionada, removida ou reordenada; nenhum texto de conteúdo alterado
  - Purpose: provar que só cor mudou nos dados
  - _Requirements: 7.4_

- [ ] 8.2 Rodar tsc e build limpos e conferir os regimes
  - `npx tsc --noEmit` sem erros
  - `rm -rf .next && npm run build` sem erros e **sem novos warnings** (o `.next` morno reaproveita prerender e serve HTML antigo)
  - Regimes inalterados: `/` ISR 300s · `/catalogo` ISR 300s · `/produtos/[handle]` ISR 300s + `dynamicParams` · `/sobre-nos` `○` · `/suporte` `○`
  - Purpose: o modo de falha silencioso do `tech.md` é uma rota trocar de regime sem erro
  - _Requirements: 7.1, 7.2, 7.3_

- [ ] 8.3 Verificar os fluxos funcionais no navegador
  - Navegar e confirmar comportamento idêntico ao de antes: adicionar ao carrinho · alterar quantidade · aplicar cupom · ir ao checkout · menu (desktop e mobile) · carrossel da Home · abrir/fechar FAQ · filtrar catálogo
  - Purpose: provar que a mudança foi só de cor, não de comportamento
  - _Requirements: 7.5_

- [ ] 8.4 Conferir o conteúdo textual e a metadata servidos
  - Comparar o HTML servido de `/`, `/sobre-nos`, `/suporte`, `/catalogo` com o de antes da mudança
  - O conteúdo textual e a metadata devem ser **idênticos** — só os atributos de estilo mudam
  - Purpose: nenhuma regressão de SEO
  - _Requirements: 7.6_

- [ ] 8.5 Varrer os "NÃO MEXER" e confirmar que continuam intactos
  - `git diff` sobre: `lib/tokens.ts` (deve estar vazio) · `lib/estilos.ts` (vazio — as 8 paletas nomeadas, inclusive `minimalista`) · `public/uploads/` (vazio)
  - `grep -c "#D4A017"` nos componentes — a contagem deve bater com a de antes (são defaults de prop, sempre sobrescritos)
  - Confirmar que os overlays `rgba(0,0,0,…)` de modal continuam escuros (backdrop deve escurecer mesmo no tema claro)
  - Purpose: a spec falha tanto por mexer de mais quanto por mexer de menos
  - _Requirements: 6.5, 6.6, 6.7, 6.9, 6.10_
