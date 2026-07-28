# Implementation Plan

## Task Overview

Quatro blocos, executados em ordem. O peso está em **configuração**, não em
código: **1 componente novo**, 1 rota, 1 JSON novo e 2 JSONs existentes tocados
de forma aditiva. Nenhum componente compartilhado muda de comportamento.

| Bloco | Entrega | Arquivos |
|---|---|---|
| **1** | A seção `CanaisSuporte` existe e está registrada | 3 (2 novos, 1 editado) |
| **2** | A rota `/suporte` renderiza a página completa | 2 novos |
| **3** | O link "Suporte" leva a `/suporte` em todo o site | 2 editados |
| **4** | Auditoria: SEO, regime de build e não-regressão | nenhum |

**Ordem obrigatória.** O Bloco 2 sem o Bloco 1 renderiza a página com a seção
principal faltando — e **o build passa** (`PreviewContent.tsx:138` só faz
`console.warn`). O Bloco 4 sem 1–3 não prova nada.

## Steering Document Compliance

- **`structure.md` → checklist de nova seção:** pasta `PascalCase` com
  `<Nome>.tsx` + `index.ts`, import estático **e** entrada no `componentMap`,
  átomos de `components/ui/` em vez de recriar, cores por `var(--cor-*)`.
- **`structure.md` → rota de conteúdo:** `page.tsx` importa o JSON, resolve a
  paleta, delega ao `PreviewContent`. Sem `cookies()`/`headers()`.
- **`structure.md` → JSON:** preservar campos legados ao editar; nomes de domínio
  em pt-BR.
- **`tech.md` → Definition of Done:** build + `tsc --noEmit` + verificação manual.
  Sem suíte de testes — o Bloco 4 é a rede de segurança, e é por isso que ele é
  parte do plano, não um extra opcional.

## Atomic Task Requirements

Cada tarefa: **1–3 arquivos**, **15–30 min**, **um resultado verificável**,
caminhos de arquivo explícitos, referência a requisito e ao código reusado.

---

## Tasks

### BLOCO 1 — A seção `CanaisSuporte`

- [ ] 1. Criar o esqueleto e o cabeçalho em `components/sections/CanaisSuporte/CanaisSuporte.tsx`
  - File: `components/sections/CanaisSuporte/CanaisSuporte.tsx` (novo)
  - `"use client"` no topo; interface `CanaisSuporteContent` com os 14 campos do design (todos opcionais) + `DEFAULT_CONTENT` com os valores confirmados
  - Assinatura no contrato do `PreviewContent`: `{ type, variation, effect, accentColor, content, ...rest }`; merge `{ ...DEFAULT_CONTENT, ...content }`
  - Consumir `useSectionEffects()` / `useEffectsMode()` + `buildSectionContainerProps` / `buildSectionItemProps`
  - Sub-bloco `Cabecalho`: `SectionLabel` (rótulo) + `Heading as="h1" size="grande"` + `Text` com `color="var(--cor-texto-secundario)"`
  - Container: `maxWidth: 1200, margin: "0 auto", padding: "0 clamp(20px, 5vw, 64px)"`
  - **Os 14 campos e seus valores estão enumerados em `design.md` → §Data Models → `CanaisSuporteContent`** — copiar de lá, incluindo `whatsappTitulo` e `whatsappDescricao`. O `DEFAULT_CONTENT` desta tarefa é a **fonte autoritativa** do texto; a tarefa 8 copia daqui para o JSON
  - `Heading` e `Text` recebem o texto pela prop **`text`**, não como children (`components/ui/Text.tsx:12`)
  - Purpose: a seção monta e exibe o cabeçalho, com o **único `<h1>`** da página
  - _Leverage: .claude/specs/tela-suporte/design.md (§Data Models), components/sections/FAQ/FAQ.tsx (esqueleto de seção + container), components/ui/SectionLabel.tsx, components/ui/Heading.tsx, components/ui/Text.tsx, lib/sectionEffectHelpers.ts_
  - _Requirements: 1.5, 2.3, 3.1, 3.2, 3.3_

