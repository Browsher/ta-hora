# Requirements Document

## Introduction

A loja Ta Hora não tem página de Suporte. O link **"Suporte"** já existe no menu
(Navbar) e no rodapé (Footer) das duas páginas de conteúdo, mas **sem `href`
próprio** — cai no default do template. Hoje os dois links estão quebrados, e
**cada um cai num lugar diferente**: a Navbar usa o default `#sobre`
(`Navbar.tsx:33`) e o rodapé usa `#roadmap` (`Footer.tsx:68`). Nenhuma das duas
âncoras existe nas páginas.

Esta spec cria a rota `/suporte`: uma página **informativa e estática**, no mesmo
esqueleto do `/sobre-nos` (layout JSON + `PreviewContent`), que concentra os três
canais de atendimento da loja — WhatsApp (canal principal, em destaque), e-mail e
Instagram — mais o horário de atendimento e um FAQ de 4 perguntas com respostas
placeholder, fáceis de editar depois.

**Não há backend nem formulário de envio.** O WhatsApp É o canal de contato: a
página só apresenta e linka. O valor entregue é (a) consertar um link morto do
menu e (b) dar ao visitante um lugar óbvio para tirar dúvidas antes e depois da
compra, sem depender de nenhuma infraestrutura nova.

## Alignment with Product Vision

