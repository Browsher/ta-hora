# Documentos legais — pendências e roteiro de correção na Shopify

**Fonte destes documentos:** o texto publicado na Shopify (admin > Configurações > Políticas).
O site mantém **paridade verbatim** com a Shopify. Quando os dois divergem, a Shopify é a fonte:
corrija lá primeiro, depois transponha para o JSON.

> ✅ **Paridade restaurada em 31/07/2026, em duas rodadas.** Os Termos de Uso e a Política de
> Privacidade corrigidos foram colados na Shopify a partir de `docs/legal/termos-shopify.html` e
> `docs/legal/politica-shopify.html`. A segunda rodada corrigiu o placeholder de link da Política,
> que era o único defeito remanescente e estava nos dois lados. **Site e Shopify dizem a mesma
> coisa**, e a Shopify volta a ser a fonte — a inversão temporária está encerrada.
>
> **Trocas e Devoluções não entrou em nenhuma das rodadas** — não foi exportado nem colado.
>
> Lição da primeira rodada: o export é o texto do **site**, então defeito que existe no site vai
> junto. Antes de exportar, zerar as pendências do lado do site.

Este arquivo saiu de dentro dos JSONs (`content._pendenciasDeTexto`, `content._nota`,
`content._pendenciaJuridica`) em 31/07/2026, porque `PreviewContent` é um componente client e
recebe o layout inteiro como prop — **qualquer** chave do JSON, em qualquer nível, era serializada
no payload RSC e ficava legível no código-fonte da página. Anotação interna em documento legal
público não pode vazar. O filtro é `lib/semNotasInternas.ts`, aplicado nas 6 páginas que passam
layout ao `PreviewContent` e no `StoreShell`.

**Arquivos:** `layouts/termos-de-uso.json` · `layouts/politica-de-privacidade.json` ·
`layouts/trocas-e-devolucoes.json`

---

## 🔧 Como regenerar os exports

**O export é MANUAL e fica FORA do `package.json`, de propósito.** Os `npm run verificar:*` são
todos de catálogo (Shopify, produtos, tags) — nada de legal. Um `npm run` para isto convidaria a
rodar sem pensar, e o passo que importa não é gerar: é **colar na Shopify**. Gerar sem colar é
justamente o que quebra a paridade.

**O gerador está em `docs/legal/exportar-legal.mjs`** — escrito em 10/08/2026, ao acrescentar o
parágrafo do cookie do GA4. Antes disso não existia: os arquivos de 31/07/2026 saíram de um script
descartável, que foi perdido, e o formato teve que ser deduzido de novo a partir dos próprios
arquivos. **É essa redescoberta que este bloco existe para evitar.**

```bash
node docs/legal/exportar-legal.mjs layouts/politica-de-privacidade.json docs/legal/politica-shopify
node docs/legal/exportar-legal.mjs layouts/termos-de-uso.json           docs/legal/termos-shopify
```

Ele lê **só** a seção `TextoLegal` do layout (ignora Navbar e Footer) e escreve `.html` + `.md`.

### 🔴 Valide ANTES de mudar o JSON — o passo que não pode ser pulado

Rode o gerador com o JSON **intocado** e confira que a saída é **byte a byte idêntica** ao arquivo
que já está no repositório (`diff`, sem `-w`, sem `-b`). Se divergir, o gerador está errado e vai
introduzir alterações silenciosas em todo o documento junto com a mudança que você queria.

**Valide nos DOIS documentos, não só no que você está editando.** Em 10/08/2026 o gerador passou
byte a byte na política e **falhou nos termos** — porque `politica-de-privacidade.json` tem um único
link, externo, e não exercita as duas regras de link interno abaixo. Validar só o arquivo em edição
teria dado falso verde.

Depois de editar, o `git diff` dos exports tem que ser **puramente aditivo**. Qualquer linha
modificada fora do trecho novo é erro do gerador, não do texto.

### Regras do formato (deduzidas dos arquivos de 31/07/2026, validadas 4/4 byte a byte)

