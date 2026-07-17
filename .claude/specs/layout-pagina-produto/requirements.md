# Requirements Document

## Introduction

Reforma do **layout** da página de produto (`/produtos/[handle]`) da loja **Ta
Hora** — que **já existe e funciona** (spec `catalogo-loja`). Esta spec **muda a
disposição visual**; não muda dados, carrinho, galeria nem a sugestão de
acessórios.

O layout novo separa **decisão de compra** de **conteúdo de convencimento**:

- **Desktop (2 colunas):** a **esquerda** reúne o que fecha a venda — galeria,
  nome, preço e o botão "Adicionar ao carrinho" — e fica **congelada (sticky)**
  enquanto a **direita** — a **descrição rica** vinda da Shopify (`descriptionHtml`,
  com as 4 imagens dos recursos da câmera) — rola. Quando a descrição acaba, a
  esquerda "solta" e rola junto até o rodapé (comportamento natural do
  `position: sticky`, não `fixed` eterno).
- **Mobile (1 coluna, empilhado):** galeria → nome → preço → botão → descrição.
  O botão fica **no meio** (depois do preço), rola junto — **não** fixo no
  rodapé.

A descrição é HTML de fora, então é **sanitizada no servidor** antes de ir ao
DOM. E como cada descrição traz 4 imagens, elas são **carregadas de forma
eficiente** (lazy + dimensão adequada), sem penalizar a página.

### O que esta reforma NÃO pode quebrar (a loja já funciona)

- **Botão "Adicionar ao carrinho"** (`BotaoAdicionar`): abre o drawer e dispara a
  sugestão de acessórios. Continua idêntico — só muda de lugar.
- **Galeria** (`ProductGallery`): troca de imagem por thumbnail. Intocada.
- **Sugestão de acessórios** (spec `acessorios-sugeridos`): é reação ao
  `adicionar()`, não à página. Não é tocada por esta spec.
- **Os dois modos de falha** da página (Shopify offline → UI amigável; produto
  inexistente → `notFound()`): preservados exatamente como estão.

### PRÉ-CONDIÇÃO DE DADOS — atendida com dados de TESTE (medido ao vivo)

Esta spec repete a disciplina da `acessorios-sugeridos`: **a feature depende de um
dado do catálogo que hoje quase não existe**, e isso está declarado, não
escondido.

**Quando esta spec foi aberta**, os **7 produtos** publicados no canal Headless
tinham `descriptionHtml` **vazio** (0 chars, medido contra a Storefront 2026-01).
A coluna direita — o coração da reforma — não teria o que renderizar em **nenhum**
produto: seria código morto, indistinguível de bug.

Por decisão do usuário, **uma descrição real foi preenchida** (produto
`camera-seguranca-es-p9`) antes de escrever os requisitos, para o design ser
medido contra HTML de verdade. **Estado atual medido:**

| Fato (Storefront 2026-01, loja ao vivo) | Medida |
|---|---|
| Produtos publicados no canal Headless | **7** |
| Produtos com `descriptionHtml` **preenchido** | **1** (`camera-seguranca-es-p9`) |
| Produtos com `descriptionHtml` **vazio** | **6** |
| Imagens da **galeria** (`images`) por produto | 5 (todos) |

**O HTML real que a Shopify devolveu para o ES-P9** (é o contrato que a
sanitização precisa respeitar — não um HTML inventado):

| Fato | Medida |
|---|---|
| Tamanho | 564 caracteres |
| Tags que o editor da Shopify gerou | **apenas `<p>` e `<img>`** |
| Nº de `<img>` | **4**, todas em `cdn.shopify.com` |
| Atributos nas `<img>` | **só `src` e `alt`** — sem `width`, `height`, `style`, `loading` |
| `alt` das imagens | **vazio** (`alt=""`) nas 4 |
| `<script>`, `<iframe>`, `on*=`, `style=` | **nenhum** |
| Estrutura | `<p><img></p>` alternando com `<p>&nbsp;</p>` |
| Dimensões naturais das imagens | 1086–1448 px (1 retrato, 3 paisagem) |
| Peso real no navegador (a CDN negocia WebP via `Accept`) | **804 KB** as 4 |
| Peso com `?width=800` na CDN | **434 KB** (−46%) |