Do `product.md`/`structure.md`, a promessa da loja é **"atendimento direto, sem
intermediários"** — é literalmente o que o `/sobre-nos` vende ao cliente
(`item2Title: "Atendimento direto"`, *"Fale com a gente sem intermediários,
suporte próximo e rápido"*). Hoje essa promessa não tem para onde apontar: o link
que a cumpriria está morto. Esta página é o cumprimento dessa promessa.

Alinhamentos técnicos:

- **`tech.md` → Modelo de build:** a página é conteúdo editorial, não dado da
  Shopify. Ela nasce **`○ Static` (SSG)**, exatamente como `/sobre-nos`, e não tem
  motivo para mudar de regime. Nenhuma leitura de `cookies()`/`headers()`.
- **`structure.md` → Rota de conteúdo:** Server Component minimalista que importa
  o JSON e delega ao `PreviewContent`.
- **`structure.md` → Convenções de conteúdo:** o texto vive no JSON de
  `layouts/`, nunca hard-coded no componente. É isso que torna o FAQ e os canais
  "fáceis de editar depois".

## Requirements

### Requirement 1 — Rota `/suporte` estática

**User Story:** Como visitante da loja, quero acessar `/suporte` e ver a página
de atendimento, para saber como falar com a loja.

#### Acceptance Criteria

1. WHEN o usuário navega para `/suporte` THEN o site SHALL renderizar uma página
   de suporte com navbar e rodapé idênticos aos do resto do site.
2. WHEN `npm run build` roda **após `rm -rf .next`** THEN a saída SHALL listar
   `/suporte` como **`○` (Static)** com a coluna `Revalidate` **vazia** (mesmo
   regime de `/sobre-nos`).
   > O `rm -rf .next` não é zelo: build sobre `.next` morno reaproveita prerender
   > antigo neste projeto e a verificação passa sem provar nada.
3. IF o `.env.local` não existir THEN o build SHALL continuar passando — a página
   não SHALL depender de nenhuma variável de ambiente nem da Shopify.
4. WHEN a rota é implementada THEN ela SHALL seguir o padrão de rota de conteúdo
   do `structure.md`: `page.tsx` importa o JSON do layout, resolve a paleta e
   delega ao `PreviewContent`, **sem** `cookies()`/`headers()`.
   *(Restrição arquitetural herdada do `structure.md`, não valor de usuário —
   mantida aqui porque esquecê-la quebra o regime da rota silenciosamente.)*
5. WHEN o conteúdo textual da página é definido THEN ele SHALL morar no JSON em
   `layouts/`, não hard-coded no componente de seção.
   *(Restrição herdada — é ela que torna o R7.4 possível.)*

### Requirement 2 — Conteúdo no HTML bruto (SEO)

**User Story:** Como dono da loja, quero que o conteúdo de suporte esteja no HTML
entregue pelo servidor, para que buscadores indexem a página.

#### Acceptance Criteria

1. WHEN o HTML pré-renderizado de `/suporte` é inspecionado THEN ele SHALL conter,
   como texto, o título da página, o rótulo dos três canais, o horário de
   atendimento e as 4 perguntas do FAQ.
2. WHEN o HTML pré-renderizado de `/suporte` é inspecionado THEN ele SHALL conter
   o texto **das 4 respostas** do FAQ, **independentemente do estado inicial**
   (aberto/fechado) do accordion.
   > ⚠️ Este critério **não é satisfeito hoje** pelo componente `FAQ` existente:
   > `FAQ.tsx:129-144` monta a resposta dentro de
   > `<AnimatePresence>{isOpen && <motion.div>…}` — resposta fechada **não está
   > no DOM**, e `defaultOpen` (linha 402) abriria no máximo o item 0. Resolver
   > isso é decisão do design.
3. WHEN a página é renderizada THEN ela SHALL conter exatamente **um `<h1>`**.
4. IF o JavaScript não executar THEN os links de WhatsApp, e-mail e Instagram
   SHALL continuar clicáveis (restrição herdada: são `<a href>` reais, não
   handlers de clique).
5. WHEN a rota é implementada THEN ela SHALL exportar `metadata` com **`title` e
   `description`** próprios, em pt-BR — sem isso a página herda o `title: "Ta
   Hora"` genérico do `app/layout.tsx`.

### Requirement 3 — Cabeçalho da página

**User Story:** Como visitante, quero entender de cara que estou na página de
atendimento, para não precisar procurar.

#### Acceptance Criteria

1. WHEN a página carrega THEN ela SHALL exibir o rótulo **"SUPORTE"** em caixa
   alta, na cor de destaque (accent laranja `#ff8903`).
2. WHEN a página carrega THEN ela SHALL exibir o título **"Como podemos
   ajudar?"** como o `<h1>` da página.
3. WHEN a página carrega THEN ela SHALL exibir o subtítulo **"Estamos aqui pra
   tirar suas dúvidas antes e depois da compra"**.

### Requirement 4 — WhatsApp em destaque (canal principal)

**User Story:** Como cliente com uma dúvida, quero um botão grande e óbvio de
WhatsApp, para falar com a loja no canal que já uso.

#### Acceptance Criteria

1. WHEN a página carrega THEN ela SHALL exibir um bloco de destaque com **fundo
   laranja sólido** (a cor de destaque), visualmente maior/mais proeminente que
   os canais secundários.
2. WHEN o bloco de destaque é renderizado THEN ele SHALL conter um ícone de
   WhatsApp e um botão/link rotulado **"Falar no WhatsApp"**.
3. WHEN o usuário clica em "Falar no WhatsApp" THEN o navegador SHALL abrir
   `https://wa.me/5511984188541?text=<mensagem>`, onde `<mensagem>` é a
   URL-encode de **"Olá, sou cliente do Ta Hora, preciso de um suporte"**.
4. WHEN o link do WhatsApp é renderizado THEN ele SHALL usar
   `target="_blank"` e `rel="noopener noreferrer"`.
5. WHEN o texto é renderizado sobre o fundo laranja sólido (`#ff8903`) THEN a
   razão de contraste SHALL ser **≥ 4.5:1**.
   > A paleta declara `destaqueTexto: "#ffffff"`, mas branco sobre `#ff8903` dá
   > ≈ 2.3:1 e **reprova**. A cor do texto deve ser derivada por contraste
   > (escuro sobre o laranja), nunca o branco assumido.

### Requirement 5 — Canais secundários (e-mail e Instagram)

**User Story:** Como visitante que prefere não usar WhatsApp, quero ver os outros
canais da loja, para escolher por onde falar.

#### Acceptance Criteria

1. WHEN a página carrega THEN ela SHALL exibir **dois cards lado a lado** (em
   telas largas) com superfície em gradiente e borda na cor de destaque, seguindo
   o padrão de card já usado nas seções do site.
2. WHEN o card de e-mail é renderizado THEN ele SHALL mostrar
   **icamera6688@gmail.com** e linkar para `mailto:icamera6688@gmail.com`.
3. WHEN o card de Instagram é renderizado THEN ele SHALL mostrar
   **@tahora.com.br** e linkar para `https://instagram.com/tahora.com.br` com
   `target="_blank"` e `rel="noopener noreferrer"`.
4. WHEN a viewport é estreita (mobile) THEN os dois cards SHALL empilhar em uma
   coluna sem overflow horizontal.
5. WHEN cada card é renderizado THEN ele SHALL ter um ícone identificando o canal.

### Requirement 6 — Faixa de horário de atendimento

**User Story:** Como visitante, quero saber quando a loja responde, para não
esperar retorno de madrugada.

#### Acceptance Criteria

1. WHEN a página carrega THEN ela SHALL exibir uma faixa discreta com um ícone de
   relógio e o texto **"Atendimento: Segunda a Sexta, 9h às 18h"**.
2. WHEN o ícone de relógio é renderizado THEN ele SHALL ser decorativo
   (`aria-hidden`), pois o texto ao lado já carrega a informação.

### Requirement 7 — FAQ de 4 perguntas, editável

**User Story:** Como dono da loja, quero trocar as perguntas e respostas do FAQ
sem mexer em código React, para atualizar a página sozinho depois.

#### Acceptance Criteria

1. WHEN a página carrega THEN ela SHALL exibir **4 perguntas** cobrindo: prazo de
   entrega, garantia, formas de pagamento e como rastrear o pedido.
2. WHEN o HTML de `/suporte` é inspecionado THEN **nenhuma** pergunta ou resposta
   do `DEFAULT_CONTENT` do componente de FAQ SHALL aparecer.
   > O componente faz `{ ...DEFAULT_CONTENT, ...content }` (`FAQ.tsx:392`) e o
   > default é boilerplate de SaaS ("Existe algum período de teste gratuito?",
   > "Existe limite de usuários por conta?"). Se o JSON omitir um par, a pergunta
   > errada renderiza e o critério 7.1 ainda pareceria satisfeito.
3. WHEN as respostas placeholder são escritas THEN cada uma SHALL ter **1–2
   frases** e **não** conter prazos, valores, percentuais ou nomes de
   transportadora específicos — nada que possa ser lido como compromisso da loja
   antes de o dono revisar.
4. WHEN o dono quiser editar uma pergunta ou resposta THEN ele SHALL conseguir
   fazê-lo editando **apenas o arquivo de layout JSON**, em pares
   pergunta/resposta, sem tocar em `.tsx`.
5. WHEN o contrato do JSON for definido THEN ele SHALL deixar explícito se o
   número de perguntas (`faqCount`) é editável pelo dono ou fixo em 4.
6. IF o FAQ for apresentado como accordion THEN cada gatilho SHALL ser um
   `<button>` com `aria-expanded` refletindo o estado aberto/fechado.

### Requirement 8 — Link "Suporte" ligado no menu

**User Story:** Como visitante, quero clicar em "Suporte" no menu de qualquer
página e chegar na página de suporte, para não cair num link morto.

#### Acceptance Criteria

1. WHEN o usuário clica em "Suporte" na Navbar de **qualquer** página que já
   exibe esse link THEN o navegador SHALL navegar para `/suporte`.
2. WHEN o usuário clica em "Suporte" no rodapé THEN o navegador SHALL navegar
   para `/suporte`.
3. WHEN o link é ligado THEN a alteração SHALL ser feita nos **dados** (o `href`
   no JSON de cada layout), não alterando o componente `Navbar`/`Footer`.
4. WHEN os JSONs existentes são editados THEN nenhum campo legado ou
   desconhecido SHALL ser removido, e os demais links (Catálogo, Sobre Nós,
   Rastreio) SHALL continuar com o comportamento atual.

### Requirement 9 — Não quebrar o que existe

**User Story:** Como dono da loja, quero que a nova página não afete nada que já
funciona, para não trocar um problema por outro.

#### Acceptance Criteria

1. WHEN a spec é implementada THEN `/sobre-nos` SHALL continuar **`○ (Static)`** e
   `/`, `/catalogo` e `/produtos/[handle]` SHALL continuar em **ISR 300s**.
2. WHEN um componente compartilhado (`Navbar`, `Footer`, ou uma seção já
   registrada) precisar mudar THEN a mudança SHALL ser **aditiva** — sem prop
   nova obrigatória e sem invalidar os JSONs existentes.
3. WHEN uma nova seção for criada THEN ela SHALL ser registrada com **import
   estático + entrada no `componentMap`** de `PreviewContent.tsx`, conforme o
   checklist do `structure.md`.
4. WHEN o build roda THEN `npx tsc --noEmit` SHALL ficar limpo.

## Non-Functional Requirements

### Performance

- A página é pré-renderizada (SSG): **zero** requisições de rede a APIs no
  carregamento. Nenhuma chamada à Shopify.
- Sem imagens novas em `public/uploads/` — os ícones vêm de `lucide-react` (já no
  bundle) ou de SVG inline; nenhuma dependência nova é adicionada ao projeto.

### Security

- Todo link externo (`wa.me`, `instagram.com`) SHALL levar
  `rel="noopener noreferrer"` junto de `target="_blank"`, para não expor
  `window.opener`.
- Nenhum segredo entra na página. O telefone, o e-mail e o @ são informação
  pública de atendimento, exibida intencionalmente.

> ⚠️ **Dados de contato — pendente de confirmação do dono.** `5511984188541`,
> `icamera6688@gmail.com` e `@tahora.com.br` **não aparecem em nenhum outro lugar
> do repositório** — não existe fonte da verdade contra a qual conferir. Um
> número errado aqui falha em silêncio (ninguém reclama, o cliente só some) e
> custa venda. Confirmar os três antes de implementar.

### Reliability

- Nenhum ponto de falha em runtime: sem `fetch`, sem env vars, sem backend. A
  página não tem estado de erro possível.
- O link do WhatsApp SHALL ser construído com a mensagem **URL-encoded**, para
  que acentos e vírgula não corrompam o parâmetro `text`.

### Usability

- **Contraste:** todo texto SHALL atingir **≥ 4.5:1** contra o fundo em que
  assenta (WCAG AA). Sobre o fundo escuro, o meio prático é usar os tokens da
  paleta — `textoSecundario` (alpha `0.7`) e `textoFraco` (alpha `0.55`) — e
  **nunca** `0.3`/`0.4`. O alpha é a diretriz; a razão é o critério.
- **Acessibilidade:** links e botões cujo rótulo visível seja apenas um ícone
  SHALL ter `aria-label`; ícones puramente decorativos SHALL ter `aria-hidden`;
  gatilhos de accordion SHALL ter `aria-expanded`.
- **Idioma:** todo o conteúdo em **pt-BR**.
- **Responsivo:** sem overflow horizontal em telas estreitas; os cards de canal
  empilham.
- **Movimento:** qualquer animação SHALL respeitar `prefers-reduced-motion` —
  garantido pelo `MotionConfig reducedMotion="user"` do `PreviewContent`, desde
  que a página seja renderizada por ele.

## Fora de escopo (explicitamente)

- Formulário de contato com envio (não há backend nesta spec).
- Rastreamento automático de pedido — é a outra tela, `/rastreio`.
- Respostas reais do FAQ (ficam placeholder por ora).
- Canais além dos três definidos (WhatsApp, e-mail, Instagram).
- Ligar o link **"Rastreio"** do menu, que também está sem `href` — pertence à
  spec daquela tela.
