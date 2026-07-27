# Implementation Plan

## Task Overview

Execução em **4 blocos**, cada um terminando num estado íntegro e verificável.
A ordem não é arbitrária — ela mantém o catálogo **funcionando o tempo todo**:

| Bloco | O que faz | Estado visível ao final |
|---|---|---|
| **1 — Fundação de dados** | regras puras → tipos → normalizador → query | **nada muda na tela.** Os 4 campos chegam ao `ProductCard` e ninguém os lê ainda |
| **2 — UI** | componente da linha → bloco → CSS | tarja e destaques aparecem |
| **3 — Salvaguarda** | `verificar-destaques.mjs` + `package.json` | `npm run verificar:destaques` funciona |
| **4 — Auditoria** | build, SEO no HTML, não-regressão, bundle | feature validada |

**Por que o Bloco 1 vem inteiro antes do 2:** ele é aditivo e invisível. Se algo
quebrar ali, quebra no `tsc`, não na vitrine. E ao entrar no Bloco 2 os dados já
estão prontos — a UI nunca precisa "adivinhar" um campo que ainda não existe.

**Por que o Bloco 3 vem depois do 2 e não antes:** o check verifica os **gatilhos**
(quantas câmeras disparam), e os gatilhos só existem depois da tarefa 1.1. Rodá-lo
ao final do Bloco 2 confirma os dados **contra a UI já construída**, na mesma
sessão em que dá para olhar a tela.

## Steering Document Compliance

- **`structure.md` — onde as coisas moram:** query → `lib/shopify/queries.ts`;
  dados do produto → `normalize.ts`; tipos → `types.ts`; UI do catálogo →
  `components/loja/`. Nenhuma tarefa cria arquivo fora desses lugares.
- **`structure.md` — pt-BR:** todo nome novo (`destaques.ts`, `temLenteMultipla`,
  `alarmeSonoro`, `DestaquesCamera`) é português, no padrão dos vizinhos.
- **`structure.md` — comentários explicam o porquê:** cada tarefa que toca um
  arquivo denso (`normalize.ts`, `types.ts`, `globals.css`) exige o comentário
  no nível dos vizinhos. Não é enfeite: é como `specs.ts` evitou o bug do rename.
- **`tech.md` — fronteira cliente/servidor:** nenhuma tarefa adiciona
  `server-only` a arquivo de UI nem importa valor da camada de dados no cliente.
- **`tech.md` — DoD:** o Bloco 4 é literalmente os 5 itens do "Definition of
  Done", incluindo o build **sem `.env.local`**.

## Atomic Task Requirements

Cada tarefa: **1–3 arquivos**, **15–30 min**, **um resultado testável**, arquivos
nomeados explicitamente.

---

## Tasks

### BLOCO 1 — Fundação de dados (invisível na tela)

- [ ] 1.1 Criar as duas regras puras em `lib/shopify/destaques.ts`
  - File: `lib/shopify/destaques.ts` (novo)
  - Exportar `temLenteMultipla(valor: string | null | undefined): boolean` —
    `trim()` → `toLowerCase()` → contém `"dupla"` **ou** `"tripla"`
  - Exportar `temAlarmeSonoro(valor: string | null | undefined): boolean` —
    `trim()` → `toLowerCase()` → **igualdade** com `"alarme sonoro"`
  - 🔴 **`temAlarmeSonoro` é igualdade, NÃO `includes`** — `includes` faria
    `"Sem alarme sonoro"` disparar. Só este valor acende a sirene
  - 🔴 **`"Lente única"` não pode disparar** — não contém "dupla" nem "tripla",
    então a regra já cobre; **não** adicionar lógica de exclusão de "única"
  - Ambas **fail-closed**: `null`/`undefined`/`""`/valor desconhecido → `false`
  - Módulo **puro**: sem React, sem `server-only`, sem `process.env`, sem import
    de valor da camada Shopify — mesmo padrão de `ordenarCatalogo.ts`
  - Comentar **por que** a comparação é case-insensitive (a loja grava
    "Noticação" — o admin erra grafia) e por que não há `normalize("NFD")`
    (as 3 palavras-gatilho são ASCII; é `única` que não deve casar, e não casa)
  - Purpose: isolar a regra de negócio num lugar só, testável por inspeção
  - _Leverage: components/loja/ordenarCatalogo.ts (padrão de núcleo puro)_
  - _Requirements: 3.1, 3.2, 3.3, 4.1, 4.2_