> ⚠️ **É 1 produto de TESTE, não o catálogo final.** Os outros 6 seguem vazios.
> Consequência real e desejada: pelo **Req 2** (descrição vazia → sem coluna
> direita), **6 dos 7 produtos renderizam hoje só a coluna esquerda,
> centralizada**. Isso é o comportamento correto — não é regressão. A coluna
> direita só se prova nos produtos que o dono da loja vier a descrever. A
> salvaguarda do **Req 8** existe para essa pré-condição cair com barulho.

### Fatos do HTML que contradizem premissas do pedido (decididos aqui)

1. **"Respeitar a formatação da Shopify (não forçar largura)":** medido, **não há
   formatação de largura a respeitar** — as `<img>` vêm sem `width`. A 1448 px
   numa coluna de ~500 px elas **estourariam** o layout. Aplicar `max-width: 100%`
   é **contenção de overflow**, não "forçar largura" (Req 3.4).
2. **Sem `width`/`height` nas `<img>`:** o navegador não reserva espaço → **layout
   shift** enquanto as 4 carregam. Tratado no Req 4.
3. **`alt=""` nas 4 imagens:** limitação do **conteúdo**, não do código. O
   sanitizador **não inventa `alt`** (seria mentira sobre o conteúdo). Registrado
   como limitação conhecida no Req 3.7, não como bug a corrigir aqui.

## Alignment with Product Vision

- **"A UI da loja é código, não JSON"** (product.md): esta página é código em
  `components/loja/` + `app/produtos/[handle]/`, fora do sistema de layout JSON.
  Coerente com a exceção consciente do princípio "conteúdo dirigido por dados".
- **"A Shopify é a fonte da verdade comercial"** (product.md): a descrição, as
  imagens e o preço continuam 100% da Shopify. Esta spec não cria conteúdo nem
  calcula nada — só o dispõe.
- **"Loja headless" é a prioridade 1** (product.md → Objetivos): melhorar a
  página onde o cliente decide comprar serve direto a essa prioridade.
- **Deploy & performance é a prioridade 2**: o carregamento eficiente das 4
  imagens (Req 4) adianta parte desse objetivo.
- **Home continua estática, token server-only, mobile-first, pt-BR**
  (tech.md/structure.md): restrições preservadas — ver Req 6 e NFRs.

## Requirements

### Requirement 1 — Layout desktop: duas colunas, esquerda sticky

**User Story:** Como cliente no desktop, quero a galeria, o nome, o preço e o
botão de compra sempre à vista enquanto leio a descrição, para poder comprar a
qualquer momento sem rolar de volta ao topo.

#### Acceptance Criteria

1. WHEN a página renderiza em viewport ≥ 768px (`md`) E o produto tem descrição
   não-vazia THEN o sistema SHALL exibir **duas colunas**: à esquerda o bloco de
   compra (galeria, nome, preço, botão), à direita a descrição.
2. WHEN a coluna direita é mais alta que a viewport E a coluna esquerda cabe na
   viewport THEN a coluna esquerda SHALL permanecer **fixa (sticky pelo topo)**
   enquanto a direita rola.
3. WHEN o fim da coluna direita alcança a base da coluna esquerda THEN a coluna
   esquerda SHALL **soltar e rolar junto** até o rodapé — comportamento natural
   de `position: sticky`, nunca `position: fixed`.
4. WHEN a coluna esquerda é **mais alta que a viewport** (ex.: notebook de 768px
   de altura) THEN o sistema SHALL **não** aplicar sticky (a esquerda rola
   normalmente), de modo que o botão "Adicionar ao carrinho" seja **sempre
   alcançável** — degradação por `@media (min-height)`, sem JavaScript de medição.
   *É uma aproximação CSS-only aceita, não uma garantia:* o breakpoint de
   `min-height` é um limiar fixo, não um teste real de "cabe" (a altura da
   esquerda varia com a galeria e o nome). A troca é deliberada — a NFR de
   Performance proíbe JS de medição para o layout.
