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

**Exports para colar na Shopify:** `docs/legal/{termos,politica}-shopify.html` (modo código-fonte
do editor — preserva títulos e listas) · `docs/legal/{termos,politica}-shopify.md` (texto corrido).
Regenerar sempre que o JSON mudar, com o script de exportação.

---

## 🚫 Bloqueios de publicação

| Documento | Bloqueio |
|---|---|
| **Termos de Uso** | — nenhum. Texto limpo e em paridade com a Shopify desde 31/07/2026. |
| **Política de Privacidade** | ⚖️ Pendência jurídica em aberto (base legal do cookie `tahora_ref`) — ver seção própria. **Não é questão de paridade:** existe igual nos dois lados. |
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

Verificar também se o texto da Shopify já trata dos cookies de checkout, para não duplicar.

### Pendências

Nenhuma pendência de texto em aberto. Resta apenas o bloqueio jurídico acima.

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