- [ ] 2. Adicionar o bloco de destaque do WhatsApp em `CanaisSuporte.tsx`
  - File: `components/sections/CanaisSuporte/CanaisSuporte.tsx` (continua da 1)
  - Calcular `corSobreAccent` conforme §D3: `accentColor.startsWith("#") ? contrastColor(accentColor) : "var(--cor-fundo)"` — **não usar `var(--cor-destaque-texto)`** (a paleta carimba `#ffffff` = 2.38:1, reprova)
  - Montar `const hrefWhatsApp = \`https://wa.me/${numero}?text=${encodeURIComponent(mensagem)}\``
  - Renderizar **`<a>` próprio** (não `CtaButton` — o tipo dele não aceita `target`/`rel`) com `target="_blank"` e `rel="noopener noreferrer"`
  - Fundo `accentColor` sólido, `borderRadius: 24`, visualmente maior que os cards
  - **Renderizar os três campos do bloco:** `whatsappTitulo`, `whatsappDescricao` e `whatsappBotaoLabel` (rótulo do `<a>`) — senão dois dos 14 campos ficam definidos e sem uso
  - SVG do WhatsApp **inline**, `fill="currentColor"` + `aria-hidden="true"` (§D4 — a lucide 1.24 não tem ícone de marca)
  - Sem `aria-label` no `<a>`: o texto "Falar no WhatsApp" já o nomeia
  - Purpose: canal principal, com contraste aprovado e link seguro
  - _Leverage: lib/utils.ts (contrastColor), components/ui/Text.tsx_
  - _Requirements: 2.4, 4.1, 4.2, 4.3, 4.4, 4.5_

- [ ] 3. Adicionar os cards de e-mail e Instagram em `CanaisSuporte.tsx`
  - File: `components/sections/CanaisSuporte/CanaisSuporte.tsx` (continua da 2)
  - Grid `repeat(auto-fit, minmax(260px, 1fr))`, `gap: 24` → empilha no mobile
  - `background: "var(--cor-card)"` — **já é o gradiente** (`lib/paleta.ts:65` passa o slot por `cardGradient()`); **não** escrever hexes de gradiente à mão
  - Borda `1px solid color-mix(in srgb, ${accentColor} 12.55%, transparent)`, `borderRadius: 12`
  - E-mail: `IconSlot icon="mail"` + `<a href="mailto:...">`
  - Instagram: **SVG inline** `aria-hidden` (§D4) + `<a href="https://instagram.com/tahora.com.br" target="_blank" rel="noopener noreferrer">`
  - `aria-hidden="true"` vai **direto no `IconSlot`** — verificado por `tsc`: compila, não precisa de `<span>` wrapper
  - Purpose: os dois canais secundários, responsivos e coerentes com o tema
  - _Leverage: components/ui/IconSlot.tsx, components/sections/FAQ/FAQ.tsx:256-277 (padrão de card do grid)_
  - _Requirements: 2.4, 5.1, 5.2, 5.3, 5.4, 5.5_

- [ ] 4. Adicionar a faixa de horário em `CanaisSuporte.tsx`
  - File: `components/sections/CanaisSuporte/CanaisSuporte.tsx` (continua da 3)
  - Faixa discreta: `IconSlot icon="clock"` com `aria-hidden` + `Text` com `color="var(--cor-texto-fraco)"` (alpha `0.55`, o piso permitido)
  - Purpose: horário de atendimento visível sem competir com os canais
  - _Leverage: components/ui/IconSlot.tsx, components/ui/Text.tsx_
  - _Requirements: 6.1, 6.2_

- [ ] 5. Criar o barrel `components/sections/CanaisSuporte/index.ts`
  - File: `components/sections/CanaisSuporte/index.ts` (novo)
  - `export { CanaisSuporte } from "./CanaisSuporte"`
  - Purpose: seguir o padrão de barrel de toda seção do projeto
  - _Leverage: components/sections/FAQ/index.ts_
  - _Requirements: 9.3_

- [ ] 6. Registrar `CanaisSuporte` em `components/preview/PreviewContent.tsx`
  - File: `components/preview/PreviewContent.tsx` (editar)
  - Adicionar o **import estático** junto aos demais (~linha 34) **e** a entrada no `componentMap` (~linha 53)
  - Edição puramente **aditiva**: não remover nem reordenar entradas existentes
  - Purpose: sem este passo a seção some com um `console.warn` **e o build passa** — a armadilha nº 1 do projeto
  - _Leverage: components/preview/PreviewContent.tsx:23-54_
  - _Requirements: 9.2, 9.3_

### BLOCO 2 — A rota `/suporte`