- [ ] 1.2 Adicionar os 4 campos a `ProductCard` em `lib/shopify/types.ts`
  - File: `lib/shopify/types.ts` (modificar)
  - Adicionar `selo: string | null`, `resolucao: string | null`,
    `lentes: string | null`, `alarmeSonoro: boolean`
  - 🔴 Sob um sub-cabeçalho **próprio** `── feature catalogo-destaques ──`, não
    dentro do bloco rotulado "(feature catalogo-consultivo)" — senão aquele
    comentário passa a mentir sobre a proveniência dos campos. Mesmo cuidado que
    o design aplica em `RawProductCard`
  - **Obrigatórios, não opcionais** — mesmo argumento já escrito ali para
    `marca`/`resumo`/`maisRecursos` (`normalizeProductCard` é o único construtor)
  - Documentar em cada campo: `lentes` **nunca** contém "Lente única";
    `alarmeSonoro` é **veredito, não valor** — o texto exibido é rótulo fixo
  - **Não** adicionar `server-only` a este arquivo (é o contrato compartilhado)
  - Purpose: fixar o contrato antes de qualquer produtor ou consumidor
  - _Leverage: lib/shopify/types.ts (bloco de comentário de ProductCard)_
  - _Requirements: 6.1, 6.7_

- [ ] 1.3 Estender `RawProductCard` e `normalizeProductCard` em `lib/shopify/normalize.ts`
  - File: `lib/shopify/normalize.ts` (modificar)
  - Em `RawProductCard`, adicionar 4 **opcionais**: `selo?`, `resolucao?`,
    `lentes?`, `alarme?` — todos `{ value: string } | null`
  - 🔴 Comentar que os 4 são **CRUS**: aqui ainda existem `"Lente única"`,
    `"Aplicativo"` e `"Noticação"` — no `ProductCard`, não. Especialmente em
    `lentes?`, cujo nome coincide com o do `ProductCard` mas a semântica não
  - **Opcionais pelo motivo já documentado** no arquivo: só a `PRODUCTS_QUERY` os
    seleciona; `RawAcessorio`/`RawRecomendado` estendem esta interface e não os
    pedem — devem continuar válidos **sem alteração**
  - Em `normalizeProductCard`, importar de `./destaques` e adicionar:
    ```ts
    selo:         raw.selo?.value?.trim()      || null,
    resolucao:    raw.resolucao?.value?.trim() || null,
    lentes:       temLenteMultipla(raw.lentes?.value) ? raw.lentes!.value.trim() : null,
    alarmeSonoro: temAlarmeSonoro(raw.alarme?.value),
    ```
  - **Não** tocar em `normalizeProduct` nem em `formatMoney`
  - Purpose: a fronteira — o valor não-disparador morre aqui e não chega ao cliente
  - _Leverage: lib/shopify/normalize.ts (padrão `raw.resumo?.value?.trim() || null`), lib/shopify/destaques.ts_
  - _Requirements: 1.3, 2.2, 3.2, 3.3, 4.2, 6.7_