| Origem no JSON | HTML | MD |
|---|---|---|
| `titulo` | `<h1>` | linha solta |
| `atualizadoEm` | `<p>` | linha solta |
| `introducao` | `<p>` (omitido se vazio) | idem |
| `bloco.titulo` | `<h2>` | linha solta |
| `bloco.paragrafos[]` | `<p>` | parágrafo |
| `bloco.lista[]` | `<ul>` + `  <li>` (2 espaços) | `— item` |
| `contatoTitulo` / `contatoTexto` | `<h2>` / `<p>` | linhas soltas |

- Blocos separados por linha em branco no MD; **um `\n` final** nos dois arquivos.
- Chaves com prefixo `_` (`_naoPublicarAssim`, `_pendenciaJuridica`, `_ecoadoNaPDP`) **nunca saem** —
  são anotações internas. É a mesma regra do `lib/semNotasInternas.ts` do lado do site.
- **Subtítulo não é `titulo`.** "Cookie de indicação de afiliados" e "Cookies de medição de audiência
  (Google Analytics)" são **parágrafos comuns** dentro do bloco de cookies, e saem como `<p>`, não
  `<h3>`. Foi assim em 31/07/2026 e mudar isso alteraria o documento publicado.
- Link `[rótulo](url)`:
  - HTML → `<a href="url">rótulo</a>`, **sem** `target`/`rel` (o export não os leva; quem os aplica é
    o `TextoLegal`, no site).
  - MD → externo vira `rótulo (url)`; **interno perde a URL** e fica só o rótulo (um
    `/policies/...` solto em texto corrido não serve para nada).
  - **Caminho interno é reescrito para a rota de política da Shopify** (`ROTAS_SHOPIFY` no script):
    `/politica-de-privacidade` → `/policies/privacy-policy`, `/termos-de-uso` →
    `/policies/terms-of-service`, `/trocas-e-devolucoes` → `/policies/refund-policy`. O export é para
    colar **na Shopify**, onde `/trocas-e-devolucoes` não existe. Caminho interno sem equivalente faz
    o script **falhar de propósito**, em vez de publicar link quebrado.

### Onde colar

**Shopify admin → Configurações → Políticas**, no **modo código-fonte** do editor (o botão `<>`),
com o conteúdo de `docs/legal/politica-shopify.html` ou `termos-shopify.html`. O `.md` não é para
colar: é para ler, revisar e mandar ao advogado.

**Exports para colar na Shopify:** `docs/legal/{termos,politica}-shopify.html` (modo código-fonte
do editor — preserva títulos e listas) · `docs/legal/{termos,politica}-shopify.md` (texto corrido).
Regenerar sempre que o JSON mudar — ver **"🔧 Como regenerar os exports"**, abaixo.

---

## 🚫 Bloqueios de publicação

| Documento | Bloqueio |
|---|---|
| **Termos de Uso** | — nenhum. Texto limpo e em paridade com a Shopify desde 31/07/2026. |
| **Política de Privacidade** | ⚖️ Pendência jurídica em aberto (base legal dos cookies `tahora_ref` **e** `_ga`) — ver seção própria. **Não é questão de paridade:** existe igual nos dois lados.<br>🍪 **+ pendência de texto desde 10/08/2026:** o cookie do GA4 não está descrito. Texto pronto na seção própria, **não aplicado**. |
| **Trocas e Devoluções** | Rascunho de trabalho, **não revisado por advogado**. Dados fornecidos pelo lojista em 30/07/2026. |

---

## Termos de Uso

**Em paridade com a Shopify desde 31/07/2026.**
**Não presentes no site nem na Shopify (removidos na colagem):** o bloco "Aviso de isenção geral
sobre políticas" do topo e a linha `[NOTA PARA O LOJISTA: ...]` da Seção 9 — eram instruções da
Shopify **ao lojista**, não ao cliente, e nunca foram transpostos para o site. A colagem substituiu
o texto inteiro, então saíram da Shopify também.

### Pendências