- [ ] 7. Criar `layouts/suporte.json` com o chrome (Navbar + Footer)
  - File: `layouts/suporte.json` (novo)
  - Copiar a estrutura do `layouts/sobre-nos.json`: `kind: "site-page"`, mesmo `siteId`, `slug: "suporte"`, `isHome: false`, e a **`globalSettings.paleta` de 9 cores idêntica**
  - **`order: 2`** — este NÃO é cópia: o `sobre-nos.json` tem `order: 1` (linha 161)
  - **`id` novo e único para o Layout E para cada uma das 4 seções** — o renderizador usa `key={section.id}` (`PreviewContent.tsx:180`); ids repetidos colidem
  - Navbar e Footer copiados, **já com `link4Href: "/suporte"` e `column1Link4Href: "/suporte"`** (a própria página exibe o link)
  - Paddings como no `sobre-nos.json`: Navbar `0/0`, Footer `paddingTop: 40, paddingBottom: 0`
  - Purpose: a página nasce com o chrome do site e sem o link morto que a spec conserta
  - _Leverage: layouts/sobre-nos.json_
  - _Requirements: 1.1, 1.5, 8.1, 8.2_

- [ ] 8. Adicionar a seção `CanaisSuporte` em `layouts/suporte.json`
  - File: `layouts/suporte.json` (continua da 7)
  - Entre Navbar e Footer, com os 14 campos de `content` preenchidos com os valores **confirmados pelo dono**: `5511984188541`, `icamera6688@gmail.com`, `https://instagram.com/tahora.com.br`
  - `whatsappNumero` **só dígitos** (o `wa.me` não aceita máscara) e `whatsappMensagem` com o texto **cru**, não encodado — o encode é na renderização
  - Registrar essa regra numa chave **`"_nota"` dentro do `content`** da seção. ⚠️ **JSON não aceita comentário** (`//` é erro de parse e quebra o build, porque o import é estático). A `_nota` é inerte: é espalhada como prop, o componente só destrutura o que conhece e nada chega ao DOM
  - Copiar os textos do `DEFAULT_CONTENT` escrito na tarefa 1 — não reescrever, para não divergir
  - Purpose: todo o conteúdo editável fora do `.tsx`
  - _Leverage: .claude/specs/tela-suporte/design.md (§Data Models)_
  - _Requirements: 1.5, 3.1, 3.2, 3.3, 4.3, 5.2, 5.3, 6.1_

- [ ] 9. Adicionar a seção `FAQ` em grid a `layouts/suporte.json`
  - File: `layouts/suporte.json` (continua da 8)
  - `"component": "FAQ"`, **`"type": "grid"`** (é o que põe as respostas no HTML — o accordion as remove do DOM), `faqCount: 4`
  - Preencher `sectionLabel` e `headline` — omitidos, vaza o boilerplate "Perguntas frequentes" / "%%Tudo que você%% precisa saber"
  - Os **4 pares** `faq1..faq4Question/Answer` com o texto redigido no design (§As 4 perguntas)
  - 🔴 **NÃO copiar as respostas do FAQ da Home** (`_home.json:186-192`): elas contêm "3 a 10 dias úteis", "até 7 dias", "em até 12x" — compromissos concretos num texto que é placeholder
  - Registrar numa chave **`"_nota"` dentro do `content`** (R7.5) que subir `faqCount` exige adicionar o par correspondente, senão vaza `DEFAULT_CONTENT`. ⚠️ **Não usar `//`** — JSON não aceita comentário e o build quebra
  - R7.6 (`aria-expanded`) **não dispara**: é condicional a accordion, e o grid não tem gatilho nem conteúdo colapsado
  - Purpose: FAQ indexável, sem alterar uma linha de `FAQ.tsx`
  - _Leverage: components/sections/FAQ/FAQ.tsx:238-284 (FAQGrid)_
  - _Requirements: 2.2, 7.1, 7.2, 7.3, 7.4, 7.5_

- [ ] 10. Criar a rota `app/suporte/page.tsx`
  - File: `app/suporte/page.tsx` (novo)
  - Gêmeo de `app/sobre-nos/page.tsx`: importa `layouts/suporte.json`, resolve `paleta`/`fundo`, delega ao `PreviewContent` dentro do `<main>`
  - Adicionar `export const metadata: Metadata` com `title` e `description` próprios em pt-BR
  - **Não** declarar `revalidate`; **não** usar `cookies()`/`headers()`; **não** importar `lib/shopify/`
  - Purpose: a rota existe e é `○ Static`
  - _Leverage: app/sobre-nos/page.tsx_
  - _Requirements: 1.1, 1.3, 1.4, 2.5_

### BLOCO 3 — Ligar o link "Suporte" (só dados)