5. WHEN a página monta THEN a ordem visual da coluna esquerda SHALL ser, de cima
   para baixo: galeria → nome → preço → botão "Adicionar ao carrinho".

### Requirement 2 — Descrição vazia: sem coluna direita, sem espaço estranho

**User Story:** Como cliente vendo um produto ainda sem descrição, quero uma
página limpa e centrada, para não encarar uma coluna vazia ou um layout torto.

#### Acceptance Criteria

1. IF `descriptionHtml` é vazio, só espaços, ou vira vazio **após a sanitização**
   THEN o sistema SHALL **não renderizar a coluna direita**.
2. WHEN a coluna direita não é renderizada THEN o bloco de compra SHALL aparecer
   em **coluna única centralizada**, com largura de leitura confortável, sem
   coluna fantasma nem `gap` sobrando.
3. WHEN a descrição está vazia THEN a página SHALL renderizar **sem erro e sem
   `console.error`** (é um estado normal, não uma falha).
4. WHEN um `descriptionHtml` contém **apenas** marcação sem conteúdo visível (ex.:
   `<p> </p>`, `<p></p>`) THEN o sistema SHALL tratá-lo como **vazio** para efeito
   do critério 1 (não abrir uma coluna direita "em branco").

### Requirement 3 — Renderização SEGURA e fiel da descrição

**User Story:** Como dono da loja, quero minha descrição rica (parágrafos e
imagens) aparecer como eu montei, mas sem que HTML perigoso chegue ao navegador
do cliente.

#### Acceptance Criteria

1. WHEN a descrição é renderizada THEN o sistema SHALL **sanitizar o HTML no
   servidor** (Server Component / camada `server-only`), nunca no cliente, antes
   de qualquer `dangerouslySetInnerHTML`.
2. WHEN o HTML contém `<script>`, `<iframe>`, `<object>`, `<embed>`, handlers
   `on*=` (ex.: `onclick`), `style=` ou URLs `javascript:` THEN o sanitizador
   SHALL **removê-los** (allowlist: só tags/atributos de formatação de texto e
   imagem são permitidos).
3. WHEN o HTML contém as tags que a Shopify de fato gera — `<p>`, `<img>`, e as
   usuais de rich text (`<br>`, `<strong>`, `<em>`, `<ul>`, `<ol>`, `<li>`,
   `<a>`, cabeçalhos `<h2>`–`<h4>`) THEN o sanitizador SHALL **preservá-las**.
4. WHEN uma imagem da descrição é renderizada THEN o sistema SHALL garantir
   `max-width: 100%` e `height: auto` (contenção de overflow — as imagens vêm da
   Shopify **sem** `width`, medido), sem impor largura fixa nem recorte.
5. WHEN um link `<a>` sobrevive à sanitização THEN o sistema SHALL forçar
   `rel="noopener noreferrer"` e (para alvos externos) `target` seguro.
6. WHEN a descrição é renderizada THEN as imagens SHALL ser **não-clicáveis e sem
   zoom** (fora de escopo desta spec) — apenas exibidas.
7. WHEN as imagens da descrição têm `alt` vazio (medido: as 4 do ES-P9 têm
   `alt=""`) THEN o sistema SHALL **preservar o `alt` como veio** (não inventar
   texto alternativo); a melhora do `alt` é responsabilidade do **conteúdo** na
   Shopify, registrada como limitação conhecida.

### Requirement 4 — As 4 imagens da descrição carregam de forma eficiente

**User Story:** Como cliente, quero a página abrir rápido mesmo com 4 imagens
grandes na descrição, para não esperar nem ver o layout "pular".

#### Acceptance Criteria