- [ ] 1.4 Adicionar os 4 metafields aliasados à `PRODUCTS_QUERY` em `lib/shopify/queries.ts`
  - File: `lib/shopify/queries.ts` (modificar)
  - Adicionar dentro de `nodes`, logo após `resumo:`:
    ```graphql
    selo:      metafield(namespace: "custom", key: "selo")              { value }
    resolucao: metafield(namespace: "custom", key: "tipo_de_resolucao") { value }
    lentes:    metafield(namespace: "custom", key: "numero_de_lentes")  { value }
    alarme:    metafield(namespace: "custom", key: "com_alarme")        { value }
    ```
  - 🔴 **ADITIVO:** preservar `id`, `handle`, `title`, `tags`, `featuredImage`,
    `priceRange`, `resumo` **e o `sortKey: MANUAL`** (é a ordem manual do lojista)
  - 🔴 **As `key` são as literais da loja**, confirmadas na sondagem 7/7 — nunca
    o rótulo do admin (lição de `custom.marca` → "Aplicativo")
  - **Não** tocar em `PRODUCT_BY_HANDLE_QUERY`, `ACESSORIOS_QUERY`,
    `RECOMENDADOS_QUERY` nem `PRODUTO_PARA_CARRINHO_QUERY`
  - Atualizar o comentário do documento citando os 4 campos novos e a feature
  - Purpose: trazer os 4 valores na MESMA requisição, sem N+1
  - _Leverage: lib/shopify/queries.ts (precedente do alias `resumo:`)_
  - _Requirements: 6.1, 6.2, 6.3_

- [ ] 1.5 Fechar o Bloco 1 com `npx tsc --noEmit`
  - File: nenhum (verificação)
  - Rodar `npx tsc --noEmit` — deve ficar **limpo**
  - Confirmar que `lib/shopify/products.ts`, `acessorios.ts` e `recomendados.ts`
    **compilam sem alteração** (é a prova de que os opcionais da 1.3 funcionaram)
  - Confirmar que **nada mudou na tela** — o Bloco 1 é invisível por construção
  - Purpose: provar que a fundação é aditiva antes de a UI depender dela
  - _Requirements: 6.7_

---

### BLOCO 2 — UI (tarja + linha de destaques)

- [ ] 2.1 Criar `components/loja/DestaquesCamera.tsx`
  - File: `components/loja/DestaquesCamera.tsx` (novo)
  - Props explícitas — **não** `produto: ProductCard`:
    `{ resolucao: string | null; lentes: string | null; alarmeSonoro: boolean }`
  - Importar `Video`, `Aperture`, `Siren` **nominalmente** de `lucide-react`
    (nunca o pacote inteiro nem caminho `dist/` — quebra o tree-shaking)
  - Montar os itens na ordem **fixa**: resolução → lentes → alarme (Req 5.3)
  - Cada item = **ícone + texto, SEM rótulo**: `<Video/> Full HD`, nunca
    `<Video/> Resolução: Full HD` — o bloco é vitrine, a ficha é que tem rótulos
  - Item do alarme usa o **rótulo fixo** `"Alarme sonoro"`, nunca um valor vindo
    de prop (a prop é `boolean` justamente para isso)
  - **Lista vazia → `return null`** — sem container, sem borda órfã (Req 5.2),
    mesmo padrão de `FichaTecnica` com `specs.length === 0`
  - Ícones **decorativos**: `aria-hidden`, o texto ao lado carrega o significado
  - **Sem `"use client"` próprio**, sem hook, sem estado, sem efeito
  - 🔴 **NÃO** importar `fichaTecnicaIcones.ts` (Decisão 2 do design — a ficha
    não conhece `numero_de_lentes`; a entrada seria morta lá)
  - Purpose: a linha de destaques, decidindo só presença — a regra já veio pronta
  - _Leverage: components/loja/FichaTecnica.tsx (ícone decorativo + return null)_
  - _Requirements: 2.1, 2.2, 2.3, 3.1, 3.4, 4.1, 4.3, 5.2, 5.3, 5.4, 5.5_