Nenhuma em aberto.

### ✅ Resolvido

#### Resolvidos pela colagem de 31/07/2026

Estes defeitos existiam **só na Shopify** — o site já estava correto. Colar a versão do site
zerou todos de uma vez.

- [x] **ENDEREÇO** — "Rua André de Leão, 78 - Mooca" (bairro errado) → `Rua André de Leão, 78, Brás, São Paulo/SP, CEP 03101-010`.
- [x] **CNPJ** — `463404610001-04` sem formatação → `46.340.461/0001-04`.
- [x] **NUMERAÇÃO** — "SEÇÃO2.5" → "SEÇÃO 25".
- [x] **`[lojista]`** — 10 ocorrências sem substituição (Seções 6, 9, 16 e 17) → "Ta Hora".
- [x] **SEÇÃO 16 — tradução quebrada** — colchete não fechado em `[LOJISTA,`; "NO ESTADO AS SE ENCONTRAM" → "EM QUE"; "AND" em inglês duas vezes → "E".
- [x] **SEÇÃO 21** — "TAREFA" (tradução errada de *Assignment*) → "CESSÃO".
- [x] **ESPAÇAMENTO** — "esta lojae site", "endereço de faturamentoe/ou", "nosServiços", "ouautorização , exclusãode robôs", "do [lojista]são marcas".
- [x] **BLOCOS NÃO PUBLICADOS NO SITE** — o aviso de isenção do topo e a linha `[NOTA PARA O LOJISTA: ...]` saíram da Shopify junto com a substituição do texto.

#### Seis defeitos de tradução — corrigidos no site em 31/07/2026, já colados

Aplicados a `layouts/termos-de-uso.json` por decisão do lojista e propagados à Shopify na mesma
rodada.

- [x] **SEÇÃO 3 — mistradução de *entitled*** — "Suas compras são entidades a serem devolvidas ou trocadas exclusivamente de acordo com…" → **"Você tem direito a devolver ou trocar suas compras exclusivamente de acordo com…"**
- [x] **SEÇÃO 3 — rótulo do link** — "política de reembolso" → **"política de trocas e devoluções"**, casando com o nome real da página. No site aponta para `/trocas-e-devolucoes`; no export para a Shopify, para `/policies/refund-policy`.
- [x] **SEÇÃO 8 — palavra duplicada** — "Reclamações, reclamações, preocupações ou dúvidas…" → **"Reclamações, preocupações ou dúvidas…"**
- [x] **SEÇÃO 15 — mistradução de *disclaimer of warranties*** — na lista de cláusulas que sobrevivem ao encerramento, "aviso de autorizado de Garantias" → **"isenção de garantias"**. ⚠️ Passa a nomear corretamente a Seção 16 ("AVISO DE ISENÇÃO DE GARANTIAS"), que antes ficava sem referente — **a única das seis com efeito jurídico real**. Sinalizar na revisão do advogado.
- [x] **SEÇÃO 16 — concordância** — "EXCETO AS EXPRESSAMENTE DECLARADO PELO TA HORA," → **"EXCETO QUANDO EXPRESSAMENTE DECLARADO PELA TA HORA,"**. Nota: o resto do documento usa "o Ta Hora" (masculino); esta cláusula ficou "PELA TA HORA". Uniformizar o gênero da marca no documento inteiro é uma varredura à parte, ainda não feita.
- [x] **SEÇÃO 20 — aspa órfã** — removida do fim do primeiro parágrafo.

#### Anteriores

- [x] **`[LINK]`** *(31/07/2026)* — as 4 ocorrências (Visão Geral, Seção 3, Seção 10 duas vezes) viraram links clicáveis na sintaxe `[rótulo](/caminho)`, suportada pelo `TextoLegal`.
- [x] **SEÇÃO 6 — jurisdição** *(30/07/2026, decisão do lojista; redação aprovada em 31/07/2026)* — "protegidos por patentes dos EUA e estrangeiras" (jurisdição errada para loja brasileira) virou:
  > "…protegidos por direitos autorais, marcas registradas, patentes e demais leis de propriedade intelectual aplicáveis."

  Formulação **genérica**, sem citar lei nem artigo: citar dispositivo específico num documento ainda não revisado por advogado é pior que a formulação ampla.