1. WHEN as imagens da descrição são renderizadas THEN o sistema SHALL aplicar
   `loading="lazy"` e `decoding="async"` a cada uma (elas ficam **abaixo da
   primeira dobra**, à direita/no fim do mobile — medido: nenhuma vem com
   `loading` da Shopify).
2. WHEN uma imagem da descrição aponta para `cdn.shopify.com` THEN o sistema
   SHOULD reduzir o peso servido pedindo à CDN uma largura adequada (parâmetro
   `width` — medido: `?width=800` corta o total de **804 KB para 434 KB**, −46%,
   e a CDN já entrega **WebP** por negociação de `Accept`).
3. WHEN as imagens carregam THEN o sistema SHALL minimizar **layout shift**
   reservando espaço vertical. Como as `<img>` vêm **sem** `width`/`height` da
   Shopify (medido) e as dimensões naturais variam (1 retrato + 3 paisagem),
   **não se exige reserva exata por imagem**: uma reserva aproximada — `min-height`
   no contêiner da imagem **ou** um `aspect-ratio` de fallback — é suficiente para
   o critério, contanto que a coluna direita não "salte" de forma perceptível.
4. IF a otimização de largura (critério 2) não puder ser aplicada a uma URL —
   quando ela **não** é `cdn.shopify.com`, ou **já traz um parâmetro `?width=`**
   na própria URL — THEN o sistema SHALL renderizar a imagem **como veio**, sem
   quebrar (degradação segura). *("`?width=` na URL", não o atributo `<img width>`
   — que, medido, nunca vem.)*

### Requirement 5 — Layout mobile empilhado

**User Story:** Como cliente no celular, quero as informações numa coluna só,
numa ordem que faça sentido, para decidir a compra rolando de cima para baixo.

#### Acceptance Criteria

1. WHEN a página renderiza em viewport < 768px THEN o sistema SHALL empilhar em
   **coluna única** na ordem: galeria → nome → preço → botão "Adicionar ao
   carrinho" → descrição.
2. WHEN no mobile THEN o botão "Adicionar ao carrinho" SHALL ficar **no fluxo**
   (depois do preço) e **rolar junto** — **não** fixo no rodapé (fora de escopo).
3. WHEN a descrição está vazia no mobile THEN a página SHALL terminar no botão,
   sem bloco vazio abaixo (mesma regra do Req 2, na vertical).

### Requirement 6 — Não quebrar a loja, o build nem o regime de render

**User Story:** Como operador do site, quero a reforma sem regressões — carrinho,
galeria, acessórios, build e ISR seguem como estão.

#### Acceptance Criteria

1. WHEN o botão é clicado após a reforma THEN o sistema SHALL abrir o drawer e
   disparar a sugestão de acessórios **exatamente como antes** (o
   `BotaoAdicionar` recebe o mesmo `handle` da rota; o cliente nunca vê o
   `merchandiseId`).
2. WHEN o build roda THEN `/produtos/[handle]` SHALL permanecer **ISR 300s** com
   `dynamicParams = true` — os `export const revalidate` / `dynamicParams` não
   são removidos nem alterados.
3. WHEN o build roda **sem `.env.local`** THEN ele SHALL **passar** (Shopify
   ausente degrada para a UI de erro amigável em runtime, como já acontece).
4. WHEN o build roda THEN `/` e `/sobre-nos` SHALL continuar `○ (Static)` — esta
   spec **não** toca `app/layout.tsx` nem as rotas de conteúdo.
5. WHEN um módulo desta spec é de cliente THEN ele SHALL importar da camada de
   dados **apenas tipos** (`import type`); a sanitização (que roda no servidor)
   SHALL viver em módulo **`server-only`** ou no próprio Server Component, nunca
   num componente `"use client"`.
6. WHEN `npx tsc --noEmit` roda THEN SHALL ficar **limpo** (sem erros de tipo).
7. WHEN a página renderiza THEN os **dois modos de falha atuais** — Shopify
   offline (try/catch → UI amigável) e produto inexistente (`notFound()` fora do
   try) — SHALL ser preservados sem alteração de comportamento.