- [ ] 2.2 Inserir a tarja e a linha em `components/loja/CameraBloco.tsx`
  - File: `components/loja/CameraBloco.tsx` (modificar)
  - **Inserção 1** — envolver a tarja + o selo de marca num
    `<div className="catalogo-bloco__topo">`, com a **tarja primeiro**:
    `{produto.selo && <span className="catalogo-bloco__tarja">{produto.selo}</span>}`
    seguido do selo de marca **já existente, inalterado**
  - **Inserção 2** — `<DestaquesCamera .../>` **entre o resumo e o preço**,
    passando `produto.resolucao`, `produto.lentes`, `produto.alarmeSonoro`
  - 🔴 A tarja renderiza o **texto exato** de `produto.selo` — sem reescrever,
    traduzir, abreviar ou capitalizar (Req 1.1)
  - **Não** remover nem reordenar nada do que já existe: `ImageSlot`, `h2`+`Link`,
    `Text` do resumo, `PriceTag`, botão "Ver detalhes"
  - Manter `import type` para `ProductCard` (a fronteira cliente/servidor)
  - Aproveitar para corrigir o comentário do topo do arquivo, que descreve a ordem
    como "nome → selo de marca" enquanto o JSX faz o contrário — atualizar para a
    ordem real, agora com tarja e destaques
  - Purpose: os dois pontos de inserção, sem tocar no resto do bloco
  - _Leverage: components/loja/CameraBloco.tsx, components/loja/DestaquesCamera.tsx_
  - _Requirements: 1.1, 1.2, 1.3, 1.5, 5.1_

- [ ] 2.3 Estilizar tarja e destaques em `app/globals.css`
  - File: `app/globals.css` (modificar — dentro do bloco `/* Catálogo consultivo */`)
  - `.catalogo-bloco__topo`: `display:flex`, `flex-wrap:wrap`, `gap`, e
    🔴 **`width:100%`** — o pai tem `align-items:flex-start`, que encolhe os
    filhos; sem a largura o `flex-wrap` não tem de onde quebrar e o Req 1.7
    falha **em silêncio**
  - `.catalogo-bloco__tarja`: fundo `var(--cor-destaque)` **sólido**, texto
    `var(--cor-destaque-texto)`, **`border-radius: 10px`** (retângulo — distinto
    da cápsula `999px` do selo de marca), `overflow-wrap: anywhere` para quebrar
    em texto longo
  - 🔴 **SEM `text-transform`** — `uppercase` reescreveria o texto do admin na
    tela e violaria o Req 1.1 sem ninguém notar. O `.catalogo-bloco__selo`
    vizinho usa só `letter-spacing`; seguir esse precedente
  - `.catalogo-destaques`: `display:flex`, `flex-wrap:wrap`, `gap`,
    **`width:100%`** (mesmo motivo do topo)
  - `.catalogo-destaque` / `.catalogo-destaque__icone`: item inline com ícone e
    texto alinhados, tamanho de ícone menor que o dos cards da ficha (28px lá —
    aqui é vitrine, não ficha)
  - 🔴 **Zero hex hard-coded** — só variáveis `--cor-*` (Req 1.4). O `#D4A017` do
    briefing é a paleta de **fábrica**; o site usa laranja `#ff8903`
  - **Não** alterar `.catalogo-bloco__selo`, `.catalogo-filtro`,
    `.catalogo-lista`, `.catalogo-bloco` nem qualquer regra da `.ficha-*`
  - Purpose: distinção visual (Req 1.6) e quebra sem estouro (Req 1.7 / 6.4)
  - _Leverage: app/globals.css (.catalogo-bloco__selo, .catalogo-filtro[data-ativo])_
  - _Requirements: 1.4, 1.6, 1.7, 6.4_

- [ ] 2.4 Verificar o Bloco 2 no navegador contra a matriz das 7 câmeras
  - File: nenhum (verificação em `npm run dev`)
  - **Tarja:** as 7 câmeras com o texto exato do admin, visualmente distinta do
    selo de marca (retângulo sólido vs cápsula suave)
  - **Só resolução:** P9 e Lâmpada mostram **apenas** `HD` — sem lente, sem sirene
  - **Três itens:** A38 mostra `4K Ultra HD` + `Lente dupla` + `Alarme sonoro`
  - 🔴 **Falso positivo evitado:** A31H mostra `Full HD` + `Lente dupla` e
    **NENHUMA sirene** (o valor é `"Aplicativo"`) — é o teste central da feature
  - **Tripla:** S8 com `3K Vertical` + `Lente tripla`, sem sirene
  - **Responsivo:** DevTools 360px e ≥768px — sem rolagem horizontal, com a tarja
    mais longa ("Melhor para área externa") e a resolução mais longa
  - Purpose: provar as regras contra dados reais antes de seguir
  - _Requirements: 1.1, 1.6, 1.7, 2.1, 3.1, 3.2, 4.1, 4.2, 5.2, 6.4_