---

## Política de Privacidade

**Em paridade com a Shopify desde 31/07/2026** (confirmada após a segunda colagem).
A seção "Cookies e tecnologias similares" nasceu no site (cobre o cookie de afiliado `tahora_ref`)
e foi para a Shopify na colagem.

### ⚖️ Pendência jurídica — decidir antes de publicar

**Não é questão de paridade — o problema existe igual nos dois lados.**

O parágrafo do cookie `tahora_ref` adota **legítimo interesse** (LGPD art. 7º, IX) como base legal.
Um parecer mais conservador pode exigir **consentimento** — o que exigiria banner/central de
preferências de cookies, hoje **inexistente** no site.

> 📈 **Escopo AUMENTOU em 10/08/2026:** o cookie `_ga` do Google Analytics adota a **mesma** base
> legal, então são agora **dois** tratamentos sob o mesmo parecer, não um. Se o advogado exigir
> consentimento, exige para os dois — e a resposta é o mesmo banner. **Levar as duas questões
> juntas.** Ver "🍪 Cookie analítico do Google Analytics 4", abaixo.

Verificar também se o texto da Shopify já trata dos cookies de checkout, para não duplicar.

### Pendências

- [ ] **COOKIE ANALÍTICO (GA4) — já no site e nos exports; FALTA COLAR NA SHOPIFY.** ⚠️ **A paridade está quebrada neste momento.** Ver a seção própria, a seguir.

---

### 🍪 Cookie analítico do Google Analytics 4 — FALTA COLAR NA SHOPIFY

**Aberto em 10/08/2026**, junto com a implementação do GA4 (`components/analytics/`,
`lib/analytics/`).

> ### ⚠️ ESTADO ATUAL: PARIDADE QUEBRADA — um lado só foi atualizado
>
> | Onde | Estado |
> |---|---|
> | `layouts/politica-de-privacidade.json` (site) | ✅ parágrafo inserido em 10/08/2026 |
> | `docs/legal/politica-shopify.{html,md}` | ✅ regenerados, diff puramente aditivo |
> | **Shopify admin → Políticas → Política de privacidade** | ❌ **NÃO COLADO** |
>
> **Ação pendente:** colar `docs/legal/politica-shopify.html` na Shopify, modo código-fonte. Só isso
> fecha o item. Enquanto não for feito, site e Shopify dizem coisas diferentes — a mesma situação que
> a rodada de 31/07/2026 existiu para encerrar.
>
> **Não é bloqueio de deploy do GA4:** o parágrafo já está no site, que é onde o cookie é gravado.
> Mas é bloqueio para considerar a política em ordem.

#### Por que isto é obrigatório, e por que NÃO é o mesmo problema do `tahora_ref`

A política publicada descreve **exatamente dois** conjuntos de cookies: os da Shopify (loja,
carrinho, checkout) e o `tahora_ref` de afiliados. O GA4 acrescenta um terceiro (`_ga` e
`_ga_<ID>`), e um cookie não descrito é falha de **transparência** — a LGPD exige informar o
tratamento (art. 9º), e legítimo interesse não dispensa isso; exige o contrário.

**A política não passa a MENTIR — passa a ficar INCOMPLETA.** A distinção importa porque afasta o
risco maior: o parágrafo do `tahora_ref` afirma que aquele cookie "não é utilizado para publicidade,
perfilamento ou acompanhamento da sua atividade em outros sites". Isso continua verdadeiro, e
continua verdadeiro para o GA4 desta fase — **porque o Meta Pixel ficou de fora e o Google Signals
está desligado na propriedade**.