- [ ] 11. Ligar o link em `layouts/_home.json`
  - File: `layouts/_home.json` (editar)
  - Navbar: adicionar `"link4Href": "/suporte"` ao lado de `"link4Label": "Suporte"` (~linha 24)
  - Footer: adicionar `"column1Link4Href": "/suporte"` (~linha 233)
  - **Preservar todo campo existente** — a edição só acrescenta duas chaves
  - **Alcance:** o `StoreShell` monta Navbar/Footer a partir deste arquivo (`StoreShell.tsx:7,19-22`), então esta edição liga o link também em `/catalogo` e `/produtos/[handle]`
  - Purpose: consertar o link morto (hoje cai em `#sobre` / `#roadmap`)
  - _Leverage: components/sections/Navbar/Navbar.tsx:20, components/sections/Footer/Footer.tsx:27_
  - _Requirements: 8.1, 8.2, 8.3, 8.4_

- [ ] 12. Ligar o link em `layouts/sobre-nos.json`
  - File: `layouts/sobre-nos.json` (editar)
  - Mesmos dois campos: `"link4Href": "/suporte"` (~linha 24) e `"column1Link4Href": "/suporte"` (~linha 146)
  - Não tocar em `link3Label: "Rastreio"` — é a outra spec
  - Purpose: o link funciona também a partir do Sobre Nós
  - _Leverage: layouts/_home.json (mesma edição da tarefa 11)_
  - _Requirements: 8.1, 8.2, 8.3, 8.4_

### BLOCO 4 — Auditoria

> Não é etapa opcional: o `tech.md` define o DoD deste projeto como **build +
> verificação manual**, e os quatro modos de falha mais prováveis desta spec
> **passam no build em silêncio**.

- [ ] 13. Build limpo e regimes de rota
  - Rodar **`rm -rf .next && npm run build`** — o `rm -rf` **não é zelo**: build sobre `.next` morno reaproveita prerender antigo neste projeto e a verificação passa sem provar nada
  - Conferir na saída: `/suporte` = **`○`** com a coluna `Revalidate` **VAZIA**
  - **Não-regressão:** `/sobre-nos` segue `○` vazio; `/`, `/catalogo` e `/produtos/[handle]` seguem com **`5m`**
  - Rodar `npx tsc --noEmit` → limpo
  - Repetir o build **sem `.env.local`** (renomear temporariamente) → continua passando
  - Purpose: provar o regime da rota nova e que nenhum regime existente mudou
  - _Requirements: 1.2, 1.3, 9.1, 9.4_

- [ ] 14. Auditoria de SEO no HTML bruto
  - Ler o HTML **pré-renderizado** em `.next/server/app/suporte.html` (ou `curl -s localhost:3000/suporte` após `npm start`). **Não usar o inspetor do DevTools** — ele mostra o DOM já hidratado e mascararia exatamente o bug procurado
  - Confirmar presentes: título, rótulo, subtítulo, os 3 canais, o horário, as **4 perguntas** e as **4 respostas**
  - Confirmar **exatamente um `<h1>`**
  - Confirmar o `<title>` próprio (não o `"Ta Hora"` genérico do root layout) e a `<meta name="description">` (R2.5)
  - Confirmar **0 ocorrências** de `"teste gratuito"`, `"limite de usuários"`, `"Perguntas frequentes"` e `"precisa saber"` (vazamento de `DEFAULT_CONTENT` / boilerplate)
  - Purpose: provar o requisito que motivou a decisão §D1
  - _Requirements: 2.1, 2.2, 2.3, 2.5, 7.2_

- [ ] 15. Verificação visual e de navegação em `npm run dev`
  - **Ícones (§D4):** os quadrados mostram **desenhos**, não a palavra `instagram` escrita — o defeito silencioso mais provável da spec
  - **FAQ em grid:** conferir o visual dos 4 cards no desktop e no mobile — `type: "grid"` **estreia aqui**, nenhum layout do repo o exercitava
  - **WhatsApp:** abre em nova aba, chat de `5511984188541`, mensagem **acentuada** ("Olá", não `Ol%C3%A1`)
  - **Canais:** `mailto:` abre o cliente de e-mail; Instagram abre em nova aba
  - **Contraste:** o texto sobre o laranja é **escuro**, não branco
  - **Não-regressão do menu:** clicar "Suporte" na Navbar **e** no rodapé em `/`, `/sobre-nos` **e `/catalogo`** → chega em `/suporte`; conferir que Catálogo, Sobre Nós e o carrinho seguem funcionando
  - **Responsivo:** em ~360px os 2 cards empilham, sem scroll horizontal
  - **Reduced motion:** com `prefers-reduced-motion: reduce`, a página não anima
  - Purpose: cobrir tudo que o build não pega
  - _Requirements: 4.3, 4.4, 4.5, 5.2, 5.3, 5.4, 5.5, 8.1, 8.2, 9.1_