---

### BLOCO 3 — Salvaguarda de dados (Req 7)

- [ ] 3.1 Criar `scripts/verificar-destaques.mjs`
  - File: `scripts/verificar-destaques.mjs` (novo)
  - Consultar a **coleção `cameras` com `sortKey: MANUAL`** — não `products`
    global: tem de olhar exatamente o conjunto que o catálogo exibe
  - Pedir os 4 metafields por `identifiers`, paginando até o fim
  - **Saída:** por câmera os 4 valores; por chave preenchidas/total **e os
    valores DISTINTOS** (Req 7.3 — é o que revela mudança de redação no admin);
    e quantas câmeras disparam cada gatilho
  - **Falhar (exit 1) em 4 casos, NESTA ORDEM:**
    0. 🔴 **`collection` nula ou sem produtos** — checado **primeiro e separado**:
       sem isso, zero câmeras faria as 4 chaves virem `0/0` e o script culparia a
       *grafia da chave*, apontando para o lugar errado. Mensagem própria:
       coleção não publicada no canal Storefront ou handle trocado
    1. alguma das 4 chaves com **0** preenchidas → provável grafia da chave
    2. **0** câmeras disparando o gatilho de lentes
    3. **0** câmeras disparando o gatilho de alarme
  - A mensagem dos casos 2/3 declara a premissa (hoje 5/7 lentes, 2/7 alarme) e
    diz o que fazer se ela cair de verdade: **remover o destaque, não silenciar**
  - 🔴 **`process.exitCode`, NUNCA `process.exit()`** — o script faz `fetch`, e
    `process.exit()` derruba o processo com handles libuv abertos: no Windows
    vira exit **127** tanto no sucesso quanto na falha (aconteceu de verdade em
    `verificar-variantes.mjs`)
  - **Duplicação declarada** no cabeçalho: roda em Node puro, fora do Next — não
    pode importar `destaques.ts` (é TypeScript). As 2 regras são reescritas aqui;
    apontar `lib/shopify/destaques.ts` como fonte da verdade e avisar que uma
    mudança lá exige mudança aqui
  - Mensagem de erro **nunca** interpola o token
  - Purpose: fazer a premissa cair com barulho no terminal, não em silêncio na UI
  - _Leverage: scripts/verificar-especificacoes.mjs (molde completo), lib/shopify/destaques.ts (as regras)_
  - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5_

- [ ] 3.2 Registrar o script em `package.json` e rodá-lo
  - File: `package.json` (modificar)
  - Adicionar em `"scripts"`, no padrão exato dos 6 irmãos:
    `"verificar:destaques": "node --env-file=.env.local scripts/verificar-destaques.mjs"`
  - 🔴 **Não** acoplar ao `npm run build` — o build tem de passar sem
    `.env.local` (`tech.md` → DoD 3)
  - **Nenhuma dependência nova** (`lucide-react` 1.24.0 já tem os 3 ícones)
  - Rodar `npm run verificar:destaques` → deve sair **0**, listando 4/4 chaves
    preenchidas 7/7, os valores distintos, e 5 câmeras com lente múltipla + 2 com
    alarme sonoro
  - Purpose: sem esta entrada o Req 7.5 fica sem dono — o `.mjs` existiria mas
    ninguém o rodaria com o env carregado
  - _Leverage: package.json (scripts verificar:*)_
  - _Requirements: 7.5, 7.6_

---

### BLOCO 4 — Auditoria (DoD do `tech.md`)