### Requirement 7 — ProductSpecs sai da página

**User Story:** Como dono da spec, quero a ficha técnica (metafields) fora desta
reforma, para tratá-la numa spec dedicada quando os metadados estiverem prontos.

#### Acceptance Criteria

1. WHEN a página é reformada THEN o componente `ProductSpecs` SHALL **não** ser
   renderizado por `app/produtos/[handle]/page.tsx`.
2. WHEN `ProductSpecs` é removido da página THEN o build e o `tsc` SHALL seguir
   limpos (import não-usado removido); o arquivo do componente **pode
   permanecer** no repo para a spec futura.
3. WHEN a ficha técnica sair THEN a página SHALL **não** exibir espaço vazio no
   lugar dela (hoje `ProductSpecs` já renderiza `null` — a saída é visualmente
   idêntica ao estado atual, que também nada mostra).

### Requirement 8 — Salvaguarda da pré-condição de dados (descrição)

**User Story:** Como mantenedor, quero ser avisado com barulho se as descrições
sumirem ou nunca chegarem, para a coluna direita não virar um silêncio que
ninguém investiga.

#### Acceptance Criteria

1. WHEN executo a salvaguarda (`npm run verificar:descricao`) THEN ela SHALL
   consultar a Storefront API e reportar **quantos produtos têm `descriptionHtml`
   não-vazio**.
2. IF **nenhum** produto tem descrição não-vazia THEN a salvaguarda SHALL sair
   com **código de erro ≠ 0** (a pré-condição da coluna direita caiu — a feature
   virou código morto).
3. WHEN a salvaguarda roda THEN ela SHALL seguir o padrão dos scripts existentes
   (`scripts/verificar-*.mjs`): Node puro, `--env-file=.env.local`, **`process.exitCode`
   e NUNCA `process.exit()`** (a armadilha do exit 127 no Windows já documentada),
   e **não** acoplada ao `npm run build` (o build passa sem `.env.local`).

## Non-Functional Requirements

### Performance
- Total das 4 imagens da descrição servido em **≤ ~450 KB** com `?width=800`
  (medido: 434 KB), ante 804 KB sem otimização — WebP já vem por negociação da
  CDN. `loading="lazy"` mantém as 4 fora do carregamento crítico.
- A reforma **não adiciona JavaScript de cliente** para o sticky (é CSS puro) —
  sem custo de runtime nem de hidratação para o comportamento de layout.
- Layout shift (CLS) da coluna direita minimizado por reserva de espaço das
  imagens (Req 4.3).

### Security
- HTML de terceiros **sanitizado no servidor** por allowlist antes do DOM (Req
  3). Fronteira de confiança: a descrição é do **dono da loja** (risco baixo),
  mas sanitiza-se mesmo assim — defesa em profundidade.
- Token da Storefront **server-only** e nunca `NEXT_PUBLIC_` — inalterado. A
  dependência de sanitização roda **só no servidor**; não entra no bundle do
  cliente.
- Nenhuma mensagem de erro interpola token ou endpoint (inalterado).

### Reliability
- Degradação segura em toda ponta: descrição vazia → sem coluna direita; imagem
  fora da CDN → servida como veio; Shopify offline → UI amigável; produto
  inexistente → `notFound()`.
- Build passa **sem `.env.local`**; regimes de render (`/` e `/sobre-nos`
  estáticos, `/produtos/[handle]` ISR) preservados.

### Usability
- **Mobile-first**: coluna única é o baseline; as 2 colunas e o sticky são
  progressive enhancement por `@media`.
- Botão "Adicionar ao carrinho" **sempre alcançável**, inclusive em telas baixas
  (Req 1.4).
- `prefers-reduced-motion` respeitado: a reforma não introduz animação nova; o
  sticky é rolagem nativa, não animação.
- Conteúdo e código em **pt-BR** (structure.md).