> 🔴 **GATILHO PARA REESCREVER, e não é este parágrafo:** no dia em que o Meta Pixel, o remarketing
> do Google Ads ou o Google Signals entrarem, o site passa a fazer publicidade comportamental e
> **a frase do `tahora_ref` acima vira declaração falsa publicada, com data no git**. Aí não basta
> acrescentar um parágrafo: é reescrever a seção, nomear o compartilhamento com a Meta, e a base
> legal passa a ser **consentimento** — o que exige o banner que hoje não existe. Ver o bloqueio
> jurídico acima, que trata da mesma questão pelo lado do `tahora_ref`.

#### Base legal adotada

**Legítimo interesse (LGPD art. 7º, IX)** — a mesma escolha do `tahora_ref`, e ela cai sob o **mesmo
bloqueio jurídico** registrado acima. Sustenta-se aqui porque a medição desta fase é agregada, sem
publicidade e sem identificação: sem Google Signals, sem remarketing, e com os três sinais `ad_*` do
Consent Mode em `denied` no código (`components/analytics/Analytics.tsx`).

Se o parecer do advogado exigir consentimento para o `tahora_ref`, **exige para este também** — e a
resposta para os dois é o mesmo banner. Levar as duas questões juntas na revisão.

#### Texto aplicado

Está **dentro** da seção "Cookies e tecnologias similares", **depois** do bloco "Cookie de
indicação de afiliados" (que termina em "…afeta apenas a atribuição da comissão ao afiliado.") e
**antes** de "Relacionamento com a Shopify" — como 7 entradas no array `paragrafos` do bloco de
cookies. A estrutura espelha a do bloco de afiliados de propósito: o que é, o que guarda,
finalidade, compartilhamento, base legal, como recusar.

Reproduzido aqui para revisão do advogado (a fonte é o JSON):

> **Cookies de medição de audiência (Google Analytics)**
>
> Utilizamos o Google Analytics 4, serviço de medição de audiência fornecido pelo Google, para
> entender como nosso site é utilizado. Para isso são gravados em seu navegador cookies próprios
> chamados "_ga" e "_ga_" seguido de um identificador, com validade de até 2 anos.
>
> Esses cookies armazenam um identificador aleatório atribuído ao seu navegador, sem qualquer
> relação com sua identidade. Registramos as páginas visitadas, a origem da visita, o produto
> visualizado e as interações com o carrinho de compras. Não armazenamos seu nome, e-mail, CPF ou
> endereço nesses cookies, e não utilizamos esse serviço para publicidade, remarketing ou
> acompanhamento da sua atividade em outros sites — os recursos de publicidade e de identificação
> entre dispositivos do Google Analytics estão desativados em nossa configuração.
>
> Finalidade: medir de forma agregada o desempenho das páginas e do processo de compra, para
> corrigir problemas de navegação e melhorar a loja. As informações são analisadas em conjunto, na
> forma de estatísticas, e não individualmente.
>
> Compartilhamento e transferência internacional: os dados são processados pelo Google LLC e por
> suas afiliadas, podendo ser transferidos e armazenados em servidores localizados fora do Brasil.
> A transferência ocorre nos termos do art. 33 da Lei nº 13.709/2018 e das cláusulas contratuais
> firmadas com o fornecedor do serviço.
>
> Base legal (LGPD): legítimo interesse do controlador, nos termos do art. 7º, inciso IX, da Lei nº
> 13.709/2018, para aferir e melhorar a qualidade dos nossos serviços. O tratamento se limita a
> dados de navegação agregados, sem identificação pessoal e sem uso publicitário.
>
> Como recusar ou remover: você pode bloquear ou apagar esses cookies a qualquer momento nas
> configurações do seu navegador, sem qualquer prejuízo à sua navegação, à sua compra ou às
> condições comerciais oferecidas. O Google também disponibiliza um complemento de navegador para
> desativar o Google Analytics, em https://tools.google.com/dlpage/gaoptout.

#### Etapas — 1 e 2 feitas, 3 e 4 pendentes