- [ ] 4.1 Auditar SEO: tarja e destaques no HTML do servidor
  - File: nenhum (verificação)
  - 🔴 **`rm -rf .next` ANTES de auditar o HTML de um build.** Descoberto ao vivo
    no Bloco 2: `npm run build` sobre um `.next` morno **reaproveitou o prerender
    ISR antigo de `/catalogo`** — o HTML servido saiu com o `CameraBloco` de
    ANTES da feature (sem `catalogo-bloco__topo`, que é um `div` incondicional),
    mesmo com os chunks novos já compilados e o `tsc` limpo. O build não avisa: a
    saída mostra `○ /catalogo` normalmente. Auditar SEO nesse HTML daria **falso
    negativo** ("a feature não renderiza") ou, pior, um falso positivo futuro
  - Com `npm run dev`, fazer `view-source:` ou `curl` em `/catalogo`
  - Confirmar que o **texto da tarja** e os **valores de destaque** aparecem no
    HTML inicial — não só depois da hidratação
  - Confirmar que os **SVGs dos ícones** saem renderizados no HTML
  - Contexto: `CameraBloco` está no bundle do cliente (arrastado pelo
    `"use client"` do `CatalogoConsultivo`), mas client components **são SSR'd** —
    é isso que se está confirmando, não assumindo
  - Purpose: o SEO é a razão de a decisão ser server-side; provar, não supor
  - _Requirements: 5.6_

- [ ] 4.2 Auditar não-regressão: 9 arquivos tocados, 10 intactos
  - File: nenhum (verificação)
  - 🔴 Usar **`git status --short`**, NÃO `git diff --stat`: 3 dos 9 arquivos são
    **novos** (`destaques.ts`, `DestaquesCamera.tsx`, `verificar-destaques.mjs`)
    e ficam untracked — `git diff --stat` **não os mostra**, e a auditoria
    concluiria que faltou implementar um terço da feature. Falso negativo
  - Devem aparecer **exatamente estes 9**, e nenhum outro:
    `lib/shopify/destaques.ts` (novo), `lib/shopify/types.ts`,
    `lib/shopify/normalize.ts`, `lib/shopify/queries.ts`,
    `components/loja/DestaquesCamera.tsx` (novo),
    `components/loja/CameraBloco.tsx`, `app/globals.css`,
    `scripts/verificar-destaques.mjs` (novo), `package.json`
  - Confirmar **intactos** (10): `app/catalogo/page.tsx`, `CatalogoConsultivo.tsx`,
    `ordenarCatalogo.ts`, `products.ts`, `client.ts`, `specs.ts`,
    `fichaTecnicaIcones.ts`, `FichaTecnica.tsx`, `acessorios.ts`, `recomendados.ts`
  - **No navegador:** trocar entre os 5 filtros — as 7 câmeras continuam
    visíveis (o filtro reordena, nunca esconde) e tarja/destaques **acompanham o
    produto certo**, não a posição
  - **Ficha técnica:** abrir `/produtos/camera-seguranca-a38` — as 21 specs
    intactas, com resolução e alarme nos cards principais
  - **Acessórios e recomendados:** inalterados (recebem os campos novos `null`/
    `false` e os ignoram)
  - Purpose: o Req 6 inteiro, verificado e não presumido
  - _Requirements: 6.3, 6.5, 6.6, 6.7, 6.8_

- [ ] 4.3 Fechar o DoD: build, regime de rotas e auditoria de token/bundle
  - File: nenhum (verificação)
  - `npx tsc --noEmit` **limpo**
  - `npm run build` **passa sem erro** — 🔴 precedido de `rm -rf .next`, pelo
    motivo documentado na 4.1 (prerender ISR morno é reaproveitado em silêncio)
  - Na saída do build: `/` e `/sobre-nos` seguem **`○ (Static)`**; `/catalogo` e
    `/produtos/[handle]` seguem com **ISR** — regressão aqui é silenciosa
  - `npm run build` **sem `.env.local`** continua passando (renomear o arquivo
    temporariamente e restaurar)
  - **Token:** buscar o token e o domínio em `.next/static` → **0 ocorrências**
  - **Bundle:** confirmar na saída do build que o First Load JS de `/catalogo`
    não teve salto desproporcional — o esperado é ~o custo de 1 ícone novo
    (`Video` e `Siren` já estavam no grafo via `fichaTecnicaIcones.ts`)
  - Purpose: os 5 itens do "Definition of Done" de `tech.md`, mais a auditoria
    de bundle que a NFR de performance prometeu
  - _Requirements: 6.5, 6.8_