1. [x] Bloco inserido em `layouts/politica-de-privacidade.json` *(10/08/2026)*.
2. [x] `docs/legal/politica-shopify.{html,md}` regenerados *(10/08/2026)*. Gerador escrito e
       validado nesta rodada — ver **"🔧 Como regenerar os exports"** no topo deste arquivo.
       `git diff` dos exports: puramente aditivo, 7 linhas no HTML e 14 no MD, nada mais tocado.
3. [ ] **Colar na Shopify:** admin → Configurações → Políticas → Política de privacidade, **modo
       código-fonte**, com o conteúdo de `docs/legal/politica-shopify.html`.
4. [ ] Conferir se o texto padrão da Shopify já não fala de analytics em outro ponto, para não
       duplicar — mesma verificação já anotada no bloqueio jurídico acima.

### ✅ Resolvido

#### Placeholder de link — corrigido no site e recolado em 31/07/2026

Este foi o único defeito que estava **no site** e viajou para a Shopify na primeira colagem, porque
o export é o texto do site. Resolvido numa segunda rodada (corrigir no JSON → reexportar → recolar).

- [x] **PLACEHOLDER DE LINK** — a seção "Relacionamento com a Shopify" terminava com o texto não resolvido "…em relação às suas informações pessoais **aqui Link para a Política de privacidade da Shopify**." O `[Link para…]` era a instrução da Shopify ao lojista sobre o que linkar, e "aqui" era a âncora. Redação final:
  > "…você pode exercer determinados direitos em relação às suas informações pessoais na **[Política de privacidade da Shopify](https://privacy.shopify.com/en)**."

  O rótulo é descritivo por decisão do lojista: "aqui" não se explica fora de contexto para leitor de tela, e em documento legal o link precisa se sustentar sozinho. No site renderiza com `target="_blank" rel="noopener noreferrer"`; no `.md` a URL aparece entre parênteses, para o texto corrido não perder o endereço.
- [x] **ESPAÇO SOLTO** — "…a Política de privacidade do consumidor da Shopify **.**" → "…da Shopify."

#### Resolvidos pela colagem de 31/07/2026

#### Resolvidos pela colagem de 31/07/2026

Existiam **só na Shopify** — o site já estava correto.

- [x] **ENDEREÇO** — "Rua Major Basílio, 266, São Paulo SP, 03181-010, Brasil" (rua e bairro errados) → `Rua André de Leão, 78, Brás, São Paulo/SP, CEP 03101-010`.
- [x] **TELEFONE** — a seção "Contato" dizia "entre em contato conosco pelo telefone" sem informar número → `+55 11 98418-8541`.
- [x] **TIPOGRAFIA** — "ATa Hora é desenvolvida" (sem espaço) → "A Ta Hora".
- [x] **COOKIES** — a seção "Cookies e tecnologias similares", que só existia no site, passou a existir também na Shopify.

---

## Trocas e Devoluções

**Rascunho de trabalho — não revisado por advogado.** Dados fornecidos pelo lojista em 30/07/2026.
Não foi exportado nem colado na rodada de 31/07/2026.

> 📈 **Prioridade AUMENTOU em 10/08/2026 — o volume de tráfego para esta página subiu.**
> O bloco de confiança da página de produto (`components/loja/SelosConfianca.tsx`) passou a
> afirmar "7 dias para devolver, frete por nossa conta" **com link para cá**, nas 7 PDPs — que são
> as páginas que vendem. Antes, o único caminho para este documento era o rodapé.
>
> A exposição não mudou de natureza (a página já era linkada do rodapé das 9 rotas), mas mudou de
> volume, e agora ela é lida por quem está com o dedo no botão de comprar. **Ao levar a revisão
> jurídica ao advogado, este documento subiu de prioridade em relação aos outros dois.**
>
> Os números ecoados na PDP (3 meses / 7 dias / frete de devolução) estão anotados no
> `_ecoadoNaPDP` de `layouts/trocas-e-devolucoes.json` — se a revisão mudar qualquer um deles, o
> componente muda junto.

- [ ] Revisão jurídica do documento inteiro antes de publicar.
